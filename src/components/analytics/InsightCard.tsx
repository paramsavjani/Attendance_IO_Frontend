import { cn } from "@/lib/utils";
import { LucideIcon, Sparkles, TrendingUp, TrendingDown, Target, AlertCircle } from "lucide-react";

type InsightType = "tip" | "achievement" | "warning" | "goal" | "trend";

interface InsightCardProps {
  type: InsightType;
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
}

export function InsightCard({
  type,
  title,
  description,
  icon: CustomIcon,
  className,
}: InsightCardProps) {
  const typeStyles = {
    tip: {
      bg: "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20",
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      defaultIcon: Sparkles,
    },
    achievement: {
      bg: "bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/20",
      iconBg: "bg-success/20",
      iconColor: "text-success",
      defaultIcon: TrendingUp,
    },
    warning: {
      bg: "bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20",
      iconBg: "bg-warning/20",
      iconColor: "text-warning",
      defaultIcon: AlertCircle,
    },
    goal: {
      bg: "bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-accent/20",
      iconBg: "bg-accent/20",
      iconColor: "text-accent",
      defaultIcon: Target,
    },
    trend: {
      bg: "bg-gradient-to-br from-muted/50 via-muted/25 to-transparent border-border",
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      defaultIcon: TrendingDown,
    },
  };

  const styles = typeStyles[type];
  const Icon = CustomIcon || styles.defaultIcon;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.01] animate-fade-in",
        styles.bg,
        className
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            styles.iconBg
          )}
        >
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm mb-0.5">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
