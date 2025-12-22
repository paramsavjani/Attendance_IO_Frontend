import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { timeSlots, days } from "@/data/mockData";
import { TimetableSlot } from "@/types/attendance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { RefreshCw, ChevronLeft, Loader2, AlertTriangle, Clock, Plus, BookOpen, Trash2 } from "lucide-react";
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
    // Convert Sunday (0) to Monday (0), Monday (1) to Monday (0), etc.
    return today === 0 ? 0 : Math.min(today - 1, 4);
  });

  // Fetch timetable from backend
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

  // Get count of slots for each day
  const getDaySlotCount = (dayIndex: number) => {
    return timetable.filter(s => s.day === dayIndex && s.subjectId).length;
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted/50 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">My Timetable</h1>
            <p className="text-xs text-muted-foreground">Tap any slot to assign a subject</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 h-8 text-xs"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm mx-4">
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <AlertDialogTitle>Reset Timetable?</AlertDialogTitle>
                    <AlertDialogDescription className="mt-1">
                      This will clear all scheduled classes.
                    </AlertDialogDescription>
                  </div>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleRegenerate}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Reset All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Day Tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-xl">
              {days.map((day, dayIndex) => {
                const slotCount = getDaySlotCount(dayIndex);
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(dayIndex)}
                    className={cn(
                      "flex-1 py-2 px-1 rounded-lg text-center transition-all relative",
                      activeDay === dayIndex 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="text-xs font-medium">{day.slice(0, 3)}</span>
                    {slotCount > 0 && (
                      <span className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 text-[10px] font-medium rounded-full flex items-center justify-center",
                        activeDay === dayIndex 
                          ? "bg-primary-foreground text-primary" 
                          : "bg-primary/20 text-primary"
                      )}>
                        {slotCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Time Slots List */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{days[activeDay]}'s Schedule</span>
              </div>
              
              <div className="space-y-1.5">
                {timeSlots.slice(0, 6).map((time, timeIndex) => {
                  const subject = getSlotSubject(activeDay, timeIndex);
                  const timeStart = time.split(" - ")[0];
                  const timeEnd = time.split(" - ")[1];
                  
                  return (
                    <button
                      key={timeIndex}
                      onClick={() => handleSlotClick(activeDay, timeIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                        subject
                          ? "bg-card border border-border hover:border-primary/30"
                          : "bg-muted/20 border border-dashed border-border/40 hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      {/* Time Column */}
                      <div className="w-16 flex-shrink-0">
                        <p className="text-sm font-semibold text-foreground">{timeStart}</p>
                        <p className="text-[11px] text-muted-foreground">{timeEnd}</p>
                      </div>

                      {/* Slot Number */}
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium",
                        subject 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted/50 text-muted-foreground"
                      )}>
                        {timeIndex + 1}
                      </div>

                      {/* Subject Info */}
                      <div className="flex-1 min-w-0">
                        {subject ? (
                          <>
                            <p className="text-sm font-medium text-foreground truncate">
                              {subject.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{subject.code}</p>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              Add class
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status indicator */}
                      {subject && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-card border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Today's Classes</p>
                <p className="text-2xl font-bold text-foreground">{getDaySlotCount(activeDay)}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Week Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {days.reduce((acc, _, idx) => acc + getDaySlotCount(idx), 0)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Assignment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Assign Subject</p>
                  {selectedSlot && (
                    <p className="text-xs font-normal text-muted-foreground">
                      {days[selectedSlot.day]} • Slot {selectedSlot.timeSlot + 1} • {timeSlots[selectedSlot.timeSlot].split(" - ")[0]}
                    </p>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
              {enrolledSubjects.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No enrolled subjects</p>
                  <p className="text-xs text-muted-foreground mt-1">Please enroll in subjects first</p>
                </div>
              ) : (
                <>
                  {enrolledSubjects.map((subject, index) => (
                    <button
                      key={subject.id}
                      onClick={() => handleAssignSubject(subject.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border active:scale-[0.98] transition-all text-left hover:bg-muted/30 hover:border-primary/30"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate text-foreground">{subject.name}</span>
                        <span className="text-xs text-muted-foreground">{subject.code}</span>
                      </div>
                    </button>
                  ))}
                  
                  {/* Clear slot option */}
                  {selectedSlot && getSlotSubject(selectedSlot.day, selectedSlot.timeSlot) && (
                    <div className="pt-2 mt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleAssignSubject(null)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove from slot
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}