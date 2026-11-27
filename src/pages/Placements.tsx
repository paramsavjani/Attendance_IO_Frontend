import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useNavigationType, useParams } from "react-router-dom";
import { trackPlacements, type PlacementsFrom } from "@/lib/placementsTracking";
import { seenPercent, useReadTime } from "@/lib/readTime";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  BadgeIndianRupee,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  MessagesSquare,
  Search as SearchIcon,
  Trophy,
  X,
} from "lucide-react";
import { SparkIcon } from "@/components/assistant/AssistantFab";
import { MonthlyPackageCard } from "@/components/placements/MonthlyPackageCard";
import { ExperienceCard } from "@/components/placements/ExperienceCard";
import { AskAiCard, BackButton, card, CompanyMark, EmptyNote, Initials, label, ListSkeleton, Metric, PageHeader } from "@/components/placements/PlacementPieces";
import { PdfViewer } from "@/components/placements/PdfViewer";
import { cn } from "@/lib/utils";
import {
  fetchExperiences,
  fetchPlacementCompany,
  type ExperienceList,
  type ExperienceSummary,
  fetchPlacements,
  formatDay,
  formatLpa,
  jdPdfUrl,
  matchingStudents,
  type PlacementCardStudent,
  type PlacementCompany,
  type PlacementCompanyCard,
  type PlacementDrive,
  type PlacementJdFile,
  type PlacementList,
  type PlacementProfile,
  PlacementsForbiddenError,
} from "@/lib/placements";

const FORBIDDEN = "Placements are only for DAU students. Sign in with your @dau.ac.in account to see them.";

/*
 * Placements 2026-27. Same visual language as the rest of the app: dark cards on a faint white
 * wash with hairline rows (Profile's settings groups), small uppercase section labels, tinted icon
 * tiles, and the assistant's gradient ring for anything that asks the AI.
 */

const FILTERS = [
  { key: "all", label: "All" },
  { key: "placed", label: "With results" },
  { key: "B.Tech", label: "B.Tech" },
] as const;

const SORTS = [
  { key: "recent", label: "Recent" },
  { key: "ctc", label: "Highest CTC" },
  { key: "selected", label: "Most placed" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];


/** /placements is the season; /placements/:id is one company. */
export default function Placements() {
  const { id } = useParams();
  return id ? <CompanyView id={id} /> : <ListView />;
}

// ── Season list ──────────────────────────────────────────────────────────────

/**
 * What the list looked like when a company was opened, so pressing back lands on the same spot
 * with the same search, filter and sort instead of the top. Lives for the app session only.
 */
const listMemory: { data: PlacementList | null; query: string; filter: string; sort: SortKey; scrollTop: number } = {
  data: null,
  query: "",
  filter: "all",
  sort: "recent",
  scrollTop: 0,
};

/** The page scrolls inside the layout's container, not the window. */
function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if (o === "auto" || o === "scroll") return p;
  }
  return null;
}

function ListView() {
  const navigate = useNavigate();
  // Back from a company (POP) restores the list as it was; any other way in starts fresh.
  const returning = useNavigationType() === "POP" && listMemory.data != null;
  const openedFrom = ((useLocation().state as { from?: PlacementsFrom } | null)?.from ?? "direct") as PlacementsFrom;
  const [data, setData] = useState<PlacementList | null>(listMemory.data);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(returning ? listMemory.query : "");
  const [filter, setFilter] = useState<string>(returning ? listMemory.filter : "all");
  const [sort, setSort] = useState<SortKey>(returning ? listMemory.sort : "recent");
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!returning || !listMemory.scrollTop) return;
    const el = scrollParent(rootRef.current);
    if (el) el.scrollTop = listMemory.scrollTop;
    // Only on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackPlacements("open_list", { from: openedFrom });
    fetchPlacements()
      .then((d) => {
        listMemory.data = d;
        setData(d);
      })
      .catch((e) => setError(e instanceof PlacementsForbiddenError ? FORBIDDEN : "Couldn't load placements. Check your connection and try again."));
    // Logged once per visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const byName = (c: PlacementCompanyCard) => [c.name, ...c.roles, ...c.offerTypes].join(" ").toLowerCase().includes(q);
    const list = data.companies.filter((c) => {
      if (filter === "placed" && c.selectedCount === 0) return false;
      if (filter !== "all" && filter !== "placed" && !c.programmes.includes(filter)) return false;
      return !q || byName(c) || matchingStudents(c.students, q).length > 0;
    });
    // By the top of the range, then its bottom: "7–30" sorts with the 30s, ahead of a flat 25
    if (sort === "ctc") list.sort((a, b) => (b.maxCtcLpa ?? -1) - (a.maxCtcLpa ?? -1) || (b.minCtcLpa ?? -1) - (a.minCtcLpa ?? -1));
    if (sort === "selected") list.sort((a, b) => b.selectedCount - a.selectedCount || (b.minCtcLpa ?? 0) - (a.minCtcLpa ?? 0));
    // Companies that match by themselves come before the ones found through a student they selected
    return q ? list.sort((a, b) => Number(byName(b)) - Number(byName(a))) : list;
  }, [data, query, filter, sort]);

  // Log what students search for, once they stop typing
  const loggedQuery = useRef("");
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || q.toLowerCase() === loggedQuery.current || !data) return;
    const t = setTimeout(() => {
      loggedQuery.current = q.toLowerCase();
      trackPlacements("search", { query: q, results: rows.length });
    }, 1200);
    return () => clearTimeout(t);
  }, [query, rows.length, data]);

  const openCompany = (id: string, from: PlacementsFrom) => {
    Object.assign(listMemory, { query, filter, sort, scrollTop: scrollParent(rootRef.current)?.scrollTop ?? 0 });
    navigate(`/placements/${id}`, { state: { from } });
  };

  const s = data?.summary;
  const nextSort = () => {
    const next = SORTS[(SORTS.findIndex((x) => x.key === sort) + 1) % SORTS.length].key;
    setSort(next);
    trackPlacements("sort", { sort: next });
  };

  return (
    <div ref={rootRef} className="flex flex-1 flex-col gap-3.5 pb-8">
      <PageHeader
        title="Placements"
        subtitle={data ? `${data.season ?? ""} season${s?.resultsUpTo ? ` · results till ${formatDay(s.resultsUpTo)}` : ""}` : " "}
        onBack={() => navigate(-1)}
      />

      {error && <EmptyNote>{error}</EmptyNote>}

      {s && (
        <section className={cn(card, "px-4 py-3")}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-white/50">Average CTC</p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-violet-400/20 bg-violet-400/[0.1] px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">
                  <GraduationCap className="h-3 w-3" /> UG (B.Tech) only
                </span>
              </div>
              <p className="mt-1 text-[28px] font-bold leading-none tracking-tight tabular-nums">
                {s.averageCtcLpa != null ? `₹${s.averageCtcLpa.toFixed(1)}` : "—"}
                <span className="ml-1 text-sm font-semibold text-white/50">LPA</span>
              </p>
            </div>
            {s.highestCtcLpa != null && (
              <div className="shrink-0 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-1.5 text-right">
                <p className="flex items-center justify-end gap-1 text-[10px] font-medium text-amber-200/80">
                  <Trophy className="h-3 w-3" /> Highest
                </p>
                <p className="text-[15px] font-bold leading-tight tabular-nums text-amber-100">₹{formatLpa(null, s.highestCtcLpa)} LPA</p>
                {s.highestCtcCompany && <p className="text-[10px] leading-tight text-amber-200/60">{s.highestCtcCompany}</p>}
              </div>
            )}
          </div>
          {s.placedPercent != null && s.batchStudents != null && (
            <div className="mt-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[12px] font-semibold text-white/85">
                  <span className="text-[14px] font-bold tabular-nums text-emerald-300">{s.placedPercent.toFixed(1)}%</span> of B.Tech {s.batchYear} placed
                </p>
                <p className="text-[11px] tabular-nums text-white/45">
                  {s.batchPlaced} of {s.batchStudents} students
                </p>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" style={{ width: `${Math.min(100, s.placedPercent)}%` }} />
              </div>
            </div>
          )}
          <div className="mt-2.5 grid grid-cols-3 divide-x divide-white/[0.07] rounded-lg bg-black/25 py-1.5">
            {[
              [s.studentsSelected, "Students"],
              [s.ppos, "PPOs"],
              [s.companiesWithSelections, "Companies"],
            ].map(([value, text]) => (
              <p key={text} className="truncate px-1 text-center text-[11px] text-white/50">
                <span className="mr-1 text-[14px] font-bold tabular-nums text-white">{value}</span>
                {text}
              </p>
            ))}
          </div>
        </section>
      )}

      {s?.placedByMonth && <MonthlyPackageCard months={s.placedByMonth} average={s.averagePlacedByMonthCtcLpa} className={card} />}

      {data && <ExperiencesEntry onOpen={() => {
        Object.assign(listMemory, { query, filter, sort, scrollTop: scrollParent(rootRef.current)?.scrollTop ?? 0 });
        navigate("/placements/experiences", { state: { from: "list" } });
      }} />}

      {data && (
        <>
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Company, role or student"
                  className="h-11 w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] pl-10 pr-9 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-violet-400/40"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="Clear" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/45">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button type="button" onClick={nextSort} aria-label={`Sort: ${SORTS.find((x) => x.key === sort)?.label}`} className="flex h-11 shrink-0 items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 text-[12px] font-medium text-white/70 active:scale-95">
                <ArrowDownWideNarrow className="h-4 w-4" />
                {SORTS.find((x) => x.key === sort)?.label}
              </button>
            </div>
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setFilter(f.key);
                    trackPlacements("filter", { filter: f.key });
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                    filter === f.key ? "bg-white text-black" : "border border-white/[0.08] bg-white/[0.035] text-white/60",
                  )}
                >
                  {f.label}
                  {filter === f.key && <span className="ml-1.5 tabular-nums opacity-50">{rows.length}</span>}
                </button>
              ))}
            </div>
          </div>

          {rows.length > 0 && <CompanyGroup companies={rows} query={query} onOpen={(id) => openCompany(id, "list")} />}
          {rows.length === 0 && <EmptyNote>No company or placed student matches that.</EmptyNote>}

          <AskAiCard
            title="Ask about placements"
            detail={'"Who got placed at Tekion?" · "Quant roles above 20 LPA"'}
            onClick={() => {
              trackPlacements("ask_ai", {});
              navigate(`/assistant?q=${encodeURIComponent("How is placement going this year? Average, highest and PPOs")}`);
            }}
          />

          {s && <p className="px-1 text-[11px] leading-relaxed text-white/35">{s.coverage}</p>}
        </>
      )}

      {!data && !error && <ListSkeleton />}
    </div>
  );
}

function CompanyGroup({ companies, query, onOpen }: { companies: PlacementCompanyCard[]; query: string; onOpen: (id: string) => void }) {
  return (
    <section>
      <div className={cn(card, "divide-y divide-white/[0.06]")}>
        {companies.map((c) => {
          const found = matchingStudents(c.students, query);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpen(c.id)}
              className="flex min-h-[64px] w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors active:bg-white/[0.06]"
            >
              <CompanyMark name={c.name} id={c.id} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[14px] font-semibold leading-tight">{c.name}</span>
                  {c.ppoCount > 0 && <span className="shrink-0 rounded-md bg-amber-400/15 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-amber-300">PPO</span>}
                  {(c.experienceCount ?? 0) > 0 && (
                    <span aria-label={`${c.experienceCount} interview experiences`} className="flex shrink-0 items-center gap-0.5 rounded-md bg-violet-400/15 px-1.5 py-px text-[9.5px] font-bold tabular-nums text-violet-200">
                      <MessagesSquare className="h-2.5 w-2.5" />
                      {c.experienceCount}
                    </span>
                  )}
                </span>
                {found.length > 0 ? (
                  <StudentMatches students={found} />
                ) : (
                  <span className="mt-0.5 block truncate text-[11.5px] text-white/45">
                    {c.roles.length
                      ? c.roles.slice(0, 2).join(" · ")
                      : !c.onPortal
                        ? c.ppoCount > 0
                          ? "Pre-placement offers"
                          : "Off-campus results"
                        : c.offerTypes.join(" · ")}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[14px] font-bold tabular-nums">{c.minCtcLpa != null ? `₹${formatLpa(c.minCtcLpa, c.maxCtcLpa).replace(" – ", "–")}L` : "—"}</span>
                {c.selectedCount > 0 ? (
                  <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {c.selectedCount} placed
                  </span>
                ) : c.resultDeclared ? (
                  <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-medium text-white/45">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/30" />0 placed
                  </span>
                ) : (
                  <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-medium text-amber-300/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    Result awaited
                  </span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Who the search found in this company: the first name, then their roll number and how many more. */
function StudentMatches({ students }: { students: PlacementCardStudent[] }) {
  const [first] = students;
  return (
    <span className="mt-0.5 block text-[11.5px]">
      <span className="flex items-center gap-1 font-medium text-violet-300">
        <GraduationCap className="h-3 w-3 shrink-0" />
        <span className="truncate">{first.name ?? first.id}</span>
      </span>
      <span className="block truncate text-white/45">
        {[first.name && first.id, students.length > 1 && `+${students.length - 1} more`].filter(Boolean).join(" · ")}
      </span>
    </span>
  );
}

/** The way into the seniors' interview experiences, between the season numbers and the company list. */
function ExperiencesEntry({ onOpen }: { onOpen: () => void }) {
  const [list, setList] = useState<ExperienceList | null>(null);
  useEffect(() => {
    fetchExperiences().then(setList).catch(() => setList(null));
  }, []);
  if (!list || list.total === 0) return null;
  const names = list.companies.slice(0, 3).map((c) => c.name);
  return (
    <button type="button" onClick={onOpen} className={cn(card, "relative flex items-center gap-3 px-3.5 py-3 text-left active:bg-white/[0.06]")}>
      <div className="pointer-events-none absolute -left-10 -top-12 h-28 w-28 rounded-full bg-violet-500/15 blur-2xl" />
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-sky-500/20 text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
        <MessagesSquare className="h-5 w-5" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-[14px] font-semibold leading-tight">Interview experiences</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-white/50">
          {list.total} from seniors · {names.join(", ")}
          {list.companies.length > 3 ? ` +${list.companies.length - 3}` : ""}
        </span>
      </span>
      <ChevronRight className="relative h-4 w-4 shrink-0 text-white/30" />
    </button>
  );
}

// ── One company ──────────────────────────────────────────────────────────────

type Tab = "roles" | "selected" | "interviews" | "files";

function CompanyView({ id }: { id: string }) {
  const navigate = useNavigate();
  const from = ((useLocation().state as { from?: PlacementsFrom } | null)?.from ?? "direct") as PlacementsFrom;
  const [company, setCompany] = useState<PlacementCompany | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("selected");
  const [experiences, setExperiences] = useState<ExperienceSummary[]>([]);

  useEffect(() => {
    fetchExperiences()
      .then((l) => setExperiences(l.experiences.filter((e) => e.companyId === id)))
      .catch(() => setExperiences([]));
  }, [id]);

  useEffect(() => {
    setCompany(undefined);
    setTab("selected");
    fetchPlacementCompany(id)
      .then((c) => {
        setCompany(c);
        if (c) trackPlacements("view_company", { companyId: c.id, company: c.name, from });
        // Selected first; a company whose result isn't out yet opens on its roles instead of an empty list
        if (c && c.selections.length === 0 && !c.resultOn) setTab("roles");
      })
      .catch((e) => setError(e instanceof PlacementsForbiddenError ? FORBIDDEN : "Couldn't load this company. Check your connection."));
    // `from` is read once per company; it doesn't change while the page is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate("/placements", { replace: true }));

  if (error || company === null) {
    return (
      <div className="flex flex-1 flex-col gap-5">
        <PageHeader title="Placements" onBack={back} />
        <EmptyNote>{error ?? "This company isn't in this season's list."}</EmptyNote>
      </div>
    );
  }
  if (!company) {
    return (
      <div className="flex flex-1 flex-col gap-5">
        <PageHeader title={" "} onBack={back} />
        <ListSkeleton />
      </div>
    );
  }

  const c = company;
  const files = c.drives.flatMap((d) => (d.jdFiles ?? []).map((f) => ({ ...f, drive: d.title, eventId: d.eventId })));
  const selected = [...c.selections.filter((x) => x.kind === "PPO"), ...c.selections.filter((x) => x.kind !== "PPO")];
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "selected", label: "Selected", count: selected.length },
    { key: "roles", label: "Roles" },
    ...(experiences.length ? [{ key: "interviews" as Tab, label: "Interviews", count: experiences.length }] : []),
    ...(files.length ? [{ key: "files" as Tab, label: "JD files", count: files.length }] : []),
  ];

  return (
    <div className="flex flex-1 flex-col gap-5 pb-8">
      <div className="flex items-center gap-3">
        <BackButton onClick={back} />
        <p className="min-w-0 flex-1 truncate text-[13px] text-white/45">Placements</p>
      </div>

      <section className={cn(card, "relative p-4")}>
        <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative flex items-center gap-3.5">
          <CompanyMark name={c.name} id={c.id} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">{c.name}</h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {c.offerTypes.map((t) => (
                <span key={t} className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", t === "PPO" ? "bg-amber-400/15 text-amber-300" : "bg-white/[0.07] text-white/70")}>
                  {t}
                </span>
              ))}
              {c.locations[0] && (
                <span className="flex items-center gap-1 rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10.5px] font-medium text-white/60">
                  <MapPin className="h-3 w-3" />
                  {titleCase(c.locations[0])}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 divide-x divide-white/[0.07] rounded-xl bg-black/25 py-2.5">
          <Metric value={c.maxCtcLpa != null ? `₹${formatLpa(c.minCtcLpa, c.maxCtcLpa).replace(" – ", "–")}L` : "—"} label="Package" />
          <Metric value={c.minCpi != null ? String(c.minCpi) : "—"} label="CPI cut-off" />
          <Metric value={c.selectedCount} label="Placed" accent={c.selectedCount > 0} />
        </div>
        {c.programmes.length > 0 && (
          <div className="relative mt-3.5 flex items-start gap-2">
            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
            <p className="text-[12px] leading-relaxed text-white/60">{c.programmes.join(" · ")}</p>
          </div>
        )}
      </section>

      <div className="flex gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              trackPlacements("tab", { companyId: c.id, company: c.name, tab: t.key });
            }}
            className={cn(
              "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-[13px] font-semibold transition-colors",
              tab === t.key ? "bg-white/[0.1] text-white" : "text-white/45",
            )}
          >
            {t.label}
            {t.count != null && t.count > 0 && <span className={cn("rounded-full px-1.5 text-[10.5px] tabular-nums", tab === t.key ? "bg-white/15" : "bg-white/[0.06]")}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === "roles" && (
        <div className="space-y-5">
          {c.drives.map((d) => (
            <DriveSection key={d.eventId} drive={d} titled={c.drives.length > 1} co={{ id: c.id, name: c.name }} />
          ))}
          {!c.onPortal && (
            <EmptyNote>
              {c.name} didn't run a drive on the placement portal this season. These are PPOs from summer internships or an off-campus process, so only the results are known.
            </EmptyNote>
          )}
          {c.ctcNotes.length > 0 && (
            <section>
              <h2 className={cn(label, "mb-1.5 flex items-center gap-1.5")}>
                <Mail className="h-3 w-3" /> From placement cell mails
              </h2>
              <div className={cn(card, "divide-y divide-white/[0.06]")}>
                {c.ctcNotes.map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-3.5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold">{n.role}</p>
                      {n.notes && <p className="mt-0.5 text-[11.5px] leading-snug text-white/45">{n.notes.replace(/;?\s*Registration mail from placement cell/i, "")}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13.5px] font-bold tabular-nums">{/\d/.test(n.ctc ?? "") ? `₹${n.ctc} LPA` : "Not stated"}</p>
                      {n.stipend && <p className="text-[11px] tabular-nums text-white/45">₹{n.stipend}/mo</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {tab === "selected" &&
        (selected.length === 0 ? (
          c.resultOn ? (
            <EmptyNote>
              <span className="mb-1 block text-[22px] font-bold tabular-nums text-foreground">0 selected</span>
              {c.resultNote ?? "The placement cell announced the result; no B.Tech student was selected."} Announced {formatDay(c.resultOn)}.
            </EmptyNote>
          ) : (
            <EmptyNote>No results announced for {c.name} yet. They'll show here once the placement cell shares them.</EmptyNote>
          )
        ) : (
          <section>
            <h2 className={cn(label, "mb-1.5")}>
              {c.ppoCount > 0 ? `${c.ppoCount} PPO${c.ppoCount === 1 ? "" : "s"}${selected.length > c.ppoCount ? ` · ${selected.length - c.ppoCount} on campus` : ""}` : `${selected.length} selected on campus`}
            </h2>
            <div className={cn(card, "divide-y divide-white/[0.06]")}>
              {selected.map((x, i) => (
                <div key={`${x.studentId}-${i}`} className="flex items-center gap-3 px-3.5 py-2.5">
                  <Initials name={x.name ?? "?"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[13.5px] font-semibold">{titleCase(x.name ?? "")}</p>
                      {x.kind === "PPO" && <span className="shrink-0 rounded bg-amber-400/15 px-1 text-[9.5px] font-bold uppercase text-amber-300">PPO</span>}
                    </div>
                    <p className="truncate text-[11.5px] text-white/45">{[x.studentId, x.role].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13.5px] font-bold tabular-nums">{x.ctc && /\d/.test(x.ctc) ? `₹${x.ctc}L` : x.stipend ? `₹${x.stipend}/mo` : "—"}</p>
                    {x.announcedOn && <p className="text-[10.5px] text-white/35">{formatDay(x.announcedOn)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

      {tab === "interviews" && (
        <section>
          <h2 className={cn(label, "mb-1.5")}>
            {experiences.length} {experiences.length === 1 ? "senior" : "seniors"} shared their interview
            {experiences.some((e) => e.verdict === "Selected") ? ` · ${experiences.filter((e) => e.verdict === "Selected").length} selected` : ""}
          </h2>
          <div className={cn(card, "divide-y divide-white/[0.06]")}>
            {experiences.map((e) => (
              <ExperienceCard key={e.id} e={e} showCompany={false} onOpen={() => navigate(`/placements/experiences/${e.id}`)} />
            ))}
          </div>
          <p className="mt-2 px-1 text-[11px] leading-relaxed text-white/35">Anonymous: names and roll numbers removed. From the {experiences[0]?.season ?? "2025-26"} season.</p>
        </section>
      )}

      {tab === "files" && (
        <section className="space-y-2">
          {files.map((f, i) => (
            <JdFileCard key={i} file={f} co={{ id: c.id, name: c.name }} />
          ))}
        </section>
      )}

      <AskAiCard
        title={`Ask the AI about ${c.name}`}
        detail="Roles, CTC breakdown, rounds and who got selected"
        onClick={() => {
          trackPlacements("ask_ai", { companyId: c.id, company: c.name });
          navigate(`/assistant?q=${encodeURIComponent(`Tell me about ${c.name} placements this season: roles, CTC, stipend, CPI cut-off and who got selected`)}`);
        }}
      />

      <p className="px-1 text-[11px] leading-relaxed text-white/35">
        Packages are what the company advertised on the placement portal or in the cell's mails, not anyone's offer letter. PPO packages are as reported by students.
      </p>
    </div>
  );
}

type Co = { id: string; name: string };

function DriveSection({ drive: d, titled, co }: { drive: PlacementDrive; titled: boolean; co: Co }) {
  const when = d.driveDate ? `Drive ${formatDay(d.driveDate)}` : d.registrationStart ? `Registration ${formatDay(d.registrationStart)}` : null;
  const meta = [d.offerType, when, d.location ? titleCase(d.location) : null, d.ugCpi != null ? `CPI ≥ ${d.ugCpi}` : null].filter(Boolean);
  return (
    <section>
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
        <h2 className={cn(label, "truncate px-0")}>{titled ? d.title : "Roles"}</h2>
        {d.source && (
          <a href={d.source} target="_blank" rel="noreferrer" onClick={() => trackPlacements("portal_link", { companyId: co.id, company: co.name })} className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-violet-300/80">
            Portal <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className={cn(card, "divide-y divide-white/[0.06]")}>
        {meta.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5 text-[11.5px] text-white/50">
            {meta.map((m, i) => (
              <span key={i} className="flex items-center gap-1">
                {i === 0 && <Briefcase className="h-3 w-3" />}
                {String(m).startsWith("Drive") || String(m).startsWith("Registration") ? <CalendarDays className="h-3 w-3" /> : null}
                {m}
              </span>
            ))}
          </div>
        )}
        {d.profiles.map((p, i) => (
          <RoleRow key={i} profile={p} co={co} />
        ))}
        {titled && d.openForLabels.length > 0 && <p className="px-3.5 py-2.5 text-[11.5px] text-white/45">Open for {d.openForLabels.join(", ")}</p>}
        {d.bond && <p className="px-3.5 py-2.5 text-[12px] text-amber-300/90">Bond: {d.bond}</p>}
      </div>
    </section>
  );
}

function RoleRow({ profile: p, co }: { profile: PlacementProfile; co: Co }) {
  const [open, setOpen] = useState(false);
  const ug = p.ugCtcMax != null ? formatLpa(p.ugCtcMin, p.ugCtcMax) : null;
  const pg = p.pgCtcMax != null ? formatLpa(p.pgCtcMin, p.pgCtcMax) : null;
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (!p.description) return;
          if (!open) trackPlacements("role_open", { companyId: co.id, company: co.name, role: p.name });
          setOpen((o) => !o);
        }}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors active:bg-white/[0.06]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
          <BadgeIndianRupee className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-semibold leading-snug">{p.name ?? "Role"}</span>
          <span className="mt-0.5 block text-[11.5px] text-white/45">
            {[pg && pg !== ug ? `PG ₹${pg} LPA` : null, p.stipend ? `Stipend ₹${p.stipend}/mo` : null].filter(Boolean).join(" · ") || (ug ? "UG package" : "Package not stated")}
          </span>
        </span>
        {ug && <span className="shrink-0 rounded-lg bg-white/[0.07] px-2 py-1 text-[12.5px] font-bold tabular-nums">₹{ug}L</span>}
        {p.description && <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/30 transition-transform", open && "rotate-180")} />}
      </button>
      {open && p.description && (
        <p className="whitespace-pre-line break-words border-t border-white/[0.05] bg-black/20 px-3.5 py-3 text-[12px] leading-relaxed text-white/60">{p.description}</p>
      )}
    </div>
  );
}

function JdFileCard({ file: f, co }: { file: PlacementJdFile & { drive: string; eventId: number }; co: Co }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  // Reading time on the PDF or the expanded text, sent when it closes or the app goes to the background
  useReadTime(pdfOpen ? `pdf:${f.file}` : open ? `text:${f.file}` : null, () => (pdfOpen ? 0 : seenPercent(textRef.current)), (seconds, scrollPct, final) =>
    trackPlacements("jd_read", { companyId: co.id, company: co.name, file: f.file, mode: pdfOpen ? "pdf" : "text", seconds, scrollPct: pdfOpen ? undefined : scrollPct, final }),
  );
  const long = f.text.length > 1500;
  const hasText = f.text.trim().length > 0;
  const canPdf = Boolean(f.pdf && f.original);
  const openPdf = () => {
    trackPlacements("jd_pdf", { companyId: co.id, company: co.name, file: f.file });
    setPdfOpen(true);
  };
  return (
    <div className={card}>
      <div className="flex items-center gap-2 pr-3">
        <button
          type="button"
          onClick={() => {
            if (!hasText) return openPdf();
            if (!open) trackPlacements("jd_open", { companyId: co.id, company: co.name, file: f.file });
            setOpen((o) => !o);
          }}
          className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3.5 text-left active:bg-white/[0.06]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
            <FileText className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold">{f.file}</span>
            <span className="block truncate text-[11.5px] text-white/45">
              {!hasText ? "PDF" : f.transcribed ? "Transcribed from an image" : `${Math.max(1, Math.round(f.text.split(/\s+/).length / 200))} min read`}
            </span>
          </span>
          {hasText && <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/30 transition-transform", open && "rotate-180")} />}
        </button>
        {canPdf && (
          <button
            type="button"
            onClick={openPdf}
            className="shrink-0 rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-[11.5px] font-semibold text-sky-200 active:scale-95"
          >
            View PDF
          </button>
        )}
      </div>
      {canPdf && <PdfViewer open={pdfOpen} onOpenChange={setPdfOpen} url={jdPdfUrl(f.eventId, f.original!)} title={f.file} subtitle={co.name} />}
      {open && hasText && (
        <div ref={textRef} className="border-t border-white/[0.05] bg-black/20 px-3.5 py-3">
          <p className="whitespace-pre-line break-words text-[12px] leading-relaxed text-white/65">{long && !full ? `${f.text.slice(0, 1500)}…` : f.text}</p>
          {long && (
            <button type="button" onClick={() => setFull((v) => !v)} className="mt-2.5 text-[12px] font-semibold text-violet-300">
              {full ? "Show less" : "Read the whole file"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function titleCase(s: string): string {
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}
