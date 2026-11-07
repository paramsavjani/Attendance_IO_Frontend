import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { PollReportReason, ReportPollPayload } from "@/types/poll";
import { toast } from "sonner";

interface ReportPollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  pollTitle: string;
  authorName: string;
  onReport: (payload: ReportPollPayload) => Promise<void>;
}

const REPORT_REASONS: { value: PollReportReason; label: string; description: string }[] = [
  {
    value: "SPAM",
    label: "Spam or Repetitive",
    description: "Pointless, duplicate, or flood of useless polls",
  },
  {
    value: "MISLEADING_OR_IRRELEVANT",
    label: "Irrelevant to Subject",
    description: "Has nothing to do with the course syllabus, lecture or class",
  },
  {
    value: "OFFENSIVE_CONTENT",
    label: "Offensive or Inappropriate",
    description: "Abusive, vulgar, or inappropriate questions/options",
  },
  {
    value: "HARASSMENT",
    label: "Targeted Harassment",
    description: "Targeting a student, professor, or group",
  },
  {
    value: "OTHER",
    label: "Other Issue",
    description: "Other violation of community guidelines",
  },
];

export function ReportPollDialog({
  open,
  onOpenChange,
  pollId,
  pollTitle,
  authorName,
  onReport,
}: ReportPollDialogProps) {
  const [reason, setReason] = useState<PollReportReason>("SPAM");
  const [details, setDetails] = useState("");
  const [reportAuthor, setReportAuthor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onReport({
        pollId,
        reason,
        details: details.trim() || undefined,
        reportAuthorAsSpammer: reportAuthor,
      });
      toast.success("Report submitted. Thank you for keeping our community clean.");
      onOpenChange(false);
      setDetails("");
      setReportAuthor(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md p-0 overflow-hidden rounded-2xl bg-card border-border shadow-2xl">
        <div className="bg-gradient-to-r from-destructive/20 via-destructive/10 to-transparent p-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
              <ShieldAlert className="w-4 h-4" />
              Report Poll / Spam Protection
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            Reporting: <span className="text-foreground font-medium">"{pollTitle}"</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Select reason</Label>
            <RadioGroup
              value={reason}
              onValueChange={(val) => setReason(val as PollReportReason)}
              className="space-y-2"
            >
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex items-start gap-2.5 p-2 rounded-xl border border-border/60 hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-foreground">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground">{r.description}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-details" className="text-xs font-semibold text-muted-foreground">
              Additional context (Optional)
            </Label>
            <Textarea
              id="report-details"
              placeholder="Why should this poll be removed?"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              className="text-xs bg-background/50 resize-none"
              maxLength={200}
            />
          </div>

          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-start gap-2.5">
            <Checkbox
              id="report-user"
              checked={reportAuthor}
              onCheckedChange={(checked) => setReportAuthor(checked === true)}
              className="mt-0.5"
            />
            <label htmlFor="report-user" className="text-xs cursor-pointer">
              <span className="font-semibold text-foreground">Flag {authorName} for persistent spam</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Students with multiple spam reports will have their poll creation throttled.
              </p>
            </label>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="flex-1 text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting}
              className="flex-1 text-xs h-9 rounded-xl font-medium"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
