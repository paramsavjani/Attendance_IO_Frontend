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
        "relative flex flex-col rounded-2xl overflow-hidden",
        "bg-neutral-900/50 border border-white/5 backdrop-blur-sm",
        "transition-all duration-300 group",
        needsAttention ? "ring-1 ring-warning/40" : 
        (isCurrent ? "ring-1 ring-primary/40" : "hover:bg-white/[0.02]")
      )}
    >

      {/* Top Row: Color Dot + Subject Name + LIVE + Percentage (same row) */}
      <div className="flex items-start justify-between px-3 py-2 pb-0.5">
        <div className="flex items-start gap-3 min-w-0">
          {/* Color Dot */}
          <div
            className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_8px] shadow-current transition-opacity"
            style={{ color: `hsl(${color})`, backgroundColor: `hsl(${color})` }}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn(
                "text-base font-semibold leading-none tracking-tight truncate pr-2 pt-1",
                isCurrent ? "text-primary" : "text-white"
              )}>
                {subjectName}
              </h3>
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400 font-medium">
              {subjectCode && (
                <span className="opacity-80">{subjectCode}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: LIVE + Percentage (same row) */}
        <div className="flex items-center gap-2 pl-3 pt-1 flex-shrink-0">
          {/* LIVE Badge - Inline with percentage */}
          {isCurrent && (
            <span className="flex items-center mr-2 gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold tracking-wider whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              LIVE
            </span>
          )}
          
          {/* Percentage Badge */}
          {attendancePercent !== undefined && (
            <div className={cn(
              "text-lg font-bold tabular-nums leading-none tracking-tight whitespace-nowrap",
              getPercentColor(attendancePercent)
            )}>
              {displayPercent}<span className="text-xs opacity-60 ml-0.5">%</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center justify-between px-3 py-2 pt-1 pb-1.5 bg-gradient-to-t from-black/20 to-transparent">

        {/* Lecture Place & Time (Replaces Status Text) */}
        <div className="flex-1 flex flex-col justify-center min-w-0 pr-3 pl-[1.375rem]">
          <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium">
            {lecturePlace && <span>{lecturePlace}</span>}
          </div>
          {time && (
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-0.5 font-medium">
              <span className="w-1 h-1 rounded-full bg-neutral-600" />
              <span className="truncate">{time}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-1 ml-auto">
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
    <div
      className={cn(
        "relative flex flex-col rounded-2xl overflow-hidden",
        "bg-neutral-900/50 border border-white/5 backdrop-blur-sm"
      )}
    >
      {/* Top Row: Color Dot + Subject Name + Percentage (same row) - matches real component */}
      <div className="flex items-start justify-between px-3 py-2 pb-0.5">
        <div className="flex items-start gap-3 min-w-0">
          {/* Color Dot - matches w-2.5 h-2.5 mt-1.5 */}
          <Skeleton className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 bg-neutral-700" />

          <div className="min-w-0">
            {/* Subject name - matches text-base leading-none pt-1 */}
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-4 w-32 bg-neutral-800 rounded mt-1" />
            </div>
            {/* Subject code - matches text-xs mt-0.5 */}
            <div className="flex items-center gap-2 mt-0.5">
              <Skeleton className="h-3 w-14 bg-neutral-800 rounded" />
            </div>
          </div>
        </div>

        {/* Right Side: Percentage - matches text-lg leading-none */}
        <div className="flex items-center gap-2 pl-3 pt-1 flex-shrink-0">
          <Skeleton className="h-5 w-12 bg-neutral-800 rounded" />
        </div>
      </div>

      {/* Actions Section - matches real component structure */}
      <div className="flex items-center justify-between px-3 py-2 pt-1 pb-1.5 bg-gradient-to-t from-black/20 to-transparent">
        {/* Lecture Place & Time - matches pl-[1.375rem] */}
        <div className="flex-1 flex flex-col justify-center min-w-0 pr-3 pl-[1.375rem]">
          {/* Lecture place - text-xs */}
          <Skeleton className="h-3 w-14 bg-neutral-800 rounded" />
          {/* Time - text-[10px] mt-0.5 with dot */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <Skeleton className="w-1 h-1 rounded-full bg-neutral-600" />
            <Skeleton className="h-2.5 w-20 bg-neutral-800 rounded" />
          </div>
        </div>

        {/* Action buttons - matches h-9 w-9 lg:h-11 lg:w-11 gap-2 */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <Skeleton className="h-9 w-9 lg:h-11 lg:w-11 rounded-xl bg-neutral-800" />
          <Skeleton className="h-9 w-9 lg:h-11 lg:w-11 rounded-xl bg-neutral-800" />
          <Skeleton className="h-9 w-9 lg:h-11 lg:w-11 rounded-xl bg-neutral-800" />
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

  const baseStyles = "h-9 w-9 lg:h-11 lg:w-11 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 relative";

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
