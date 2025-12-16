import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAttendance } from "@/contexts/AttendanceContext";
import { getTodaySchedule, subjects, officialLastDate } from "@/data/mockData";
import { format } from "date-fns";
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker";
import { SubjectCard } from "@/components/attendance/SubjectCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Attendance() {
  const { subjectStats, subjectMinAttendance, todayAttendance, markAttendance, setSubjectMin } = useAttendance();
  const schedule = getTodaySchedule();
  const now = new Date();
  const currentHour = now.getHours();
  const todayKey = format(now, "yyyy-MM-dd");

  const handleMarkAttendance = (index: number, subjectId: string, status: 'present' | 'absent') => {
    markAttendance(subjectId, todayKey, status);
  };

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

              return (
                <AttendanceMarker
                  key={index}
                  subjectName={slot.subject.name}
                  subjectCode={slot.subject.code}
                  time={slot.time}
                  color={slot.subject.color}
                  isCurrent={isCurrent}
                  status={status}
                  onMarkPresent={() => handleMarkAttendance(index, slot.subject!.id, "present")}
                  onMarkAbsent={() => handleMarkAttendance(index, slot.subject!.id, "absent")}
                />
              );
            })}
          </TabsContent>

          <TabsContent value="subjects" className="mt-4 space-y-2">
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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
