import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface SemesterData {
  semester: string;
  percentage: number;
  students: number;
  color: string;
}

interface SemesterComparisonChartProps {
  data: SemesterData[];
  onSemesterClick?: (semester: string) => void;
  className?: string;
}

export function SemesterComparisonChart({
  data,
  onSemesterClick,
  className,
}: SemesterComparisonChartProps) {
  const getBarColor = (percentage: number) => {
    if (percentage >= 75) return "from-success via-success/80 to-success/60";
    if (percentage >= 60) return "from-warning via-warning/80 to-warning/60";
    return "from-destructive via-destructive/80 to-destructive/60";
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 75) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-destructive";
  };

  const maxStudents = Math.max(...data.map((d) => d.students));

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => (
        <button
          key={item.semester}
          onClick={() => onSemesterClick?.(item.semester)}
          className="w-full group animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="bg-card/50 hover:bg-card border border-border hover:border-primary/30 rounded-xl p-3 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.semester}</span>
                <span className="text-xs text-muted-foreground">
                  ({item.students.toLocaleString()} students)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-lg font-bold tabular-nums",
                    getTextColor(item.percentage)
                  )}
                >
                  {item.percentage}%
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>
            {/* Progress bar */}
            <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
                  getBarColor(item.percentage)
                )}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            {/* Student count bar (subtle background) */}
            <div className="relative h-0.5 bg-muted/10 rounded-full overflow-hidden mt-1">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-muted/40 transition-all duration-700 ease-out"
                style={{ width: `${(item.students / maxStudents) * 100}%` }}
              />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
