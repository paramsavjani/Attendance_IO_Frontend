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
import { RefreshCw, ChevronLeft, Loader2, AlertTriangle, Clock, Plus, BookOpen, Trash2, X } from "lucide-react";
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
    setSelectedSlot(null);
    await saveTimetable(updatedTimetable);
  };

  const handleClearSlot = async (day: number, timeSlot: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent slot click from firing
    
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

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-secondary/80 rounded-xl transition-all duration-200 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              My Timetable
            </h1>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 h-8 text-xs px-3 rounded-xl border-border/50 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
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
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] mx-4 rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center flex-shrink-0 border border-destructive/20">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <AlertDialogTitle className="text-base font-semibold">Reset Timetable?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm mt-0.5 text-muted-foreground">
                      This will clear all scheduled classes.
                    </AlertDialogDescription>
                  </div>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 gap-2">
                <AlertDialogCancel className="h-10 rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleRegenerate}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 rounded-xl"
                >
                  Reset All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Loading timetable...</p>
          </div>
        ) : (
          <>
            {/* Day Tabs */}
            <div className="flex gap-1 p-1 bg-secondary/50 rounded-2xl border border-border/30">
              {days.map((day, dayIndex) => {
                const slotCount = getDaySlotCount(dayIndex);
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(dayIndex)}
                    className={cn(
                      "flex-1 py-2.5 px-1 rounded-xl text-center transition-all duration-300 relative",
                      activeDay === dayIndex 
                        ? "bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25" 
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    )}
                  >
                    <span className="text-xs font-semibold">{day.slice(0, 3)}</span>
                    {slotCount > 0 && (
                      <span className={cn(
                        "absolute -top-1 -right-0.5 min-w-[18px] h-[18px] text-[10px] font-bold rounded-full flex items-center justify-center px-1",
                        activeDay === dayIndex 
                          ? "bg-primary-foreground text-primary shadow-sm" 
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
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{days[activeDay]}'s Schedule</span>
              </div>
              
              <div className="space-y-2">
                {timeSlots.slice(0, 6).map((time, timeIndex) => {
                  const subject = getSlotSubject(activeDay, timeIndex);
                  const timeStart = time.split(" - ")[0];
                  const timeEnd = time.split(" - ")[1];
                  
                  return (
                    <button
                      key={timeIndex}
                      onClick={() => handleSlotClick(activeDay, timeIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left group active:scale-[0.98]",
                        subject
                          ? "bg-gradient-to-r from-card to-card/80 border border-border/50 hover:border-primary/40 shadow-sm hover:shadow-md hover:shadow-primary/5"
                          : "bg-secondary/30 border border-dashed border-border/30 hover:border-primary/40 hover:bg-secondary/50"
                      )}
                    >
                      {/* Time Column */}
                      <div className="w-14 flex-shrink-0">
                        <p className="text-sm font-bold text-foreground">{timeStart}</p>
                        <p className="text-[11px] text-muted-foreground">{timeEnd}</p>
                      </div>

                      {/* Slot Number */}
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-200",
                        subject 
                          ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary border border-primary/20" 
                          : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 border border-transparent"
                      )}>
                        {timeIndex + 1}
                      </div>

                      {/* Subject Info */}
                      <div className="flex-1 min-w-0">
                        {subject ? (
                          <>
                            <p className="text-sm font-semibold text-foreground truncate">
                              {subject.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{subject.code}</p>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              Add class
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Clear button for assigned slots */}
                      {subject && (
                        <button
                          onClick={(e) => handleClearSlot(activeDay, timeIndex, e)}
                          className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200 flex-shrink-0 border border-transparent hover:border-destructive/20"
                          title="Clear slot"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Today</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{getDaySlotCount(activeDay)}</p>
                <p className="text-[11px] text-muted-foreground">classes</p>
              </div>
              <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Week</p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {days.reduce((acc, _, idx) => acc + getDaySlotCount(idx), 0)}
                </p>
                <p className="text-[11px] text-muted-foreground">total classes</p>
              </div>
            </div>
          </>
        )}

        {/* Assignment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm mx-auto rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">Assign Subject</p>
                  {selectedSlot && (
                    <p className="text-xs font-normal text-muted-foreground mt-0.5">
                      {days[selectedSlot.day]} • Slot {selectedSlot.timeSlot + 1} • {timeSlots[selectedSlot.timeSlot].split(" - ")[0]}
                    </p>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto py-1">
              {enrolledSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-3 border border-border/30">
                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No enrolled subjects</p>
                  <p className="text-xs text-muted-foreground mt-1">Please enroll in subjects first</p>
                </div>
              ) : (
                <>
                  {enrolledSubjects.map((subject, index) => (
                    <button
                      key={subject.id}
                      onClick={() => handleAssignSubject(subject.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 active:scale-[0.98] transition-all duration-200 text-left hover:bg-secondary/50 hover:border-primary/30 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0 border border-primary/20 group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold block truncate text-foreground">{subject.name}</span>
                        <span className="text-xs text-muted-foreground">{subject.code}</span>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}