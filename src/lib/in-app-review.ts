/**
 * Request in-app review (Play Store / App Store).
 * On native: shows the system star rating dialog and submits from within the app.
 * On web: opens the Play Store page in a new tab.
 */

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.attendanceio.app";

export async function requestAppReview(): Promise<void> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { InAppReview } = await import("@capacitor-community/in-app-review");
      await InAppReview.requestReview();
    } else {
      window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
    }
  } catch (error) {
    console.error("In-app review failed:", error);
    window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
  }
}
