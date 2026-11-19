import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { PollFeedController } from "@/hooks/usePollFeed";
import { LeaveIcon } from "@/components/leave/LeaveIcon";
import { PlacementsIcon } from "@/components/placements/PlacementsIcon";
import { fetchPlacements } from "@/lib/placements";
import { PollsIcon } from "./PollsIcon";
import type { PollsSheetView } from "./PollsSheet";

interface PollsHomeEntryProps {
  polls: PollFeedController;
  onOpenSheet: (view: PollsSheetView) => void;
  onPlanLeave: () => void;
  /** DAU students get placements in the second slot; the demo login keeps the leave planner there. */
  showPlacements?: boolean;
}

const tile =
  "flex h-12 min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-2 text-left shadow-sm transition-transform active:scale-[0.98]";

/**
 * One short row on the home screen so the schedule stays near the top: class polls on the left
 * (a poll waiting for your vote shows up here), this season's placements on the right. The demo
 * login has no placements and gets the leave planner instead; everyone else still has the planner
 * above the subject list.
 */
export function PollsHomeEntry({ polls, onOpenSheet, onPlanLeave, showPlacements = false }: PollsHomeEntryProps) {
  const navigate = useNavigate();
  const [placementsDetail, setPlacementsDetail] = useState("This season");

  useEffect(() => {
    if (!showPlacements) return;
    let cancelled = false;
    fetchPlacements()
      .then(({ summary }) => {
        if (cancelled) return;
        if (summary.averageCtcLpa != null) setPlacementsDetail(`Avg ${summary.averageCtcLpa.toFixed(1)} LPA · ${summary.offers} offers`);
        else if (summary.offers > 0) setPlacementsDetail(`${summary.offers} offers so far`);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [showPlacements]);

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
        <PollsIcon className="h-8 w-8" />
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold">Class polls</span>
          <span className={waiting > 0 ? "block truncate text-[10.5px] font-medium text-rose-400" : "block truncate text-[10.5px] text-muted-foreground"}>
            {pollsDetail}
          </span>
        </span>
      </button>
      {showPlacements ? (
        <button type="button" onClick={() => navigate("/placements")} className={tile} aria-label={`Placements, ${placementsDetail}`}>
          <PlacementsIcon className="h-8 w-8" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold">Placements</span>
            <span className="block truncate text-[10.5px] text-muted-foreground">{placementsDetail}</span>
          </span>
        </button>
      ) : (
        <button type="button" onClick={onPlanLeave} className={tile}>
          <LeaveIcon className="h-8 w-8" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold">Plan a leave</span>
            <span className="block truncate text-[10.5px] text-muted-foreground">See days off</span>
          </span>
        </button>
      )}
    </div>
  );
}
