import { useEffect, useMemo, useRef, useState } from "react";
import { Bug, Clock3, Lightbulb, MessageSquare, Plus, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { answeredIn, relativeTime, type MyFeedbackItem } from "@/lib/feedback";

const TYPE_META = {
  BUG: { label: "Bug", icon: Bug, tone: "bg-rose-500/15 text-rose-400" },
  FEEDBACK: { label: "Feedback", icon: MessageSquare, tone: "bg-sky-500/15 text-sky-400" },
  SUGGESTION: { label: "Idea", icon: Lightbulb, tone: "bg-amber-500/15 text-amber-400" },
} as const;

type Filter = "all" | "answered" | "waiting";

/**
 * Everything on the feedback screen below the header, driven only by props so it can be rendered
 * with sample data. [newIds] are the threads that had an unread reply when the screen opened —
 * captured before they were marked seen, so the highlight survives the read receipt.
 */
export function FeedbackThreadList({
  items,
  newIds,
  focusId,
  loading,
  onCompose,
}: {
  items: MyFeedbackItem[];
  newIds: ReadonlySet<number>;
  focusId?: number | null;
  loading: boolean;
  onCompose: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const answered = useMemo(() => items.filter((i) => i.replies.length > 0), [items]);
  const waiting = useMemo(() => items.filter((i) => i.replies.length === 0), [items]);
  const shown = filter === "answered" ? answered : filter === "waiting" ? waiting : items;

  if (loading) {
    return (
      <div className="space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[62px] rounded-2xl bg-white/[0.05]" />
          ))}
        </div>
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-[150px] rounded-2xl bg-white/[0.05]" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <p className="text-[15px] font-semibold">Nothing sent yet</p>
        <p className="mx-auto mt-1.5 max-w-[30ch] text-[12.5px] leading-relaxed text-white/45">
          Found a bug or have an idea? Send it here and the reply lands right on this screen.
        </p>
        <button
          type="button"
          onClick={onCompose}
          className="mx-auto mt-5 flex min-h-[44px] items-center gap-2 rounded-2xl bg-primary px-5 text-[13.5px] font-semibold text-primary-foreground active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Send feedback
        </button>
      </div>
    );
  }

  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: items.length },
    { key: "answered", label: "Answered", count: answered.length },
    { key: "waiting", label: "Waiting", count: waiting.length },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat value={items.length} label="sent" />
        <Stat value={answered.length} label="answered" accent />
        <Stat value={waiting.length} label="waiting" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5" role="tablist" aria-label="Filter feedback">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            role="tab"
            aria-selected={filter === chip.key}
            onClick={() => setFilter(chip.key)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors",
              filter === chip.key ? "bg-primary/20 text-foreground ring-1 ring-primary/35" : "bg-white/[0.05] text-white/55"
            )}
          >
            {chip.label} <span className="tabular-nums text-white/40">{chip.count}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-[12.5px] text-white/40">
          {filter === "waiting" ? "Everything you sent has a reply." : "No replies yet. They usually come within a few days."}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((item) => (
            <FeedbackCard key={item.id} item={item} isNew={newIds.has(item.id)} focused={focusId === item.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
      <div className={cn("text-[20px] font-bold leading-none tabular-nums", accent ? "text-primary" : "text-white")}>{value}</div>
      <div className="mt-1 text-[11px] text-white/45">{label}</div>
    </div>
  );
}

const CLAMP_AT = 160;

function FeedbackCard({ item, isNew, focused }: { item: MyFeedbackItem; isNew: boolean; focused: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [flash, setFlash] = useState(false);
  const meta = TYPE_META[item.type] ?? TYPE_META.FEEDBACK;
  const Icon = meta.icon;
  const hasReply = item.replies.length > 0;
  const long = item.description.length > CLAMP_AT;
  const took = answeredIn(item);

  // Opened from the "you got a reply" dialog: bring this thread into view and pulse it once.
  useEffect(() => {
    if (!focused || !ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1600);
    return () => clearTimeout(t);
  }, [focused]);

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border p-4 transition-all duration-500",
        isNew ? "border-primary/40 bg-primary/[0.06]" : "border-white/[0.07] bg-white/[0.035]",
        flash && "ring-2 ring-primary/60"
      )}
    >
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10.5px] font-semibold", meta.tone)}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        {isNew ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/20 px-2 py-0.5 text-[10.5px] font-semibold text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            New reply
          </span>
        ) : hasReply ? (
          <span className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-400">Answered</span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.06] px-2 py-0.5 text-[10.5px] font-semibold text-white/50">
            <Clock3 className="h-3 w-3" />
            Waiting
          </span>
        )}
        <span className="ml-auto text-[11px] text-white/35">{relativeTime(item.createdAt)}</span>
      </div>

      <p className="text-[14px] font-semibold leading-snug">{item.title}</p>
      <p className={cn("mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/50", long && !expanded && "line-clamp-3")}>
        {item.description}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[11.5px] font-medium text-white/55 active:text-white/80"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {hasReply && (
        <div className="mt-3.5 space-y-2.5 border-t border-white/[0.06] pt-3.5">
          {item.replies.map((reply) => (
            <div key={reply.id} className="flex gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                P
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold">Param</span>
                  <span className="rounded bg-primary/15 px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide text-primary">
                    Owner
                  </span>
                  <span className="ml-auto text-[10.5px] text-white/35">{relativeTime(reply.createdAt)}</span>
                </div>
                <div className="rounded-xl rounded-tl-sm bg-white/[0.06] px-3 py-2.5">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/85">{reply.body}</p>
                </div>
              </div>
            </div>
          ))}
          {took && (
            <p className="flex items-center gap-1 pl-[38px] text-[10.5px] text-white/35">
              <Sparkles className="h-3 w-3" />
              Answered {took}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
