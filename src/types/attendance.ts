export type AttendanceStatus = "present" | "absent" | "leave";

export interface Subject {
  id: string;
  name: string;
  code: string;
  lecturePlace?: string | null;
  color: string;
  minimumCriteria?: number | null;
}

export interface AttendanceRecord {
  date: string;
  subjectId: string;
  status: AttendanceStatus;
  isOfficial: boolean;
}

export interface SubjectAttendance {
  subject: Subject;
  officialPresent: number;
  officialTotal: number;
  estimatedPresent: number;
  estimatedTotal: number;
  officialLastDate: string | null;
}

export interface TimetableSlot {
  day: number; // 0-4 (Monday-Friday)
  timeSlot: number; // 0-5 (8-9, 9-10, etc.)
  subjectId: string | null;
}

export interface DailySchedule {
  date: string;
  slots: Array<{
    time: string;
    subject: Subject | null;
    attendance: AttendanceStatus | null;
    isLocked: boolean;
  }>;
}
