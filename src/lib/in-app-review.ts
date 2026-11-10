/**
 * Request in-app review (Play Store / App Store).
 * With openPlayStoreOnly (e.g. "Rate us" button): opens Play Store directly, no in-app popup.
 * Without options (e.g. auto prompt): on native shows in-app review only; if it doesn't show, does nothing. On web opens Play Store.
 *
 * Testing the in-app review dialog on Android:
 * - The dialog is controlled by Google and may not show in debug builds or if shown recently.
 * - Install the app from an Internal testing track (Play Console) for best chance to see it.
 * - Or clear Play Store app data and retry; use a device that hasn’t been prompted lately.
 * - If the dialog doesn’t appear, the fallback opens the Play Store so you can still leave a review.
 */

import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

const PLAY_STORE_APP_ID = "com.attendanceio.app";
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_APP_ID}`;

/** Opens the Play Store app on Android / App Store on iOS. Falls back to browser if needed. */
async function openPlayStoreOnNative(): Promise<void> {
  try {
    const { NativeMarket } = await import("@capacitor-community/native-market");
    await NativeMarket.openStoreListing({ appId: PLAY_STORE_APP_ID });
  } catch {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: PLAY_STORE_URL });
    } catch {
      window.open(PLAY_STORE_URL, "_blank");
    }
  }
}

export type RequestAppReviewOptions = {
  /** If true, skip in-app review and open Play Store directly. Use for "Rate us" button. */
  openPlayStoreOnly?: boolean;
};

export async function requestAppReview(options?: RequestAppReviewOptions): Promise<void> {
  const isNative = Capacitor.isNativePlatform();
  const openPlayStoreOnly = options?.openPlayStoreOnly ?? false;

  // "Rate us" button: go straight to Play Store (no in-app popup)
  if (openPlayStoreOnly) {
    if (isNative) {
      try {
        await openPlayStoreOnNative();
      } catch (error) {
        console.error("Failed to open Play Store:", error);
        toast.error("Could not open Play Store. Please try again.");
      }
    } else {
      window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    }
    return;
  }

  // Auto prompt: in-app review only; if it doesn't show, do nothing
  if (!isNative) {
    window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    return;
  }

  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
  } catch (_) {
    // Do not open Play Store for auto prompt
  }
}

const REVIEW_KEY = "attendance_io_review_prompt_v1";
/** Ask only once the student has used the app a few days and marked some classes. */
const MIN_DAYS_USED = 3;
const MIN_PRESENT_MARKS = 5;
/** Google rations its sheet on its own; this keeps us from asking more often than that anyway. */
const ASK_AGAIN_AFTER_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

interface ReviewPromptState {
  firstSeen: number;
  presentMarks: number;
  lastAsked?: number;
}

/**
 * Called after the student marks a class present today: a good moment to show Google Play's own
 * rating sheet (the one that slides up from the bottom). Google decides whether it actually
 * appears and nothing tells the app, so this never shows anything of its own.
 */
export async function maybeAskForReview(
  track: (eventType: string, metadata: Record<string, unknown>) => Promise<void>,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  let state: ReviewPromptState;
  try {
    state = JSON.parse(localStorage.getItem(REVIEW_KEY) || "null") ?? { firstSeen: Date.now(), presentMarks: 0 };
    state.presentMarks += 1;
    const now = Date.now();
    const ready =
      state.presentMarks >= MIN_PRESENT_MARKS &&
      now - state.firstSeen >= MIN_DAYS_USED * DAY_MS &&
      (!state.lastAsked || now - state.lastAsked >= ASK_AGAIN_AFTER_DAYS * DAY_MS);
    if (ready) state.lastAsked = now;
    localStorage.setItem(REVIEW_KEY, JSON.stringify(state));
    if (!ready) return;
  } catch {
    return;
  }
  // Let the mark's own feedback land first
  await new Promise((r) => setTimeout(r, 1200));
  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
    void track("in_app_review_requested", { presentMarks: state.presentMarks });
  } catch {
    // not available on this device or build
  }
}
