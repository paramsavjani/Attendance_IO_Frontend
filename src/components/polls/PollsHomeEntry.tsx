import { Plus } from "lucide-react";
import type { PollFeedController } from "@/hooks/usePollFeed";
import { PollsIcon } from "./PollsIcon";
import type { PollsSheetView } from "./PollsSheet";

interface PollsHomeEntryProps {
  polls: PollFeedController;
  isDemo: boolean;
  onOpenSheet: (view: PollsSheetView) => void;
}

/**
 * Polls on the home screen, kept to one short row so the schedule stays near the top. When a
 * classmate's poll is waiting for your vote it shows that question with a Vote button;
 * otherwise a compact row leads to all polls and to asking one.
 */
export function PollsHomeEntry({ polls, isDemo, onOpenSheet }: PollsHomeEntryProps) {
  const { openPolls, feed, isLoading } = polls;
  if (isLoading && feed.polls.length === 0) return null;

  const waiting = openPolls.find((p) => !p.isMine && p.myOptionIds.length === 0);
  if (waiting) {
    return (
      <button
        type="button"
        onClick={() => onOpenSheet("list")}
        className="flex w-full items-center gap-2.5 rounded-2xl border border-border/70 bg-card p-1.5 text-left shadow-sm active:scale-[0.99]"
        aria-label={`Class poll: ${waiting.question}. Vote`}
      >
        <PollsIcon className="h-8 w-8" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10.5px] text-muted-foreground">
            {waiting.creatorName ?? "Anonymous"} · {waiting.subject.name}
          </span>
          <span className="block truncate text-xs font-semibold">{waiting.question}</span>
        </span>
        <span className="flex h-7 flex-shrink-0 items-center rounded-full bg-foreground px-3 text-[11px] font-semibold text-background">
          Vote
        </span>
      </button>
    );
  }

  const openCount = openPolls.length;
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-card px-1.5 shadow-sm">
      <button type="button" onClick={() => onOpenSheet("list")} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <PollsIcon className="h-7 w-7" />
        <span className="truncate text-xs">
          <span className="font-semibold">Class polls</span>
          <span className="text-muted-foreground">
            {" "}
            · {openCount > 0 ? `${openCount} open ${openCount === 1 ? "poll" : "polls"}` : "Ask your class"}
          </span>
        </span>
      </button>
      {!isDemo && feed.canCreate && (
        <button
          type="button"
          onClick={() => onOpenSheet("create")}
          className="flex h-7 flex-shrink-0 items-center gap-1 rounded-full bg-foreground px-2.5 text-[11px] font-semibold text-background"
        >
          <Plus className="h-3 w-3 stroke-[2.5]" />
          Ask
        </button>
      )}
    </div>
  );
}
