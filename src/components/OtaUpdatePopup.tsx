import { useEffect, useState } from "react";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { CapacitorUpdater, type BundleInfo } from "@capgo/capacitor-updater";
import { ArrowDownToLine, Loader2, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tells the user an over-the-air update has finished downloading and offers to apply it now.
 *
 * With `autoUpdate`, the updater downloads a new web bundle in the background, queues it as the
 * next bundle and fires `updateAvailable`. Without this banner it only takes effect the next time
 * the app is backgrounded or relaunched. "Restart" calls `set()`, which switches to the new bundle
 * and reloads the app immediately; closing the banner leaves the queued update to apply as before.
 */
export function OtaUpdatePopup() {
  const [bundle, setBundle] = useState<BundleInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let handle: PluginListenerHandle | null = null;
    let disposed = false;
    void CapacitorUpdater.addListener("updateAvailable", ({ bundle: ready }) => {
      setBundle(ready);
      setOpen(true);
    }).then((h) => {
      if (disposed) void h.remove();
      else handle = h;
    });
    return () => {
      disposed = true;
      void handle?.remove();
    };
  }, []);

  const restart = async () => {
    if (!bundle || restarting) return;
    setRestarting(true);
    try {
      // Switches to the downloaded bundle and reloads; nothing after this runs on success.
      await CapacitorUpdater.set({ id: bundle.id });
    } catch {
      // Could not apply it now; it stays queued for the next launch.
      setRestarting(false);
      setOpen(false);
    }
  };

  if (!bundle) return null;

  return (
    <OtaUpdateBanner
      open={open}
      restarting={restarting}
      onRestart={restart}
      onDismiss={() => setOpen(false)}
    />
  );
}

interface OtaUpdateBannerProps {
  open: boolean;
  restarting: boolean;
  onRestart: () => void;
  onDismiss: () => void;
}

/** Slim "Update ready" bar that slides down from the top, below the status bar. */
export function OtaUpdateBanner({ open, restarting, onRestart, onDismiss }: OtaUpdateBannerProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const t = setTimeout(() => setShown(true), 50);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-3"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
    >
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "flex h-14 w-full max-w-[420px] items-center gap-2.5 rounded-2xl border-[0.5px] border-white/10 bg-[#1a1a19]/95 pl-2.5 pr-2 text-[#f0efec] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl",
          "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          shown ? "pointer-events-auto translate-y-0 opacity-100" : "-translate-y-[140%] opacity-0"
        )}
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#032042]">
          <ArrowDownToLine className="h-[18px] w-[18px] text-[#6da7ec]" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13.5px] font-medium">Update ready</p>
          <p className="truncate text-[11.5px] text-[#c3c2b7]">New version downloaded</p>
        </div>
        <button
          type="button"
          onClick={onRestart}
          disabled={restarting}
          className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg bg-[#f0efec] px-3 text-[12.5px] font-medium text-[#0b0b0b] transition-transform duration-150 active:scale-[0.97] disabled:opacity-80"
        >
          {restarting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCw className="h-4 w-4" />
          )}
          {restarting ? "Restarting" : "Restart"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={restarting}
          aria-label="Dismiss"
          className="flex h-9 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[#898781] transition-colors active:bg-white/[0.06] active:text-[#c3c2b7]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
