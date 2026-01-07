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
import { Zap, Bell, Smartphone, Globe, ArrowRight } from "lucide-react";

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
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
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

  const features = [
    { icon: Zap, label: "Lightning Fast", desc: "Smoother experience" },
    { icon: Bell, label: "Notifications", desc: "Stay updated" },
    { icon: Smartphone, label: "Native Feel", desc: "Works offline" },
  ];

  return (
    <AlertDialog open={showDialog} onOpenChange={() => {}}>
      <AlertDialogContent 
        className={`
          w-[calc(100%-2rem)] max-w-[340px] p-0 rounded-[28px] border-0 
          shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden bg-card
          transition-all duration-300 ease-out
          ${isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header with gradient background */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-b from-muted/80 to-card">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
          
          <div className="relative flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-[22px] bg-card shadow-lg border border-border/50 flex items-center justify-center mb-4">
              <img src="/logo.png" alt="App" className="w-14 h-14 rounded-xl object-contain" />
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Attendance IO
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Better on the app
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            {features.map((feature, idx) => (
              <div 
                key={feature.label}
                className={`
                  flex flex-col items-center p-3 rounded-2xl bg-muted/40 
                  transition-all duration-300 delay-[${idx * 75}ms]
                  ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                `}
                style={{ transitionDelay: `${idx * 75 + 100}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground">{feature.label}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{feature.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle>Download App</AlertDialogTitle>
          <AlertDialogDescription>Get the app for better experience</AlertDialogDescription>
        </AlertDialogHeader>

        {/* Actions */}
        <div className="p-5 pt-2 space-y-2.5">
          <AlertDialogAction
            onClick={handleOpenPlayStore}
            className="w-full h-[52px] text-sm font-semibold rounded-2xl bg-foreground hover:bg-foreground/90 text-background shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2.5 group"
          >
            <GooglePlayIcon />
            <span>Get on Google Play</span>
            <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </AlertDialogAction>
          
          <Button
            variant="ghost"
            onClick={handleContinueWebsite}
            className="w-full h-11 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-2xl transition-colors"
          >
            <Globe className="w-4 h-4 mr-2 opacity-60" />
            Continue on website
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
