import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bug, Lightbulb, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchMyFeedback,
  formatFeedbackDate,
  markFeedbackSeen,
  type MyFeedbackItem,
} from "@/lib/feedback";

const TYPE_META = {
  BUG: { label: "Bug", icon: Bug, tone: "bg-rose-500/12 text-rose-400" },
  FEEDBACK: { label: "Feedback", icon: MessageSquare, tone: "bg-sky-500/12 text-sky-400" },
  SUGGESTION: { label: "Suggestion", icon: Lightbulb, tone: "bg-amber-500/12 text-amber-400" },
} as const;

export default function MyFeedback() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MyFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const mine = await fetchMyFeedback();
      if (!active) return;
      setItems(mine.items);
      setLoading(false);
      // Opening this screen is the student reading their replies, so clear the badges.
      await Promise.all(mine.items.filter((i) => i.hasUnreadReply).map((i) => markFeedbackSeen(i.id)));
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/[0.06] bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] active:bg-white/[0.1]"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold">Your feedback</h1>
          <p className="text-[11.5px] text-white/45">
            {loading ? "Loading…" : items.length === 0 ? "Nothing sent yet" : `${items.length} sent`}
          </p>
        </div>
      </div>

      <div className="px-4 pt-3">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white/30" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-7 w-7 text-white/25" />
            <p className="text-[13.5px] font-medium">No feedback yet</p>
            <p className="mx-auto mt-1 max-w-[30ch] text-[12px] leading-relaxed text-white/45">
              Report a bug or send a suggestion from your profile and the reply shows up here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <FeedbackCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackCard({ item }: { item: MyFeedbackItem }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.FEEDBACK;
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-semibold", meta.tone)}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        {item.replies.length > 0 ? (
          <span className="rounded-lg bg-emerald-500/12 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-400">
            Answered
          </span>
        ) : (
          <span className="rounded-lg bg-white/[0.06] px-2 py-0.5 text-[10.5px] font-semibold text-white/50">
            Waiting for a reply
          </span>
        )}
        <span className="ml-auto text-[11px] text-white/35">{formatFeedbackDate(item.createdAt)}</span>
      </div>

      <p className="text-[13.5px] font-semibold leading-snug">{item.title}</p>
      <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-white/50">{item.description}</p>

      {item.replies.map((reply) => (
        <div key={reply.id} className="mt-3 flex gap-2.5">
          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
            P
          </span>
          <div className="min-w-0 flex-1">
            <div className="rounded-xl rounded-tl-sm bg-primary/[0.12] px-3 py-2">
              <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/85">{reply.body}</p>
            </div>
            <p className="mt-1 text-[10.5px] text-white/35">
              Param · owner · {formatFeedbackDate(reply.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
