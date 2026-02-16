/**
 * Request in-app review (Play Store / App Store).
 * On native: shows the system star rating dialog. If it doesn't show and openPlayStoreIfDialogFails
 * is true (e.g. user tapped "Rate us"), opens Play Store; otherwise does nothing.
 * On web: opens the Play Store page in a new tab.
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
  /** If true and the in-app dialog doesn't show on native, open Play Store. Use for "Rate us" button. Default false (e.g. auto prompt). */
  openPlayStoreIfDialogFails?: boolean;
};

export async function requestAppReview(options?: RequestAppReviewOptions): Promise<void> {
  const isNative = Capacitor.isNativePlatform();
  const openPlayStoreIfDialogFails = options?.openPlayStoreIfDialogFails ?? false;

  if (!isNative) {
    window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    return;
  }

  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
  } catch (_) {
    if (openPlayStoreIfDialogFails) {
      try {
        toast.info("Opening Play Store…");
        await openPlayStoreOnNative();
      } catch (error) {
        console.error("Failed to open Play Store:", error);
        toast.error("Could not open Play Store. Please try again.");
      }
    }
  }
}
