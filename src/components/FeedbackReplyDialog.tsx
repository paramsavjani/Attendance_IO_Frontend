import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquareReply } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  answeredIn,
  fetchMyFeedback,
  latestReply,
  markFeedbackSeen,
  type MyFeedbackItem,
} from "@/lib/feedback";

/**
 * Shown once per reply, on app open, when the owner has answered something the student sent.
 *
 * Deliberately not part of ServerPopup: that reads a single global popups.json for everybody,
 * and a reply belongs to one student. It does share ServerPopup's look, so the two read as the
 * same family. The localStorage guard is keyed on the reply id, so one answer interrupts the
 * student exactly once per device even if the server still reports it unread.
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
  const [others, setOthers] = useState(0);
  const [open, setOpen] = useState(false);
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current) return; // StrictMode mounts twice in dev
    asked.current = true;

    let active = true;
    const timer = setTimeout(async () => {
      const mine = await fetchMyFeedback();
      const unread = mine.latestUnread;
      const reply = unread ? latestReply(unread) : undefined;
      if (!active || !unread || !reply || alreadyShown(reply.id)) return;
      rememberShown(reply.id);
      setItem(unread);
      setOthers(Math.max(0, mine.unreadCount - 1));
      setOpen(true);
    }, 1200); // let the dashboard paint first

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  if (!item) return null;

  function later() {
    setOpen(false);
    void markFeedbackSeen(item!.id);
  }

  function read() {
    setOpen(false);
    // The feedback screen marks it seen itself, after it has captured it as "new".
    navigate(`/my-feedback?focus=${item!.id}`);
  }

  return <FeedbackReplyCard item={item} others={others} open={open} onRead={read} onLater={later} />;
}

/** The dialog itself, props only, so it can be rendered with sample data. */
export function FeedbackReplyCard({
  item,
  others,
  open,
  onRead,
  onLater,
}: {
  item: MyFeedbackItem;
  others: number;
  open: boolean;
  onRead: () => void;
  onLater: () => void;
}) {
  const reply = latestReply(item);
  const took = answeredIn(item);
  if (!reply) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onLater()}>
      <DialogContent className="w-[92vw] max-w-[360px] gap-0 rounded-[20px] border-[0.5px] border-white/10 bg-[#1a1a19] p-0 text-[#f0efec] shadow-none [&>button]:hidden">
        <div className="px-5 pb-3 pt-5 text-center">
          <div className="mx-auto mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#032042]">
            <MessageSquareReply className="h-7 w-7 text-[#6da7ec]" />
          </div>
          <DialogTitle className="text-[18px] font-medium leading-tight">You got a reply</DialogTitle>
          <DialogDescription className="mx-auto mt-1.5 max-w-[29ch] text-[12.5px] leading-[1.5] text-[#c3c2b7]">
            Param answered your feedback{took ? ` ${took}` : ""}.
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-1.5 px-3.5 pt-1">
          <div className="rounded-lg bg-[#151515] px-3 py-2.5 text-left">
            <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#898781]">You asked</p>
            <p className="mt-1 text-[12.5px] font-medium leading-snug">{item.title}</p>
          </div>
          <div className="rounded-lg bg-[#032042] px-3 py-2.5 text-left">
            <p className="text-[10.5px] font-medium uppercase tracking-wide text-[#6da7ec]">Param · owner</p>
            <p className="mt-1 line-clamp-5 whitespace-pre-wrap text-[12.5px] leading-[1.5] text-[#f0efec]">{reply.body}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 p-3.5">
          <button
            type="button"
            onClick={onRead}
            className="min-h-[44px] w-full rounded-lg bg-[#f0efec] text-[13px] font-medium text-[#0b0b0b] active:scale-[0.98]"
          >
            {others > 0 ? `Read it, and ${others} more` : "Read it"}
          </button>
          <button
            type="button"
            onClick={onLater}
            className="min-h-[36px] w-full text-[12px] text-[#898781] active:text-[#c3c2b7]"
          >
            Later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
