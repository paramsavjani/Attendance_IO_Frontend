import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComposeRow } from "./FeedbackInbox";
import { formatFeedbackDate, laterThan, type MyFeedbackItem } from "@/lib/feedback";

/**
 * One feedback thread, read as a ticket and what happened to it: the student's message as a card,
 * then a rail down to each of Param's replies (or to "waiting"). Not chat bubbles, because the
 * student cannot answer back here and bubbles promise that they can.
 *
 * [isNew] is true when the newest reply had not been read when the screen opened; only then does
 * it ease in, so the motion marks what changed.
 */
export function FeedbackThread({
  item,
  isNew,
  onCompose,
}: {
  item: MyFeedbackItem;
  isNew: boolean;
  onCompose: () => void;
}) {
  const replies = item.replies;

  return (
    <div className="flex flex-col">
      <article className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-[17px] font-semibold leading-snug">{item.title}</h2>
        <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-[1.55] text-white/70">{item.description}</p>
      </article>

      <ol className="relative mt-1">
        {replies.map((reply, index) => {
          const last = index === replies.length - 1;
          const meta =
            index === 0
              ? `Param replied ${laterThan(item.createdAt, reply.createdAt) ?? formatFeedbackDate(reply.createdAt)}`
              : `Param, ${formatFeedbackDate(reply.createdAt)}`;
          return (
            <li
              key={reply.id}
              className={cn(
                "relative pl-11 pt-5",
                last && isNew && "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:delay-200"
              )}
            >
              <Rail end={last} />
              <span
                aria-hidden
                className="absolute left-0 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground ring-4 ring-background"
              >
                P
              </span>
              <p className="pt-1.5 text-[12.5px] font-medium text-white/55">{meta}</p>
              <div className="mt-2 rounded-2xl border border-primary/25 bg-primary/[0.08] px-4 py-3">
                <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.55] text-white/90">{reply.body}</p>
              </div>
            </li>
          );
        })}

        {replies.length === 0 && (
          <li className="relative pl-11 pt-5">
            <Rail end />
            <span
              aria-hidden
              className="absolute left-0 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-amber-400/50 bg-background text-amber-400"
            >
              <Clock3 className="h-4 w-4" />
            </span>
            <p className="pt-1.5 text-[13.5px] font-semibold text-amber-400/90">Waiting for a reply</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              You'll get a popup in the app as soon as Param answers.
            </p>
          </li>
        )}
      </ol>

      <ComposeRow
        onCompose={onCompose}
        hint={replies.length > 0 ? "Something else to add? Start a new one" : "Thought of something else? Send it separately"}
        className="mt-8"
      />
    </div>
  );
}

/** The line through this step. It stops at the last marker so the thread reads as settled. */
function Rail({ end }: { end: boolean }) {
  return <span aria-hidden className={cn("absolute left-4 top-0 w-px bg-white/10", end ? "h-4" : "bottom-0")} />;
}
