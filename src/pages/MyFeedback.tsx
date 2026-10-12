import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, SquarePen } from "lucide-react";
import { FeedbackComposer } from "@/components/feedback/FeedbackComposer";
import { FeedbackInbox } from "@/components/feedback/FeedbackInbox";
import { FeedbackThread } from "@/components/feedback/FeedbackThread";
import { kindOf } from "@/components/feedback/feedbackKinds";
import {
  FEEDBACK_READ_EVENT,
  fetchMyFeedback,
  formatFeedbackDate,
  markFeedbackSeen,
  type MyFeedbackItem,
} from "@/lib/feedback";

/**
 * /my-feedback is the inbox; /my-feedback/:id is one conversation. A thread is marked read when
 * it is opened, not when the inbox is, so the unread dot means what it does in any messages app.
 */
export default function MyFeedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const threadId = id ? Number(id) : null;

  const [items, setItems] = useState<MyFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [newReplyIn, setNewReplyIn] = useState<number | null>(null);
  const marked = useRef<Set<number>>(new Set());

  const load = useCallback(async () => {
    const mine = await fetchMyFeedback();
    setItems(mine.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const thread = threadId ? items.find((i) => i.id === threadId) ?? null : null;

  // Opening a thread reads it. Capture "was new" first so the reply can still ease in.
  useEffect(() => {
    if (!thread || marked.current.has(thread.id)) return;
    marked.current.add(thread.id);
    if (thread.hasUnreadReply) {
      setNewReplyIn(thread.id);
      void markFeedbackSeen(thread.id).then(() => {
        setItems((prev) => prev.map((i) => (i.id === thread.id ? { ...i, hasUnreadReply: false } : i)));
        window.dispatchEvent(new Event(FEEDBACK_READ_EVENT));
      });
    }
  }, [thread]);

  const fromInbox = (location.state as { fromInbox?: boolean } | null)?.fromInbox === true;
  const back = () => {
    if (threadId) {
      if (fromInbox) navigate(-1);
      else navigate("/my-feedback", { replace: true });
    } else {
      navigate(-1);
    }
  };

  const afterSend = () => {
    void load();
    if (threadId) navigate("/my-feedback", { replace: true });
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={back}
          aria-label={threadId ? "Back to your feedback" : "Back"}
          className="shrink-0 rounded-xl border border-border bg-card p-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {threadId ? (
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="line-clamp-2 text-[17px] font-semibold leading-snug">
              {thread?.title ?? (loading ? "" : "Feedback")}
            </h1>
            {thread && (
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {kindOf(thread.type).noun}, sent {formatFeedbackDate(thread.createdAt)}
              </p>
            )}
          </div>
        ) : (
          <>
            <h1 className="min-w-0 flex-1 pt-1 text-xl font-bold leading-tight">Your feedback</h1>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setComposing(true)}
                aria-label="Send feedback"
                className="shrink-0 rounded-xl border border-border bg-card p-2 text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <SquarePen className="h-5 w-5" />
              </button>
            )}
          </>
        )}
      </div>

      {threadId ? (
        loading ? null : thread ? (
          <FeedbackThread item={thread} isNew={newReplyIn === thread.id} onCompose={() => setComposing(true)} />
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-card px-5 py-8 text-center">
            <p className="text-[14px] font-medium">This feedback isn't available</p>
            <button
              type="button"
              onClick={() => navigate("/my-feedback", { replace: true })}
              className="mt-4 min-h-[42px] rounded-xl border border-white/10 px-4 text-[13.5px] font-medium active:bg-white/[0.05]"
            >
              See all your feedback
            </button>
          </div>
        )
      ) : (
        <>
          <p className="-mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Param reads every message and replies here.
          </p>
          <FeedbackInbox
            items={items}
            loading={loading}
            onOpen={(openId) => navigate(`/my-feedback/${openId}`, { state: { fromInbox: true } })}
            onCompose={() => setComposing(true)}
          />
        </>
      )}

      <FeedbackComposer open={composing} onOpenChange={setComposing} onSent={afterSend} />
    </div>
  );
}
