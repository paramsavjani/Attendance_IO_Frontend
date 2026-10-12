import { ChevronRight, MessageSquare, SquarePen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { inboxOrder, latestReply, relativeTime, type MyFeedbackItem } from "@/lib/feedback";
import { kindOf } from "./feedbackKinds";

/**
 * Everything a student has sent. A new reply is the reason anyone opens this screen, so unread
 * threads get their own card that quotes the reply; the rest sit in one grouped list. Props only,
 * so it renders the same with sample data.
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
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-start gap-3 border-b border-white/[0.06] p-4 last:border-0">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl bg-white/[0.06]" />
            <div className="flex-1 space-y-2 pt-1">
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
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
          <MessageSquare className="h-6 w-6" />
        </div>
        <p className="text-[16px] font-semibold">Nothing sent yet</p>
        <p className="mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-muted-foreground">
          Report a bug or suggest an idea. Param reads every message, and the reply shows up here.
        </p>
        <button
          type="button"
          onClick={onCompose}
          className="mt-6 flex min-h-[46px] items-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.98]"
        >
          <SquarePen className="h-4 w-4" />
          Send feedback
        </button>
      </div>
    );
  }

  const ordered = inboxOrder(items);
  const fresh = ordered.filter((i) => i.hasUnreadReply);
  const rest = ordered.filter((i) => !i.hasUnreadReply);

  return (
    <div className="flex flex-col gap-3">
      {fresh.map((item) => (
        <NewReplyCard key={item.id} item={item} onOpen={() => onOpen(item.id)} />
      ))}

      {rest.length > 0 && (
        <section aria-label={fresh.length > 0 ? "Earlier" : "Your messages"}>
          {fresh.length > 0 && <h2 className="mb-2 mt-2 px-1 text-[13px] font-medium text-muted-foreground">Earlier</h2>}
          <ul className="overflow-hidden rounded-2xl border border-border bg-card">
            {rest.map((item) => (
              <li key={item.id} className="border-b border-white/[0.06] last:border-0">
                <InboxRow item={item} onOpen={() => onOpen(item.id)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <ComposeRow onCompose={onCompose} className="mt-1" />
    </div>
  );
}

function KindTile({ type }: { type: string }) {
  const kind = kindOf(type);
  const Icon = kind.icon;
  return (
    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", kind.tile)} aria-hidden>
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

/** An unread reply, quoted, so the student can read the gist before opening it. */
function NewReplyCard({ item, onOpen }: { item: MyFeedbackItem; onOpen: () => void }) {
  const reply = latestReply(item);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-primary/30 bg-primary/[0.07] p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:bg-primary/[0.12]"
    >
      <span className="flex items-start gap-3">
        <KindTile type={item.type} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            New reply{reply ? `, ${relativeTime(reply.createdAt)}` : ""}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-[15px] font-semibold leading-snug">{item.title}</span>
        </span>
      </span>
      {reply && (
        <span className="mt-3 block border-l-2 border-primary/60 pl-3">
          <span className="line-clamp-3 text-[13.5px] leading-[1.5] text-white/80">{reply.body}</span>
        </span>
      )}
      <span className="mt-3 flex items-center justify-end gap-0.5 text-[13px] font-semibold text-primary">
        Read reply
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );
}

function InboxRow({ item, onOpen }: { item: MyFeedbackItem; onOpen: () => void }) {
  const reply = latestReply(item);
  const when = reply ? reply.createdAt : item.createdAt;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 p-4 text-left transition-colors focus-visible:bg-white/[0.05] focus-visible:outline-none active:bg-white/[0.05]"
    >
      <KindTile type={item.type} />
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className="line-clamp-2 min-w-0 flex-1 text-[14.5px] font-semibold leading-snug text-white/90">
            {item.title}
          </span>
          <span className="shrink-0 pt-0.5 text-[11.5px] tabular-nums text-white/40">{relativeTime(when)}</span>
        </span>
        <span className="mt-1 block truncate text-[12.5px] leading-snug">
          {reply ? (
            <>
              <span className="text-white/60">Param: </span>
              <span className="text-white/45">{reply.body}</span>
            </>
          ) : (
            <span className="text-amber-400/80">Waiting for a reply</span>
          )}
        </span>
      </span>
    </button>
  );
}

/** "Send new feedback", styled as an empty slot in the list it closes. Shared with the thread. */
export function ComposeRow({ onCompose, hint, className }: { onCompose: () => void; hint?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onCompose}
      className={cn(
        "flex min-h-[60px] w-full items-center gap-3.5 rounded-2xl border border-dashed border-white/[0.12] px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:bg-white/[0.05]",
        className
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <SquarePen className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">Send new feedback</span>
        <span className="mt-0.5 block text-[11.5px] text-white/45">{hint ?? "A bug, an idea, or what you think"}</span>
      </span>
    </button>
  );
}
