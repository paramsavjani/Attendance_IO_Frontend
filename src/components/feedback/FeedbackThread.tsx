import { cn } from "@/lib/utils";
import { formatFeedbackDate, laterThan, type MyFeedbackItem } from "@/lib/feedback";

/**
 * One feedback thread as a conversation: the student's message on the right in the app's
 * indigo, Param's replies on the left. [isNew] is true when the newest reply had not been read
 * when the screen opened — only then does it ease in, so the motion marks what changed.
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
      {/* The student's own message */}
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] rounded-[20px] rounded-br-md bg-primary px-4 py-3 text-primary-foreground">
          <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.5]">{item.description}</p>
        </div>
        <p className="mr-1 mt-1.5 text-[11.5px] text-white/40">You, {formatFeedbackDate(item.createdAt)}</p>
      </div>

      {/* Param's replies */}
      {replies.map((reply, index) => {
        const last = index === replies.length - 1;
        const meta =
          index === 0
            ? laterThan(item.createdAt, reply.createdAt) ?? formatFeedbackDate(reply.createdAt)
            : formatFeedbackDate(reply.createdAt);
        return (
          <div
            key={reply.id}
            className={cn(
              "mt-5 flex items-end gap-2",
              last && isNew && "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:delay-200"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "mb-6 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[12px] font-semibold text-primary",
                !last && "invisible"
              )}
            >
              P
            </span>
            <div className="flex min-w-0 max-w-[85%] flex-col items-start">
              <div className="rounded-[20px] rounded-bl-md bg-[#1e1e21] px-4 py-3">
                <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.5] text-white/90">{reply.body}</p>
              </div>
              <p className="ml-1 mt-1.5 text-[11.5px] text-white/40">Param, {meta}</p>
            </div>
          </div>
        );
      })}

      {replies.length === 0 ? (
        <p className="mx-auto mt-8 max-w-[30ch] text-center text-[12.5px] leading-relaxed text-white/40">
          No reply yet. You'll see a popup in the app as soon as Param answers.
        </p>
      ) : (
        <div className="mt-10 flex flex-col items-center text-center">
          <p className="max-w-[30ch] text-[12.5px] leading-relaxed text-white/40">
            Want to add something? Send it as new feedback.
          </p>
          <button
            type="button"
            onClick={onCompose}
            className="mt-3 min-h-[40px] rounded-xl border border-white/10 px-4 text-[13px] font-medium text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:bg-white/[0.05]"
          >
            Send feedback
          </button>
        </div>
      )}
    </div>
  );
}
