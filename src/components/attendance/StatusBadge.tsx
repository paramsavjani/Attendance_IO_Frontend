import { AttendanceStatus } from "@/types/attendance";
import { cn } from "@/lib/utils";
import { Check, X, Calendar } from "lucide-react";

interface StatusBadgeProps {
  status: AttendanceStatus;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const statusConfig = {
    present: {
      bg: "bg-success/15",
      text: "text-success",
      icon: Check,
      label: "Present",
    },
    absent: {
      bg: "bg-destructive/15",
      text: "text-destructive",
      icon: X,
      label: "Absent",
    },
    leave: {
      bg: "bg-warning/15",
      text: "text-warning",
      icon: Calendar,
      label: "Leave",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        config.bg,
        config.text,
        sizeClasses[size]
      )}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
}
