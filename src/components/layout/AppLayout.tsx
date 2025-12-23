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
    threshold: 70,
    maxPull: 100,
  });

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Calculate dynamic values for smooth animation
  const indicatorScale = 0.3 + progress * 0.7;
  const indicatorOpacity = Math.min(progress * 1.5, 1);
  const rotation = progress * 180;

  return (
    <div ref={containerRef} className="min-h-screen bg-background flex flex-col overflow-hidden touch-pan-y">
      {/* Pull to Refresh Indicator */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
        style={{ 
          height: Math.max(pullDistance, 0),
          transition: pullDistance === 0 ? 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        <div 
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            "bg-gradient-to-br from-primary/20 to-primary/10",
            "border border-primary/30 shadow-lg shadow-primary/10",
            "backdrop-blur-sm",
            isRefreshing && "shadow-primary/30"
          )}
          style={{
            transform: `scale(${indicatorScale})`,
            opacity: indicatorOpacity,
            transition: 'transform 0.15s ease-out, box-shadow 0.2s ease',
          }}
        >
          {/* Outer ring progress indicator */}
          <svg 
            className="absolute w-12 h-12" 
            viewBox="0 0 48 48"
            style={{ transform: `rotate(-90deg)` }}
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="hsl(var(--primary) / 0.2)"
              strokeWidth="2"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${progress * 126} 126`}
              className="transition-all duration-100"
            />
          </svg>
          
          <RefreshCw 
            className={cn(
              "w-4 h-4 text-primary transition-all duration-150",
              isRefreshing && "animate-spin",
              shouldRefresh && !isRefreshing && "text-primary"
            )}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s ease-out',
            }}
          />
        </div>
        
        {/* Release text indicator */}
        {shouldRefresh && !isRefreshing && (
          <span 
            className="absolute bottom-1 text-[10px] font-medium text-primary/80 animate-fade-in"
          >
            Release to refresh
          </span>
        )}
        
        {isRefreshing && (
          <span 
            className="absolute bottom-1 text-[10px] font-medium text-primary/80 animate-fade-in"
          >
            Refreshing...
          </span>
        )}
      </div>

      {/* Main Content */}
      <main 
        className="flex-1 pb-20 overflow-auto"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
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
