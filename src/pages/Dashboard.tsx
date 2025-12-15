import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTodaySchedule, subjects } from "@/data/mockData";
import { format } from "date-fns";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { student } = useAuth();
  const { subjectStats, subjectMinAttendance, todayAttendance, markAttendance, setSubjectMin } = useAttendance();
  const schedule = getTodaySchedule();
  const now = new Date();
  const currentHour = now.getHours();
  const todayKey = format(now, "yyyy-MM-dd");

  const handleMarkAttendance = (index: number, subjectId: string, status: 'present' | 'absent') => {
    const slotKey = `${todayKey}-${index}`;
    markAttendance(subjectId, slotKey, status);
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="pt-2">
          <p className="text-muted-foreground text-xs">
            {format(now, "EEEE, MMM d")}
          </p>
          <h1 className="text-lg font-bold">
            Hi, {student?.name?.split(" ")[0]}
          </h1>
        </div>

        {/* Today's Classes */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Today's Classes</h3>
          <div className="space-y-2">
            {schedule.slots.map((slot, index) => {
              if (!slot.subject) return null;
              
              const startHour = parseInt(slot.time.split(":")[0]);
              const isCurrent = startHour === currentHour;
              const slotKey = `${todayKey}-${index}`;
              const status = todayAttendance[slotKey] || null;

              return (
                <div
                  key={index}
                  className={cn(
                    "bg-card rounded-2xl border overflow-hidden",
                    isCurrent ? "border-primary ring-1 ring-primary/20" : "border-border"
                  )}
                >
                  <div className="flex items-stretch">
                    {/* Color bar */}
                    <div
                      className="w-1.5"
                      style={{ backgroundColor: `hsl(${slot.subject.color})` }}
                    />
                    
                    {/* Content */}
                    <div className="flex-1 p-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{slot.subject.name}</p>
                        {isCurrent && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                            NOW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{slot.time}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-stretch border-l border-border">
                      <button
                        onClick={() => handleMarkAttendance(index, slot.subject!.id, "present")}
                        className={cn(
                          "w-14 flex items-center justify-center gap-1 transition-all text-sm font-medium",
                          status === "present"
                            ? "bg-success text-success-foreground"
                            : "hover:bg-success/10 text-success"
                        )}
                      >
                        <Check className="w-4 h-4" />
                        {status === "present" && <span className="text-xs">P</span>}
                      </button>
                      <button
                        onClick={() => handleMarkAttendance(index, slot.subject!.id, "absent")}
                        className={cn(
                          "w-14 flex items-center justify-center gap-1 transition-all text-sm font-medium border-l border-border",
                          status === "absent"
                            ? "bg-destructive text-destructive-foreground"
                            : "hover:bg-destructive/10 text-destructive"
                        )}
                      >
                        <X className="w-4 h-4" />
                        {status === "absent" && <span className="text-xs">A</span>}
                      </button>
                    </div>
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
            {subjects.map((subject) => {
              const stats = subjectStats[subject.id];
              if (!stats) return null;
              
              const minRequired = subjectMinAttendance[subject.id] || 75;

              return (
                <SubjectCard
                  key={subject.id}
                  name={subject.name}
                  code={subject.code}
                  color={subject.color}
                  present={stats.present}
                  absent={stats.absent}
                  total={stats.total}
                  minRequired={minRequired}
                  onMinChange={(val) => setSubjectMin(subject.id, val)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
