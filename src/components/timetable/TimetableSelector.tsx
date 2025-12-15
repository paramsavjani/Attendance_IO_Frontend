import { useState, useMemo } from "react";
import { Calendar, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimetableSlot, Subject } from "@/types/attendance";
import { timeSlots, days } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface TimetableSelectorProps {
  timetable: TimetableSlot[];
  enrolledSubjects: Subject[];
  onSave: (timetable: TimetableSlot[]) => void;
  onCancel?: () => void;
  onBack?: () => void;
  isOnboarding?: boolean;
}

export function TimetableSelector({
  timetable: initialTimetable,
  enrolledSubjects,
  onSave,
  onCancel,
  onBack,
  isOnboarding = false,
}: TimetableSelectorProps) {
  const [timetable, setTimetable] = useState<TimetableSlot[]>(initialTimetable);
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; timeSlot: number } | null>(null);

  const getSlotSubject = (day: number, timeSlot: number) => {
    const slot = timetable.find((s) => s.day === day && s.timeSlot === timeSlot);
    if (slot?.subjectId) {
      return enrolledSubjects.find((s) => s.id === slot.subjectId);
    }
    return null;
  };

  const handleSlotClick = (day: number, timeSlot: number) => {
    setSelectedSlot({ day, timeSlot });
  };

  const handleAssignSubject = (subjectId: string | null) => {
    if (!selectedSlot) return;

    setTimetable((prev) => {
      const existingIndex = prev.findIndex(
        (slot) => slot.day === selectedSlot.day && slot.timeSlot === selectedSlot.timeSlot
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], subjectId };
        return updated;
      } else {
        return [...prev, { day: selectedSlot.day, timeSlot: selectedSlot.timeSlot, subjectId }];
      }
    });

    setSelectedSlot(null);
  };

  const handleSave = () => {
    onSave(timetable);
  };

  const slotsPerDay = useMemo(() => {
    const counts: Record<number, number> = {};
    days.forEach((_, i) => {
      counts[i] = timetable.filter(s => s.day === i && s.subjectId).length;
    });
    return counts;
  }, [timetable]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-4 px-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Calendar className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-bold mb-1">
          {isOnboarding ? "Set Your Timetable" : "Update Timetable"}
        </h2>
        <p className="text-xs text-muted-foreground">
          Tap slots to assign your subjects for each day
        </p>
      </div>

      {/* Days Accordion */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[50vh] px-1">
        {days.map((day, dayIndex) => (
          <div key={day} className="rounded-xl border border-border overflow-hidden bg-card">
            <button
              onClick={() => setExpandedDay(expandedDay === dayIndex ? -1 : dayIndex)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">{day}</span>
                {slotsPerDay[dayIndex] > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {slotsPerDay[dayIndex]} class{slotsPerDay[dayIndex] > 1 ? "es" : ""}
                  </span>
                )}
              </div>
              {expandedDay === dayIndex ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedDay === dayIndex && (
              <div className="p-3 pt-0 grid grid-cols-3 gap-2">
                {timeSlots.slice(0, 6).map((time, timeIndex) => {
                  const subject = getSlotSubject(dayIndex, timeIndex);
                  const isSelecting = selectedSlot?.day === dayIndex && selectedSlot?.timeSlot === timeIndex;
                  
                  return (
                    <button
                      key={timeIndex}
                      onClick={() => handleSlotClick(dayIndex, timeIndex)}
                      className={cn(
                        "p-2 rounded-lg text-left transition-all min-h-[56px]",
                        isSelecting
                          ? "ring-2 ring-primary"
                          : subject
                          ? "border"
                          : "bg-muted/30 border border-dashed border-border"
                      )}
                      style={
                        subject
                          ? {
                              backgroundColor: `hsl(${subject.color} / 0.15)`,
                              borderColor: `hsl(${subject.color} / 0.3)`,
                            }
                          : undefined
                      }
                    >
                      <p className="text-[9px] text-muted-foreground mb-0.5">
                        {time.split(" - ")[0]}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] font-medium truncate",
                          subject ? "" : "text-muted-foreground"
                        )}
                        style={subject ? { color: `hsl(${subject.color})` } : undefined}
                      >
                        {subject?.code || "—"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Subject Picker when slot selected */}
      {selectedSlot && (
        <div className="border-t border-border pt-3 pb-2 animate-slide-up">
          <p className="text-xs text-muted-foreground mb-2 px-1">
            Assign to {days[selectedSlot.day]} • {timeSlots[selectedSlot.timeSlot].split(" - ")[0]}
          </p>
          <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
            {enrolledSubjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => handleAssignSubject(subject.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: `hsl(${subject.color})` }}
                />
                <span className="text-xs font-medium">{subject.code}</span>
              </button>
            ))}
            <button
              onClick={() => handleAssignSubject(null)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-destructive/10 text-destructive transition-all"
            >
              <X className="w-3 h-3" />
              <span className="text-xs font-medium">Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-border mt-auto">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="h-11 rounded-xl text-sm"
          >
            Back
          </Button>
        )}
        {onCancel && !isOnboarding && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl text-sm"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          className="flex-1 h-11 rounded-xl text-sm"
        >
          <Check className="w-4 h-4 mr-1.5" />
          {isOnboarding ? "Finish Setup" : "Save"}
        </Button>
      </div>
    </div>
  );
}
