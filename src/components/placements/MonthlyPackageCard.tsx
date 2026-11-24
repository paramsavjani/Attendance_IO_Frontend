import { cn } from "@/lib/utils";
import type { PlacementMonth } from "@/lib/placements";

const COL = 70; // one month's width in the drawing
const TOP = 28;
const BASE = 100;
const HEIGHT = 132;
const LINE = "#a78bfa";

/** "2026-07" → "Jul" */
const monthName = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" }).slice(0, 3);

/** How the average package of the companies that came has moved through the season. */
export function MonthlyPackageCard({ months, average, className }: { months: PlacementMonth[]; average: number | null | undefined; className?: string }) {
  if (months.length < 2) return null;
  const width = months.length * COL;
  const max = Math.max(...months.map((m) => m.averageCtcLpa));
  const y = (lpa: number) => BASE - ((BASE - TOP) * lpa) / max;
  const points = months.map((m, i) => ({ ...m, x: COL * i + COL / 2, y: y(m.averageCtcLpa) }));
  const path = points.map((p) => `${p.x},${p.y}`).join(" L");
  // The season label sits at the end of the dashed line that the curve leaves free
  const labelRight = average == null || points[points.length - 1].averageCtcLpa < average;

  return (
    <section className={cn("px-4 pb-2 pt-3", className)}>
      <h2 className="text-[14.5px] font-semibold leading-snug">Average package of companies by month</h2>
      <p className="mt-0.5 text-[11.5px] leading-snug text-white/50">
        Companies that came each month. PPOs not included.
      </p>
      {/* Fits the card up to six months, then scrolls sideways */}
      <div className="-mx-4 mt-1 overflow-x-auto [scrollbar-width:none]">
        <svg
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className="block w-full"
          style={months.length > 6 ? { minWidth: width } : undefined}
          role="img"
          aria-label={`Average package of companies by month: ${months.map((m) => `${monthName(m.month)} ${m.averageCtcLpa.toFixed(1)} LPA from ${m.companies} companies`).join(", ")}`}
        >
          <defs>
            <linearGradient id="monthly-package-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={LINE} stopOpacity="0.36" />
              <stop offset="1" stopColor={LINE} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M${path} L${points[points.length - 1].x},${BASE} L${points[0].x},${BASE} Z`} fill="url(#monthly-package-fill)" />
          <line x1="0" x2={width} y1={BASE} y2={BASE} stroke="white" strokeOpacity="0.08" />
          {average != null && (
            <>
              <line x1="0" x2={width} y1={y(average)} y2={y(average)} stroke="white" strokeOpacity="0.35" strokeDasharray="3 4" />
              <text x={labelRight ? width - 8 : 8} y={y(average) - 6} textAnchor={labelRight ? "end" : "start"} fontSize="10.5" fill="white" fillOpacity="0.65">
                Overall average ₹{average.toFixed(1)}L
              </text>
            </>
          )}
          <path d={`M${path}`} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
          {points.map((p) => (
            <g key={p.month} textAnchor="middle">
              <circle cx={p.x} cy={p.y} r="5" fill={LINE} stroke="#121212" strokeWidth="2" />
              <text x={p.x} y={average == null || p.averageCtcLpa >= average ? p.y - 10 : p.y + 19} fontSize="12.5" fontWeight="700" fill="white">
                ₹{p.averageCtcLpa.toFixed(1)}L
              </text>
              <text x={p.x} y={BASE + 15} fontSize="12" fontWeight="600" fill="white" fillOpacity="0.85">
                {monthName(p.month)}
              </text>
              <text x={p.x} y={BASE + 28} fontSize="9.5" fill="white" fillOpacity="0.55">
                {p.companies} {p.companies === 1 ? "company" : "companies"}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
