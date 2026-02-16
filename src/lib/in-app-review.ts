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

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.attendanceio.app";

async function openPlayStoreOnNative(): Promise<void> {
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: PLAY_STORE_URL });
  } catch {
    const marketUrl = PLAY_STORE_URL.replace(
      "https://play.google.com/store/apps/details",
      "market://details"
    );
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: marketUrl });
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
