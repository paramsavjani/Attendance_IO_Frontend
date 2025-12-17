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
import { RefreshCw, X, ChevronLeft, Loader2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/lib/api";
import { useAttendance } from "@/contexts/AttendanceContext";
import { toast } from "sonner";

// Helper to convert hex to HSL
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function Timetable() {
  const navigate = useNavigate();
  const { enrolledSubjects } = useAttendance();
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; timeSlot: number } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

    // Update local state immediately for better UX
    const updatedTimetable = timetable.map((slot) =>
      slot.day === selectedSlot.day && slot.timeSlot === selectedSlot.timeSlot
        ? { ...slot, subjectId }
        : slot
    );

    // If slot doesn't exist, add it
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

    // Save to backend
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

      toast.success('Timetable saved successfully');
    } catch (error: any) {
      console.error('Error saving timetable:', error);
      toast.error(error.message || 'Failed to save timetable');
      // Revert on error - refetch from backend
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
    // Clear all slots
    const emptyTimetable: TimetableSlot[] = [];
    setTimetable(emptyTimetable);
    await saveTimetable(emptyTimetable);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Timetable</h1>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
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
                      This will clear all your scheduled classes.
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
            {/* Days as tabs */}
            {days.map((day, dayIndex) => (
              <div key={day} className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">{day}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.slice(0, 6).map((time, timeIndex) => {
                const subject = getSlotSubject(dayIndex, timeIndex);
                return (
                  <button
                    key={timeIndex}
                    onClick={() => handleSlotClick(dayIndex, timeIndex)}
                    className={cn(
                      "p-3 rounded-xl text-left transition-all",
                      subject
                        ? "border"
                        : "bg-muted/30 border border-dashed border-border"
                    )}
                    style={
                      subject
                        ? {
                            backgroundColor: `hsl(${subject.color} / 0.15)`,
                            borderColor: `hsl(${subject.color} / 0.3)`,
                          }
                        : undefined
                    }
                  >
                    <p className="text-[10px] text-muted-foreground mb-1">
                      {time.split(" - ")[0]}
                    </p>
                    <p className={cn(
                      "text-xs font-medium truncate",
                      subject ? "" : "text-muted-foreground"
                    )}
                    style={subject ? { color: `hsl(${subject.color})` } : undefined}
                    >
                      {subject?.code || "—"}
                    </p>
                  </button>
                );
                  })}
                </div>
              </div>
            ))}
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

            <div className="space-y-2 pt-2">
              {enrolledSubjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No enrolled subjects. Please enroll in subjects first.
                </p>
              ) : (
                enrolledSubjects.map((subject) => (
                  <button
                    key={subject.id}
                    onClick={() => handleAssignSubject(subject.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border active:scale-98 transition-all text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `hsl(${subject.color})` }}
                    />
                    <span className="text-sm font-medium">{subject.name}</span>
                  </button>
                ))
              )}

              <Button
                variant="ghost"
                className="w-full gap-2 text-destructive"
                onClick={() => handleAssignSubject(null)}
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
