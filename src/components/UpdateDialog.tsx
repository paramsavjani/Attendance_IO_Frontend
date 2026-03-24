import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Capacitor } from "@capacitor/core";
import { GooglePlayIcon } from "@/components/icons/GooglePlayIcon";

// Hard-coded Google Play Store URL
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.attendanceio.app";

interface UpdateDialogProps {
  open: boolean;
  isCritical: boolean;
  title: string;
  message: string;
  onDismiss?: () => void;
}

export function UpdateDialog({
  open,
  isCritical,
  title,
  message,
  onDismiss,
}: UpdateDialogProps) {
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
    <AlertDialog 
      open={open} 
      onOpenChange={(openState) => {
        // Prevent closing if critical update
        if (isCritical && !openState) {
          return;
        }
        if (!openState && onDismiss) {
          onDismiss();
        }
      }}
    >
      <AlertDialogContent 
        className="sm:max-w-[425px] max-w-[95vw]"
        onEscapeKeyDown={(e) => {
          // Prevent escape key from closing critical updates
          if (isCritical) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent outside click from closing critical updates
          if (isCritical) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Prevent any outside interaction from closing critical updates
          if (isCritical) {
            e.preventDefault();
          }
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-muted-foreground pt-2">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          {!isCritical && (
            <AlertDialogCancel
              onClick={onDismiss}
              className="w-full sm:w-auto sm:mr-auto order-2 sm:order-1"
            >
              Later
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleUpdate}
            className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 bg-foreground hover:bg-foreground/90 text-background font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <GooglePlayIcon className="w-5 h-5" />
            <span>Update from Google Play</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
