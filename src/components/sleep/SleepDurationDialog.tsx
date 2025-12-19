import { useState, useEffect } from "react";
import { Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_CONFIG } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SleepDurationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  defaultHours?: number;
}

const QUICK_HOURS = [6, 7, 8, 9, 10];

export function SleepDurationDialog({
  open,
  onClose,
  onSave,
  defaultHours = 8,
}: SleepDurationDialogProps) {
  const [hours, setHours] = useState(defaultHours.toString());
  const [isSaving, setIsSaving] = useState(false);

  // Reset to default when dialog opens
  useEffect(() => {
    if (open) {
      setHours(defaultHours.toString());
    }
  }, [open, defaultHours]);

  const handleSave = async () => {
    const hoursNum = parseInt(hours, 10);
    
    // Validate input
    if (isNaN(hoursNum) || hoursNum < 4 || hoursNum > 16) {
      toast.error("Sleep duration must be between 4 and 16 hours");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.UPDATE_SLEEP_DURATION, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sleepDurationHours: hoursNum,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save sleep duration');
      }

      toast.success("Sleep preference saved!");
      onSave();
    } catch (error: any) {
      console.error('Error saving sleep duration:', error);
      toast.error(error.message || 'Failed to save sleep duration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[92vw] sm:w-full sm:max-w-md z-[100] rounded-2xl sm:rounded-xl p-0 gap-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-4 sm:px-6 pt-6 pb-4">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-center w-16 h-16 sm:w-14 sm:h-14 rounded-2xl bg-primary/20 mx-auto mb-1 shadow-lg">
              <Moon className="w-8 h-8 sm:w-7 sm:h-7 text-primary" />
            </div>
            <DialogTitle className="text-xl sm:text-lg font-bold text-center">
              Tell us how much sleep you need 😴
            </DialogTitle>
            <DialogDescription className="text-sm text-center text-muted-foreground px-2">
              We'll make sure to remind you before important lectures!
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-5">
          {/* Quick selection buttons */}
          <div>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_HOURS.map((hour) => {
                const isSelected = hours === hour.toString();
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => setHours(hour.toString())}
                    className={cn(
                      "py-3 sm:py-2.5 rounded-xl text-sm font-semibold transition-all",
                      "active:scale-95",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {hour}h
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom input */}
          <div>
            <label htmlFor="sleep-hours" className="text-sm font-medium text-foreground mb-2 block">
              Or enter custom hours
            </label>
            <div className="relative">
              <Input
                id="sleep-hours"
                type="number"
                min="4"
                max="16"
                value={hours}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || (parseInt(val) >= 4 && parseInt(val) <= 16)) {
                    setHours(val);
                  }
                }}
                placeholder="8"
                className="text-center text-2xl sm:text-xl font-bold h-14 sm:h-12 pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                hours
              </span>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 flex flex-col sm:flex-row gap-2 sm:gap-3 border-t">
          <Button
            onClick={handleSave}
            className="flex-1 h-11 sm:h-10 rounded-xl font-semibold shadow-md"
            disabled={isSaving || !hours || parseInt(hours) < 4 || parseInt(hours) > 16}
          >
            {isSaving ? (
              <>
                <span className="animate-pulse">Saving...</span>
              </>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

