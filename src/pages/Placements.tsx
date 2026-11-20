import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { trackPlacements, type PlacementsFrom } from "@/lib/placementsTracking";
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
  Search as SearchIcon,
  Trophy,
  X,
} from "lucide-react";
import { SparkIcon } from "@/components/assistant/AssistantFab";
import { cn } from "@/lib/utils";
import {
  fetchPlacementCompany,
  fetchPlacements,
  formatDay,
  formatLpa,
  type PlacementCompany,
  type PlacementCompanyCard,
  type PlacementDrive,
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
  { key: "B.Tech MnC", label: "MnC" },
  { key: "M.Tech", label: "M.Tech" },
  { key: "M.Sc", label: "M.Sc" },
  { key: "M.Des", label: "M.Des" },
] as const;

const SORTS = [
  { key: "recent", label: "Recent" },
  { key: "ctc", label: "Highest CTC" },
  { key: "selected", label: "Most placed" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const card = "overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]";
const label = "px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40";

/** /placements is the season; /placements/:id is one company. */
export default function Placements() {
  const { id } = useParams();
  return id ? <CompanyView id={id} /> : <ListView />;
}

// ── Season list ──────────────────────────────────────────────────────────────

function ListView() {
  const navigate = useNavigate();
  const openedFrom = ((useLocation().state as { from?: PlacementsFrom } | null)?.from ?? "direct") as PlacementsFrom;
  const [data, setData] = useState<PlacementList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    trackPlacements("open_list", { from: openedFrom });
    fetchPlacements()
      .then(setData)
      .catch((e) => setError(e instanceof PlacementsForbiddenError ? FORBIDDEN : "Couldn't load placements. Check your connection and try again."));
    // Logged once per visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const list = data.companies.filter((c) => {
      if (filter === "placed" && c.selectedCount === 0) return false;
      if (filter !== "all" && filter !== "placed" && !c.programmes.some((p) => (filter === "M.Tech" || filter === "M.Sc" ? p.startsWith(filter) : p === filter))) return false;
      return !q || [c.name, ...c.roles, ...c.offerTypes].join(" ").toLowerCase().includes(q);
    });
    if (sort === "ctc") return [...list].sort((a, b) => (b.maxCtcLpa ?? -1) - (a.maxCtcLpa ?? -1));
    if (sort === "selected") return [...list].sort((a, b) => b.selectedCount - a.selectedCount || (b.maxCtcLpa ?? 0) - (a.maxCtcLpa ?? 0));
    return list;
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

  const openCompany = (id: string, from: PlacementsFrom) => navigate(`/placements/${id}`, { state: { from } });

  const s = data?.summary;
  const nextSort = () => {
    const next = SORTS[(SORTS.findIndex((x) => x.key === sort) + 1) % SORTS.length].key;
    setSort(next);
    trackPlacements("sort", { sort: next });
  };

  return (
    <div className="flex flex-1 flex-col gap-5 pb-8">
      <PageHeader
        title="Placements"
        subtitle={data ? `${data.season ?? ""} season${s?.resultsUpTo ? ` · results till ${formatDay(s.resultsUpTo)}` : ""}` : " "}
        onBack={() => navigate(-1)}
      />

      {error && <EmptyNote>{error}</EmptyNote>}

      {s && (
        <section className={cn(card, "relative p-4")}>
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/45">Average CTC</p>
              <p className="mt-1 text-[34px] font-bold leading-none tracking-tight tabular-nums">
                {s.averageCtcLpa != null ? `₹${s.averageCtcLpa.toFixed(1)}` : "—"}
                <span className="ml-1 text-base font-semibold text-white/50">LPA</span>
              </p>
            </div>
            {s.highestCtcLpa != null && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-right">
                <p className="flex items-center justify-end gap-1 text-[10.5px] font-medium text-amber-200/80">
                  <Trophy className="h-3 w-3" /> Highest
                </p>
                <p className="text-[17px] font-bold leading-tight tabular-nums text-amber-100">₹{formatLpa(null, s.highestCtcLpa)} LPA</p>
                {s.highestCtcCompany && <p className="text-[10.5px] text-amber-200/60">{s.highestCtcCompany}</p>}
              </div>
            )}
          </div>
          <div className="relative mt-4 grid grid-cols-3 divide-x divide-white/[0.07] rounded-xl bg-black/25 py-2.5">
            <Metric value={s.offers} label="Offers" />
            <Metric value={s.ppos} label="PPOs" />
            <Metric value={s.studentsSelected} label="Students" />
          </div>
          {s.topRecruiters.length > 0 && (
            <div className="relative mt-4">
              <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-white/40">Top recruiters</p>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
                {s.topRecruiters.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => openCompany(r.id, "top_recruiters")}
                    className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] py-1.5 pl-1.5 pr-3 active:scale-95"
                  >
                    <CompanyMark name={r.name} size="sm" />
                    <span className="text-left">
                      <span className="block text-[12px] font-semibold leading-tight">{r.name}</span>
                      <span className="block text-[10.5px] text-white/45">{r.selected} offers</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {data && (
        <>
          <div className="space-y-2.5">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company or role, e.g. SDE, quant"
                className="h-11 w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] pl-10 pr-9 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-violet-400/40"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/45">
                  <X className="h-4 w-4" />
                </button>
              )}
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
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-[12px] text-white/45">
              {rows.length} {rows.length === 1 ? "company" : "companies"}
            </p>
            <button type="button" onClick={nextSort} className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[11.5px] font-medium text-white/70 active:scale-95">
              <ArrowDownWideNarrow className="h-3.5 w-3.5" />
              {SORTS.find((x) => x.key === sort)?.label}
            </button>
          </div>

          {rows.length > 0 && <CompanyGroup title={`All companies · ${rows.length}`} companies={rows} onOpen={(id) => openCompany(id, "list")} />}
          {rows.length === 0 && <EmptyNote>No company matches that.</EmptyNote>}

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

function CompanyGroup({ title, companies, onOpen }: { title: string; companies: PlacementCompanyCard[]; onOpen: (id: string) => void }) {
  return (
    <section>
      <h2 className={cn(label, "mb-1.5")}>{title}</h2>
      <div className={cn(card, "divide-y divide-white/[0.06]")}>
        {companies.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onOpen(c.id)}
            className="flex min-h-[64px] w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors active:bg-white/[0.06]"
          >
            <CompanyMark name={c.name} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[14px] font-semibold leading-tight">{c.name}</span>
                {c.ppoCount > 0 && <span className="shrink-0 rounded-md bg-amber-400/15 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-amber-300">PPO</span>}
              </span>
              <span className="mt-0.5 block truncate text-[11.5px] text-white/45">
                {c.roles.length
                  ? c.roles.slice(0, 2).join(" · ")
                  : !c.onPortal
                    ? c.ppoCount > 0
                      ? "Pre-placement offers"
                      : "Off-campus results"
                    : c.offerTypes.join(" · ")}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[14px] font-bold tabular-nums">{c.maxCtcLpa != null ? `₹${formatLpa(null, c.maxCtcLpa)}L` : "—"}</span>
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
        ))}
      </div>
    </section>
  );
}

// ── One company ──────────────────────────────────────────────────────────────

type Tab = "roles" | "selected" | "files";

function CompanyView({ id }: { id: string }) {
  const navigate = useNavigate();
  const from = ((useLocation().state as { from?: PlacementsFrom } | null)?.from ?? "direct") as PlacementsFrom;
  const [company, setCompany] = useState<PlacementCompany | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("selected");

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
  const files = c.drives.flatMap((d) => (d.jdFiles ?? []).map((f) => ({ ...f, drive: d.title })));
  const selected = [...c.selections.filter((x) => x.kind === "PPO"), ...c.selections.filter((x) => x.kind !== "PPO")];
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "selected", label: "Selected", count: selected.length },
    { key: "roles", label: "Roles" },
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
          <CompanyMark name={c.name} size="lg" />
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
          <Metric value={c.maxCtcLpa != null ? `₹${formatLpa(c.minCtcLpa, c.maxCtcLpa)}L` : "—"} label="Package" />
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

function JdFileCard({ file: f, co }: { file: { file: string; text: string; transcribed: boolean; drive: string }; co: Co }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const long = f.text.length > 1500;
  return (
    <div className={card}>
      <button
        type="button"
        onClick={() => {
          if (!open) trackPlacements("jd_open", { companyId: co.id, company: co.name, file: f.file });
          setOpen((o) => !o);
        }}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-white/[0.06]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
          <FileText className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold">{f.file}</span>
          <span className="block truncate text-[11.5px] text-white/45">{f.transcribed ? "Transcribed from an image" : `${Math.max(1, Math.round(f.text.split(/\s+/).length / 200))} min read`}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/30 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-white/[0.05] bg-black/20 px-3.5 py-3">
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

// ── Pieces ───────────────────────────────────────────────────────────────────

function PageHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <BackButton onClick={onBack} />
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold leading-tight">{title}</h1>
        {subtitle && <p className="truncate text-xs text-white/45">{subtitle}</p>}
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className="shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.035] p-2 transition-colors active:bg-white/[0.08]"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

function Metric({ value, label: text, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className="min-w-0 px-2 text-center">
      <p className={cn("truncate text-[17px] font-bold leading-tight tabular-nums", accent && "text-emerald-400")}>{value}</p>
      <p className="mt-0.5 truncate text-[10.5px] text-white/45">{text}</p>
    </div>
  );
}

function AskAiCard({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="gemini-border is-focused w-full text-left active:scale-[0.99]">
      <div className="gemini-inner flex items-center gap-3 px-3.5 py-3">
        <span className="liquid-nav flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <SparkIcon className="h-[18px] w-[18px]" gradientId={`ask-${title.length}`} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block bg-gradient-to-r from-[#8ab4f8] via-[#c58af9] to-[#f28b82] bg-clip-text text-[13.5px] font-semibold leading-tight text-transparent">{title}</span>
          <span className="mt-0.5 block truncate text-[11.5px] text-white/45">{detail}</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-white/40" />
      </div>
    </button>
  );
}

const MARK_TINTS = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-600",
  "from-cyan-500 to-sky-600",
];

function CompanyMark({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const hash = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const initials = name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
        MARK_TINTS[hash % MARK_TINTS.length],
        size === "sm" && "h-8 w-8 rounded-lg text-[11px]",
        size === "md" && "h-10 w-10 rounded-xl text-[13px]",
        size === "lg" && "h-14 w-14 rounded-2xl text-lg",
      )}
    >
      {initials || "?"}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const text = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[12px] font-semibold text-white/75">{text || "?"}</span>;
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div className={cn(card, "px-4 py-6 text-center text-[13px] leading-relaxed text-white/50")}>{children}</div>;
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-[180px] animate-pulse rounded-2xl bg-white/[0.04]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[64px] animate-pulse rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

function titleCase(s: string): string {
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}
