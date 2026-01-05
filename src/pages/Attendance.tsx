import { AppLayout } from "@/components/layout/AppLayout";
import { useAttendance } from "@/contexts/AttendanceContext";
import { getTodaySchedule, subjects, officialLastDate } from "@/data/mockData";
import { format } from "date-fns";
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { AttendanceSummary } from "@/components/attendance/AttendanceSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";

export default function Attendance() {
  const { subjectStats, subjectStatsToday, subjectMinAttendance, todayAttendance, markAttendance, setSubjectMin, enrolledSubjects } = useAttendance();
  const schedule = getTodaySchedule();
  const now = new Date();
  const currentHour = now.getHours();
  const todayKey = format(now, "yyyy-MM-dd");

  const handleMarkAttendance = (index: number, subjectId: string, status: 'present' | 'absent' | 'cancelled') => {
    markAttendance(subjectId, todayKey, status);
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalClasses = 0;
    let totalBunkable = 0;
    let subjectsAtRisk = 0;
    const percentages: number[] = [];

    Object.values(subjectStatsToday).forEach((stats) => {
      totalPresent += stats.present;
      totalAbsent += stats.absent;
      totalClasses += stats.total;
      if (stats.bunkableClasses) {
        totalBunkable += stats.bunkableClasses;
      }
      
      const percentage = stats.percentage !== undefined ? stats.percentage : (stats.total > 0 ? (stats.present / stats.total) * 100 : 0);
      percentages.push(percentage);
      
      // Find subject's min required
      const subject = enrolledSubjects.find(s => s.id === stats.subjectId);
      const minRequired = subjectMinAttendance[stats.subjectId] || subject?.minimumCriteria || 75;
      
      if (percentage < minRequired) {
        subjectsAtRisk++;
      }
    });

    const averagePercentage = percentages.length > 0 
      ? percentages.reduce((sum, p) => sum + p, 0) / percentages.length 
      : 0;

    return {
      totalPresent,
      totalAbsent,
      totalClasses,
      averagePercentage,
      subjectsAtRisk,
      totalBunkable,
    };
  }, [subjectStatsToday, subjectMinAttendance, enrolledSubjects]);

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">Track Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official till {format(new Date(officialLastDate), "MMM d")}
          </p>
        </div>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-4 space-y-2">
            {schedule.slots.map((slot, index) => {
              if (!slot.subject) return null;

              const startHour = parseInt(slot.time.split(":")[0]);
              const isCurrent = startHour === currentHour;
              const slotKey = `${todayKey}-${slot.subject!.id}`;
              const status = todayAttendance[slotKey] || null;

              // Calculate attendance percentage - always use today's stats to show final attendance up to now
              // Always show percentage, even if it's 0% or nothing is marked
              const stats = subjectStatsToday[slot.subject!.id];
              let attendancePercent = 0;
              if (stats) {
                attendancePercent = stats.percentage !== undefined 
                  ? stats.percentage 
                  : (stats.total > 0 ? (stats.present / stats.total) * 100 : 0);
              }

              return (
                <AttendanceMarker
                  key={index}
                  subjectName={slot.subject.name}
                  subjectCode={slot.subject.code}
                  lecturePlace={slot.subject.lecturePlace}
                  classroomLocation={slot.subject.classroomLocation}
                  time={slot.time}
                  color={slot.subject.color}
                  isCurrent={isCurrent}
                  status={status}
                  attendancePercent={attendancePercent} // Pass the calculated percentage
                  onMarkPresent={() => handleMarkAttendance(index, slot.subject!.id, "present")}
                  onMarkAbsent={() => handleMarkAttendance(index, slot.subject!.id, "absent")}
                  onMarkCancelled={() => handleMarkAttendance(index, slot.subject!.id, "cancelled")}
                />
              );
            })}
          </TabsContent>

          <TabsContent value="subjects" className="mt-4 space-y-4">
            {/* Summary Statistics */}
            <AttendanceSummary
              totalPresent={summaryStats.totalPresent}
              totalAbsent={summaryStats.totalAbsent}
              totalClasses={summaryStats.totalClasses}
              averagePercentage={summaryStats.averagePercentage}
              subjectsAtRisk={summaryStats.subjectsAtRisk}
              totalBunkable={summaryStats.totalBunkable}
            />

            {/* Subject Cards */}
            <div className="space-y-2">
              {subjects.map((subject) => {
                // Always use today's stats to show final attendance up to now
                const stats = subjectStatsToday[subject.id];
                if (!stats) return null;

                const minRequired = subjectMinAttendance[subject.id] || 75;

                return (
                  <SubjectCard
                    key={subject.id}
                    name={subject.name}
                    lecturePlace={subject.lecturePlace}
                    classroomLocation={subject.classroomLocation}
                    color={subject.color}
                  present={stats.present}
                  absent={stats.absent}
                  total={stats.total}
                  totalUntilEndDate={stats.totalUntilEndDate}
                  minRequired={minRequired}
                  percentage={stats.percentage}
                  classesNeeded={stats.classesNeeded}
                  bunkableClasses={stats.bunkableClasses}
                    onMinChange={(val) => setSubjectMin(subject.id, val)}
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
