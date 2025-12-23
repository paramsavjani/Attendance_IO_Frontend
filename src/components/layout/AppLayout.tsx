import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  CalendarDays,
  Search,
  BarChart3,
  User,
  RefreshCw
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
    // For Capacitor, reload the page
    if (Capacitor.isNativePlatform()) {
      window.location.reload();
    } else {
      // For web, also reload
      window.location.reload();
    }
  };

  const {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
    shouldRefresh,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120,
  });

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Pull to Refresh Indicator */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ 
          height: pullDistance,
          opacity: progress,
        }}
      >
        <div 
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20 shadow-lg",
            isRefreshing && "animate-pulse"
          )}
          style={{
            transform: `rotate(${progress * 360}deg) scale(${0.5 + progress * 0.5})`,
          }}
        >
          <RefreshCw 
            className={cn(
              "w-5 h-5 text-primary transition-all",
              isRefreshing && "animate-spin",
              shouldRefresh && !isRefreshing && "text-primary scale-110"
            )} 
          />
        </div>
      </div>

      {/* Main Content */}
      <main 
        className="flex-1 pb-20 overflow-auto transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        <div className="p-4 max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
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
