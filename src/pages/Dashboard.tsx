import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTodaySchedule, subjectAttendance, officialLastDate } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Play, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Dashboard() {
  const { student } = useAuth();
  const schedule = getTodaySchedule();
  const navigate = useNavigate();
  const now = new Date();
  const currentHour = now.getHours();

  // Mock attendance status for today's classes
  const [todayAttendance, setTodayAttendance] = useState<Record<number, 'present' | 'absent' | null>>({});

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

  const getOverallPercentage = () => {
    let totalPresent = 0;
    let totalClasses = 0;
    subjectAttendance.forEach((s) => {
      totalPresent += s.officialPresent + s.estimatedPresent;
      totalClasses += s.officialTotal + s.estimatedTotal;
    });
    return Math.round((totalPresent / totalClasses) * 100);
  };

  const percentage = getOverallPercentage();

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Greeting */}
        <div className="pt-2">
          <p className="text-muted-foreground text-sm">
            {format(now, "EEEE, MMM d")}
          </p>
          <h1 className="text-xl font-bold mt-1">
            Hi, {student?.name?.split(" ")[0]} 👋
          </h1>
        </div>

        {/* Current/Next Class Card - Black theme */}
        {currentClass ? (
          <div className="rounded-2xl p-5 bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              {currentClass.status === "current" ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium text-success">Live Now</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Up Next</span>
                </>
              )}
            </div>
            <h2 className="text-lg font-bold mb-1">
              {currentClass.slot.subject?.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentClass.slot.time}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-5 bg-card border border-border text-center">
            <p className="text-muted-foreground">No more classes today</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Overall</p>
            <p className={cn(
              "text-2xl font-bold",
              percentage >= 75 ? "text-success" : percentage >= 60 ? "text-warning" : "text-destructive"
            )}>
              {percentage}%
            </p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Official till</p>
            <p className="text-sm font-medium">
              {format(new Date(officialLastDate), "MMM d")}
            </p>
          </div>
        </div>

        {/* Track Button */}
        <button
          onClick={() => navigate("/daily")}
          className="w-full bg-card border border-border text-foreground font-medium py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-98 transition-transform"
        >
          <Play className="w-5 h-5 text-primary" />
          Mark Today's Attendance
        </button>

        {/* Today's Schedule with attendance status */}
        <div>
          <h3 className="font-semibold mb-3">Today's Classes</h3>
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
                    isCurrent && "border-success/50",
                    isPast && "opacity-60"
                  )}
                >
                  <div
                    className="w-1 h-10 rounded-full"
                    style={{ backgroundColor: `hsl(${slot.subject.color})` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{slot.subject.name}</p>
                    <p className="text-xs text-muted-foreground">{slot.time}</p>
                  </div>
                  
                  {/* Attendance status indicator */}
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">
                        Now
                      </span>
                    )}
                    {status === 'present' && (
                      <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                    )}
                    {status === 'absent' && (
                      <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center">
                        <X className="w-3 h-3 text-destructive" />
                      </div>
                    )}
                    {!status && isPast && (
                      <span className="text-xs text-muted-foreground">Not marked</span>
                    )}
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
