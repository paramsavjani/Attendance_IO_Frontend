import { useState, useEffect, useMemo } from "react";
import { useAttendance } from "@/contexts/AttendanceContext";
import { timeSlots } from "@/data/mockData";
import { Radio, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface LiveLectureIndicatorProps {
  isSticky?: boolean;
  className?: string;
}

export function LiveLectureIndicator({ isSticky = true, className }: LiveLectureIndicatorProps) {
  const { enrolledSubjects, timetable, todayAttendance } = useAttendance();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get live lecture
  const liveLecture = useMemo(() => {
    const now = currentTime;
    const dayOfWeek = now.getDay();
    
    // No classes on weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) return null;

    const adjustedDay = dayOfWeek - 1;
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // Find current slot based on time
    const currentSlotIndex = timeSlots.findIndex((time) => {
      const [startTime, endTime] = time.split(" - ");
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      
      // Convert to 24h format if needed
      const startHour24 = startHour < 8 ? startHour + 12 : startHour;
      const endHour24 = endHour < 8 ? endHour + 12 : endHour;
      
      const startTotalMinutes = startHour24 * 60 + startMin;
      const endTotalMinutes = endHour24 * 60 + endMin;
      const currentTotalMinutes = currentHour * 60 + currentMinutes;

      return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
    });

    if (currentSlotIndex === -1) return null;

    // Find subject for this slot
    const slot = timetable.find(
      (s) => s.day === adjustedDay && s.timeSlot === currentSlotIndex
    );

    if (!slot?.subjectId) return null;

    const subject = enrolledSubjects.find((s) => s.id === slot.subjectId);
    if (!subject) return null;

    // Check if attendance is already marked
    const dateKey = format(now, "yyyy-MM-dd");
    const slotKey = `${dateKey}-${subject.id}`;
    const attendanceStatus = todayAttendance[slotKey] || null;

    // Calculate time remaining
    const timeSlot = timeSlots[currentSlotIndex];
    const [, endTime] = timeSlot.split(" - ");
    const [endHour, endMin] = endTime.split(":").map(Number);
    const endHour24 = endHour < 8 ? endHour + 12 : endHour;
    const endTotalMinutes = endHour24 * 60 + endMin;
    const currentTotalMinutes = currentHour * 60 + currentMinutes;
    const minutesRemaining = endTotalMinutes - currentTotalMinutes;

    return {
      subject,
      timeSlot,
      slotIndex: currentSlotIndex,
      attendanceStatus,
      minutesRemaining,
    };
  }, [currentTime, timetable, enrolledSubjects, todayAttendance]);

  if (!liveLecture) return null;

  const { subject, timeSlot, attendanceStatus, minutesRemaining } = liveLecture;

  return (
    <div
      className={cn(
        "z-40 transition-all duration-300",
        isSticky && "sticky top-0 md:relative",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 p-[1px]">
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite] opacity-60" />
        
        <div className="relative bg-card/95 backdrop-blur-xl rounded-[11px] p-3">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl" />
          
          <div className="relative flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex-shrink-0">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15">
                <Radio className="w-5 h-5 text-primary" />
                {/* Pulsing ring */}
                <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-ping opacity-30" />
                <div className="absolute inset-0 rounded-xl border border-primary/30" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Live Now
                </span>
                {attendanceStatus && (
                  <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                    attendanceStatus === 'present' && "bg-emerald-500/20 text-emerald-500",
                    attendanceStatus === 'absent' && "bg-destructive/20 text-destructive",
                    attendanceStatus === 'cancelled' && "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {attendanceStatus === 'present' ? 'Marked Present' : 
                     attendanceStatus === 'absent' ? 'Marked Absent' : 'Cancelled'}
                  </span>
                )}
              </div>
              
              <h3 className="font-semibold text-sm truncate">{subject.name}</h3>
              
              <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                <div className="flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>{timeSlot}</span>
                </div>
                {subject.lecturePlace && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">{subject.lecturePlace}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[11px] text-primary font-medium ml-auto">
                  <span>{minutesRemaining} min left</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
