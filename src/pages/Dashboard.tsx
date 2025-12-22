import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { timeSlots } from "@/data/mockData";
import { format, addDays, subDays, isToday, isBefore, startOfDay, isTomorrow, parseISO } from "date-fns";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { AttendanceMarker, AttendanceMarkerSkeleton } from "@/components/attendance/AttendanceMarker";
import { EmptySlot } from "@/components/attendance/EmptySlot";
import { ChevronLeft, ChevronRight, Lock, CalendarSearch, CalendarDays, Sun, Sunrise, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { API_CONFIG } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const { student } = useAuth();
  const { enrolledSubjects, timetable, subjectStats, subjectStatsToday, subjectMinAttendance, todayAttendance, markAttendance, setSubjectMin, fetchAttendanceForDate, isLoadingAttendance, savingState } = useAttendance();
  
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

  // Get schedule for any date - always returns 5 fixed slots
  function getScheduleForDate(date: Date) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];
    
    const adjustedDay = dayOfWeek - 1;
    const daySlots = timetable.filter((slot) => slot.day === adjustedDay);
    
    // Always return 5 fixed slots based on timeSlots array
    return timeSlots.map((time, slotIndex) => {
      const slot = daySlots.find(s => s.timeSlot === slotIndex);
      return {
        time,
        slotIndex,
        subject: slot?.subjectId ? enrolledSubjects.find((s) => s.id === slot.subjectId) || null : null,
      };
    });
  }

  // Determine if showing tomorrow's schedule
  const todaySchedule = getScheduleForDate(now);
  const lastClassHour = getLastClassHour(todaySchedule);
  const showingTomorrowByDefault = lastClassHour !== null && currentHour >= lastClassHour + 1;
  
  const [selectedDate, setSelectedDate] = useState<Date>(() => 
    showingTomorrowByDefault ? addDays(now, 1) : now
  );
  const [classesStartDate, setClassesStartDate] = useState<Date | null>(null);

  // Fetch classes start date
  useEffect(() => {
    fetch(API_CONFIG.ENDPOINTS.CLASSES_START_DATE, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (data.startDate) {
          setClassesStartDate(parseISO(data.startDate));
        }
      })
      .catch(err => {
        console.error('Error fetching classes start date:', err);
      });
  }, []);

  const schedule = useMemo(() => getScheduleForDate(selectedDate), [selectedDate, timetable, enrolledSubjects]);
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  const isSelectedToday = isToday(selectedDate);
  const isSelectedTomorrow = isTomorrow(selectedDate);
  const isFutureDate = isBefore(startOfDay(now), startOfDay(selectedDate));
  const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(now));
  const isBeforeStartDate = classesStartDate ? isBefore(startOfDay(selectedDate), startOfDay(classesStartDate)) : false;
  const canMarkAttendance = true; // Allow marking for any date

  // Calculate if a subject needs attention (below minimum requirement)
  // Always use today's stats to show final attendance up to now
  const getSubjectAttendanceInfo = (subjectId: string) => {
    const stats = subjectStatsToday[subjectId];
    const minRequired = subjectMinAttendance[subjectId] || 75;
    
    // Always calculate percentage, even if stats don't exist or total is 0
    let percent = 0;
    if (stats && stats.total > 0) {
      percent = (stats.present / stats.total) * 100;
    }
    
    const needsAttention = percent < minRequired;
    
    return { percent, needsAttention };
  };

  const navigateDate = (direction: "prev" | "next") => {
    setSelectedDate((prev) => 
      direction === "prev" ? subDays(prev, 1) : addDays(prev, 1)
    );
  };

  const [showPastDateWarning, setShowPastDateWarning] = useState(false);
  const [pendingAttendance, setPendingAttendance] = useState<{subjectId: string; status: 'present' | 'absent' | 'cancelled'} | null>(null);

  // Fetch attendance when date changes
  useEffect(() => {
    fetchAttendanceForDate(dateKey);
  }, [dateKey, fetchAttendanceForDate]);

  const handleMarkAttendance = async (index: number, subjectId: string, status: 'present' | 'absent' | 'cancelled') => {
    // For future dates: only allow "cancelled", block "present" and "absent"
    if (isFutureDate) {
      if (status === 'cancelled') {
        // Allow marking cancelled for future dates
        await markAttendance(subjectId, dateKey, status);
      } else {
        // Block present/absent for future dates
        toast.error("You can only mark lectures as 'cancelled' for future dates");
      }
      return;
    }

    // Show warning for past dates
    if (isPastDate) {
      setPendingAttendance({ subjectId, status });
      setShowPastDateWarning(true);
      return;
    }
    
    // For today, mark directly
    await markAttendance(subjectId, dateKey, status);
  };

  const confirmPastDateAttendance = async () => {
    if (pendingAttendance) {
      await markAttendance(pendingAttendance.subjectId, dateKey, pendingAttendance.status);
      setPendingAttendance(null);
    }
    setShowPastDateWarning(false);
  };

  const goToToday = () => setSelectedDate(now);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-3 pb-4">
        {/* Compact Header with Date */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
              {format(now, "EEEE, MMM d")}
            </p>
            <h1 className="text-lg font-bold">
              Hi, {student?.name?.split(" ")[0]} {student?.name?.split(" ")[1]}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button className="w-9 h-9 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors">
                  <CalendarSearch className="w-4 h-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="end">
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
              <button
                onClick={goToToday}
                className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Sun className="w-3.5 h-3.5" />
                Today
              </button>
            )}
          </div>
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-0.5 rounded-xl h-9">
            <TabsTrigger 
              value="schedule" 
              className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium"
            >
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
              Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="subjects"
              className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium"
            >
              Subjects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-3 space-y-3">
            {/* Inline Date Navigation */}
            <div className="flex items-center justify-between bg-card/50 rounded-xl px-2 py-0.5 border border-border/30">
              <button
                onClick={() => navigateDate("prev")}
                className="w-8 h-8 rounded-lg hover:bg-secondary/50 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="text-center flex items-center gap-2">
                {isSelectedToday && <Sun className="w-3.5 h-3.5 text-warning" />}
                {isSelectedTomorrow && <Sunrise className="w-3.5 h-3.5 text-primary" />}
                <span className="font-semibold text-sm">
                  {isSelectedToday ? "Today" : isSelectedTomorrow ? "Tomorrow" : format(selectedDate, "EEE, MMM d")}
                </span>
              </div>
              
              <button
                onClick={() => navigateDate("next")}
                className="w-8 h-8 rounded-lg hover:bg-secondary/50 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Compact Notice */}
            {isSelectedTomorrow && showingTomorrowByDefault && (
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-xl border border-primary/20">
                <Sunrise className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Today's done — showing tomorrow's schedule
                </p>
              </div>
            )}

            {isFutureDate && !isSelectedTomorrow && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-xl border border-border/30">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Future date - You can only mark lectures as "cancelled"
                </p>
              </div>
            )}

            {isBeforeStartDate && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Sun className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-sm text-muted-foreground">Enjoy vacation</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Classes start on {classesStartDate ? format(classesStartDate, "MMM d, yyyy") : ""}
                </p>
              </div>
            )}

            {!isBeforeStartDate && !isSelectedToday && !isFutureDate && (
              <div className="flex items-center justify-center gap-2 px-3 py-2 bg-muted/30 rounded-xl border border-border/30">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">Past date</p>
              </div>
            )}

            {!isBeforeStartDate && schedule.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-sm text-muted-foreground">No classes</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Enjoy your day off!</p>
              </div>
            )}

            {/* Schedule List - Always 5 fixed slots */}
            {!isBeforeStartDate && (
            <div className="space-y-2">
              {isLoadingAttendance && schedule.length > 0 ? (
                // Show skeleton loaders while loading attendance data
                schedule.map((slot, index) => (
                  slot.subject ? (
                    <AttendanceMarkerSkeleton key={index} />
                  ) : (
                    <EmptySlot key={index} time={slot.time} slotNumber={slot.slotIndex + 1} />
                  )
                ))
              ) : (
                schedule.map((slot, index) => {
                  // Empty slot - no subject
                  if (!slot.subject) {
                    return <EmptySlot key={index} time={slot.time} slotNumber={slot.slotIndex + 1} />;
                  }
                  
                  const startHour = parseInt(slot.time.split(":")[0]);
                  const isCurrent = isSelectedToday && startHour === currentHour;
                  const slotKey = `${dateKey}-${slot.subject.id}`;
                  const status = todayAttendance[slotKey] || null;
                  const { percent, needsAttention } = getSubjectAttendanceInfo(slot.subject.id);

                  return (
                    <AttendanceMarker
                      key={index}
                      subjectName={slot.subject.name}
                      lecturePlace={slot.subject.lecturePlace}
                      time={slot.time}
                      color={slot.subject.color}
                      isCurrent={isCurrent}
                      status={status}
                      onMarkPresent={() => handleMarkAttendance(index, slot.subject!.id, "present")}
                      onMarkAbsent={() => handleMarkAttendance(index, slot.subject!.id, "absent")}
                      onMarkCancelled={() => handleMarkAttendance(index, slot.subject!.id, "cancelled")}
                      disabled={!canMarkAttendance}
                      disablePresentAbsent={isFutureDate} // Disable present/absent for future dates
                      needsAttention={needsAttention}
                      attendancePercent={percent}
                      savingAction={savingState?.subjectId === slot.subject.id ? savingState.action : null}
                    />
                  );
                })
              )}
            </div>
            )}

          </TabsContent>

          <TabsContent value="subjects" className="mt-3 space-y-2">
            {enrolledSubjects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No subjects enrolled</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Enroll in subjects to see them here</p>
              </div>
            ) : (
              enrolledSubjects.map((subject) => {
                // Always use today's stats for Subjects tab, regardless of selected date
                const stats = subjectStatsToday[subject.id] || { 
                  subjectId: subject.id, 
                  present: 0, 
                  absent: 0, 
                  total: 0 
                };
                const minRequired = subjectMinAttendance[subject.id] || subject.minimumCriteria || 75;

                return (
                  <SubjectCard
                    key={subject.id}
                    name={subject.name}
                    lecturePlace={subject.lecturePlace}
                    color={subject.color}
                    present={stats.present}
                    absent={stats.absent}
                    total={stats.total}
                    minRequired={minRequired}
                    onMinChange={(val) => setSubjectMin(subject.id, val)}
                  />
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Past Date Warning Dialog */}
      <AlertDialog open={showPastDateWarning} onOpenChange={setShowPastDateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Past Date Attendance?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update attendance for a past date ({format(selectedDate, "MMM d, yyyy")}). 
              This will modify historical records. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAttendance(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPastDateAttendance}>
              Yes, Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
