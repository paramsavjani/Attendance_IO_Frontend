import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, ChevronDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GroupableSubject {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalStudents: number;
  averageAttendancePercentage: number;
}

/** One course, with its sections (e.g. IT304-A / IT304-B) merged. */
interface Course {
  code: string;
  name: string;
  prefix: string;
  level: number;
  students: number;
  average: number;
  sections: GroupableSubject[];
}

interface Group {
  key: string;
  average: number;
  students: number;
  courses: Course[];
}

/**
 * Codes look like `IT304`, `IT304-A`, `CP1001` or `PC1-ICT`: letters are the
 * department prefix and the first digit is the course level (1xx, 2xx, …).
 */
function parseCode(code: string): { prefix: string; level: number; base: string } | null {
  const match = /^([A-Za-z]+)(\d)/.exec(code.trim());
  if (!match) return null;
  return {
    prefix: match[1].toUpperCase(),
    level: Number(match[2]),
    base: code.trim().toUpperCase().replace(/-[A-Z]$/, ""),
  };
}

/** Student-weighted mean, so a 200-student course counts more than a 5-student one. */
function weightedAverage(items: { students: number; average: number }[]): number {
  const students = items.reduce((sum, i) => sum + i.students, 0);
  if (students === 0) return 0;
  return items.reduce((sum, i) => sum + i.average * i.students, 0) / students;
}

function buildCourses(subjects: GroupableSubject[]): Course[] {
  const byBase = new Map<string, { parsed: ReturnType<typeof parseCode>; sections: GroupableSubject[] }>();
  for (const s of subjects) {
    const parsed = parseCode(s.subjectCode);
    if (!parsed || s.totalStudents === 0) continue;
    const entry = byBase.get(parsed.base) ?? { parsed, sections: [] };
    entry.sections.push(s);
    byBase.set(parsed.base, entry);
  }
  return [...byBase.entries()].map(([base, { parsed, sections }]) => ({
    code: base,
    name: sections[0].subjectName,
    prefix: parsed!.prefix,
    level: parsed!.level,
    students: sections.reduce((sum, s) => sum + s.totalStudents, 0),
    average: weightedAverage(
      sections.map((s) => ({ students: s.totalStudents, average: s.averageAttendancePercentage }))
    ),
    sections,
  }));
}

function groupBy(courses: Course[], keyOf: (c: Course) => string): Group[] {
  const groups = new Map<string, Course[]>();
  for (const c of courses) {
    const key = keyOf(c);
    groups.set(key, [...(groups.get(key) ?? []), c]);
  }
  return [...groups.entries()].map(([key, list]) => ({
    key,
    average: weightedAverage(list),
    students: list.reduce((sum, c) => sum + c.students, 0),
    courses: [...list].sort((a, b) => b.average - a.average),
  }));
}

function courseCount(n: number): string {
  return `${n} course${n === 1 ? "" : "s"}`;
}

function levelLabel(level: number | string): string {
  return `${level}xx`;
}

function fillFor(pct: number): string {
  if (pct >= 75) return "hsl(var(--success))";
  if (pct >= 50) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

function textColor(pct: number): string {
  if (pct >= 75) return "text-green-400";
  if (pct >= 50) return "text-yellow-400";
  return "text-red-400";
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "11px",
};

const axisTick = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[10px] text-muted-foreground">—</span>;
  const rounded = Math.round(value * 10) / 10;
  const Icon = rounded > 0 ? ArrowUpRight : rounded < 0 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-[11px] font-semibold",
        rounded > 0 ? "text-green-400" : rounded < 0 ? "text-red-400" : "text-muted-foreground"
      )}
    >
      <Icon className="w-3 h-3" />
      {rounded > 0 ? "+" : ""}
      {rounded.toFixed(1)}
    </span>
  );
}

/** Lists each section separately, since only section codes (IT304-A) open a detail page. */
function CourseList({ courses }: { courses: Course[] }) {
  const navigate = useNavigate();
  const rows = courses.flatMap((c) => c.sections);
  return (
    <div className="mt-2 rounded-xl bg-background border border-border overflow-hidden">
      {rows.map((s, idx) => (
        <button
          key={s.subjectId}
          onClick={() => navigate(`/subject-analysis/${s.subjectCode}`)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent/50",
            idx < rows.length - 1 && "border-b border-border/50"
          )}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{s.subjectName}</p>
            <p className="text-[10px] text-muted-foreground">
              {s.subjectCode} · {s.totalStudents} students
            </p>
          </div>
          <span className={cn("text-xs font-semibold", textColor(s.averageAttendancePercentage))}>
            {s.averageAttendancePercentage.toFixed(1)}%
          </span>
        </button>
      ))}
    </div>
  );
}

function GroupRow({
  title,
  subtitle,
  group,
  delta,
  extra,
  expanded,
  onToggle,
}: {
  title: string;
  subtitle: string;
  group: Group;
  delta?: number | null;
  extra?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl bg-card border border-border px-4 py-3">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {delta !== undefined && <Delta value={delta} />}
            <span className={cn("text-sm font-bold", textColor(group.average))}>
              {group.average.toFixed(1)}%
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                expanded && "rotate-180"
              )}
            />
          </div>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, group.average)}%`, backgroundColor: fillFor(group.average) }}
          />
        </div>
        {extra}
      </button>
      {expanded && <CourseList courses={group.courses} />}
    </div>
  );
}

export function LevelAnalysis({ subjects }: { subjects: GroupableSubject[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const levels = useMemo(
    () =>
      groupBy(buildCourses(subjects), (c) => String(c.level)).sort(
        (a, b) => Number(a.key) - Number(b.key)
      ),
    [subjects]
  );

  if (levels.length === 0) return null;

  const chartData = levels.map((l) => ({
    label: levelLabel(l.key),
    average: Math.round(l.average * 10) / 10,
    courses: l.courses.length,
  }));
  const last = levels[levels.length - 1];
  const steps = levels.slice(1).map((l, i) => ({
    from: levels[i].key,
    to: l.key,
    change: l.average - levels[i].average,
  }));
  const biggestDrop = steps.reduce<(typeof steps)[number] | null>(
    (worst, s) => (s.change < 0 && (!worst || s.change < worst.change) ? s : worst),
    null
  );

  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl bg-card border border-border p-4">
        <h3 className="font-semibold text-sm">Average by Course Level</h3>
        <p className="text-xs text-muted-foreground mb-3">
          First digit of the code (1xx → {levelLabel(last.key)}) · weighted by students
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 18, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
              formatter={(value: number, _name, item) => [
                `${value}% · ${item.payload.courses} courses`,
                "Average",
              ]}
            />
            <Bar dataKey="average" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="average"
                position="top"
                style={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
                formatter={(v: number) => `${v.toFixed(0)}%`}
              />
              {chartData.map((d) => (
                <Cell key={d.label} fill={fillFor(d.average)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {biggestDrop && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Biggest drop: {levelLabel(biggestDrop.from)} → {levelLabel(biggestDrop.to)}
            </span>
            <Delta value={biggestDrop.change} />
          </div>
        )}
      </div>

      {levels.map((level, i) => (
        <GroupRow
          key={level.key}
          title={`${levelLabel(level.key)} courses`}
          subtitle={`${courseCount(level.courses.length)} · ${level.students.toLocaleString()} enrolments`}
          group={level}
          delta={i === 0 ? null : level.average - levels[i - 1].average}
          expanded={expanded === level.key}
          onToggle={() => setExpanded(expanded === level.key ? null : level.key)}
        />
      ))}
      <p className="text-[10px] text-muted-foreground text-center">
        Arrow shows change from the previous level
      </p>
    </div>
  );
}

type PrefixSort = "average" | "students" | "name";

export function PrefixAnalysis({ subjects }: { subjects: GroupableSubject[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sort, setSort] = useState<PrefixSort>("average");

  const prefixes = useMemo(() => {
    const courses = buildCourses(subjects);
    return groupBy(courses, (c) => c.prefix).map((g) => ({
      ...g,
      levels: groupBy(g.courses, (c) => String(c.level)).sort(
        (a, b) => Number(a.key) - Number(b.key)
      ),
    }));
  }, [subjects]);

  const sorted = useMemo(() => {
    return [...prefixes].sort((a, b) => {
      if (sort === "students") return b.students - a.students;
      if (sort === "name") return a.key.localeCompare(b.key);
      return b.average - a.average;
    });
  }, [prefixes, sort]);

  if (prefixes.length === 0) return null;

  const sortOptions: { value: PrefixSort; label: string }[] = [
    { value: "average", label: "Avg %" },
    { value: "students", label: "Students" },
    { value: "name", label: "A–Z" },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {prefixes.length} prefixes · weighted by students
        </p>
        <div className="flex gap-1">
          {sortOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => setSort(o.value)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] border transition-colors",
                sort === o.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.map((prefix) => (
        <GroupRow
          key={prefix.key}
          title={`${prefix.key}*`}
          subtitle={`${courseCount(prefix.courses.length)} · ${prefix.students.toLocaleString()} enrolments`}
          group={prefix}
          expanded={expanded === prefix.key}
          onToggle={() => setExpanded(expanded === prefix.key ? null : prefix.key)}
          extra={
            prefix.levels.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {prefix.levels.map((l) => (
                  <span
                    key={l.key}
                    className="px-2 py-0.5 rounded-md bg-background border border-border text-[10px]"
                  >
                    <span className="text-muted-foreground">{levelLabel(l.key)} </span>
                    <span className={cn("font-semibold", textColor(l.average))}>
                      {l.average.toFixed(0)}%
                    </span>
                  </span>
                ))}
              </div>
            )
          }
        />
      ))}
    </div>
  );
}
