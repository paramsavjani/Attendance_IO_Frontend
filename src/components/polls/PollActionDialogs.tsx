import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Poll, PollReportReason } from "@/types/poll";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const REPORT_REASONS: { value: PollReportReason; label: string; hint: string }[] = [
  { value: "SPAM", label: "Spam", hint: "Repeated, pointless or advertising" },
  { value: "OFFENSIVE", label: "Offensive", hint: "Rude, hateful or harassing" },
  { value: "MISLEADING", label: "Misleading", hint: "False or meant to confuse the class" },
  { value: "OTHER", label: "Something else", hint: "Doesn't belong in this class" },
];

interface PollActionDialogsProps {
  reporting: Poll | null;
  deleting: Poll | null;
  onDismissReport: () => void;
  onDismissDelete: () => void;
  onReport: (poll: Poll, reason: PollReportReason) => void;
  onDelete: (poll: Poll) => void;
}

/** Confirmations for reporting a classmate's poll and deleting your own. */
export function PollActionDialogs({
  reporting,
  deleting,
  onDismissReport,
  onDismissDelete,
  onReport,
  onDelete,
}: PollActionDialogsProps) {
  const [reportReason, setReportReason] = useState<PollReportReason>("SPAM");

  useEffect(() => {
    if (reporting) setReportReason("SPAM");
  }, [reporting]);

  return (
    <>
      <AlertDialog open={reporting !== null} onOpenChange={(o) => !o && onDismissReport()}>
        <AlertDialogContent className="max-w-[92vw] rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Report this poll?</AlertDialogTitle>
            <AlertDialogDescription>
              It's hidden from the class once a few classmates report it. The person who asked won't see who reported.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5" role="radiogroup" aria-label="Reason">
            {REPORT_REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={reportReason === r.value}
                onClick={() => setReportReason(r.value)}
                className={cn(
                  "flex w-full flex-col rounded-xl border px-3 py-2 text-left transition-colors",
                  reportReason === r.value ? "border-foreground bg-secondary/60" : "border-border",
                )}
              >
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="text-[11px] text-muted-foreground">{r.hint}</span>
              </button>
            ))}
          </div>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => reporting && onReport(reporting, reportReason)}
            >
              Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && onDismissDelete()}>
        <AlertDialogContent className="max-w-[92vw] rounded-2xl sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this poll?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears for everyone in {deleting?.subject.name} along with its votes. To stop voting but keep the
              results, end it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="mt-0 flex-1">Keep</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleting && onDelete(deleting)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
