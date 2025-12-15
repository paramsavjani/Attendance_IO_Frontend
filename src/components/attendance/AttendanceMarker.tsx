import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceMarkerProps {
  subjectName: string;
  subjectCode?: string;
  time: string;
  color: string;
  isCurrent?: boolean;
  status: 'present' | 'absent' | null;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  disabled?: boolean;
  needsAttention?: boolean;
  attendancePercent?: number;
}

export function AttendanceMarker({
  subjectName,
  subjectCode,
  time,
  color,
  isCurrent = false,
  status,
  onMarkPresent,
  onMarkAbsent,
  disabled = false,
  needsAttention = false,
  attendancePercent,
}: AttendanceMarkerProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-300",
        isCurrent 
          ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/10" 
          : "bg-card border-border/50 hover:border-border",
        needsAttention && !isCurrent && "border-warning/30 bg-warning/5",
        disabled && "opacity-70"
      )}
    >
      <div className="flex items-center">
        {/* Color bar */}
        <div
          className={cn(
            "w-1.5 self-stretch transition-all",
            isCurrent && "w-2"
          )}
          style={{ backgroundColor: `hsl(${color})` }}
        />
        
        {/* Content */}
        <div className="flex-1 py-4 px-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn(
              "font-semibold text-sm",
              isCurrent && "text-primary"
            )}>
              {subjectName}
            </p>
            {isCurrent && (
              <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide animate-pulse">
                live
              </span>
            )}
            {needsAttention && !isCurrent && (
              <span className="flex items-center gap-1 text-[10px] bg-warning/20 text-warning px-2 py-0.5 rounded-full font-semibold">
                <AlertTriangle className="w-3 h-3" />
                must attend
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              {subjectCode ? `${subjectCode} • ${time}` : time}
            </p>
            {attendancePercent !== undefined && disabled && (
              <span className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded",
                attendancePercent >= 75 
                  ? "bg-success/10 text-success" 
                  : "bg-destructive/10 text-destructive"
              )}>
                {attendancePercent.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 pr-3">
          <button
            onClick={onMarkPresent}
            disabled={disabled}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
              disabled && "pointer-events-none",
              status === "present"
                ? "bg-success text-success-foreground shadow-md shadow-success/30"
                : "text-muted-foreground/50 hover:bg-success/10 hover:text-success active:scale-95"
            )}
          >
            <Check className="w-5 h-5" strokeWidth={status === "present" ? 3 : 2} />
          </button>
          <button
            onClick={onMarkAbsent}
            disabled={disabled}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
              disabled && "pointer-events-none",
              status === "absent"
                ? "bg-destructive text-destructive-foreground shadow-md shadow-destructive/30"
                : "text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive active:scale-95"
            )}
          >
            <X className="w-5 h-5" strokeWidth={status === "absent" ? 3 : 2} />
          </button>
        </div>
      </div>
    </div>
  );
}
