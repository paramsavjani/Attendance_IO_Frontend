import { useEffect, useState } from "react";
import { RefreshCw, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToken } from "@/lib/token";

export default function BackendUpdating() {
  const [countdown, setCountdown] = useState(15);

  // Visual countdown so the user knows the app is retrying automatically
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 15;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => {
    window.location.hash = getToken() ? "/dashboard" : "/login";
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden safe-area-top safe-area-bottom">
      {/* Background blobs — same as Login */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="Attendance IO Logo"
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/90 to-violet-400 bg-clip-text text-transparent mb-2">
            Attendance IO
          </h1>
          <p className="text-sm text-muted-foreground px-4">
            Your personal attendance tracker
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-2xl border border-border/50 backdrop-blur-sm bg-background/80 space-y-6 animate-slide-up">
          {/* Icon */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/15 to-violet-500/10 border border-white/10 flex items-center justify-center shadow-lg">
                <Server className="w-11 h-11 text-primary" />
              </div>
              {/* Countdown ring */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-card border border-border/60 flex items-center justify-center shadow-md">
                <span className="text-xs font-bold text-primary">{countdown}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mx-auto">
              Server is updating
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                Backend Updating
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The server is currently being updated. This usually takes 1–2 minutes.
                The app is checking automatically every 15 seconds.
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-2xl border border-border/50 bg-black/20 px-4 py-3 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-primary flex-shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
            <p className="text-xs text-muted-foreground">
              Auto-retrying in <span className="font-semibold text-primary">{countdown}s</span>. You'll be redirected automatically when the server is ready.
            </p>
          </div>

          <Button
            onClick={handleRefresh}
            variant="outline"
            className="w-full h-12 text-base font-medium gap-2 border-border/60"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Manually
          </Button>
        </div>
      </div>
    </div>
  );
}
