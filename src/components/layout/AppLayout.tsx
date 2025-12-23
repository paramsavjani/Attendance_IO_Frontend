import { ReactNode } from "react";
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
          "flex-1 pb-20 overflow-y-auto overscroll-y-contain",
          "transition-transform duration-300 ease-out"
        )}
        style={{ 
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        <div className="p-4 max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom z-40">
        <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
