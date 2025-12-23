import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";

interface AttendanceSummaryProps {
  totalPresent: number;
  totalAbsent: number;
  totalClasses: number;
  averagePercentage: number;
  subjectsAtRisk: number;
  totalBunkable: number;
}

export function AttendanceSummary({
  totalPresent,
  totalAbsent,
  totalClasses,
  averagePercentage,
  subjectsAtRisk,
  totalBunkable,
}: AttendanceSummaryProps) {
  const overallPercentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Overall Attendance</h2>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">All Subjects</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Present */}
        <div className="bg-success/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <p className="text-xs text-muted-foreground">Total Present</p>
          </div>
          <p className="text-2xl font-bold text-success">{totalPresent}</p>
        </div>

        {/* Total Absent */}
        <div className="bg-destructive/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <p className="text-xs text-muted-foreground">Total Absent</p>
          </div>
          <p className="text-2xl font-bold text-destructive">{totalAbsent}</p>
        </div>
      </div>

      {/* Overall Percentage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Overall Attendance</span>
          </div>
          <span className={cn(
            "text-xl font-bold",
            overallPercentage >= 75 ? "text-success" : overallPercentage >= 65 ? "text-warning" : "text-destructive"
          )}>
            {overallPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              overallPercentage >= 75 ? "bg-success" : overallPercentage >= 65 ? "bg-warning" : "bg-destructive"
            )}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {totalClasses} total classes
        </p>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Average %</p>
          <p className={cn(
            "text-lg font-bold",
            averagePercentage >= 75 ? "text-success" : averagePercentage >= 65 ? "text-warning" : "text-destructive"
          )}>
            {averagePercentage.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">At Risk</p>
          <p className={cn(
            "text-lg font-bold",
            subjectsAtRisk === 0 ? "text-success" : "text-warning"
          )}>
            {subjectsAtRisk} {subjectsAtRisk === 1 ? "subject" : "subjects"}
          </p>
        </div>
      </div>

      {/* Bunkable Classes Info */}
      {totalBunkable > 0 && (
        <div className="bg-success/10 rounded-lg p-3 border border-success/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Classes You Can Bunk</p>
              <p className="text-xl font-bold text-success">{totalBunkable}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Across all subjects</p>
              <p className="text-xs text-success font-medium">while maintaining minimum</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

