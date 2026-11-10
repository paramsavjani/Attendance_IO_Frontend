import { useEffect } from "react";
import { BellRing, LayoutGrid, Zap, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Capacitor } from "@capacitor/core";
import { GooglePlayIcon } from "@/components/icons/GooglePlayIcon";
import { trackAppEvent } from "@/contexts/AuthContext";

// Hard-coded Google Play Store URL
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.attendanceio.app";

/** What the latest Play Store build adds over the OTA bundle; edit when a new build ships. */
const HIGHLIGHTS: { icon: LucideIcon; tint: string; title: string; text: string }[] = [
  {
    icon: LayoutGrid,
    tint: "bg-indigo-500/15 text-indigo-300",
    title: "Home screen widgets",
    text: "Today's classes and your % without opening the app",
  },
  {
    icon: BellRing,
    tint: "bg-emerald-500/15 text-emerald-400",
    title: "Mark from the notification",
    text: "Present, absent or cancelled, right after class",
  },
  {
    icon: Zap,
    tint: "bg-amber-500/15 text-amber-400",
    title: "App icon shortcuts",
    text: "Long-press the icon for Ask AI, Search and Profile",
  },
];

interface UpdateDialogProps {
  open: boolean;
  isCritical: boolean;
  title: string;
  message: string;
  onDismiss?: () => void;
}

export function UpdateDialog({
  open,
  isCritical,
  title,
  message,
  onDismiss,
}: UpdateDialogProps) {
  useEffect(() => {
    if (open) trackAppEvent("update_prompt_shown", { critical: isCritical }).catch(() => undefined);
  }, [open, isCritical]);

  const handleUpdate = async () => {
    trackAppEvent("update_prompt_tapped", { critical: isCritical }).catch(() => undefined);
    try {
      // Always try to open Play Store URL
      // For native apps, this will open the Play Store app directly
      // For web, it will open in a new tab
      if (Capacitor.isNativePlatform()) {
        try {
          const { Browser } = await import("@capacitor/browser");
          await Browser.open({ url: PLAY_STORE_URL });
        } catch {
          // Fallback: try to open Play Store app directly
          // Use market:// for Android Play Store app, or fallback to web URL
          const playStoreAppUrl = PLAY_STORE_URL.replace(
            "https://play.google.com/store/apps/details",
            "market://details"
          );
          try {
            const { Browser } = await import("@capacitor/browser");
            await Browser.open({ url: playStoreAppUrl });
          } catch {
            window.open(PLAY_STORE_URL, "_blank");
          }
        }
      } else {
        window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Failed to open Play Store:", error);
      // Final fallback
      window.open(PLAY_STORE_URL, "_blank");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(openState) => {
        // Prevent closing if critical update
        if (isCritical && !openState) return;
        if (!openState) onDismiss?.();
      }}
    >
      <DialogContent
        className="max-w-[92vw] gap-0 overflow-hidden rounded-[28px] border-white/[0.08] p-0 sm:max-w-[400px] [&>button]:hidden"
        onEscapeKeyDown={(e) => isCritical && e.preventDefault()}
        onPointerDownOutside={(e) => isCritical && e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="relative overflow-hidden px-6 pb-5 pt-7 text-center">
          <div className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-56 w-72 rounded-full bg-indigo-600/35 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:14px_14px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="relative mx-auto w-fit">
            <img src="/icon-192.webp" alt="" className="h-[72px] w-[72px] rounded-[22px] shadow-[0_12px_40px_-8px_rgba(99,102,241,0.7)]" />
            <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-background bg-white">
              <GooglePlayIcon className="h-3.5 w-3.5" />
            </span>
          </div>
          <span className="relative mt-4 inline-flex rounded-full bg-indigo-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
            {isCritical ? "Update required" : "New version"}
          </span>
          <DialogTitle className="relative mt-2 text-[20px] font-bold leading-tight tracking-tight">{title}</DialogTitle>
          <DialogDescription className="relative mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {message}
          </DialogDescription>
        </div>

        <ul className="mx-4 space-y-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2">
          {HIGHLIGHTS.map(({ icon: Icon, tint, title: name, text }) => (
            <li key={name} className="flex items-center gap-3 rounded-xl px-2 py-2">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 text-left">
                <span className="block text-[13.5px] font-semibold leading-tight">{name}</span>
                <span className="block text-[11.5px] leading-snug text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-1 p-4 pt-4">
          <button
            type="button"
            onClick={handleUpdate}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-[15px] font-semibold text-background shadow-lg transition-transform active:scale-[0.98]"
          >
            <GooglePlayIcon className="h-5 w-5" />
            Update on Google Play
          </button>
          {!isCritical && (
            <button
              type="button"
              onClick={onDismiss}
              className="h-10 w-full rounded-2xl text-[13px] font-medium text-muted-foreground active:bg-white/[0.05]"
            >
              Later
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
