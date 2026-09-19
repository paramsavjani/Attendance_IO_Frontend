import { ReactNode } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Grouped settings rows, the pattern every phone user already knows from the system Settings app:
 * a small caps label, then a card of full-width rows with an icon tile, a title, an optional
 * subtitle, and the *current value* on the right — so people can see their setup without
 * opening anything. Rows are ≥ 60px tall for thumbs; the whole page is sized to fit a phone
 * screen without scrolling.
 */

export function SettingsGroup({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-1.5", className)}>
      {label && (
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</h2>
      )}
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-card">
        {children}
      </div>
    </section>
  );
}

/** Tailwind classes per accent, kept as whole strings so the JIT can see them. */
const TILE: Record<string, string> = {
  blue: "bg-blue-500/15 text-blue-400",
  violet: "bg-violet-500/15 text-violet-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  indigo: "bg-indigo-500/15 text-indigo-400",
  amber: "bg-amber-500/15 text-amber-400",
  pink: "bg-pink-500/15 text-pink-400",
  yellow: "bg-yellow-500/15 text-yellow-400",
  cyan: "bg-cyan-500/15 text-cyan-400",
  red: "bg-red-500/15 text-red-400",
  neutral: "bg-white/[0.08] text-foreground/80",
};

export type SettingsAccent = keyof typeof TILE;

interface SettingsRowProps {
  icon: ReactNode;
  accent?: SettingsAccent;
  title: string;
  subtitle?: string;
  /** Current state shown on the right, e.g. "8h", "Off", "3 of 10 set". */
  value?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  /** Destructive rows (log out) are red end to end. */
  destructive?: boolean;
}

/** Compact square actions for secondary things (analytics, rate, feedback…), four to a row. */
export function SettingsTile({ icon, accent = "neutral", label, onClick, href }: { icon: ReactNode; accent?: SettingsAccent; label: string; onClick?: () => void; href?: string }) {
  const className = cn(
    "flex min-h-[76px] flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-card px-1 py-2.5",
    "transition-colors active:bg-white/[0.06] touch-manipulation"
  );
  const inner = (
    <>
      <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl [&>svg]:h-[17px] [&>svg]:w-[17px]", TILE[accent])}>{icon}</span>
      <span className="text-[11px] font-medium leading-none text-foreground/90">{label}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

export function SettingsRow({ icon, accent = "neutral", title, subtitle, value, onClick, href, disabled, destructive }: SettingsRowProps) {
  const inner = (
    <>
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:h-[18px] [&>svg]:w-[18px]", TILE[destructive ? "red" : accent])}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className={cn("block truncate text-[14px] leading-tight", destructive ? "font-semibold text-red-400" : "font-medium text-foreground")}>{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[11.5px] leading-snug text-muted-foreground">{subtitle}</span>}
      </span>
      {value !== undefined && value !== null && (
        <span className="max-w-[40%] shrink-0 truncate text-right text-[12.5px] tabular-nums text-muted-foreground">{value}</span>
      )}
      {!destructive &&
        (href ? (
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        ))}
    </>
  );
  const className = cn(
    "flex min-h-[60px] w-full items-center gap-3.5 px-4 py-2.5 transition-colors touch-manipulation",
    destructive ? "bg-red-500/[0.06] active:bg-red-500/[0.12]" : "active:bg-white/[0.06]",
    disabled && "pointer-events-none opacity-45"
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {inner}
    </button>
  );
}
