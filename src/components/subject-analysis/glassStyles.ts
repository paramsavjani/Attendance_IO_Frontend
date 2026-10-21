import { cn } from "@/lib/utils";

/** Frosted pill used for filter chips, in the same glass language as the segmented control. */
export function glassChipClass(active: boolean): string {
  return cn(
    "px-3 py-1 rounded-full text-[11px] font-medium border backdrop-blur-xl transition-all duration-200",
    active
      ? "bg-white/80 dark:bg-white/15 text-foreground border-white/30 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.25)]"
      : "bg-white/20 dark:bg-black/20 text-muted-foreground border-white/20 dark:border-white/10 hover:text-foreground"
  );
}
