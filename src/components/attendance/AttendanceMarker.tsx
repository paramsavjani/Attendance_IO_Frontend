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

  // Format percentage nicely
  const displayPercent = attendancePercent !== undefined ? attendancePercent.toFixed(0) : null;

  // Determine color for percentage
  const getPercentColor = (percent: number) => {
    if (percent >= 75) return "text-emerald-400";
    if (percent >= 65) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div
      className={cn(
        "relative flex flex-col md:flex-row md:items-center rounded-2xl overflow-hidden",
        "bg-neutral-900/50 border border-white/5 backdrop-blur-sm",
        "transition-all duration-300 group",
        isCurrent ? "ring-1 ring-primary/40 bg-primary/5 shadow-[0_0_30px_-10px_bg-primary/20]" : "hover:bg-white/[0.02]",
        needsAttention && !isCurrent && "ring-1 ring-warning/40"
      )}
    >

      {/* Mobile Top Row: Color Dot + Subject Name + Time */}
      <div className="flex items-start justify-between p-2.5 pb-1 md:p-3 md:pl-5 md:flex-1 md:items-center md:pb-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Color Dot (visible on mobile only/mostly) */}
          <div
            className="w-2.5 h-2.5 rounded-full mt-1.5 md:hidden flex-shrink-0 shadow-[0_0_8px] shadow-current transition-opacity"
            style={{ color: `hsl(${color})`, backgroundColor: `hsl(${color})` }}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                "text-base font-semibold leading-none tracking-tight truncate pr-2",
                isCurrent ? "text-primary" : "text-white"
              )}>
                {subjectName}
              </h3>
              {isCurrent && (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold tracking-wider animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  LIVE
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400 font-medium">
              {subjectCode && (
                <span className="opacity-80">{subjectCode}</span>
              )}
              {lecturePlace && (
                <>
                  <span className="w-1 h-1 rounded-full bg-neutral-700" />
                  <span>{lecturePlace}</span>
                </>
              )}
              <span className="md:hidden flex items-center gap-1.5 text-neutral-500">
                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                {time}
              </span>
            </div>
          </div>
        </div>

        {/* Percentage Badge (Mobile & Desktop) */}
        {attendancePercent !== undefined && (
          <div className="flex flex-col items-end pl-3">
            <div className={cn(
              "text-lg font-bold tabular-nums leading-none tracking-tight",
              getPercentColor(attendancePercent)
            )}>
              {displayPercent}<span className="text-xs opacity-60 ml-0.5">%</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-medium mt-0.5 uppercase tracking-wide">
              Attd.
            </div>
          </div>
        )}
      </div>

      {/* Desktop Time - Hidden on mobile */}
      <div className="hidden md:flex items-center text-sm text-neutral-400 font-medium px-4 border-l border-white/5 h-10">
        {time}
      </div>

      {/* Actions Section */}
      <div className="flex items-center justify-between p-2.5 pt-0 pb-1.5 md:p-3 md:pl-4 md:border-l md:border-white/5 bg-gradient-to-t from-black/20 to-transparent md:bg-none">

        {/* Status Text (visible if marked) */}
        <div className="flex-1 md:hidden">
          {status && (
            <span className={cn(
              "text-xs font-semibold px-2 py-1 rounded-md capitalize inline-flex items-center gap-1.5",
              status === 'present' && "bg-emerald-500/10 text-emerald-400",
              status === 'absent' && "bg-red-500/10 text-red-400",
              status === 'cancelled' && "bg-yellow-500/10 text-yellow-400",
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full",
                status === 'present' ? "bg-emerald-400" :
                  status === 'absent' ? "bg-red-400" : "bg-yellow-400"
              )} />
              {status}
            </span>
          )}
          {!status && (
            <span className="text-xs text-neutral-600 font-medium italic">
              Not marked yet
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-xl bg-neutral-800" />
              <Skeleton className="h-10 w-10 rounded-xl bg-neutral-800" />
              <Skeleton className="h-10 w-10 rounded-xl bg-neutral-800" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
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
