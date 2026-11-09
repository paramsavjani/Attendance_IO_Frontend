import { useState } from "react";
import { UrgentNotice } from "@/types/notice";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Flag, Ban, HelpCircle, FileCheck2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface NoticeCardProps {
  notice: UrgentNotice;
  onDismiss: (noticeId: string) => void;
  onReport: (notice: UrgentNotice) => void;
}

export function NoticeCard({ notice, onDismiss, onReport }: NoticeCardProps) {
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

  const handleGotIt = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss(notice.id);
    }, 200);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-background to-background p-3.5 shadow-sm transition-all duration-300 relative overflow-hidden",
        isDismissing && "opacity-0 scale-95"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] py-0 px-2 h-5 font-semibold gap-1", getTypeBadge())}>
            {getTypeIcon()}
            {notice.noticeType === "CANCELLED_LECTURE"
              ? "Cancelled Lecture"
              : notice.noticeType === "QUIZ"
              ? "Surprise Quiz"
              : notice.noticeType === "MARKS"
              ? "Marks"
              : "Urgent Update"}
          </Badge>
          {notice.subjectCode && (
            <span className="text-[11px] font-bold text-foreground">
              · {notice.subjectCode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatDistanceToNow(new Date(notice.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mt-2 space-y-1">
        <h4 className="text-xs font-bold text-foreground">{notice.title}</h4>
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
