import { RefreshCw, Server } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackendUpdating() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8 text-center shadow-2xl border border-border/50 backdrop-blur-sm bg-background/80 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Server className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Backend Updating</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The server is currently updating. Please try again in 1-2 minutes.
            </p>
          </div>

          <Button onClick={handleRefresh} className="w-full h-12 text-base font-medium gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh App
          </Button>
        </div>
      </div>
    </div>
  );
}
