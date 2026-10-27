import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Full-screen layers (the photo viewer) that the phone's back button should close before the page
 * underneath reacts. Capacitor calls every backButton listener, so page listeners check
 * `isOverlayOpen()` first and leave the press to the layer.
 */
let openOverlays = 0;

export const isOverlayOpen = () => openOverlays > 0;

/** While `open`, the back button calls `close` instead of leaving the page. */
export function useCloseOnBack(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (!open) return;
    openOverlays++;
    let handle: { remove: () => Promise<void> } | undefined;
    let cancelled = false;
    if (Capacitor.isNativePlatform()) {
      (async () => {
        const { App } = await import("@capacitor/app");
        const h = await App.addListener("backButton", () => closeRef.current());
        if (cancelled) h.remove();
        else handle = h;
      })();
    }
    return () => {
      cancelled = true;
      // Counted down a moment later, so page listeners firing for this same press still see it open.
      setTimeout(() => openOverlays--, 0);
      handle?.remove();
    };
  }, [open]);
}
