import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface TrendData {
  date: string;
  label: string;
  count: number;
}

interface TrendChartProps {
  data: TrendData[];
  title: string;
  color: "success" | "primary" | "warning" | "destructive";
  average?: number;
  height?: number;
  className?: string;
}

export function TrendChart({
  data,
  title,
  color,
  average,
  height = 180,
  className,
}: TrendChartProps) {
  const colorStyles = {
    success: {
      stroke: "hsl(var(--success))",
      fill: "url(#gradientSuccess)",
      gradient: ["hsl(var(--success))", "hsl(var(--success))"],
    },
    primary: {
      stroke: "hsl(var(--primary))",
      fill: "url(#gradientPrimary)",
      gradient: ["hsl(var(--primary))", "hsl(var(--primary))"],
    },
    warning: {
      stroke: "hsl(var(--warning))",
      fill: "url(#gradientWarning)",
      gradient: ["hsl(var(--warning))", "hsl(var(--warning))"],
    },
    destructive: {
      stroke: "hsl(var(--destructive))",
      fill: "url(#gradientDestructive)",
      gradient: ["hsl(var(--destructive))", "hsl(var(--destructive))"],
    },
  };

  const styles = colorStyles[color];

  if (!data.length) {
    return (
      <div className={cn("", className)}>
        <div
          className="flex items-center justify-center text-sm text-muted-foreground"
          style={{ height }}
        >
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`gradient${color.charAt(0).toUpperCase() + color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={styles.gradient[0]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={styles.gradient[1]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
              opacity={0.5}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={35}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}
              formatter={(value: number) => [value.toLocaleString(), title]}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke={styles.stroke}
              strokeWidth={2.5}
              fill={styles.fill}
              dot={false}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
