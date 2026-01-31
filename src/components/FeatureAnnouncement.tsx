import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, Sparkles, ArrowRight, User } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "attendance_io_feature_announcement_v5";
const VERSION = "5.0.0";

export function FeatureAnnouncement({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen !== VERSION) {
        timer = setTimeout(() => setOpen(true), 400);
      } else {
        onClose?.();
      }
    } catch {
      onClose?.();
    }

    return () => timer && clearTimeout(timer);
  }, [onClose]);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, VERSION);
    } catch {}
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent
        className={cn(
          "max-w-[95vw] sm:max-w-xl md:max-w-2xl",
          "rounded-2xl p-5 sm:p-8",
          "[&>button]:hidden"
        )}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl font-semibold">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            What’s New
          </DialogTitle>
        </DialogHeader>

        {/* Main Feature Card */}
        <div className="mt-5 sm:mt-6">
          <div
            className={cn(
              "rounded-2xl border",
              "bg-muted/40 dark:bg-muted/20",
              "p-4 sm:p-6"
            )}
          >
            {/* Top */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/15">
                <BarChart3 className="h-7 w-7 text-primary" />
              </div>

              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold">
                  App Analytics
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  App Analytics is now available from your{" "}
                  <span className="font-medium text-foreground">
                    Profile section
                  </span>
                  . Get a complete view of how your app is being used.
                </p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-xs sm:text-sm">
              {[
                "User activity",
                "Attendance overview",
                "Event performance",
                "Daily charts",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border bg-background/70 dark:bg-background/40 px-3 py-2 flex items-center justify-center text-center"
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Location hint */}
            <div className="flex items-center gap-2 mt-4 text-xs sm:text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              Available in <span className="font-medium">Profile → App Analytics</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={close}
          >
            Maybe later
          </Button>

          <Button
            className="w-full sm:w-auto gap-2"
            onClick={() => {
              close();
              navigate("/app-analytics");
            }}
          >
            Open App Analytics
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
