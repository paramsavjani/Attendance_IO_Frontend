import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BadgeIndianRupee,
  Briefcase,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  MapPin,
  Search as SearchIcon,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
} from "@/lib/placements";

const PROGRAMME_FILTERS = [
  { key: "all", label: "All" },
  { key: "selected", label: "Has selections" },
  { key: "B.Tech", label: "B.Tech" },
  { key: "B.Tech MnC", label: "MnC" },
  { key: "M.Tech", label: "M.Tech" },
  { key: "M.Sc", label: "M.Sc" },
  { key: "M.Des", label: "M.Des" },
] as const;

const SORTS = [
  { key: "recent", label: "Recent" },
  { key: "ctc", label: "Highest CTC" },
  { key: "selected", label: "Most selected" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

/** /placements is the season's company list; /placements/:id is one company. */
export default function Placements() {
  const { id } = useParams();
  return id ? <CompanyView id={id} /> : <ListView />;
}

// ── List ─────────────────────────────────────────────────────────────────────

function ListView() {
  const navigate = useNavigate();
  const [data, setData] = useState<PlacementList | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    fetchPlacements().then(setData).catch(() => setError(true));
  }, []);

  const companies = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const rows = data.companies.filter((c) => {
      if (filter === "selected" && c.selectedCount === 0) return false;
      if (filter !== "all" && filter !== "selected" && !c.programmes.some((p) => (filter === "M.Tech" || filter === "M.Sc" ? p.startsWith(filter) : p === filter))) return false;
      if (!q) return true;
      return [c.name, ...c.roles, ...c.offerTypes].join(" ").toLowerCase().includes(q);
    });
    if (sort === "ctc") return [...rows].sort((a, b) => (b.maxCtcLpa ?? -1) - (a.maxCtcLpa ?? -1));
    if (sort === "selected") return [...rows].sort((a, b) => b.selectedCount - a.selectedCount || (b.maxCtcLpa ?? 0) - (a.maxCtcLpa ?? 0));
    return rows;
  }, [data, query, filter, sort]);

  const s = data?.summary;

  return (
    <div className="flex flex-1 flex-col gap-4 pb-6">
      <div className="flex items-center gap-3">
        <BackButton onClick={() => navigate(-1)} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight">Placements</h1>
          <p className="text-xs text-muted-foreground">
            {data ? `${data.season ?? ""} season · ${s?.companiesOnPortal ?? 0} companies visited` : " "}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          Couldn't load placements. Check your connection and try again.
        </div>
      )}

      {s && (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-indigo-600/25 via-violet-600/15 to-transparent p-4">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={<Users className="h-4 w-4" />} value={String(s.offers)} label={`offers · ${s.studentsSelected} students`} />
            <Stat icon={<Sparkles className="h-4 w-4" />} value={String(s.ppos)} label="PPOs" />
            <Stat
              icon={<Trophy className="h-4 w-4" />}
              value={s.highestCtcLpa != null ? `₹${formatLpa(null, s.highestCtcLpa)}L` : "—"}
              label={s.highestCtcCompany ? `highest · ${s.highestCtcCompany}` : "highest"}
            />
            <Stat icon={<BadgeIndianRupee className="h-4 w-4" />} value={s.averageCtcLpa != null ? `₹${s.averageCtcLpa.toFixed(1)}L` : "—"} label="average CTC" />
          </div>
          {s.topRecruiters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.topRecruiters.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => navigate(`/placements/${r.id}`)}
                  className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white/85 active:scale-95"
                >
                  {r.name} · {r.selected}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {data && (
        <>
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Company or role, e.g. SDE, quant, ML"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 rounded-xl border-border bg-card pl-10 text-sm"
            />
          </div>

          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
            {PROGRAMME_FILTERS.map((f) => (
              <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}
              </Chip>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {companies.length} {companies.length === 1 ? "company" : "companies"}
            </p>
            <div className="flex gap-1 rounded-xl bg-white/[0.04] p-0.5">
              {SORTS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setSort(o.key)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-[11px] font-medium transition-colors",
                    sort === o.key ? "bg-white/[0.1] text-foreground" : "text-muted-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {companies.map((c) => (
              <CompanyRow key={c.id} company={c} onOpen={() => navigate(`/placements/${c.id}`)} />
            ))}
            {companies.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No company matches that.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/assistant?q=${encodeURIComponent("Which companies this season came for my branch, and what did they pay?")}`)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Ask about placements</span>
              <span className="block truncate text-xs text-muted-foreground">"Who got placed at Tekion?" · "Quant roles above 20 LPA"</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {s && <p className="px-1 text-[11px] leading-relaxed text-muted-foreground/80">{s.coverage}{s.resultsUpTo ? ` Results up to ${formatDay(s.resultsUpTo)}.` : ""}</p>}
        </>
      )}

      {!data && !error && <ListSkeleton />}
    </div>
  );
}

function CompanyRow({ company: c, onOpen }: { company: PlacementCompanyCard; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-transform active:scale-[0.99]"
    >
      <CompanyMark name={c.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{c.name}</p>
          {c.ppoCount > 0 && <span className="shrink-0 rounded-md bg-amber-500/15 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-amber-300">PPO</span>}
        </div>
        <p className="truncate text-xs text-muted-foreground">{c.roles.length ? c.roles.join(" · ") : c.offerTypes.join(", ")}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">
          {[c.offerTypes.filter((t) => t !== "PPO").join(" + "), shortProgrammes(c.programmes)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums">{c.maxCtcLpa != null ? `₹${formatLpa(null, c.maxCtcLpa)}L` : "—"}</p>
        <p className={cn("text-[11px] tabular-nums", c.selectedCount > 0 ? "font-medium text-emerald-400" : "text-muted-foreground")}>
          {c.selectedCount > 0 ? `${c.selectedCount} selected` : "no results yet"}
        </p>
      </div>
    </button>
  );
}

// ── One company ──────────────────────────────────────────────────────────────

function CompanyView({ id }: { id: string }) {
  const navigate = useNavigate();
  const [company, setCompany] = useState<PlacementCompany | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    setCompany(undefined);
    fetchPlacementCompany(id).then(setCompany).catch(() => setError(true));
  }, [id]);

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate("/placements", { replace: true }));

  if (error || company === null) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackButton onClick={back} />
          <h1 className="text-xl font-bold">Placements</h1>
        </div>
        <div className="rounded-2xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          {error ? "Couldn't load this company. Check your connection." : "This company isn't in this season's list."}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackButton onClick={back} />
          <div className="h-6 w-40 animate-pulse rounded bg-white/[0.06]" />
        </div>
        <ListSkeleton />
      </div>
    );
  }

  const c = company;
  const ppos = c.selections.filter((x) => x.kind === "PPO");
  const campus = c.selections.filter((x) => x.kind !== "PPO");

  return (
    <div className="flex flex-1 flex-col gap-4 pb-6">
      <div className="flex items-center gap-3">
        <BackButton onClick={back} />
        <CompanyMark name={c.name} large />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold leading-tight">{c.name}</h1>
          <p className="truncate text-xs text-muted-foreground">{c.offerTypes.join(" · ") || "—"} · {c.season}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Fact label="Package" value={c.maxCtcLpa != null ? `₹${formatLpa(c.minCtcLpa, c.maxCtcLpa)}L` : "—"} />
        <Fact label="CPI cut-off" value={c.minCpi != null ? String(c.minCpi) : "Not stated"} />
        <Fact label="Selected" value={String(c.selectedCount)} accent={c.selectedCount > 0} />
      </div>

      {c.programmes.length > 0 && (
        <Section title="Open for" icon={<GraduationCap className="h-4 w-4" />}>
          <div className="flex flex-wrap gap-1.5">
            {c.programmes.map((p) => (
              <span key={p} className="rounded-lg bg-white/[0.06] px-2.5 py-1 text-xs font-medium">
                {p}
              </span>
            ))}
          </div>
        </Section>
      )}

      {c.drives.map((d) => (
        <DriveCard key={d.eventId} drive={d} multiple={c.drives.length > 1} />
      ))}

      {!c.onPortal && (
        <div className="rounded-2xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
          {c.name} didn't run a drive on the placement portal this season. These are PPOs from summer internships or an off-campus process; only the results are known.
        </div>
      )}

      {c.ctcNotes.length > 0 && (
        <Section title="Package by role (placement cell mails)" icon={<BadgeIndianRupee className="h-4 w-4" />}>
          <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
            {c.ctcNotes.map((n, i) => (
              <div key={i} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.role === "All roles" ? "All roles" : n.role}</p>
                  {n.notes && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{n.notes.replace(/;?\s*Registration mail from placement cell/i, "")}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{/\d/.test(n.ctc ?? "") ? `₹${n.ctc} LPA` : "Not stated"}</p>
                  {n.stipend && <p className="text-[11px] text-muted-foreground tabular-nums">₹{n.stipend}/mo</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {c.selections.length > 0 && (
        <Section title={`Selected students · ${c.selections.length}`} icon={<Users className="h-4 w-4" />}>
          <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
            {[...ppos, ...campus].map((x, i) => (
              <div key={`${x.studentId}-${i}`} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{x.name}</p>
                    {x.kind === "PPO" && <span className="shrink-0 rounded bg-amber-500/15 px-1 text-[9.5px] font-bold uppercase text-amber-300">PPO</span>}
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {[x.studentId, x.role, x.offerType && x.kind !== "PPO" ? x.offerType : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{x.ctc && /\d/.test(x.ctc) ? `₹${x.ctc}L` : "—"}</p>
                  {x.announcedOn && <p className="text-[10.5px] text-muted-foreground">{formatDay(x.announcedOn)}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground/80">
        Packages are what the company advertised on the placement portal or in the cell's mails, not anyone's offer letter. PPO packages are as reported by students.
      </p>
    </div>
  );
}

function DriveCard({ drive: d, multiple }: { drive: PlacementDrive; multiple: boolean }) {
  const when = d.driveDate ?? d.registrationStart;
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{multiple ? d.title : d.offerType ?? "Drive"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {multiple && d.offerType && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                {d.offerType}
              </span>
            )}
            {when && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {d.driveDate ? `Drive ${formatDay(d.driveDate)}` : `Registration ${formatDay(d.registrationStart)}`}
              </span>
            )}
            {d.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {d.location}
              </span>
            )}
            {d.ugCpi != null && <span>CPI ≥ {d.ugCpi}</span>}
          </div>
        </div>
        {d.source && (
          <a href={d.source} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground" aria-label="Open on the placement portal">
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      {multiple && d.openForLabels.length > 0 && <p className="text-[11px] text-muted-foreground">Open for {d.openForLabels.join(", ")}</p>}

      <div className="space-y-2">
        {d.profiles.map((p, i) => (
          <RoleRow key={i} profile={p} />
        ))}
      </div>

      {d.jdFiles && d.jdFiles.length > 0 && (
        <div className="space-y-1.5">
          <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Job description files</p>
          {d.jdFiles.map((f, i) => (
            <JdFileRow key={i} file={f} />
          ))}
        </div>
      )}

      {d.bond && <p className="text-xs text-amber-300/90">Bond: {d.bond}</p>}
    </div>
  );
}

function RoleRow({ profile: p }: { profile: PlacementProfile }) {
  const [open, setOpen] = useState(false);
  const ug = p.ugCtcMax != null ? formatLpa(p.ugCtcMin, p.ugCtcMax) : null;
  const pg = p.pgCtcMax != null ? formatLpa(p.pgCtcMin, p.pgCtcMax) : null;
  return (
    <div className="overflow-hidden rounded-xl bg-white/[0.04]">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">{p.name ?? "Role"}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {[
              ug ? `UG ₹${ug} LPA` : null,
              pg && pg !== ug ? `PG ₹${pg} LPA` : null,
              p.stipend ? `Stipend ₹${p.stipend}/mo` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Package not stated"}
          </p>
        </div>
        {p.description && <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />}
      </button>
      {open && p.description && (
        <div className="whitespace-pre-line border-t border-white/[0.05] px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">{p.description}</div>
      )}
    </div>
  );
}

function JdFileRow({ file: f }: { file: { file: string; text: string; transcribed: boolean } }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const long = f.text.length > 1500;
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
          <FileText className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{f.file}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-white/[0.05] px-3 py-2.5">
          {f.transcribed && <p className="mb-1.5 text-[10.5px] italic text-muted-foreground/70">Transcribed from an image in the file</p>}
          <p className="whitespace-pre-line break-words text-xs leading-relaxed text-muted-foreground">
            {long && !full ? `${f.text.slice(0, 1500)}…` : f.text}
          </p>
          {long && (
            <button type="button" onClick={() => setFull((v) => !v)} className="mt-2 text-xs font-semibold text-primary">
              {full ? "Show less" : "Read the whole file"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Bits ─────────────────────────────────────────────────────────────────────

function shortProgrammes(ps: string[]): string {
  if (ps.length === 0) return "";
  const ug = ps.filter((p) => p.startsWith("B.Tech"));
  const pg = ps.filter((p) => !p.startsWith("B.Tech"));
  return [ug.length ? ug.join(", ") : null, pg.length ? (pg.length > 2 ? `${pg.length} PG programmes` : pg.join(", ")) : null].filter(Boolean).join(" · ");
}

const MARK_COLORS = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-600",
];

function CompanyMark({ name, large }: { name: string; large?: boolean }) {
  const hash = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const initials = name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-sm",
        MARK_COLORS[hash % MARK_COLORS.length],
        large ? "h-11 w-11 text-sm" : "h-10 w-10 text-[13px]",
      )}
    >
      {initials || "?"}
    </span>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-white/60">{icon}</div>
      <p className="mt-1 text-xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-2.5">
      <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 truncate text-base font-bold tabular-nums", accent && "text-emerald-400")}>{value}</p>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-transparent bg-foreground text-background" : "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className="shrink-0 rounded-xl border border-border bg-card p-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
}
