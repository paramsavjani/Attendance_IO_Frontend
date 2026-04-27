import { ReactNode, useEffect, useRef, useState } from "react";
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
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { Capacitor } from "@capacitor/core";

interface AppLayoutProps {
  children: ReactNode;
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
      className="min-h-screen bg-background flex flex-col"
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
          "flex-1 pb-24 flex flex-col overflow-hidden safe-area-top",
          "transition-transform duration-300 ease-out"
        )}
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        <div
          key={location.key}
          className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto overflow-x-hidden p-4 animate-page-enter"
        >
          {children}
        </div>
      </main>

      {/* Floating pill bottom navigation */}
      <nav
        className="fixed bottom-3 left-1/2 z-40 -translate-x-1/2 safe-area-bottom"
      >
        <div
          ref={navRef}
          className={cn(
            "liquid-nav flex items-center gap-1.5 rounded-full p-2",
            "border-border/70 bg-card/85",
            "min-w-[320px] justify-center"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {navItems.map((item, index) => {
            const isActive = isDragging
              ? Math.round(dragProgress) === index
              : isActiveRoute(item.path);

            return (
              <button
                key={item.path}
                data-nav-index={index}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "group relative flex items-center gap-1.5 rounded-full px-3.5 py-2.5",
                  "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  "active:scale-95",
                  isActive
                    ? "bg-primary/20 text-foreground shadow-[0_2px_14px_-50px_hsl(var(--primary)/0.55),0_0_0_1px_hsl(var(--primary)/0.35)_inset]"
                    : "text-muted-foreground hover:text-foreground/90"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    isActive && "scale-105 text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.45)]"
                  )}
                />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap text-[12px] font-semibold tracking-[-0.01em]",
                    "max-w-0 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    isActive && "max-w-20 pl-0.5 opacity-100"
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
