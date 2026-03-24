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
import { requestAppReview } from "@/lib/in-app-review";
import { RateAppServerPopup } from "@/components/RateAppServerPopup";
import confetti from "canvas-confetti";

/**
 * Popup JSON (GET /api/app/popups): primaryAction may use
 * - route + optional action "navigate" (default): go to route
 * - action "rate_app" | "in_app_review": shown in RateAppServerPopup (update-style dialog), not feature UI
 *
 * Scheduling `type` (localStorage key = aio_popup_{id}):
 * - once / daily / weekly: unchanged
 * - every_days: re-show after `intervalDays` full days (default 7). Set intervalDays in BE JSON (e.g. 15).
 */

const POPUP_STORAGE_PREFIX = "aio_popup_";

interface PopupFeature {
  icon: string;
  title: string;
  description: string;
}

interface PopupAction {
  label: string;
  /** Used when action is omitted or "navigate" */
  route?: string;
  /** Overrides navigation when set */
  action?: "navigate" | "rate_app" | "in_app_review";
  icon?: string;
}

interface ServerPopupData {
  id: string;
  enabled: boolean;
  type: "once" | "daily" | "weekly" | "every_days" | string;
  /** With type every_days: minimum days between impressions (default 7). */
  intervalDays?: number;
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

const MS_PER_DAY = 86400000;

function parseEveryDaysStored(stored: string | null): number | null {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as { at?: number };
    if (typeof parsed?.at === "number" && !Number.isNaN(parsed.at)) {
      return parsed.at;
    }
  } catch {
    const legacyMs = parseInt(stored, 10);
    if (!Number.isNaN(legacyMs) && legacyMs > 1e12) return legacyMs;
  }
  return null;
}

function shouldShowPopup(popup: ServerPopupData): boolean {
  const key = POPUP_STORAGE_PREFIX + popup.id;
  try {
    const stored = localStorage.getItem(key);

    if (popup.type === "every_days") {
      const days = Math.max(1, Math.floor(Number(popup.intervalDays) || 7));
      const lastMs = parseEveryDaysStored(stored);
      if (lastMs == null) return true;
      const elapsedDays = (Date.now() - lastMs) / MS_PER_DAY;
      return elapsedDays >= days;
    }

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

function isReviewPopup(p: ServerPopupData): boolean {
  const a = p.primaryAction?.action;
  return a === "rate_app" || a === "in_app_review";
}

function markPopupShown(popup: ServerPopupData): void {
  const key = POPUP_STORAGE_PREFIX + popup.id;
  try {
    if (popup.type === "every_days") {
      localStorage.setItem(key, JSON.stringify({ at: Date.now() }));
      return;
    }
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
            if (!isReviewPopup(toShow)) {
              setTimeout(() => {
                setIsVisible(true);
                if (toShow.confetti !== false) fireConfetti();
              }, 50);
            }
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
    if (popup && isReviewPopup(popup)) {
      setOpen(false);
      return;
    }
    setIsVisible(false);
    setTimeout(() => setOpen(false), 200);
  };

  const handlePrimary = () => {
    if (popup) markPopupShown(popup);
    const primary = popup?.primaryAction;
    const behavior =
      primary?.action ??
      (primary?.route ? ("navigate" as const) : undefined);

    if (behavior === "rate_app" || behavior === "in_app_review") {
      setOpen(false);
      if (behavior === "rate_app") void requestAppReview({ openPlayStoreOnly: true });
      else void requestAppReview();
      return;
    }

    setIsVisible(false);
    setTimeout(() => {
      setOpen(false);
      if (primary?.route) navigate(primary.route);
    }, 200);
  };

  if (!popup) return null;

  const showDismiss = isReviewPopup(popup)
    ? Boolean(popup.dismissLabel?.trim())
    : popup.showDismiss !== false && popup.dismissLabel !== null;

  if (isReviewPopup(popup) && popup.primaryAction) {
    return (
      <RateAppServerPopup
        open={open}
        title={popup.title}
        subtitle={popup.subtitle}
        features={popup.features.map((f) => ({ title: f.title, description: f.description }))}
        primaryLabel={popup.primaryAction.label}
        reviewAction={popup.primaryAction.action as "rate_app" | "in_app_review"}
        showDismiss={showDismiss}
        dismissLabel={popup.dismissLabel}
        onLater={close}
        onPrimary={handlePrimary}
      />
    );
  }

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
