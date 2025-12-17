import { AlertTriangle, Clock, ArrowRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TimetableConflict, SubjectInfo } from "@/types/attendance";
import { cn } from "@/lib/utils";

interface ConflictResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: TimetableConflict[];
  subjectsWithConflicts: SubjectInfo[];
  timetableSlotsAdded: number;
  onGoToTimetable: () => void;
  onDismiss: () => void;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function formatTime(timeString: string): string {
  // Handle time format like "09:00:00" or "9:00"
  const parts = timeString.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

export function ConflictResolutionModal({
  open,
  onOpenChange,
  conflicts,
  subjectsWithConflicts,
  timetableSlotsAdded,
  onGoToTimetable,
  onDismiss,
}: ConflictResolutionModalProps) {
  // Group conflicts by the new subject
  const conflictsByNewSubject = conflicts.reduce((acc, conflict) => {
    const key = conflict.newSubjectCode;
    if (!acc[key]) {
      acc[key] = {
        subjectName: conflict.newSubjectName,
        subjectCode: conflict.newSubjectCode,
        conflicts: [],
      };
    }
    acc[key].conflicts.push(conflict);
    return acc;
  }, {} as Record<string, { subjectName: string; subjectCode: string; conflicts: TimetableConflict[] }>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-full max-w-md rounded-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-lg">Timetable Conflicts Detected</DialogTitle>
              <DialogDescription className="text-sm mt-0.5">
                {conflicts.length} slot{conflicts.length !== 1 ? "s" : ""} couldn't be added automatically
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2">
          {/* Success message if some slots were added */}
          {timetableSlotsAdded > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                ✓ {timetableSlotsAdded} timetable slot{timetableSlotsAdded !== 1 ? "s were" : " was"} added successfully
              </p>
            </div>
          )}

          {/* Conflict details */}
          <div className="space-y-4">
            {Object.entries(conflictsByNewSubject).map(([code, data]) => (
              <div key={code} className="bg-muted/50 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {data.subjectName}
                  <span className="text-muted-foreground font-normal">({data.subjectCode})</span>
                </h4>
                
                <div className="space-y-2">
                  {data.conflicts.map((conflict, idx) => (
                    <div
                      key={idx}
                      className="bg-background rounded-md p-2.5 border border-border"
                    >
                      {/* Time slot info */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-medium">{conflict.dayName}</span>
                        <span>•</span>
                        <span>
                          {formatTime(conflict.slotStartTime)} - {formatTime(conflict.slotEndTime)}
                        </span>
                      </div>
                      
                      {/* Conflict visualization */}
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-4 rounded-full bg-primary/60 flex-shrink-0" />
                            <span className="truncate font-medium">{conflict.existingSubjectCode}</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-3 truncate">
                            Already scheduled
                          </p>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-4 rounded-full bg-amber-500 flex-shrink-0" />
                            <span className="truncate font-medium">{conflict.newSubjectCode}</span>
                          </div>
                          <p className="text-xs text-muted-foreground ml-3 truncate">
                            Not added
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Help text */}
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">What to do:</strong> Go to your timetable to manually resolve these conflicts. 
              You can remove existing subjects from conflicting slots or rearrange your schedule.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onDismiss}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Dismiss
          </Button>
          <Button
            onClick={onGoToTimetable}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            Go to Timetable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

