import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
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
  selectedRange: AttendanceRange | null;
  onSelectRange: (range: AttendanceRange | null) => void;
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "11px",
};

// Recharts colours each tooltip row with its bar's fill, which is unset here (bars use <Cell>),
// so the text would fall back to near-black on the dark card.
const tooltipItemStyle = { color: "hsl(var(--foreground))" };
const tooltipLabelStyle = { color: "hsl(var(--muted-foreground))", marginBottom: 2 };

const axisTick = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

function bucketFill(bucket: { from: number; to: number }): string {
  if (bucket.to <= 70) return "hsl(var(--destructive))";
  if (bucket.from < 80) return "hsl(var(--warning))";
  return "hsl(var(--success))";
}

function sameRange(a: AttendanceRange | null, b: AttendanceRange): boolean {
  return !!a && a.from === b.from && a.to === b.to;
}

export function SubjectDistributionInsights({
  stats,
  selectedRange,
  onSelectRange,
}: Props) {
  return (
    <>
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
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
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
    </>
  );
}
