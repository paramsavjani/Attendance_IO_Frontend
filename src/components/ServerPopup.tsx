import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles, BarChart3, ShieldCheck, Bell, Megaphone, ArrowRight,
  Zap, Gift, Search, Star, Rocket, PartyPopper, Info, CheckCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { API_CONFIG } from "@/lib/api";
import confetti from "canvas-confetti";

const POPUP_STORAGE_PREFIX = "aio_popup_";

interface PopupFeature {
  icon: string;
  title: string;
  description: string;
}

interface PopupAction {
  label: string;
  route: string;
  icon?: string;
}

interface ServerPopupData {
  id: string;
  enabled: boolean;
  type: "once" | "daily" | "weekly" | string;
  date: string | null;
  icon?: string;
  title: string;
  subtitle?: string;
  features: PopupFeature[];
  primaryAction: PopupAction | null;
  dismissLabel: string | null;
  showDismiss?: boolean;
  confetti?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  chart: BarChart3,
  shield: ShieldCheck,
  bell: Bell,
  megaphone: Megaphone,
  zap: Zap,
  gift: Gift,
  search: Search,
  star: Star,
  rocket: Rocket,
  party: PartyPopper,
  info: Info,
  check: CheckCircle,
  arrow: ArrowRight,
};

function getIcon(name?: string): LucideIcon {
  if (!name) return Sparkles;
  return ICON_MAP[name] || Sparkles;
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWeekKey(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${week}`;
}

function shouldShowPopup(popup: ServerPopupData): boolean {
  const key = POPUP_STORAGE_PREFIX + popup.id;
  try {
    const stored = localStorage.getItem(key);
    switch (popup.type) {
      case "once":
        return stored !== "shown";
      case "daily":
        return stored !== getTodayStr();
      case "weekly":
        return stored !== getWeekKey();
      default:
        if (popup.type.startsWith("date:") || popup.date) {
          const targetDate = popup.date || popup.type.replace("date:", "");
          if (getTodayStr() !== targetDate) return false;
          return stored !== targetDate;
        }
        return stored !== "shown";
    }
  } catch {
    return false;
  }
}

function markPopupShown(popup: ServerPopupData): void {
  const key = POPUP_STORAGE_PREFIX + popup.id;
  try {
    switch (popup.type) {
      case "once":
        localStorage.setItem(key, "shown");
        break;
      case "daily":
        localStorage.setItem(key, getTodayStr());
        break;
      case "weekly":
        localStorage.setItem(key, getWeekKey());
        break;
      default:
        if (popup.type.startsWith("date:") || popup.date) {
          const targetDate = popup.date || popup.type.replace("date:", "");
          localStorage.setItem(key, targetDate);
        } else {
          localStorage.setItem(key, "shown");
        }
    }
  } catch {}
}

export function ServerPopup() {
  const [popup, setPopup] = useState<ServerPopupData | null>(null);
  const [open, setOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const fireConfetti = useCallback(() => {
    const duration = 1500;
    const end = Date.now() + duration;

    const burst = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"],
        zIndex: 9999,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"],
        zIndex: 9999,
      });
      if (Date.now() < end) requestAnimationFrame(burst);
    };

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"],
      zIndex: 9999,
    });

    burst();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchPopups = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(API_CONFIG.ENDPOINTS.POPUPS, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) return;
        const data = await response.json();
        const popups: ServerPopupData[] = data.popups || [];

        const toShow = popups.find((p) => p.enabled && shouldShowPopup(p));
        if (toShow) {
          setPopup(toShow);
          timer = setTimeout(() => {
            setOpen(true);
            setTimeout(() => {
              setIsVisible(true);
              if (toShow.confetti !== false) fireConfetti();
            }, 50);
          }, 600);
        }
      } catch {
        // silently fail
      }
    };

    fetchPopups();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [fireConfetti]);

  const close = () => {
    if (popup) markPopupShown(popup);
    setIsVisible(false);
    setTimeout(() => setOpen(false), 200);
  };

  const handlePrimary = () => {
    if (popup) markPopupShown(popup);
    setIsVisible(false);
    setTimeout(() => {
      setOpen(false);
      if (popup?.primaryAction?.route) {
        navigate(popup.primaryAction.route);
      }
    }, 200);
  };

  if (!popup) return null;

  const showDismiss = popup.showDismiss !== false && popup.dismissLabel !== null;
  const HeaderIcon = getIcon(popup.icon);
  const ActionIcon = popup.primaryAction?.icon
    ? getIcon(popup.primaryAction.icon)
    : ArrowRight;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (showDismiss ? close() : undefined)}>
      <DialogContent
        className={cn(
          "max-w-[92vw] sm:max-w-md",
          "rounded-3xl p-0 overflow-hidden border-0",
          "[&>button]:hidden",
          "transition-all duration-300",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          if (!showDismiss) e.preventDefault();
        }}
      >
        {/* Gradient Header */}
        <div className="relative px-6 pt-8 pb-5 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/15 backdrop-blur-sm border border-primary/20">
              <HeaderIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{popup.title}</h2>
              {popup.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{popup.subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="px-5 py-4 space-y-2.5">
          {popup.features.map((feature, idx) => {
            const Icon = getIcon(feature.icon);
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-2xl",
                  "bg-card border border-border/60",
                  "transition-all duration-300",
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-2 opacity-0"
                )}
                style={{ transitionDelay: `${150 + idx * 100}ms` }}
              >
                <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 pt-1 flex flex-col gap-2">
          {popup.primaryAction && (
            <Button
              className="w-full h-11 rounded-xl gap-2 font-semibold text-sm"
              onClick={handlePrimary}
            >
              {popup.primaryAction.label}
              <ActionIcon className="h-4 w-4" />
            </Button>
          )}
          {showDismiss && (
            <Button
              variant="ghost"
              className="w-full h-9 rounded-xl text-xs text-muted-foreground hover:text-foreground"
              onClick={close}
            >
              {popup.dismissLabel}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
