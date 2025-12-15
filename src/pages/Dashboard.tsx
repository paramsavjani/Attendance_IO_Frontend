import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { subjects, timeSlots, defaultTimetable } from "@/data/mockData";
import { format, addDays, subDays, isToday, isBefore, startOfDay } from "date-fns";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker";
import { ChevronLeft, ChevronRight, Lock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { student } = useAuth();
  const { subjectStats, subjectMinAttendance, todayAttendance, markAttendance, setSubjectMin } = useAttendance();
  
  const now = new Date();
  const currentHour = now.getHours();
  
  // Determine initial date - if all classes are done today, show tomorrow
  const getInitialDate = () => {
    const todaySchedule = getScheduleForDate(now);
    const lastClassHour = getLastClassHour(todaySchedule);
    
    // If current time is past the last class, show tomorrow
    if (lastClassHour !== null && currentHour >= lastClassHour + 1) {
      return addDays(now, 1);
    }
    return now;
  };
  
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate);

  // Get last class hour from schedule
  function getLastClassHour(schedule: { time: string; subject: any }[]) {
    const classesWithSubjects = schedule.filter(s => s.subject);
    if (classesWithSubjects.length === 0) return null;
    
    const lastClass = classesWithSubjects[classesWithSubjects.length - 1];
    const endTime = lastClass.time.split(" - ")[1];
    const hour = parseInt(endTime.split(":")[0]);
    // Handle PM times
    return hour < 8 ? hour + 12 : hour;
  }

  // Get schedule for any date
  function getScheduleForDate(date: Date) {
    const dayOfWeek = date.getDay();
    // Weekend - no classes
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return [];
    }
    
    const adjustedDay = dayOfWeek - 1; // Monday = 0
    const daySlots = defaultTimetable.filter((slot) => slot.day === adjustedDay);
    
    return daySlots.map((slot) => ({
      time: timeSlots[slot.timeSlot],
      subject: slot.subjectId ? subjects.find((s) => s.id === slot.subjectId) || null : null,
    }));
  }

  const schedule = useMemo(() => getScheduleForDate(selectedDate), [selectedDate]);
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const isSelectedToday = isToday(selectedDate);
  const isFutureDate = isBefore(startOfDay(now), startOfDay(selectedDate));
  const canMarkAttendance = isSelectedToday;

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((prev) => 
      direction === "prev" ? subDays(prev, 1) : addDays(prev, 1)
    );
  };

  const handleMarkAttendance = (index: number, subjectId: string, status: 'present' | 'absent') => {
    if (!canMarkAttendance) return;
    const slotKey = `${dateKey}-${index}`;
    markAttendance(subjectId, slotKey, status);
  };

  const goToToday = () => {
    setSelectedDate(now);
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="pt-2">
          <p className="text-muted-foreground text-xs">
            {format(now, "EEEE, MMM d")}
          </p>
          <h1 className="text-lg font-bold">
            Hi, {student?.name?.split(" ")[0]} {student?.name?.split(" ")[1]}
          </h1>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="today">Schedule</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4 space-y-4">
            {/* Date Navigation */}
            <div className="flex items-center justify-between bg-card rounded-xl border border-border p-3">
              <button
                onClick={() => navigateDate("prev")}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <p className="font-semibold text-sm">
                  {isSelectedToday ? "Today" : format(selectedDate, "EEEE")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(selectedDate, "MMM d, yyyy")}
                </p>
              </div>
              
              <button
                onClick={() => navigateDate("next")}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick "Go to Today" button if not viewing today */}
            {!isSelectedToday && (
              <button
                onClick={goToToday}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Go to Today
              </button>
            )}

            {/* Status Messages */}
            {isFutureDate && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Future date - Attendance marking will be available on this day
                </p>
              </div>
            )}

            {!isSelectedToday && !isFutureDate && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Past date - View only
                </p>
              </div>
            )}

            {/* Weekend message */}
            {schedule.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No classes on weekends</p>
                <p className="text-xs mt-1">Enjoy your day off!</p>
              </div>
            )}

            {/* Schedule */}
            <div className="space-y-2">
              {schedule.map((slot, index) => {
                if (!slot.subject) return null;
                
                const startHour = parseInt(slot.time.split(":")[0]);
                const isCurrent = isSelectedToday && startHour === currentHour;
                const slotKey = `${dateKey}-${index}`;
                const status = todayAttendance[slotKey] || null;

                return (
                  <AttendanceMarker
                    key={index}
                    subjectName={slot.subject.name}
                    subjectCode={slot.subject.code}
                    time={slot.time}
                    color={slot.subject.color}
                    isCurrent={isCurrent}
                    status={status}
                    onMarkPresent={() => handleMarkAttendance(index, slot.subject!.id, "present")}
                    onMarkAbsent={() => handleMarkAttendance(index, slot.subject!.id, "absent")}
                    disabled={!canMarkAttendance}
                  />
                );
              })}
            </div>

            {/* Auto-save indicator */}
            {canMarkAttendance && schedule.filter(s => s.subject).length > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Tap to mark attendance • Auto-saved
              </p>
            )}
          </TabsContent>

          <TabsContent value="subjects" className="mt-4 space-y-2">
            {subjects.map((subject) => {
              const stats = subjectStats[subject.id];
              if (!stats) return null;
              
              const minRequired = subjectMinAttendance[subject.id] || 75;

              return (
                <SubjectCard
                  key={subject.id}
                  name={subject.name}
                  code={subject.code}
                  color={subject.color}
                  present={stats.present}
                  absent={stats.absent}
                  total={stats.total}
                  minRequired={minRequired}
                  onMinChange={(val) => setSubjectMin(subject.id, val)}
                />
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
