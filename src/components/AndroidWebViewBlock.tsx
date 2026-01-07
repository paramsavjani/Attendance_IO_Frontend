import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Smartphone, ExternalLink } from "lucide-react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.attendanceio.app";

/**
 * Detect if running in Android WebView (not native app)
 * Returns true if running in Android WebView/browser
 */
function isAndroidWebView(): boolean {
  const userAgent = navigator.userAgent || "";
  const isAndroid = /Android/i.test(userAgent);
  
  if (!isAndroid) {
    return false; // Not Android, allow access
  }

  // Check if it's a native Capacitor app
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  // If it's Android but NOT native Capacitor app, it's a browser/WebView
  // Native app would have isNativePlatform() === true
  if (isAndroid && !isNative) {
    return true; // Android browser/WebView - block it
  }
  
  // Additional check: if platform is detected as android but we're on http/https
  // (not capacitor:// or ionic://), it's likely a browser
  if (platform === "android" && (window.location.protocol === "http:" || window.location.protocol === "https:")) {
    if (!isNative) {
      return true; // Android browser accessing website
    }
  }

  return false; // Native app or not Android - allow access
}

/**
 * Open Play Store
 */
async function openPlayStore(): Promise<void> {
  const url = PLAY_STORE_URL;
  
  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url });
    } catch (error) {
      console.error("Failed to open Play Store:", error);
      window.open(url, "_blank");
    }
  } else {
    window.open(url, "_blank");
  }
}

export function AndroidWebViewBlock() {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Check if running in Android WebView
    if (isAndroidWebView()) {
      setShowDialog(true);
    }
  }, []);

  const handleOpenPlayStore = async () => {
    await openPlayStore();
    // Don't close dialog - user must use the app
  };

  if (!showDialog) {
    return null;
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={() => {}}>
      <AlertDialogContent className="sm:max-w-md" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">
              App Required
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-2">
            <p>
              This website is no longer available. Please use the <strong>Attendance IO</strong> app from the Google Play Store to access all features.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The web version has been discontinued. Download the app for the best experience.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogAction
            onClick={handleOpenPlayStore}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Play Store
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
