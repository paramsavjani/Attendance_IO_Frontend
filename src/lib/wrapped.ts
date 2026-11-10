/** Numbers for the end-of-semester "Wrapped" card, from data the app already has. */

export interface WrappedSubject {
  name: string;
  code: string;
  present: number;
  total: number;
  percent: number;
}

export interface WrappedSummary {
  semesterLabel: string;
  overallPercent: number;
  lecturesAttended: number;
  lecturesHeld: number;
  subjects: WrappedSubject[];
  best: WrappedSubject | null;
  toughest: WrappedSubject | null;
  /** Share of students with lower attendance, from the class-wide range counts; null when unknown. */
  aheadOfPercent: number | null;
  collegeAverage: number | null;
}

interface RangeItem {
  range: string;
  count: number;
}

/** "90-100%" → [90, 100] */
function parseRange(range: string): [number, number] | null {
  const m = range.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/**
 * Students below `percent`, as a share of everyone, from the analytics range buckets.
 * Inside the student's own bucket the spread is assumed even, so this is an estimate.
 */
export function percentAhead(percent: number, ranges: RangeItem[]): number | null {
  const buckets = ranges
    .map((r) => ({ bounds: parseRange(r.range), count: r.count }))
    .filter((b): b is { bounds: [number, number]; count: number } => b.bounds !== null);
  const everyone = buckets.reduce((sum, b) => sum + b.count, 0);
  if (everyone === 0) return null;
  let below = 0;
  for (const { bounds: [lo, hi], count } of buckets) {
    if (percent >= hi && hi < 100) below += count;
    else if (percent >= lo) below += count * Math.min(1, (percent - lo) / (hi - lo));
  }
  return Math.max(0, Math.min(99, Math.round((below / everyone) * 100)));
}

export function semesterLabel(semester: { year: number; type: string } | null): string {
  if (!semester) return "This semester";
  const type = semester.type.charAt(0) + semester.type.slice(1).toLowerCase();
  return `${type} ${semester.year}`;
}

export function summarize(
  subjects: { name: string; code: string; present: number; total: number }[],
  semester: { year: number; type: string } | null,
  classwide: { averageAttendance?: number; ranges?: RangeItem[] } | null
): WrappedSummary {
  const rows: WrappedSubject[] = subjects
    .filter((s) => s.total > 0)
    .map((s) => ({ ...s, percent: (s.present / s.total) * 100 }))
    .sort((a, b) => b.percent - a.percent);
  const lecturesAttended = rows.reduce((sum, s) => sum + s.present, 0);
  const lecturesHeld = rows.reduce((sum, s) => sum + s.total, 0);
  const overallPercent = lecturesHeld > 0 ? (lecturesAttended / lecturesHeld) * 100 : 0;

  return {
    semesterLabel: semesterLabel(semester),
    overallPercent,
    lecturesAttended,
    lecturesHeld,
    subjects: rows,
    best: rows[0] ?? null,
    toughest: rows.length > 1 ? rows[rows.length - 1] : null,
    aheadOfPercent: classwide?.ranges && lecturesHeld > 0 ? percentAhead(overallPercent, classwide.ranges) : null,
    collegeAverage: classwide?.averageAttendance ?? null,
  };
}

/** The card is offered from two weeks before classes end until six weeks after. */
export function isWrappedSeason(classesEnd: Date | null, now = new Date()): boolean {
  if (!classesEnd) return false;
  const day = 24 * 60 * 60 * 1000;
  const diff = now.getTime() - classesEnd.getTime();
  return diff >= -14 * day && diff <= 42 * day;
}
