import { useState, useEffect, useCallback, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { timeSlots, days } from "@/data/mockData";
import { TimetableSlot } from "@/types/attendance";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, Loader2, Plus, BookOpen, X, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/lib/api";
import { useAttendance } from "@/contexts/AttendanceContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Swipe navigation hook for days
function useSwipeDayNavigation(activeDay: number, setActiveDay: (day: number) => void, totalDays: number) {
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
    
    if (isLeftSwipe && activeDay < totalDays - 1) {
      setActiveDay(activeDay + 1); // Navigate to next day
    } else if (isRightSwipe && activeDay > 0) {
      setActiveDay(activeDay - 1); // Navigate to previous day
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  }, [activeDay, setActiveDay, totalDays]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// Timeline content component with swipe support
interface TimelineContentProps {
  activeDay: number;
  setActiveDay: (day: number) => void;
  totalDays: number;
  getSlotSubject: (day: number, timeSlot: number) => any;
  handleSlotClick: (day: number, timeSlot: number) => void;
  handleClearSlot: (day: number, timeSlot: number, e: React.MouseEvent) => void;
}

function TimelineContent({
  activeDay,
  setActiveDay,
  totalDays,
  getSlotSubject,
  handleSlotClick,
  handleClearSlot,
}: TimelineContentProps) {
  const swipeHandlers = useSwipeDayNavigation(activeDay, setActiveDay, totalDays);

  return (
    <div 
      className="flex-1 overflow-y-auto relative"
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={swipeHandlers.onTouchEnd}
    >
      {/* Vertical line - aligned with dots */}
      <div className="absolute left-[5px] top-4 bottom-4 w-[2px] bg-border rounded-full" />

      <div className="space-y-0">
        {timeSlots.slice(0, 6).map((time, timeIndex) => {
          const subject = getSlotSubject(activeDay, timeIndex);
          const timeStart = time.split(" - ")[0];
          const timeEnd = time.split(" - ")[1];
          
          return (
            <div key={timeIndex} className="relative flex items-stretch gap-3 min-h-[72px]">
              {/* Dot - centered vertically in its container */}
              <div className="flex flex-col items-center w-3 flex-shrink-0">
                <div className="flex-1" />
                <div 
                  className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0",
                    subject 
                      ? "bg-primary" 
                      : "bg-muted-foreground/30"
                  )} 
                />
                <div className="flex-1" />
              </div>

              {/* Time */}
              <div className="w-10 flex-shrink-0 flex flex-col justify-center">
                <p className="text-sm font-semibold leading-none">{timeStart}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{timeEnd}</p>
              </div>

              {/* Content */}
              <button
                onClick={() => handleSlotClick(activeDay, timeIndex)}
                className="flex-1 min-w-0 text-left group py-1.5"
              >
                {subject ? (
                  <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 h-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subject.code}</p>
                    </div>
                    <button
                      onClick={(e) => handleClearSlot(activeDay, timeIndex, e)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-xl p-3 group-hover:border-muted-foreground/50 transition-colors h-full flex items-center">
                    <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                      <span className="text-sm">Add class</span>
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Timetable() {
  const navigate = useNavigate();
  const { enrolledSubjects } = useAttendance();
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [originalTimetable, setOriginalTimetable] = useState<TimetableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; timeSlot: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 0 : Math.min(today - 1, 4);
  });

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (timetable.length !== originalTimetable.length) return true;
    return timetable.some((slot) => {
      const original = originalTimetable.find(
        (o) => o.day === slot.day && o.timeSlot === slot.timeSlot
      );
      if (!original) return true;
      return original.subjectId !== slot.subjectId;
    }) || originalTimetable.some((slot) => {
      const current = timetable.find(
        (c) => c.day === slot.day && c.timeSlot === slot.timeSlot
      );
      return !current;
    });
  }, [timetable, originalTimetable]);

  // Handle browser back/refresh with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Custom back navigation handler
  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
      setPendingNavigation('back');
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const slots = data.slots || [];
          setTimetable(slots);
          setOriginalTimetable(slots);
        } else {
          setTimetable([]);
          setOriginalTimetable([]);
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
        setTimetable([]);
        setOriginalTimetable([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  const getSlotSubject = (day: number, timeSlot: number) => {
    const slot = timetable.find((s) => s.day === day && s.timeSlot === timeSlot);
    if (slot?.subjectId) {
      return enrolledSubjects.find((s) => s.id === slot.subjectId);
    }
    return null;
  };

  const handleSlotClick = (day: number, timeSlot: number) => {
    setSelectedSlot({ day, timeSlot });
    setDialogOpen(true);
  };

  const handleAssignSubject = (subjectId: string | null) => {
    if (!selectedSlot) return;

    const updatedTimetable = timetable.map((slot) =>
      slot.day === selectedSlot.day && slot.timeSlot === selectedSlot.timeSlot
        ? { ...slot, subjectId }
        : slot
    );

    const existingSlot = updatedTimetable.find(
      (s) => s.day === selectedSlot.day && s.timeSlot === selectedSlot.timeSlot
    );
    if (!existingSlot) {
      updatedTimetable.push({
        day: selectedSlot.day,
        timeSlot: selectedSlot.timeSlot,
        subjectId,
      });
    }

    setTimetable(updatedTimetable);
    setDialogOpen(false);
    setSelectedSlot(null);
  };

  const handleClearSlot = (day: number, timeSlot: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedTimetable = timetable.filter(
      (slot) => !(slot.day === day && slot.timeSlot === timeSlot)
    );

    setTimetable(updatedTimetable);
  };

  const saveTimetable = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          slots: timetable,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save timetable');
      }

      setOriginalTimetable([...timetable]);
      toast.success('Timetable saved');
    } catch (error: any) {
      console.error('Error saving timetable:', error);
      toast.error(error.message || 'Failed to save timetable');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setTimetable([]);
  };

  const getDaySlotCount = (dayIndex: number) => {
    return timetable.filter(s => s.day === dayIndex && s.subjectId).length;
  };

  const totalWeekClasses = days.reduce((acc, _, idx) => acc + getDaySlotCount(idx), 0);

  const discardChanges = () => {
    setTimetable([...originalTimetable]);
    setShowUnsavedDialog(false);
    if (pendingNavigation === 'back') {
      navigate(-1);
    }
    setPendingNavigation(null);
  };

  const proceedWithoutSaving = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation === 'back') {
      navigate(-1);
    }
    setPendingNavigation(null);
  };

  const saveAndProceed = async () => {
    await saveTimetable();
    setShowUnsavedDialog(false);
    if (pendingNavigation === 'back') {
      navigate(-1);
    }
    setPendingNavigation(null);
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col overflow-hidden pb-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBack} 
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-semibold">Timetable</h1>
          </div>

          <div className="flex items-center gap-3">
            {hasUnsavedChanges() && (
              <Button
                onClick={saveTimetable}
                disabled={isSaving}
                size="sm"
                className="h-8 gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button 
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  disabled={isSaving}
                >
                  Clear all
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] rounded-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base">Reset Timetable?</AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    This will remove all scheduled classes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleRegenerate}
                    className="bg-destructive text-destructive-foreground h-9 text-sm"
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-5 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold">{getDaySlotCount(activeDay)}</span>
                <span className="text-xs text-muted-foreground">today</span>
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-muted-foreground">{totalWeekClasses}</span>
                <span className="text-xs text-muted-foreground">this week</span>
              </div>
            </div>

            {/* Day Pills - No scroll, evenly distributed */}
            <div className="grid grid-cols-5 gap-1.5 mb-6 flex-shrink-0">
              {days.map((day, dayIndex) => {
                const slotCount = getDaySlotCount(dayIndex);
                const isActive = activeDay === dayIndex;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(dayIndex)}
                    className={cn(
                      "py-2.5 rounded-full text-sm font-medium transition-all text-center",
                      isActive 
                        ? "bg-foreground text-background" 
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{day.slice(0, 3)}</span>
                    {slotCount > 0 && (
                      <span className={cn(
                        "ml-0.5 text-xs",
                        isActive ? "text-background/70" : "text-muted-foreground"
                      )}>
                        · {slotCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Timeline - Scrollable with swipe navigation */}
            <TimelineContent
              activeDay={activeDay}
              setActiveDay={setActiveDay}
              totalDays={days.length}
              getSlotSubject={getSlotSubject}
              handleSlotClick={handleSlotClick}
              handleClearSlot={handleClearSlot}
            />
          </div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm mx-auto rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">Select Subject</DialogTitle>
              {selectedSlot && (
                <p className="text-sm text-muted-foreground">
                  {days[selectedSlot.day]} · {timeSlots[selectedSlot.timeSlot]}
                </p>
              )}
            </DialogHeader>

            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {enrolledSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No subjects enrolled</p>
                </div>
              ) : (
                enrolledSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleAssignSubject(subject.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                      {subject.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subject.code}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Unsaved Changes Warning Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent className="max-w-[90vw] rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                You have unsaved changes to your timetable. What would you like to do?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel onClick={discardChanges} className="h-9 text-sm">
                Discard
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={proceedWithoutSaving}
                className="bg-destructive text-destructive-foreground h-9 text-sm"
              >
                Leave anyway
              </AlertDialogAction>
              <AlertDialogAction 
                onClick={saveAndProceed}
                className="h-9 text-sm"
              >
                Save & Leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
