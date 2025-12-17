import { useState } from "react";
import { AlertTriangle, Clock, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SelectedSubjectConflict, Subject } from "@/types/attendance";
import { cn } from "@/lib/utils";

interface SubjectConflictResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: SelectedSubjectConflict[];
  subjects: Subject[];
  onResolve: (resolutions: Map<string, string>) => void; // Map of conflict key -> selected subjectId
  onCancel: () => void;
}

function formatTime(timeString: string): string {
  const parts = timeString.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

function getConflictKey(conflict: SelectedSubjectConflict): string {
  return `${conflict.dayId}-${conflict.slotId}`;
}

export function SubjectConflictResolutionModal({
  open,
  onOpenChange,
  conflicts,
  subjects,
  onResolve,
  onCancel,
}: SubjectConflictResolutionModalProps) {
  const [resolutions, setResolutions] = useState<Map<string, string>>(new Map());

  // Initialize resolutions with first subject for each conflict if not set
  conflicts.forEach(conflict => {
    const key = getConflictKey(conflict);
    if (!resolutions.has(key) && conflict.conflictingSubjects.length > 0) {
      resolutions.set(key, conflict.conflictingSubjects[0].subjectId);
    }
  });

  const handleSelectSubject = (conflictKey: string, subjectId: string) => {
    setResolutions(prev => {
      const updated = new Map(prev);
      updated.set(conflictKey, subjectId);
      return updated;
    });
  };

  const handleResolve = () => {
    // Verify all conflicts are resolved
    const allResolved = conflicts.every(conflict => {
      const key = getConflictKey(conflict);
      return resolutions.has(key) && resolutions.get(key) !== null;
    });

    if (allResolved) {
      onResolve(resolutions);
    }
  };

  const handleCancel = () => {
    setResolutions(new Map());
    onCancel();
  };

  // Group conflicts by day for better organization
  const conflictsByDay = conflicts.reduce((acc, conflict) => {
    if (!acc[conflict.dayName]) {
      acc[conflict.dayName] = [];
    }
    acc[conflict.dayName].push(conflict);
    return acc;
  }, {} as Record<string, SelectedSubjectConflict[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto rounded-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-lg">Resolve Schedule Conflicts</DialogTitle>
              <DialogDescription className="text-sm mt-0.5">
                {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""} found between selected subjects
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-2">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-4">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              <strong>Select one subject</strong> for each conflicting time slot. The other subject(s) will not be scheduled for that slot.
            </p>
          </div>

          <div className="space-y-4">
            {Object.entries(conflictsByDay).map(([dayName, dayConflicts]) => (
              <div key={dayName} className="bg-muted/50 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {dayName}
                </h4>
                
                <div className="space-y-3">
                  {dayConflicts.map((conflict) => {
                    const conflictKey = getConflictKey(conflict);
                    const selectedSubjectId = resolutions.get(conflictKey) || conflict.conflictingSubjects[0]?.subjectId;
                    
                    return (
                      <div
                        key={conflictKey}
                        className="bg-background rounded-md p-3 border border-border"
                      >
                        {/* Time slot info */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {formatTime(conflict.slotStartTime)} - {formatTime(conflict.slotEndTime)}
                          </span>
                        </div>
                        
                        {/* Subject selection */}
                        <p className="text-xs text-muted-foreground mb-2">
                          Select which subject to keep for this slot:
                        </p>
                        
                        <div className="space-y-2">
                          {conflict.conflictingSubjects.map((subject) => {
                            const subjectData = subjects.find(s => s.id === subject.subjectId);
                            const isSelected = selectedSubjectId === subject.subjectId;
                            
                            return (
                              <button
                                key={subject.subjectId}
                                onClick={() => handleSelectSubject(conflictKey, subject.subjectId)}
                                className={cn(
                                  "w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left",
                                  isSelected
                                    ? "bg-primary/10 border-primary/30 ring-2 ring-primary/20"
                                    : "bg-card border-border hover:bg-muted/50"
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted border-2 border-border"
                                  )}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <div
                                  className="w-1.5 h-6 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: subjectData ? `hsl(${subjectData.color})` : undefined }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{subject.subjectName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{subject.subjectCode}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Resolve & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

