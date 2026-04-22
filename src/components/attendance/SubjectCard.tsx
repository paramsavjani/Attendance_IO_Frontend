import { cn } from "@/lib/utils";
import { ChevronDown, AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

function AnimatedBar({ width, className }: { width: number; className: string }) {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => setAnimatedWidth(width));
      return () => cancelAnimationFrame(id2);
    });
    return () => cancelAnimationFrame(id1);
  }, [width]);

  return (
    <div
      className={className}
      style={{ width: `${animatedWidth}%`, transition: "width 0.65s cubic-bezier(0.4, 0, 0.2, 1)" }}
    />
  );
}

interface SubjectCardProps {
  name: string;
  code?: string;
  lecturePlace?: string | null; // Default/institute location
  classroomLocation?: string | null; // User's custom location
  color: string;
  present: number;
  absent: number;
  total: number;
  totalUntilEndDate?: number;
  minRequired: number;
  percentage?: number;
  classesNeeded?: number;
  bunkableClasses?: number;
  onMinChange?: (value: number) => void;
  defaultExpanded?: boolean;
  hideBunkableInfo?: boolean; // Hide "Can Bunk" and "Total Classes" sections (for search view)
  suppressLowAttendanceStyling?: boolean;
  /** Institute view: no official row for this subject — show a positive empty state instead of 0% */
  noInstituteAttendance?: boolean;
}

export type { SubjectCardProps };

export function SubjectCard({
  name,
  code,
  lecturePlace,
  classroomLocation,
  present,
  absent,
  total,
  totalUntilEndDate,
  color,
  minRequired,
  percentage: backendPercentage,
  classesNeeded: backendClassesNeeded,
  bunkableClasses: backendBunkableClasses,
  onMinChange,
  defaultExpanded = false,
  hideBunkableInfo = false,
  suppressLowAttendanceStyling = false,
  noInstituteAttendance = false,
}: SubjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (noInstituteAttendance) {
    return (
      <div
        className={cn(
          "bg-card border rounded-xl overflow-hidden transition-all duration-300",
          "border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.07] to-transparent",
          "dark:from-emerald-500/[0.09] dark:border-emerald-400/20"
        )}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-1 h-8 rounded-full shrink-0"
              style={{ backgroundColor: `hsl(${color})` }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {code && <span>{code} · </span>}
                No official record
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 px-2.5 py-1 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">All good</span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </button>
        {isExpanded && (
          <div className="px-3 pb-4 pt-0 animate-fade-in">
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08] p-4 text-center space-y-2">
              <p className="text-3xl leading-none" aria-hidden>
                🎉
              </p>
              <p className="text-sm font-semibold text-foreground">Nothing to worry about</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                Your institute hasn&apos;t published attendance for this subject. Often that means there&apos;s nothing you need to track here yet — enjoy the calm.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Use backend-calculated values if available, otherwise calculate locally
  const percentage = backendPercentage !== undefined ? backendPercentage : (total > 0 ? (present / total) * 100 : 0);
  const classesNeeded = backendClassesNeeded !== undefined ? backendClassesNeeded : 0;
  const bunkable = backendBunkableClasses !== undefined ? backendBunkableClasses : 0;

  const isSafe = percentage >= minRequired;
  const isWarning = percentage >= minRequired - 10 && percentage < minRequired;

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl overflow-hidden transition-all duration-300",
      !suppressLowAttendanceStyling &&
        !isSafe &&
        "border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent shadow-[0_4px_20px_-4px_rgba(239,68,68,0.1)]"
    )}>
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full min-w-0 p-3 flex items-center justify-between gap-2"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="w-1 h-8 shrink-0 rounded-full"
            style={{ backgroundColor: `hsl(${color})` }}
          />
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {code && <span>{code} • </span>}{present}/{total}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className={cn(
            "text-xl font-bold",
            isSafe
              ? "text-success"
              : isWarning
                ? "text-warning"
                : "text-destructive"
          )}>
            {percentage.toFixed(0)}%
          </p>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 animate-fade-in">
          {/* Classroom location (use custom location or fallback to default) */}
          {(classroomLocation || lecturePlace) && (
            <div className="flex items-center">
              <p className="font-semibold text-sm">{classroomLocation || lecturePlace}</p>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Present</p>
              <p className="text-lg font-bold text-success">{present}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Absent</p>
              <p className="text-lg font-bold text-destructive">{absent}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-foreground">{total}</p>
            </div>
          </div>

          {/* Bunkable classes and Total classes info - hidden in search view */}
          {!hideBunkableInfo && (
            <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-muted/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Can Bunk</p>
                <p className={cn(
                  "text-lg font-bold",
                  bunkable > 0 ? "text-success" : "text-muted-foreground"
                )}>
                  {bunkable}
                </p>
                <p className="text-xs text-muted-foreground">classes</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Classes</p>
                <p className="text-lg font-bold text-foreground">{totalUntilEndDate ?? total}</p>
                <p className="text-xs text-muted-foreground">till end date</p>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Your Attendance</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-bold",
                  isSafe
                    ? "text-success"
                    : "text-destructive"
                )}>
                  {percentage.toFixed(2)}%
                </span>
                {!isSafe && (
                  <span className="text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded">
                    Below {minRequired}%
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <AnimatedBar
                width={Math.min(percentage, 100)}
                className={cn(
                  "h-full rounded-full",
                  isSafe ? "bg-success" : isWarning ? "bg-warning" : "bg-destructive"
                )}
              />
              {/* Threshold marker */}
              <div
                className="absolute top-0 w-0.5 h-full bg-foreground/50"
                style={{ left: `${minRequired}%` }}
              />
            </div>
          </div>

          {/* Analysis message - hidden in search view */}
          {!hideBunkableInfo && (
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-sm",
              isSafe ? "bg-success/10" : "bg-muted"
            )}>
              {isSafe ? (
                <>
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Above {minRequired}% threshold - <span className="text-success font-medium">Safe</span>
                    {bunkable > 0 && (
                      <span className="text-muted-foreground"> (Can bunk {bunkable} classes)</span>
                    )}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Attend <span className="text-warning font-medium">{classesNeeded}</span> more classes to reach {minRequired}%
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}