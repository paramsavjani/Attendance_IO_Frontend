import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { subjects, defaultTimetable, timeSlots, days } from "@/data/mockData";
import { TimetableSlot } from "@/types/attendance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw, Table2, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function Timetable() {
  const [timetable, setTimetable] = useState<TimetableSlot[]>(defaultTimetable);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; timeSlot: number } | null>(
    null
  );
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
    toast.success("Timetable reset to default");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Timetable</h1>
            <p className="text-muted-foreground">
              Manage your weekly class schedule
            </p>
          </div>
          <Button variant="outline" onClick={handleRegenerate} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset to Default
          </Button>
        </div>

        {/* Subject Legend */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Table2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Subject Colors</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: `hsl(${subject.color})` }}
                />
                <span className="text-xs text-muted-foreground">
                  {subject.code}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="glass-card rounded-xl p-4 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="p-3 text-left text-sm font-medium text-muted-foreground">
                  Time
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-center text-sm font-medium text-muted-foreground"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, timeIndex) => (
                <tr key={time} className="border-t border-border/50">
                  <td className="p-3 text-sm text-muted-foreground font-mono whitespace-nowrap">
                    {time}
                  </td>
                  {days.map((_, dayIndex) => {
                    const subject = getSlotSubject(dayIndex, timeIndex);
                    return (
                      <td key={dayIndex} className="p-2">
                        <button
                          onClick={() => handleSlotClick(dayIndex, timeIndex)}
                          className={cn(
                            "w-full h-16 rounded-lg transition-all duration-200 flex items-center justify-center text-xs font-medium",
                            subject
                              ? "hover:opacity-80"
                              : "bg-muted/30 hover:bg-muted/50 border border-dashed border-border text-muted-foreground"
                          )}
                          style={
                            subject
                              ? {
                                  backgroundColor: `hsl(${subject.color} / 0.2)`,
                                  borderColor: `hsl(${subject.color} / 0.3)`,
                                  borderWidth: "1px",
                                  borderStyle: "solid",
                                  color: `hsl(${subject.color})`,
                                }
                              : undefined
                          }
                        >
                          {subject ? (
                            <div className="text-center px-2">
                              <div className="font-semibold truncate">{subject.code}</div>
                            </div>
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Assignment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedSlot
                  ? `${days[selectedSlot.day]} - ${timeSlots[selectedSlot.timeSlot]}`
                  : "Assign Subject"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-2">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleAssignSubject(subject.id)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                  >
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: `hsl(${subject.color})` }}
                    />
                    <div>
                      <div className="font-medium text-sm">{subject.name}</div>
                      <div className="text-xs text-muted-foreground">{subject.code}</div>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={() => handleAssignSubject(null)}
              >
                <X className="w-4 h-4" />
                Clear Slot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
