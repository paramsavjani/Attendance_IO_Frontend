import { useEffect, useState } from "react";
import { API_CONFIG } from "@/lib/api";
import { cn } from "@/lib/utils";

interface YearBar {
  label: string;
  batch: string;
  value: number;
}

interface BatchesResponse {
  batches: { batch: string; yearOfStudy: number; stats: { averageAttendance: number } }[];
}

function ordinal(n: number): string {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}

/**
 * Popup chart of official B.Tech average attendance per year of study, read live from
 * /api/subjects/analysis/batches so the announcement never shows stale numbers. Renders
 * nothing until the data arrives (or at all, if the request fails).
 */
export function PopupYearChart({
  title,
  visible,
  style,
  className,
}: {
  title: string;
  visible: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [bars, setBars] = useState<YearBar[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API_CONFIG.ENDPOINTS.SUBJECT_ANALYSIS}/batches`);
        if (!response.ok) return;
        const data: BatchesResponse = await response.json();
        const next = data.batches
          .filter((b) => b.yearOfStudy >= 1 && b.yearOfStudy <= 4)
          .sort((a, b) => a.yearOfStudy - b.yearOfStudy)
          .map((b) => ({
            label: `${ordinal(b.yearOfStudy)} yr`,
            batch: b.batch,
            value: b.stats.averageAttendance,
          }));
        if (!cancelled && next.length > 1) setBars(next);
      } catch {
        // no chart rather than a broken one
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!bars) return null;

  return (
    <div className={cn("rounded-lg bg-[#151515] px-3 pb-2.5 pt-3 text-left", className)} style={style}>
      <div className="mb-2.5 text-[11.5px] font-medium text-[#f0efec]">{title}</div>
      <div className="flex h-[92px] items-end gap-2.5">
        {bars.map((bar, i) => (
          <div key={bar.batch} className="flex h-full flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-[11px] font-medium tabular-nums text-[#f0efec]">
              {bar.value.toFixed(0)}%
            </span>
            <div
              className="w-full rounded-t-[5px] bg-gradient-to-t from-[#1d4f8c] to-[#6da7ec] transition-[height] duration-700 ease-out"
              style={{
                height: visible ? `${Math.max(4, (bar.value / 100) * 64)}px` : "4px",
                transitionDelay: `${250 + i * 90}ms`,
                opacity: 1 - i * 0.12,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2.5 border-t border-white/[0.06] pt-1.5">
        {bars.map((bar) => (
          <div key={bar.batch} className="flex-1 text-center">
            <div className="text-[10.5px] text-[#c3c2b7]">{bar.label}</div>
            <div className="text-[9.5px] text-[#898781]">{bar.batch}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
