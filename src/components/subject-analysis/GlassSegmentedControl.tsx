import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GlassSegment<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface Props<T extends string> {
  segments: GlassSegment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Liquid-glass segmented control with a sliding indicator, matching the Dashboard/Analytics tabs. */
export function GlassSegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className,
}: Props<T>) {
  const count = segments.length;
  const index = Math.max(0, segments.findIndex((s) => s.value === value));
  // Container has p-1 (4px) and gap-1 (4px) between segments.
  const width = `calc((100% - 8px - ${(count - 1) * 4}px) / ${count})`;
  const left = `calc(4px + ${index} * (${width} + 4px))`;

  return (
    <div
      role="tablist"
      className={cn(
        "relative flex p-1 gap-1 rounded-2xl border border-white/20 dark:border-white/10 bg-white/20 dark:bg-black/20 backdrop-blur-3xl shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] dark:shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]",
        className
      )}
    >
      <div
        aria-hidden
        className="absolute top-1 bottom-1 rounded-xl bg-white/80 dark:bg-white/10 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.3)] backdrop-blur-xl border border-white/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] pointer-events-none"
        style={{ width, left }}
      />
      {segments.map((segment) => {
        const active = segment.value === value;
        const Icon = segment.icon;
        return (
          <button
            key={segment.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(segment.value)}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-medium transition-colors duration-200",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
