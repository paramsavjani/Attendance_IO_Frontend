import { useState, useEffect } from "react";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_CONFIG } from "@/lib/api";
import { toast } from "sonner";

interface SleepDurationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  defaultHours?: number;
}

export function SleepDurationDialog({
  open,
  onClose,
  onSave,
  defaultHours = 8,
}: SleepDurationDialogProps) {
  const [hours, setHours] = useState(defaultHours);
  const [isSaving, setIsSaving] = useState(false);

  // Reset to default when dialog opens
  useEffect(() => {
    if (open) {
      setHours(defaultHours);
    }
  }, [open, defaultHours]);

  const handleSave = async () => {
    // Validate input
    if (hours < 1 || hours >= 20) {
      toast.error("Sleep duration must be between 1 and 19 hours");
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
          sleepDurationHours: hours,
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
        <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-6">
          {/* Value Display */}
          <div className="text-center">
            <span className="text-5xl font-bold text-primary tabular-nums">{hours}</span>
            <span className="text-xl text-muted-foreground ml-2">hours</span>
          </div>
          
          {/* Slider */}
          <div className="px-2">
            <Slider
              value={[hours]}
              onValueChange={(value) => setHours(value[0])}
              min={1}
              max={20}
              step={1}
              disabled={isSaving}
              className="w-full"
            />
            <div className="flex justify-between mt-3 text-xs text-muted-foreground">
              <span>1h</span>
              <span>10h</span>
              <span>20h</span>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 flex flex-col sm:flex-row gap-2 sm:gap-3 border-t">
          <Button
            onClick={handleSave}
            className="flex-1 h-11 sm:h-10 rounded-xl font-semibold shadow-md"
            disabled={isSaving || hours < 1 || hours >= 20}
          >
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
