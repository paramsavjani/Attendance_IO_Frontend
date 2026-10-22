/**
 * Four takes on the "split" nav (tab capsule + detached round Search), all in a stronger
 * liquid-glass material. Used by navVariants via `?nav=split-liquid|split-morph|split-clear|split-tint`.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { NavVariantProps } from "@/components/layout/navVariants";

export type SplitStyle = "liquid" | "morph" | "clear" | "tint";

const SPRING = "cubic-bezier(0.34,1.32,0.64,1)";
const BOTTOM = "calc(env(safe-area-inset-bottom, 0px) + 12px)";

/** Per-tab hue for the "tint" style (by path). */
const TINTS: Record<string, string> = {
  "/dashboard": "234 89% 68%",
  "/timetable": "172 66% 52%",
  "/analytics": "38 92% 60%",
  "/profile": "330 81% 66%",
  "/search": "228 100% 78%",
};

/* One stylesheet for the shared keyframes. */
const KEYFRAMES = `
@keyframes split-pop { 0% { transform: scale(1) } 40% { transform: scale(1.22) } 70% { transform: scale(0.96) } 100% { transform: scale(1.06) } }
`;

interface Material {
  surface: React.CSSProperties;
  /** Rim gradient (drawn as a true border with a mask so the middle stays clear). */
  rim: string;
  gloss: string;
}

const MATERIALS: Record<"dark" | "clear", Material> = {
  dark: {
    surface: {
      background: "linear-gradient(180deg, hsl(0 0% 100% / 0.10), hsl(0 0% 100% / 0.03) 55%, hsl(0 0% 100% / 0.06))",
      backdropFilter: "blur(28px) saturate(210%) brightness(1.08)",
      WebkitBackdropFilter: "blur(28px) saturate(210%) brightness(1.08)",
      boxShadow: "0 14px 34px hsl(0 0% 0% / 0.5), 0 2px 6px hsl(0 0% 0% / 0.35), inset 0 -10px 18px hsl(0 0% 0% / 0.22)",
    },
    rim: "conic-gradient(from 200deg, hsl(0 0% 100% / 0.62), hsl(0 0% 100% / 0.10) 22%, hsl(0 0% 100% / 0.28) 48%, hsl(0 0% 100% / 0.07) 74%, hsl(0 0% 100% / 0.62))",
    gloss: "radial-gradient(120% 75% at 28% -18%, hsl(0 0% 100% / 0.30), hsl(0 0% 100% / 0) 58%), radial-gradient(70% 55% at 78% 125%, hsl(0 0% 100% / 0.10), transparent 62%)",
  },
  clear: {
    surface: {
      background: "linear-gradient(180deg, hsl(0 0% 100% / 0.06), hsl(0 0% 100% / 0.015))",
      backdropFilter: "blur(14px) saturate(240%) brightness(1.22)",
      WebkitBackdropFilter: "blur(14px) saturate(240%) brightness(1.22)",
      boxShadow: "0 12px 30px hsl(0 0% 0% / 0.35), inset 0 0 22px hsl(0 0% 100% / 0.05)",
    },
    rim: "conic-gradient(from 200deg, hsl(0 0% 100% / 0.85), hsl(0 0% 100% / 0.18) 22%, hsl(0 0% 100% / 0.45) 48%, hsl(0 0% 100% / 0.14) 74%, hsl(0 0% 100% / 0.85))",
    gloss: "radial-gradient(120% 80% at 25% -20%, hsl(0 0% 100% / 0.38), hsl(0 0% 100% / 0) 55%), radial-gradient(70% 60% at 80% 130%, hsl(0 0% 100% / 0.16), transparent 60%)",
  },
};

/** Glass slab: surface + masked gradient rim + gloss. Children sit above the gloss. */
function Glass({
  material,
  className,
  style,
  children,
  tint,
  onClick,
  as = "div",
  ...rest
}: {
  material: Material;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  /** Optional colour washed over the glass (hsl triplet). */
  tint?: string;
  onClick?: () => void;
  as?: "div" | "button";
} & React.AriaAttributes) {
  const Tag = as;
  return (
    <Tag className={cn("relative isolate overflow-hidden", className)} style={{ ...material.surface, ...style }} onClick={onClick} {...rest}>
      {tint && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
          style={{ background: `radial-gradient(120% 140% at 50% 120%, hsl(${tint} / 0.22), transparent 70%)`, transition: "background 0.6s" }}
        />
      )}
      <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: material.gloss }} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          padding: 1,
          background: material.rim,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
        }}
      />
      {children}
    </Tag>
  );
}

/** Restart the pop animation whenever `key` changes. */
function usePop(key: number) {
  const [n, setN] = useState(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setN((v) => v + 1);
  }, [key]);
  return n;
}

function UnreadDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("absolute h-[7px] w-[7px] rounded-full bg-rose-500 ring-2 ring-background", className)} />;
}

export function SplitNavPlus({ items, activeIndex, onSelect, unreadIndex, splitStyle }: NavVariantProps & { splitStyle: SplitStyle }) {
  const material = MATERIALS[splitStyle === "clear" ? "clear" : "dark"];
  const searchIndex = items.findIndex((it) => it.path === "/search");
  const tabs = items.map((it, i) => ({ ...it, i })).filter((t) => t.i !== searchIndex);
  const SearchIcon = items[searchIndex]?.icon;
  const searchActive = activeIndex === searchIndex;
  const pop = usePop(activeIndex);

  // "morph": remember the tab you came from, shown as a round button while on Search.
  const lastTab = useRef(tabs[0]?.i ?? 0);
  if (!searchActive && activeIndex >= 0) lastTab.current = activeIndex;
  const morphed = splitStyle === "morph" && searchActive;
  const LastIcon = items[lastTab.current]?.icon;

  const activeTint = TINTS[items[activeIndex]?.path ?? ""] ?? TINTS["/dashboard"];

  const activePill = (on: boolean): React.CSSProperties => {
    if (!on) return { background: "transparent", boxShadow: "none" };
    if (splitStyle === "clear")
      return {
        background: "linear-gradient(180deg, hsl(0 0% 100% / 0.92), hsl(0 0% 100% / 0.72))",
        boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 1), inset 0 -2px 6px hsl(0 0% 0% / 0.12), 0 6px 16px hsl(0 0% 0% / 0.3)",
      };
    const hue = splitStyle === "tint" ? activeTint : "var(--primary)";
    return {
      background: `linear-gradient(180deg, hsl(${hue} / 0.50), hsl(${hue} / 0.22))`,
      boxShadow: `inset 0 1px 0 hsl(0 0% 100% / 0.45), inset 0 -3px 8px hsl(0 0% 0% / 0.25), inset 0 0 0 1px hsl(${hue} / 0.45), 0 6px 18px hsl(${hue} / 0.28)`,
    };
  };

  return (
    <nav className="fixed inset-x-3 z-40 mx-auto flex max-w-md items-center gap-2.5" style={{ bottom: BOTTOM }}>
      <style>{KEYFRAMES}</style>

      {/* Tab capsule */}
      <Glass
        material={material}
        tint={splitStyle === "tint" ? activeTint : undefined}
        className="h-[62px] rounded-full"
        style={{ flex: morphed ? "0 0 62px" : "1 1 0%", transition: `flex 0.6s ${SPRING}` }}
      >
        {/* collapsed (morph on Search): one round button back to the last tab */}
        <button
          onClick={() => onSelect(lastTab.current)}
          aria-label={`Back to ${items[lastTab.current]?.label}`}
          tabIndex={morphed ? 0 : -1}
          className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ opacity: morphed ? 1 : 0, pointerEvents: morphed ? "auto" : "none", transition: "opacity 0.25s" }}
        >
          {LastIcon && <LastIcon className="h-[21px] w-[21px] text-white" strokeWidth={2.1} />}
        </button>

        <div
          className="relative z-10 flex h-full items-center p-1.5"
          style={{ opacity: morphed ? 0 : 1, pointerEvents: morphed ? "none" : "auto", transition: "opacity 0.2s" }}
        >
          {tabs.map((t) => {
            const on = t.i === activeIndex;
            return (
              <button
                key={t.path}
                onClick={() => onSelect(t.i)}
                aria-current={on ? "page" : undefined}
                aria-label={t.label}
                className="relative flex h-full min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-full active:scale-[0.94]"
                style={{
                  flex: on ? 2.2 : 1,
                  ...activePill(on),
                  transition: `flex 0.6s ${SPRING}, background 0.45s, box-shadow 0.45s, transform 0.18s`,
                }}
              >
                {on && splitStyle !== "clear" && (
                  <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={{ background: "radial-gradient(110% 80% at 30% -20%, hsl(0 0% 100% / 0.35), transparent 60%)" }} />
                )}
                {t.i === unreadIndex && <UnreadDot className="right-3 top-2" />}
                <t.icon
                  key={on ? `on-${pop}` : "off"}
                  className={cn(
                    "relative h-5 w-5 shrink-0",
                    on ? (splitStyle === "clear" ? "text-black" : "text-white") : splitStyle === "clear" ? "text-white/75" : "text-white/55"
                  )}
                  strokeWidth={on ? 2.3 : 1.9}
                  style={{ animation: on && pop ? `split-pop 0.55s ${SPRING}` : undefined }}
                />
                <span
                  className={cn("relative overflow-hidden whitespace-nowrap text-[13px] font-semibold", splitStyle === "clear" ? "text-black" : "text-white")}
                  style={{ maxWidth: on ? 92 : 0, opacity: on ? 1 : 0, transition: `max-width 0.6s ${SPRING}, opacity 0.25s` }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </Glass>

      {/* Search: a circle, or (morph, on Search) a wide search pill */}
      {SearchIcon && (
        <Glass
          as="button"
          material={material}
          onClick={() => onSelect(searchIndex)}
          aria-label="Search"
          aria-current={searchActive ? "page" : undefined}
          className="flex h-[62px] items-center rounded-full active:scale-[0.94]"
          style={{
            flex: morphed ? "1 1 0%" : "0 0 62px",
            transition: `flex 0.6s ${SPRING}, transform 0.18s`,
            ...(searchActive && !morphed ? activePill(true) : {}),
          }}
        >
          <span className="relative z-10 flex w-full items-center gap-2.5" style={{ paddingLeft: morphed ? 20 : 0, justifyContent: morphed ? "flex-start" : "center", transition: `padding 0.6s ${SPRING}` }}>
            <SearchIcon
              key={searchActive ? `on-${pop}` : "off"}
              className={cn("h-[22px] w-[22px] shrink-0", searchActive && splitStyle === "clear" && !morphed ? "text-black" : "text-white")}
              strokeWidth={2.1}
              style={{ animation: searchActive && pop ? `split-pop 0.55s ${SPRING}` : undefined }}
            />
            <span
              className="overflow-hidden whitespace-nowrap text-[14px] text-white/55"
              style={{ maxWidth: morphed ? 220 : 0, opacity: morphed ? 1 : 0, transition: `max-width 0.6s ${SPRING}, opacity 0.3s ${morphed ? "0.15s" : "0s"}` }}
            >
              Search students or subjects
            </span>
          </span>
        </Glass>
      )}
    </nav>
  );
}
