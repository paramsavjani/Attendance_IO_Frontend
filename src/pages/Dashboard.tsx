import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { timeSlots } from "@/data/mockData";
import { format, addDays, subDays, isToday, isBefore, startOfDay, isTomorrow, parseISO } from "date-fns";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { ChevronLeft, ChevronRight, Lock, CalendarSearch, Sun, Sunrise, Loader2, Check, X, Ban, BookOpen, Laptop, GraduationCap, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { TimetableSlot } from "@/types/attendance";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DemoBanner } from "@/components/DemoBanner";

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
  const { enrolledSubjects, timetable, subjectStats, subjectStatsToday, subjectMinAttendance, todayAttendance, markAttendance, setSubjectMin, fetchAttendanceForDate, isLoadingAttendance, savingState, attendanceIds } = useAttendance();
  
  // Lab/Tutorial timetable states
  const [labTimetable, setLabTimetable] = useState<TimetableSlot[]>([]);
  const [tutorialTimetable, setTutorialTimetable] = useState<TimetableSlot[]>([]);
  const [isLoadingLab, setIsLoadingLab] = useState(true);
  const [isLoadingTutorial, setIsLoadingTutorial] = useState(true);
  
  // Lab/Tutorial attendance stats
  const [labTutStats, setLabTutStats] = useState<Record<string, { 
    subjectId: string; 
    present: number; 
    absent: number; 
    total: number;
    totalUntilEndDate: number;
    percentage: number;
    classesNeeded: number;
    bunkableClasses: number;
  }>>({});
  const [isLoadingLabTutStats, setIsLoadingLabTutStats] = useState(true);
  
  const now = new Date();
  const currentHour = now.getHours();
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Extra classes state - stores subject IDs for extra classes added by user
  // Format: { [dateKey]: string[] } where string[] is array of subject IDs
  // Persist to localStorage
  const [extraClasses, setExtraClasses] = useState<Record<string, string[]>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('extraClasses');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Error parsing extraClasses from localStorage:', e);
        }
      }
    }
    return {};
  });
  const [addClassDialogOpen, setAddClassDialogOpen] = useState(false);
  
  // Track which extra class is being deleted (for loading state)
  const [deletingExtraClass, setDeletingExtraClass] = useState<{ subjectId: string; index: number } | null>(null);
  
  // Persist extra classes to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('extraClasses', JSON.stringify(extraClasses));
    }
  }, [extraClasses]);
  
  // Get last class hour from schedule
  function getLastClassHour(schedule: { time: string; subject: any; endTime?: string }[]) {
    const classesWithSubjects = schedule.filter(s => s.subject);
    if (classesWithSubjects.length === 0) return null;
    
    const lastClass = classesWithSubjects[classesWithSubjects.length - 1];
    // Use endTime if available (custom slots), otherwise parse from time string
    const endTime = lastClass.endTime || lastClass.time.split(" - ")[1];
    const hour = parseInt(endTime.split(":")[0]);
    return hour < 8 ? hour + 12 : hour;
  }

  // Helper to format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Fetch lab timetable
  useEffect(() => {
    if (!student) {
      setIsLoadingLab(false);
      return;
    }

    const fetchLabTimetable = async () => {
      try {
        setIsLoadingLab(true);
        const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.LAB_TIMETABLE, {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          setLabTimetable(data.slots || []);
        } else {
          setLabTimetable([]);
        }
      } catch (error) {
        console.error('Error fetching lab timetable:', error);
        setLabTimetable([]);
      } finally {
        setIsLoadingLab(false);
      }
    };

    fetchLabTimetable();
  }, [student]);

  // Fetch tutorial timetable
  useEffect(() => {
    if (!student) {
      setIsLoadingTutorial(false);
      return;
    }

    const fetchTutorialTimetable = async () => {
      try {
        setIsLoadingTutorial(true);
        const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.TUTORIAL_TIMETABLE, {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          setTutorialTimetable(data.slots || []);
        } else {
          setTutorialTimetable([]);
        }
      } catch (error) {
        console.error('Error fetching tutorial timetable:', error);
        setTutorialTimetable([]);
      } finally {
        setIsLoadingTutorial(false);
      }
    };

    fetchTutorialTimetable();
  }, [student]);

  // Fetch lab/tutorial attendance stats
  useEffect(() => {
    if (!student) {
      setIsLoadingLabTutStats(false);
      return;
    }

    const fetchLabTutStats = async () => {
      try {
        setIsLoadingLabTutStats(true);
        const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.GET_LAB_TUTORIAL_ATTENDANCE, {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          const statsMap: Record<string, any> = {};
          data.subjectStats?.forEach((stat: any) => {
            statsMap[stat.subjectId] = {
              subjectId: stat.subjectId,
              present: stat.present,
              absent: stat.absent,
              total: stat.total,
              totalUntilEndDate: stat.totalUntilEndDate,
              percentage: stat.percentage,
              classesNeeded: stat.classesNeeded,
              bunkableClasses: stat.bunkableClasses,
            };
          });
          setLabTutStats(statsMap);
        } else {
          setLabTutStats({});
        }
      } catch (error) {
        console.error('Error fetching lab/tutorial attendance stats:', error);
        setLabTutStats({});
      } finally {
        setIsLoadingLabTutStats(false);
      }
    };

    fetchLabTutStats();
  }, [student]);

  // Refresh lab/tutorial stats when attendance is marked
  useEffect(() => {
    if (!student || isLoadingLabTutStats) return;
    
    // Refresh stats after a short delay to allow backend to process
    const timeoutId = setTimeout(() => {
      const fetchLabTutStats = async () => {
        try {
          const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.GET_LAB_TUTORIAL_ATTENDANCE, {
            method: "GET",
          });

          if (response.ok) {
            const data = await response.json();
            const statsMap: Record<string, any> = {};
            data.subjectStats?.forEach((stat: any) => {
              statsMap[stat.subjectId] = {
                subjectId: stat.subjectId,
                present: stat.present,
                absent: stat.absent,
                total: stat.total,
                totalUntilEndDate: stat.totalUntilEndDate,
                percentage: stat.percentage,
                classesNeeded: stat.classesNeeded,
                bunkableClasses: stat.bunkableClasses,
              };
            });
            setLabTutStats(statsMap);
          }
        } catch (error) {
          console.error('Error refreshing lab/tutorial attendance stats:', error);
        }
      };

      fetchLabTutStats();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [todayAttendance, student, isLoadingLabTutStats]);

  // Get schedule for any date - returns standard slots (8-12) + custom slots + lab/tutorial
  function getScheduleForDate(date: Date, includeLabTutorial: boolean = true) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];
    
    const adjustedDay = dayOfWeek - 1;
    const daySlots = timetable.filter((slot) => slot.day === adjustedDay);
    
    // Get standard slots (8-12) - always show all 5 slots
    const standardSlots = timeSlots.map((time, slotIndex) => {
      const slot = daySlots.find(s => s.timeSlot === slotIndex && !s.startTime);
      return {
        time,
        slotIndex,
        startTime: time.split(" - ")[0],
        endTime: time.split(" - ")[1],
        subject: slot?.subjectId ? enrolledSubjects.find((s) => s.id === slot.subjectId) || null : null,
        isCustom: false,
        type: "lecture" as const,
      };
    });

    // Get custom slots
    const customSlots = daySlots
      .filter((s) => s.startTime && s.endTime)
      .map((slot) => {
        const start = slot.startTime!;
        const end = slot.endTime!;
        return {
          time: `${formatTime(start)} - ${formatTime(end)}`,
          slotIndex: null,
          startTime: start,
          endTime: end,
          subject: slot.subjectId ? enrolledSubjects.find((s) => s.id === slot.subjectId) || null : null,
          isCustom: true,
          type: "lecture" as const,
        };
      });

    // Get lab/tutorial slots if requested
    let labTutorialSlots: any[] = [];
    if (includeLabTutorial) {
      const labDaySlots = labTimetable.filter((slot) => slot.day === adjustedDay && slot.startTime && slot.endTime && slot.subjectId);
      const tutorialDaySlots = tutorialTimetable.filter((slot) => slot.day === adjustedDay && slot.startTime && slot.endTime && slot.subjectId);

      labTutorialSlots = [
        ...labDaySlots.map((slot) => {
          const start = slot.startTime!;
          const end = slot.endTime!;
          return {
            time: `${formatTime(start)} - ${formatTime(end)}`,
            slotIndex: null,
            startTime: start,
            endTime: end,
            subject: enrolledSubjects.find((s) => s.id === slot.subjectId) || null,
            isCustom: true,
            type: "lab" as const,
            location: slot.location || undefined,
          };
        }),
        ...tutorialDaySlots.map((slot) => {
          const start = slot.startTime!;
          const end = slot.endTime!;
          return {
            time: `${formatTime(start)} - ${formatTime(end)}`,
            slotIndex: null,
            startTime: start,
            endTime: end,
            subject: enrolledSubjects.find((s) => s.id === slot.subjectId) || null,
            isCustom: true,
            type: "tutorial" as const,
            location: slot.location || undefined,
          };
        }),
      ];
    }

    // Combine and sort by start time
    const allSlots = [...standardSlots, ...customSlots, ...labTutorialSlots].sort((a, b) => {
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      const aMinutes = aTime[0] * 60 + aTime[1];
      const bMinutes = bTime[0] * 60 + bTime[1];
      return aMinutes - bMinutes;
    });

    return allSlots;
  }

  // Get lab/tutorial schedule only
  function getLabTutorialScheduleForDate(date: Date) {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];
    
    const adjustedDay = dayOfWeek - 1;
    const labDaySlots = labTimetable.filter((slot) => slot.day === adjustedDay && slot.startTime && slot.endTime && slot.subjectId);
    const tutorialDaySlots = tutorialTimetable.filter((slot) => slot.day === adjustedDay && slot.startTime && slot.endTime && slot.subjectId);

    const allSlots = [
      ...labDaySlots.map((slot) => {
        const start = slot.startTime!;
        const end = slot.endTime!;
        return {
          time: `${formatTime(start)} - ${formatTime(end)}`,
          slotIndex: null,
          startTime: start,
          endTime: end,
          subject: enrolledSubjects.find((s) => s.id === slot.subjectId) || null,
          isCustom: true,
          type: "lab" as const,
        };
      }),
      ...tutorialDaySlots.map((slot) => {
        const start = slot.startTime!;
        const end = slot.endTime!;
        return {
          time: `${formatTime(start)} - ${formatTime(end)}`,
          slotIndex: null,
          startTime: start,
          endTime: end,
          subject: enrolledSubjects.find((s) => s.id === slot.subjectId) || null,
          isCustom: true,
          type: "tutorial" as const,
        };
      }),
    ].sort((a, b) => {
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      const aMinutes = aTime[0] * 60 + aTime[1];
      const bMinutes = bTime[0] * 60 + bTime[1];
      return aMinutes - bMinutes;
    });

    return allSlots;
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

  const schedule = useMemo(() => getScheduleForDate(selectedDate, true), [selectedDate, timetable, enrolledSubjects, labTimetable, tutorialTimetable]);
  const labTutorialSchedule = useMemo(() => getLabTutorialScheduleForDate(selectedDate), [selectedDate, labTimetable, tutorialTimetable, enrolledSubjects]);
  const dateKey = format(selectedDate, "yyyy-MM-dd");
  
  // Get extra classes for the selected date
  const extraClassesForDate = extraClasses[dateKey] || [];
  
  // Create extra class slots from extra classes
  const extraClassSlots = useMemo(() => {
    return extraClassesForDate.map((subjectId) => {
      const subject = enrolledSubjects.find((s) => s.id === subjectId);
      if (!subject) return null;
      
      return {
        time: "", // No time for extra classes
        slotIndex: null,
        startTime: "",
        endTime: "",
        subject: subject,
        isCustom: true,
        isExtraClass: true, // Flag to identify extra classes
        type: "lecture" as const,
      };
    }).filter(Boolean) as any[];
  }, [extraClassesForDate, enrolledSubjects]);
  
  // Combine regular schedule with extra classes
  const fullSchedule = useMemo(() => {
    return [...schedule, ...extraClassSlots];
  }, [schedule, extraClassSlots]);
  const isSelectedToday = isToday(selectedDate);
  const isSelectedTomorrow = isTomorrow(selectedDate);
  const isFutureDate = isBefore(startOfDay(now), startOfDay(selectedDate));
  const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(now));
  const isBeforeStartDate = classesStartDate ? isBefore(startOfDay(selectedDate), startOfDay(classesStartDate)) : false;
  const canMarkAttendance = true; // Allow marking for any date

  // Calculate if a subject needs attention (below minimum requirement)
  // Always use today's stats to show final attendance up to now
  // Helper to get attendance status with fallback to old format
  const getAttendanceStatus = (subjectId: string, slotIndex?: number | null, startTime?: string, endTime?: string, isCustom?: boolean) => {
    const fallbackKey = `${dateKey}-${subjectId}`; // Old format for backward compatibility
    
    // Try time-specific key first
    let slotKey: string;
    if (slotIndex !== null && slotIndex !== undefined && !isCustom) {
      slotKey = `${dateKey}-${subjectId}-slot${slotIndex}`;
    } else if (startTime && endTime && isCustom) {
      slotKey = `${dateKey}-${subjectId}-${startTime}-${endTime}`;
    } else {
      slotKey = fallbackKey;
    }
    
    // Try time-specific key first, then fall back to old format
    return todayAttendance[slotKey] || todayAttendance[fallbackKey] || null;
  };

  const getSubjectAttendanceInfo = (subjectId: string) => {
    const stats = subjectStatsToday[subjectId];
    const subject = enrolledSubjects.find(s => s.id === subjectId);
    // Use user's custom minimum, then subject's minimumCriteria, then fallback to 75
    // Use ?? instead of || to respect 0 as a valid value
    const minRequired = subjectMinAttendance[subjectId] ?? subject?.minimumCriteria ?? 75;
    
    // Always calculate percentage, even if stats don't exist or total is 0
    let percent = 0;
    if (stats && stats.total > 0) {
      percent = (stats.present / stats.total) * 100;
    }
    
    const needsAttention = percent < minRequired;
    
    return { percent, needsAttention, minRequired };
  };

  // Helper to check if a specific slot is being saved
  const isSlotSaving = (
    subjectId: string,
    slotIndex?: number | null,
    startTime?: string,
    endTime?: string,
    isExtraClass?: boolean
  ) => {
    if (!savingState || savingState.subjectId !== subjectId) {
      return false;
    }
    
    // For extra classes (no time info), check if savingState also has no time info
    if (isExtraClass) {
      return !savingState.timeSlot && !savingState.startTime && !savingState.endTime;
    }
    
    // Check if time slot information matches
    if (slotIndex !== null && slotIndex !== undefined) {
      // Standard slot - check timeSlot
      return savingState.timeSlot === slotIndex;
    } else if (startTime && endTime) {
      // Custom slot - check startTime and endTime
      return savingState.startTime === startTime && savingState.endTime === endTime;
    } else {
      // Old format (no time info) - check if savingState also has no time info
      return !savingState.timeSlot && !savingState.startTime && !savingState.endTime;
    }
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
  const [pendingAttendance, setPendingAttendance] = useState<{
    subjectId: string; 
    status: 'present' | 'absent' | 'cancelled';
    timeSlot?: number | null;
    startTime?: string;
    endTime?: string;
  } | null>(null);

  // Fetch attendance when date changes
  useEffect(() => {
    fetchAttendanceForDate(dateKey);
  }, [dateKey, fetchAttendanceForDate]);

  const handleMarkAttendance = async (
    index: number, 
    subjectId: string, 
    status: 'present' | 'absent' | 'cancelled',
    timeSlot?: number | null,
    startTime?: string,
    endTime?: string,
    isExtraClass?: boolean
  ) => {
    // For future dates: only allow "cancelled", block "present" and "absent"
    if (isFutureDate) {
      if (status === 'cancelled') {
        // Allow marking cancelled for future dates
        await markAttendance(subjectId, dateKey, status, timeSlot, startTime, endTime, isExtraClass);
      } else {
        // Block present/absent for future dates
        toast.error("You can only mark lectures as 'cancelled' for future dates");
      }
      return;
    }

    // Show warning for past dates
    if (isPastDate) {
      setPendingAttendance({ subjectId, status, timeSlot, startTime, endTime });
      setShowPastDateWarning(true);
      return;
    }
    
    // For today, mark directly
    await markAttendance(subjectId, dateKey, status, timeSlot, startTime, endTime, isExtraClass);
  };

  const confirmPastDateAttendance = async () => {
    if (pendingAttendance) {
      await markAttendance(
        pendingAttendance.subjectId, 
        dateKey, 
        pendingAttendance.status,
        pendingAttendance.timeSlot,
        pendingAttendance.startTime,
        pendingAttendance.endTime,
        false // Past date attendance is not for extra classes
      );
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
  
  // Handle adding an extra class
  const handleAddClass = (subjectId: string) => {
    setExtraClasses((prev) => {
      const current = prev[dateKey] || [];
      // Always add, even if same subject (allows multiple extra classes for same subject)
      return { ...prev, [dateKey]: [...current, subjectId] };
    });
    setAddClassDialogOpen(false);
    toast.success("Class added successfully");
  };
  
  // Handle deleting an extra class
  const handleDeleteExtraClass = async (subjectId: string, extraClassIndex: number) => {
    // Set loading state for this specific delete button
    setDeletingExtraClass({ subjectId, index: extraClassIndex });
    
    try {
      // For extra classes, we use the date-subject key (no time info)
      // Note: If there are multiple extra classes of the same subject, they share the same slotKey
      // So we'll delete the attendance record if it exists, and always remove from the list
      const slotKey = `${dateKey}-${subjectId}`;
      const attendanceId = attendanceIds[slotKey];
      
      // If attendance exists, delete it from backend
      if (attendanceId) {
        try {
          const deleteResponse = await authenticatedFetch(API_CONFIG.ENDPOINTS.DELETE_ATTENDANCE(attendanceId.toString()), {
            method: 'DELETE',
          });

          if (!deleteResponse.ok) {
            throw new Error('Failed to delete attendance');
          }
          
          // Refresh attendance data to sync state after deletion
          await fetchAttendanceForDate(dateKey);
        } catch (error: any) {
          console.error('Error deleting attendance:', error);
          toast.error('Failed to delete attendance record');
          // Continue to remove from UI even if backend deletion fails
        }
      }
      
      // Remove from extra classes list by index
      setExtraClasses((prev) => {
        const current = prev[dateKey] || [];
        const updated = current.filter((_, idx) => idx !== extraClassIndex);
        
        if (updated.length === 0) {
          const newState = { ...prev };
          delete newState[dateKey];
          return newState;
        }
        return { ...prev, [dateKey]: updated };
      });
      
      toast.success("Extra class removed");
      
      // Refresh attendance data to update stats
      await fetchAttendanceForDate(dateKey);
    } finally {
      // Clear loading state
      setDeletingExtraClass(null);
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
      <DemoBanner isDemo={student?.isDemo || false} />
      <div className="h-full flex flex-col overflow-hidden pb-2">
        {/* Header - matching timetable style */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
              {format(now, "EEEE, MMM d")}
            </p>
            <h1 className="text-lg font-semibold">
              Hi, {student?.isDemo ? "Demo User" : (student?.name?.split(" ").slice(0, 2).join(" ") || student?.name || "")}
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
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-0.5 rounded-xl h-9">
            <TabsTrigger 
              value="schedule" 
              className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium"
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="lab-tutorial"
              className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium"
            >
              Lab & Tut
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

            {/* Compact Notices */}
            {isSelectedTomorrow && showingTomorrowByDefault && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-xl border border-primary/20">
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

            {!isBeforeStartDate && fullSchedule.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-sm text-muted-foreground">No classes</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Enjoy your day off!</p>
              </div>
            )}

            {/* Timeline Schedule - matching timetable structure */}
            {!isBeforeStartDate && fullSchedule.length > 0 && (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[5px] top-4 bottom-4 w-[2px] bg-border rounded-full" />

                <div className="space-y-0">
                  {isLoadingAttendance ? (
                    // Loading skeleton - compact
                    fullSchedule.map((slot, index) => (
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
                    fullSchedule.map((slot, index) => {
                      // Handle both standard and custom time formats
                      const timeStart = slot.startTime || (slot.time ? slot.time.split(" - ")[0] : "");
                      const timeEnd = slot.endTime || (slot.time ? slot.time.split(" - ")[1] : "");
                      // Parse hour from 24-hour format (only for slots with time)
                      const startHour = timeStart ? parseInt(timeStart.split(":")[0]) : null;
                      const isCurrent = isSelectedToday && startHour !== null && startHour === currentHour;
                      const isExtraClass = (slot as any).isExtraClass === true;
                      // Calculate the index in the extra classes array (for deletion)
                      const extraClassIndex = isExtraClass ? index - schedule.length : -1;
                      
                      if (!slot.subject) {
                        // Empty slot - same height as lecture slots
                        return (
                          <div key={index} className="relative flex items-stretch gap-2 min-h-[64px]">
                            <div className="flex flex-col items-center w-2.5 flex-shrink-0 relative ml-[1px]">
                              <div className="flex-1" />
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/70 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                              <div className="flex-1" />
                            </div>
                            <div className="w-9 flex-shrink-0 flex flex-col justify-center">
                              <p className="text-xs font-semibold leading-none text-muted-foreground/70">{formatTime(timeStart)}</p>
                              <p className="text-[9px] text-muted-foreground/70">{formatTime(timeEnd)}</p>
                            </div>
                            <div className="flex-1 py-1 flex items-center">
                              <p className="text-[10px] text-muted-foreground/70">Free</p>
                            </div>
                          </div>
                        );
                      }

                      // Get attendance status with fallback to old format
                      // For extra classes, use the old format (no time info)
                      const status = isExtraClass 
                        ? (todayAttendance[`${dateKey}-${slot.subject.id}`] || null)
                        : getAttendanceStatus(
                            slot.subject.id,
                            slot.slotIndex,
                            slot.startTime,
                            slot.endTime,
                            slot.isCustom
                          );
                      // For lab/tutorial slots, use lab/tut specific stats; otherwise use overall stats
                      let percent = 0;
                      let needsAttention = false;
                      if (slot.type === "lab" || slot.type === "tutorial") {
                        // Use lab/tutorial specific stats
                        const labTutStat = labTutStats[slot.subject.id];
                        if (labTutStat) {
                          percent = labTutStat.percentage || 0;
                          const minRequired = subjectMinAttendance[slot.subject.id] ?? slot.subject.minimumCriteria ?? 75;
                          needsAttention = percent < minRequired;
                        } else {
                          // Fallback to overall stats if lab/tut stats not available
                          const { percent: overallPercent, needsAttention: overallNeedsAttention } = getSubjectAttendanceInfo(slot.subject.id);
                          percent = overallPercent;
                          needsAttention = overallNeedsAttention;
                        }
                      } else {
                        // Use overall stats for regular lectures
                        const { percent: overallPercent, needsAttention: overallNeedsAttention } = getSubjectAttendanceInfo(slot.subject.id);
                        percent = overallPercent;
                        needsAttention = overallNeedsAttention;
                      }
                      // Check if this specific slot is being saved
                      const isSaving = isSlotSaving(
                        slot.subject.id,
                        slot.slotIndex,
                        slot.startTime,
                        slot.endTime,
                        isExtraClass
                      );

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
                            {isExtraClass ? (
                              <p className="text-[9px] text-muted-foreground/70 italic">Extra</p>
                            ) : (
                              <>
                                <p className={cn(
                                  "text-xs font-semibold leading-none transition-colors",
                                  isCurrent && "text-primary"
                                )}>{formatTime(timeStart)}</p>
                                <p className="text-[9px] text-muted-foreground">{formatTime(timeEnd)}</p>
                                {slot.isCustom && (
                                  <p className="text-[8px] text-warning mt-0.5">Custom</p>
                                )}
                              </>
                            )}
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
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <p className={cn(
                                      "text-xs font-medium truncate",
                                      status === 'cancelled' && "line-through decoration-muted-foreground/50"
                                    )}>{slot.subject.name}</p>
                                    {/* Lab/Tutorial badge */}
                                    {slot.type === "lab" && (
                                      <div className="px-1.5 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center gap-0.5 flex-shrink-0">
                                        <Laptop className="w-2.5 h-2.5 text-blue-400" />
                                        <span className="text-[9px] font-medium text-blue-400">Lab</span>
                                      </div>
                                    )}
                                    {slot.type === "tutorial" && (
                                      <div className="px-1.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 flex items-center gap-0.5 flex-shrink-0">
                                        <GraduationCap className="w-2.5 h-2.5 text-purple-400" />
                                        <span className="text-[9px] font-medium text-purple-400">Tut</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground leading-tight">
                                    {slot.isCustom && (slot.type === "lab" || slot.type === "tutorial")
                                      ? (slot.location || slot.subject.code)
                                      : (slot.subject.classroomLocation || slot.subject.lecturePlace || slot.subject.code)}
                                  </p>
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
                                  onClick={() => handleMarkAttendance(
                                    index, 
                                    slot.subject!.id, 
                                    "present",
                                    isExtraClass ? null : slot.slotIndex,
                                    isExtraClass ? undefined : slot.startTime,
                                    isExtraClass ? undefined : slot.endTime,
                                    isExtraClass
                                  )}
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
                                  onClick={() => handleMarkAttendance(
                                    index, 
                                    slot.subject!.id, 
                                    "absent",
                                    isExtraClass ? null : slot.slotIndex,
                                    isExtraClass ? undefined : slot.startTime,
                                    isExtraClass ? undefined : slot.endTime,
                                    isExtraClass
                                  )}
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
                                {isExtraClass ? (
                                  <button
                                    onClick={() => handleDeleteExtraClass(slot.subject!.id, extraClassIndex)}
                                    disabled={deletingExtraClass?.subjectId === slot.subject!.id && deletingExtraClass?.index === extraClassIndex}
                                    className={cn(
                                      "h-7 w-7 rounded-md text-[10px] font-medium transition-all flex items-center justify-center",
                                      "bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20",
                                      deletingExtraClass?.subjectId === slot.subject!.id && deletingExtraClass?.index === extraClassIndex && "opacity-50"
                                    )}
                                    title="Delete Extra Class"
                                  >
                                    {deletingExtraClass?.subjectId === slot.subject!.id && deletingExtraClass?.index === extraClassIndex ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-2.5 h-2.5" />
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleMarkAttendance(
                                      index, 
                                      slot.subject!.id, 
                                      "cancelled",
                                      slot.slotIndex,
                                      slot.startTime,
                                      slot.endTime,
                                      false
                                    )}
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
                                )}
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
            
            {/* Add a Class Button */}
            {!isBeforeStartDate && (
              <div className="flex justify-center">
                <button
                  onClick={() => setAddClassDialogOpen(true)}
                  className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-700/50 hover:border-neutral-600 text-white font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-black/20 active:scale-[0.98] group backdrop-blur-sm"
                >
                  <div className="w-6 h-6 rounded-lg bg-neutral-800/50 group-hover:bg-neutral-800 flex items-center justify-center border border-neutral-700/50 group-hover:border-neutral-600 transition-all duration-200">
                    <Plus className="w-3.5 h-3.5 text-neutral-300 group-hover:text-white group-hover:rotate-90 transition-all duration-200" />
                  </div>
                  <span className="text-neutral-200 group-hover:text-white transition-colors">Add a Class</span>
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="lab-tutorial" className="mt-4 flex-1 overflow-y-auto space-y-2">
            {enrolledSubjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-sm text-muted-foreground">No subjects enrolled</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Enroll in subjects to see them here</p>
              </div>
            ) : (isLoadingLab || isLoadingTutorial || isLoadingLabTutStats) ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading lab & tutorial stats...</p>
              </div>
            ) : (
              (() => {
                // Get subjects that have lab/tutorial schedules
                const subjectsWithLabTut = enrolledSubjects.filter((subject) => {
                  const hasLab = labTimetable.some(slot => slot.subjectId === subject.id && slot.startTime && slot.endTime);
                  const hasTutorial = tutorialTimetable.some(slot => slot.subjectId === subject.id && slot.startTime && slot.endTime);
                  return hasLab || hasTutorial;
                });
                
                if (subjectsWithLabTut.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium text-sm text-muted-foreground">No labs or tutorials</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">No subjects have lab or tutorial schedules</p>
                    </div>
                  );
                }
                
                return subjectsWithLabTut.map((subject) => {
                  // Get stats from backend
                  const stats = labTutStats[subject.id] || { 
                    subjectId: subject.id, 
                    present: 0, 
                    absent: 0, 
                    total: 0,
                    totalUntilEndDate: 0,
                    percentage: 0,
                    classesNeeded: 0,
                    bunkableClasses: 0
                  };
                  
                  const minRequired = subjectMinAttendance[subject.id] ?? subject.minimumCriteria ?? 75;

                  return (
                    <SubjectCard
                      key={subject.id}
                      name={subject.name}
                      code={subject.code}
                      lecturePlace={subject.lecturePlace}
                      classroomLocation={subject.classroomLocation}
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
                });
              })()
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
                const minRequired = subjectMinAttendance[subject.id] ?? subject.minimumCriteria ?? 75;

                return (
                  <SubjectCard
                    key={subject.id}
                    name={subject.name}
                    lecturePlace={subject.lecturePlace}
                    classroomLocation={subject.classroomLocation}
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
        <AlertDialogContent className="max-w-[90vw] md:max-w-md rounded-xl">
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
      
      {/* Add a Class Dialog */}
      <Dialog open={addClassDialogOpen} onOpenChange={setAddClassDialogOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base">Add a Class</DialogTitle>
            <DialogDescription className="text-sm">
              Select a subject to add an extra class for {format(selectedDate, "MMM d, yyyy")}.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 py-4">
            {enrolledSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No subjects enrolled. Please enroll in subjects first.
              </p>
            ) : (() => {
              // Filter out subjects that already have an extra class added for this date
              const availableSubjects = enrolledSubjects.filter(
                subject => !extraClassesForDate.includes(subject.id)
              );
              
              if (availableSubjects.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    All subjects already have extra classes added for this date.
                  </p>
                );
              }
              
              return availableSubjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => handleAddClass(subject.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/50 hover:bg-secondary border border-border transition-all text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `hsl(${subject.color})` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{subject.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{subject.code}</p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
