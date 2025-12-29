import { cn } from "@/lib/utils";
import { ChevronDown, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

interface SubjectCardProps {
  name: string;
  code?: string;
  lecturePlace?: string | null;
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
}

export type { SubjectCardProps };

export function SubjectCard({
  name,
  code,
  lecturePlace,
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
}: SubjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Use backend-calculated values if available, otherwise calculate locally
  const percentage = backendPercentage !== undefined ? backendPercentage : (total > 0 ? (present / total) * 100 : 0);
  const classesNeeded = backendClassesNeeded !== undefined ? backendClassesNeeded : 0;
  const bunkable = backendBunkableClasses !== undefined ? backendBunkableClasses : 0;
  
  const isSafe = percentage >= minRequired;
  const isWarning = percentage >= minRequired - 10 && percentage < minRequired;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-8 rounded-full"
            style={{ backgroundColor: `hsl(${color})` }}
          />
          <div className="text-left">
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">
              {code && <span>{code} • </span>}{present}/{total}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-xl font-bold",
            isSafe && "text-success",
            isWarning && "text-warning",
            !isSafe && !isWarning && "text-destructive"
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
          {/* Lecture place */}
          {lecturePlace && (
            <div className="flex items-center">
              <p className="font-semibold text-sm">{lecturePlace}</p>
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
                  isSafe ? "text-success" : "text-destructive"
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
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isSafe ? "bg-success" : isWarning ? "bg-warning" : "bg-destructive"
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
              {/* Threshold marker */}
              <div
                className="absolute top-0 w-0.5 h-full bg-foreground/50"
                style={{ left: `${minRequired}%` }}
              />
            </div>
          </div>

          {/* Analysis message */}
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg text-sm",
            isSafe ? "bg-success/10" : "bg-muted"
          )}>
            {isSafe ? (
              <>
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-muted-foreground">
                  Above {minRequired}% threshold - <span className="text-success font-medium">Safe</span>
                  {!hideBunkableInfo && bunkable > 0 && (
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
        </div>
      )}
    </div>
  );
}