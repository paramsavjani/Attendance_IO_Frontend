export type AttendanceStatus = "present" | "absent" | "leave";

export interface Subject {
  id: string;
  name: string;
  code: string;
  lecturePlace?: string | null; // Default/institute location from subject
  classroomLocation?: string | null; // User's custom location from student_subject
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
  timeSlot: number | null; // 0-5 (8-9, 9-10, etc.) - null for custom times
  subjectId: string | null;
  startTime?: string | null; // Custom start time (HH:mm format) - null if using standard slot
  endTime?: string | null; // Custom end time (HH:mm format) - null if using standard slot
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

// Conflict types for subject enrollment
export interface TimetableConflict {
  dayId: number;
  dayName: string;
  slotId: number;
  slotStartTime: string;
  slotEndTime: string;
  existingSubjectId: number;
  existingSubjectCode: string;
  existingSubjectName: string;
  newSubjectId: number;
  newSubjectCode: string;
  newSubjectName: string;
}

export interface SubjectInfo {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
}

export interface SaveEnrolledSubjectsResponse {
  success: boolean;
  message: string;
  subjectIds: string[];
  count: number;
  hasConflicts: boolean;
  conflicts: TimetableConflict[];
  addedSubjects: SubjectInfo[];
  removedSubjects: SubjectInfo[];
  subjectsWithConflicts: SubjectInfo[];
  timetableSlotsAdded: number;
  timetableSlotsRemoved: number;
}

// Subject schedule for conflict detection
export interface SubjectSchedule {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  dayId: number; // 1-5 (Monday-Friday, backend uses 1-indexed)
  dayName: string;
  slotId: number; // 1-6 (backend uses 1-indexed)
  slotStartTime: string;
  slotEndTime: string;
}

// Conflict between selected subjects (before enrollment)
export interface SelectedSubjectConflict {
  dayId: number;
  dayName: string;
  slotId: number;
  slotStartTime: string;
  slotEndTime: string;
  conflictingSubjects: Array<{
    subjectId: string;
    subjectCode: string;
    subjectName: string;
  }>;
  selectedSubjectId: string | null; // User's choice for this conflict
}
