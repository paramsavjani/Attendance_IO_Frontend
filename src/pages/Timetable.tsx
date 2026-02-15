import { useState, useEffect, useCallback, useRef } from "react";

import { timeSlots, days } from "@/data/mockData";
import { TimetableSlot } from "@/types/attendance";
import { cn } from "@/lib/utils";
import { trackAppEvent } from "@/contexts/AuthContext";
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
import { ChevronLeft, Loader2, Plus, BookOpen, X, Save, Clock, Laptop, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { useAttendance } from "@/contexts/AttendanceContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

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
  getAllSlotsForDay: (day: number) => any[];
  formatTime: (time: string) => string;
  enrolledSubjects: any[];
  handleSlotClick: (day: number, timeSlot: number | null, startTime?: string, endTime?: string) => void;
  handleClearSlot: (day: number, timeSlot: number | null, e: React.MouseEvent, startTime?: string, endTime?: string) => void;
  onAddCustomTime: () => void;
}

function TimelineContent({
  activeDay,
  setActiveDay,
  totalDays,
  getAllSlotsForDay,
  formatTime,
  enrolledSubjects,
  handleSlotClick,
  handleClearSlot,
  onAddCustomTime,
}: TimelineContentProps) {
  const swipeHandlers = useSwipeDayNavigation(activeDay, setActiveDay, totalDays);
  const allSlots = getAllSlotsForDay(activeDay);

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
        {allSlots.map((slotInfo, index) => {
          const subject = slotInfo.slot?.subjectId
            ? enrolledSubjects.find((s) => s.id === slotInfo.slot.subjectId)
            : null;

          return (
            <div key={index} className="relative flex items-stretch gap-3 min-h-[72px]">
              {/* Dot - centered vertically in its container */}
              <div className="flex flex-col items-center w-3 flex-shrink-0">
                <div className="flex-1" />
                <div
                  className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0",
                    subject
                      ? "bg-primary"
                      : slotInfo.type === 'custom'
                        ? "bg-warning"
                        : "bg-muted-foreground/30"
                  )}
                />
                <div className="flex-1" />
              </div>

              {/* Time */}
              <div className="w-10 flex-shrink-0 flex flex-col justify-center">
                <p className="text-sm font-semibold leading-none">{formatTime(slotInfo.startTime)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(slotInfo.endTime)}</p>
                {slotInfo.type === 'custom' && (
                  <p className="text-[8px] text-warning mt-0.5">Custom</p>
                )}
              </div>

              {/* Content */}
              <button
                onClick={() => handleSlotClick(
                  activeDay,
                  slotInfo.timeSlot,
                  slotInfo.startTime,
                  slotInfo.endTime
                )}
                className="flex-1 min-w-0 text-left group py-1.5"
              >
                {subject ? (
                  <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 h-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subject.code}</p>
                    </div>
                    <button
                      onClick={(e) => handleClearSlot(
                        activeDay,
                        slotInfo.timeSlot,
                        e,
                        slotInfo.startTime,
                        slotInfo.endTime
                      )}
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

        {/* Add Custom Time Button */}
        <div className="relative flex items-stretch gap-3 min-h-[72px] mt-2">
          <div className="flex flex-col items-center w-3 flex-shrink-0">
            <div className="flex-1" />
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-muted-foreground/20" />
            <div className="flex-1" />
          </div>
          <div className="w-10 flex-shrink-0" />
          <button
            onClick={onAddCustomTime}
            className="flex-1 border border-dashed border-border rounded-xl p-3 hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-primary"
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Add Custom Time</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Lab/Tutorial Timeline component - only custom slots
interface LabTutorialTimelineProps {
  activeDay: number;
  setActiveDay: (day: number) => void;
  totalDays: number;
  getAllSlotsForDay: (day: number, type: "lab" | "tutorial") => any[];
  formatTime: (time: string) => string;
  enrolledSubjects: any[];
  handleSlotClick: (day: number, timeSlot: number | null, startTime?: string, endTime?: string, type?: "lab" | "tutorial") => void;
  handleClearSlot: (day: number, timeSlot: number | null, e: React.MouseEvent, startTime?: string, endTime?: string, type?: "lab" | "tutorial") => void;
  onAddCustomTime: (type: "lab" | "tutorial") => void;
}

function LabTutorialTimeline({
  activeDay,
  setActiveDay,
  totalDays,
  getAllSlotsForDay,
  formatTime,
  enrolledSubjects,
  handleSlotClick,
  handleClearSlot,
  onAddCustomTime,
}: LabTutorialTimelineProps) {
  const swipeHandlers = useSwipeDayNavigation(activeDay, setActiveDay, totalDays);
  const labSlots = getAllSlotsForDay(activeDay, "lab");
  const tutorialSlots = getAllSlotsForDay(activeDay, "tutorial");
  const allSlots = [...labSlots, ...tutorialSlots].sort((a, b) => {
    const aTime = a.startTime.split(':').map(Number);
    const bTime = b.startTime.split(':').map(Number);
    const aMinutes = aTime[0] * 60 + aTime[1];
    const bMinutes = bTime[0] * 60 + bTime[1];
    return aMinutes - bMinutes;
  });

  return (
    <div
      className="flex-1 overflow-y-auto relative"
      onTouchStart={swipeHandlers.onTouchStart}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={swipeHandlers.onTouchEnd}
    >
      <div className="absolute left-[5px] top-4 bottom-4 w-[2px] bg-border rounded-full" />
      <div className="space-y-0">
        {allSlots.map((slotInfo, index) => {
          const subject = slotInfo.slot?.subjectId
            ? enrolledSubjects.find((s) => s.id === slotInfo.slot.subjectId)
            : null;

          return (
            <div key={index} className="relative flex items-stretch gap-3 min-h-[72px]">
              <div className="flex flex-col items-center w-3 flex-shrink-0">
                <div className="flex-1" />
                <div
                  className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0",
                    subject
                      ? slotInfo.type === "lab" ? "bg-blue-500" : "bg-purple-500"
                      : "bg-muted-foreground/30"
                  )}
                />
                <div className="flex-1" />
              </div>

              <div className="w-10 flex-shrink-0 flex flex-col justify-center">
                <p className="text-sm font-semibold leading-none">{formatTime(slotInfo.startTime)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(slotInfo.endTime)}</p>
              </div>

              <button
                onClick={() => handleSlotClick(
                  activeDay,
                  null,
                  slotInfo.startTime,
                  slotInfo.endTime,
                  slotInfo.type
                )}
                className="flex-1 min-w-0 text-left group py-1.5"
              >
                {subject ? (
                  <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 h-full">
                    <div className={cn(
                      "w-1 h-8 rounded-full",
                      slotInfo.type === "lab" ? "bg-blue-500" : "bg-purple-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {slotInfo.type === "lab" ? (
                          <Laptop className="w-3 h-3 text-blue-400" />
                        ) : (
                          <GraduationCap className="w-3 h-3 text-purple-400" />
                        )}
                        <p className="text-xs font-medium text-muted-foreground">
                          {slotInfo.type === "lab" ? "Lab" : "Tutorial"}
                        </p>
                      </div>
                      <p className="text-sm font-medium truncate">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {subject.code}
                        {slotInfo.slot?.location && ` • ${slotInfo.slot.location}`}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleClearSlot(
                        activeDay,
                        null,
                        e,
                        slotInfo.startTime,
                        slotInfo.endTime,
                        slotInfo.type
                      )}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-xl p-3 group-hover:border-muted-foreground/50 transition-colors h-full flex items-center">
                    <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                      <span className="text-sm">Add {slotInfo.type === "lab" ? "Lab" : "Tutorial"}</span>
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* Add Custom Time Buttons */}
        <div className="relative flex items-stretch gap-3 min-h-[72px] mt-2">
          <div className="flex flex-col items-center w-3 flex-shrink-0">
            <div className="flex-1" />
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-muted-foreground/20" />
            <div className="flex-1" />
          </div>
          <div className="w-10 flex-shrink-0" />
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => onAddCustomTime("lab")}
              className="flex-1 border border-dashed border-border rounded-xl p-3 hover:border-blue-500 hover:bg-blue-500/5 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-blue-400"
            >
              <Laptop className="w-4 h-4" />
              <span className="text-sm font-medium">Add Lab</span>
            </button>
            <button
              onClick={() => onAddCustomTime("tutorial")}
              className="flex-1 border border-dashed border-border rounded-xl p-3 hover:border-purple-500 hover:bg-purple-500/5 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-purple-400"
            >
              <GraduationCap className="w-4 h-4" />
              <span className="text-sm font-medium">Add Tutorial</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Timetable() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const { enrolledSubjects } = useAttendance();
  const [activeTab, setActiveTab] = useState<"lecture" | "lab-tutorial">("lecture");

  // Lecture timetable states
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [originalTimetable, setOriginalTimetable] = useState<TimetableSlot[]>([]);

  // Lab/Tutorial timetable states
  const [labTimetable, setLabTimetable] = useState<TimetableSlot[]>([]);
  const [tutorialTimetable, setTutorialTimetable] = useState<TimetableSlot[]>([]);
  const [originalLabTimetable, setOriginalLabTimetable] = useState<TimetableSlot[]>([]);
  const [originalTutorialTimetable, setOriginalTutorialTimetable] = useState<TimetableSlot[]>([]);

  const [selectedSlot, setSelectedSlot] = useState<{ day: number; timeSlot: number | null; startTime?: string; endTime?: string; type?: "lab" | "tutorial" } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [slotLocation, setSlotLocation] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [customTimeDialogOpen, setCustomTimeDialogOpen] = useState(false);
  const [customTimeDay, setCustomTimeDay] = useState(0);
  const [customTimeType, setCustomTimeType] = useState<"lab" | "tutorial">("lab");
  const [customStartTime, setCustomStartTime] = useState("14:00");
  const [customEndTime, setCustomEndTime] = useState("14:50");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLab, setIsLoadingLab] = useState(true);
  const [isLoadingTutorial, setIsLoadingTutorial] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingLab, setIsSavingLab] = useState(false);
  const [isSavingTutorial, setIsSavingTutorial] = useState(false);
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 0 : Math.min(today - 1, 4);
  });

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    // Check lecture timetable
    const lectureChanged = JSON.stringify(timetable) !== JSON.stringify(originalTimetable);
    // Check lab/tutorial timetables
    const labChanged = JSON.stringify(labTimetable) !== JSON.stringify(originalLabTimetable);
    const tutorialChanged = JSON.stringify(tutorialTimetable) !== JSON.stringify(originalTutorialTimetable);
    return lectureChanged || labChanged || tutorialChanged;
  }, [timetable, originalTimetable, labTimetable, originalLabTimetable, tutorialTimetable, originalTutorialTimetable]);

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

  // Fetch lecture timetable
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setIsLoading(true);
        const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
          method: "GET",
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

    // Track timetable page view
    trackAppEvent('timetable_view', {
      timestamp: new Date().toISOString(),
    }).catch(console.error);
  }, []);

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
          const slots = data.slots || [];
          setLabTimetable(slots);
          setOriginalLabTimetable(slots);
        } else {
          setLabTimetable([]);
          setOriginalLabTimetable([]);
        }
      } catch (error) {
        console.error('Error fetching lab timetable:', error);
        setLabTimetable([]);
        setOriginalLabTimetable([]);
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
          const slots = data.slots || [];
          setTutorialTimetable(slots);
          setOriginalTutorialTimetable(slots);
        } else {
          setTutorialTimetable([]);
          setOriginalTutorialTimetable([]);
        }
      } catch (error) {
        console.error('Error fetching tutorial timetable:', error);
        setTutorialTimetable([]);
        setOriginalTutorialTimetable([]);
      } finally {
        setIsLoadingTutorial(false);
      }
    };

    fetchTutorialTimetable();
  }, [student]);

  // Helper to format time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get all slots (standard + custom) for a day, sorted by time
  const getAllSlotsForDay = (day: number) => {
    const standardSlots = timeSlots.slice(0, 6).map((time, timeIndex) => {
      const slot = timetable.find((s) => s.day === day && s.timeSlot === timeIndex && !s.startTime);
      return {
        type: 'standard' as const,
        timeSlot: timeIndex,
        time,
        slot,
        startTime: time.split(" - ")[0],
        endTime: time.split(" - ")[1],
      };
    });

    const customSlots = timetable
      .filter((s) => s.day === day && s.startTime && s.endTime)
      .map((slot) => {
        const start = slot.startTime!;
        const end = slot.endTime!;
        return {
          type: 'custom' as const,
          timeSlot: null,
          time: `${start} - ${end}`,
          slot,
          startTime: start,
          endTime: end,
        };
      });

    // Sort all slots by start time
    const allSlots = [...standardSlots, ...customSlots].sort((a, b) => {
      const aTime = a.startTime.split(':').map(Number);
      const bTime = b.startTime.split(':').map(Number);
      const aMinutes = aTime[0] * 60 + aTime[1];
      const bMinutes = bTime[0] * 60 + bTime[1];
      return aMinutes - bMinutes;
    });

    return allSlots;
  };

  const getSlotSubject = (day: number, timeSlot: number | null, startTime?: string, endTime?: string) => {
    let slot: TimetableSlot | undefined;

    if (timeSlot !== null) {
      // Standard slot
      slot = timetable.find((s) => s.day === day && s.timeSlot === timeSlot && !s.startTime);
    } else if (startTime && endTime) {
      // Custom time slot
      slot = timetable.find((s) =>
        s.day === day &&
        s.startTime === startTime &&
        s.endTime === endTime
      );
    }

    if (slot?.subjectId) {
      return enrolledSubjects.find((s) => s.id === slot.subjectId);
    }
    return null;
  };

  const handleSlotClick = (day: number, timeSlot: number | null, startTime?: string, endTime?: string, type?: "lab" | "tutorial") => {
    setSelectedSlot({ day, timeSlot, startTime, endTime, type });

    // Pre-fill location and subject when editing an existing lab/tutorial slot
    if (type === "lab" || type === "tutorial") {
      const currentTimetable = type === "lab" ? labTimetable : tutorialTimetable;
      if (startTime && endTime) {
        const existingSlot = currentTimetable.find(
          (s) => s.day === day && s.startTime === startTime && s.endTime === endTime
        );
        if (existingSlot) {
          setSelectedSubjectId(existingSlot.subjectId || null);
          setSlotLocation(existingSlot.location || "");
        } else {
          setSelectedSubjectId(null);
          setSlotLocation("");
        }
      } else {
        setSelectedSubjectId(null);
        setSlotLocation("");
      }
    } else {
      // Reset for lecture slots
      setSelectedSubjectId(null);
      setSlotLocation("");
    }

    setDialogOpen(true);
  };

  const handleSubjectSelect = (subjectId: string | null) => {
    // For lecture slots, save immediately (no location needed)
    if (selectedSlot && selectedSlot.type !== "lab" && selectedSlot.type !== "tutorial") {
      handleConfirmAssignment(subjectId);
      return;
    }

    // For lab/tutorial slots, just set the selected subject - don't save yet
    setSelectedSubjectId(subjectId);
    if (subjectId === null) {
      // Clearing subject - save immediately
      handleConfirmAssignment(null);
    }
  };

  const handleConfirmAssignment = (subjectId: string | null) => {
    if (!selectedSlot) return;

    const finalSubjectId = subjectId !== null ? subjectId : selectedSubjectId;
    if (finalSubjectId === null && subjectId === null) {
      // Clearing subject
      subjectId = null;
    } else if (finalSubjectId === null) {
      // No subject selected yet
      return;
    }

    // Handle lab/tutorial slots
    if (selectedSlot.type === "lab" || selectedSlot.type === "tutorial") {
      const currentTimetable = selectedSlot.type === "lab" ? labTimetable : tutorialTimetable;
      const setTimetable = selectedSlot.type === "lab" ? setLabTimetable : setTutorialTimetable;

      if (!selectedSlot.startTime || !selectedSlot.endTime) return;

      let updatedTimetable: TimetableSlot[] = currentTimetable.map((slot) =>
        slot.day === selectedSlot.day &&
          slot.startTime === selectedSlot.startTime &&
          slot.endTime === selectedSlot.endTime
          ? { ...slot, subjectId: finalSubjectId, location: slotLocation.trim() || undefined }
          : slot
      );

      const existingSlot = updatedTimetable.find(
        (s) => s.day === selectedSlot.day &&
          s.startTime === selectedSlot.startTime &&
          s.endTime === selectedSlot.endTime
      );
      if (!existingSlot) {
        updatedTimetable.push({
          day: selectedSlot.day,
          timeSlot: null,
          subjectId: finalSubjectId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          location: slotLocation.trim() || undefined,
        });
      }

      setTimetable(updatedTimetable);
      setDialogOpen(false);
      setSelectedSlot(null);
      setSelectedSubjectId(null);
      setSlotLocation("");
      return;
    }

    // Handle lecture slots (immediate save, no location needed)
    let updatedTimetable: TimetableSlot[];

    if (selectedSlot.timeSlot !== null) {
      // Standard slot
      updatedTimetable = timetable.map((slot) =>
        slot.day === selectedSlot.day && slot.timeSlot === selectedSlot.timeSlot && !slot.startTime
          ? { ...slot, subjectId: finalSubjectId }
          : slot
      );

      const existingSlot = updatedTimetable.find(
        (s) => s.day === selectedSlot.day && s.timeSlot === selectedSlot.timeSlot && !s.startTime
      );
      if (!existingSlot) {
        updatedTimetable.push({
          day: selectedSlot.day,
          timeSlot: selectedSlot.timeSlot,
          subjectId: finalSubjectId,
        });
      }
    } else if (selectedSlot.startTime && selectedSlot.endTime) {
      // Custom time slot
      updatedTimetable = timetable.map((slot) =>
        slot.day === selectedSlot.day &&
          slot.startTime === selectedSlot.startTime &&
          slot.endTime === selectedSlot.endTime
          ? { ...slot, subjectId: finalSubjectId }
          : slot
      );

      const existingSlot = updatedTimetable.find(
        (s) => s.day === selectedSlot.day &&
          s.startTime === selectedSlot.startTime &&
          s.endTime === selectedSlot.endTime
      );
      if (!existingSlot) {
        updatedTimetable.push({
          day: selectedSlot.day,
          timeSlot: null,
          subjectId: finalSubjectId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        });
      }
    } else {
      return;
    }

    setTimetable(updatedTimetable);
    setDialogOpen(false);
    setSelectedSlot(null);
    setSelectedSubjectId(null);
  };

  const handleClearSlot = (day: number, timeSlot: number | null, e: React.MouseEvent, startTime?: string, endTime?: string, type?: "lab" | "tutorial") => {
    e.stopPropagation();

    // Handle lab/tutorial slots
    if (type === "lab" || type === "tutorial") {
      const currentTimetable = type === "lab" ? labTimetable : tutorialTimetable;
      const setTimetable = type === "lab" ? setLabTimetable : setTutorialTimetable;

      if (!startTime || !endTime) return;

      const updatedTimetable = currentTimetable.filter(
        (slot) => !(slot.day === day && slot.startTime === startTime && slot.endTime === endTime)
      );

      setTimetable(updatedTimetable);
      return;
    }

    // Handle lecture slots
    let updatedTimetable: TimetableSlot[];

    if (timeSlot !== null) {
      // Standard slot
      updatedTimetable = timetable.filter(
        (slot) => !(slot.day === day && slot.timeSlot === timeSlot && !slot.startTime)
      );
    } else if (startTime && endTime) {
      // Custom time slot
      updatedTimetable = timetable.filter(
        (slot) => !(slot.day === day && slot.startTime === startTime && slot.endTime === endTime)
      );
    } else {
      return;
    }

    setTimetable(updatedTimetable);
  };

  const handleAddCustomTime = (type?: "lab" | "tutorial") => {
    if (!customStartTime || !customEndTime) {
      toast.error("Please enter both start and end times");
      return;
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(customStartTime) || !timeRegex.test(customEndTime)) {
      toast.error("Invalid time format. Use HH:mm (e.g., 14:30)");
      return;
    }

    // Handle lab/tutorial custom time
    if (type === "lab" || type === "tutorial") {
      const currentTimetable = type === "lab" ? labTimetable : tutorialTimetable;
      const setTimetable = type === "lab" ? setLabTimetable : setTutorialTimetable;

      // Check if custom time already exists
      const exists = currentTimetable.some(
        (s) => s.day === customTimeDay &&
          s.startTime === customStartTime &&
          s.endTime === customEndTime
      );

      if (exists) {
        toast.error("This time slot already exists");
        return;
      }

      // Add custom time slot (without location - location will be set when assigning subject)
      setTimetable([
        ...currentTimetable,
        {
          day: customTimeDay,
          timeSlot: null,
          subjectId: null,
          startTime: customStartTime,
          endTime: customEndTime,
        },
      ]);

      setCustomTimeDialogOpen(false);
      toast.success(`${type === "lab" ? "Lab" : "Tutorial"} time slot added`);
      return;
    }

    // Handle lecture custom time
    // Check if custom time already exists
    const exists = timetable.some(
      (s) => s.day === customTimeDay &&
        s.startTime === customStartTime &&
        s.endTime === customEndTime
    );

    if (exists) {
      toast.error("This time slot already exists");
      return;
    }

    // Add custom time slot
    setTimetable([
      ...timetable,
      {
        day: customTimeDay,
        timeSlot: null,
        subjectId: null,
        startTime: customStartTime,
        endTime: customEndTime,
      },
    ]);

    setCustomTimeDialogOpen(false);
    toast.success("Custom time slot added");
  };

  const saveTimetable = async (silent: boolean = false) => {
    try {
      setIsSaving(true);
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slots: timetable,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save timetable');
      }

      setOriginalTimetable([...timetable]);
      if (!silent) {
        toast.success('Lecture timetable saved');
      }
    } catch (error: any) {
      console.error('Error saving timetable:', error);
      if (!silent) {
        toast.error(error.message || 'Failed to save timetable');
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const saveLabTimetable = async (silent: boolean = false) => {
    try {
      setIsSavingLab(true);
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.LAB_TIMETABLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slots: labTimetable,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save lab timetable');
      }

      setOriginalLabTimetable([...labTimetable]);
      if (!silent) {
        toast.success('Lab timetable saved');
      }
    } catch (error: any) {
      console.error('Error saving lab timetable:', error);
      if (!silent) {
        toast.error(error.message || 'Failed to save lab timetable');
      }
      throw error;
    } finally {
      setIsSavingLab(false);
    }
  };

  const saveTutorialTimetable = async (silent: boolean = false) => {
    try {
      setIsSavingTutorial(true);
      const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.TUTORIAL_TIMETABLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slots: tutorialTimetable,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save tutorial timetable');
      }

      setOriginalTutorialTimetable([...tutorialTimetable]);
      if (!silent) {
        toast.success('Tutorial timetable saved');
      }
    } catch (error: any) {
      console.error('Error saving tutorial timetable:', error);
      if (!silent) {
        toast.error(error.message || 'Failed to save tutorial timetable');
      }
      throw error;
    } finally {
      setIsSavingTutorial(false);
    }
  };

  const saveAllTimetables = async () => {
    try {
      await Promise.all([
        saveTimetable(true),
        saveLabTimetable(true),
        saveTutorialTimetable(true),
      ]);
      toast.success('Timetable saved');
    } catch (error: any) {
      toast.error('Failed to save timetable');
    }
  };

  const handleRegenerate = async () => {
    setTimetable([]);
  };

  const getDaySlotCount = (dayIndex: number) => {
    if (activeTab === "lecture") {
      return timetable.filter(s => s.day === dayIndex && s.subjectId !== null).length;
    } else {
      const labCount = labTimetable.filter(s => s.day === dayIndex && s.subjectId !== null).length;
      const tutorialCount = tutorialTimetable.filter(s => s.day === dayIndex && s.subjectId !== null).length;
      return labCount + tutorialCount;
    }
  };

  const totalWeekClasses = days.reduce((acc, _, idx) => acc + getDaySlotCount(idx), 0);

  // Get all custom slots for lab/tutorial for a day
  const getAllLabTutorialSlotsForDay = (day: number, type: "lab" | "tutorial") => {
    const currentTimetable = type === "lab" ? labTimetable : tutorialTimetable;
    return currentTimetable
      .filter((s) => s.day === day && s.startTime && s.endTime)
      .map((slot) => {
        const start = slot.startTime!;
        const end = slot.endTime!;
        return {
          type: type as "lab" | "tutorial",
          timeSlot: null,
          time: `${start} - ${end}`,
          slot,
          startTime: start,
          endTime: end,
        };
      })
      .sort((a, b) => {
        const aTime = a.startTime.split(':').map(Number);
        const bTime = b.startTime.split(':').map(Number);
        const aMinutes = aTime[0] * 60 + aTime[1];
        const bMinutes = bTime[0] * 60 + bTime[1];
        return aMinutes - bMinutes;
      });
  };

  const discardChanges = () => {
    setTimetable([...originalTimetable]);
    setLabTimetable([...originalLabTimetable]);
    setTutorialTimetable([...originalTutorialTimetable]);
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
    await saveAllTimetables();
    setShowUnsavedDialog(false);
    if (pendingNavigation === 'back') {
      navigate(-1);
    }
    setPendingNavigation(null);
  };

  return (

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
              onClick={saveAllTimetables}
              disabled={isSaving || isSavingLab || isSavingTutorial}
              size="sm"
              className="h-8 gap-1.5"
            >
              {(isSaving || isSavingLab || isSavingTutorial) ? (
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
                {hasUnsavedChanges() ? "Discard" : "Clear all"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[90vw] rounded-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base">
                  {hasUnsavedChanges() ? "Discard Changes?" : "Reset Timetable?"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  {hasUnsavedChanges()
                    ? "This will discard all unsaved changes and restore the last saved timetable."
                    : "This will remove all scheduled classes."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={hasUnsavedChanges() ? discardChanges : handleRegenerate}
                  className="bg-destructive text-destructive-foreground h-9 text-sm"
                >
                  {hasUnsavedChanges() ? "Discard" : "Reset"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {(isLoading || (activeTab === "lab-tutorial" && (isLoadingLab || isLoadingTutorial))) ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "lecture" | "lab-tutorial")} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-0.5 rounded-xl h-9 mb-5 flex-shrink-0">
              <TabsTrigger
                value="lecture"
                className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium"
              >
                Lecture
              </TabsTrigger>
              <TabsTrigger
                value="lab-tutorial"
                className="rounded-lg text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm font-medium"
              >
                Lab & Tutorial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lecture" className="flex-1 flex flex-col overflow-hidden mt-0">
              {/* Stats Row */}
              <div className="flex items-center gap-3 mb-5 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold">{timetable.filter(s => s.day === activeDay && s.subjectId !== null).length}</span>
                  <span className="text-xs text-muted-foreground">today</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-bold text-muted-foreground">{days.reduce((acc, _, idx) => acc + timetable.filter(s => s.day === idx && s.subjectId !== null).length, 0)}</span>
                  <span className="text-xs text-muted-foreground">this week</span>
                </div>
              </div>

              {/* Day Pills */}
              <div className="grid grid-cols-5 gap-1.5 mb-6 flex-shrink-0">
                {days.map((day, dayIndex) => {
                  const slotCount = timetable.filter(s => s.day === dayIndex && s.subjectId !== null).length;
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

              {/* Timeline */}
              <TimelineContent
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                totalDays={days.length}
                getAllSlotsForDay={getAllSlotsForDay}
                formatTime={formatTime}
                enrolledSubjects={enrolledSubjects}
                handleSlotClick={handleSlotClick}
                handleClearSlot={handleClearSlot}
                onAddCustomTime={() => {
                  setCustomTimeDay(activeDay);
                  setCustomTimeDialogOpen(true);
                }}
              />
            </TabsContent>

            <TabsContent value="lab-tutorial" className="flex-1 flex flex-col overflow-hidden mt-0">
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

              {/* Day Pills */}
              <div className="grid grid-cols-5 gap-1.5 mb-6 flex-shrink-0">
                {days.map((day, dayIndex) => {
                  const labCount = labTimetable.filter(s => s.day === dayIndex && s.subjectId !== null).length;
                  const tutorialCount = tutorialTimetable.filter(s => s.day === dayIndex && s.subjectId !== null).length;
                  const slotCount = labCount + tutorialCount;
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

              {/* Lab/Tutorial Timeline */}
              <LabTutorialTimeline
                activeDay={activeDay}
                setActiveDay={setActiveDay}
                totalDays={days.length}
                getAllSlotsForDay={getAllLabTutorialSlotsForDay}
                formatTime={formatTime}
                enrolledSubjects={enrolledSubjects}
                handleSlotClick={handleSlotClick}
                handleClearSlot={handleClearSlot}
                onAddCustomTime={(type) => {
                  setCustomTimeDay(activeDay);
                  setCustomTimeType(type);
                  setCustomTimeDialogOpen(true);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setSlotLocation("");
          setSelectedSubjectId(null);
        }
      }}>
        <DialogContent className="max-w-sm mx-auto rounded-xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-semibold">
              {selectedSubjectId && (selectedSlot?.type === "lab" || selectedSlot?.type === "tutorial")
                ? "Enter Location"
                : "Select Subject"}
            </DialogTitle>
            {selectedSlot && (
              <p className="text-sm text-muted-foreground mt-1">
                {days[selectedSlot.day]} · {
                  selectedSlot.type === "lab" ? "Lab" :
                    selectedSlot.type === "tutorial" ? "Tutorial" :
                      selectedSlot.timeSlot !== null
                        ? timeSlots[selectedSlot.timeSlot]
                        : selectedSlot.startTime && selectedSlot.endTime
                          ? `${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`
                          : ""
                }
              </p>
            )}
          </DialogHeader>

          {selectedSubjectId && (selectedSlot?.type === "lab" || selectedSlot?.type === "tutorial") ? (
            // Step 2: Show location input after subject is selected
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selected Subject</label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                    {enrolledSubjects.find(s => s.id === selectedSubjectId)?.name.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium truncate w-full">
                      {enrolledSubjects.find(s => s.id === selectedSubjectId)?.name.length > 25 ? enrolledSubjects.find(s => s.id === selectedSubjectId)?.name.slice(0, 25) + '...' : enrolledSubjects.find(s => s.id === selectedSubjectId)?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate w-full">
                      {enrolledSubjects.find(s => s.id === selectedSubjectId)?.code || ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSubjectId(null)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  type="text"
                  value={slotLocation}
                  onChange={(e) => setSlotLocation(e.target.value.toUpperCase())}
                  placeholder="e.g., LAB-101, TUT-201"
                  className="w-full uppercase"
                  maxLength={255}
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubjectId(null)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => handleConfirmAssignment(null)}
                  className="flex-1"
                >
                  Confirm
                </Button>
              </div>
            </div>
          ) : (
            // Step 1: Show subject list
            <div className="space-y-1 max-h-[50vh] overflow-y-auto mt-2">
              {enrolledSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No subjects enrolled</p>
                </div>
              ) : (
                <>
                  {enrolledSubjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => handleSubjectSelect(subject.id)}
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
                  ))}
                  {selectedSlot && selectedSlot.type !== "lab" && selectedSlot.type !== "tutorial" && (
                    <button
                      onClick={() => handleConfirmAssignment(null)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 transition-colors text-left border-t border-border mt-2 pt-2"
                    >
                      <X className="w-4 h-4 text-destructive flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-destructive">Clear Subject</p>
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Time Dialog */}
      <Dialog open={customTimeDialogOpen} onOpenChange={setCustomTimeDialogOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Add Custom Time</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {days[customTimeDay]} {activeTab === "lab-tutorial" && `· ${customTimeType === "lab" ? "Lab" : "Tutorial"}`}
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {activeTab === "lab-tutorial" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCustomTimeType("lab")}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      customTimeType === "lab"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    Lab
                  </button>
                  <button
                    onClick={() => setCustomTimeType("tutorial")}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                      customTimeType === "tutorial"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    Tutorial
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="time"
                value={customStartTime}
                onChange={(e) => setCustomStartTime(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Format: HH:mm (24-hour)</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                value={customEndTime}
                onChange={(e) => setCustomEndTime(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Format: HH:mm (24-hour)</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setCustomTimeDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAddCustomTime(activeTab === "lab-tutorial" ? customTimeType : undefined)}
                className="flex-1"
              >
                Add
              </Button>
            </div>
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

  );
}
