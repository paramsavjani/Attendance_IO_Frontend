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
      <AlertDialogContent 
        className="sm:max-w-md mx-4 rounded-2xl border-0 shadow-2xl bg-gradient-to-br from-background via-background to-primary/5" 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AlertDialogHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <AlertDialogTitle className="text-2xl font-bold">
            Download Our App
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base space-y-3 text-center">
            <p className="text-foreground/80">
              The web version has been discontinued. Please download the <strong className="text-primary">Attendance IO</strong> app for the best experience.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <span>✨</span>
              <span>Faster, offline access & push notifications</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-3 mt-4">
          <AlertDialogAction
            onClick={handleOpenPlayStore}
            className="w-full py-6 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300"
          >
            <ExternalLink className="h-5 w-5 mr-2" />
            Get it on Play Store
          </AlertDialogAction>
          <p className="text-xs text-center text-muted-foreground">
            Free download • No ads
          </p>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
