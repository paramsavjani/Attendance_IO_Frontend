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
import { ArrowDownRight, ArrowUpRight, Loader2, Minus, Users } from "lucide-react";
import { API_CONFIG } from "@/lib/api";
import { cn } from "@/lib/utils";
import { glassChipClass } from "./glassStyles";

interface GroupStats {
  students: number;
  averageAttendance: number;
  medianAttendance: number;
  below70Count: number;
}

interface BranchEntry {
  code: string;
  sidPrefix: string;
  label: string | null;
  stats: GroupStats;
}

interface BatchEntry {
  batch: string;
  yearOfStudy: number;
  stats: GroupStats;
  branches: BranchEntry[];
}

interface BatchAnalysisData {
  academicYear: string;
  batches: BatchEntry[];
}

function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}

function yearLabel(year: number): string {
  return year >= 1 ? `${ordinal(year)} Year` : "Incoming";
}

function branchName(code: string, label: string | null): string {
  return label ? `${code} · ${label}` : `Branch ${code}`;
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

// Recharts colours each tooltip row with its bar's fill, which is unset here (bars use <Cell>),
// so the text would fall back to near-black on the dark card.
const tooltipItemStyle = { color: "hsl(var(--foreground))" };
const tooltipLabelStyle = { color: "hsl(var(--muted-foreground))", marginBottom: 2 };

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

export function BatchAnalysis() {
  const [data, setData] = useState<BatchAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [branch, setBranch] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_CONFIG.ENDPOINTS.SUBJECT_ANALYSIS}/batches`);
        if (response.ok) setData(await response.json());
      } catch (err) {
        console.error("Failed to fetch batch analysis:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const branchOptions = useMemo(() => {
    const seen = new Map<string, string | null>();
    data?.batches.forEach((b) => b.branches.forEach((br) => seen.set(br.code, br.label)));
    return [...seen.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  /** Each batch's numbers for the selected branch (or the whole batch). */
  const rows = useMemo(() => {
    if (!data) return [];
    return data.batches
      .map((b) => {
        const stats = branch ? b.branches.find((br) => br.code === branch)?.stats : b.stats;
        return stats ? { batch: b, stats } : null;
      })
      .filter((r): r is { batch: BatchEntry; stats: GroupStats } => r !== null);
  }, [data, branch]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.batches.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground">
        No batch data available
      </div>
    );
  }

  const chartData = rows.map(({ batch, stats }) => ({
    label: batch.yearOfStudy >= 1 ? `${ordinal(batch.yearOfStudy)} yr` : batch.batch,
    batch: batch.batch,
    average: Math.round(stats.averageAttendance * 10) / 10,
    students: stats.students,
  }));

  return (
    <div className="space-y-2.5">
      {/* Branch filter */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setBranch(null)} className={glassChipClass(branch === null)}>
          All branches
        </button>
        {branchOptions.map(([code, label]) => (
          <button key={code} onClick={() => setBranch(code)} className={glassChipClass(branch === code)}>
            {branchName(code, label)}
          </button>
        ))}
      </div>

      {/* Year chart */}
      <div className="rounded-2xl bg-card border border-border p-4">
        <h3 className="font-semibold text-sm">Average by Year of Study</h3>
        <p className="text-xs text-muted-foreground mb-3">
          B.Tech students · AY {data.academicYear} · each student's overall attendance
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 18, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={tooltipStyle}
              itemStyle={tooltipItemStyle}
              labelStyle={tooltipLabelStyle}
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
              labelFormatter={(_label, payload) =>
                payload?.[0] ? `${payload[0].payload.batch} batch` : ""
              }
              formatter={(value: number, _name, item) => [
                `${value}% · ${item.payload.students} students`,
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
                <Cell key={d.batch} fill={fillFor(d.average)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Batch cards */}
      {rows.map(({ batch, stats }, i) => (
        <div key={batch.batch} className="rounded-2xl bg-card border border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-sm">{yearLabel(batch.yearOfStudy)}</p>
              <p className="text-[11px] text-muted-foreground">
                {batch.batch} batch
                {branch && ` · ${branchName(branch, branchOptions.find(([c]) => c === branch)?.[1] ?? null)}`}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Delta value={i === 0 ? null : stats.averageAttendance - rows[i - 1].stats.averageAttendance} />
              <span className={cn("text-sm font-bold", textColor(stats.averageAttendance))}>
                {stats.averageAttendance.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, stats.averageAttendance)}%`,
                backgroundColor: fillFor(stats.averageAttendance),
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div>
              <p className="text-sm font-semibold flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-muted-foreground" />
                {stats.students}
              </p>
              <p className="text-[10px] text-muted-foreground">Students</p>
            </div>
            <div>
              <p className="text-sm font-semibold">{stats.medianAttendance.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">Median</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-400">
                {stats.below70Count}
                <span className="text-[10px] text-muted-foreground font-normal">
                  {" "}
                  ({stats.students > 0 ? Math.round((stats.below70Count / stats.students) * 100) : 0}%)
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground">Below 70%</p>
            </div>
          </div>

          {!branch && batch.branches.length > 1 && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              {batch.branches.map((br) => (
                <button
                  key={br.code}
                  onClick={() => setBranch(br.code)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>
                      <span className="font-medium">{branchName(br.code, br.label)}</span>
                      <span className="text-muted-foreground"> · {br.stats.students} students</span>
                    </span>
                    <span className={cn("font-semibold", textColor(br.stats.averageAttendance))}>
                      {br.stats.averageAttendance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, br.stats.averageAttendance)}%`,
                        backgroundColor: fillFor(br.stats.averageAttendance),
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground text-center">
        Batch = first 4 digits of the roll number · branch = next 2 digits · arrow shows change from the year above
      </p>
    </div>
  );
}
