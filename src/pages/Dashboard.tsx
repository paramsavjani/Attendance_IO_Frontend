import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { timeSlots } from "@/data/mockData";
import { format, addDays, subDays, isToday, isBefore, startOfDay, isTomorrow, parseISO } from "date-fns";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { ChevronLeft, ChevronRight, Lock, CalendarSearch, Sun, Sunrise, Loader2, Check, X, Ban, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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

// Swipe navigation hook
function useSwipeNavigation(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      onSwipeLeft(); // Navigate to next day
    } else if (isRightSwipe) {
      onSwipeRight(); // Navigate to previous day
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

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

  const navigateDate = useCallback((direction: "prev" | "next") => {
    setSelectedDate((prev) => 
      direction === "prev" ? subDays(prev, 1) : addDays(prev, 1)
    );
  }, []);

  // Swipe navigation handlers
  const swipeHandlers = useSwipeNavigation(
    () => navigateDate("next"), // Swipe left = next day
    () => navigateDate("prev")  // Swipe right = previous day
  );

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

  // Count classes for today
  const todayClasses = schedule.filter(s => s.subject).length;
  const markedClasses = schedule.filter(s => {
    if (!s.subject) return false;
    const slotKey = `${dateKey}-${s.subject.id}`;
    return todayAttendance[slotKey];
  }).length;

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden pb-2">
        {/* Header - matching timetable style */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
              {format(now, "EEEE, MMM d")}
            </p>
            <h1 className="text-lg font-semibold">
              Hi, {student?.name?.split(" ")[0]} {student?.name?.split(" ")[1]}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-lg bg-secondary/50 transition-colors">
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

        <Tabs defaultValue="schedule" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-0.5 rounded-xl h-9">
            <TabsTrigger 
              value="schedule" 
              className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium"
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="subjects"
              className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium"
            >
              Subjects
            </TabsTrigger>
          </TabsList>

          <TabsContent 
            value="schedule" 
            className="mt-3 flex-1 overflow-y-auto space-y-3"
            onTouchStart={swipeHandlers.onTouchStart}
            onTouchMove={swipeHandlers.onTouchMove}
            onTouchEnd={swipeHandlers.onTouchEnd}
          >
            <div className="flex items-center justify-between bg-secondary/30 rounded-full px-1 py-1">
              <button
                onClick={() => navigateDate("prev")}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
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
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Compact Notices */}
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
                  <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-sm text-muted-foreground">No classes</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Enjoy your day off!</p>
              </div>
            )}

            {/* Timeline Schedule - matching timetable structure */}
            {!isBeforeStartDate && schedule.length > 0 && (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[5px] top-4 bottom-4 w-[2px] bg-border rounded-full" />

                <div className="space-y-0">
                  {isLoadingAttendance ? (
                    // Loading skeleton - compact
                    schedule.map((slot, index) => (
                      <div key={index} className="relative flex items-stretch gap-2 min-h-[64px]">
                        <div className="flex flex-col items-center w-2.5 flex-shrink-0 relative ml-[1px]">
                          <div className="flex-1" />
                          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                          <div className="flex-1" />
                        </div>
                        <div className="w-9 flex-shrink-0 flex flex-col justify-center">
                          <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                          <div className="h-2 w-6 bg-muted rounded mt-0.5 animate-pulse" />
                        </div>
                        <div className="flex-1 py-1">
                          <div className="bg-card border border-border rounded-lg p-2 h-full animate-pulse">
                            <div className="h-3 w-20 bg-muted rounded mb-1" />
                            <div className="h-2 w-12 bg-muted rounded" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    schedule.map((slot, index) => {
                      const timeStart = slot.time.split(" - ")[0];
                      const timeEnd = slot.time.split(" - ")[1];
                      const startHour = parseInt(slot.time.split(":")[0]);
                      const isCurrent = isSelectedToday && startHour === currentHour;
                      
                      if (!slot.subject) {
                        // Empty slot - same height as lecture slots
                        return (
                          <div key={index} className="relative flex items-stretch gap-2 min-h-[64px]">
                            <div className="flex flex-col items-center w-2.5 flex-shrink-0 relative ml-[1px]">
                              <div className="flex-1" />
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                              <div className="flex-1" />
                            </div>
                            <div className="w-9 flex-shrink-0 flex flex-col justify-center">
                              <p className="text-xs font-semibold leading-none text-muted-foreground/50">{timeStart}</p>
                              <p className="text-[9px] text-muted-foreground/40">{timeEnd}</p>
                            </div>
                            <div className="flex-1 py-1 flex items-center">
                              <p className="text-[10px] text-muted-foreground/50">Free</p>
                            </div>
                          </div>
                        );
                      }

                      const slotKey = `${dateKey}-${slot.subject.id}`;
                      const status = todayAttendance[slotKey] || null;
                      const { percent, needsAttention } = getSubjectAttendanceInfo(slot.subject.id);
                      const isSaving = savingState?.subjectId === slot.subject.id;

                      return (
                        <div 
                          key={index} 
                          className="relative flex items-stretch gap-2 min-h-[64px] transition-all duration-300"
                        >
                     
                          
                          {/* Dot */}
                          <div className="flex flex-col items-center w-2.5 flex-shrink-0 relative ml-[1px]">
                            <div className="flex-1" />
                            <div 
                              className={cn(
                                "flex-shrink-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all",
                                status === 'present' ? "w-2.5 h-2.5 rounded-full bg-emerald-500" :
                                status === 'absent' ? "w-2.5 h-2.5 rounded-full bg-destructive" :
                                status === 'cancelled' ? "w-2.5 h-2.5 rounded-full bg-muted-foreground" :
                                isCurrent ? "w-3 h-3 rounded-full bg-primary" :
                                "w-2.5 h-2.5 rounded-full bg-neutral-500"
                              )} 
                            >
                            </div>
                            <div className="flex-1" />
                          </div>

                          {/* Time */}
                          <div className="w-9 flex-shrink-0 flex flex-col justify-center">
                            <p className={cn(
                              "text-xs font-semibold leading-none transition-colors",
                              isCurrent && "text-primary"
                            )}>{timeStart}</p>
                            <p className="text-[9px] text-muted-foreground">{timeEnd}</p>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 py-1 relative">
                            <div className={cn(
                              "bg-card rounded-lg p-2 h-full transition-all relative overflow-hidden",
                              status === 'cancelled'
                                ? "border border-dashed border-muted-foreground/30 bg-muted/30"
                                : isCurrent 
                                 ? "border-2 border-primary/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                                  : needsAttention 
                                  ? "border-2 border-warning/40" 
                                     
                                    : "border border-border"
                            )}>
                              {/* Subject info */}
                              <div className={cn(
                                "flex items-start justify-between gap-1.5 mb-1.5",
                                status === 'cancelled' && "opacity-50"
                              )}>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    "text-xs font-medium truncate",
                                    status === 'cancelled' && "line-through decoration-muted-foreground/50"
                                  )}>{slot.subject.name}</p>
                                  <p className="text-[10px] text-muted-foreground leading-tight">{slot.subject.lecturePlace || slot.subject.code}</p>
                                </div>
                                {/* Cancelled badge or Attendance percentage badge */}
                                {status === 'cancelled' ? (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted-foreground/10 flex-shrink-0">
                                    <Ban className="w-2.5 h-2.5 text-muted-foreground" />
                                    <span className="text-[10px] font-medium text-muted-foreground">Cancelled</span>
                                  </div>
                                ) : (
                                  <div className={cn(
                                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full flex-shrink-0",
                                    needsAttention 
                                      ? "bg-gradient-to-r from-destructive/15 to-orange-500/15" 
                                      : percent >= 85
                                        ? "bg-gradient-to-r from-emerald-500/15 to-green-500/15"
                                        : "bg-gradient-to-r from-primary/10 to-blue-500/10"
                                  )}>
                                    <span className={cn(
                                      "text-xs font-bold tabular-nums",
                                      needsAttention 
                                        ? "text-destructive" 
                                        : percent >= 85
                                          ? "text-emerald-600"
                                          : "text-primary"
                                    )}>
                                      {Math.round(percent)}%
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleMarkAttendance(index, slot.subject!.id, "present")}
                                  disabled={isSaving || (isFutureDate && !isSelectedTomorrow)}
                                  className={cn(
                                    "flex-1 h-7 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-0.5",
                                    status === 'present'
                                      ? "bg-emerald-500 text-white"
                                      : "bg-secondary disabled:opacity-40"
                                  )}
                                >
                                  {isSaving && savingState?.action === 'present' ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Check className="w-2.5 h-2.5" />
                                  )}
                                  Present
                                </button>
                                <button
                                  onClick={() => handleMarkAttendance(index, slot.subject!.id, "absent")}
                                  disabled={isSaving || (isFutureDate && !isSelectedTomorrow)}
                                  className={cn(
                                    "flex-1 h-7 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-0.5",
                                    status === 'absent'
                                      ? "bg-destructive text-white"
                                      : "bg-secondary disabled:opacity-40"
                                  )}
                                >
                                  {isSaving && savingState?.action === 'absent' ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <X className="w-2.5 h-2.5" />
                                  )}
                                  Absent
                                </button>
                                <button
                                  onClick={() => handleMarkAttendance(index, slot.subject!.id, "cancelled")}
                                  disabled={isSaving}
                                  className={cn(
                                    "h-7 w-7 rounded-md text-[10px] font-medium transition-all flex items-center justify-center",
                                    status === 'cancelled'
                                      ? "bg-muted-foreground text-white"
                                      : "bg-secondary"
                                  )}
                                  title="Cancelled"
                                >
                                  {isSaving && savingState?.action === 'cancelled' ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Ban className="w-2.5 h-2.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="subjects" className="mt-4 flex-1 overflow-y-auto space-y-2">
            {enrolledSubjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-sm text-muted-foreground">No subjects enrolled</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Enroll in subjects to see them here</p>
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
                    totalUntilEndDate={stats.totalUntilEndDate}
                    minRequired={minRequired}
                    percentage={stats.percentage}
                    classesNeeded={stats.classesNeeded}
                    bunkableClasses={stats.bunkableClasses}
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
        <AlertDialogContent className="max-w-[90vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Update Past Attendance?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              You are about to update attendance for {format(selectedDate, "MMM d, yyyy")}. 
              This will modify historical records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => setPendingAttendance(null)} className="h-9 text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPastDateAttendance} className="h-9 text-sm">
              Yes, Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
