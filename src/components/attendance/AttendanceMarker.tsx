import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceMarkerProps {
  subjectName: string;
  subjectCode?: string;
  time?: string;
  color: string; // hsl value
  isCurrent?: boolean;
  status: "present" | "absent" | null;
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
        "relative flex items-center rounded-2xl overflow-hidden",
        "bg-neutral-900 border border-white/5",
        "transition-none", // ❌ no hover animations
        isCurrent && "ring-1 ring-primary/40 bg-primary/5",
        needsAttention && !isCurrent && "ring-1 ring-warning/40",
        disabled && "opacity-70"
      )}
    >
{/* Left color indicator (image-style) */}
<div className="flex items-center pl-3">
  <div
    className={cn(
      "w-1 rounded-full",
      isCurrent ? "h-10" : "h-10"
    )}
    style={{ backgroundColor: `hsl(${color})` }}
  />
</div>


      {/* Content */}
      <div className="flex flex-1 items-center justify-between px-4 py-3">
        {/* Text section */}
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-semibold truncate",
              isCurrent ? "text-primary" : "text-white"
            )}
          >
            {subjectName}
          </p>

          <div className="flex items-center gap-2 mt-0.5">
            {subjectCode && (
              <span className="text-xs text-neutral-400">
                {subjectCode}
              </span>
            )}

            {isCurrent && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold tracking-wide">
                LIVE
              </span>
            )}

            {needsAttention && !isCurrent && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning font-semibold">
                <AlertTriangle className="w-3 h-3" />
                Must attend
              </span>
            )}
          </div>

          {time && (
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {time}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-3">
          {attendancePercent !== undefined && disabled && (
            <span
              className={cn(
                "mr-2 text-xs font-medium",
                attendancePercent >= 75
                  ? "text-emerald-400"
                  : "text-red-400"
              )}
            >
              {attendancePercent.toFixed(0)}%
            </span>
          )}

          <ActionButton
            active={status === "present"}
            onClick={onMarkPresent}
            disabled={disabled}
            variant="present"
          />

          <ActionButton
            active={status === "absent"}
            onClick={onMarkAbsent}
            disabled={disabled}
            variant="absent"
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Action Button ---------- */

function ActionButton({
  active,
  onClick,
  disabled,
  variant,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant: "present" | "absent";
}) {
  const Icon = variant === "present" ? Check : X;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-9 w-9 rounded-xl flex items-center justify-center",
        "transition-none", // ❌ no hover animation
        active &&
          (variant === "present"
            ? "bg-emerald-500 text-black"
            : "bg-red-500 text-white"),
        !active && "text-neutral-500",
        disabled && "pointer-events-none"
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={active ? 3 : 2} />
    </button>
  );
}
