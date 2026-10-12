import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { FeedbackComposer } from "@/components/feedback/FeedbackComposer";
import { FeedbackThreadList } from "@/components/feedback/FeedbackThreadList";
import { fetchMyFeedback, markFeedbackSeen, type MyFeedbackItem } from "@/lib/feedback";

export default function MyFeedback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focusId = Number(params.get("focus")) || null;

  const [items, setItems] = useState<MyFeedbackItem[]>([]);
  const [newIds, setNewIds] = useState<ReadonlySet<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);

  const load = useCallback(async (markRead: boolean) => {
    const mine = await fetchMyFeedback();
    setItems(mine.items);
    setLoading(false);
    if (!markRead) return;
    // Remember which threads were new *before* clearing them, so they stay highlighted while
    // the student is looking at them, then tell the server they have been read.
    const unread = mine.items.filter((i) => i.hasUnreadReply);
    setNewIds(new Set(unread.map((i) => i.id)));
    await Promise.all(unread.map((i) => markFeedbackSeen(i.id)));
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/[0.06] bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] active:bg-white/[0.1]"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[16px] font-semibold leading-tight">Your feedback</h1>
          <p className="text-[11.5px] text-white/45">Replies from the person who builds this app</p>
        </div>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary/15 px-3 text-[12.5px] font-semibold text-primary ring-1 ring-primary/30 active:bg-primary/25"
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>

      <div className="px-4 pt-3.5">
        <FeedbackThreadList
          items={items}
          newIds={newIds}
          focusId={focusId}
          loading={loading}
          onCompose={() => setComposing(true)}
        />
      </div>

      <FeedbackComposer open={composing} onOpenChange={setComposing} onSent={() => void load(false)} />
    </div>
  );
}
