import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const MAX_ZOOM = 4;
/** Longest side of the saved HD photo; the server makes the small thumbnail from it. */
const OUTPUT_SIDE = 1600;
const JPEG_QUALITY = 0.9;

interface PhotoCropperProps {
  /** The picked file; null keeps the cropper closed. */
  file: File | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (photo: Blob) => void;
}

interface Point {
  x: number;
  y: number;
}

/**
 * "Move and scale", as Instagram and WhatsApp do it: the photo under a round window, dragged to
 * position and pinched (or slid) to zoom. Only the part inside the circle's square is uploaded.
 */
export function PhotoCropper({ file, saving, onCancel, onSave }: PhotoCropperProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [frame, setFrame] = useState(300);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ offset: Point; zoom: number; mid: Point; dist: number } | null>(null);

  // Load the picked file into an <img> we can draw from.
  useEffect(() => {
    if (!file) return;
    setImage(null);
    setError(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () => setError("That file isn't an image we can read. Try a JPG or PNG.");
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The round window fills the width on a phone and stops growing on a laptop.
  useEffect(() => {
    const fit = () => setFrame(Math.min(window.innerWidth - 48, window.innerHeight - 320, 380));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  /** Scale at zoom 1: the photo's short side exactly fills the window. */
  const baseScale = image ? frame / Math.min(image.naturalWidth, image.naturalHeight) : 1;

  /** Keeps the photo covering the whole window, however far it is dragged. */
  const clamp = useCallback(
    (next: Point, z: number): Point => {
      if (!image) return next;
      const maxX = Math.max(0, (image.naturalWidth * baseScale * z - frame) / 2);
      const maxY = Math.max(0, (image.naturalHeight * baseScale * z - frame) / 2);
      return { x: Math.min(maxX, Math.max(-maxX, next.x)), y: Math.min(maxY, Math.max(-maxY, next.y)) };
    },
    [image, baseScale, frame],
  );

  const setZoomClamped = (z: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    setZoom(next);
    setOffset((o) => clamp(o, next));
  };

  const startGesture = () => {
    const pts = [...pointers.current.values()];
    const mid = pts.length === 2 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : pts[0];
    const dist = pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    gesture.current = { offset, zoom, mid, dist };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    startGesture();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const start = gesture.current;
    if (pts.length >= 2 && start.dist > 0) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const z = Math.min(MAX_ZOOM, Math.max(1, (start.zoom * dist) / start.dist));
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      setZoom(z);
      setOffset(clamp({ x: start.offset.x + mid.x - start.mid.x, y: start.offset.y + mid.y - start.mid.y }, z));
    } else {
      setOffset(clamp({ x: start.offset.x + pts[0].x - start.mid.x, y: start.offset.y + pts[0].y - start.mid.y }, zoom));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) startGesture();
    else gesture.current = null;
  };

  const save = () => {
    if (!image) return;
    const scale = baseScale * zoom;
    const side = frame / scale;
    const sx = image.naturalWidth / 2 - (frame / 2 + offset.x) / scale;
    const sy = image.naturalHeight / 2 - (frame / 2 + offset.y) / scale;
    const out = Math.min(OUTPUT_SIDE, Math.round(side));
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, sx, sy, side, side, 0, 0, out, out);
    canvas.toBlob((blob) => blob && onSave(blob), "image/jpeg", JPEG_QUALITY);
  };

  return (
    <DialogPrimitive.Root open={file !== null} onOpenChange={(open) => !open && !saving && onCancel()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content onOpenAutoFocus={(e) => e.preventDefault()} className="fixed inset-0 z-[110] flex flex-col bg-black outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <div className="flex items-center justify-between px-4 pb-3 pt-[max(env(safe-area-inset-top),16px)]">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="h-10 rounded-full px-3 text-[15px] text-white/80 transition active:opacity-60 disabled:opacity-40"
            >
              Cancel
            </button>
            <DialogPrimitive.Title className="text-[15px] font-semibold text-white">Move and scale</DialogPrimitive.Title>
            <button
              type="button"
              onClick={save}
              disabled={!image || saving}
              className="flex h-10 min-w-[64px] items-center justify-center rounded-full bg-primary px-4 text-[15px] font-semibold text-white transition active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={(e) => setZoomClamped(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
          >
            {error ? (
              <p className="max-w-xs px-6 text-center text-sm text-white/70">{error}</p>
            ) : !image ? (
              <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            ) : (
              <div className="relative" style={{ width: frame, height: frame }}>
                <img
                  src={image.src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                  style={{
                    width: image.naturalWidth * baseScale,
                    height: image.naturalHeight * baseScale,
                    transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  }}
                />
                {/* Everything outside the circle is dimmed, so it's clear what will be kept. */}
                <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.62)] ring-2 ring-white/85" />
              </div>
            )}
          </div>

          <div className="mx-auto flex w-full max-w-sm items-center gap-3 px-6 pt-4 pb-[max(env(safe-area-inset-bottom),28px)]">
            <ZoomOut className="h-4 w-4 shrink-0 text-white/60" />
            <Slider
              value={[zoom]}
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              onValueChange={([z]) => setZoomClamped(z)}
              disabled={!image || saving}
              aria-label="Zoom"
            />
            <ZoomIn className="h-4 w-4 shrink-0 text-white/60" />
          </div>
          <p className="pb-4 text-center text-xs text-white/45">Drag to move · pinch or slide to zoom</p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
