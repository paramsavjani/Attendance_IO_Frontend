import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_CONFIG } from "@/lib/api";

interface BaselineAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
  onSave?: () => void;
}

export function BaselineAttendanceDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  onSave,
}: BaselineAttendanceDialogProps) {
  const [cutoffDate, setCutoffDate] = useState("");
  const [totalClasses, setTotalClasses] = useState("");
  const [presentClasses, setPresentClasses] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Fetch existing baseline data when dialog opens
  useEffect(() => {
    if (open && subjectId) {
      fetchBaselineData();
    }
  }, [open, subjectId]);

  const fetchBaselineData = async () => {
    setIsFetching(true);
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.GET_BASELINE_ATTENDANCE(subjectId), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cutoffDate) {
          setCutoffDate(data.cutoffDate);
        } else {
          // Default to today if no baseline exists
          const today = new Date().toISOString().split('T')[0];
          setCutoffDate(today);
        }
        setTotalClasses(data.totalClasses?.toString() || "");
        setPresentClasses(data.presentClasses?.toString() || "");
      } else {
        // If no baseline exists, set default date
        const today = new Date().toISOString().split('T')[0];
        setCutoffDate(today);
      }
    } catch (error) {
      console.error('Error fetching baseline data:', error);
      // Set default date on error
      const today = new Date().toISOString().split('T')[0];
      setCutoffDate(today);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!cutoffDate) {
      toast.error("Please select a cutoff date");
      return;
    }

    const total = parseInt(totalClasses, 10);
    const present = parseInt(presentClasses, 10);

    if (isNaN(total) || total < 0) {
      toast.error("Total classes must be a valid number (0 or greater)");
      return;
    }

    if (isNaN(present) || present < 0) {
      toast.error("Present classes must be a valid number (0 or greater)");
      return;
    }

    if (present > total) {
      toast.error("Present classes cannot exceed total classes");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SAVE_BASELINE_ATTENDANCE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subjectId,
          cutoffDate,
          totalClasses: total,
          presentClasses: present,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save previous attendance');
      }

      toast.success("Previous attendance saved successfully");
      onSave?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving previous attendance:', error);
      toast.error(error.message || 'Failed to save previous attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCutoffDate("");
    setTotalClasses("");
    setPresentClasses("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Previous Attendance</DialogTitle>
          <p className="text-sm text-muted-foreground">{subjectName}</p>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cutoffDate" className="text-sm">
                Cutoff Date (Till which date)
              </Label>
              <Input
                id="cutoffDate"
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Attendance data before this date will be considered as previous attendance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalClasses" className="text-sm">
                Total Classes
              </Label>
              <Input
                id="totalClasses"
                type="number"
                min="0"
                value={totalClasses}
                onChange={(e) => setTotalClasses(e.target.value)}
                placeholder="Enter total classes"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="presentClasses" className="text-sm">
                Present Classes
              </Label>
              <Input
                id="presentClasses"
                type="number"
                min="0"
                value={presentClasses}
                onChange={(e) => setPresentClasses(e.target.value)}
                placeholder="Enter present classes"
                className="w-full"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

