import { ReactNode, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  CalendarDays,
  Search,
  BarChart3,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = navItems.findIndex(item => item.path === location.pathname);

  // Update indicator position on active change
  useEffect(() => {
    if (activeIndex >= 0 && buttonRefs.current[activeIndex] && navRef.current) {
      const button = buttonRefs.current[activeIndex];
      const nav = navRef.current;
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        setIndicatorStyle({
          left: buttonRect.left - navRect.left + buttonRect.width / 2 - 24,
          width: 48,
        });
      }
    }
  }, [activeIndex, location.pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 pb-16 overflow-auto">
        <div className="p-4 max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Compact Mobile Design */}
      <nav className="fixed bottom-0 left-0 right-0 safe-area-bottom z-50">
        {/* Clean glass background */}
        <div className="absolute inset-0 bg-card/90 backdrop-blur-lg border-t border-border/40" />
        
        <div 
          ref={navRef}
          className="relative flex items-center justify-around py-1.5 px-2 max-w-lg mx-auto"
        >
          {/* Fluid water drop indicator */}
          <div
            className="absolute top-1 h-[calc(100%-8px)] bg-gradient-to-b from-primary/25 via-primary/15 to-primary/5 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_16px_hsl(var(--primary)/0.2)]"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              transform: pressedItem ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            {/* Water ripple effect layers */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/10 to-transparent animate-pulse" />
            <div className="absolute -inset-1 rounded-3xl bg-primary/5 blur-sm" />
          </div>

          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const isPressed = pressedItem === item.path;
            
            return (
              <button
                key={item.path}
                ref={(el) => (buttonRefs.current[index] = el)}
                onClick={() => handleNavigation(item.path)}
                onTouchStart={() => setPressedItem(item.path)}
                onTouchEnd={() => setPressedItem(null)}
                onMouseDown={() => setPressedItem(item.path)}
                onMouseUp={() => setPressedItem(null)}
                onMouseLeave={() => setPressedItem(null)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-300 ease-out min-w-[52px]",
                  "active:scale-90 touch-manipulation",
                  isActive && "text-primary",
                  !isActive && "text-muted-foreground hover:text-foreground/80",
                  isPressed && "scale-95"
                )}
              >
                {/* Icon */}
                <div className={cn(
                  "relative z-10 transition-all duration-300 ease-out",
                  isActive && "transform -translate-y-0.5 drop-shadow-[0_2px_6px_hsl(var(--primary)/0.3)]"
                )}>
                  <item.icon 
                    className={cn(
                      "w-[18px] h-[18px] transition-all duration-300",
                      isActive && "scale-105"
                    )} 
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-[9px] transition-all duration-300 relative z-10 leading-tight",
                  isActive ? "font-semibold" : "font-medium opacity-60"
                )}>
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
