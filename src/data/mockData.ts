import { Subject, SubjectAttendance, TimetableSlot, DailySchedule, AttendanceStatus } from "@/types/attendance";

export const subjects: Subject[] = [
  { id: "1", name: "Data Structures", code: "CS301", color: "234 89% 64%" },
  { id: "2", name: "Database Systems", code: "CS302", color: "142 72% 45%" },
  { id: "3", name: "Operating Systems", code: "CS303", color: "43 96% 56%" },
  { id: "4", name: "Computer Networks", code: "CS304", color: "0 72% 51%" },
  { id: "5", name: "Software Engineering", code: "CS305", color: "280 72% 55%" },
];

export const officialLastDate = "2024-11-25";

export const subjectAttendance: SubjectAttendance[] = [
  {
    subject: subjects[0],
    officialPresent: 18,
    officialTotal: 20,
    estimatedPresent: 5,
    estimatedTotal: 6,
    officialLastDate: officialLastDate,
  },
  {
    subject: subjects[1],
    officialPresent: 16,
    officialTotal: 20,
    estimatedPresent: 4,
    estimatedTotal: 6,
    officialLastDate: officialLastDate,
  },
  {
    subject: subjects[2],
    officialPresent: 19,
    officialTotal: 20,
    estimatedPresent: 6,
    estimatedTotal: 6,
    officialLastDate: officialLastDate,
  },
  {
    subject: subjects[3],
    officialPresent: 14,
    officialTotal: 20,
    estimatedPresent: 3,
    estimatedTotal: 6,
    officialLastDate: officialLastDate,
  },
  {
    subject: subjects[4],
    officialPresent: 17,
    officialTotal: 20,
    estimatedPresent: 5,
    estimatedTotal: 6,
    officialLastDate: officialLastDate,
  },
];

export const defaultTimetable: TimetableSlot[] = [
  // Monday
  { day: 0, timeSlot: 0, subjectId: "1" },
  { day: 0, timeSlot: 1, subjectId: "2" },
  { day: 0, timeSlot: 2, subjectId: null },
  { day: 0, timeSlot: 3, subjectId: "3" },
  { day: 0, timeSlot: 4, subjectId: "4" },
  { day: 0, timeSlot: 5, subjectId: null },
  // Tuesday
  { day: 1, timeSlot: 0, subjectId: "3" },
  { day: 1, timeSlot: 1, subjectId: "1" },
  { day: 1, timeSlot: 2, subjectId: "5" },
  { day: 1, timeSlot: 3, subjectId: null },
  { day: 1, timeSlot: 4, subjectId: "2" },
  { day: 1, timeSlot: 5, subjectId: null },
  // Wednesday
  { day: 2, timeSlot: 0, subjectId: "2" },
  { day: 2, timeSlot: 1, subjectId: "4" },
  { day: 2, timeSlot: 2, subjectId: "1" },
  { day: 2, timeSlot: 3, subjectId: "5" },
  { day: 2, timeSlot: 4, subjectId: null },
  { day: 2, timeSlot: 5, subjectId: null },
  // Thursday
  { day: 3, timeSlot: 0, subjectId: "5" },
  { day: 3, timeSlot: 1, subjectId: "3" },
  { day: 3, timeSlot: 2, subjectId: null },
  { day: 3, timeSlot: 3, subjectId: "1" },
  { day: 3, timeSlot: 4, subjectId: "4" },
  { day: 3, timeSlot: 5, subjectId: null },
  // Friday
  { day: 4, timeSlot: 0, subjectId: "4" },
  { day: 4, timeSlot: 1, subjectId: "5" },
  { day: 4, timeSlot: 2, subjectId: "2" },
  { day: 4, timeSlot: 3, subjectId: "3" },
  { day: 4, timeSlot: 4, subjectId: null },
  { day: 4, timeSlot: 5, subjectId: null },
];

export const timeSlots = [
  "8:00 - 9:00",
  "9:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 1:00",
  "1:00 - 2:00",
];

export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function getTodaySchedule(): DailySchedule {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const adjustedDay = dayOfWeek === 0 || dayOfWeek === 6 ? 0 : dayOfWeek - 1;
  
  const todaySlots = defaultTimetable.filter((slot) => slot.day === adjustedDay);
  
  return {
    date: today.toISOString().split("T")[0],
    slots: todaySlots.map((slot, index) => ({
      time: timeSlots[slot.timeSlot],
      subject: slot.subjectId ? subjects.find((s) => s.id === slot.subjectId) || null : null,
      attendance: null,
      isLocked: false,
    })),
  };
}

export function getOverallAttendance(): { official: number; estimated: number } {
  const totalOfficial = subjectAttendance.reduce(
    (acc, curr) => ({
      present: acc.present + curr.officialPresent,
      total: acc.total + curr.officialTotal,
    }),
    { present: 0, total: 0 }
  );

  const totalEstimated = subjectAttendance.reduce(
    (acc, curr) => ({
      present: acc.present + curr.officialPresent + curr.estimatedPresent,
      total: acc.total + curr.officialTotal + curr.estimatedTotal,
    }),
    { present: 0, total: 0 }
  );

  return {
    official: Math.round((totalOfficial.present / totalOfficial.total) * 100),
    estimated: Math.round((totalEstimated.present / totalEstimated.total) * 100),
  };
}
