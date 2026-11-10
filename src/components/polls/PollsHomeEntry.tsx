import { Plane } from "lucide-react";
import type { PollFeedController } from "@/hooks/usePollFeed";
import { PollsIcon } from "./PollsIcon";
import type { PollsSheetView } from "./PollsSheet";

interface PollsHomeEntryProps {
  polls: PollFeedController;
  onOpenSheet: (view: PollsSheetView) => void;
  onPlanLeave: () => void;
}

const tile =
  "flex h-12 min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-2 text-left shadow-sm transition-transform active:scale-[0.98]";

/**
 * One short row on the home screen so the schedule stays near the top: class polls on the left
 * (a poll waiting for your vote shows up here), the leave planner on the right.
 */
export function PollsHomeEntry({ polls, onOpenSheet, onPlanLeave }: PollsHomeEntryProps) {
  const { openPolls, isLoading } = polls;
  const waiting = openPolls.filter((p) => !p.isMine && p.myOptionIds.length === 0).length;
  const openCount = openPolls.length;

  const pollsDetail = isLoading
    ? "Loading…"
    : waiting > 0
      ? `${waiting} to vote on`
      : openCount > 0
        ? `${openCount} open`
        : "Ask your class";

  return (
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => onOpenSheet("list")} className={tile} aria-label={`Class polls, ${pollsDetail}`}>
        <span className="relative flex-shrink-0">
          <PollsIcon className="h-8 w-8" />
          {waiting > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-rose-500" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">Class polls</span>
          <span className={waiting > 0 ? "block truncate text-[10.5px] font-medium text-rose-400" : "block truncate text-[10.5px] text-muted-foreground"}>
            {pollsDetail}
          </span>
        </span>
      </button>
      <button type="button" onClick={onPlanLeave} className={tile}>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
          <Plane className="h-4 w-4 text-primary" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">Plan a leave</span>
          <span className="block truncate text-[10.5px] text-muted-foreground">See days off</span>
        </span>
      </button>
    </div>
  );
}
