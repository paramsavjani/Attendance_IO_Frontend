import { ReactNode, useState, useRef, useEffect } from "react";
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

  // Sync dragProgress with current route when not dragging
  useEffect(() => {
    if (!isDragging) {
      const currentIndex = navItems.findIndex(i => location.pathname === i.path);
      setDragProgress(Math.max(0, currentIndex));
    }
  }, [location.pathname, isDragging]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!navRef.current) return;

    // Calculate which item was touched
    const navRect = navRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX;

    // Account for the grid gap and padding in the calculation if needed,
    // but simple division usually works well enough for "intent".
    // Width includes padding (4px total) + gaps (16px total). 
    // It's a grid of 5 equal columns.
    const itemWidth = navRect.width / 5;
    const relativeX = touchX - navRect.left;
    const touchedIndex = Math.floor(relativeX / itemWidth);

    // Get current active index
    const currentIndex = navItems.findIndex(i => location.pathname === i.path);

    // Only start dragging if touching the active tab (or very close to it)
    if (touchedIndex === currentIndex) {
      setIsDragging(true);
      startX.current = touchX;
      startProgress.current = dragProgress;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!navRef.current || !isDragging) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    const itemWidth = navRef.current.offsetWidth / 5;
    const progressDiff = diff / itemWidth;

    // Clamp between 0 and 4 (number of items - 1)
    const newProgress = Math.min(Math.max(startProgress.current + progressDiff, 0), 4);
    setDragProgress(newProgress);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);
    const targetIndex = Math.round(dragProgress);
    const targetPath = navItems[targetIndex].path;

    if (location.pathname !== targetPath) {
      navigate(targetPath);
    } else {
      // If we didn't change route, snap back
      setDragProgress(targetIndex);
    }
  };

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
          "flex-1 pb-20 flex flex-col overflow-hidden safe-area-top",
          "transition-transform duration-300 ease-out"
        )}
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        <div className="p-4 max-w-lg mx-auto flex-1 flex flex-col overflow-hidden w-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-white/20 dark:border-white/10 bg-white/20 dark:bg-black/20 backdrop-blur-3xl safe-area-bottom z-40 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] touch-none"
      >
        <div
          ref={navRef}
          className="relative grid grid-cols-5 p-1 gap-1 max-w-lg mx-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Sliding Background */}
          <div
            className={cn(
              "absolute top-1 bottom-1 left-1 rounded-xl bg-white/80 dark:bg-white/10 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.3)] backdrop-blur-xl border border-white/20 z-0",
              !isDragging && "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
            )}
            style={{
              width: 'calc((100% - 24px) / 5)',
              transform: `translateX(calc(${dragProgress} * (100% + 4px)))`
            }}
          />
          {navItems.map((item, index) => {
            // Determine if this item is currently "active" based on drag progress
            // We consider it active if the progress is closest to this index
            const isActive = Math.round(dragProgress) === index;

            return (
              <button
                key={item.path}
                // Only allow click navigation if not dragging (handled by touchEnd mostly, but good safety)
                onClick={() => !isDragging && handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 py-1.5 px-0 rounded-xl transition-all duration-300 relative overflow-hidden group z-10",
                  isActive
                    ? "text-primary-foreground dark:text-white"
                    : "text-muted-foreground/80 hover:text-foreground active:scale-95 bg-transparent"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive && "scale-110 drop-shadow-sm")} />
                <span className={cn("text-[10px] font-bold transition-all duration-300", isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100")}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
