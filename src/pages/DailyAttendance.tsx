import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { officialLastDate, defaultTimetable, subjects, timeSlots } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { format, isAfter, parseISO, subDays, addDays, isSameDay } from "date-fns";
import { Check, X, AlertTriangle, ChevronLeft, ChevronRight, Lock,  } from "lucide-react";
import { useAttendance } from "@/contexts/AttendanceContext";

export default function DailyAttendance() {
  const { todayAttendance, markAttendance } = useAttendance();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const today = new Date();
  const isLocked = !isAfter(selectedDate, parseISO(officialLastDate));
  const dayOfWeek = selectedDate.getDay();
  const adjustedDay = dayOfWeek === 0 || dayOfWeek === 6 ? -1 : dayOfWeek - 1;
  const dateKey = format(selectedDate, "yyyy-MM-dd");

  const getScheduleForDate = () => {
    if (adjustedDay === -1) return [];
    const daySlots = defaultTimetable.filter((slot) => slot.day === adjustedDay);
    return daySlots.map((slot) => ({
      time: timeSlots[slot.timeSlot],
      subject: slot.subjectId ? subjects.find((s) => s.id === slot.subjectId) || null : null,
      subjectId: slot.subjectId,
    }));
  };

  const schedule = getScheduleForDate();

  const handleMark = (index: number, subjectId: string, status: 'present' | 'absent' | 'cancelled') => {
    if (isFuture) return;
    markAttendance(subjectId, dateKey, status);
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
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "MMM d, yyyy")}
              {isToday && <span className="ml-1 text-primary">(Today)</span>}
            </p>
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

        {/* Future Date Notice */}
        {isFuture && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>You can’t mark attendance for future dates</span>
          </div>
        )}

        {/* Schedule - One-click save */}
        {adjustedDay !== -1 && (
          <div className="space-y-2">
            {schedule.map((slot, index) => {
              if (!slot.subject) return null;
              const slotKey = `${dateKey}-${slot.subjectId}`;
              const currentStatus = todayAttendance[slotKey];

              return (
                <div
                  key={index}
                  className="bg-card rounded-2xl border border-border overflow-hidden"
                >
                  <div className="flex items-stretch">
                    {/* Color bar */}
                    <div
                      className="w-1.5"
                      style={{ backgroundColor: `hsl(${slot.subject.color})` }}
                    />
                    
                    {/* Content */}
                    <div className="flex-1 p-3">
                      <p className="font-medium text-sm">{slot.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{slot.time}</p>
                    </div>

                    {/* Action buttons - one click auto-save */}
                    {!isLocked && !isFuture && (
                      <div className="flex items-stretch border-l border-border">
                        <button
                          onClick={() => handleMark(index, slot.subjectId!, "present")}
                          className={cn(
                            "w-16 flex items-center justify-center gap-1 transition-all text-sm font-medium",
                            currentStatus === "present"
                              ? "bg-success text-success-foreground"
                              : "hover:bg-success/10 text-success"
                          )}
                        >
                          <Check className="w-4 h-4" />
                          {currentStatus === "present" && <span className="text-xs">P</span>}
                        </button>
                        <button
                          onClick={() => handleMark(index, slot.subjectId!, "absent")}
                          className={cn(
                            "w-16 flex items-center justify-center gap-1 transition-all text-sm font-medium border-l border-border",
                            currentStatus === "absent"
                              ? "bg-destructive text-destructive-foreground"
                              : "hover:bg-destructive/10 text-destructive"
                          )}
                        >
                          <X className="w-4 h-4" />
                          {currentStatus === "absent" && <span className="text-xs">A</span>}
                        </button>
                        <button
                          onClick={() => handleMark(index, slot.subjectId!, "cancelled")}
                          className={cn(
                            "w-16 flex items-center justify-center gap-1 transition-all text-sm font-medium border-l border-border",
                            currentStatus === "cancelled"
                              ? "bg-yellow-500 text-black"
                              : "hover:bg-yellow-500/10 text-yellow-500"
                          )}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          {currentStatus === "cancelled" && <span className="text-xs">C</span>}
                        </button>
                      </div>
                    )}

                    {(isLocked || isFuture) && (
                      <div className="flex items-center px-4 text-muted-foreground">
                        {isFuture ? <AlertTriangle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No Save Button needed - auto save on click */}
        {adjustedDay !== -1 && !isLocked && (
          <p className="text-center text-xs text-muted-foreground">
            Tap to mark attendance • Auto-saved
          </p>
        )}
      </div>
    </AppLayout>
  );
}
