import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { useCloseOnBack } from "@/lib/backOverlay";
import { authenticatedFetch } from "@/lib/api";

interface PdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** API URL of the PDF (DAU students only, so it is fetched with the login token). */
  url: string;
  title: string;
  subtitle?: string | null;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const BUTTON_STEP = 1.5;
const MAX_PAGES = 40;
/** Widest canvas we draw, in device pixels: past this a zoomed page is scaled up by CSS instead, so a long PDF can't run a phone out of memory. */
const MAX_CANVAS_PX = 2400;

const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/**
 * A job description PDF as the company sent it, full screen. Android's WebView can't show a PDF on
 * its own, so pdf.js (loaded only when a PDF is first opened) draws each page onto a canvas at the
 * screen's width. Pinch with two fingers (or + / −) to zoom: while pinching the pages scale live under
 * the fingers, and on release they are redrawn sharp at the new size with that spot kept in place.
 */
export function PdfViewer({ open, onOpenChange, url, title, subtitle }: PdfViewerProps) {
  useCloseOnBack(open, () => onOpenChange(false));
  const scrollRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pageSizes, setPageSizes] = useState<{ w: number; h: number }[]>([]);
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(0);
  const docRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);
  /** Scroll position to restore after a zoom changes the page sizes. */
  const pendingScroll = useRef<{ left: number; top: number } | null>(null);

  // Download and open the document once per URL
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState("loading");
    setZoom(1);
    (async () => {
      try {
        const [pdfjs, worker] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.js?url")]);
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const res = await authenticatedFetch(url);
        if (!res.ok) throw new Error(`PDF ${res.status}`);
        const data = new Uint8Array(await res.arrayBuffer());
        const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
        const sizes: { w: number; h: number }[] = [];
        for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGES); n++) {
          const vp = (await doc.getPage(n)).getViewport({ scale: 1 });
          sizes.push({ w: vp.width, h: vp.height });
        }
        if (cancelled) {
          doc.destroy();
          return;
        }
        docRef.current = doc;
        setPageSizes(sizes);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
      docRef.current?.destroy();
      docRef.current = null;
    };
  }, [open, url]);

  // The width a page has at zoom 1: the viewer's width minus its padding
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (state !== "ready" || !box) return;
    const measure = () => setFitWidth(box.clientWidth - 24);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [state]);

  // Size every page for the zoom at once (so the scroll position can be restored), then draw them
  useLayoutEffect(() => {
    const box = pagesRef.current;
    if (state !== "ready" || !box || !fitWidth) return;
    const width = fitWidth * zoom;
    box.querySelectorAll<HTMLCanvasElement>("canvas[data-page]").forEach((c, i) => {
      const s = pageSizes[i];
      c.style.width = `${Math.floor(width)}px`;
      c.style.height = `${Math.floor((width * s.h) / s.w)}px`;
    });
    const scroller = scrollRef.current;
    if (pendingScroll.current && scroller) {
      scroller.scrollLeft = pendingScroll.current.left;
      scroller.scrollTop = pendingScroll.current.top;
      pendingScroll.current = null;
    }
  }, [state, pageSizes, zoom, fitWidth]);

  useEffect(() => {
    const doc = docRef.current;
    const box = pagesRef.current;
    if (state !== "ready" || !doc || !box || !fitWidth) return;
    let cancelled = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    (async () => {
      for (let n = 1; n <= pageSizes.length && !cancelled; n++) {
        const page = await doc.getPage(n);
        const pixelWidth = Math.min(fitWidth * zoom * dpr, MAX_CANVAS_PX);
        const viewport = page.getViewport({ scale: pixelWidth / pageSizes[n - 1].w });
        const canvas = box.querySelector<HTMLCanvasElement>(`canvas[data-page="${n}"]`);
        if (!canvas || cancelled) return;
        // Draw off screen, then swap in, so a page never flashes blank while zooming
        const off = document.createElement("canvas");
        off.width = Math.floor(viewport.width);
        off.height = Math.floor(viewport.height);
        await page.render({ canvasContext: off.getContext("2d")!, viewport }).promise;
        if (cancelled) return;
        canvas.width = off.width;
        canvas.height = off.height;
        canvas.getContext("2d")!.drawImage(off, 0, 0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, pageSizes, zoom, fitWidth]);

  /** Zoom to `next`, keeping the content point under (x, y) of the viewer where it is. */
  const zoomAround = useCallback(
    (next: number, x: number, y: number) => {
      const scroller = scrollRef.current;
      const target = clamp(next);
      if (!scroller || target === zoom) return;
      const ratio = target / zoom;
      pendingScroll.current = {
        left: (scroller.scrollLeft + x) * ratio - x,
        top: (scroller.scrollTop + y) * ratio - y,
      };
      setZoom(target);
    },
    [zoom],
  );

  // Two-finger pinch: scale the pages live with a CSS transform, then commit the zoom on release
  useEffect(() => {
    const scroller = scrollRef.current;
    const pages = pagesRef.current;
    if (state !== "ready" || !scroller || !pages) return;
    let start: { dist: number; x: number; y: number } | null = null;
    let ratio = 1;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const r = scroller.getBoundingClientRect();
      start = {
        dist: dist(e.touches),
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top,
      };
      ratio = 1;
      pages.style.transformOrigin = `${scroller.scrollLeft + start.x}px ${scroller.scrollTop + start.y}px`;
    };
    const onMove = (e: TouchEvent) => {
      if (!start || e.touches.length !== 2) return;
      e.preventDefault();
      ratio = clamp(zoom * (dist(e.touches) / start.dist)) / zoom;
      pages.style.transform = `scale(${ratio})`;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start || e.touches.length >= 2) return;
      const { x, y } = start;
      start = null;
      pages.style.transform = "";
      if (Math.abs(ratio - 1) > 0.02) zoomAround(zoom * ratio, x, y);
    };
    scroller.addEventListener("touchstart", onStart, { passive: true });
    scroller.addEventListener("touchmove", onMove, { passive: false });
    scroller.addEventListener("touchend", onEnd);
    scroller.addEventListener("touchcancel", onEnd);
    return () => {
      scroller.removeEventListener("touchstart", onStart);
      scroller.removeEventListener("touchmove", onMove);
      scroller.removeEventListener("touchend", onEnd);
      scroller.removeEventListener("touchcancel", onEnd);
    };
  }, [state, zoom, zoomAround]);

  const zoomButton = (factor: number) => {
    const s = scrollRef.current;
    if (s) zoomAround(zoom * factor, s.clientWidth / 2, s.clientHeight / 2);
  };

  const pageCount = pageSizes.length;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/95" />
        <DialogPrimitive.Content className="fixed inset-0 z-[100] flex flex-col outline-none" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 pb-3 pt-[max(env(safe-area-inset-top),16px)]">
            <DialogPrimitive.Close aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white active:scale-95">
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="truncate text-[14px] font-semibold text-white">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="truncate text-[11.5px] text-white/50">
                {subtitle ?? (state === "ready" ? `${pageCount} ${pageCount === 1 ? "page" : "pages"}` : "PDF")}
              </DialogPrimitive.Description>
            </div>
            {state === "ready" && (
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" aria-label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={() => zoomButton(1 / BUTTON_STEP)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30">
                  <Minus className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => zoomButton(BUTTON_STEP)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div ref={scrollRef} className="min-h-0 flex-1 touch-pan-x touch-pan-y overflow-auto px-3 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
            {state === "loading" && (
              <div className="flex h-full items-center justify-center gap-2 text-[13px] text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" /> Opening PDF…
              </div>
            )}
            {state === "error" && (
              <div className="flex h-full items-center justify-center px-8 text-center text-[13px] text-white/60">Couldn't open this PDF. Check your connection and try again.</div>
            )}
            <div ref={pagesRef} className={state === "ready" ? "flex w-max flex-col gap-3" : "hidden"}>
              {pageSizes.map((_, i) => (
                <canvas key={i} data-page={i + 1} className="max-w-none rounded-md bg-white shadow-lg" />
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
