import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { timeSlots, days } from "@/data/mockData";
import { TimetableSlot, Subject } from "@/types/attendance";
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
import { RefreshCw, X, ChevronLeft, Loader2, AlertTriangle, Calendar } from "lucide-react";
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
  const [activeDay, setActiveDay] = useState(0);

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
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Timetable</h1>
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
            {/* Day Tabs - Horizontal scroll */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {days.map((day, index) => {
                const slotCount = getDaySlotCount(index);
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(index)}
                    className={cn(
                      "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      activeDay === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {day.slice(0, 3)}
                    {slotCount > 0 && (
                      <span className={cn(
                        "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                        activeDay === index 
                          ? "bg-primary-foreground/20" 
                          : "bg-muted"
                      )}>
                        {slotCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Time Slots for Active Day - Compact List */}
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
                      "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left",
                      subject
                        ? "border"
                        : "bg-muted/30 border border-dashed border-border/50"
                    )}
                    style={
                      subject
                        ? {
                            backgroundColor: `hsl(${subject.color} / 0.1)`,
                            borderColor: `hsl(${subject.color} / 0.25)`,
                          }
                        : undefined
                    }
                  >
                    {/* Time Column */}
                    <div className="w-14 flex-shrink-0 text-center">
                      <p className="text-xs font-medium">{timeStart}</p>
                      <p className="text-[10px] text-muted-foreground">{timeEnd}</p>
                    </div>

                    {/* Divider */}
                    <div 
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: subject 
                          ? `hsl(${subject.color})` 
                          : 'hsl(var(--muted))' 
                      }}
                    />

                    {/* Subject Info */}
                    <div className="flex-1 min-w-0">
                      {subject ? (
                        <>
                          <p 
                            className="text-sm font-medium truncate"
                            style={{ color: `hsl(${subject.color})` }}
                          >
                            {subject.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{subject.code}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Free slot</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Overview - All Days Mini Grid */}
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Week Overview
              </p>
              <div className="grid grid-cols-5 gap-1">
                {days.map((day, dayIndex) => (
                  <button
                    key={day}
                    onClick={() => setActiveDay(dayIndex)}
                    className={cn(
                      "rounded-lg p-1.5 transition-all",
                      activeDay === dayIndex 
                        ? "bg-primary/10 ring-1 ring-primary/30" 
                        : "bg-muted/30"
                    )}
                  >
                    <p className="text-[10px] text-center text-muted-foreground mb-1">
                      {day.slice(0, 2)}
                    </p>
                    <div className="grid grid-cols-2 gap-0.5">
                      {timeSlots.slice(0, 6).map((_, timeIndex) => {
                        const subject = getSlotSubject(dayIndex, timeIndex);
                        return (
                          <div
                            key={timeIndex}
                            className="h-1.5 rounded-sm"
                            style={{
                              backgroundColor: subject 
                                ? `hsl(${subject.color})` 
                                : 'hsl(var(--muted))'
                            }}
                          />
                        );
                      })}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Assignment Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm mx-4">
            <DialogHeader>
              <DialogTitle className="text-base">
                {selectedSlot
                  ? `${days[selectedSlot.day]} • ${timeSlots[selectedSlot.timeSlot].split(" - ")[0]}`
                  : "Assign Subject"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-1.5 pt-2 max-h-[50vh] overflow-y-auto">
              {enrolledSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No enrolled subjects. Please enroll in subjects first.
                </p>
              ) : (
                enrolledSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleAssignSubject(subject.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border active:scale-98 transition-all text-left hover:bg-muted/30"
                  >
                    <div
                      className="w-2.5 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${subject.color})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate">{subject.name}</span>
                      <span className="text-xs text-muted-foreground">{subject.code}</span>
                    </div>
                  </button>
                ))
              )}

              <Button
                variant="ghost"
                className="w-full gap-2 text-destructive mt-2"
                onClick={() => handleAssignSubject(null)}
              >
                <X className="w-4 h-4" />
                Clear Slot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}