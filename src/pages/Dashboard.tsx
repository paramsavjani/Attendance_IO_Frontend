import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTodaySchedule, subjectAttendance } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SubjectCard } from "@/components/attendance/SubjectCard";

const DEFAULT_MIN = 75;

export default function Dashboard() {
  const { student } = useAuth();
  const schedule = getTodaySchedule();
  const now = new Date();
  const currentHour = now.getHours();

  const [todayAttendance, setTodayAttendance] = useState<Record<number, 'present' | 'absent' | null>>({});
  const [subjectMinAttendance, setSubjectMinAttendance] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('subjectMinAttendance');
    if (saved) return JSON.parse(saved);
    const defaults: Record<string, number> = {};
    subjectAttendance.forEach(sa => { defaults[sa.subject.id] = DEFAULT_MIN; });
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('subjectMinAttendance', JSON.stringify(subjectMinAttendance));
  }, [subjectMinAttendance]);

  const handleMarkAttendance = (index: number, status: 'present' | 'absent') => {
    setTodayAttendance(prev => ({
      ...prev,
      [index]: prev[index] === status ? null : status
    }));
    toast.success(status === 'present' ? 'Marked Present' : 'Marked Absent');
  };

  const handleSetMin = (subjectId: string, value: number) => {
    setSubjectMinAttendance(prev => ({ ...prev, [subjectId]: value }));
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="pt-2">
          <p className="text-muted-foreground text-xs">
            {format(now, "EEEE, MMM d")}
          </p>
          <h1 className="text-lg font-bold">
            Hi, {student?.name?.split(" ")[0]}
          </h1>
        </div>

        {/* Today's Schedule - Tap to Mark */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Today's Classes</h3>
          <div className="space-y-2">
            {schedule.slots.map((slot, index) => {
              const startHour = parseInt(slot.time.split(":")[0]);
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

        {/* Subject-wise Attendance Status */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Subject Status</h3>
          <div className="space-y-2">
            {subjectAttendance.map((sa) => {
              const total = sa.officialTotal + sa.estimatedTotal;
              const present = sa.officialPresent + sa.estimatedPresent;
              const absent = total - present;
              const minRequired = subjectMinAttendance[sa.subject.id] || DEFAULT_MIN;

              return (
                <SubjectCard
                  key={sa.subject.id}
                  name={sa.subject.name}
                  code={sa.subject.code}
                  color={sa.subject.color}
                  present={present}
                  absent={absent}
                  total={total}
                  minRequired={minRequired}
                  onMinChange={(val) => handleSetMin(sa.subject.id, val)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}