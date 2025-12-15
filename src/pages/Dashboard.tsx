import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTodaySchedule, subjectAttendance } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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
  const [editingSubject, setEditingSubject] = useState<string | null>(null);

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
    setEditingSubject(null);
  };

  const getSubjectStatus = (percentage: number, minRequired: number) => {
    if (percentage >= minRequired) return 'safe';
    if (percentage >= minRequired - 10) return 'warning';
    return 'danger';
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
              const percentage = Math.round((present / total) * 100);
              const minRequired = subjectMinAttendance[sa.subject.id] || DEFAULT_MIN;
              const status = getSubjectStatus(percentage, minRequired);
              const isEditing = editingSubject === sa.subject.id;

              return (
                <div
                  key={sa.subject.id}
                  className="bg-card border border-border rounded-xl p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{ backgroundColor: `hsl(${sa.subject.color})` }}
                      />
                      <div>
                        <p className="text-sm font-medium">{sa.subject.code}</p>
                        <p className="text-xs text-muted-foreground">{present}/{total}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={cn(
                        "text-xl font-bold",
                        status === 'safe' && "text-success",
                        status === 'warning' && "text-warning",
                        status === 'danger' && "text-destructive"
                      )}>
                        {percentage}%
                      </p>
                      <button
                        onClick={() => setEditingSubject(isEditing ? null : sa.subject.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg"
                      >
                        Min {minRequired}%
                        <ChevronDown className={cn("w-3 h-3 transition-transform", isEditing && "rotate-180")} />
                      </button>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      {[60, 70, 75, 80, 85].map((val) => (
                        <button
                          key={val}
                          onClick={() => handleSetMin(sa.subject.id, val)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                            minRequired === val
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}