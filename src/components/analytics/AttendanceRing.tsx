import { cn } from "@/lib/utils";

interface AttendanceRingProps {
  percentage: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export function AttendanceRing({
  percentage,
  size = "md",
  showLabel = true,
  label,
  className,
}: AttendanceRingProps) {
  const sizeStyles = {
    sm: { container: "w-20 h-20", stroke: 6, textSize: "text-lg" },
    md: { container: "w-32 h-32", stroke: 8, textSize: "text-2xl" },
    lg: { container: "w-44 h-44", stroke: 10, textSize: "text-4xl" },
  };

  const styles = sizeStyles[size];
  const radius = 50 - styles.stroke / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 75) return "text-success";
    if (pct >= 60) return "text-warning";
    return "text-destructive";
  };

  const getStrokeColor = (pct: number) => {
    if (pct >= 75) return "hsl(var(--success))";
    if (pct >= 60) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div className={cn("relative", styles.container)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={styles.stroke}
            className="opacity-30"
          />
          {/* Animated progress ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={getStrokeColor(percentage)}
            strokeWidth={styles.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${getStrokeColor(percentage)})`,
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold tabular-nums", styles.textSize, getColor(percentage))}>
            {Math.round(percentage)}%
          </span>
          {showLabel && label && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
