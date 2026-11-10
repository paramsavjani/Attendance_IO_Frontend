import { useCallback, useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCloseOnBack } from "@/lib/backOverlay";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { canPinWidget, getWidgetCounts, pinWidget, type WidgetCounts, type WidgetKind } from "@/lib/widgetBridge";

const WIDGETS: { kind: WidgetKind; title: string; text: string; image: string; small?: boolean }[] = [
  {
    kind: "today",
    title: "Today's classes",
    text: "What's on now and next, and whether each class is marked.",
    image: "/widgets/widget_today_preview_image.png",
  },
  {
    kind: "subjects",
    title: "Subjects",
    text: "Every subject's %, with the skips you have left.",
    image: "/widgets/widget_bars_preview_image.png",
  },
  {
    kind: "mini",
    title: "Your %",
    text: "Just your overall attendance in a small ring.",
    image: "/widgets/widget_mini_preview_image.png",
    small: true,
  },
];

interface WidgetsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown once to introduce widgets, rather than opened from Profile. */
  intro?: boolean;
}

/** The home-screen widgets with a preview each, and a button that asks the launcher to add one. */
export function WidgetsSheet({ open, onOpenChange, intro = false }: WidgetsSheetProps) {
  useCloseOnBack(open, () => onOpenChange(false));
  const [canPin, setCanPin] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<WidgetCounts | null>(null);

  const refresh = useCallback(() => {
    void getWidgetCounts().then(setCounts);
  }, []);

  useEffect(() => {
    if (!open) return;
    void canPinWidget().then(setCanPin);
    refresh();
    // The launcher's confirm sheet sends the app to the background; count again when it returns
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [open, refresh]);

  const add = async (kind: WidgetKind) => {
    const asked = await pinWidget(kind);
    if (!asked) toast.error("Your launcher can't add widgets from here. Long-press your home screen and pick Widgets.");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[24px] border-border/60">
        <div className="px-4 pb-2 pt-3">
          {intro && (
            <span className="mb-2 inline-flex rounded-full bg-indigo-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-300">
              New
            </span>
          )}
          <DrawerTitle className="text-lg font-semibold">{intro ? "Your attendance, on your home screen" : "Home screen widgets"}</DrawerTitle>
          <DrawerDescription className="text-xs">
            {canPin === false
              ? "Long-press an empty spot on your home screen, tap Widgets and find Attendance IO."
              : "Tap Add and confirm, and the widget lands on your home screen. They update on their own."}
          </DrawerDescription>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-6">
          {WIDGETS.map((w) => {
            const placed = counts?.[w.kind] ?? 0;
            return (
              <div key={w.kind} className="rounded-2xl border border-border/60 bg-card/50 p-3">
                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600/50 via-violet-700/40 to-slate-900 p-4">
                  <img
                    src={w.image}
                    alt={`${w.title} widget`}
                    className={w.small ? "h-24 w-24" : "w-full max-w-[340px]"}
                    draggable={false}
                  />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{w.title}</p>
                    <p className="text-[11px] text-muted-foreground">{w.text}</p>
                  </div>
                  {canPin !== false && (
                    <button
                      type="button"
                      onClick={() => add(w.kind)}
                      className="flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-semibold text-background active:scale-[0.97]"
                    >
                      {placed > 0 ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 stroke-[2.5]" />}
                      {placed > 0 ? "Add another" : "Add"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
