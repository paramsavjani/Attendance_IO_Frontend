import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Zap, Bell, Globe } from "lucide-react";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.attendanceio.app";

function isAndroidWebView(): boolean {
  const userAgent = navigator.userAgent || "";
  const isAndroid = /Android/i.test(userAgent);
  
  if (!isAndroid) return false;

  const isNative = Capacitor.isNativePlatform();
  
  if (isAndroid && !isNative) return true;

  return false;
}

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
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (isAndroidWebView()) {
      setShowDialog(true);
      setTimeout(() => setIsAnimated(true), 50);
    }
  }, []);

  const handleOpenPlayStore = async () => {
    await openPlayStore();
  };

  const handleContinueWebsite = () => {
    setIsAnimated(false);
    setTimeout(() => setShowDialog(false), 200);
  };

  if (!showDialog) return null;

  return (
    <AlertDialog open={showDialog} onOpenChange={() => {}}>
      <AlertDialogContent 
        className={`
          w-[calc(100%-2rem)] max-w-[360px] p-0 rounded-3xl border-0 
          shadow-2xl overflow-hidden bg-card
          transition-all duration-300 ease-out
          ${isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* App Info Section */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            {/* App Icon */}
            <div 
              className={`
                w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 
                border border-border/60 flex items-center justify-center shadow-sm
                transition-all duration-500 delay-100
                ${isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
              `}
            >
              <img src="/logo.png" alt="Attendance IO" className="w-12 h-12 object-contain" />
            </div>
            
            {/* App Details */}
            <div className="flex-1 min-w-0 pt-1">
              <h2 
                className={`
                  text-lg font-bold text-foreground leading-tight
                  transition-all duration-500 delay-150
                  ${isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
                `}
              >
                Attendance IO
              </h2>
              <p 
                className={`
                  text-sm text-muted-foreground mt-1
                  transition-all duration-500 delay-200
                  ${isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
                `}
              >
                Track your attendance smarter
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div 
          className={`
            mx-6 p-4 rounded-2xl bg-muted/50 border border-border/40
            transition-all duration-500 delay-250
            ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
          `}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Zap className="w-[18px] h-[18px] text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Faster & Smoother</p>
                <p className="text-xs text-muted-foreground">Native app performance</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Bell className="w-[18px] h-[18px] text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Never miss an update</p>
              </div>
            </div>
          </div>
        </div>

        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle>Download App</AlertDialogTitle>
          <AlertDialogDescription>Get the app for better experience</AlertDialogDescription>
        </AlertDialogHeader>

        {/* Actions */}
        <div className="p-6 pt-5 space-y-3">
          <AlertDialogAction
            onClick={handleOpenPlayStore}
            className={`
              w-full h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-background 
              font-semibold text-[15px] shadow-lg hover:shadow-xl
              transition-all duration-300 delay-300 hover:scale-[1.02] active:scale-[0.98]
              flex items-center justify-center gap-3
              ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            <GooglePlayIcon />
            <span>Get it on Google Play</span>
          </AlertDialogAction>
          
          <Button
            variant="ghost"
            onClick={handleContinueWebsite}
            className={`
              w-full h-11 text-sm text-muted-foreground hover:text-foreground 
              hover:bg-muted/60 rounded-xl transition-all duration-200
              ${isAnimated ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <Globe className="w-4 h-4 mr-2 opacity-60" />
            Continue on website
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
