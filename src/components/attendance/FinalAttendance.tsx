import { useEffect, useMemo, useState } from "react";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types/attendance";

export interface OfficialStat {
  subjectId: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

interface Row {
  subject: Subject;
  present: number;
  total: number;
  pct: number;
  avg: number | null;
  min: number;
}

const one = (v: number) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, "");
const signed = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + one(Math.abs(v));
const AVG_CACHE = "finalAttendanceClassAverages";

/** Class average per subject id, from the institute's record for everyone in that subject. */
function useClassAverages(): Record<string, number> {
  const [avgs, setAvgs] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(AVG_CACHE) || "{}");
    } catch {
      return {};
    }
  });
  useEffect(() => {
    const controller = new AbortController();
    authenticatedFetch(API_CONFIG.ENDPOINTS.SUBJECT_ANALYSIS, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { subjects?: { subjectId: string; averageAttendancePercentage: number; totalStudents: number }[] } | null) => {
        if (!data?.subjects) return;
        const next: Record<string, number> = {};
        data.subjects.forEach((s) => {
          if (s.totalStudents > 1) next[s.subjectId] = s.averageAttendancePercentage;
        });
        setAvgs(next);
        try {
          localStorage.setItem(AVG_CACHE, JSON.stringify(next));
        } catch {
          /* storage off */
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return avgs;
}

/**
 * The dashboard once classes are over: the institute's final attendance for each subject, set against that
 * subject's class average. The headline counts the subjects where the student is below the class average;
 * a subject under the student's own minimum (their setting, not a fixed 75%) is called out on its row.
 */
export function FinalAttendance({
  subjects,
  stats,
  minFor,
}: {
  subjects: Subject[];
  stats: OfficialStat[];
  minFor: (subject: Subject) => number;
}) {
  const avgs = useClassAverages();

  const rows = useMemo<Row[]>(() => {
    const byId = new Map(stats.map((s) => [s.subjectId, s]));
    return subjects.flatMap((subject) => {
      const s = byId.get(subject.id);
      if (!s || s.total <= 0) return [];
      return [
        {
          subject,
          present: s.present,
          total: s.total,
          pct: (s.present * 100) / s.total,
          avg: avgs[subject.id] ?? null,
          min: minFor(subject),
        },
      ];
    });
  }, [subjects, stats, avgs, minFor]);

  if (rows.length === 0) return null;

  const present = rows.reduce((n, r) => n + r.present, 0);
  const total = rows.reduce((n, r) => n + r.total, 0);
  const overall = (present * 100) / total;
  const compared = rows.filter((r) => r.avg != null);
  const below = compared.filter((r) => r.pct < (r.avg as number));
  const classOverall = compared.length ? compared.reduce((n, r) => n + (r.avg as number), 0) / compared.length : null;

  return (
    <section aria-label="Final attendance" className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[hsl(0_0%_6.5%)]">
      {/* Headline */}
      <div className="px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/40">
          <span>Final attendance</span>
          <span className="font-medium normal-case tracking-normal">Institute record</span>
        </div>

        <div className="mt-3 flex items-end gap-4">
          <div className="shrink-0">
            <p className="text-[44px] font-bold leading-[0.9] tracking-[-0.03em] tabular-nums">
              {one(overall)}
              <span className="ml-0.5 text-[20px] font-semibold tracking-normal text-white/45">%</span>
            </p>
            <p className="mt-1.5 text-[11.5px] text-white/45 tabular-nums">
              {present} of {total} classes
            </p>
          </div>
          <div className="mb-0.5 min-w-0 border-l border-white/10 pl-4">
            {compared.length === 0 ? (
              <p className="text-[13px] leading-snug text-white/70">Up to the last lecture. Classes are over, so this is final.</p>
            ) : below.length === 0 ? (
              <p className="text-[14px] font-semibold leading-snug">At or above the class average in every subject</p>
            ) : (
              <p className="text-[14px] font-semibold leading-snug">
                Below the class average in{" "}
                <span className="text-amber-300 tabular-nums">
                  {below.length} of {compared.length}
                </span>{" "}
                {compared.length === 1 ? "subject" : "subjects"}
              </p>
            )}
            {classOverall != null && (
              <p className="mt-1 text-[11.5px] text-white/45 tabular-nums">
                Class average {one(classOverall)}% · you {signed(overall - classOverall)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Column labels */}
      <div className="flex items-center border-y border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/35">
        <span className="flex-1">Subject</span>
        <span className="flex items-center gap-3 normal-case tracking-normal">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-3 rounded-full bg-white/75" /> You
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-[2px] rounded-full bg-amber-300" /> Class avg
          </span>
        </span>
      </div>

      <ul className="divide-y divide-white/[0.06]">
        {rows.map((r) => {
          const diff = r.avg == null ? null : r.pct - r.avg;
          const underMin = r.pct < r.min;
          return (
            <li key={r.subject.id} className="flex gap-3 px-4 py-3">
              <span className="mt-0.5 w-[3px] shrink-0 self-stretch rounded-full" style={{ backgroundColor: `hsl(${r.subject.color})` }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-[13.5px]">
                    <span className="font-semibold">{r.subject.code}</span>
                    <span className="ml-1.5 text-white/45">{r.subject.name}</span>
                  </p>
                  <p className="shrink-0 text-[16px] font-bold tabular-nums">
                    {one(r.pct)}
                    <span className="text-[11px] font-semibold text-white/45">%</span>
                  </p>
                </div>

                <div className="relative mt-2 h-[5px] rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-white/75" style={{ width: `${Math.min(100, r.pct)}%` }} />
                  {r.avg != null && (
                    <span
                      className="absolute -top-[3px] h-[11px] w-[2px] -translate-x-1/2 rounded-full bg-amber-300 ring-2 ring-[hsl(0_0%_6.5%)]"
                      style={{ left: `${Math.min(100, r.avg)}%` }}
                    />
                  )}
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] tabular-nums">
                  <span className="text-white/45">
                    {r.present}/{r.total} classes
                    {underMin && <span className="text-rose-300"> · under your {r.min}%</span>}
                  </span>
                  {diff != null && (
                    <span className="text-white/45">
                      avg {one(r.avg as number)}%{" "}
                      <span className={cn("font-semibold", diff < 0 ? "text-amber-300" : "text-emerald-300")}>{signed(diff)}</span>
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-white/35">
        Up to the last lecture. All the best for your exams.
      </p>
    </section>
  );
}
