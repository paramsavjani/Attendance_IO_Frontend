import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { getTodaySchedule, subjects } from "@/data/mockData";
import { format } from "date-fns";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { TodayClassCard } from "@/components/dashboard/TodayClassCard";

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

        {/* Today's Schedule - Improved UI */}
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
                <TodayClassCard
                  key={index}
                  index={index}
                  time={slot.time}
                  subject={slot.subject}
                  isCurrent={isCurrent}
                  status={status}
                  onMark={(s) => handleMarkAttendance(index, slot.subject!.id, s)}
                />
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
