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
import { Zap, Bell, ExternalLink } from "lucide-react";

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

const GooglePlayBadge = () => (
  <svg viewBox="0 0 135 40" className="h-10" fill="none">
    <rect width="135" height="40" rx="5" fill="#000"/>
    <path d="M47.418 10.242a2.49 2.49 0 01-.677 1.836 2.593 2.593 0 01-1.962.808 2.778 2.778 0 01-1.971-.818 2.71 2.71 0 01-.817-1.969c0-.77.272-1.426.817-1.969a2.778 2.778 0 011.971-.818c.389 0 .76.076 1.111.229.352.153.632.36.842.619l-.474.474a1.866 1.866 0 00-1.479-.656c-.553 0-1.03.197-1.432.59a2.028 2.028 0 00-.603 1.531c0 .609.201 1.118.603 1.527.401.41.879.615 1.432.615.586 0 1.075-.205 1.465-.615.253-.263.4-.63.439-1.102h-1.904v-.645h2.555c.025.127.038.249.038.363h.046z" fill="#fff"/>
    <path d="M51.628 7.477h-2.289v1.742h2.065v.645h-2.065v1.742h2.289v.663h-2.956V6.814h2.956v.663zM54.758 12.269h-.667V7.477H52.45v-.663h3.948v.663h-1.64v4.792zM58.396 12.269V6.814h.667v5.455h-.667zM62.776 12.269h-.667V7.477h-1.64v-.663h3.947v.663h-1.64v4.792zM71.363 11.561a2.744 2.744 0 01-1.962.819 2.744 2.744 0 01-1.962-.819 2.684 2.684 0 01-.822-1.96c0-.77.274-1.426.822-1.969a2.744 2.744 0 011.962-.818c.77 0 1.427.273 1.962.818.544.543.822 1.199.822 1.968 0 .77-.278 1.418-.822 1.961zm-3.409-.465c.397.41.875.615 1.447.615.572 0 1.05-.205 1.447-.615.397-.41.596-.918.596-1.527 0-.608-.199-1.117-.596-1.527a1.977 1.977 0 00-1.447-.619c-.572 0-1.05.206-1.447.62a2.05 2.05 0 00-.596 1.526c0 .609.199 1.118.596 1.527zM73.592 12.269V6.814h.812l2.524 4.243h.029l-.029-1.052V6.814h.667v5.455h-.696l-2.64-4.481h-.029l.029 1.052v3.43h-.667z" fill="#fff"/>
    <path d="M68.135 21.753c-2.387 0-4.332 1.815-4.332 4.318 0 2.486 1.945 4.318 4.332 4.318 2.387 0 4.332-1.823 4.332-4.318 0-2.503-1.945-4.318-4.332-4.318zm0 6.93c-1.308 0-2.436-1.08-2.436-2.612 0-1.549 1.128-2.612 2.436-2.612 1.308 0 2.437 1.063 2.437 2.612 0 1.532-1.129 2.612-2.437 2.612zm-9.45-6.93c-2.387 0-4.332 1.815-4.332 4.318 0 2.486 1.945 4.318 4.331 4.318 2.387 0 4.332-1.823 4.332-4.318 0-2.503-1.945-4.318-4.332-4.318zm0 6.93c-1.308 0-2.436-1.08-2.436-2.612 0-1.549 1.128-2.612 2.436-2.612 1.308 0 2.436 1.063 2.436 2.612 0 1.532-1.128 2.612-2.436 2.612zm-11.24-5.607v1.832h4.381c-.131 1.03-.475 1.782-1.003 2.31-.645.645-1.654 1.356-3.378 1.356-2.693 0-4.796-2.17-4.796-4.864 0-2.693 2.103-4.863 4.796-4.863 1.454 0 2.512.57 3.296 1.306l1.295-1.296c-1.095-1.046-2.553-1.849-4.59-1.849-3.693 0-6.793 3.008-6.793 6.702 0 3.693 3.1 6.701 6.793 6.701 1.995 0 3.495-.654 4.672-1.873 1.21-1.21 1.586-2.91 1.586-4.284 0-.426-.033-.819-.099-1.145l-6.16-.033zm45.98 1.423c-.36-.967-1.46-2.753-3.707-2.753-2.229 0-4.083 1.753-4.083 4.318 0 2.42 1.837 4.318 4.298 4.318 1.985 0 3.133-1.21 3.608-1.912l-1.478-.986c-.491.721-1.162 1.195-2.13 1.195-.967 0-1.65-.442-2.092-1.309l5.765-2.387-.18-.484zm-5.88 1.44c-.049-1.663 1.29-2.511 2.253-2.511.753 0 1.39.376 1.602.918l-3.855 1.593zm-4.697 4.18h1.896V17.467h-1.896v12.652zm-3.1-7.393h-.065c-.426-.508-1.243-.967-2.277-.967-2.162 0-4.14 1.898-4.14 4.335 0 2.42 1.978 4.3 4.14 4.3 1.034 0 1.85-.458 2.277-.983h.066v.622c0 1.654-.885 2.54-2.31 2.54-1.163 0-1.88-.836-2.18-1.54l-1.65.688c.475 1.145 1.733 2.552 3.83 2.552 2.228 0 4.115-1.308 4.115-4.498v-7.754h-1.798v.704h-.008zm-2.178 5.97c-1.309 0-2.404-1.097-2.404-2.6 0-1.52 1.095-2.628 2.404-2.628 1.29 0 2.31 1.113 2.31 2.628 0 1.503-1.02 2.6-2.31 2.6zm24.834-11.246h-4.535v12.652h1.895v-4.79h2.64c2.095 0 4.157-1.515 4.157-3.93 0-2.417-2.054-3.932-4.157-3.932zm.05 6.1h-2.69v-4.34h2.69c1.413 0 2.212 1.17 2.212 2.17 0 .984-.8 2.17-2.212 2.17zm11.688-1.815c-1.37 0-2.788.603-3.378 1.94l1.682.702c.36-.702 1.029-.934 1.73-.934.983 0 1.979.59 1.995 1.64v.131c-.343-.196-1.078-.49-1.978-.49-1.814 0-3.66.999-3.66 2.862 0 1.7 1.486 2.797 3.15 2.797 1.276 0 1.979-.573 2.42-1.244h.066v.982h1.83v-4.875c0-2.26-1.683-3.511-3.857-3.511zm-.23 6.962c-.62 0-1.487-.31-1.487-1.08 0-.982 1.078-1.358 2.013-1.358.835 0 1.226.18 1.732.426a2.297 2.297 0 01-2.259 2.012zm10.726-6.684l-2.177 5.514h-.065l-2.26-5.514h-2.044l3.379 7.689-1.928 4.282h1.978l5.21-11.971h-2.093zm-17.076 8.129h1.896V17.467h-1.896v12.652z" fill="#fff"/>
    <path d="M10.435 7.538a1.88 1.88 0 00-.434 1.303v22.324c0 .508.154.942.434 1.302l.069.066 12.51-12.51v-.295L10.504 7.472l-.07.066z" fill="url(#paint0_linear)"/>
    <path d="M27.18 24.111l-4.17-4.17v-.296l4.17-4.17.094.054 4.941 2.807c1.412.802 1.412 2.114 0 2.916l-4.94 2.807-.095.052z" fill="url(#paint1_linear)"/>
    <path d="M27.275 24.059l-4.264-4.264L10.435 32.37c.466.494 1.235.554 2.103.062l14.737-8.373z" fill="url(#paint2_linear)"/>
    <path d="M27.275 15.53L12.538 7.155c-.868-.492-1.637-.432-2.103.062l12.576 12.576 4.264-4.264z" fill="url(#paint3_linear)"/>
    <defs>
      <linearGradient id="paint0_linear" x1="21.8" y1="8.71" x2="5.017" y2="25.493" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00A0FF"/><stop offset=".007" stopColor="#00A1FF"/><stop offset=".26" stopColor="#00BEFF"/><stop offset=".512" stopColor="#00D2FF"/><stop offset=".76" stopColor="#00DFFF"/><stop offset="1" stopColor="#00E3FF"/>
      </linearGradient>
      <linearGradient id="paint1_linear" x1="34.827" y1="19.795" x2="9.934" y2="19.795" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFE000"/><stop offset=".409" stopColor="#FFBD00"/><stop offset=".775" stopColor="#FFA500"/><stop offset="1" stopColor="#FF9C00"/>
      </linearGradient>
      <linearGradient id="paint2_linear" x1="24.827" y1="22.296" x2="2.069" y2="45.054" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF3A44"/><stop offset="1" stopColor="#C31162"/>
      </linearGradient>
      <linearGradient id="paint3_linear" x1="7.297" y1="0" x2="17.46" y2="10.163" gradientUnits="userSpaceOnUse">
        <stop stopColor="#32A071"/><stop offset=".069" stopColor="#2DA771"/><stop offset=".476" stopColor="#15CF74"/><stop offset=".801" stopColor="#06E775"/><stop offset="1" stopColor="#00F076"/>
      </linearGradient>
    </defs>
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
              w-full h-auto p-0 bg-transparent hover:bg-transparent border-0 shadow-none
              transition-all duration-500 delay-300 hover:scale-[1.02] active:scale-[0.98]
              ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}
          >
            <GooglePlayBadge />
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
            <ExternalLink className="w-4 h-4 mr-2 opacity-50" />
            Continue on website
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
