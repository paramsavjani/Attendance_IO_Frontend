/**
 * Experimental bottom-nav designs, switchable with `?nav=<id>` for testing on the real app.
 * The default ("current") is the existing nav inside AppLayout; nothing here renders unless a
 * variant is chosen. The choice is remembered per device (localStorage) so it survives navigation;
 * `?nav=current` clears it.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ChevronUp, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAttendance } from "@/contexts/AttendanceContext";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

export interface NavVariantProps {
  items: NavItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Index of the tab that should show the unread dot, if any. */
  unreadIndex?: number;
  /** True while the page is being scrolled down (used by variants that shrink). */
  minimized: boolean;
  onExpand: () => void;
}

export type NavVariantId =
  | "current" | "lens" | "glass" | "liquid"
  | "droplet" | "split" | "gooey" | "edge" | "island" | "fan" | "dial" | "keys";

interface VariantMeta {
  /** Space the page must leave at the bottom so its last row clears the nav (px, before safe area). */
  clearance: number;
  /** Bottom offset for the assistant launcher (px, before safe area). */
  fabBottom: number;
  /** Whether the variant reacts to scroll direction. */
  usesScroll?: boolean;
}

export const NAV_VARIANT_META: Record<NavVariantId, VariantMeta> = {
  current: { clearance: 80, fabBottom: 84 },
  lens: { clearance: 80, fabBottom: 84 },
  glass: { clearance: 80, fabBottom: 84 },
  liquid: { clearance: 80, fabBottom: 84, usesScroll: true },
  droplet: { clearance: 90, fabBottom: 92 },
  split: { clearance: 88, fabBottom: 92 },
  gooey: { clearance: 104, fabBottom: 112 },
  edge: { clearance: 92, fabBottom: 96 },
  island: { clearance: 84, fabBottom: 88 },
  fan: { clearance: 92, fabBottom: 100 },
  dial: { clearance: 150, fabBottom: 156 },
  keys: { clearance: 100, fabBottom: 104 },
};

const STORAGE_KEY = "aio_nav_variant";

/** Reads `?nav=` (and remembers it), falling back to the stored choice, then "current". */
export function useNavVariant(): NavVariantId {
  const { search } = useLocation();
  const [variant, setVariant] = useState<NavVariantId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as NavVariantId | null;
      return stored && stored in NAV_VARIANT_META ? stored : "current";
    } catch {
      return "current";
    }
  });

  useEffect(() => {
    const requested = new URLSearchParams(search).get("nav") as NavVariantId | null;
    if (!requested) return;
    const next = requested in NAV_VARIANT_META ? requested : "current";
    setVariant(next);
    try {
      if (next === "current") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the choice just won't persist */
    }
  }, [search]);

  return variant;
}

const EASE = "cubic-bezier(0.32,0.72,0,1)";
const SPRING = "cubic-bezier(0.34,1.3,0.64,1)";
const BOTTOM = "calc(env(safe-area-inset-bottom, 0px) + 12px)";

function UnreadDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("absolute h-[7px] w-[7px] rounded-full bg-rose-500 ring-2 ring-background", className)} />;
}

/* ===================== Improved current nav: lens / glass / liquid ===================== */

const RIM = "linear-gradient(180deg, hsl(0 0% 100% / 0.30), hsl(0 0% 100% / 0.06) 45%, hsl(0 0% 100% / 0.12))";

function LensNav({ items, activeIndex, onSelect, unreadIndex, refined, minimized, onExpand }: NavVariantProps & { refined: boolean }) {
  const [drag, setDrag] = useState<{ start: number; over: number } | null>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const [lens, setLens] = useState({ left: 0, width: 0 });
  const [animate, setAnimate] = useState(false);

  const shown = drag ? drag.over : activeIndex;
  const spanFrom = drag ? drag.start : shown;

  useLayoutEffect(() => {
    const measure = () => {
      const a = btns.current[shown];
      const b = btns.current[spanFrom];
      if (!a || !b) return;
      const left = Math.min(a.offsetLeft, b.offsetLeft);
      const right = Math.max(a.offsetLeft + a.offsetWidth, b.offsetLeft + b.offsetWidth);
      setLens({ left, width: right - left });
    };
    measure();
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    const ro = new ResizeObserver(measure);
    btns.current.forEach((el) => el && ro.observe(el));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [shown, spanFrom, minimized]);

  const indexAt = (clientX: number) => {
    let best = activeIndex;
    let bestDist = Infinity;
    btns.current.forEach((el, i) => {
      if (!el || (minimized && i !== activeIndex)) return;
      const r = el.getBoundingClientRect();
      const d = Math.abs(clientX - (r.left + r.width / 2));
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  };

  const pill = (
    <div
      className={cn(
        "relative flex touch-none select-none items-center gap-1.5 rounded-full p-2 max-w-[calc(100vw-16px)] justify-center",
        !refined && "liquid-nav border-border/70 bg-card/85"
      )}
      style={
        refined
          ? {
              background: "linear-gradient(180deg, hsl(0 0% 14% / 0.78), hsl(0 0% 7% / 0.88))",
              backdropFilter: "blur(26px) saturate(190%)",
              WebkitBackdropFilter: "blur(26px) saturate(190%)",
              boxShadow: "0 10px 34px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.16), inset 0 -8px 16px hsl(0 0% 0% / 0.25)",
            }
          : undefined
      }
      onPointerDown={(e) => {
        if (minimized) return;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* no active pointer */
        }
        setDrag({ start: activeIndex, over: indexAt(e.clientX) });
      }}
      onPointerMove={(e) => drag && setDrag({ ...drag, over: indexAt(e.clientX) })}
      onPointerUp={() => {
        if (minimized) {
          onExpand();
          return;
        }
        if (drag) {
          const target = drag.over;
          setDrag(null);
          onSelect(target);
        }
      }}
      onPointerCancel={() => setDrag(null)}
    >
      <span
        aria-hidden
        className="absolute top-2 bottom-2 rounded-full"
        style={{
          left: lens.left,
          width: lens.width,
          background: "linear-gradient(180deg, hsl(var(--primary) / 0.32), hsl(var(--primary) / 0.16))",
          boxShadow: "inset 0 0 0 1px hsl(var(--primary) / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.22)",
          opacity: lens.width ? 1 : 0,
          transition: !animate ? "none" : drag ? `left 0.22s ${EASE}, width 0.22s ${EASE}` : `left 0.5s ${SPRING}, width 0.5s ${SPRING}`,
        }}
      />
      {items.map((item, index) => {
        const isActive = index === shown;
        const hidden = minimized && index !== activeIndex;
        return (
          <button
            key={item.path}
            ref={(el) => (btns.current[index] = el)}
            aria-current={index === activeIndex ? "page" : undefined}
            aria-label={item.label}
            // Pointer taps are handled on the pill (so drags work); this covers keyboard activation.
            onClick={(e) => {
              if (e.detail === 0) onSelect(index);
            }}
            className={cn("relative z-10 flex items-center gap-1.5 overflow-hidden rounded-full py-2.5", isActive ? "text-foreground" : "text-muted-foreground")}
            style={{
              maxWidth: hidden ? 0 : 140,
              paddingLeft: hidden ? 0 : 14,
              paddingRight: hidden ? 0 : 14,
              marginLeft: hidden ? -6 : 0,
              opacity: hidden ? 0 : 1,
              transition: animate ? `max-width 0.5s ${EASE}, padding 0.5s ${EASE}, margin 0.5s ${EASE}, opacity 0.25s, color 0.3s` : "none",
            }}
          >
            {index === unreadIndex && <UnreadDot className="right-2 top-1.5" />}
            <item.icon
              className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary")}
              style={{ transform: isActive ? "scale(1.08)" : "scale(1)", transition: `transform 0.45s ${SPRING}` }}
            />
            <span
              className="overflow-hidden whitespace-nowrap text-[12px] font-semibold tracking-[-0.01em]"
              style={{
                maxWidth: isActive ? 80 : 0,
                opacity: isActive ? 1 : 0,
                paddingLeft: isActive ? 2 : 0,
                transition: animate ? `max-width 0.45s ${EASE}, opacity 0.3s` : "none",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
      <span
        aria-hidden
        className="relative z-10 flex items-center gap-1 overflow-hidden"
        style={{
          maxWidth: minimized ? 80 : 0,
          opacity: minimized ? 1 : 0,
          paddingRight: minimized ? 8 : 0,
          transition: `max-width 0.5s ${EASE}, opacity 0.3s, padding 0.5s ${EASE}`,
        }}
      >
        {items.map((item, i) => (
          <span key={item.path} className={cn("h-1.5 shrink-0 rounded-full", i === activeIndex ? "w-3 bg-primary" : "w-1.5 bg-white/30")} />
        ))}
      </span>
    </div>
  );

  return (
    <nav className="fixed left-1/2 z-40 -translate-x-1/2" style={{ bottom: BOTTOM }}>
      {refined ? (
        <div className="rounded-full p-px" style={{ background: RIM }}>
          {pill}
        </div>
      ) : (
        pill
      )}
    </nav>
  );
}

/* ===================== New ideas ===================== */

const GLASS: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.05))",
  backdropFilter: "blur(18px) saturate(190%)",
  WebkitBackdropFilter: "blur(18px) saturate(190%)",
  border: "1px solid rgba(255,255,255,0.16)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.45)",
};

/** Index pair that briefly spans old→new so an indicator can stretch like liquid, then settle. */
function useLiquidIndex(target: number) {
  const [from, setFrom] = useState(target);
  useEffect(() => {
    const t = setTimeout(() => setFrom(target), 170);
    return () => clearTimeout(t);
  }, [target]);
  return from;
}

function DropletNav({ items, activeIndex, onSelect, unreadIndex }: NavVariantProps) {
  const from = useLiquidIndex(activeIndex);
  const n = items.length;
  const lo = Math.min(from, activeIndex);
  const span = Math.abs(activeIndex - from) + 1;
  return (
    <nav className="fixed inset-x-3 z-40 mx-auto max-w-md" style={{ bottom: BOTTOM }}>
      <div className="relative flex h-[62px] items-center rounded-full px-1.5" style={GLASS}>
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full"
          style={{
            left: `calc(6px + ${lo} * (100% - 12px) / ${n})`,
            width: `calc(${span} * (100% - 12px) / ${n})`,
            background: "radial-gradient(120% 140% at 50% 0%, rgba(255,255,255,0.28), rgba(255,255,255,0.08) 60%)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -6px 12px hsl(var(--primary) / 0.18)",
            transition: `left 0.5s ${SPRING}, width 0.5s ${SPRING}`,
          }}
        />
        {items.map((it, i) => (
          <button key={it.path} onClick={() => onSelect(i)} aria-current={i === activeIndex ? "page" : undefined} className="relative z-10 flex flex-1 flex-col items-center gap-0.5">
            {i === unreadIndex && <UnreadDot className="right-[30%] top-0" />}
            <it.icon className={cn("h-[21px] w-[21px] transition-all duration-300", i === activeIndex ? "scale-110 text-white" : "text-white/55")} strokeWidth={i === activeIndex ? 2.3 : 1.9} />
            <span className={cn("text-[10px] transition-colors duration-300", i === activeIndex ? "font-semibold text-white" : "text-white/50")}>{it.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function SplitNav({ items, activeIndex, onSelect, unreadIndex }: NavVariantProps) {
  const searchIndex = items.findIndex((it) => it.path === "/search");
  const SearchIcon = items[searchIndex]?.icon;
  return (
    <nav className="fixed inset-x-3 z-40 mx-auto flex max-w-md items-center gap-2.5" style={{ bottom: BOTTOM }}>
      <div className="relative flex h-[60px] flex-1 items-center rounded-full p-1.5" style={GLASS}>
        {items.map((it, i) => {
          if (i === searchIndex) return null;
          const on = i === activeIndex;
          return (
            <button
              key={it.path}
              onClick={() => onSelect(i)}
              aria-current={on ? "page" : undefined}
              className="relative flex h-full items-center justify-center gap-1.5 rounded-full"
              style={{
                flex: on ? 2.1 : 1,
                background: on ? "hsl(var(--primary) / 0.28)" : "transparent",
                boxShadow: on ? "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px hsl(var(--primary) / 0.35)" : "none",
                transition: `flex 0.55s ${SPRING}, background 0.3s`,
              }}
            >
              {i === unreadIndex && <UnreadDot className="right-3 top-2" />}
              <it.icon className={cn("h-5 w-5 shrink-0", on ? "text-white" : "text-white/55")} strokeWidth={on ? 2.3 : 1.9} />
              <span
                className="overflow-hidden whitespace-nowrap text-[13px] font-semibold text-white"
                style={{ maxWidth: on ? 90 : 0, opacity: on ? 1 : 0, transition: `max-width 0.55s ${SPRING}, opacity 0.25s` }}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
      {SearchIcon && (
        <button
          onClick={() => onSelect(searchIndex)}
          aria-label="Search"
          aria-current={activeIndex === searchIndex ? "page" : undefined}
          className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full"
          style={{ ...GLASS, ...(activeIndex === searchIndex ? { background: "hsl(var(--primary) / 0.35)" } : {}) }}
        >
          <SearchIcon className="h-[22px] w-[22px] text-white" strokeWidth={2.1} />
        </button>
      )}
    </nav>
  );
}

function GooeyNav({ items, activeIndex, onSelect }: NavVariantProps) {
  const n = items.length;
  const center = `calc(${activeIndex} * ${100 / n}% + ${50 / n}%)`;
  return (
    <nav className="fixed inset-x-3 z-40 mx-auto h-[86px] max-w-md" style={{ bottom: BOTTOM }}>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="nav-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-[60px] rounded-[30px]" style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }} />
      <div className="absolute inset-0" style={{ filter: "url(#nav-goo)" }}>
        <div className="absolute inset-x-0 bottom-0 h-[60px] rounded-[30px] bg-[#26262b]/90" />
        <div className="absolute top-1 h-[52px] w-[52px] -translate-x-1/2 rounded-full bg-primary" style={{ left: center, transition: `left 0.6s ${SPRING}` }} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[60px] rounded-[30px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" />
      <div
        className="absolute top-[7px] h-[46px] w-[46px] -translate-x-1/2 rounded-full bg-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_18px_hsl(var(--primary)/0.55)]"
        style={{ left: center, transition: `left 0.6s ${SPRING}` }}
      />
      <div className="absolute inset-x-0 bottom-0 flex h-[86px]">
        {items.map((it, i) => {
          const on = i === activeIndex;
          return (
            <button key={it.path} onClick={() => onSelect(i)} aria-current={on ? "page" : undefined} className="relative flex flex-1 flex-col items-center justify-end pb-2">
              <it.icon
                className="h-[21px] w-[21px] text-white"
                style={{ transform: on ? "translateY(-24px) scale(1.12)" : "none", opacity: on ? 1 : 0.55, transition: `transform 0.6s ${SPRING}, opacity 0.3s` }}
                strokeWidth={on ? 2.3 : 1.9}
              />
              <span className={cn("mt-1 text-[10px]", on ? "font-semibold text-white" : "text-white/45")}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function EdgeNav({ items, activeIndex, onSelect, unreadIndex }: NavVariantProps) {
  const n = items.length;
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "linear-gradient(180deg, rgba(20,20,22,0.55), rgba(10,10,12,0.92))",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      <div className="relative mx-auto flex h-[68px] max-w-lg items-start pt-3">
        <div className="pointer-events-none absolute top-0 h-full" style={{ width: `${100 / n}%`, left: `${(activeIndex * 100) / n}%`, transition: `left 0.55s ${SPRING}` }}>
          <div className="mx-auto h-[2px] w-10 rounded-full bg-[#8fa2ff] shadow-[0_0_14px_3px_hsl(var(--primary)/0.8)]" />
          <div className="mx-auto mt-[-2px] h-14 w-16 bg-[radial-gradient(50%_60%_at_50%_0%,hsl(var(--primary)/0.35),transparent)]" />
        </div>
        {items.map((it, i) => {
          const on = i === activeIndex;
          return (
            <button key={it.path} onClick={() => onSelect(i)} aria-current={on ? "page" : undefined} className="relative flex flex-1 flex-col items-center gap-1">
              {i === unreadIndex && <UnreadDot className="right-[32%] top-0" />}
              <it.icon className={cn("h-[22px] w-[22px] transition-colors duration-300", on ? "text-white" : "text-white/45")} strokeWidth={on ? 2.3 : 1.8} />
              <span className={cn("text-[10.5px] transition-colors duration-300", on ? "font-semibold text-white" : "text-white/45")}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* --- Live Island: shows the student's current / next lecture from their timetable --- */

interface LectureSlot {
  index: number;
  startTime: string;
  endTime: string;
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const clock = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}`;
};

function useNextLecture() {
  const { timetable, enrolledSubjects } = useAttendance();
  const [slots, setSlots] = useState<LectureSlot[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    authenticatedFetch(API_CONFIG.ENDPOINTS.TIME_SLOTS, { method: "GET" })
      .then((r) => (r.ok ? r.json() : []))
      .then(setSlots)
      .catch(() => setSlots([]));
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return useMemo(() => {
    const day = now.getDay() - 1; // timetable days are 0 = Monday … 4 = Friday
    if (day < 0 || day > 4) return null;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const today = timetable
      .filter((s) => s.day === day && s.subjectId)
      .map((s) => {
        const std = s.timeSlot !== null ? slots.find((x) => x.index === s.timeSlot) : undefined;
        const start = s.startTime ?? std?.startTime;
        const end = s.endTime ?? std?.endTime;
        const subject = enrolledSubjects.find((x) => x.id === s.subjectId);
        if (!start || !end || !subject) return null;
        return { start: start.slice(0, 5), end: end.slice(0, 5), subject, room: s.location || subject.classroomLocation || subject.lecturePlace || "" };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => toMin(a.start) - toMin(b.start));
    const current = today.find((c) => toMin(c.start) <= minutes && minutes < toMin(c.end));
    if (current) return { ...current, live: true, minutes: toMin(current.end) - minutes, total: toMin(current.end) - toMin(current.start) };
    const next = today.find((c) => toMin(c.start) > minutes);
    if (next) return { ...next, live: false, minutes: toMin(next.start) - minutes, total: 60 };
    return null;
  }, [timetable, enrolledSubjects, slots, now]);
}

function IslandNav({ items, activeIndex, onSelect, unreadIndex }: NavVariantProps) {
  const [open, setOpen] = useState(false);
  const next = useNextLecture();
  const Current = items[activeIndex]?.icon;
  const ring = 2 * Math.PI * 18;
  const fraction = next ? Math.min(1, Math.max(0, next.minutes / Math.max(next.total, 1))) : 0;

  return (
    <nav className="fixed inset-x-0 z-40 flex justify-center" style={{ bottom: BOTTOM }}>
      <div
        onClick={() => !open && setOpen(true)}
        className="overflow-hidden bg-black text-white shadow-[0_18px_40px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)]"
        style={{
          width: open ? "min(351px, calc(100vw - 24px))" : "min(280px, calc(100vw - 48px))",
          height: open ? 148 : 58,
          borderRadius: open ? 34 : 29,
          transition: `width 0.55s ${SPRING}, height 0.55s ${SPRING}, border-radius 0.55s ${SPRING}`,
        }}
      >
        <div className="flex h-[58px] items-center gap-3 pl-2 pr-3">
          {next ? (
            <div className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 42 42" aria-hidden>
                <circle cx="21" cy="21" r="18" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                <circle cx="21" cy="21" r="18" fill="none" stroke={next.subject.color || "hsl(var(--primary))"} strokeWidth="3" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - fraction)} />
              </svg>
              <span className="text-[11.5px] font-semibold tabular-nums">{next.minutes}m</span>
            </div>
          ) : (
            <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-white/10">{Current && <Current className="h-5 w-5" />}</span>
          )}
          <div className="min-w-0 flex-1 leading-tight">
            {next ? (
              <>
                <p className="truncate text-[13.5px] font-semibold">
                  {next.subject.name} {next.live ? "now" : "next"}
                </p>
                <p className="flex items-center gap-1 truncate text-[12px] text-white/55">
                  <MapPin className="h-3 w-3 shrink-0" /> {next.room || next.subject.code} · {next.live ? `ends ${clock(next.end)}` : `starts ${clock(next.start)}`}
                </p>
              </>
            ) : (
              <>
                <p className="truncate text-[13.5px] font-semibold">{items[activeIndex]?.label}</p>
                <p className="truncate text-[12px] text-white/55">No more classes today</p>
              </>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-label={open ? "Hide tabs" : "Show tabs"}
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10"
          >
            {unreadIndex !== undefined && !open && <UnreadDot className="-right-0.5 -top-0.5" />}
            <ChevronUp className="h-4 w-4" style={{ transform: open ? "rotate(180deg)" : "none", transition: `transform 0.4s ${SPRING}` }} />
          </button>
        </div>
        <div
          className="mx-2 flex h-[78px] items-center rounded-[26px] bg-white/[0.06]"
          style={{ opacity: open ? 1 : 0, transform: open ? "none" : "translateY(14px) scale(0.96)", transition: `opacity 0.3s ${open ? "0.15s" : "0s"}, transform 0.5s ${SPRING}` }}
        >
          {items.map((it, i) => {
            const on = i === activeIndex;
            return (
              <button
                key={it.path}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(i);
                  setOpen(false);
                }}
                aria-current={on ? "page" : undefined}
                className="relative flex flex-1 flex-col items-center gap-1"
              >
                {i === unreadIndex && <UnreadDot className="right-[22%] top-0" />}
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", on ? "bg-white text-black" : "text-white/60")} style={{ transition: `background 0.3s, transform 0.45s ${SPRING}`, transform: on ? "scale(1.05)" : "scale(1)" }}>
                  <it.icon className="h-[19px] w-[19px]" strokeWidth={on ? 2.3 : 1.9} />
                </span>
                <span className={cn("text-[10px]", on ? "font-semibold text-white" : "text-white/45")}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function FanNav({ items, activeIndex, onSelect, unreadIndex }: NavVariantProps) {
  const [open, setOpen] = useState(false);
  const Current = items[activeIndex]?.icon;
  const R = 128;
  const angles = items.map((_, i) => (200 + (i * 140) / (items.length - 1)) * (Math.PI / 180));
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "radial-gradient(120% 70% at 50% 100%, rgba(0,0,0,0.85), rgba(0,0,0,0.35))",
          backdropFilter: open ? "blur(6px)" : "none",
          WebkitBackdropFilter: open ? "blur(6px)" : "none",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
        onClick={() => setOpen(false)}
      />
      <nav className="fixed left-1/2 z-50 h-0 w-0" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 44px)" }}>
        {items.map((it, i) => {
          const on = i === activeIndex;
          const x = Math.cos(angles[i]) * R;
          const y = Math.sin(angles[i]) * R;
          return (
            <button
              key={it.path}
              onClick={() => {
                setOpen(false);
                onSelect(i);
              }}
              tabIndex={open ? 0 : -1}
              aria-current={on ? "page" : undefined}
              className="absolute left-0 top-0 flex flex-col items-center gap-1.5"
              style={{
                transform: open ? `translate(calc(${x}px - 50%), calc(${y}px - 50%)) scale(1)` : "translate(-50%, -50%) scale(0.3)",
                opacity: open ? 1 : 0,
                pointerEvents: open ? "auto" : "none",
                transition: `transform 0.55s ${SPRING} ${open ? i * 0.04 : 0}s, opacity 0.25s ${open ? i * 0.04 : 0}s`,
              }}
            >
              <span
                className={cn("relative flex h-[54px] w-[54px] items-center justify-center rounded-full", on ? "bg-primary text-white" : "bg-[#1d1d20] text-white/85")}
                style={{ boxShadow: on ? "0 8px 22px hsl(var(--primary) / 0.55), inset 0 1px 0 rgba(255,255,255,0.35)" : "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 18px rgba(0,0,0,0.5)" }}
              >
                {i === unreadIndex && <UnreadDot className="right-1 top-1" />}
                <it.icon className="h-[22px] w-[22px]" strokeWidth={2.1} />
              </span>
              <span className={cn("whitespace-nowrap text-[11px] font-medium", on ? "text-white" : "text-white/70")}>{it.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="absolute flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white text-black"
          style={{ boxShadow: "0 12px 30px rgba(0,0,0,0.6)", transform: `translate(-50%, -50%) rotate(${open ? 45 : 0}deg)`, transition: `transform 0.5s ${SPRING}` }}
        >
          {unreadIndex !== undefined && !open && <UnreadDot className="right-1 top-1" />}
          {open ? (
            <span className="relative block h-5 w-5">
              <span className="absolute left-1/2 top-0 h-5 w-[2.5px] -translate-x-1/2 rounded-full bg-black" />
              <span className="absolute left-0 top-1/2 h-[2.5px] w-5 -translate-y-1/2 rounded-full bg-black" />
            </span>
          ) : (
            Current && <Current className="h-6 w-6" strokeWidth={2.2} />
          )}
        </button>
      </nav>
    </>
  );
}

function DialNav({ items, activeIndex, onSelect }: NavVariantProps) {
  const STEP = 34;
  const R = 150;
  const mid = Math.floor(items.length / 2);
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[200px] overflow-hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
      <div
        className="pointer-events-auto absolute left-1/2 top-[84px] h-[340px] w-[340px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle at 50% 30%, #1f1f23, #0c0c0e 70%)", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.12), 0 -12px 40px rgba(0,0,0,0.8)" }}
      >
        <div className="absolute inset-0" style={{ transform: `rotate(${-(activeIndex - mid) * STEP}deg)`, transition: `transform 0.7s ${SPRING}` }}>
          {Array.from({ length: 60 }, (_, k) => (
            <span key={k} className="absolute left-1/2 top-0 h-full w-px" style={{ transform: `rotate(${k * 6}deg)` }}>
              <span className={cn("absolute left-0 top-[6px] w-px", k % 5 === 0 ? "h-2.5 bg-white/40" : "h-1.5 bg-white/15")} />
            </span>
          ))}
          {items.map((it, i) => {
            const a = (i - mid) * STEP;
            const on = i === activeIndex;
            return (
              <button
                key={it.path}
                onClick={() => onSelect(i)}
                aria-label={it.label}
                aria-current={on ? "page" : undefined}
                className="absolute left-1/2 top-1/2"
                style={{ transform: `rotate(${a}deg) translateY(-${R - 34}px) rotate(${-a + (activeIndex - mid) * STEP}deg)` }}
              >
                <span className="flex flex-col items-center p-2" style={{ transition: `transform 0.5s ${SPRING}`, transform: `translate(-50%,-50%) scale(${on ? 1.25 : 0.9})` }}>
                  <it.icon className={cn("h-6 w-6", on ? "text-white" : "text-white/40")} strokeWidth={on ? 2.2 : 1.8} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="absolute left-1/2 top-[72px] -translate-x-1/2">
        <div className="mx-auto h-0 w-0 border-x-[7px] border-t-[9px] border-x-transparent border-t-primary" />
      </div>
      <p className="absolute inset-x-0 text-center text-[13px] font-semibold text-white" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        {items[activeIndex]?.label}
      </p>
    </nav>
  );
}

function KeysNav({ items, activeIndex, onSelect, unreadIndex }: NavVariantProps) {
  return (
    <nav className="fixed inset-x-3 z-40 mx-auto max-w-md" style={{ bottom: BOTTOM }}>
      <div className="flex gap-2 rounded-[26px] p-2" style={{ background: "#0d0d0f", boxShadow: "inset 0 3px 8px rgba(0,0,0,0.9), inset 0 -1px 0 rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.05)" }}>
        {items.map((it, i) => {
          const on = i === activeIndex;
          return (
            <button
              key={it.path}
              onClick={() => onSelect(i)}
              aria-current={on ? "page" : undefined}
              className="relative flex h-[62px] flex-1 flex-col items-center justify-center gap-1 rounded-[18px]"
              style={{
                background: on ? "linear-gradient(180deg, #17171a, #1c1c20)" : "linear-gradient(180deg, #2a2a2f, #1d1d21)",
                boxShadow: on ? "inset 0 3px 6px rgba(0,0,0,0.85), inset 0 -1px 0 rgba(255,255,255,0.05)" : "0 4px 0 #0a0a0b, 0 6px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.14)",
                transform: on ? "translateY(3px)" : "translateY(0)",
                transition: "transform 0.12s ease-out, box-shadow 0.12s ease-out, background 0.2s",
              }}
            >
              <span
                className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full"
                style={{
                  background: i === unreadIndex ? "#f43f5e" : on ? "#8fa2ff" : "#2c2c31",
                  boxShadow: on ? "0 0 6px 1px rgba(143,162,255,0.9)" : "inset 0 1px 1px rgba(0,0,0,0.6)",
                }}
              />
              <it.icon className={cn("h-5 w-5", on ? "text-[#c9d0ff]" : "text-white/70")} strokeWidth={2} />
              <span className={cn("text-[9.5px] font-semibold", on ? "text-[#c9d0ff]" : "text-white/45")} style={{ textShadow: on ? "none" : "0 1px 0 rgba(0,0,0,0.8)" }}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Renders the chosen experimental nav. Not used for "current", which AppLayout renders itself. */
export function NavVariant({ variant, ...props }: NavVariantProps & { variant: Exclude<NavVariantId, "current"> }) {
  switch (variant) {
    case "lens":
      return <LensNav {...props} refined={false} minimized={false} />;
    case "glass":
      return <LensNav {...props} refined minimized={false} />;
    case "liquid":
      return <LensNav {...props} refined />;
    case "droplet":
      return <DropletNav {...props} />;
    case "split":
      return <SplitNav {...props} />;
    case "gooey":
      return <GooeyNav {...props} />;
    case "edge":
      return <EdgeNav {...props} />;
    case "island":
      return <IslandNav {...props} />;
    case "fan":
      return <FanNav {...props} />;
    case "dial":
      return <DialNav {...props} />;
    case "keys":
      return <KeysNav {...props} />;
  }
}
