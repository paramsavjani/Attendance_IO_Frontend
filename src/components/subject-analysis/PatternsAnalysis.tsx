import { useEffect, useMemo, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { API_CONFIG } from "@/lib/api";
import { cn } from "@/lib/utils";
import { glassChipClass } from "./glassStyles";

interface PatternBucket {
  key: string;
  label: string;
  present: number;
  absent: number;
  percentage: number;
}

interface PatternSet {
  students: number;
  total: PatternBucket;
  byWeekday: PatternBucket[];
  byHour: PatternBucket[];
  byKind: PatternBucket[];
}

interface YearPatterns {
  batch: string;
  yearOfStudy: number;
  patterns: PatternSet;
}

interface PatternsData {
  academicYear: string;
  overall: PatternSet;
  years: YearPatterns[];
}

function ordinal(n: number): string {
  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${suffix}`;
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

interface ChartPoint {
  label: string;
  percentage: number;
  marks: number;
}

function PatternChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: ChartPoint[];
}) {
  if (data.length === 0) return null;
  const best = data.reduce((a, b) => (b.percentage > a.percentage ? b : a));
  const worst = data.reduce((a, b) => (b.percentage < a.percentage ? b : a));
  // Start the axis just below the lowest bar so a few points' difference is visible.
  const axisMin = Math.max(0, Math.floor((worst.percentage - 10) / 10) * 10);
  const tickStep = 100 - axisMin > 50 ? 20 : 10;
  const ticks = Array.from(
    { length: Math.floor((100 - axisMin) / tickStep) + 1 },
    (_, i) => 100 - i * tickStep
  ).reverse();

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} margin={{ top: 18, right: 0, left: -12, bottom: 0 }}>
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={0} />
          <YAxis
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            domain={[axisMin, 100]}
            ticks={ticks}
            allowDataOverflow
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            formatter={(value: number, _name, item) => [
              `${value.toFixed(1)}% · ${item.payload.marks.toLocaleString()} classes`,
              "Attended",
            ]}
          />
          <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="percentage"
              position="top"
              style={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
              formatter={(v: number) => `${v.toFixed(0)}%`}
            />
            {data.map((d) => (
              <Cell key={d.label} fill={fillFor(d.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {data.length > 1 && best.label !== worst.label && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Best <span className="text-foreground font-medium">{best.label}</span> · Worst{" "}
            <span className="text-foreground font-medium">{worst.label}</span>
          </span>
          <span className="font-semibold text-red-400">
            −{(best.percentage - worst.percentage).toFixed(1)} pts
          </span>
        </div>
      )}
    </div>
  );
}

function toPoints(buckets: PatternBucket[]): ChartPoint[] {
  return buckets.map((b) => ({
    label: b.label,
    percentage: b.percentage,
    marks: b.present + b.absent,
  }));
}

export function PatternsAnalysis() {
  const [data, setData] = useState<PatternsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_CONFIG.ENDPOINTS.SUBJECT_ANALYSIS}/patterns`);
        if (response.ok) setData(await response.json());
      } catch (err) {
        console.error("Failed to fetch attendance patterns:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const selected = useMemo(() => {
    if (!data) return null;
    if (year === null) return data.overall;
    return data.years.find((y) => y.yearOfStudy === year)?.patterns ?? null;
  }, [data, year]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || !selected || selected.total.present + selected.total.absent === 0) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground">
        Not enough marked attendance yet
      </div>
    );
  }

  const marks = selected.total.present + selected.total.absent;
  const yearPoints: ChartPoint[] = data.years.map((y) => ({
    label: `${ordinal(y.yearOfStudy)} yr`,
    percentage: y.patterns.total.percentage,
    marks: y.patterns.total.present + y.patterns.total.absent,
  }));
  const scope = year === null ? "All app users" : `${ordinal(year)} year B.Tech`;

  return (
    <div className="space-y-2.5">
      {/* Year filter */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setYear(null)} className={glassChipClass(year === null)}>
          All years
        </button>
        {data.years.map((y) => (
          <button
            key={y.batch}
            onClick={() => setYear(y.yearOfStudy)}
            className={glassChipClass(year === y.yearOfStudy)}
          >
            {ordinal(y.yearOfStudy)} year
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{scope} · AY {data.academicYear}</p>
            <p className={cn("text-2xl font-bold", textColor(selected.total.percentage))}>
              {selected.total.percentage.toFixed(1)}%
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>
              <span className="text-foreground font-semibold">{selected.students.toLocaleString()}</span> students
            </p>
            <p>
              <span className="text-foreground font-semibold">{marks.toLocaleString()}</span> classes marked
            </p>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Based on attendance students mark in the app this semester, not official data.
        </p>
      </div>

      {year === null && yearPoints.length > 1 && (
        <PatternChart
          title="By Year of Study"
          subtitle="B.Tech students · share of classes attended"
          data={yearPoints}
        />
      )}
      <PatternChart
        title="By Day of Week"
        subtitle="Share of classes attended on each day"
        data={toPoints(selected.byWeekday)}
      />
      <PatternChart
        title="By Time of Day"
        subtitle="By class start time"
        data={toPoints(selected.byHour)}
      />
      <PatternChart
        title="Lecture vs Lab vs Extra"
        subtitle="Labs from each student's lab timetable · extra = classes added outside the timetable"
        data={toPoints(selected.byKind)}
      />
    </div>
  );
}
