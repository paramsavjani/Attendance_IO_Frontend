import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AttendanceStatus } from "@/types/attendance";
import { getTodaySchedule, officialLastDate, defaultTimetable, subjects, timeSlots } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isAfter, parseISO, subDays, addDays, isSameDay } from "date-fns";
import { Check, X, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { toast } from "sonner";

export default function DailyAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const today = new Date();
  const isLocked = !isAfter(selectedDate, parseISO(officialLastDate));
  const dayOfWeek = selectedDate.getDay();
  const adjustedDay = dayOfWeek === 0 || dayOfWeek === 6 ? -1 : dayOfWeek - 1;

  const getScheduleForDate = () => {
    if (adjustedDay === -1) return [];
    const daySlots = defaultTimetable.filter((slot) => slot.day === adjustedDay);
    return daySlots.map((slot) => ({
      time: timeSlots[slot.timeSlot],
      subject: slot.subjectId ? subjects.find((s) => s.id === slot.subjectId) || null : null,
    }));
  };

  const schedule = getScheduleForDate();

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus | null>>({});

  const handleMark = (slotKey: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [slotKey]: prev[slotKey] === status ? null : status,
    }));
  };

  const handleSave = () => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const marked = Object.keys(attendance).filter(
      (key) => key.startsWith(dateKey) && attendance[key] !== null
    ).length;

    if (marked === 0) {
      toast.error("Mark at least one class");
      return;
    }

    toast.success(`Saved for ${format(selectedDate, "MMM d")}`);
  };

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((prev) => 
      direction === "prev" ? subDays(prev, 1) : addDays(prev, 1)
    );
  };

  const isToday = isSameDay(selectedDate, today);
  const isFuture = isAfter(selectedDate, today);

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Date Picker */}
        <div className="flex items-center justify-between bg-card rounded-2xl p-3 border border-border">
          <button
            onClick={() => navigateDate("prev")}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-semibold">{format(selectedDate, "EEEE")}</p>
            <p className="text-sm text-muted-foreground">{format(selectedDate, "MMM d, yyyy")}</p>
          </div>
          <button
            onClick={() => navigateDate("next")}
            disabled={isFuture}
            className={cn(
              "p-2 hover:bg-muted rounded-xl transition-colors",
              isFuture && "opacity-30"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Notice */}
        {isLocked && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 text-warning text-sm">
            <Lock className="w-4 h-4" />
            <span>Official data till {format(parseISO(officialLastDate), "MMM d")}</span>
          </div>
        )}

        {/* Weekend Notice */}
        {adjustedDay === -1 && (
          <div className="text-center py-10 text-muted-foreground">
            No classes on weekends
          </div>
        )}

        {/* Schedule */}
        {adjustedDay !== -1 && (
          <div className="space-y-2">
            {schedule.map((slot, index) => {
              if (!slot.subject) return null;
              const slotKey = `${format(selectedDate, "yyyy-MM-dd")}-${index}`;
              const currentStatus = attendance[slotKey];

              return (
                <div
                  key={index}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-1.5 h-8 rounded-full"
                      style={{ backgroundColor: `hsl(${slot.subject.color})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{slot.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{slot.time}</p>
                    </div>
                  </div>

                  {!isLocked ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMark(slotKey, "present")}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95",
                          currentStatus === "present"
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Check className="w-4 h-4" />
                        Present
                      </button>
                      <button
                        onClick={() => handleMark(slotKey, "absent")}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95",
                          currentStatus === "absent"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <X className="w-4 h-4" />
                        Absent
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      Locked by official data
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Save Button */}
        {adjustedDay !== -1 && !isLocked && (
          <Button onClick={handleSave} className="w-full py-6 text-base rounded-xl">
            Save Attendance
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
