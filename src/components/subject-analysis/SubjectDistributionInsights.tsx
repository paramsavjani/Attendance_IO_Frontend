import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Lightbulb, BarChart3, Sigma, UserX, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttendanceBucket {
  label: string;
  from: number;
  to: number;
  count: number;
  percentage: number;
}

export interface SubjectAttendanceStats {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  p10: number;
  q1: number;
  q3: number;
  p90: number;
  iqr: number;
  trimmedMean: number;
  outlierLowerBound: number;
  outlierUpperBound: number;
  lowOutlierCount: number;
  highOutlierCount: number;
  modeRange: string;
  modeRangeCount: number;
  below70Count: number;
  borderlineCount: number;
  fullAttendanceCount: number;
  maxClassesConducted: number;
  averageAbsences: number;
  medianAbsences: number;
  histogram: AttendanceBucket[];
  bands: AttendanceBucket[];
  absenceDistribution: { absences: number; count: number }[];
}

export interface AttendanceRange {
  label: string;
  from: number;
  to: number;
}

interface Props {
  stats: SubjectAttendanceStats;
  totalStudents: number;
  selectedRange: AttendanceRange | null;
  onSelectRange: (range: AttendanceRange | null) => void;
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "11px",
};

const axisTick = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

function bucketFill(bucket: { from: number; to: number }): string {
  if (bucket.to <= 70) return "hsl(var(--destructive))";
  if (bucket.from < 80) return "hsl(var(--warning))";
  return "hsl(var(--success))";
}

function pctText(value: number): string {
  return `${value.toFixed(1)}%`;
}

function share(count: number, total: number): string {
  return total > 0 ? `${Math.round((count / total) * 100)}%` : "0%";
}

function sameRange(a: AttendanceRange | null, b: AttendanceRange): boolean {
  return !!a && a.from === b.from && a.to === b.to;
}

export function SubjectDistributionInsights({
  stats,
  totalStudents,
  selectedRange,
  onSelectRange,
}: Props) {
  const outlierCount = stats.lowOutlierCount + stats.highOutlierCount;
  const meanShift = stats.trimmedMean - stats.mean;
  const biggestBand = stats.bands.reduce((a, b) => (b.count > a.count ? b : a));

  const insights: string[] = [
    `Most students sit in the ${stats.modeRange}% range — ${stats.modeRangeCount} of ${totalStudents} (${share(stats.modeRangeCount, totalStudents)}).`,
    `The middle 50% of the class has between ${pctText(stats.q1)} and ${pctText(stats.q3)} attendance; the median student is at ${pctText(stats.median)}.`,
    outlierCount > 0
      ? `Ignoring ${outlierCount} outlier${outlierCount > 1 ? "s" : ""} (outside ${pctText(stats.outlierLowerBound)}–${pctText(stats.outlierUpperBound)}), the typical average is ${pctText(stats.trimmedMean)} (${meanShift >= 0 ? "+" : ""}${meanShift.toFixed(1)} vs. raw average).`
      : `No outliers — every student is within ${pctText(stats.outlierLowerBound)}–${pctText(stats.outlierUpperBound)}, so the raw average of ${pctText(stats.mean)} is representative.`,
    stats.below70Count > 0
      ? `${stats.below70Count} student${stats.below70Count > 1 ? "s are" : " is"} below 70% (${share(stats.below70Count, totalStudents)}), and ${stats.borderlineCount} more ${stats.borderlineCount === 1 ? "is" : "are"} borderline at 70–75%.`
      : `Nobody is below 70%; ${stats.borderlineCount} student${stats.borderlineCount === 1 ? " is" : "s are"} borderline at 70–75%.`,
    `A typical student has missed ${Math.round(stats.medianAbsences)} of ${stats.maxClassesConducted} classes (average ${stats.averageAbsences.toFixed(1)} absences).`,
  ];
  if (stats.fullAttendanceCount > 0) {
    insights.push(
      `${stats.fullAttendanceCount} student${stats.fullAttendanceCount > 1 ? "s have" : " has"} 100% attendance.`
    );
  }

  const spreadMarkers = [
    { key: "Min", value: stats.min },
    { key: "P10", value: stats.p10 },
    { key: "Q1", value: stats.q1 },
    { key: "Median", value: stats.median },
    { key: "Q3", value: stats.q3 },
    { key: "P90", value: stats.p90 },
    { key: "Max", value: stats.max },
  ];

  const statTiles = [
    { label: "Mean", value: pctText(stats.mean) },
    { label: "Median", value: pctText(stats.median) },
    { label: "Avg w/o outliers", value: pctText(stats.trimmedMean) },
    { label: "Std. deviation", value: `±${stats.standardDeviation.toFixed(1)}` },
    { label: "Middle 50% (IQR)", value: `${stats.iqr.toFixed(1)} pts` },
    { label: "Range", value: `${stats.min.toFixed(0)}–${stats.max.toFixed(0)}%` },
  ];

  const absenceData = stats.absenceDistribution.map((d) => ({
    ...d,
    label: String(d.absences),
  }));

  return (
    <>
      {/* Insights */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-warning" />
          <h3 className="font-semibold text-sm">Key Insights</h3>
        </div>
        <ul className="space-y-2">
          {insights.map((text, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Histogram */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Attendance Distribution</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Students per 10% range · tap a bar to filter the list
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.histogram} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              interval={0}
              tickFormatter={(v: string) => v.split("-")[0]}
            />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
              labelFormatter={(label: string) => `${label}%`}
              formatter={(value: number, _name, item) => [
                `${value} students (${item.payload.percentage}%)`,
                "Count",
              ]}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              className="cursor-pointer"
              onClick={(bucket: AttendanceBucket) => {
                const range = { label: `${bucket.label}%`, from: bucket.from, to: bucket.to };
                onSelectRange(sameRange(selectedRange, range) ? null : range);
              }}
            >
              {stats.histogram.map((bucket) => (
                <Cell
                  key={bucket.label}
                  fill={bucketFill(bucket)}
                  fillOpacity={
                    selectedRange && !sameRange(selectedRange, bucket) ? 0.3 : 1
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-destructive" /> Below 70%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-warning" /> 70–80%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-success" /> 80%+
          </span>
        </div>
      </div>

      {/* Bands */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Where Students Stand</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Largest group: {biggestBand.label} ({biggestBand.percentage.toFixed(0)}% of class)
        </p>
        <div className="space-y-2">
          {[...stats.bands].reverse().map((band) => {
            const range = { label: band.label, from: band.from, to: band.to };
            const active = sameRange(selectedRange, range);
            return (
              <button
                key={band.label}
                onClick={() => onSelectRange(active ? null : range)}
                className={cn(
                  "w-full text-left rounded-lg px-2 py-1.5 transition-colors",
                  active ? "bg-accent" : "hover:bg-accent/50"
                )}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{band.label}</span>
                  <span className="text-muted-foreground">
                    {band.count} · {band.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${band.percentage}%`, backgroundColor: bucketFill(band) }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Spread / statistics */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <Sigma className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Spread & Statistics</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Box shows the middle 50% of students; line is the median
        </p>

        {/* Box plot on a 0–100 scale */}
        <div className="relative h-10 mb-6 mx-1">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-border" />
          <div
            className="absolute top-1/2 h-px bg-muted-foreground"
            style={{ left: `${stats.min}%`, width: `${Math.max(0, stats.max - stats.min)}%` }}
          />
          <div
            className="absolute top-1.5 bottom-1.5 rounded bg-primary/25 border border-primary"
            style={{ left: `${stats.q1}%`, width: `${Math.max(0.5, stats.q3 - stats.q1)}%` }}
          />
          <div
            className="absolute top-0.5 bottom-0.5 w-0.5 bg-primary"
            style={{ left: `${stats.median}%` }}
          />
          <div
            className="absolute top-0 bottom-0 border-l border-dashed border-destructive"
            style={{ left: "70%" }}
          />
          <span
            className="absolute -bottom-4 text-[9px] text-destructive -translate-x-1/2"
            style={{ left: "70%" }}
          >
            70
          </span>
          <span className="absolute -bottom-4 left-0 text-[9px] text-muted-foreground">0</span>
          <span className="absolute -bottom-4 right-0 text-[9px] text-muted-foreground">100</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {spreadMarkers.map((m) => (
            <div key={m.key}>
              <p className="text-[9px] text-muted-foreground">{m.key}</p>
              <p className="text-[11px] font-semibold">{m.value.toFixed(0)}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {statTiles.map((t) => (
            <div key={t.label} className="rounded-lg bg-background border border-border p-2 text-center">
              <p className="text-sm font-bold">{t.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{t.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Absences */}
      {absenceData.length > 1 && (
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserX className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Classes Missed</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            How many students missed each number of classes
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={absenceData} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                labelFormatter={(label: string) => `${label} classes missed`}
                formatter={(value: number) => [`${value} students`, "Count"]}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}
