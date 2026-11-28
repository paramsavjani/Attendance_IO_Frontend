import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, FileText, Link2, Loader2, PenLine, ShieldCheck, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackPlacements } from "@/lib/placementsTracking";
import {
  fetchMySubmissions,
  fetchPlacements,
  PlacementsForbiddenError,
  submitExperience,
  type ExperienceSubmission,
  type ExperienceSubmissionInput,
  type SubmissionFormat,
} from "@/lib/placements";
import { card, EmptyNote, label, PageHeader } from "@/components/placements/PlacementPieces";

const MIN_TEXT = 200;
const MAX_FILE_BYTES = 200 * 1024;
const LINK_RE = /^https:\/\/(docs|drive)\.google\.com\//i;
const OFFER_TYPES = ["Placement", "Internship", "PPO"] as const;
const VERDICTS = ["Selected", "Not selected", "Awaiting result"] as const;
const FORMATS: { id: SubmissionFormat; label: string; Icon: typeof Link2 }[] = [
  { id: "LINK", label: "Docs / Drive link", Icon: Link2 },
  { id: "TEXT", label: "Write it", Icon: PenLine },
  { id: "FILE", label: "Upload file", Icon: Upload },
];
const TEMPLATE = `Rounds: OA → Technical 1 → Technical 2 → HR

OA: platform, time, number and type of questions
Technical 1: what they asked, how it went
...
Tips: what you would do differently`;

const input =
  "h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-sky-400/40";

/** Choice chips in one row; the selected one is filled. */
function Choice<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "h-9 flex-1 rounded-xl border text-[12.5px] font-medium transition-colors",
            value === o ? "border-white bg-white text-black" : "border-white/[0.08] bg-white/[0.035] text-white/70 active:bg-white/[0.08]",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

const STATUS: Record<string, { text: string; className: string }> = {
  PENDING: { text: "Being checked", className: "bg-amber-300/10 text-amber-200" },
  PUBLISHED: { text: "Published", className: "bg-emerald-300/10 text-emerald-300" },
  REJECTED: { text: "Not published", className: "bg-white/[0.06] text-white/50" },
};

/**
 * /placements/experiences/share: a student sends in their interview experience as a Google Docs / Drive link,
 * typed text, or a .md / .txt file. It's kept with their name so it can be checked, then published without it.
 */
export default function ShareExperience() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [companies, setCompanies] = useState<string[]>([]);
  const [mine, setMine] = useState<ExperienceSubmission[]>([]);
  const [forbidden, setForbidden] = useState(false);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [offerType, setOfferType] = useState<(typeof OFFER_TYPES)[number]>("Placement");
  const [verdict, setVerdict] = useState<(typeof VERDICTS)[number]>("Selected");
  const [format, setFormat] = useState<SubmissionFormat>("LINK");
  const [link, setLink] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<ExperienceSubmission | null>(null);

  useEffect(() => {
    trackPlacements("experience_share_open", {});
    fetchPlacements()
      .then((p) => setCompanies(p.companies.map((c) => c.name)))
      .catch((e) => e instanceof PlacementsForbiddenError && setForbidden(true));
    fetchMySubmissions().then(setMine).catch(() => undefined);
  }, []);

  const pickFile = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (!/\.(md|markdown|txt)$/i.test(f.name)) return setError("Upload a .md or .txt file. For Word or PDF, share it as a Google Drive link instead.");
    if (f.size > MAX_FILE_BYTES) return setError("That file is over 200 KB. Share it as a Google Drive link instead.");
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, text: String(reader.result ?? "") });
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsText(f);
  };

  const body = format === "TEXT" ? text.trim() : format === "FILE" ? (file?.text.trim() ?? "") : "";
  const problem =
    company.trim().length < 2
      ? "Enter the company name."
      : format === "LINK"
        ? LINK_RE.test(link.trim())
          ? null
          : "Paste a Google Docs or Drive link."
        : format === "FILE" && !file
          ? "Choose a .md or .txt file."
          : body.length < MIN_TEXT
            ? `Write at least ${MIN_TEXT} characters (${body.length} so far).`
            : null;

  const send = async () => {
    if (problem) return setError(problem);
    setSending(true);
    setError(null);
    const payload: ExperienceSubmissionInput = {
      company: company.trim(),
      role: role.trim() || undefined,
      offerType,
      verdict,
      format,
      ...(format === "LINK" ? { link: link.trim() } : { text: body }),
      ...(format === "FILE" ? { fileName: file?.name } : {}),
    };
    try {
      const saved = await submitExperience(payload);
      setSent(saved);
      setMine((m) => [saved, ...m]);
      trackPlacements("experience_share_sent", { company: saved.company, format });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send it.");
    } finally {
      setSending(false);
    }
  };

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate("/placements/experiences", { replace: true }));

  return (
    <div className="flex flex-1 flex-col gap-3.5 pb-8">
      <PageHeader title="Share your experience" subtitle="Help juniors prepare for the same interview" onBack={back} />

      {forbidden ? (
        <EmptyNote>Sharing is only for DAU students. Sign in with your @dau.ac.in account.</EmptyNote>
      ) : sent ? (
        <section className={cn(card, "px-4 py-6 text-center")}>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15">
            <Check className="h-6 w-6 text-emerald-300" />
          </span>
          <p className="mt-3 text-[17px] font-semibold">Thanks, it&apos;s in</p>
          <p className="mx-auto mt-1 max-w-[280px] text-[13px] leading-snug text-white/55">
            We&apos;ll check your {sent.company} experience and publish it without your name.
          </p>
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={() => navigate("/placements/experiences")} className="h-11 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.035] text-[13.5px] font-medium active:bg-white/[0.08]">
              Read experiences
            </button>
            <button
              type="button"
              onClick={() => {
                setSent(null);
                setCompany("");
                setRole("");
                setLink("");
                setText("");
                setFile(null);
              }}
              className="h-11 flex-1 rounded-xl bg-white text-[13.5px] font-semibold text-black active:scale-[0.99]"
            >
              Share another
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="flex gap-2.5 rounded-2xl border border-sky-300/15 bg-sky-300/[0.06] px-3.5 py-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
            <p className="text-[12.5px] leading-snug text-white/70">
              Your name comes with it so we can check it&apos;s genuine. It&apos;s published <span className="font-semibold text-white">without your name</span>, and juniors never see who wrote it.
            </p>
          </div>

          <section className="space-y-2">
            <p className={label}>Interview</p>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" list="share-companies" className={input} autoComplete="off" />
            <datalist id="share-companies">
              {companies.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (optional): SDE, Analyst…" className={input} />
            <Choice options={OFFER_TYPES} value={offerType} onChange={setOfferType} />
            <Choice options={VERDICTS} value={verdict} onChange={setVerdict} />
          </section>

          <section className="space-y-2">
            <p className={label}>Your experience</p>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.035] p-1">
              {FORMATS.map(({ id, label: text, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setFormat(id);
                    setError(null);
                  }}
                  className={cn(
                    "flex h-9 items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium transition-colors",
                    format === id ? "bg-white/[0.12] text-white" : "text-white/50",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {text}
                </button>
              ))}
            </div>

            {format === "LINK" && (
              <div className="space-y-1.5">
                <input value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" placeholder="https://docs.google.com/document/d/…" className={input} />
                <p className="px-1 text-[11.5px] leading-snug text-white/40">Google Docs or Drive (Word or PDF is fine there). Set sharing to &ldquo;Anyone with the link&rdquo;.</p>
              </div>
            )}

            {format === "TEXT" && (
              <div className="space-y-1.5">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={TEMPLATE}
                  rows={11}
                  className="w-full resize-y rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 text-[13.5px] leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-sky-400/40"
                />
                <p className={cn("px-1 text-right text-[11px] tabular-nums", text.trim().length >= MIN_TEXT ? "text-white/35" : "text-white/45")}>
                  {text.trim().length < MIN_TEXT ? `${MIN_TEXT - text.trim().length} more characters` : `${text.trim().length} characters`} · Markdown works
                </p>
              </div>
            )}

            {format === "FILE" && (
              <div>
                <input ref={fileRef} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
                {file ? (
                  <div className={cn(card, "flex items-center gap-3 px-3.5 py-3")}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                      <FileText className="h-4 w-4 text-white/70" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium">{file.name}</span>
                      <span className="block text-[11.5px] text-white/45 tabular-nums">{file.text.trim().length} characters</span>
                    </span>
                    <button type="button" aria-label="Remove file" onClick={() => setFile(null)} className="rounded-lg p-1.5 text-white/50 active:bg-white/[0.08]">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full flex-col items-center gap-1.5 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-7 active:bg-white/[0.05]"
                  >
                    <Upload className="h-5 w-5 text-white/50" />
                    <span className="text-[13.5px] font-medium">Choose a .md or .txt file</span>
                    <span className="text-[11.5px] text-white/40">Up to 200 KB</span>
                  </button>
                )}
              </div>
            )}
          </section>

          {error && <p className="px-1 text-[12.5px] text-rose-300">{error}</p>}

          <button
            type="button"
            onClick={send}
            disabled={sending}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[14.5px] font-semibold transition-transform active:scale-[0.99]",
              problem ? "bg-white/[0.08] text-white/45" : "bg-white text-black",
            )}
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {sending ? "Sending…" : "Send for review"}
          </button>
        </>
      )}

      {mine.length > 0 && (
        <section className="space-y-2 pt-1">
          <p className={label}>Your submissions</p>
          <div className={cn(card, "divide-y divide-white/[0.06]")}>
            {mine.map((s) => {
              const st = STATUS[s.status] ?? STATUS.PENDING;
              return (
                <div key={s.id} className="flex items-center gap-3 px-3.5 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">{s.company}</span>
                    <span className="block truncate text-[11.5px] text-white/45">
                      {[s.role, s.offerType, s.verdict].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", st.className)}>{st.text}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
