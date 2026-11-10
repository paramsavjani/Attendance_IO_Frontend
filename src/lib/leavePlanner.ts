import type { TimetableSlot } from "@/types/attendance";

/** The numbers GET /api/attendance gives per subject (lectures only). */
export interface LeaveStats {
  present: number;
  /** Classes held so far. */
  total: number;
  /** Classes held so far plus every class still scheduled until the semester ends. */
  totalUntilEndDate?: number;
}

export type LeaveVerdict = "safe" | "tight" | "below" | "unreachable";

export interface LeaveProjection {
  /** Lectures of this subject on the chosen days. */
  missed: number;
  currentPercent: number;
  /** End-of-semester attendance if every other remaining lecture is attended. */
  finalPercent: number;
  /** Lectures that could still be skipped after this leave without going under the minimum. */
  spareAfter: number;
  /** How many more lectures would have to be attended than exist, when the leave breaks the minimum. */
  shortBy: number;
  verdict: LeaveVerdict;
}

/** Lecture slots of `subjectId` that fall on `dates` (weekdays only; the timetable is Monday = 0). */
export function countLecturesOnDates(timetable: TimetableSlot[], subjectId: string, dates: Date[]): number {
  let count = 0;
  for (const date of dates) {
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    count += timetable.filter((s) => s.subjectId === subjectId && s.day === dow - 1).length;
  }
  return count;
}

/**
 * Where a subject ends up if the student skips `missed` lectures and attends every other one left
 * this semester. Mirrors the backend's bunkable-classes formula so the planner and the Subjects tab agree.
 */
export function projectLeave(stats: LeaveStats, missedRaw: number, minPercent: number): LeaveProjection {
  const { present, total } = stats;
  const end = Math.max(total, stats.totalUntilEndDate ?? total);
  const remaining = Math.max(0, end - total);
  const missed = Math.min(missedRaw, remaining);
  const currentPercent = total > 0 ? (present / total) * 100 : 0;
  const finalPresent = present + remaining - missed;
  const finalPercent = end > 0 ? (finalPresent / end) * 100 : currentPercent;

  // Lectures that must still be attended to finish at or above the minimum.
  const neededPresent = Math.max(0, Math.ceil((minPercent * end) / 100 - present));
  const spareBefore = remaining - neededPresent;
  const spareAfter = Math.max(0, spareBefore - missed);
  const shortBy = Math.max(0, missed - Math.max(0, spareBefore));

  let verdict: LeaveVerdict;
  if (spareBefore < 0) verdict = "unreachable";
  else if (missed > spareBefore) verdict = "below";
  else if (spareAfter <= 1 && missed > 0) verdict = "tight";
  else verdict = "safe";

  return { missed, currentPercent, finalPercent, spareAfter, shortBy, verdict };
}
