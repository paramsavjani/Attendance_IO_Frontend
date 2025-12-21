import { Check, X, Ban, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AttendanceMarkerProps {
  subjectName: string;
  subjectCode?: string;
  lecturePlace?: string | null;
  time?: string;
  color: string; // hsl value
  isCurrent?: boolean;
  status: "present" | "absent" | "cancelled" | null;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  onMarkCancelled: () => void;
  disabled?: boolean;
  disablePresentAbsent?: boolean; // Disable present/absent buttons (e.g., for future dates)
  needsAttention?: boolean;
  attendancePercent?: number;
  isLoading?: boolean;
  savingAction?: "present" | "absent" | "cancelled" | null;
}

export function AttendanceMarker({
  subjectName,
  subjectCode,
  lecturePlace,
  time,
  color,
  isCurrent = false,
  status,
  onMarkPresent,
  onMarkAbsent,
  onMarkCancelled,
  disabled = false,
  disablePresentAbsent = false,
  needsAttention = false,
  attendancePercent,
  isLoading = false,
  savingAction = null,
}: AttendanceMarkerProps) {
  const isSaving = savingAction !== null;
  const isInteractionDisabled = disabled || isSaving;

  return (
    <div
      className={cn(
        "relative flex items-center rounded-xl overflow-hidden",
        "bg-neutral-900 border border-white/5",
        "transition-all duration-200",
        isCurrent && "ring-1 ring-primary/40 bg-primary/5",
        needsAttention && !isCurrent && "ring-1 ring-warning/40"
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
      <div className="flex flex-1 items-center justify-between px-3 py-2.5 min-w-0">
        {/* Text section */}
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-sm font-semibold line-clamp-1",
                isCurrent ? "text-primary" : "text-white"
              )}
            >
              {subjectName}
            </p>
            {isCurrent && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold tracking-wide flex-shrink-0">
                LIVE
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {subjectCode && (
              <span className="text-[11px] text-neutral-400 font-medium">
                {subjectCode}
              </span>
            )}
            {lecturePlace && (
              <span className="text-[11px] text-neutral-500">
                • {lecturePlace}
              </span>
            )}
            {time && (
              <span className="text-[11px] text-neutral-500">
                • {time}
              </span>
            )}
            {needsAttention && !isCurrent && (
              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-warning/20 text-warning font-semibold ml-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Low
              </span>
            )}
          </div>
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
                disabled={isInteractionDisabled || disablePresentAbsent}
                variant="present"
                isSaving={savingAction === "present"}
                disabledReason={disablePresentAbsent ? "Only 'cancelled' allowed for future dates" : undefined}
              />
              <ActionButton
                active={status === "absent"}
                onClick={onMarkAbsent}
                disabled={isInteractionDisabled || disablePresentAbsent}
                variant="absent"
                isSaving={savingAction === "absent"}
                disabledReason={disablePresentAbsent ? "Only 'cancelled' allowed for future dates" : undefined}
              />
              <ActionButton
                active={status === "cancelled"}
                onClick={onMarkCancelled}
                disabled={isInteractionDisabled}
                variant="cancelled"
                isSaving={savingAction === "cancelled"}
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
    <div className="relative flex items-center rounded-xl overflow-hidden bg-neutral-900 border border-white/5">
      <div className="flex items-center pl-3">
        <Skeleton className="w-1 h-10 rounded-full bg-neutral-700" />
      </div>
      <div className="flex flex-1 items-center justify-between px-3 py-2.5">
        <div className="flex-1 pr-3 space-y-1.5">
          <Skeleton className="h-4 w-36 bg-neutral-800" />
          <Skeleton className="h-3 w-28 bg-neutral-800" />
        </div>
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
  isSaving = false,
  disabledReason,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  variant: "present" | "absent" | "cancelled";
  isSaving?: boolean;
  disabledReason?: string;
}) {
  const Icon = variant === "present" ? Check : variant === "absent" ? X : Ban;

  const baseStyles = "h-10 w-10 lg:h-11 lg:w-11 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 relative";
  
  const variantStyles = {
    present: {
      active: "bg-emerald-500 text-black",
      inactive: "bg-emerald-500/10 text-emerald-500/70 hover:bg-emerald-500/20 hover:text-emerald-400 border border-emerald-500/20",
      saving: "bg-emerald-500/30 border-2 border-emerald-500",
    },
    absent: {
      active: "bg-red-500 text-white",
      inactive: "bg-red-500/10 text-red-500/70 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20",
      saving: "bg-red-500/30 border-2 border-red-500",
    },
    cancelled: {
      active: "bg-yellow-500 text-black",
      inactive: "bg-yellow-500/10 text-yellow-500/70 hover:bg-yellow-500/20 hover:text-yellow-400 border border-yellow-500/20",
      saving: "bg-yellow-500/30 border-2 border-yellow-500",
    },
  };

  const getButtonStyle = () => {
    if (isSaving) return variantStyles[variant].saving;
    if (active) return variantStyles[variant].active;
    return variantStyles[variant].inactive;
  };

  const getTitle = () => {
    if (disabledReason) return disabledReason;
    if (variant === "cancelled") return "Mark as Cancelled";
    if (variant === "present") return "Mark as Present";
    return "Mark as Absent";
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        getButtonStyle(),
        disabled && !isSaving && "pointer-events-none opacity-50"
      )}
      title={getTitle()}
    >
      {isSaving ? (
        <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
      ) : (
        <Icon className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={active ? 3 : 2} />
      )}
    </button>
  );
}
