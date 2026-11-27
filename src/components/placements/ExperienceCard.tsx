import { BadgeCheck, CircleSlash, Clock3, Layers, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExperienceSummary } from "@/lib/placements";
import { CompanyMark } from "@/components/placements/PlacementPieces";

/** Selected (green), Not selected (muted rose) or result not shared (grey). Always an icon + words, never colour alone. */
export function VerdictPill({ verdict, size = "sm" }: { verdict: string; size?: "sm" | "md" }) {
  const v =
    verdict === "Selected"
      ? { text: "Selected", icon: BadgeCheck, cls: "border-emerald-400/25 bg-emerald-400/[0.1] text-emerald-300" }
      : verdict === "Not selected"
        ? { text: "Not selected", icon: CircleSlash, cls: "border-rose-300/20 bg-rose-300/[0.07] text-rose-200/80" }
        : { text: "Result not shared", icon: MessageCircleQuestion, cls: "border-white/10 bg-white/[0.05] text-white/50" };
  const Icon = v.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11.5px]",
        v.cls,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {v.text}
    </span>
  );
}

/** "Internship · Batch 2023" — what the experience was for, without the company. */
export function experienceKind(e: Pick<ExperienceSummary, "offerType" | "role">): string {
  const type = e.offerType === "Job" ? "Full-time" : e.offerType === "Not stated" ? null : e.offerType;
  // "SDE Intern" already says internship
  const said = (e.role ?? "").toLowerCase().includes(type === "Internship" ? "intern" : (type ?? "").toLowerCase());
  return [e.role, type && !said ? type : null].filter(Boolean).join(" · ") || "Interview";
}

/** One experience in a list: who it was for, the result, the gist, and how long the read is. */
export function ExperienceCard({ e, showCompany, onOpen }: { e: ExperienceSummary; showCompany: boolean; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="block w-full px-3.5 py-3 text-left transition-colors active:bg-white/[0.06]">
      <span className="flex items-start gap-3">
        {showCompany && <CompanyMark name={e.company} size="sm" />}
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              {showCompany && <span className="block truncate text-[13.5px] font-semibold leading-tight">{e.company}</span>}
              <span className={cn("block truncate", showCompany ? "mt-0.5 text-[11.5px] text-white/45" : "text-[13px] font-semibold text-white/85")}>
                {experienceKind(e)}
              </span>
            </span>
            <VerdictPill verdict={e.verdict} />
          </span>
          <span className="mt-1.5 line-clamp-2 block text-[12.5px] leading-snug text-white/65">{e.summary}</span>
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/40">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {e.rounds.length} {e.rounds.length === 1 ? "round" : "rounds"}
            </span>
            <span className="flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {e.readMinutes} min read
            </span>
            {e.batch && <span>Batch {e.batch}</span>}
          </span>
          {e.topics.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1">
              {e.topics.slice(0, 4).map((t) => (
                <span key={t} className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10.5px] font-medium text-white/55">
                  {t}
                </span>
              ))}
              {e.topics.length > 4 && <span className="px-0.5 py-0.5 text-[10.5px] text-white/35">+{e.topics.length - 4}</span>}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
