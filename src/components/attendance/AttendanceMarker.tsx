import { Check, X, Ban, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceMarkerProps {
  subjectName: string;
  subjectCode?: string;
  time?: string;
  color: string; // hsl value
  isCurrent?: boolean;
  status: "present" | "absent" | "cancelled" | null;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  onMarkCancelled: () => void;
  disabled?: boolean;
  needsAttention?: boolean;
  attendancePercent?: number;
  isLoading?: boolean; // Loading attendance data
  isSaving?: boolean; // Saving attendance
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
  onMarkCancelled,
  disabled = false,
  needsAttention = false,
  attendancePercent,
  isLoading = false,
  isSaving = false,
}: AttendanceMarkerProps) {
  const isInteractionDisabled = disabled || isSaving;

  return (
    <div
      className={cn(
        "relative flex items-center rounded-2xl overflow-hidden",
        "bg-neutral-900 border border-white/5",
        "transition-all duration-200",
        isCurrent && "ring-1 ring-primary/40 bg-primary/5",
        needsAttention && !isCurrent && "ring-1 ring-warning/40",
        isSaving && "opacity-80"
      )}
    >
      {/* Left color indicator */}
      <div className="flex items-center pl-3">
        <div
          className="w-1 rounded-full h-10"
          style={{ backgroundColor: `hsl(${color})` }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-between px-4 py-3 min-w-0">
        {/* Text section */}
        <div className="min-w-0 flex-1 pr-3">
          <p
            className={cn(
              "text-sm font-semibold line-clamp-2",
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
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Attendance percent for disabled/future views */}
          {attendancePercent !== undefined && disabled && !isLoading && (
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

          {/* Saving indicator */}
          {isSaving && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50 rounded-2xl z-10">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}

          {/* Loading skeleton for buttons */}
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-10 w-10 rounded-xl bg-neutral-800" />
              <Skeleton className="h-10 w-10 rounded-xl bg-neutral-800" />
              <Skeleton className="h-10 w-10 rounded-xl bg-neutral-800" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <ActionButton
                active={status === "present"}
                onClick={onMarkPresent}
                disabled={isInteractionDisabled}
                variant="present"
              />
              <ActionButton
                active={status === "absent"}
                onClick={onMarkAbsent}
                disabled={isInteractionDisabled}
                variant="absent"
              />
              <ActionButton
                active={status === "cancelled"}
                onClick={onMarkCancelled}
                disabled={isInteractionDisabled}
                variant="cancelled"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Skeleton Loader for entire card ---------- */

export function AttendanceMarkerSkeleton() {
  return (
    <div className="relative flex items-center rounded-2xl overflow-hidden bg-neutral-900 border border-white/5">
      {/* Left color indicator skeleton */}
      <div className="flex items-center pl-3">
        <Skeleton className="w-1 h-10 rounded-full bg-neutral-700" />
      </div>

      {/* Content skeleton */}
      <div className="flex flex-1 items-center justify-between px-4 py-3">
        <div className="flex-1 pr-3 space-y-2">
          <Skeleton className="h-4 w-32 bg-neutral-800" />
          <Skeleton className="h-3 w-20 bg-neutral-800" />
          <Skeleton className="h-3 w-24 bg-neutral-800" />
        </div>

        {/* Action buttons skeleton */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-10 w-10 rounded-xl bg-neutral-800" />
          <Skeleton className="h-10 w-10 rounded-xl bg-neutral-800" />
          <Skeleton className="h-10 w-10 rounded-xl bg-neutral-800" />
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
  variant: "present" | "absent" | "cancelled";
}) {
  const Icon = variant === "present" ? Check : variant === "absent" ? X : Ban;

  const baseStyles = "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95";
  
  const variantStyles = {
    present: {
      active: "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30",
      inactive: "bg-emerald-500/10 text-emerald-500/70 hover:bg-emerald-500/20 hover:text-emerald-400 border border-emerald-500/20",
    },
    absent: {
      active: "bg-red-500 text-white shadow-lg shadow-red-500/30",
      inactive: "bg-red-500/10 text-red-500/70 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20",
    },
    cancelled: {
      active: "bg-yellow-500 text-black shadow-lg shadow-yellow-500/30",
      inactive: "bg-yellow-500/10 text-yellow-500/70 hover:bg-yellow-500/20 hover:text-yellow-400 border border-yellow-500/20",
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        active ? variantStyles[variant].active : variantStyles[variant].inactive,
        disabled && "pointer-events-none opacity-50"
      )}
      title={
        variant === "cancelled"
          ? "Lecture Cancelled"
          : variant === "present"
          ? "Present"
          : "Absent"
      }
    >
      <Icon className="w-4 h-4" strokeWidth={active ? 3 : 2} />
    </button>
  );
}
