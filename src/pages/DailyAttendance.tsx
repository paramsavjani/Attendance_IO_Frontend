import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/attendance/StatusBadge";
import { AttendanceStatus } from "@/types/attendance";
import { getTodaySchedule, officialLastDate } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isAfter, parseISO } from "date-fns";
import { Check, X, Calendar, AlertTriangle, Lock, Save, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export default function DailyAttendance() {
  const schedule = getTodaySchedule();
  const today = new Date();
  const isLocked = !isAfter(today, parseISO(officialLastDate));

  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus | null>>(
    schedule.slots.reduce((acc, _, index) => ({ ...acc, [index]: null }), {})
  );

  const handleMark = (slotIndex: number, status: AttendanceStatus) => {
    if (!schedule.slots[slotIndex].subject) return;
    setAttendance((prev) => ({
      ...prev,
      [slotIndex]: prev[slotIndex] === status ? null : status,
    }));
  };

  const handleSave = () => {
    const marked = Object.values(attendance).filter((v) => v !== null).length;
    const total = schedule.slots.filter((s) => s.subject !== null).length;
    
    if (marked === 0) {
      toast.error("Please mark attendance for at least one class");
      return;
    }
    
    toast.success(`Attendance saved for ${marked} of ${total} classes`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Daily Tracking</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {format(today, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Attendance
          </Button>
        </div>

        {/* Lock Notice */}
        {isLocked && (
          <div className="glass-card rounded-xl p-4 border-warning/30 bg-warning/5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                Today's date is before the official attendance cutoff
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Attendance before {format(parseISO(officialLastDate), "MMMM d, yyyy")} is
                finalized by the institute. You can only track attendance after this date.
              </p>
            </div>
          </div>
        )}

        {/* Schedule Cards */}
        <div className="space-y-3">
          {schedule.slots.map((slot, index) => {
            const currentAttendance = attendance[index];
            const hasSubject = slot.subject !== null;

            return (
              <div
                key={index}
                className={cn(
                  "glass-card rounded-xl p-5 transition-all duration-300 animate-slide-up",
                  !hasSubject && "opacity-50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Time & Subject */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-muted-foreground font-mono">
                        {slot.time}
                      </span>
                      {isLocked && (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {slot.subject ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: `hsl(${slot.subject.color})` }}
                        />
                        <span className="font-medium">{slot.subject.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({slot.subject.code})
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">No class scheduled</span>
                    )}
                  </div>

                  {/* Status Badge (if marked) */}
                  {currentAttendance && (
                    <StatusBadge status={currentAttendance} size="md" />
                  )}

                  {/* Action Buttons */}
                  {hasSubject && !isLocked && (
                    <div className="flex gap-2">
                      <Button
                        variant={currentAttendance === "present" ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "gap-1.5",
                          currentAttendance === "present" &&
                            "bg-success hover:bg-success/90 border-success"
                        )}
                        onClick={() => handleMark(index, "present")}
                      >
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Present</span>
                      </Button>
                      <Button
                        variant={currentAttendance === "absent" ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "gap-1.5",
                          currentAttendance === "absent" &&
                            "bg-destructive hover:bg-destructive/90 border-destructive"
                        )}
                        onClick={() => handleMark(index, "absent")}
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Absent</span>
                      </Button>
                      <Button
                        variant={currentAttendance === "leave" ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "gap-1.5",
                          currentAttendance === "leave" &&
                            "bg-warning hover:bg-warning/90 border-warning text-warning-foreground"
                        )}
                        onClick={() => handleMark(index, "leave")}
                      >
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Leave</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
