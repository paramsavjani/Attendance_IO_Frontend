import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, addDays, subDays, isToday, isBefore, isAfter, startOfDay, isTomorrow, parseISO } from "date-fns";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { ChevronLeft, ChevronRight, Lock, CalendarSearch, Sun, Sunrise, Loader2, BookOpen, FlaskConical, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { TimetableSlot } from "@/types/attendance";

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
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

export default function LabTutorial() {
  const { student } = useAuth();
  const { enrolledSubjects } = useAttendance();
  
  const now = new Date();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  
  // Timetable states (view-only)
  const [labTimetable, setLabTimetable] = useState<TimetableSlot[]>([]);
  const [tutorialTimetable, setTutorialTimetable] = useState<TimetableSlot[]>([]);
  const [isLoadingLab, setIsLoadingLab] = useState(true);
  const [isLoadingTutorial, setIsLoadingTutorial] = useState(true);

  // Fetch lab timetable
  const fetchLabTimetable = useCallback(async () => {
    if (!student) {
      setIsLoadingLab(false);
      return;
    }

    try {
      setIsLoadingLab(true);
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.LAB_TIMETABLE, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        const slots = data.slots || [];
        setLabTimetable(slots);
      } else {
        setLabTimetable([]);
      }
    } catch (error) {
      console.error('Error fetching lab timetable:', error);
      setLabTimetable([]);
    } finally {
      setIsLoadingLab(false);
    }
  }, [student]);

  // Fetch tutorial timetable
  const fetchTutorialTimetable = useCallback(async () => {
    if (!student) {
      setIsLoadingTutorial(false);
      return;
    }

    try {
      setIsLoadingTutorial(true);
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.TUTORIAL_TIMETABLE, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        const slots = data.slots || [];
        setTutorialTimetable(slots);
      } else {
        setTutorialTimetable([]);
      }
    } catch (error) {
      console.error('Error fetching tutorial timetable:', error);
      setTutorialTimetable([]);
    } finally {
      setIsLoadingTutorial(false);
    }
  }, [student]);

  useEffect(() => {
    fetchLabTimetable();
    fetchTutorialTimetable();
  }, [fetchLabTimetable, fetchTutorialTimetable]);

  // Helper to format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };


  // Get schedule for any date - only shows actual custom slots with subjects (non-empty)
  function getScheduleForDate(date: Date, labTimetable: TimetableSlot[], tutorialTimetable: TimetableSlot[]) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];
    
    const adjustedDay = dayOfWeek - 1;
    const labDaySlots = labTimetable.filter((slot) => slot.day === adjustedDay);
    const tutorialDaySlots = tutorialTimetable.filter((slot) => slot.day === adjustedDay);
    
    // Process lab slots - only custom slots with subjects
    const labSlots: Array<{
      time: string;
      slotIndex: number | null;
      startTime: string;
      endTime: string;
      subject: any;
      isCustom: boolean;
      type: "lab" | "tutorial";
    }> = [];
    
    // Lab custom slots only - filter to only show slots with subjects
    labDaySlots.forEach((slot) => {
      if (slot.startTime && slot.endTime && slot.subjectId) {
        const subject = enrolledSubjects.find((s) => s.id === slot.subjectId) || null;
        if (subject) {
          labSlots.push({
            time: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
            slotIndex: null,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject,
            isCustom: true,
            type: "lab",
          });
        }
      }
    });
    
    // Process tutorial slots - only custom slots with subjects
    const tutorialSlots: Array<{
      time: string;
      slotIndex: number | null;
      startTime: string;
      endTime: string;
      subject: any;
      isCustom: boolean;
      type: "lab" | "tutorial";
    }> = [];
    
    // Tutorial custom slots only - filter to only show slots with subjects
    tutorialDaySlots.forEach((slot) => {
      if (slot.startTime && slot.endTime && slot.subjectId) {
        const subject = enrolledSubjects.find((s) => s.id === slot.subjectId) || null;
        if (subject) {
          tutorialSlots.push({
            time: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
            slotIndex: null,
            startTime: slot.startTime,
            endTime: slot.endTime,
            subject,
            isCustom: true,
            type: "tutorial",
          });
        }
      }
    });

    // Combine lab and tutorial slots, sort by start time, only show non-empty slots
    const allSlots = [...labSlots, ...tutorialSlots]
      .filter((slot) => slot.subject !== null) // Only show slots with subjects
      .sort((a, b) => {
        const aTime = a.startTime.split(':').map(Number);
        const bTime = b.startTime.split(':').map(Number);
        const aMinutes = aTime[0] * 60 + aTime[1];
        const bMinutes = bTime[0] * 60 + bTime[1];
        return aMinutes - bMinutes;
      });

    return allSlots;
  }

  const navigateDate = useCallback((direction: "prev" | "next") => {
    setSelectedDate((prev) => 
      direction === "prev" ? subDays(prev, 1) : addDays(prev, 1)
    );
  }, []);

  const swipeHandlers = useSwipeNavigation(
    () => navigateDate("next"),
    () => navigateDate("prev")
  );

  const goToToday = () => setSelectedDate(now);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const isSelectedToday = isToday(selectedDate);
  const isSelectedTomorrow = isTomorrow(selectedDate);
  const isFutureDate = isAfter(selectedDate, startOfDay(now));
  const isPastDate = isBefore(selectedDate, startOfDay(now)) && !isSelectedToday;

  const isLoading = isLoadingLab || isLoadingTutorial;
  const schedule = getScheduleForDate(selectedDate, labTimetable, tutorialTimetable);

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden pb-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
              {format(now, "EEEE, MMM d")}
            </p>
            <h1 className="text-lg font-semibold">
              Lab & Tutorial
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

        <div className="w-full flex-1 flex flex-col overflow-hidden">
          <div 
            className="mt-3 flex-1 overflow-y-auto space-y-3"
            onTouchStart={swipeHandlers.onTouchStart}
            onTouchMove={swipeHandlers.onTouchMove}
            onTouchEnd={swipeHandlers.onTouchEnd}
          >
            <div className="flex items-center justify-between bg-secondary/30 rounded-full px-1 py-0">
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

            {isFutureDate && !isSelectedTomorrow && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-xl border border-border/30">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Future date
                </p>
              </div>
            )}

            {isPastDate && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-xl border border-border/30">
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground">Past date</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading schedule...</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[5px] top-4 bottom-4 w-[2px] bg-border rounded-full" />
                <div className="space-y-3 pl-6">
                  {schedule.map((slot, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-background border-2 border-border flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      {/* Time display */}
                      <div className="absolute -left-[70px] top-1 w-12 text-right">
                        <p className="text-xs font-semibold leading-none">{formatTime(slot.startTime)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(slot.endTime)}</p>
                      </div>
                      <div className="w-full relative">
                        <SubjectCard
                          name={slot.subject.name}
                          code={slot.subject.code}
                          lecturePlace={slot.subject.lecturePlace}
                          classroomLocation={slot.subject.classroomLocation}
                          color={slot.subject.color}
                          present={0}
                          absent={0}
                          total={0}
                          minRequired={slot.subject.minimumCriteria || 75}
                          hideBunkableInfo={true}
                        />
                        {/* Badge to show Lab or Tutorial */}
                        <div className="absolute top-2 right-2">
                          <div className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-medium",
                            slot.type === "lab" 
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          )}>
                            {slot.type === "lab" ? (
                              <div className="flex items-center gap-1">
                                <FlaskConical className="w-2.5 h-2.5" />
                                <span>Lab</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <GraduationCap className="w-2.5 h-2.5" />
                                <span>Tutorial</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
