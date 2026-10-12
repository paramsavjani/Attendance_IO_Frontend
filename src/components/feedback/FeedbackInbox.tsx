import { MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { inboxOrder, latestReply, relativeTime, type MyFeedbackItem } from "@/lib/feedback";
import { kindOf } from "./feedbackKinds";

/**
 * The list of everything a student has sent, read like a messages inbox: one grouped surface,
 * a row per thread, unread replies first. Props only, so it renders the same with sample data.
 */
export function FeedbackInbox({
  items,
  loading,
  onOpen,
  onCompose,
}: {
  items: MyFeedbackItem[];
  loading: boolean;
  onOpen: (id: number) => void;
  onCompose: () => void;
}) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-3.5 last:border-0">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-white/[0.06]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/5 bg-white/[0.06]" />
              <Skeleton className="h-3 w-4/5 bg-white/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-card px-6 pb-7 pt-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <p className="text-[15px] font-semibold">No feedback yet</p>
        <p className="mx-auto mt-1.5 max-w-[28ch] text-[13px] leading-relaxed text-white/50">
          Report a bug or suggest an idea, and Param's reply shows up right here.
        </p>
        <button
          type="button"
          onClick={onCompose}
          className="mt-5 min-h-[44px] rounded-xl bg-primary px-5 text-[14px] font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:opacity-90"
        >
          Send feedback
        </button>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
      {inboxOrder(items).map((item) => (
        <li key={item.id} className="border-b border-white/[0.06] last:border-0">
          <InboxRow item={item} onOpen={() => onOpen(item.id)} />
        </li>
      ))}
    </ul>
  );
}

function InboxRow({ item, onOpen }: { item: MyFeedbackItem; onOpen: () => void }) {
  const kind = kindOf(item.type);
  const Icon = kind.icon;
  const reply = latestReply(item);
  const unread = item.hasUnreadReply;
  const when = reply ? reply.createdAt : item.createdAt;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 px-3.5 py-3.5 text-left transition-colors focus-visible:bg-white/[0.05] focus-visible:outline-none active:bg-white/[0.05]"
    >
      <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", kind.glyph)}>
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[15px] leading-snug",
              unread ? "font-semibold text-white" : "font-medium text-white/85"
            )}
          >
            {item.title}
          </span>
          <span className={cn("shrink-0 text-[11.5px] tabular-nums", unread ? "text-primary" : "text-white/40")}>
            {relativeTime(when)}
          </span>
        </span>

        <span className="mt-1 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[12.5px] leading-snug">
            {reply ? (
              <>
                <span className={unread ? "text-white/80" : "text-white/55"}>Param: </span>
                <span className={unread ? "text-white/65" : "text-white/40"}>{reply.body}</span>
              </>
            ) : (
              <span className="text-white/35">Waiting for a reply</span>
            )}
          </span>
          {unread && <span aria-label="New reply" className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </span>
      </span>
    </button>
  );
}
