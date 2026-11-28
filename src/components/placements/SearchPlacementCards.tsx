import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { PlacementsIcon } from "@/components/placements/PlacementsIcon";
import { ExperiencesIcon } from "@/components/placements/ExperiencesIcon";
import { cn } from "@/lib/utils";
import { companyLogo } from "@/lib/companyLogos";
import { fetchExperiences, fetchPlacements, type ExperienceList, type PlacementList } from "@/lib/placements";

const TILE = "relative flex min-w-0 flex-col rounded-2xl border border-white/[0.08] bg-[hsl(0_0%_6.5%)] p-3.5 text-left transition-transform active:scale-[0.98]";

/** One logo in a round, solid chip so overlapping chips never show through each other. */
function LogoChip({ id, name, z, large }: { id: string; name: string; z: number; large?: boolean }) {
  const logo = companyLogo(id);
  const [broken, setBroken] = useState(false);
  if (!logo || broken) return null;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-[hsl(0_0%_6.5%)] first:ml-0",
        large ? "-ml-2.5 h-8 w-8" : "-ml-[11px] h-7 w-7",
        logo.style === "full" && "bg-black",
        logo.style === "light" && "bg-white p-1",
        logo.style === "glass" && "bg-[hsl(0_0%_15%)] p-[5px]",
      )}
      style={{ zIndex: z }}
    >
      <img
        src={logo.src}
        alt={name}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setBroken(true)}
        className={cn("h-full w-full", logo.style === "full" ? "object-cover" : "object-contain")}
      />
    </span>
  );
}

/** Up to five company logos overlapping, then a "+N" chip in the same shape. */
export function LogoStack({ companies, extra, large }: { companies: { id: string; name: string }[]; extra: number; large?: boolean }) {
  return (
    <span className="flex items-center">
      {companies.map((c, i) => (
        <LogoChip key={c.id} id={c.id} name={c.name} z={companies.length - i + 1} large={large} />
      ))}
      {extra > 0 && (
        <span className={cn("ml-1.5 flex items-center justify-center", large ? "h-[30px]" : "h-[26px]", " rounded-full bg-white/[0.06] px-2 text-[10.5px] font-semibold text-white/55 tabular-nums")}>
          +{extra}
        </span>
      )}
    </span>
  );
}

/**
 * The search page's way into this season's placements: the company list on the left, the seniors' interview
 * experiences on the right, each with its headline number and the companies behind it.
 */
export function SearchPlacementCards() {
  const navigate = useNavigate();
  const [placements, setPlacements] = useState<PlacementList | null>(null);
  const [experiences, setExperiences] = useState<ExperienceList | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPlacements().then((p) => !cancelled && setPlacements(p)).catch(() => undefined);
    fetchExperiences().then((e) => !cancelled && setExperiences(e)).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const s = placements?.summary;
  const topPaying = (placements?.companies ?? [])
    .filter((c) => c.selectedCount > 0 && companyLogo(c.id))
    .sort((a, b) => (b.maxCtcLpa ?? 0) - (a.maxCtcLpa ?? 0))
    .slice(0, 5);
  const expCompanies = (experiences?.companies ?? []).filter((c) => companyLogo(c.id)).sort((a, b) => b.count - a.count);
  const selected = (experiences?.companies ?? []).reduce((n, c) => n + c.selected, 0);

  return (
    <section aria-label="Placements" className="space-y-2">
      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/40">Placements {placements?.season ?? "2026-27"}</h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={() => navigate("/placements", { state: { from: "search" } })} className={TILE}>
          <span className="flex items-start justify-between">
            <PlacementsIcon className="h-9 w-9" />
            <ChevronRight className="h-4 w-4 text-white/25" />
          </span>
          <span className="mt-3 text-[14px] font-semibold leading-tight">Companies</span>
          <span className="mt-1 text-[22px] font-bold leading-none tracking-tight tabular-nums">
            {s?.averageCtcLpa != null ? s.averageCtcLpa.toFixed(1) : "—"}
            <span className="ml-1 text-[11px] font-semibold tracking-normal text-white/45">LPA avg</span>
          </span>
          <span className="mt-1 text-[11.5px] leading-snug text-white/45 tabular-nums">
            {s ? `${s.studentsSelected} placed · ${placements?.companies.length ?? 0} companies` : "Roles, CTC, who got in"}
          </span>
          <span className="mt-3 min-h-8">
            {topPaying.length > 0 && <LogoStack companies={topPaying} extra={Math.max(0, (placements?.companies.length ?? 0) - topPaying.length)} />}
          </span>
        </button>

        <button type="button" onClick={() => navigate("/placements/experiences", { state: { from: "search" } })} className={TILE}>
          <span className="flex items-start justify-between">
            <ExperiencesIcon className="h-9 w-9" />
            <ChevronRight className="h-4 w-4 text-white/25" />
          </span>
          <span className="mt-3 text-[14px] font-semibold leading-tight">Interview experiences</span>
          <span className="mt-1 text-[22px] font-bold leading-none tracking-tight tabular-nums">
            {experiences?.total ?? "—"}
            <span className="ml-1 text-[11px] font-semibold tracking-normal text-white/45">from seniors</span>
          </span>
          <span className="mt-1 text-[11.5px] leading-snug text-white/45 tabular-nums">
            {experiences ? `${selected} got selected` : "Round by round"}
          </span>
          <span className="mt-3 min-h-8">
            {expCompanies.length > 0 && (
              <LogoStack companies={expCompanies.slice(0, 5)} extra={Math.max(0, (experiences?.companies.length ?? 0) - Math.min(5, expCompanies.length))} />
            )}
          </span>
        </button>
      </div>
    </section>
  );
}
