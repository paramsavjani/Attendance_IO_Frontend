import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.attendanceio.app";

const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/>
    <path d="M17.556 8.235l-3.764 3.764 3.764 3.765 4.243-2.432a1 1 0 000-1.734l-4.243-2.363z" fill="#FBBC04"/>
    <path d="M3.609 1.814L13.792 12l3.764-3.765L5.892.49a1.002 1.002 0 00-2.283 1.324z" fill="#34A853"/>
    <path d="M13.792 12L3.61 22.186A1 1 0 005.892 23.51l11.664-7.745L13.792 12z" fill="#EA4335"/>
  </svg>
);

export default function ErrorOldVersion() {
  const handleUpdate = async () => {
    try {
      // Always try to open Play Store URL
      // For native apps, this will open the Play Store app directly
      // For web, it will open in a new tab
      if (Capacitor.isNativePlatform()) {
        try {
          const { Browser } = await import("@capacitor/browser");
          await Browser.open({ url: PLAY_STORE_URL });
        } catch {
          // Fallback: try to open Play Store app directly
          // Use market:// for Android Play Store app, or fallback to web URL
          const playStoreAppUrl = PLAY_STORE_URL.replace(
            "https://play.google.com/store/apps/details",
            "market://details"
          );
          try {
            const { Browser } = await import("@capacitor/browser");
            await Browser.open({ url: playStoreAppUrl });
          } catch {
            window.open(PLAY_STORE_URL, "_blank");
          }
        }
      } else {
        window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Failed to open Play Store:", error);
      // Final fallback
      window.open(PLAY_STORE_URL, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl shadow-2xl p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Update Required
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Your app version is outdated. Please update to the latest version to continue using Attendance IO.
            </p>
          </div>

          {/* Play Store Button */}
          <Button
            onClick={handleUpdate}
            className="w-full bg-black hover:bg-black/90 text-white h-12 text-base font-medium gap-2"
            size="lg"
          >
            <GooglePlayIcon />
            Update on Play Store
          </Button>

          {/* Additional Info */}
          <p className="text-sm text-muted-foreground">
            The latest version includes new features and important security updates.
          </p>
        </div>
      </div>
    </div>
  );
}
