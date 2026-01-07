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
import { Zap, Shield, Bell, X, Star, Download } from "lucide-react";

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
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isAndroidWebView()) {
      setShowDialog(true);
      setTimeout(() => setIsAnimating(true), 50);
    }
  }, []);

  const handleOpenPlayStore = async () => {
    await openPlayStore();
  };

  const handleContinueWebsite = () => {
    setIsAnimating(false);
    setTimeout(() => setShowDialog(false), 200);
  };

  if (!showDialog) return null;

  return (
    <AlertDialog open={showDialog} onOpenChange={() => {}}>
      <AlertDialogContent 
        className={`w-[calc(100%-2rem)] max-w-[360px] p-0 rounded-3xl border-0 shadow-2xl overflow-hidden bg-card transition-all duration-300 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header with App Info */}
        <div className="relative px-5 pt-5 pb-4">
          <button 
            onClick={handleContinueWebsite}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/60 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg border border-primary/10 flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="Attendance IO" className="w-12 h-12 rounded-xl" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-base font-bold text-foreground">Attendance IO</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Track your attendance smartly</p>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">4.8</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">1K+ downloads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/60 mx-5" />

        {/* Features */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Why use the app?</p>
          <div className="space-y-3">
            <FeatureItem 
              icon={Zap} 
              title="Lightning Fast" 
              desc="Smoother & faster experience"
              color="bg-amber-500/15 text-amber-500" 
              delay={0}
              animate={isAnimating}
            />
            <FeatureItem 
              icon={Bell} 
              title="Stay Updated" 
              desc="Push notifications for classes"
              color="bg-blue-500/15 text-blue-500" 
              delay={1}
              animate={isAnimating}
            />
            <FeatureItem 
              icon={Shield} 
              title="Works Offline" 
              desc="Access anytime, anywhere"
              color="bg-emerald-500/15 text-emerald-500" 
              delay={2}
              animate={isAnimating}
            />
          </div>
        </div>

        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle>Download App</AlertDialogTitle>
          <AlertDialogDescription>Get the app for better experience</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col gap-2 p-5 pt-2 bg-muted/30">
          <AlertDialogAction
            onClick={handleOpenPlayStore}
            className="w-full h-12 text-sm font-semibold rounded-2xl bg-foreground hover:bg-foreground/90 text-background shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-[0.98]"
          >
            <GooglePlayIcon />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] font-normal opacity-80">GET IT ON</span>
              <span className="text-sm font-semibold -mt-0.5">Google Play</span>
            </div>
          </AlertDialogAction>
          
          <Button
            variant="ghost"
            onClick={handleContinueWebsite}
            className="w-full text-xs text-muted-foreground hover:text-foreground h-9"
          >
            No thanks, continue on website
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  delay: number;
  animate: boolean;
}

function FeatureItem({ icon: Icon, title, desc, color, delay, animate }: FeatureItemProps) {
  return (
    <div 
      className={`flex items-center gap-3 transition-all duration-300 ${
        animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
      }`}
      style={{ transitionDelay: `${delay * 100}ms` }}
    >
      <div className={`p-2 rounded-xl ${color} flex-shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

