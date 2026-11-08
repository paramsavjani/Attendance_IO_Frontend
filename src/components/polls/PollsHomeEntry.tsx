import { useEffect, useState } from "react";
import { ChevronRight, Plus, Vote, X } from "lucide-react";
import type { PollFeedController } from "@/hooks/usePollFeed";
import type { Poll } from "@/types/poll";
import { PollCard } from "./PollCard";
import { PollsIcon } from "./PollsIcon";
import type { PollsSheetView } from "./PollsSheet";

const DISMISSED_KEY = "polls.dismissedFromHome";

function readDismissed(): number[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function writeDismissed(ids: number[]) {
  try {
    // Only recent ids matter; old polls have long left the feed.
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids.slice(-50)));
  } catch {
    // Storage unavailable: the poll may show on home again, which is harmless.
  }
}

interface PollsHomeEntryProps {
  polls: PollFeedController;
  isDemo: boolean;
  onOpenSheet: (view: PollsSheetView) => void;
  onReport: (poll: Poll) => void;
  onDelete: (poll: Poll) => void;
}

/**
 * Polls on the home screen. A classmate's poll you haven't answered shows inline so you can vote
 * without leaving home; it stays put after you vote so you see the result, until you dismiss it.
 * Otherwise a slim row leads to all polls and to asking one.
 */
export function PollsHomeEntry({ polls, isDemo, onOpenSheet, onReport, onDelete }: PollsHomeEntryProps) {
  const { openPolls, feed, isLoading, votingPollId } = polls;
  const [dismissed, setDismissed] = useState<number[]>(readDismissed);
  const [pinnedId, setPinnedId] = useState<number | null>(null);

  const candidate = openPolls.find((p) => !p.isMine && p.myOptionIds.length === 0 && !dismissed.includes(p.id));
  const pinned = pinnedId === null ? undefined : openPolls.find((p) => p.id === pinnedId);

  useEffect(() => {
    if (!pinned && candidate) setPinnedId(candidate.id);
  }, [pinned, candidate]);

  const featured = pinned && !dismissed.includes(pinned.id) ? pinned : undefined;
  const othersOpen = openPolls.length - (featured ? 1 : 0);

  const dismiss = (id: number) => {
    const next = [...dismissed, id];
    setDismissed(next);
    writeDismissed(next);
    setPinnedId(null);
  };

  if (isLoading && feed.polls.length === 0) return null;

  if (featured) {
    return (
      <section className="space-y-1.5" aria-label="Class poll">
        <div className="flex items-center justify-between px-0.5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Vote className="h-3.5 w-3.5" />
            Class poll
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onOpenSheet("list")}
              className="flex h-7 items-center gap-0.5 rounded-full px-2 text-[11px] font-semibold text-primary"
            >
              {othersOpen > 0 ? `${othersOpen} more` : "All polls"}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => dismiss(featured.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
              aria-label="Hide this poll from home"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <PollCard
          poll={featured}
          isVoting={votingPollId === featured.id}
          onVote={polls.vote}
          onClearVote={polls.clearVote}
          onClose={polls.close}
          onDelete={onDelete}
          onReport={onReport}
        />
      </section>
    );
  }

  const openCount = openPolls.length;
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card py-2 pl-2.5 pr-2 shadow-sm">
      <button
        type="button"
        onClick={() => onOpenSheet("list")}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
      >
        <PollsIcon className="h-9 w-9 drop-shadow-sm" />
        <span className="min-w-0">
          <span className="block text-xs font-semibold">Class polls</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {openCount > 0
              ? `${openCount} open ${openCount === 1 ? "poll" : "polls"} in your classes`
              : "Ask your class a quick question"}
          </span>
        </span>
      </button>
      {!isDemo && feed.canCreate && (
        <button
          type="button"
          onClick={() => onOpenSheet("create")}
          className="flex h-8 flex-shrink-0 items-center gap-1 rounded-full bg-foreground pl-2 pr-3 text-[11px] font-semibold text-background active:scale-[0.97]"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          Ask
        </button>
      )}
    </div>
  );
}
