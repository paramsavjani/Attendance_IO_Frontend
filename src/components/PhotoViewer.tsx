import { useEffect, useRef, useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { photoFull, photoThumb } from "@/lib/photoUrl";
import { useCloseOnBack } from "@/lib/backOverlay";

export const DEFAULT_AVATAR = "/user-icons/user2.png";

const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;

interface PhotoViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src?: string | null;
  name?: string | null;
  subtitle?: string | null;
  /** Buttons along the bottom edge, e.g. "Edit" on your own photo. */
  actions?: ReactNode;
}

/**
 * Full-screen photo, the way Instagram and WhatsApp open a profile picture: black backdrop, the
 * photo as large as the screen allows, who it is along the top, actions along the bottom. The
 * thumbnail already on screen shows at once and the HD photo replaces it when it arrives;
 * pinch or double-tap zooms, and a zoomed photo can be dragged around.
 */
export function PhotoViewer({ open, onOpenChange, src, name, subtitle, actions }: PhotoViewerProps) {
  useCloseOnBack(open, () => onOpenChange(false));

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[100] flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="relative z-10 flex items-center gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top),16px)]">
            <DialogPrimitive.Close
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-95"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-[15px] font-semibold text-white">
                {name || "Profile photo"}
              </DialogPrimitive.Title>
              {subtitle && <p className="truncate text-xs text-white/55">{subtitle}</p>}
            </div>
          </div>

          {open && <ZoomablePhoto src={src} alt={name || "Profile photo"} onBackgroundTap={() => onOpenChange(false)} />}

          <div className="relative z-10 flex min-h-[72px] items-center justify-center gap-3 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),20px)]">
            {actions}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface Point {
  x: number;
  y: number;
}

function ZoomablePhoto({ src, alt, onBackgroundTap }: { src?: string | null; alt: string; onBackgroundTap: () => void }) {
  const thumb = photoThumb(src) || DEFAULT_AVATAR;
  const full = photoFull(src) || DEFAULT_AVATAR;
  const [shown, setShown] = useState(thumb);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ zoom: number; offset: Point; mid: Point; dist: number; moved: boolean } | null>(null);
  const lastTap = useRef(0);
  /** Whether the current press started on the photo (pointer capture hides that by pointerup). */
  const pressOnPhoto = useRef(false);

  // Show the small version at once, then the full photo as soon as it has downloaded.
  useEffect(() => {
    setShown(thumb);
    if (full === thumb) return;
    const img = new Image();
    img.onload = () => setShown(full);
    img.src = full;
    return () => {
      img.onload = null;
    };
  }, [thumb, full]);

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const begin = () => {
    const pts = [...pointers.current.values()];
    const mid = pts.length >= 2 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : pts[0];
    const dist = pts.length >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    gesture.current = { zoom, offset, mid, dist, moved: false };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (pointers.current.size === 0) pressOnPhoto.current = (e.target as HTMLElement).tagName === "IMG";
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    begin();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length >= 2 && g.dist > 0) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      setZoom(Math.min(MAX_ZOOM, Math.max(1, (g.zoom * dist) / g.dist)));
      setOffset({ x: g.offset.x + mid.x - g.mid.x, y: g.offset.y + mid.y - g.mid.y });
      g.moved = true;
    } else if (zoom > 1) {
      setOffset({ x: g.offset.x + pts[0].x - g.mid.x, y: g.offset.y + pts[0].y - g.mid.y });
      if (Math.hypot(pts[0].x - g.mid.x, pts[0].y - g.mid.y) > 6) g.moved = true;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return begin();
    gesture.current = null;
    if (zoom <= 1.02) reset();
    if (!g || g.moved) return;

    // A tap on the black area closes (or zooms back out); two quick taps on the photo zoom in or out.
    if (!pressOnPhoto.current) {
      if (zoom > 1) reset();
      else onBackgroundTap();
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      if (zoom > 1) return reset();
      const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = e.clientX - (box.left + box.width / 2);
      const cy = e.clientY - (box.top + box.height / 2);
      setZoom(DOUBLE_TAP_ZOOM);
      setOffset({ x: -cx * (DOUBLE_TAP_ZOOM - 1), y: -cy * (DOUBLE_TAP_ZOOM - 1) });
      return;
    }
    lastTap.current = now;
  };

  return (
    <div
      className="relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={(e) => {
        const z = Math.min(MAX_ZOOM, Math.max(1, zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
        setZoom(z);
        if (z === 1) setOffset({ x: 0, y: 0 });
      }}
    >
      <img
        src={shown}
        alt={alt}
        draggable={false}
        className="h-auto max-h-[calc(100dvh-176px)] w-[min(100vw,560px)] object-contain transition-transform duration-75 sm:rounded-2xl"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, cursor: zoom > 1 ? "grab" : "zoom-in" }}
        onError={(e) => {
          e.currentTarget.src = DEFAULT_AVATAR;
        }}
      />
      {shown === thumb && thumb !== full && (
        <span className="pointer-events-none absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white/70">
          <Loader2 className="h-3 w-3 animate-spin" />
          HD
        </span>
      )}
    </div>
  );
}
