import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURE_ANNOUNCEMENT_STORAGE_KEY = "attendance_io_feature_announcement_v2";
const FEATURE_ANNOUNCEMENT_VERSION = "2.0.0";
const FEATURE_ANNOUNCEMENT_SHOWN_KEY = "attendance_io_feature_announcement_shown_count";

export function FeatureAnnouncement({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      const seen = localStorage.getItem(FEATURE_ANNOUNCEMENT_STORAGE_KEY);
      
      // Check how many times it's been shown
      const shownCount = parseInt(
        localStorage.getItem(FEATURE_ANNOUNCEMENT_SHOWN_KEY) || "0",
        10
      );

      // Show if not seen this version OR if shown less than 2 times
      if (seen !== FEATURE_ANNOUNCEMENT_VERSION || shownCount < 2) {
        timer = setTimeout(() => {
          setOpen(true);
          // Increment shown count
          localStorage.setItem(
            FEATURE_ANNOUNCEMENT_SHOWN_KEY,
            (shownCount + 1).toString()
          );
        }, 400);
      } else {
        onClose?.();
      }
    } catch {
      onClose?.();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [onClose]);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(FEATURE_ANNOUNCEMENT_STORAGE_KEY, FEATURE_ANNOUNCEMENT_VERSION);
      } catch {}
    }
    setOpen(false);
    onClose?.();
  };

  const features = [
    {
      icon: Clock,
      title: "Custom Time Slots",
      description:
        "Add lectures at any time, including afternoon sessions! No longer limited to fixed morning slots.",
      color: "text-blue-500 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
      iconBg: "bg-blue-500/20",
    },
    {
      icon: MapPin,
      title: "Custom Classroom Locations",
      description:
        "Personalize classroom locations for each subject. Set different locations than the default lecture place.",
      color: "text-emerald-500 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
    },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          handleClose();
        } else {
          setOpen(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-[550px] max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-lg p-4 sm:p-6">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <span className="leading-tight">New Features Available!</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base mt-1 sm:mt-2 text-muted-foreground leading-relaxed">
            We've added some exciting new features to make your attendance tracking even better.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border",
                  feature.bgColor,
                  "border-border"
                )}
              >
                <div
                  className={cn(
                    "p-2 sm:p-3 rounded-lg flex-shrink-0",
                    feature.iconBg
                  )}
                >
                  <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", feature.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-1.5 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:gap-3 pt-2 sm:pt-0">
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(v) => setDontShowAgain(v as boolean)}
              className="flex-shrink-0"
            />
            <Label
              htmlFor="dont-show"
              className="text-xs sm:text-sm font-normal cursor-pointer text-muted-foreground leading-tight"
            >
              Don't show again
            </Label>
          </div>
          <Button onClick={handleClose} className="w-full sm:w-auto min-w-[120px]">
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
