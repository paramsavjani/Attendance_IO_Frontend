import type { ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A labelled card of settings rows, separated by hairlines like a phone's settings app. */
export function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/40">{title}</h2>
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]">
        {children}
      </div>
    </section>
  );
}

interface SettingsRowProps {
  icon: LucideIcon;
  /** Tailwind classes for the icon tile, e.g. "bg-blue-500/15 text-blue-400". */
  tint: string;
  label: string;
  detail?: ReactNode;
  /** Short current value shown on the right, e.g. "8 h". */
  value?: ReactNode;
  /** Unread count; replaces the value. */
  badge?: number;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

export function SettingsRow({ icon: Icon, tint, label, detail, value, badge, onClick, href, disabled }: SettingsRowProps) {
  const body = (
    <>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tint)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold leading-tight text-white">{label}</span>
        {detail && <span className="mt-0.5 block truncate text-[11.5px] text-white/45">{detail}</span>}
      </span>
      {badge ? (
        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      ) : (
        value !== undefined && <span className="shrink-0 text-[13px] font-medium tabular-nums text-white/50">{value}</span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
    </>
  );
  const className = cn(
    "flex min-h-[58px] w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors active:bg-white/[0.06] touch-manipulation",
    disabled && "pointer-events-none opacity-45",
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {body}
    </button>
  );
}
