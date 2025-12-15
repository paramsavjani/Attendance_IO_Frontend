import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { subjects, timeSlots, defaultTimetable } from "@/data/mockData";
import { format, addDays, subDays, isToday, isBefore, startOfDay, isTomorrow } from "date-fns";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker";
import { ChevronLeft, ChevronRight, Lock, CalendarSearch, CalendarDays, Sun, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { student } = useAuth();
  const { subjectStats, subjectMinAttendance, todayAttendance, markAttendance, setSubjectMin } = useAttendance();
  
  const now = new Date();
  const currentHour = now.getHours();
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Get last class hour from schedule
  function getLastClassHour(schedule: { time: string; subject: any }[]) {
    const classesWithSubjects = schedule.filter(s => s.subject);
    if (classesWithSubjects.length === 0) return null;
    
    const lastClass = classesWithSubjects[classesWithSubjects.length - 1];
    const endTime = lastClass.time.split(" - ")[1];
    const hour = parseInt(endTime.split(":")[0]);
    return hour < 8 ? hour + 12 : hour;
  }

  // Get schedule for any date
  function getScheduleForDate(date: Date) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];
    
    const adjustedDay = dayOfWeek - 1;
    const daySlots = defaultTimetable.filter((slot) => slot.day === adjustedDay);
    
    return daySlots.map((slot) => ({
      time: timeSlots[slot.timeSlot],
      subject: slot.subjectId ? subjects.find((s) => s.id === slot.subjectId) || null : null,
    }));
  }

  // Determine if showing tomorrow's schedule
  const todaySchedule = getScheduleForDate(now);
  const lastClassHour = getLastClassHour(todaySchedule);
  const showingTomorrowByDefault = lastClassHour !== null && currentHour >= lastClassHour + 1;
  
  const [selectedDate, setSelectedDate] = useState<Date>(() => 
    showingTomorrowByDefault ? addDays(now, 1) : now
  );

  const schedule = useMemo(() => getScheduleForDate(selectedDate), [selectedDate]);
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const isSelectedToday = isToday(selectedDate);
  const isSelectedTomorrow = isTomorrow(selectedDate);
  const isFutureDate = isBefore(startOfDay(now), startOfDay(selectedDate));
  const canMarkAttendance = isSelectedToday;

  // Calculate if a subject needs attention (below minimum requirement)
  const getSubjectAttendanceInfo = (subjectId: string) => {
    const stats = subjectStats[subjectId];
    const minRequired = subjectMinAttendance[subjectId] || 75;
    
    if (!stats || stats.total === 0) {
      return { percent: 0, needsAttention: false };
    }
    
    const percent = (stats.present / stats.total) * 100;
    const needsAttention = percent < minRequired;
    
    return { percent, needsAttention };
  };

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

  const goToToday = () => setSelectedDate(now);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const getGreeting = () => {
    if (currentHour < 12) return "Good morning";
    if (currentHour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-4">
        {/* Header */}
        <div className="pt-3">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {format(now, "EEEE, MMM d")}
          </p>
          <h1 className="text-xl font-bold mt-1">
            {getGreeting()}, {student?.name?.split(" ")[0]}
          </h1>
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 rounded-2xl h-12">
            <TabsTrigger 
              value="schedule" 
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="subjects"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium"
            >
              Subjects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-5 space-y-4">
            {/* Date Navigation Card */}
            <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateDate("prev")}
                  className="w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {isSelectedToday && <Sun className="w-4 h-4 text-warning" />}
                    {isSelectedTomorrow && <Sunrise className="w-4 h-4 text-primary" />}
                    <p className="font-bold text-base">
                      {isSelectedToday ? "Today" : isSelectedTomorrow ? "Tomorrow" : format(selectedDate, "EEEE")}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </p>
                </div>
                
                <button
                  onClick={() => navigateDate("next")}
                  className="w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors active:scale-95"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-center gap-2 rounded-xl border-border/50 bg-card h-11"
                  >
                    <CalendarSearch className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Find date</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {!isSelectedToday && (
                <Button
                  onClick={goToToday}
                  className="gap-2 rounded-xl h-11 px-5"
                >
                  <Sun className="w-4 h-4" />
                  Today
                </Button>
              )}
            </div>

            {/* Tomorrow's Schedule Notice */}
            {isSelectedTomorrow && showingTomorrowByDefault && (
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sunrise className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tomorrow's Schedule</p>
                  <p className="text-xs text-muted-foreground">
                    Today's classes are complete. Showing tomorrow's timetable.
                  </p>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {isFutureDate && !isSelectedTomorrow && (
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Attendance marking will be available on this day
                </p>
              </div>
            )}

            {!isSelectedToday && !isFutureDate && (
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Past date — View only mode
                </p>
              </div>
            )}

            {/* Weekend */}
            {schedule.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-semibold text-muted-foreground">No classes</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Enjoy your day off!</p>
              </div>
            )}

            {/* Schedule List */}
            <div className="space-y-3">
              {schedule.map((slot, index) => {
                if (!slot.subject) return null;
                
                const startHour = parseInt(slot.time.split(":")[0]);
                const isCurrent = isSelectedToday && startHour === currentHour;
                const slotKey = `${dateKey}-${index}`;
                const status = todayAttendance[slotKey] || null;
                const { percent, needsAttention } = getSubjectAttendanceInfo(slot.subject.id);

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
                    needsAttention={isFutureDate && needsAttention}
                    attendancePercent={isFutureDate ? percent : undefined}
                  />
                );
              })}
            </div>

            {/* Auto-save indicator */}
            {canMarkAttendance && schedule.filter(s => s.subject).length > 0 && (
              <p className="text-center text-xs text-muted-foreground pt-2">
                Tap to mark attendance • Auto-saved
              </p>
            )}
          </TabsContent>

          <TabsContent value="subjects" className="mt-5 space-y-3">
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
