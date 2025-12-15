import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface OverviewCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "default" | "success" | "warning" | "destructive";
  tooltip?: string;
}

export function OverviewCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  tooltip,
}: OverviewCardProps) {
  const variantStyles = {
    default: "border-border",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    destructive: "border-destructive/30 bg-destructive/5",
  };

  const valueStyles = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  return (
    <div
      className={cn(
        "glass-card rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] animate-slide-up",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="flex items-center gap-2">
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {icon}
        </div>
      </div>
      <div className={cn("text-3xl font-bold mb-1", valueStyles[variant])}>
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
