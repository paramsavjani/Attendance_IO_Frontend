import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useCloseOnBack } from "@/lib/backOverlay";
import { canPinWidget, pinWidget, type WidgetKind } from "@/lib/widgetBridge";
import { trackAppEvent } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const WIDGETS: { kind: WidgetKind; label: string; text: string; image: string; small?: boolean }[] = [
  {
    kind: "today",
    label: "Today",
    text: "Your classes, what's next, and which ones you've marked.",
    image: "/widgets/widget_today_preview_image.png",
  },
  {
    kind: "subjects",
    label: "Subjects",
    text: "Every subject's % with the classes you can still skip.",
    image: "/widgets/widget_bars_preview_image.png",
  },
  {
    kind: "mini",
    label: "Your %",
    text: "A small ring with your overall attendance.",
    image: "/widgets/widget_mini_preview_image.png",
    small: true,
  },
];

/** Seconds before "Not now" works, so the popup is seen rather than closed by reflex. */
const DISMISS_DELAY = 3;

interface WidgetLaunchPopupProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Introduces home-screen widgets once, after the student has updated to a build that has them:
 * a live preview of each, an "Add to home screen" that asks the launcher directly, and a
 * "Not now" that only unlocks after a few seconds.
 */
export function WidgetLaunchPopup({ open, onClose }: WidgetLaunchPopupProps) {
  const [index, setIndex] = useState(0);
  const [wait, setWait] = useState(DISMISS_DELAY);
  const [canPin, setCanPin] = useState<boolean | null>(null);
  const [touched, setTouched] = useState(false);
  const widget = WIDGETS[index];
  const canClose = wait === 0;

  const close = () => {
    if (canClose) onClose();
  };
  useCloseOnBack(open, close);

  useEffect(() => {
    if (!open) return;
    setWait(DISMISS_DELAY);
    void canPinWidget().then(setCanPin);
    trackAppEvent("widget_popup_shown", {}).catch(() => undefined);
    const timer = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(timer);
  }, [open]);

  // Walk through the widgets until the student picks one
  useEffect(() => {
    if (!open || touched) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % WIDGETS.length), 2800);
    return () => clearInterval(timer);
  }, [open, touched]);

  const pick = (i: number) => {
    setTouched(true);
    setIndex(i);
  };

  const add = async () => {
    trackAppEvent("widget_popup_add", { kind: widget.kind }).catch(() => undefined);
    const asked = await pinWidget(widget.kind);
    if (!asked) {
      // Launchers like ColorOS refuse; the steps below say how to do it by hand
      setCanPin(false);
      return;
    }
    toast.success("Confirm on the sheet and it lands on your home screen");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        className="max-w-[92vw] gap-0 overflow-hidden rounded-[28px] border-white/[0.08] p-0 sm:max-w-[400px] [&>button]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => !canClose && e.preventDefault()}
        onPointerDownOutside={(e) => !canClose && e.preventDefault()}
      >
        {/* A slice of home screen with the widget sitting on it */}
        <div className="relative flex h-[244px] items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-700 to-slate-950">
          <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-fuchsia-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-8 h-52 w-52 rounded-full bg-sky-400/25 blur-3xl" />
          <span className="absolute left-4 top-3.5 rounded-full bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
            New
          </span>
          {WIDGETS.map((w, i) => (
            <img
              key={w.kind}
              src={w.image}
              alt={i === index ? `${w.label} widget` : ""}
              draggable={false}
              className={cn(
                "absolute top-1/2 -translate-y-[44%] drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)] transition-all duration-500",
                w.small ? "h-[124px] w-[124px]" : "max-h-[176px] w-auto max-w-[86%] object-contain",
                i === index ? "scale-100 opacity-100" : "scale-95 opacity-0",
              )}
            />
          ))}
        </div>

        <div className="px-5 pt-5 text-center">
          <DialogTitle className="text-[20px] font-bold leading-tight tracking-tight">
            Your attendance, on your home screen
          </DialogTitle>
          <DialogDescription className="mt-1.5 min-h-[36px] text-[13px] leading-snug text-muted-foreground">
            {widget.text}
          </DialogDescription>

          <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-white/[0.05] p-1">
            {WIDGETS.map((w, i) => (
              <button
                key={w.kind}
                type="button"
                onClick={() => pick(i)}
                className={cn(
                  "h-9 rounded-xl text-[12.5px] font-semibold transition-colors",
                  i === index ? "bg-white/[0.12] text-white" : "text-white/50",
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 p-4">
          {canPin === false ? (
            <ol className="space-y-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left text-[12.5px]">
              {[
                "Long-press an empty spot on your home screen",
                "Tap Widgets",
                `Find Attendance IO and pick "${widget.label}"`,
              ].map((step, i) => (
                <li key={step} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          ) : (
            <button
              type="button"
              onClick={add}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-[15px] font-semibold text-background shadow-lg transition-transform active:scale-[0.98]"
            >
              <Plus className="h-[18px] w-[18px] stroke-[2.5]" />
              Add to home screen
            </button>
          )}
          <button
            type="button"
            onClick={close}
            disabled={!canClose}
            className="relative h-10 w-full overflow-hidden rounded-2xl text-[13px] font-medium text-muted-foreground transition-opacity disabled:opacity-50"
          >
            {canClose ? (canPin === false ? "Got it" : "Not now") : `Not now · ${wait}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
