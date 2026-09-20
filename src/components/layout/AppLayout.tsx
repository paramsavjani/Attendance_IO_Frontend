import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Search,
  BarChart3,
  User,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AssistantFab } from "@/components/assistant/AssistantFab";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { Capacitor } from "@capacitor/core";

interface AppLayoutProps {
  children: ReactNode;
}

/** Rendered height of the nav pill (p-1.5 + py-2.5 buttons + 22px icon box). Keep in sync with the markup below. */
const NAV_HEIGHT_PX = 56;

function tapHaptic() {
  try {
    navigator.vibrate?.(6);
  } catch {
    // ignore
  }
}

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: CalendarDays, label: "Timetable", path: "/timetable" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Sliding glass pill behind the active tab. Positioned by writing styles straight to the DOM
  // (no React state) so the per-frame tracking below never re-renders the layout.
  const pillRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const startX = useRef(0);
  const startProgress = useRef(0);

  const handleRefresh = async () => {
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    // Reload page for Capacitor or web
    window.location.reload();
  };

  const {
    pullDistance,
    isRefreshing,
    progress,
    shouldRefresh,
    handlers,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 60,
    maxPull: 100,
  });

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActiveRoute = (path: string) => {
    if (location.pathname === path) return true;

    if (path === "/analytics" && location.pathname.startsWith("/subject-analysis")) {
      return true;
    }

    return false;
  };

  useEffect(() => {
    if (isDragging) return;
    const currentIndex = navItems.findIndex((item) => isActiveRoute(item.path));
    setDragProgress(Math.max(0, currentIndex));
  }, [location.pathname, isDragging]);

  // Position the pill from the real button boxes every frame while the buttons animate (the
  // active one widens over 300ms as its label unfolds), so the pill hugs the layout exactly
  // instead of chasing it with its own transition; between two buttons (drag) interpolate.
  // Uses offsetLeft/offsetWidth (relative to the nav, no rect maths) and writes to the element
  // directly - one layout read and one style write per frame, nothing goes through React.
  useLayoutEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    if (!nav || !pill) return;
    let raf = 0;
    const started = performance.now();
    const measure = () => {
      const lo = Math.max(0, Math.min(navItems.length - 1, Math.floor(dragProgress)));
      const hi = Math.min(navItems.length - 1, lo + 1);
      const t = dragProgress - lo;
      const a = buttonRefs.current[lo];
      const b = buttonRefs.current[hi] ?? a;
      if (!a || !b) return;
      const x = a.offsetLeft + (b.offsetLeft - a.offsetLeft) * t;
      const w = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * t;
      pill.style.width = `${w}px`;
      pill.style.transform = `translate3d(${x}px, 0, 0)`;
      pill.style.opacity = "1";
      if (!isDragging && performance.now() - started < 360) raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [dragProgress, isDragging]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    const button = target?.closest("button[data-nav-index]");
    if (!button || !navRef.current) return;

    const touchedIndex = Number(button.getAttribute("data-nav-index"));
    const currentIndex = navItems.findIndex((item) => isActiveRoute(item.path));

    if (touchedIndex !== currentIndex) return;

    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    startProgress.current = dragProgress;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !navRef.current) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    const itemWidth = navRef.current.offsetWidth / navItems.length;
    const progressDiff = diff / itemWidth;
    const newProgress = Math.min(
      Math.max(startProgress.current + progressDiff, 0),
      navItems.length - 1
    );

    setDragProgress(newProgress);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);
    const targetIndex = Math.round(dragProgress);
    const targetPath = navItems[targetIndex].path;

    if (location.pathname !== targetPath) {
      navigate(targetPath);
      return;
    }

    setDragProgress(targetIndex);
  };

  return (
    <div
      // Exactly the viewport, never taller: the document itself must not scroll, otherwise mobile
      // browsers shift position:fixed elements (nav, launcher) as their toolbar collapses/expands.
      className="h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-background flex flex-col"
      {...handlers}
    >
      {/* Pull to Refresh Indicator - Fixed at top */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 flex flex-col items-center justify-center overflow-hidden",
          "transition-all duration-300 ease-out"
        )}
        style={{
          height: pullDistance,
          opacity: progress > 0.1 ? 1 : 0,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full",
            "bg-card border border-border shadow-lg",
            "transition-transform duration-200"
          )}
          style={{
            transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 180}deg)`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <svg
              className="w-4 h-4 text-primary transition-transform duration-150"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12l7-7 7 7" />
            </svg>
          )}
        </div>

        {/* Status text */}
        <span
          className={cn(
            "text-[10px] font-medium text-muted-foreground mt-1",
            "transition-opacity duration-200",
            progress > 0.3 ? "opacity-100" : "opacity-0"
          )}
        >
          {isRefreshing ? "Refreshing..." : shouldRefresh ? "Release to refresh" : "Pull to refresh"}
        </span>
      </div>

      {/* Main Content - moves down with pull */}
      <main
        data-scroll-container
        className={cn(
          "flex-1 flex flex-col overflow-hidden safe-area-top",
          "transition-transform duration-300 ease-out"
        )}
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {/* On desktop (md+) the scroll container is full-width so the scrollbar sits at the window
            edge and the content column is centred inside it; on phones it is the column itself. */}
        <div
          key={location.key}
          className="mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 animate-page-enter md:max-w-none"
          // Content scrolls behind the glass nav; the bottom padding is just the nav's height plus
          // the same 12px gap it keeps below itself, so the last row can clear it and nothing more.
          style={{ paddingBottom: `calc(${NAV_HEIGHT_PX}px + 2 * 0.75rem + env(safe-area-inset-bottom, 0px))` }}
        >
          {/* Pages use `flex-1` to reach the bottom when short. This wrapper grows with tall pages
              (min-h-full, not h-full) so their content never overflows a fixed box, which used to
              drop the bottom padding and leave the last row touching the nav. */}
          <div className="flex min-h-full flex-col md:mx-auto md:w-full md:max-w-lg">{children}</div>
        </div>
      </main>

      {/* Assistant launcher — independent of the nav, sits above it on the right */}
      <AssistantFab />

      {/* Floating pill bottom navigation */}
      <nav
        className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 safe-area-bottom"
      >
        <div
          ref={navRef}
          className={cn(
            "liquid-nav liquid-nav-bar relative flex items-center gap-0.5 rounded-full p-1.5",
            "max-w-[calc(100vw-16px)] justify-center"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* Sliding glass pill that tracks the active tab (and the finger while dragging) */}
          <div
            ref={pillRef}
            aria-hidden
            className="liquid-nav-pill pointer-events-none absolute top-1.5 left-0 h-[44px] rounded-full opacity-0 will-change-transform"
          />

          {navItems.map((item, index) => {
            const isActive = isDragging
              ? Math.round(dragProgress) === index
              : isActiveRoute(item.path);

            return (
              <button
                key={item.path}
                ref={(el) => { buttonRefs.current[index] = el; }}
                data-nav-index={index}
                onClick={() => { tapHaptic(); handleNavigation(item.path); }}
                className={cn(
                  "group relative z-10 flex h-[44px] items-center gap-1 rounded-full px-3.5",
                  "transition-[color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  "active:scale-[0.94]",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/90"
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative flex h-[22px] w-[22px] shrink-0 items-center justify-center">
                  <item.icon
                    strokeWidth={isActive ? 2.25 : 1.9}
                    className={cn(
                      "h-[19px] w-[19px] transition-[transform,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                      isActive ? "text-primary" : "group-active:scale-90"
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap text-[12px] font-semibold tracking-[-0.01em]",
                    "max-w-0 -translate-x-1 opacity-0 transition-[max-width,opacity,transform,padding] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    isActive && "max-w-20 translate-x-0 pl-0.5 pr-0.5 opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
