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
import { Button } from "@/components/ui/button";
import { Zap, Shield, Bell, X } from "lucide-react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.attendanceio.app";

/**
 * Detect if running in Android WebView (not native app)
 */
function isAndroidWebView(): boolean {
  const userAgent = navigator.userAgent || "";
  const isAndroid = /Android/i.test(userAgent);
  
  if (!isAndroid) return false;

  const isNative = Capacitor.isNativePlatform();
  
  if (isAndroid && !isNative) return true;

  return false;
}

/**
 * Open Play Store
 */
async function openPlayStore(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: PLAY_STORE_URL });
    } catch {
      window.open(PLAY_STORE_URL, "_blank");
    }
  } else {
    window.open(PLAY_STORE_URL, "_blank");
  }
}

const PlayStoreLogo = () => (
  <svg viewBox="30 336.7 120.9 129.2" className="w-5 h-5">
    <path fill="#FFD400" d="M119.2 421.2c-8.8 0-15.5-6.8-15.5-15.5v-40.1c0-8.8 6.8-15.5 15.5-15.5h19.8c8.8 0 15.5 6.8 15.5 15.5v40.1c0 8.8-6.8 15.5-15.5 15.5h-19.8z" transform="translate(-89, -336)"/>
    <path fill="#FF3333" d="M99.1 421.3c-8.8 0-15.5-6.8-15.5-15.5v-40.2c0-8.8 6.8-15.5 15.5-15.5h19.8c8.8 0 15.5 6.8 15.5 15.5v40.2c0 8.8-6.8 15.5-15.5 15.5H99.1z" transform="translate(-69, -336)"/>
    <path fill="#00F076" d="M79 465.8c-8.8 0-15.5-6.8-15.5-15.5v-40.2c0-8.8 6.8-15.5 15.5-15.5h19.8c8.8 0 15.5 6.8 15.5 15.5v40.2c0 8.8-6.8 15.5-15.5 15.5H79z" transform="translate(-49, -380)"/>
    <path fill="#00CCFF" d="M59 465.8c-8.8 0-15.5-6.8-15.5-15.5v-40.2c0-8.8 6.8-15.5 15.5-15.5h19.8c8.8 0 15.5 6.8 15.5 15.5v40.2c0 8.8-6.8 15.5-15.5 15.5H59z" transform="translate(-29, -380)"/>
  </svg>
);

const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/>
    <path d="M17.556 8.235l-3.764 3.764 3.764 3.765 4.243-2.432a1 1 0 000-1.734l-4.243-2.363z" fill="#FBBC04"/>
    <path d="M3.609 1.814L13.792 12l3.764-3.765L5.892.49a1.002 1.002 0 00-2.283 1.324z" fill="#34A853"/>
    <path d="M13.792 12L3.61 22.186A1 1 0 005.892 23.51l11.664-7.745L13.792 12z" fill="#EA4335"/>
  </svg>
);

export function AndroidWebViewBlock() {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (isAndroidWebView()) {
      setShowDialog(true);
    }
  }, []);

  const handleOpenPlayStore = async () => {
    await openPlayStore();
  };

  const handleContinueWebsite = () => {
    setShowDialog(false);
  };

  if (!showDialog) return null;

  return (
    <AlertDialog open={showDialog} onOpenChange={() => {}}>
      <AlertDialogContent 
        className="w-[calc(100%-2rem)] max-w-sm p-0 rounded-3xl border border-border/50 shadow-2xl overflow-hidden bg-card" 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-6 relative">
          <button 
            onClick={handleContinueWebsite}
            className="absolute top-4 right-4 p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-background shadow-md border flex items-center justify-center">
              <img src="/logo.png" alt="App" className="w-10 h-10 rounded-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Attendance IO</h2>
              <p className="text-muted-foreground text-sm">Get the App Experience</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 pb-2">
          <div className="space-y-4">
            <FeatureItem icon={Zap} text="Faster & smoother experience" color="bg-amber-500/10 text-amber-500" />
            <FeatureItem icon={Bell} text="Push notifications for updates" color="bg-blue-500/10 text-blue-500" />
          </div>
        </div>

        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle>Download App</AlertDialogTitle>
          <AlertDialogDescription>Get the app for better experience</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 p-6 pt-4">
          <AlertDialogAction
            onClick={handleOpenPlayStore}
            className="w-full h-12 text-sm font-medium rounded-xl bg-foreground hover:bg-foreground/90 text-background shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
          >
            <GooglePlayIcon />
            <span>Get it on Google Play</span>
          </AlertDialogAction>
          
          <Button
            variant="ghost"
            onClick={handleContinueWebsite}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            Continue on website
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FeatureItem({ icon: Icon, text, color }: { icon: React.ElementType; text: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}
