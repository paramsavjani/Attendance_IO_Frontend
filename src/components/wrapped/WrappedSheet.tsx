import { useEffect, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Download, Loader2, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { useCloseOnBack } from "@/lib/backOverlay";
import { useAuth } from "@/contexts/AuthContext";
import { useAttendance } from "@/contexts/AttendanceContext";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { summarize } from "@/lib/wrapped";
import { CARD_HEIGHT, CARD_WIDTH, drawWrappedCard } from "./drawWrappedCard";

interface WrappedSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Semester = { year: number; type: string };
type Classwide = { averageAttendance?: number; ranges?: { range: string; count: number }[] };

/** The student's semester on one shareable card. */
export function WrappedSheet({ open, onOpenChange }: WrappedSheetProps) {
  const { student } = useAuth();
  const { enrolledSubjects, subjectStatsToday, subjectStats } = useAttendance();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [classwide, setClasswide] = useState<Classwide | null>(null);
  const [ready, setReady] = useState(false);
  const [sharing, setSharing] = useState(false);

  useCloseOnBack(open, () => onOpenChange(false));

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setReady(false);
    Promise.all([
      fetch(API_CONFIG.ENDPOINTS.SEMESTER_CURRENT).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      authenticatedFetch(API_CONFIG.ENDPOINTS.ANALYTICS_CURRENT).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      document.fonts?.load(`800 100px Outfit`).catch(() => undefined),
      document.fonts?.load(`500 30px Outfit`).catch(() => undefined),
    ]).then(([sem, analytics]) => {
      if (cancelled) return;
      setSemester(sem ?? null);
      setClasswide(analytics?.analytics ?? null);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const summary = useMemo(() => {
    const stats = Object.keys(subjectStatsToday).length > 0 ? subjectStatsToday : subjectStats;
    const subjects = enrolledSubjects
      .filter((s) => stats[s.id])
      .map((s) => ({ name: s.name, code: s.code, present: stats[s.id].present, total: stats[s.id].total }));
    return summarize(subjects, semester, classwide);
  }, [enrolledSubjects, subjectStatsToday, subjectStats, semester, classwide]);

  const firstName = (student?.name || "My").split(" ")[0];

  useEffect(() => {
    if (open && ready && canvasRef.current) drawWrappedCard(canvasRef.current, summary, firstName);
  }, [open, ready, summary, firstName]);

  const share = async (mode: "share" | "save") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSharing(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Couldn't create the image");
      const file = new File([blob], "attendance-io-wrapped.png", { type: "image/png" });

      if (mode === "share" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `My ${summary.semesterLabel} on Attendance IO` });
        return;
      }
      if (Capacitor.isNativePlatform()) {
        // The Android WebView has no Web Share or downloads; native sharing comes with the next app release
        toast.info("Sharing from the app arrives in the next update. Take a screenshot for now!");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return; // share sheet dismissed
      toast.error(error instanceof Error ? error.message : "Couldn't share the image");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto flex h-[92dvh] w-full max-w-lg flex-col rounded-t-[24px] border-border/60">
        <div className="px-4 pb-3 pt-3">
          <DrawerTitle className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            Your semester, wrapped
          </DrawerTitle>
          <DrawerDescription className="text-xs">Share it on your story, or keep it for yourself.</DrawerDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <div className="relative overflow-hidden rounded-2xl border border-border/60" style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }}>
            <canvas ref={canvasRef} className="block h-full w-full" aria-label={`${summary.semesterLabel} attendance card`} />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-5 pt-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
          <Button variant="outline" className="h-11 flex-1 rounded-xl" disabled={!ready || sharing} onClick={() => share("save")}>
            <Download className="mr-1.5 h-4 w-4" /> Save
          </Button>
          <Button className="h-11 flex-[2] rounded-xl font-semibold" disabled={!ready || sharing} onClick={() => share("share")}>
            {sharing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Share2 className="mr-1.5 h-4 w-4" />}
            Share
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
