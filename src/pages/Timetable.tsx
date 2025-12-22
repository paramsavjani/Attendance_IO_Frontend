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
import { RefreshCw, ChevronLeft, Loader2, AlertTriangle, Clock, Plus, BookOpen, Trash2, LayoutGrid, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/lib/api";
import { useAttendance } from "@/contexts/AttendanceContext";
import { toast } from "sonner";

type ViewMode = 'list' | 'grid';

export default function Timetable() {
  const navigate = useNavigate();
  const { enrolledSubjects } = useAttendance();
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; timeSlot: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
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

  const getSubjectAbbreviation = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
  };

  return (
    <AppLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 hover:bg-muted/50 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold">My Timetable</h1>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center bg-muted/30 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'list' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'grid' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 h-7 text-xs px-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-[calc(100vw-2rem)] mx-4 rounded-xl">
              <AlertDialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <AlertDialogTitle className="text-base">Reset Timetable?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm mt-0.5">
                      This will clear all scheduled classes.
                    </AlertDialogDescription>
                  </div>
                </div>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-3 gap-2">
                <AlertDialogCancel className="h-9">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleRegenerate}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9"
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
        ) : viewMode === 'list' ? (
          /* LIST VIEW */
          <>
            {/* Day Tabs */}
            <div className="flex gap-0.5 p-0.5 bg-muted/30 rounded-lg">
              {days.map((day, dayIndex) => {
                const slotCount = getDaySlotCount(dayIndex);
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(dayIndex)}
                    className={cn(
                      "flex-1 py-1.5 px-0.5 rounded-md text-center transition-all relative",
                      activeDay === dayIndex 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span className="text-[11px] font-medium">{day.slice(0, 3)}</span>
                    {slotCount > 0 && (
                      <span className={cn(
                        "absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[9px] font-medium rounded-full flex items-center justify-center",
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
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-0.5">
                <Clock className="w-3 h-3" />
                <span>{days[activeDay]}'s Schedule</span>
              </div>
              
              <div className="space-y-1">
                {timeSlots.slice(0, 6).map((time, timeIndex) => {
                  const subject = getSlotSubject(activeDay, timeIndex);
                  const timeStart = time.split(" - ")[0];
                  const timeEnd = time.split(" - ")[1];
                  
                  return (
                    <button
                      key={timeIndex}
                      onClick={() => handleSlotClick(activeDay, timeIndex)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left group active:scale-[0.99]",
                        subject
                          ? "bg-card border border-border hover:border-primary/30"
                          : "bg-muted/20 border border-dashed border-border/40 hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      {/* Time Column */}
                      <div className="w-12 flex-shrink-0">
                        <p className="text-xs font-semibold text-foreground">{timeStart}</p>
                        <p className="text-[10px] text-muted-foreground">{timeEnd}</p>
                      </div>

                      {/* Slot Number */}
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-medium",
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
                            <p className="text-xs font-medium text-foreground truncate">
                              {subject.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{subject.code}</p>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                              Add class
                            </span>
                          </div>
                        )}
                      </div>

                      {subject && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-card border border-border rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-0.5">Today's Classes</p>
                <p className="text-xl font-bold text-foreground">{getDaySlotCount(activeDay)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-2.5">
                <p className="text-[10px] text-muted-foreground mb-0.5">Week Total</p>
                <p className="text-xl font-bold text-foreground">
                  {days.reduce((acc, _, idx) => acc + getDaySlotCount(idx), 0)}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* GRID VIEW */
          <div className="space-y-2">
            {/* Grid Header - Days */}
            <div className="grid grid-cols-[40px_repeat(5,1fr)] gap-0.5">
              <div className="text-[10px] text-muted-foreground text-center py-1">Time</div>
              {days.map((day) => (
                <div key={day} className="text-[10px] font-medium text-center py-1 text-muted-foreground">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Grid Body */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {timeSlots.slice(0, 6).map((time, timeIndex) => {
                const timeStart = time.split(" - ")[0];
                
                return (
                  <div 
                    key={timeIndex} 
                    className={cn(
                      "grid grid-cols-[40px_repeat(5,1fr)] gap-0.5",
                      timeIndex !== 5 && "border-b border-border/50"
                    )}
                  >
                    {/* Time Label */}
                    <div className="flex items-center justify-center py-2 px-1 bg-muted/30">
                      <span className="text-[9px] font-medium text-muted-foreground leading-tight text-center">
                        {timeStart}
                      </span>
                    </div>

                    {/* Day Slots */}
                    {days.map((_, dayIndex) => {
                      const subject = getSlotSubject(dayIndex, timeIndex);
                      
                      return (
                        <button
                          key={dayIndex}
                          onClick={() => handleSlotClick(dayIndex, timeIndex)}
                          className={cn(
                            "min-h-[48px] p-1 flex items-center justify-center transition-all active:scale-95",
                            subject
                              ? "bg-primary/10 hover:bg-primary/20"
                              : "bg-transparent hover:bg-muted/30",
                            dayIndex !== 4 && "border-r border-border/30"
                          )}
                        >
                          {subject ? (
                            <div className="text-center w-full">
                              <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center mx-auto mb-0.5">
                                <span className="text-[9px] font-bold text-primary">
                                  {getSubjectAbbreviation(subject.name)}
                                </span>
                              </div>
                              <p className="text-[8px] text-muted-foreground truncate px-0.5 leading-tight">
                                {subject.code}
                              </p>
                            </div>
                          ) : (
                            <Plus className="w-3 h-3 text-muted-foreground/40" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary/20" />
                <span className="text-[10px] text-muted-foreground">Scheduled</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-muted/30 border border-dashed border-border/50" />
                <span className="text-[10px] text-muted-foreground">Free slot</span>
              </div>
            </div>

            {/* Weekly Summary in Grid View */}
            <div className="bg-card border border-border rounded-lg p-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">Weekly Classes</p>
                <p className="text-lg font-bold text-foreground">
                  {days.reduce((acc, _, idx) => acc + getDaySlotCount(idx), 0)}
                </p>
              </div>
              <div className="flex gap-1 mt-2">
                {days.map((day, idx) => (
                  <div key={day} className="flex-1 text-center">
                    <div className={cn(
                      "text-xs font-bold mb-0.5",
                      getDaySlotCount(idx) > 0 ? "text-primary" : "text-muted-foreground"
                    )}>
                      {getDaySlotCount(idx)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">{day.slice(0, 2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Assignment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] mx-4 rounded-xl">
            <DialogHeader className="pb-1">
              <DialogTitle className="text-sm flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold">Assign Subject</p>
                  {selectedSlot && (
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {days[selectedSlot.day]} • Slot {selectedSlot.timeSlot + 1} • {timeSlots[selectedSlot.timeSlot].split(" - ")[0]}
                    </p>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-1 max-h-[45vh] overflow-y-auto">
              {enrolledSubjects.length === 0 ? (
                <div className="text-center py-5">
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">No enrolled subjects</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Please enroll in subjects first</p>
                </div>
              ) : (
                <>
                  {enrolledSubjects.map((subject, index) => (
                    <button
                      key={subject.id}
                      onClick={() => handleAssignSubject(subject.id)}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-border active:scale-[0.98] transition-all text-left hover:bg-muted/30 hover:border-primary/30"
                    >
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary text-[10px] font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium block truncate text-foreground">{subject.name}</span>
                        <span className="text-[10px] text-muted-foreground">{subject.code}</span>
                      </div>
                    </button>
                  ))}
                  
                  {selectedSlot && getSlotSubject(selectedSlot.day, selectedSlot.timeSlot) && (
                    <div className="pt-1.5 mt-1.5 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs"
                        onClick={() => handleAssignSubject(null)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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