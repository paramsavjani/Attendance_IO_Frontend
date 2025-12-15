import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
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
  { icon: Calendar, label: "Track", path: "/daily" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: User, label: "Profile", path: "/profile" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 pb-24 overflow-auto">
        <div className="p-4 max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Apple Liquid Glass Style */}
      <nav className="fixed bottom-4 left-4 right-4 z-50">
        <div className="max-w-lg mx-auto">
          <div className="liquid-nav rounded-2xl p-1.5 shadow-2xl">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "relative flex flex-col items-center gap-0.5 py-2.5 px-4 rounded-xl transition-all duration-300 min-w-[56px]",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {/* Active indicator glow */}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/15 rounded-xl blur-sm" />
                    )}
                    
                    {/* Active background pill */}
                    {isActive && (
                      <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    )}
                    
                    <item.icon 
                      className={cn(
                        "w-5 h-5 relative z-10 transition-transform duration-300",
                        isActive && "scale-110"
                      )} 
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={cn(
                      "text-[10px] font-medium relative z-10 transition-all duration-300",
                      isActive && "font-semibold"
                    )}>
                      {item.label}
                    </span>
                    
                    {/* Active dot indicator */}
                    {isActive && (
                      <div className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
