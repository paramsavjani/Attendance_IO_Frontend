import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTodaySchedule, subjectAttendance, officialLastDate } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, X, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const DEFAULT_MIN_ATTENDANCE = 75;

export default function Dashboard() {
  const { student } = useAuth();
  const schedule = getTodaySchedule();
  const now = new Date();
  const currentHour = now.getHours();

  const [todayAttendance, setTodayAttendance] = useState<Record<number, 'present' | 'absent' | null>>({});
  const [minAttendance, setMinAttendance] = useState<number>(() => {
    const saved = localStorage.getItem('minAttendance');
    return saved ? parseInt(saved) : DEFAULT_MIN_ATTENDANCE;
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('minAttendance', minAttendance.toString());
  }, [minAttendance]);

  const getCurrentClass = () => {
    for (const slot of schedule.slots) {
      const startHour = parseInt(slot.time.split(":")[0]);
      if (startHour === currentHour && slot.subject) {
        return { slot, status: "current" as const, index: schedule.slots.indexOf(slot) };
      }
    }
    for (const slot of schedule.slots) {
      const startHour = parseInt(slot.time.split(":")[0]);
      if (startHour > currentHour && slot.subject) {
        return { slot, status: "next" as const, index: schedule.slots.indexOf(slot) };
      }
    }
    return null;
  };

  const currentClass = getCurrentClass();

  const handleMarkAttendance = (index: number, status: 'present' | 'absent') => {
    setTodayAttendance(prev => ({
      ...prev,
      [index]: prev[index] === status ? null : status
    }));
    toast.success(status === 'present' ? 'Marked Present' : 'Marked Absent');
  };

  const getSubjectStatus = (percentage: number) => {
    if (percentage >= minAttendance) return 'safe';
    if (percentage >= minAttendance - 10) return 'warning';
    return 'danger';
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header with greeting and settings */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-muted-foreground text-xs">
              {format(now, "EEEE, MMM d")}
            </p>
            <h1 className="text-lg font-bold">
              Hi, {student?.name?.split(" ")[0]}
            </h1>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl bg-card border border-border"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-medium">Minimum Attendance Required</p>
            <div className="flex items-center gap-3">
              {[60, 70, 75, 80].map((val) => (
                <button
                  key={val}
                  onClick={() => setMinAttendance(val)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    minAttendance === val
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current/Next Class Card */}
        {currentClass ? (
          <div className="rounded-2xl p-4 bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              {currentClass.status === "current" ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-medium text-success">Live Now</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Up Next</span>
                </>
              )}
            </div>
            <h2 className="text-base font-bold mb-1">
              {currentClass.slot.subject?.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {currentClass.slot.time}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-4 bg-card border border-border text-center">
            <p className="text-muted-foreground text-sm">No more classes today</p>
          </div>
        )}

        {/* Subject-wise Attendance Status */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Subject Status</h3>
            <span className="text-xs text-muted-foreground">Min: {minAttendance}%</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {subjectAttendance.map((sa) => {
              const total = sa.officialTotal + sa.estimatedTotal;
              const present = sa.officialPresent + sa.estimatedPresent;
              const percentage = Math.round((present / total) * 100);
              const status = getSubjectStatus(percentage);

              return (
                <div
                  key={sa.subject.id}
                  className="bg-card border border-border rounded-xl p-3"
                >
                  <p className="text-xs text-muted-foreground truncate mb-1">
                    {sa.subject.code}
                  </p>
                  <p className={cn(
                    "text-xl font-bold",
                    status === 'safe' && "text-success",
                    status === 'warning' && "text-warning",
                    status === 'danger' && "text-destructive"
                  )}>
                    {percentage}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {present}/{total}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Official Date Notice */}
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Official till {format(new Date(officialLastDate), "MMM d, yyyy")}
          </p>
        </div>

        {/* Today's Schedule - Tap to Mark */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Today's Classes</h3>
          <div className="space-y-2">
            {schedule.slots.map((slot, index) => {
              const startHour = parseInt(slot.time.split(":")[0]);
              const isPast = startHour < currentHour;
              const isCurrent = startHour === currentHour;
              const status = todayAttendance[index];

              if (!slot.subject) return null;

              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl bg-card border border-border transition-all",
                    isCurrent && "border-success/50"
                  )}
                >
                  <div
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: `hsl(${slot.subject.color})` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{slot.subject.name}</p>
                    <p className="text-xs text-muted-foreground">{slot.time}</p>
                  </div>
                  
                  {/* Attendance marking buttons */}
                  <div className="flex items-center gap-1">
                    {isCurrent && (
                      <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full mr-1">
                        Now
                      </span>
                    )}
                    <button
                      onClick={() => handleMarkAttendance(index, 'present')}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95",
                        status === 'present'
                          ? "bg-success text-background"
                          : "bg-success/20 text-success"
                      )}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(index, 'absent')}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95",
                        status === 'absent'
                          ? "bg-destructive text-background"
                          : "bg-destructive/20 text-destructive"
                      )}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}