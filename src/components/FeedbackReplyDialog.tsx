import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquareReply } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fetchMyFeedback, markFeedbackSeen, type MyFeedbackItem } from "@/lib/feedback";

/**
 * Shown once per reply, on app open, when the owner has answered something the student sent.
 *
 * Deliberately not part of ServerPopup: that reads a single global popups.json for everybody,
 * and a reply belongs to one student. The localStorage guard is the same idea though — keyed on
 * the reply id, so a given answer interrupts the student exactly once per device even if the
 * server still reports it unread.
 */
const SEEN_PREFIX = "aio_feedback_reply_";

function alreadyShown(replyId: number): boolean {
  try {
    return localStorage.getItem(SEEN_PREFIX + replyId) === "1";
  } catch {
    return false;
  }
}

function rememberShown(replyId: number): void {
  try {
    localStorage.setItem(SEEN_PREFIX + replyId, "1");
  } catch {
    // private window or blocked storage: worst case the dialog shows again next launch
  }
}

export function FeedbackReplyDialog() {
  const navigate = useNavigate();
  const [item, setItem] = useState<MyFeedbackItem | null>(null);
  const [open, setOpen] = useState(false);
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current) return; // StrictMode mounts twice in dev
    asked.current = true;

    let active = true;
    const timer = setTimeout(async () => {
      const mine = await fetchMyFeedback();
      const unread = mine.latestUnread;
      const latestReply = unread?.replies[unread.replies.length - 1];
      if (!active || !unread || !latestReply || alreadyShown(latestReply.id)) return;
      rememberShown(latestReply.id);
      setItem(unread);
      setOpen(true);
    }, 1200); // let the dashboard paint first

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  const latestReply = item?.replies[item.replies.length - 1];
  if (!item || !latestReply) return null;

  function dismiss() {
    setOpen(false);
    void markFeedbackSeen(item!.id);
  }

  function read() {
    setOpen(false);
    void markFeedbackSeen(item!.id);
    navigate("/my-feedback");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="max-w-[92vw] rounded-[28px] border border-white/10 bg-card p-0 sm:max-w-sm [&>button]:hidden">
        <div className="px-6 pt-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/25">
            <MessageSquareReply className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-[20px] font-bold leading-tight tracking-tight">
            You got a reply
          </DialogTitle>
          <DialogDescription className="mx-auto mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-muted-foreground">
            Param replied to “{item.title}”
          </DialogDescription>
        </div>

        <div className="px-5 pt-4">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
            <p className="line-clamp-4 whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/75">
              {latestReply.body}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 px-5 pb-5 pt-4">
          <button
            type="button"
            onClick={read}
            className="min-h-[44px] rounded-2xl bg-primary text-[14px] font-semibold text-primary-foreground active:scale-[0.99]"
          >
            Read it
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="min-h-[40px] rounded-2xl text-[13px] text-white/50 active:bg-white/[0.05]"
          >
            Later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
