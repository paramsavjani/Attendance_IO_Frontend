import { useMemo } from "react";
import { BadgeCheck, GraduationCap, ShieldCheck, TriangleAlert } from "lucide-react";
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
  min: number;
  met: boolean;
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

function Ring({ value, min, color, size = 58, stroke = 5 }: { value: number; min: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  // tick on the ring where this subject's own target sits
  const a = (min / 100) * 2 * Math.PI - Math.PI / 2;
  const tx = size / 2 + Math.cos(a) * r;
  const ty = size / 2 + Math.sin(a) * r;
  return (
    <svg width={size} height={size} className="shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(0 0% 100% / 0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - v / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <circle cx={tx} cy={ty} r={1.9} fill="hsl(0 0% 100% / 0.85)" stroke="hsl(0 0% 6%)" strokeWidth={1.2} />
    </svg>
  );
}

/**
 * Shown on the dashboard once classes are over: the institute's official attendance for every subject,
 * judged against the minimum the student set for that subject (not a fixed 75%).
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
  const rows = useMemo<Row[]>(() => {
    const byId = new Map(stats.map((s) => [s.subjectId, s]));
    return subjects
      .flatMap((subject) => {
        const s = byId.get(subject.id);
        if (!s || s.total <= 0) return [];
        const pct = (s.present * 100) / s.total;
        const min = minFor(subject);
        return [{ subject, present: s.present, total: s.total, pct, min, met: pct + 1e-9 >= min }];
      })
      .sort((a, b) => Number(a.met) - Number(b.met) || a.subject.code.localeCompare(b.subject.code));
  }, [subjects, stats, minFor]);

  if (rows.length === 0) return null;

  const present = rows.reduce((n, r) => n + r.present, 0);
  const total = rows.reduce((n, r) => n + r.total, 0);
  const overall = (present * 100) / total;
  const below = rows.filter((r) => !r.met).length;

  return (
    <section className="space-y-2.5" aria-label="Final attendance">
      {/* Summary */}
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 p-4"
        style={{
          background:
            "radial-gradient(120% 100% at 0% 0%, hsl(234 89% 64% / 0.16), transparent 55%), radial-gradient(100% 90% at 100% 100%, hsl(160 70% 45% / 0.10), transparent 60%), hsl(0 0% 7%)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-0.5 text-[10.5px] font-semibold text-sky-200">
              <ShieldCheck className="h-3 w-3" />
              Institute official
            </span>
            <h2 className="mt-2 text-[18px] font-semibold leading-tight">Final attendance</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Up to the last lecture. Classes are over, so these won&apos;t change.</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[30px] font-bold leading-none tabular-nums tracking-tight">
              {fmt(Math.round(overall * 10) / 10)}
              <span className="text-[16px] font-semibold text-white/55">%</span>
            </p>
            <p className="mt-1 text-[10.5px] text-muted-foreground tabular-nums">
              {present} of {total} classes
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center gap-2 text-[11.5px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 font-medium text-emerald-300">
            <BadgeCheck className="h-3.5 w-3.5" />
            {rows.length - below} met your target
          </span>
          {below > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-400/10 px-2 py-1 font-medium text-rose-300">
              <TriangleAlert className="h-3.5 w-3.5" />
              {below} below
            </span>
          )}
        </div>
      </div>

      {/* One tile per subject; the ones below target come first */}
      <div className="grid grid-cols-2 gap-2.5">
        {rows.map((r) => {
          const color = r.met ? `hsl(${r.subject.color})` : "hsl(351 95% 71%)";
          const gap = r.min - r.pct;
          return (
            <div
              key={r.subject.id}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-3",
                r.met ? "border-white/[0.08] bg-white/[0.035]" : "border-rose-300/20 bg-rose-400/[0.05]",
              )}
            >
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-25 blur-2xl"
                style={{ backgroundColor: color }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div className="relative">
                  <Ring value={r.pct} min={r.min} color={color} />
                  <span className="absolute inset-0 flex items-center justify-center text-[12.5px] font-bold tabular-nums">
                    {Math.round(r.pct)}%
                  </span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    r.met ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300",
                  )}
                >
                  {r.met ? `✓ ${r.min}% met` : `${fmt(Math.round(gap * 10) / 10)}% short`}
                </span>
              </div>
              <p className="relative mt-2.5 text-[13.5px] font-semibold leading-tight">{r.subject.code}</p>
              <p className="relative truncate text-[11.5px] text-muted-foreground">{r.subject.name}</p>
              <div className="relative mt-2 flex items-baseline justify-between text-[11px] tabular-nums">
                <span className="text-white/70">
                  {r.present}/{r.total} classes
                </span>
                <span className="text-white/40">target {r.min}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="flex items-center justify-center gap-1.5 pt-1 text-[11.5px] text-muted-foreground">
        <GraduationCap className="h-3.5 w-3.5" />
        All the best for your exams!
      </p>
    </section>
  );
}
