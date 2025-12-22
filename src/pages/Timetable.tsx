import { useState, useEffect } from "react";
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
import { ChevronLeft, Loader2, Plus, BookOpen, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/lib/api";
import { useAttendance } from "@/contexts/AttendanceContext";
import { toast } from "sonner";

export default function Timetable() {
  const navigate = useNavigate();
  const { enrolledSubjects } = useAttendance();
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; timeSlot: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 0 : Math.min(today - 1, 4);
  });

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setTimetable(data.slots || []);
        } else {
          setTimetable([]);
        }
      } catch (error) {
        console.error('Error fetching timetable:', error);
        setTimetable([]);
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

  const handleAssignSubject = async (subjectId: string | null) => {
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
    await saveTimetable(updatedTimetable);
  };

  const handleClearSlot = async (day: number, timeSlot: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const updatedTimetable = timetable.filter(
      (slot) => !(slot.day === day && slot.timeSlot === timeSlot)
    );

    setTimetable(updatedTimetable);
    await saveTimetable(updatedTimetable);
  };

  const saveTimetable = async (timetableToSave: TimetableSlot[]) => {
    try {
      setIsSaving(true);
      const response = await fetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          slots: timetableToSave,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save timetable');
      }

      toast.success('Timetable saved');
    } catch (error: any) {
      console.error('Error saving timetable:', error);
      toast.error(error.message || 'Failed to save timetable');
      const response = await fetch(API_CONFIG.ENDPOINTS.TIMETABLE, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTimetable(data.slots || []);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    const emptyTimetable: TimetableSlot[] = [];
    setTimetable(emptyTimetable);
    await saveTimetable(emptyTimetable);
  };

  const getDaySlotCount = (dayIndex: number) => {
    return timetable.filter(s => s.day === dayIndex && s.subjectId).length;
  };

  const totalWeekClasses = days.reduce((acc, _, idx) => acc + getDaySlotCount(idx), 0);

  return (
    <AppLayout>
      <div className="min-h-screen pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-semibold">Timetable</h1>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button 
                className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Clear all"}
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

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="flex items-center gap-3 mb-5">
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
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
              {days.map((day, dayIndex) => {
                const slotCount = getDaySlotCount(dayIndex);
                const isActive = activeDay === dayIndex;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(dayIndex)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                      isActive 
                        ? "bg-foreground text-background" 
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {day.slice(0, 3)}
                    {slotCount > 0 && (
                      <span className={cn(
                        "ml-1.5 text-xs",
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
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-border rounded-full" />

              <div className="space-y-1">
                {timeSlots.slice(0, 6).map((time, timeIndex) => {
                  const subject = getSlotSubject(activeDay, timeIndex);
                  const timeStart = time.split(" - ")[0];
                  const timeEnd = time.split(" - ")[1];
                  
                  return (
                    <div key={timeIndex} className="relative flex items-start gap-4 py-2">
                      {/* Dot */}
                      <div 
                        className={cn(
                          "absolute left-[-18px] top-[14px] w-[10px] h-[10px] rounded-full border-2 bg-background",
                          subject 
                            ? "border-primary bg-primary" 
                            : "border-muted-foreground/40"
                        )} 
                      />

                      {/* Time */}
                      <div className="w-11 flex-shrink-0 pt-1">
                        <p className="text-xs font-medium">{timeStart}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{timeEnd}</p>
                      </div>

                      {/* Content */}
                      <button
                        onClick={() => handleSlotClick(activeDay, timeIndex)}
                        className="flex-1 min-w-0 text-left group"
                      >
                        {subject ? (
                          <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
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
                          <div className="border border-dashed border-border rounded-lg p-3 group-hover:border-muted-foreground/50 transition-colors">
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
          </>
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
      </div>
    </AppLayout>
  );
}
