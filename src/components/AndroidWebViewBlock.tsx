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
  <svg viewBox="0 0 512 512" className="w-6 h-6" fill="currentColor">
    <path d="M48 59.49v393a17 17 0 0027.78 13.14L283 256 75.78 46.35A17 17 0 0048 59.49z" fill="#2196F3"/>
    <path d="M283 256l65.14-65.14L89.33 30.82a17 17 0 00-13.55-.68z" fill="#4CAF50"/>
    <path d="M415 236.17l-66.86-38.83L283 256l65.14 65.14 66.86-38.86a17 17 0 000-46.11z" fill="#FFC107"/>
    <path d="M75.78 465.65A17 17 0 0089.33 481.18l258.81-160.04L283 256z" fill="#F44336"/>
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
        className="w-[calc(100%-2rem)] max-w-sm p-0 rounded-3xl border-0 shadow-2xl overflow-hidden" 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 px-6 pt-8 pb-12 text-white relative">
          <button 
            onClick={handleContinueWebsite}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center">
              <img src="/logo.png" alt="App" className="w-12 h-12 rounded-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Attendance IO</h2>
              <p className="text-white/80 text-sm">Get the App Experience</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 -mt-6 relative z-10">
          <div className="bg-background rounded-2xl shadow-lg border p-4 space-y-3">
            <FeatureItem icon={Zap} text="Faster & smoother experience" color="text-amber-500" />
            <FeatureItem icon={Bell} text="Push notifications for updates" color="text-blue-500" />
            <FeatureItem icon={Shield} text="Works offline anytime" color="text-emerald-500" />
          </div>
        </div>

        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle>Download App</AlertDialogTitle>
          <AlertDialogDescription>Get the app for better experience</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-3 p-6 pt-4">
          <AlertDialogAction
            onClick={handleOpenPlayStore}
            className="w-full py-6 text-base font-semibold rounded-xl bg-black hover:bg-black/90 text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
          >
            <PlayStoreLogo />
            <span>Get it on Google Play</span>
          </AlertDialogAction>
          
          <Button
            variant="ghost"
            onClick={handleContinueWebsite}
            className="w-full text-muted-foreground hover:text-foreground"
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
      <div className={`p-2 rounded-lg bg-muted ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
