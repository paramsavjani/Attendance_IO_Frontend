import { ArrowRight, ChevronLeft } from "lucide-react";
import { SparkIcon } from "@/components/assistant/AssistantFab";
import { cn } from "@/lib/utils";

/** Building blocks shared by the placements pages (season list, company page, interview experiences). */

export const card = "overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]";
export const label = "px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40";

export function PageHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
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

export function BackButton({ onClick }: { onClick: () => void }) {
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

export function Metric({ value, label: text, accent }: { value: number | string; label: string; accent?: boolean }) {
  return (
    <div className="min-w-0 px-1 text-center">
      <p className={cn("truncate font-bold leading-tight tabular-nums", String(value).length > 9 ? "text-[14px]" : "text-[17px]", accent && "text-emerald-400")}>{value}</p>
      <p className="mt-0.5 truncate text-[10.5px] text-white/45">{text}</p>
    </div>
  );
}

export function AskAiCard({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
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

export function CompanyMark({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
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

export function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const text = ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[12px] font-semibold text-white/75">{text || "?"}</span>;
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div className={cn(card, "px-4 py-6 text-center text-[13px] leading-relaxed text-white/50")}>{children}</div>;
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-[180px] animate-pulse rounded-2xl bg-white/[0.04]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[64px] animate-pulse rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

