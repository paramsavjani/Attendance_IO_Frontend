import { useEffect, useMemo, useState } from "react";
import { addDays, format, isAfter, isWeekend, parseISO, startOfDay } from "date-fns";
import { AlertTriangle, CalendarX2, CheckCircle2, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_CONFIG } from "@/lib/api";
import { useCloseOnBack } from "@/lib/backOverlay";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { countLecturesOnDates, projectLeave, type LeaveProjection, type LeaveStats } from "@/lib/leavePlanner";
import type { Subject, TimetableSlot } from "@/types/attendance";

interface LeavePlannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  timetable: TimetableSlot[];
  stats: Record<string, LeaveStats | undefined>;
  minimumFor: (subject: Subject) => number;
}

interface Row {
  subject: Subject;
  min: number;
  projection: LeaveProjection;
}

const VERDICT_RANK: Record<LeaveProjection["verdict"], number> = { unreachable: 0, below: 1, tight: 2, safe: 3 };

/** Pick the days you'll be away and see where every subject ends the semester. */
export function LeavePlannerSheet({ open, onOpenChange, subjects, timetable, stats, minimumFor }: LeavePlannerSheetProps) {
  const [dates, setDates] = useState<Date[]>([]);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useCloseOnBack(open, () => onOpenChange(false));

  useEffect(() => {
    if (!open || endDate) return;
    const controller = new AbortController();
    fetch(API_CONFIG.ENDPOINTS.CLASSES_END_DATE, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.endDate && setEndDate(parseISO(data.endDate)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [open, endDate]);

  const tomorrow = startOfDay(addDays(new Date(), 1));

  const rows = useMemo<Row[]>(
    () =>
      subjects
        .filter((s) => stats[s.id])
        .map((subject) => {
          const min = minimumFor(subject);
          const missed = countLecturesOnDates(timetable, subject.id, dates);
          return { subject, min, projection: projectLeave(stats[subject.id]!, missed, min) };
        })
        .sort(
          (a, b) =>
            Number(b.projection.missed > 0) - Number(a.projection.missed > 0) ||
            VERDICT_RANK[a.projection.verdict] - VERDICT_RANK[b.projection.verdict]
        ),
    [subjects, stats, timetable, dates, minimumFor]
  );

  const affected = rows.filter((r) => r.projection.missed > 0);
  const untouched = rows.filter((r) => r.projection.missed === 0);
  const totalMissed = affected.reduce((sum, r) => sum + r.projection.missed, 0);
  const breaking = affected.filter((r) => r.projection.verdict === "below" || r.projection.verdict === "unreachable");
  const tight = affected.filter((r) => r.projection.verdict === "tight");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto flex h-[92dvh] w-full max-w-lg flex-col rounded-t-[24px] border-border/60">
        <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
          <div className="min-w-0">
            <DrawerTitle className="text-lg font-semibold">Plan a leave</DrawerTitle>
            <DrawerDescription className="text-xs">
              Tap the days you'll miss. Each subject shows where it ends the semester if you attend the rest.
            </DrawerDescription>
          </div>
          {dates.length > 0 && (
            <button
              type="button"
              onClick={() => setDates([])}
              className="mt-0.5 flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors active:bg-muted"
            >
              Clear
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
          <div className="flex justify-center rounded-2xl border border-border/60 bg-card/50">
            <Calendar
              mode="multiple"
              selected={dates}
              onSelect={(next) => setDates(next ?? [])}
              fromDate={tomorrow}
              toDate={endDate ?? undefined}
              disabled={(day) => isWeekend(day) || day < tomorrow || (endDate !== null && isAfter(startOfDay(day), endDate))}
              className="pointer-events-auto"
              // Today can't be picked, so it gets an outline instead of a fill that reads as "selected"
              classNames={{ day_today: "border border-primary/50 text-foreground" }}
            />
          </div>

          {/* Verdict */}
          {dates.length === 0 ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">No days picked yet. Weekends and past days are greyed out.</p>
          ) : (
            <div
              className={cn(
                "mt-4 flex items-start gap-2.5 rounded-2xl border p-3",
                breaking.length > 0
                  ? "border-destructive/30 bg-destructive/10"
                  : tight.length > 0
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-emerald-500/30 bg-emerald-500/10"
              )}
            >
              {breaking.length > 0 ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
              ) : tight.length > 0 ? (
                <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
              )}
              <div className="min-w-0 text-sm">
                <p className="font-semibold">
                  {totalMissed === 0
                    ? "No lectures on these days"
                    : breaking.length > 0
                      ? `${breaking.length} ${breaking.length === 1 ? "subject drops" : "subjects drop"} below the minimum`
                      : tight.length > 0
                        ? "Safe, but cutting it close"
                        : "Safe to take this leave"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {dates.length} {dates.length === 1 ? "day" : "days"} · {totalMissed} {totalMissed === 1 ? "lecture" : "lectures"} missed
                  {dates.length <= 4 && ` · ${[...dates].sort((a, b) => a.getTime() - b.getTime()).map((d) => format(d, "EEE d MMM")).join(", ")}`}
                </p>
              </div>
            </div>
          )}

          {/* Subjects the leave touches */}
          {affected.length > 0 && (
            <div className="mt-3 space-y-2">
              {affected.map((row) => (
                <SubjectRow key={row.subject.id} row={row} />
              ))}
            </div>
          )}

          {dates.length > 0 && untouched.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">Not affected:</span>{" "}
              {untouched.map((r) => r.subject.name).join(", ")}
            </p>
          )}

          <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground/80">
            <CalendarX2 className="mt-px h-3.5 w-3.5 flex-shrink-0" />
            Counts regular lectures from your timetable. Labs, tutorials, extra classes and holidays aren't included.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function SubjectRow({ row }: { row: Row }) {
  const { subject, min, projection: p } = row;
  const tone =
    p.verdict === "safe"
      ? { text: "text-emerald-500", bar: "bg-emerald-500" }
      : p.verdict === "tight"
        ? { text: "text-amber-500", bar: "bg-amber-500" }
        : { text: "text-destructive", bar: "bg-destructive" };

  const detail =
    p.verdict === "unreachable"
      ? `Already can't reach ${min}% even attending everything`
      : p.verdict === "below"
        ? `${p.shortBy} ${p.shortBy === 1 ? "lecture" : "lectures"} too many to stay at ${min}%`
        : p.spareAfter === 0
          ? `Right at ${min}%: no more skips after this`
          : `Can still skip ${p.spareAfter} more after this`;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{subject.name}</p>
          <p className="text-[11px] text-muted-foreground">
            Misses {p.missed} {p.missed === 1 ? "lecture" : "lectures"} · now {Math.round(p.currentPercent)}%
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className={cn("text-base font-bold tabular-nums leading-tight", tone.text)}>{Math.round(p.finalPercent)}%</p>
          <p className="text-[10px] text-muted-foreground">at sem end</p>
        </div>
      </div>
      {/* Final % with the minimum marked */}
      <div className="relative mt-2.5 h-1.5 rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${Math.min(100, Math.max(0, p.finalPercent))}%` }} />
        <div className="absolute -top-1 h-3.5 w-0.5 rounded-full bg-foreground/70" style={{ left: `${min}%` }} title={`Minimum ${min}%`} />
      </div>
      <p className={cn("mt-2 text-xs", p.verdict === "safe" ? "text-muted-foreground" : tone.text)}>{detail}</p>
    </div>
  );
}
