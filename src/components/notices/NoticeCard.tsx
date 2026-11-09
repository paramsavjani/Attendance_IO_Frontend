import { useState } from "react";
import { UrgentNotice } from "@/types/notice";
import { Subject } from "@/types/attendance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Flag, Ban, HelpCircle, FileCheck2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface NoticeCardProps {
  notice: UrgentNotice;
  /** The enrolled subject the notice is about, so the card can say which class it means. */
  subject?: Subject;
  onDismiss: (noticeId: string) => void;
  onReport: (notice: UrgentNotice) => void;
}

export function NoticeCard({ notice, subject, onDismiss, onReport }: NoticeCardProps) {
  const [isDismissing, setIsDismissing] = useState(false);

  const getTypeIcon = () => {
    switch (notice.noticeType) {
      case "CANCELLED_LECTURE":
        return <Ban className="w-3.5 h-3.5 text-red-500" />;
      case "QUIZ":
        return <HelpCircle className="w-3.5 h-3.5 text-amber-500" />;
      case "MARKS":
        return <FileCheck2 className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-primary" />;
    }
  };

  const getTypeBadge = () => {
    switch (notice.noticeType) {
      case "CANCELLED_LECTURE":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "QUIZ":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "MARKS":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getCardTone = () => {
    switch (notice.noticeType) {
      case "CANCELLED_LECTURE":
        return "border-red-500/30 from-red-500/10";
      case "QUIZ":
        return "border-amber-500/30 from-amber-500/10";
      case "MARKS":
        return "border-blue-500/30 from-blue-500/10";
      default:
        return "border-primary/30 from-primary/10";
    }
  };

  const subjectName = subject?.name ?? notice.subjectName;
  const subjectCode = subject?.code ?? notice.subjectCode;

  const handleGotIt = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss(notice.id);
    }, 200);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-r via-background to-background p-3.5 shadow-sm transition-all duration-300 relative overflow-hidden",
        getCardTone(),
        isDismissing && "opacity-0 scale-95"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className={cn("text-[10px] py-0 px-2 h-5 font-semibold gap-1 min-w-0", getTypeBadge())}>
          {getTypeIcon()}
          <span className="truncate">
            {subjectName ?? "Urgent notice"}
            {subjectCode && <span className="opacity-70"> · {subjectCode}</span>}
          </span>
        </Badge>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
          <Clock className="w-3 h-3" />
          <span>{formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mt-2.5 space-y-1">
        <h4 className="text-sm font-semibold text-foreground leading-tight">{notice.title}</h4>
        <p className="text-xs text-muted-foreground leading-snug">{notice.message}</p>
      </div>

      {/* Footer info & Got it action */}
      <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
        <div className="text-[10px] text-muted-foreground truncate">
          Posted by <span className="font-medium text-foreground">{notice.createdBy.name}</span>
          {notice.createdBy.sid && ` (${notice.createdBy.sid})`}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onReport(notice)}
            className="h-7 text-[10px] px-2 text-muted-foreground hover:text-destructive gap-1"
          >
            <Flag className="w-3 h-3" /> Report
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleGotIt}
            className="h-7 text-[10px] px-2.5 rounded-lg font-semibold bg-foreground/10 hover:bg-foreground/20 text-foreground gap-1"
          >
            <Check className="w-3 h-3 stroke-[3]" /> Got it
          </Button>
        </div>
      </div>
    </div>
  );
}

