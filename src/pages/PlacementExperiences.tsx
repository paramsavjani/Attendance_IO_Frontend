import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, Building2, ChevronRight, Lightbulb, Search as SearchIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackPlacements } from "@/lib/placementsTracking";
import { seenPercent, useReadTime } from "@/lib/readTime";
import { fetchExperience, fetchExperiences, PlacementsForbiddenError, type Experience, type ExperienceList, type ExperienceSummary } from "@/lib/placements";
import { AskAiCard, BackButton, card, CompanyMark, EmptyNote, label, ListSkeleton, Metric, PageHeader } from "@/components/placements/PlacementPieces";
import { ExperienceCard, experienceKind, VerdictPill } from "@/components/placements/ExperienceCard";

const FORBIDDEN = "Interview experiences are only for DAU students. Sign in with your @dau.ac.in account to read them.";

/*
 * Interview experiences written by seniors, rewritten as anonymous Markdown. /placements/experiences lists them
 * (filter by company, search by company or topic); /placements/experiences/:expId reads one.
 */
export default function PlacementExperiences() {
  const { expId } = useParams();
  return expId ? <ExperienceReader id={expId} /> : <ExperienceHub />;
}

// ── Browse ───────────────────────────────────────────────────────────────────

/** Search, company filter and scroll position, kept while a reader is open so back lands in the same place. */
const hubMemory = { query: "", company: "all", scrollTop: 0 };

function scrollParent(el: HTMLElement | null): HTMLElement | null {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if (o === "auto" || o === "scroll") return p;
  }
  return null;
}

function matches(e: ExperienceSummary, q: string): boolean {
  if (!q) return true;
  const hay = [e.company, e.role ?? "", e.offerType, e.summary, ...e.topics, ...e.rounds].join(" ").toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
}

function ExperienceHub() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "direct";
  const preset = params.get("company");
  const [data, setData] = useState<ExperienceList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(preset ? "" : hubMemory.query);
  const [company, setCompany] = useState(preset ?? hubMemory.company);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackPlacements("experiences_open", { from, company: preset ?? undefined });
    fetchExperiences()
      .then((d) => {
        setData(d);
        // Back from a reader: restore the scroll once the list has rendered
        requestAnimationFrame(() => {
          const el = scrollParent(rootRef.current);
          if (el && hubMemory.scrollTop) el.scrollTop = hubMemory.scrollTop;
          hubMemory.scrollTop = 0;
        });
      })
      .catch((e) => setError(e instanceof PlacementsForbiddenError ? FORBIDDEN : "Couldn't load the experiences. Check your connection and try again."));
    // Logged once per visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.trim().toLowerCase();
  const rows = useMemo(
    () => (data?.experiences ?? []).filter((e) => (company === "all" || e.companyId === company) && matches(e, q)),
    [data, company, q],
  );
  // Grouped by company in the list's order (most shared first)
  const groups = useMemo(() => {
    if (!data) return [];
    return data.companies
      .map((c) => ({ ...c, rows: rows.filter((e) => e.companyId === c.id) }))
      .filter((g) => g.rows.length > 0);
  }, [data, rows]);
  // The most common topics, as one-tap searches
  const topics = useMemo(() => {
    const n = new Map<string, number>();
    for (const e of data?.experiences ?? []) for (const t of e.topics) n.set(t, (n.get(t) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
  }, [data]);

  const loggedQuery = useRef("");
  useEffect(() => {
    if (q.length < 2 || q === loggedQuery.current || !data) return;
    const t = setTimeout(() => {
      loggedQuery.current = q;
      trackPlacements("experiences_search", { query: q, results: rows.length });
    }, 1200);
    return () => clearTimeout(t);
  }, [q, rows.length, data]);

  const open = (id: string) => {
    Object.assign(hubMemory, { query, company, scrollTop: scrollParent(rootRef.current)?.scrollTop ?? 0 });
    navigate(`/placements/experiences/${id}`);
  };
  const selectedCount = data?.experiences.filter((e) => e.verdict === "Selected").length ?? 0;

  return (
    <div ref={rootRef} className="flex flex-1 flex-col gap-3.5 pb-8">
      <PageHeader title="Interview experiences" subtitle="Shared by seniors · names removed" onBack={() => (window.history.length > 1 ? navigate(-1) : navigate("/placements", { replace: true }))} />

      {error && <EmptyNote>{error}</EmptyNote>}

      {data && (
        <>
          <section className={cn(card, "relative px-4 py-3.5")}>
            <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="relative flex items-end justify-between gap-3">
              <div>
                <p className="text-[32px] font-bold leading-none tracking-tight tabular-nums">{data.total}</p>
                <p className="mt-1 text-[12.5px] font-medium text-white/60">experiences from {data.companies.length} companies</p>
              </div>
              <div className="flex -space-x-2 pb-0.5">
                {data.companies.slice(0, 5).map((c) => (
                  <span key={c.id} className="rounded-lg ring-2 ring-[#0b0b0f]">
                    <CompanyMark name={c.name} id={c.id} size="sm" />
                  </span>
                ))}
              </div>
            </div>
            <div className="relative mt-3 grid grid-cols-2 divide-x divide-white/[0.07] rounded-lg bg-black/25 py-1.5">
              <p className="px-1 text-center text-[11px] text-white/50">
                <span className="mr-1 text-[14px] font-bold tabular-nums text-emerald-300">{selectedCount}</span>
                from selected students
              </p>
              <p className="px-1 text-center text-[11px] text-white/50">
                <span className="mr-1 text-[14px] font-bold tabular-nums text-white">{data.experiences.reduce((n, e) => n + e.rounds.length, 0)}</span>
                rounds covered
              </p>
            </div>
          </section>

          <div className="space-y-2.5">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Company or topic: DP, SQL, puzzles…"
                className="h-11 w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] pl-10 pr-9 text-[14px] text-white outline-none placeholder:text-white/35 focus:border-violet-400/40"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Clear" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/45">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
              {[{ id: "all", name: "All", count: data.total }, ...data.companies].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCompany(c.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors",
                    company === c.id ? "bg-white text-black" : "border border-white/[0.08] bg-white/[0.035] text-white/60",
                  )}
                >
                  {c.name}
                  <span className="ml-1.5 tabular-nums opacity-50">{c.count}</span>
                </button>
              ))}
            </div>
            {!q && (
              <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
                {topics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQuery(t)}
                    className="shrink-0 rounded-lg border border-violet-400/15 bg-violet-400/[0.06] px-2 py-1 text-[11px] font-medium text-violet-200/80 active:scale-95"
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {groups.map((g) => (
            <PrepCard key={g.id} id={g.id} name={g.name} inPlacements={g.inPlacements} rows={g.rows} onOpen={open} onCompany={() => navigate(`/placements/${g.id}`, { state: { from: "list" } })} />
          ))}
          {rows.length === 0 && <EmptyNote>No experience mentions that yet. Try a company name or a broader topic.</EmptyNote>}

          <AskAiCard
            title="Ask the AI to prep you"
            detail={'"What does Google ask interns?" · "Which companies ask SQL?"'}
            onClick={() => {
              trackPlacements("ask_ai", { from: "experiences" });
              navigate(`/assistant?q=${encodeURIComponent("Which topics come up most in the seniors' interview experiences, company by company?")}`);
            }}
          />
        </>
      )}

      {!data && !error && <ListSkeleton />}
    </div>
  );
}

/** One "prep card" per company — what its process looks like and what it asks most, then the experiences. */
function PrepCard({ name, id, inPlacements, rows, onOpen, onCompany }: { name: string; id: string; inPlacements: boolean; rows: ExperienceSummary[]; onOpen: (id: string) => void; onCompany: () => void }) {
  const [all, setAll] = useState(false);
  const n = new Map<string, number>();
  for (const e of rows) for (const t of e.topics) n.set(t, (n.get(t) ?? 0) + 1);
  const top = [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const rounds = rows.map((e) => e.rounds.length);
  const lo = Math.min(...rounds), hi = Math.max(...rounds);
  const selected = rows.filter((e) => e.verdict === "Selected").length;
  const shown = all ? rows : rows.slice(0, 3);
  return (
    <section className={cn(card, "relative")}>
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl" />
      <div className="relative flex items-center gap-3 px-3.5 pt-3.5">
        <CompanyMark name={name} id={id} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight">{name}</p>
          <p className="mt-0.5 text-[11.5px] text-white/50">
            {rows.length} {rows.length === 1 ? "experience" : "experiences"}
            {selected > 0 && <span className="text-emerald-300"> · {selected} selected</span>} · {lo === hi ? lo : `${lo}–${hi}`} rounds
          </p>
        </div>
        {inPlacements && (
          <button type="button" onClick={onCompany} aria-label={`${name} company page`} className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-white/50">
            <Building2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {top.length > 0 && (
        <div className="relative mx-3.5 mt-3 rounded-xl bg-black/25 px-3 py-2.5">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">Asked most</p>
          <div className="space-y-1.5">
            {top.map(([t, c]) => (
              <div key={t} className="flex items-center gap-2">
                <span className="w-[38%] shrink-0 truncate text-[11.5px] text-white/75">{t}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                  <span className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400" style={{ width: `${(c / rows.length) * 100}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right text-[10.5px] tabular-nums text-white/45">{c}/{rows.length}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="relative mt-2 divide-y divide-white/[0.06] border-t border-white/[0.06]">
        {shown.map((e) => (
          <button key={e.id} type="button" onClick={() => onOpen(e.id)} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left active:bg-white/[0.06]">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", e.verdict === "Selected" ? "bg-emerald-400" : e.verdict === "Not selected" ? "bg-rose-300/70" : "bg-white/25")} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium text-white/85">{e.summary}</span>
              <span className="block truncate text-[10.5px] text-white/40">
                {e.verdict === "Selected" ? "Selected" : e.verdict === "Not selected" ? "Not selected" : "Result not shared"} · {e.rounds.length} rounds · {e.readMinutes} min
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
          </button>
        ))}
      </div>
      {rows.length > 3 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="relative w-full border-t border-white/[0.06] py-2.5 text-[12px] font-semibold text-violet-300">
          {all ? "Show less" : `Show all ${rows.length}`}
        </button>
      )}
    </section>
  );
}

// ── Read one ─────────────────────────────────────────────────────────────────

function ExperienceReader({ id }: { id: string }) {
  const navigate = useNavigate();
  const [e, setE] = useState<Experience | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState<ExperienceSummary[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  // How long they actually read it and how far they got (admin site: Placements → Interview experiences)
  useReadTime(e ? e.id : null, () => seenPercent(articleRef.current), (seconds, scrollPct, final) => {
    if (!e) return;
    trackPlacements("experience_read", { experienceId: e.id, companyId: e.companyId, company: e.company, seconds, scrollPct, final });
  });

  useEffect(() => {
    setE(undefined);
    scrollParent(rootRef.current)?.scrollTo({ top: 0 });
    fetchExperience(id)
      .then((x) => {
        setE(x);
        if (!x) return;
        trackPlacements("experience_view", { experienceId: x.id, companyId: x.companyId, company: x.company, verdict: x.verdict });
        fetchExperiences()
          .then((list) => setMore(list.experiences.filter((o) => o.companyId === x.companyId && o.id !== x.id)))
          .catch(() => setMore([]));
      })
      .catch((err) => setError(err instanceof PlacementsForbiddenError ? FORBIDDEN : "Couldn't load this experience. Check your connection."));
  }, [id]);

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate("/placements/experiences", { replace: true }));

  if (error || e === null) {
    return (
      <div className="flex flex-1 flex-col gap-5">
        <PageHeader title="Interview experiences" onBack={back} />
        <EmptyNote>{error ?? "This experience isn't available any more."}</EmptyNote>
      </div>
    );
  }
  if (!e) {
    return (
      <div ref={rootRef} className="flex flex-1 flex-col gap-5">
        <PageHeader title={" "} onBack={back} />
        <ListSkeleton />
      </div>
    );
  }

  const d = e.drive;
  const facts = [
    d?.stipend ? { value: d.stipend.replace(/ \/ month$/, ""), text: "Stipend / month" } : null,
    d?.ctc ? { value: d.ctc.replace(/ \(all base\)/, ""), text: d.ctc.includes("all base") ? "CTC · all base" : "CTC" } : null,
    d?.selects ? { value: d.selects, text: "Selected" } : null,
  ].filter((x): x is { value: string; text: string } => x != null);

  return (
    <div ref={rootRef} className="flex flex-1 flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <BackButton onClick={back} />
        <p className="min-w-0 flex-1 truncate text-[13px] text-white/45">Interview experiences</p>
      </div>

      <section className={cn(card, "relative p-4")}>
        <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative flex items-center gap-3.5">
          <CompanyMark name={e.company} id={e.companyId} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-[21px] font-bold leading-tight tracking-tight">{e.company}</h1>
            <p className="mt-0.5 text-[12.5px] leading-snug text-white/55">{experienceKind(e)}</p>
          </div>
        </div>
        <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
          <VerdictPill verdict={e.verdict} size="md" />
          {e.batch && <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[11px] font-medium text-white/60">Batch {e.batch}</span>}
          {e.season && <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[11px] font-medium text-white/60">{e.season} season</span>}
          <span className="rounded-full bg-white/[0.06] px-2 py-1 text-[11px] font-medium text-white/60">{e.readMinutes} min read</span>
        </div>
        {facts.length > 0 && (
          <div className={cn("relative mt-3.5 grid divide-x divide-white/[0.07] rounded-xl bg-black/25 py-2.5", facts.length === 3 ? "grid-cols-3" : facts.length === 2 ? "grid-cols-2" : "grid-cols-1")}>
            {facts.map((f) => (
              <Metric key={f.text} value={f.value} label={f.text} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className={cn(label, "mb-1.5")}>{e.rounds.length === 1 ? "The round" : `The ${e.rounds.length} rounds`}</h2>
        <ol className={cn(card, "px-3.5 py-3")}>
          {e.rounds.map((r, i) => {
            const [name, detail] = r.split(" · ");
            return (
              <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
                {i < e.rounds.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-18px)] w-px bg-white/[0.1]" />}
                <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/15 text-[11px] font-bold tabular-nums text-violet-200">
                  {i + 1}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-[13px] font-semibold leading-tight">{detail ?? name}</span>
                  {detail && <span className="mt-0.5 block text-[11px] text-white/40">{name}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {e.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-0.5">
          {e.topics.map((t) => (
            <span key={t} className="rounded-lg border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-white/60">
              {t}
            </span>
          ))}
        </div>
      )}

      <article ref={articleRef} className={cn(card, "px-4 pb-4 pt-1")}>
        <ExperienceMarkdown body={e.body} />
      </article>

      {e.inPlacements && (
        <button
          type="button"
          onClick={() => navigate(`/placements/${e.companyId}`, { state: { from: "list" } })}
          className={cn(card, "flex items-center gap-3 px-3.5 py-3 text-left active:bg-white/[0.06]")}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
            <Building2 className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold">{e.company} this season</span>
            <span className="block truncate text-[11.5px] text-white/45">Roles, packages, JD files and who got selected</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-white/40" />
        </button>
      )}

      {more.length > 0 && (
        <section>
          <h2 className={cn(label, "mb-1.5")}>
            {more.length} more from {e.company}
          </h2>
          <div className={cn(card, "divide-y divide-white/[0.06]")}>
            {more.map((o) => (
              <ExperienceCard key={o.id} e={o} showCompany={false} onOpen={() => navigate(`/placements/experiences/${o.id}`, { replace: true })} />
            ))}
          </div>
        </section>
      )}

      <AskAiCard
        title={`Prepare for ${e.company} with the AI`}
        detail="Rounds, common questions and what to revise"
        onClick={() => {
          trackPlacements("ask_ai", { companyId: e.companyId, company: e.company, from: "experience" });
          navigate(`/assistant?q=${encodeURIComponent(`How should I prepare for ${e.company} interviews? Use the seniors' interview experiences: rounds, common questions and tips`)}`);
        }}
      />
    </div>
  );
}

/** The experience text: section headings, code, tips (blockquotes) and tables, styled for long reading on a phone. */
function ExperienceMarkdown({ body }: { body: string }) {
  return (
    <div className="break-words text-[13.5px] leading-[1.7] text-white/75 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white/80">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="mb-2 mt-5 text-[16px] font-bold text-white">{children}</h2>,
          h2: ({ children }) => (
            <h2 className="mb-2 mt-5 flex items-center gap-2 text-[15px] font-bold leading-snug text-white">
              <span className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-violet-400 to-sky-400" />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => <h3 className="mb-1.5 mt-4 text-[13.5px] font-semibold text-white">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-1 mt-3 text-[13px] font-semibold text-white/90">{children}</h4>,
          p: ({ children }) => <p className="my-2">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="text-white/55">{children}</em>,
          ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 marker:text-white/30">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-white/40">{children}</ol>,
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" className="font-medium text-violet-300 underline decoration-violet-300/30 underline-offset-2">
              {children}
            </a>
          ),
          code: ({ children }) => <code className="rounded bg-white/[0.08] px-1 py-0.5 font-mono text-[12px] text-violet-100">{children}</code>,
          pre: ({ children }) => (
            <pre className="my-3 overflow-x-auto rounded-xl border border-white/[0.07] bg-black/45 p-3 font-mono text-[11.5px] leading-relaxed [scrollbar-width:thin]">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <div className="my-3 flex gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-50/85 [&_p]:my-0">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <div className="min-w-0">{children}</div>
            </div>
          ),
          table: ({ children }) => (
            <div className="my-3 max-w-full overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full border-collapse text-[12px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-white/[0.05]">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-white/[0.06]">{children}</tbody>,
          th: ({ children }) => <th className="whitespace-nowrap px-2.5 py-1.5 text-left font-semibold text-white/85">{children}</th>,
          td: ({ children }) => <td className="px-2.5 py-1.5 align-top">{children}</td>,
          hr: () => <hr className="my-4 border-white/[0.08]" />,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
