/**
 * Request in-app review (Play Store / App Store).
 * On native: shows the system star rating dialog and submits from within the app.
 * If the dialog doesn't show (quota/debug) or the API throws, opens Play Store in-app.
 * On web: opens the Play Store page in a new tab.
 *
 * Testing the in-app review dialog on Android:
 * - The dialog is controlled by Google and may not show in debug builds or if shown recently.
 * - Install the app from an Internal testing track (Play Console) for best chance to see it.
 * - Or clear Play Store app data and retry; use a device that hasn’t been prompted lately.
 * - If the dialog doesn’t appear, the fallback opens the Play Store so you can still leave a review.
 */

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

export async function requestAppReview(): Promise<void> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      try {
        const { InAppReview } = await import("@capacitor-community/in-app-review");
        await InAppReview.requestReview();
        // Dialog may or may not show (Google quota). No toast so we don't say "thanks" if nothing was shown.
      } catch (error) {
        console.warn("In-app review not available, opening Play Store:", error);
        toast.info("Opening Play Store so you can leave a review…");
        await openPlayStoreOnNative();
      }
    } else {
      window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    console.error("In-app review failed:", error);
    toast.error("Something went wrong. Opening Play Store…");
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      await openPlayStoreOnNative();
    } else {
      window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    }
  }
}
