import { useEffect, useState } from "react";
import { Check, EyeOff, Flag, Loader2, Lock, MoreHorizontal, Trash2, Trophy, VenetianMask } from "lucide-react";
import { cn } from "@/lib/utils";
import { optionPercent, pollTimeLabel } from "@/lib/polls";
import type { Poll } from "@/types/poll";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PollCardProps {
  poll: Poll;
  isVoting: boolean;
  onVote: (poll: Poll, optionIds: number[]) => void;
  onClearVote: (poll: Poll) => void;
  onClose: (poll: Poll) => void;
  onDelete: (poll: Poll) => void;
  onReport: (poll: Poll) => void;
  /** Drops the subject chip when the surrounding UI already names the subject. */
  compact?: boolean;
  className?: string;
}

/**
 * One poll. Before you vote you see plain choices (results stay hidden so early votes don't
 * sway you); after voting, or once it ends, each choice turns into a result bar.
 */
export function PollCard({
  poll,
  isVoting,
  onVote,
  onClearVote,
  onClose,
  onDelete,
  onReport,
  compact = false,
  className,
}: PollCardProps) {
  const hasVoted = poll.myOptionIds.length > 0;
  // Multiple choice collects picks first; single choice votes on tap.
  const [draft, setDraft] = useState<number[]>(poll.myOptionIds);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(poll.myOptionIds);
  }, [poll.myOptionIds, editing]);

  const canVote = poll.isOpen && !poll.hidden;
  // Options are tappable until you vote; after that a vote only moves through "Change vote",
  // so a stray tap while scrolling home can never change someone's ballot.
  const choosing = canVote && (editing || !hasVoted);
  const leadingVotes = Math.max(0, ...poll.options.map((o) => o.votes));
  // Once voting stops the card becomes a result: the winner (or a tie) is called out and the
  // other options step back. Open polls keep plain live bars.
  const ended = !poll.isOpen;
  const winners = ended && leadingVotes > 0 ? poll.options.filter((o) => o.votes === leadingVotes) : [];
  const noVotes = poll.totalVoters === 0;
  const accent = poll.subject.color;

  const pickSingle = (optionId: number) => {
    if (!canVote || isVoting) return;
    setEditing(false);
    if (hasVoted && poll.myOptionIds[0] === optionId) return;
    onVote(poll, [optionId]);
  };

  const toggleDraft = (optionId: number) => {
    if (!canVote) return;
    setDraft((prev) => (prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]));
  };

  const submitDraft = () => {
    if (draft.length === 0) return;
    setEditing(false);
    onVote(poll, draft);
  };

  const sameAsBallot =
    draft.length === poll.myOptionIds.length && draft.every((id) => poll.myOptionIds.includes(id));
  const collectingMulti = poll.allowMultiple && choosing;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm",
        poll.hidden && "opacity-80",
        className,
      )}
    >
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
            {!compact && (
              <span
                className="inline-flex max-w-full items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold text-foreground"
                style={{ backgroundColor: `${accent}26` }}
              >
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                <span className="truncate">{poll.subject.name}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 truncate">
              {poll.creatorName === null ? (
                <>
                  <VenetianMask className="h-3 w-3" />
                  Anonymous
                </>
              ) : poll.isMine ? (
                poll.anonymous ? (
                  <>
                    <VenetianMask className="h-3 w-3" />
                    You, anonymously
                  </>
                ) : (
                  "You"
                )
              ) : (
                poll.creatorName
              )}
            </span>
            <span aria-hidden>·</span>
            <span className={cn("tabular-nums", poll.isOpen ? "text-foreground/80" : "")}>{pollTimeLabel(poll)}</span>
          </div>
          <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-foreground">{poll.question}</h3>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="-mr-1 -mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
              aria-label="Poll options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            {poll.isMine ? (
              <>
                {poll.isOpen && (
                  <DropdownMenuItem onClick={() => onClose(poll)}>
                    <Lock className="mr-2 h-4 w-4" />
                    End poll now
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(poll)} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete poll
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {hasVoted && poll.isOpen && (
                  <DropdownMenuItem onClick={() => onClearVote(poll)}>
                    <Check className="mr-2 h-4 w-4" />
                    Remove my vote
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onReport(poll)} disabled={poll.reportedByMe}>
                  <Flag className="mr-2 h-4 w-4" />
                  {poll.reportedByMe ? "Reported" : "Report poll"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {poll.hidden && (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive">
          <EyeOff className="h-3.5 w-3.5 flex-shrink-0" />
          Hidden from your class after several reports.
        </div>
      )}

      {ended && !poll.hidden && <ResultBanner poll={poll} winners={winners} />}

      <ul className="mt-3 space-y-1.5" role={collectingMulti ? "group" : "radiogroup"} aria-label={poll.question}>
        {poll.options.map((option) => {
          const mine = poll.myOptionIds.includes(option.id);
          const picked = collectingMulti ? draft.includes(option.id) : mine;

          const percent = optionPercent(option.votes, poll.totalVoters);
          const isWinner = winners.some((w) => w.id === option.id);
          // Live polls tint your own pick; final results tint the winner instead.
          const strong = ended ? isWinner : picked;
          const bar = (
            <span
              className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-spring"
              style={{ width: `${percent}%`, backgroundColor: strong ? `${accent}66` : `${accent}24` }}
              aria-hidden
            />
          );
          const percentLabel = (
            <span className="relative z-10 w-10 flex-shrink-0 text-right text-xs font-semibold tabular-nums text-foreground/80">
              {percent}%
            </span>
          );

          if (ended && noVotes) {
            return (
              <li key={option.id}>
                <div className="flex w-full items-center rounded-xl border border-dashed border-border/60 px-3 py-2.5 text-sm text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">{option.text}</span>
                </div>
              </li>
            );
          }

          if (!choosing) {
            return (
              <li key={option.id}>
                <div
                  className={cn(
                    "relative flex w-full items-center gap-2 overflow-hidden rounded-xl border px-3 py-2.5 text-sm transition-opacity",
                    ended
                      ? isWinner
                        ? "border-amber-400/40"
                        : "border-border/50 opacity-60"
                      : mine
                        ? "border-transparent"
                        : "border-border/60",
                  )}
                  aria-label={`${option.text}: ${percent}%${isWinner ? ", winner" : ""}${mine ? ", your vote" : ""}`}
                >
                  {bar}
                  {ended && isWinner && <Trophy className="relative z-10 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />}
                  <span
                    className={cn("relative z-10 min-w-0 flex-1 truncate", (ended ? isWinner : mine) && "font-semibold")}
                  >
                    {option.text}
                  </span>
                  {mine &&
                    (ended ? (
                      <span className="relative z-10 flex flex-shrink-0 items-center gap-0.5 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                        Your vote
                      </span>
                    ) : (
                      <Check className="relative z-10 h-3.5 w-3.5 flex-shrink-0 text-foreground" />
                    ))}
                  {percentLabel}
                </div>
              </li>
            );
          }

          return (
            <li key={option.id}>
              <button
                type="button"
                role={collectingMulti ? "checkbox" : "radio"}
                aria-checked={picked}
                aria-label={`${option.text}: ${percent}%`}
                disabled={isVoting && !collectingMulti}
                onClick={() => (collectingMulti ? toggleDraft(option.id) : pickSingle(option.id))}
                className={cn(
                  "relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2.5 text-left text-sm transition-all active:scale-[0.99]",
                  picked ? "border-foreground/50 font-semibold" : "border-border/70",
                )}
              >
                {bar}
                <span
                  className={cn(
                    "relative z-10 flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 transition-colors",
                    collectingMulti ? "rounded-[5px]" : "rounded-full",
                    picked ? "border-foreground bg-foreground text-background" : "border-muted-foreground/50 bg-card/60",
                  )}
                  aria-hidden
                >
                  {picked && <Check className="h-2.5 w-2.5 stroke-[3.5]" />}
                </span>
                <span className="relative z-10 min-w-0 flex-1 truncate">{option.text}</span>
                {isVoting && picked && !collectingMulti ? (
                  <Loader2 className="relative z-10 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  percentLabel
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <footer className="mt-2.5 flex min-h-[28px] items-center gap-2 text-[11px] text-muted-foreground">
        <span className="tabular-nums">
          {noVotes
            ? ended
              ? "No votes"
              : "No votes yet"
            : `${ended ? "Final · " : ""}${poll.totalVoters} ${poll.totalVoters === 1 ? "vote" : "votes"}`}
        </span>
        {poll.allowMultiple && (
          <>
            <span aria-hidden>·</span>
            <span>Pick any</span>
          </>
        )}
        {canVote && !hasVoted && !poll.isMine && (
          <>
            <span aria-hidden>·</span>
            <span>{poll.allowMultiple ? "Pick, then vote" : "Tap to vote"}</span>
          </>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {editing && !poll.allowMultiple && choosing && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-7 rounded-full px-2.5 text-xs font-medium text-muted-foreground"
            >
              Cancel
            </button>
          )}
          {collectingMulti && (
            <>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft(poll.myOptionIds);
                  }}
                  className="h-7 rounded-full px-2.5 text-xs font-medium text-muted-foreground"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                disabled={draft.length === 0 || isVoting || (editing && sameAsBallot)}
                onClick={submitDraft}
                className="h-7 rounded-full bg-foreground px-3 text-xs font-semibold text-background transition-opacity disabled:opacity-40"
              >
                {hasVoted ? "Update vote" : "Vote"}
              </button>
            </>
          )}
          {canVote && !choosing && (
            <button
              type="button"
              onClick={() => {
                setDraft(poll.myOptionIds);
                setEditing(true);
              }}
              className="h-7 rounded-full px-2.5 text-xs font-semibold text-foreground underline-offset-2 hover:underline"
            >
              Change vote
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}

/** The outcome line on an ended poll: who won, a tie, or that nobody voted. */
function ResultBanner({ poll, winners }: { poll: Poll; winners: Poll["options"] }) {
  if (poll.totalVoters === 0) {
    return (
      <div className="mt-2.5 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
        No one voted before this poll ended.
      </div>
    );
  }
  const percent = optionPercent(winners[0]?.votes ?? 0, poll.totalVoters);
  const names = winners.map((w) => w.text);
  const tieText =
    names.length > 2 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names.join(" and ");
  return (
    <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/20">
        <Trophy className="h-3.5 w-3.5 text-amber-400" />
      </span>
      <div className="min-w-0 text-xs leading-snug">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">Final result</p>
        {winners.length === 1 ? (
          <p className="line-clamp-2 text-foreground">
            <span className="font-semibold">{names[0]}</span>
            <span className="text-muted-foreground">
              {" "}
              {poll.allowMultiple ? "was picked most" : "won"} · {percent}%
            </span>
          </p>
        ) : (
          <p className="line-clamp-2 text-foreground">
            <span className="font-semibold">Tie</span>
            <span className="text-muted-foreground">
              {" "}
              between {tieText} · {percent}% each
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
