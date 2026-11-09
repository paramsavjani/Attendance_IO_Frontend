import { ReactNode, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Search,
  BarChart3,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AssistantFab, FAB_TOP, useAssistantFabVisible } from "@/components/assistant/AssistantFab";
import { Capacitor } from "@capacitor/core";
import { FEEDBACK_READ_EVENT, fetchMyFeedback } from "@/lib/feedback";

interface AppLayoutProps {
  children: ReactNode;
}

/** Rendered height of the nav pill (p-2 + py-2.5 buttons + 18px icon). Keep in sync with the markup below. */
const NAV_HEIGHT_PX = 56;

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
  const fabVisible = useAssistantFabVisible();
  const navRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  /** Unread feedback replies, shown as a dot on the Profile tab so it is visible from any screen. */
  const [feedbackUnread, setFeedbackUnread] = useState(0);
  const [dragProgress, setDragProgress] = useState(0);
  const startX = useRef(0);
  const startProgress = useRef(0);

  useEffect(() => {
    let active = true;
    const recount = () =>
      void fetchMyFeedback().then((mine) => {
        if (active) setFeedbackUnread(mine.unreadCount);
      });
    recount();
    window.addEventListener(FEEDBACK_READ_EVENT, recount);
    return () => {
      active = false;
      window.removeEventListener(FEEDBACK_READ_EVENT, recount);
    };
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActiveRoute = (path: string) => {
    if (location.pathname === path) return true;

    if (path === "/profile" && location.pathname.startsWith("/my-feedback")) {
      return true;
    }
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
      // Exactly the viewport, never taller: the document itself must not scroll, otherwise mobile
      // browsers shift position:fixed elements (nav, launcher) as their toolbar collapses/expands.
      className="h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-background flex flex-col"
    >
      <main data-scroll-container className="flex-1 flex flex-col overflow-hidden safe-area-top">
        {/* On desktop (md+) the scroll container is full-width so the scrollbar sits at the window
            edge and the content column is centred inside it; on phones it is the column itself. */}
        <div
          key={location.key}
          className="mx-auto min-h-0 w-full max-w-lg flex-1 overflow-y-auto overflow-x-hidden px-4 pt-4 animate-page-enter md:max-w-none"
          // Content scrolls behind the glass nav; the bottom padding is just the nav's height plus
          // the same 12px gap it keeps below itself, so the last row can clear it and nothing more.
          // Where the assistant launcher floats above the nav, the last row can scroll clear of it too.
          style={{
            paddingBottom: fabVisible
              ? `calc(${FAB_TOP} + 0.75rem)`
              : `calc(${NAV_HEIGHT_PX}px + 2 * 0.75rem + env(safe-area-inset-bottom, 0px))`,
          }}
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
            "liquid-nav flex items-center gap-1.5 rounded-full p-2",
            "border-border/70 bg-card/85",
            "max-w-[calc(100vw-16px)] justify-center"
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
                  "transition-all duration-300 ease-spring",
                  "active:scale-95",
                  isActive
                    ? "bg-primary/20 text-foreground shadow-[0_2px_14px_-50px_hsl(var(--primary)/0.55),0_0_0_1px_hsl(var(--primary)/0.35)_inset]"
                    : "text-muted-foreground hover:text-foreground/90"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.path === "/profile" && feedbackUnread > 0 && (
                  <span
                    aria-hidden
                    className="absolute right-2.5 top-1.5 h-[7px] w-[7px] rounded-full bg-rose-500 ring-2 ring-background"
                  />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-all duration-300 ease-spring",
                    isActive && "scale-105 text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.45)]"
                  )}
                />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap text-[12px] font-semibold tracking-[-0.01em]",
                    "max-w-0 opacity-0 transition-all duration-300 ease-spring",
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
