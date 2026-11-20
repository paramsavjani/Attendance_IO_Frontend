import { useEffect, useRef, useState } from "react";
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

const ZOOMS = [1, 1.5, 2, 3];
const MAX_PAGES = 40;

/**
 * A job description PDF as the company sent it, full screen. Android's WebView can't show a PDF on
 * its own, so pdf.js (loaded only when a PDF is first opened) draws each page onto a canvas at the
 * screen's width; + and − redraw it larger, and a zoomed page scrolls sideways.
 */
export function PdfViewer({ open, onOpenChange, url, title, subtitle }: PdfViewerProps) {
  useCloseOnBack(open, () => onOpenChange(false));
  const pagesRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(0);
  const docRef = useRef<import("pdfjs-dist").PDFDocumentProxy | null>(null);

  // Download and open the document once per URL
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState("loading");
    (async () => {
      try {
        const [pdfjs, worker] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.js?url")]);
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const res = await authenticatedFetch(url);
        if (!res.ok) throw new Error(`PDF ${res.status}`);
        const data = new Uint8Array(await res.arrayBuffer());
        const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
        if (cancelled) {
          doc.destroy();
          return;
        }
        docRef.current = doc;
        setPageCount(Math.min(doc.numPages, MAX_PAGES));
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

  // Draw every page at the current zoom
  useEffect(() => {
    const doc = docRef.current;
    const box = pagesRef.current;
    if (state !== "ready" || !doc || !box) return;
    let cancelled = false;
    const width = box.clientWidth * ZOOMS[zoom];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    (async () => {
      for (let n = 1; n <= pageCount && !cancelled; n++) {
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: (width / base.width) * dpr });
        const canvas = box.querySelector<HTMLCanvasElement>(`canvas[data-page="${n}"]`);
        if (!canvas || cancelled) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, pageCount, zoom]);

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
                <button type="button" aria-label="Zoom out" disabled={zoom === 0} onClick={() => setZoom((z) => Math.max(0, z - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30">
                  <Minus className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Zoom in" disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-3 pb-[max(env(safe-area-inset-bottom),16px)] pt-3">
            {state === "loading" && (
              <div className="flex h-full items-center justify-center gap-2 text-[13px] text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" /> Opening PDF…
              </div>
            )}
            {state === "error" && (
              <div className="flex h-full items-center justify-center px-8 text-center text-[13px] text-white/60">Couldn't open this PDF. Check your connection and try again.</div>
            )}
            <div ref={pagesRef} className={state === "ready" ? "flex flex-col gap-3" : "hidden"}>
              {Array.from({ length: pageCount }, (_, i) => (
                <canvas key={i} data-page={i + 1} className="max-w-none rounded-md bg-white shadow-lg" />
              ))}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
