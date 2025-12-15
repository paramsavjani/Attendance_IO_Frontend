import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { subjects, defaultTimetable, timeSlots, days } from "@/data/mockData";
import { TimetableSlot } from "@/types/attendance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, X, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Timetable() {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<TimetableSlot[]>(defaultTimetable);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; timeSlot: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const getSlotSubject = (day: number, timeSlot: number) => {
    const slot = timetable.find((s) => s.day === day && s.timeSlot === timeSlot);
    if (slot?.subjectId) {
      return subjects.find((s) => s.id === slot.subjectId);
    }
    return null;
  };

  const handleSlotClick = (day: number, timeSlot: number) => {
    setSelectedSlot({ day, timeSlot });
    setDialogOpen(true);
  };

  const handleAssignSubject = (subjectId: string | null) => {
    if (!selectedSlot) return;

    setTimetable((prev) =>
      prev.map((slot) =>
        slot.day === selectedSlot.day && slot.timeSlot === selectedSlot.timeSlot
          ? { ...slot, subjectId }
          : slot
      )
    );

    setDialogOpen(false);
    toast.success(subjectId ? "Subject assigned" : "Slot cleared");
  };

  const handleRegenerate = () => {
    setTimetable(defaultTimetable);
    toast.success("Timetable reset");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Timetable</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleRegenerate} className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        {/* Days as tabs */}
        {days.map((day, dayIndex) => (
          <div key={day} className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">{day}</h3>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.slice(0, 6).map((time, timeIndex) => {
                const subject = getSlotSubject(dayIndex, timeIndex);
                return (
                  <button
                    key={timeIndex}
                    onClick={() => handleSlotClick(dayIndex, timeIndex)}
                    className={cn(
                      "p-3 rounded-xl text-left transition-all",
                      subject
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
                    <p className="text-[10px] text-muted-foreground mb-1">
                      {time.split(" - ")[0]}
                    </p>
                    <p className={cn(
                      "text-xs font-medium truncate",
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
          </div>
        ))}

        {/* Assignment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="text-base">
                {selectedSlot
                  ? `${days[selectedSlot.day]} • ${timeSlots[selectedSlot.timeSlot].split(" - ")[0]}`
                  : "Assign Subject"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 pt-2">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => handleAssignSubject(subject.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border active:scale-98 transition-all text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${subject.color})` }}
                  />
                  <span className="text-sm font-medium">{subject.name}</span>
                </button>
              ))}

              <Button
                variant="ghost"
                className="w-full gap-2 text-destructive"
                onClick={() => handleAssignSubject(null)}
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
