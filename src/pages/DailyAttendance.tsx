import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { officialLastDate, defaultTimetable, subjects, timeSlots } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { format, isAfter, parseISO, subDays, addDays, isSameDay } from "date-fns";
import { Check, X, AlertTriangle, ChevronLeft, ChevronRight, Lock, } from "lucide-react";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker";

export default function DailyAttendance() {
  const { todayAttendance, markAttendance, subjectStatsToday, fetchAttendanceForDate } = useAttendance();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const today = new Date();
  const isLocked = !isAfter(selectedDate, parseISO(officialLastDate));
  const dayOfWeek = selectedDate.getDay();
  const adjustedDay = dayOfWeek === 0 || dayOfWeek === 6 ? -1 : dayOfWeek - 1;
  const dateKey = format(selectedDate, "yyyy-MM-dd");

  // Fetch attendance when date changes
  // We need to fetch specific date stats for the status (present/absent)
  // But we use subjectStatsToday for the percentage (cumulative)
  const isToday = isSameDay(selectedDate, today);
  const isFuture = isAfter(selectedDate, today);

  // Create a handler that also refetches data if needed when date changes
  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    const newDateKey = format(newDate, "yyyy-MM-dd");
    fetchAttendanceForDate(newDateKey);
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = direction === "prev" ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
    handleDateChange(newDate);
  };

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
    if (isFuture && status !== 'cancelled') return;
    markAttendance(subjectId, dateKey, status);
  };

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

        {/* Schedule */}
        {adjustedDay !== -1 && (
          <div className="space-y-2">
            {schedule.map((slot, index) => {
              if (!slot.subject) return null;
              const slotKey = `${dateKey}-${slot.subjectId}`;
              const currentStatus = todayAttendance[slotKey];

              // Use subjectStatsToday for cumulative percentage "till now"
              // irrespective of the selected date
              // Always show percentage, even if it's 0% or nothing is marked
              const stats = subjectStatsToday[slot.subjectId!];
              let attendancePercent = 0;
              if (stats && stats.total > 0) {
                attendancePercent = (stats.present / stats.total) * 100;
              }

              return (
                <AttendanceMarker
                  key={index}
                  subjectName={slot.subject.name}
                  subjectCode={slot.subject.code}
                  lecturePlace={slot.subject.lecturePlace}
                  time={slot.time}
                  color={slot.subject.color}
                  isCurrent={false} // Daily view doesn't show "LIVE" normally
                  status={currentStatus}
                  attendancePercent={attendancePercent}
                  onMarkPresent={() => handleMark(index, slot.subjectId!, "present")}
                  onMarkAbsent={() => handleMark(index, slot.subjectId!, "absent")}
                  onMarkCancelled={() => handleMark(index, slot.subjectId!, "cancelled")}
                  // Disable interaction if locked or future (except cancellation for future?)
                  // User said: "attendance percentage showing in future dates only" -> implies they want to see it everywhere.
                  // Actions logic:
                  disabled={isLocked || (isFuture && currentStatus !== 'cancelled')}
                  disablePresentAbsent={isFuture} // Only allow cancel in future
                />
              );
            })}
          </div>
        )}

        {/* No Save Button needed - auto save on click */}
        {adjustedDay !== -1 && !isLocked && !isFuture && (
          <p className="text-center text-xs text-muted-foreground">
            Tap to mark attendance • Auto-saved
          </p>
        )}
      </div>
    </AppLayout>
  );
}
