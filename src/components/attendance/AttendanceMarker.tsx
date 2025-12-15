import { Check, X } from "lucide-react";
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
}: AttendanceMarkerProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border overflow-hidden transition-opacity",
        isCurrent ? "border-primary/50" : "border-border",
        disabled && "opacity-60"
      )}
    >
      <div className="flex items-center">
        {/* Color bar */}
        <div
          className="w-1 self-stretch"
          style={{ backgroundColor: `hsl(${color})` }}
        />
        
        {/* Content */}
        <div className="flex-1 py-3 px-4">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{subjectName}</p>
            {isCurrent && (
              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium uppercase">
                now
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {subjectCode ? `${subjectCode} • ${time}` : time}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-4 pr-4">
          <button
            onClick={onMarkPresent}
            disabled={disabled}
            className={cn(
              "w-6 h-6 flex items-center justify-center transition-all",
              disabled && "pointer-events-none",
              status === "present"
                ? "text-success"
                : "text-muted-foreground/40 hover:text-success"
            )}
          >
            <Check className="w-5 h-5" strokeWidth={status === "present" ? 3 : 2} />
          </button>
          <button
            onClick={onMarkAbsent}
            disabled={disabled}
            className={cn(
              "w-6 h-6 flex items-center justify-center transition-all",
              disabled && "pointer-events-none",
              status === "absent"
                ? "text-destructive"
                : "text-muted-foreground/40 hover:text-destructive"
            )}
          >
            <X className="w-5 h-5" strokeWidth={status === "absent" ? 3 : 2} />
          </button>
        </div>
      </div>
    </div>
  );
}
