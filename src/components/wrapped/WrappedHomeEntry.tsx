import { useEffect, useState } from "react";
import { parseISO } from "date-fns";
import { ChevronRight, Sparkles } from "lucide-react";
import { API_CONFIG } from "@/lib/api";
import { isWrappedSeason } from "@/lib/wrapped";
import { WrappedSheet } from "./WrappedSheet";

/** Home card that appears around the end of the semester and opens the Wrapped card. */
export function WrappedHomeEntry() {
  const [classesEnd, setClassesEnd] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(API_CONFIG.ENDPOINTS.CLASSES_END_DATE, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.endDate && setClassesEnd(parseISO(data.endDate)))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (!isWrappedSeason(classesEnd)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-indigo-400/30 bg-gradient-to-r from-indigo-500/20 via-violet-500/10 to-transparent px-3 py-2.5 text-left transition-colors active:bg-muted/60"
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/25">
          <Sparkles className="h-4 w-4 text-indigo-300" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Your semester, wrapped</span>
          <span className="block truncate text-[11px] text-muted-foreground">Your attendance story, ready to share</span>
        </span>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      </button>
      <WrappedSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
