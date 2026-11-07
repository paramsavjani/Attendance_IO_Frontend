import { useState } from "react";
import { Poll } from "@/types/poll";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  Lock,
  Flag,
  Users,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isPast } from "date-fns";

interface PollCardProps {
  poll: Poll;
  currentUserId?: string;
  onVote: (pollId: string, optionIds: string[]) => Promise<void>;
  onClosePoll?: (pollId: string) => Promise<void>;
  onDeletePoll?: (pollId: string) => Promise<void>;
  onOpenReport?: (poll: Poll) => void;
}

export function PollCard({
  poll,
  currentUserId,
  onVote,
  onClosePoll,
  onDeletePoll,
  onOpenReport,
}: PollCardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(poll.userVotedOptionIds || []);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [showSpamAnyway, setShowSpamAnyway] = useState(false);

  const isAuthor = currentUserId && poll.createdBy.id === currentUserId;
  const isExpired = poll.endDate ? isPast(new Date(poll.endDate)) : false;
  const isClosed = poll.status === "CLOSED" || isExpired;
  const hasVoted = Boolean(poll.userVotedOptionIds && poll.userVotedOptionIds.length > 0);

  // If flagged as spam and not overridden by user
  if (poll.isFlaggedSpam && !showSpamAnyway) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            This poll was flagged as spam by multiple classmates and is hidden.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSpamAnyway(true)}
          className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
        >
          View
        </Button>
      </div>
    );
  }

  const handleOptionToggle = (optionId: string) => {
    if (isClosed) return;

    if (poll.pollType === "SINGLE_CHOICE" || poll.pollType === "YES_NO") {
      setSelectedIds([optionId]);
    } else {
      // Multiple choice
      if (selectedIds.includes(optionId)) {
        setSelectedIds(selectedIds.filter((id) => id !== optionId));
      } else {
        setSelectedIds([...selectedIds, optionId]);
      }
    }
  };

  const handleSaveVote = async () => {
    if (selectedIds.length === 0 || isClosed) return;
    try {
      setIsSubmittingVote(true);
      await onVote(poll.id, selectedIds);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Has uncommitted change
  const hasChanges =
    JSON.stringify(selectedIds.sort()) !== JSON.stringify((poll.userVotedOptionIds || []).sort());

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3.5 shadow-sm transition-all hover:border-border/80">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground leading-snug">{poll.title}</h3>
            {isClosed ? (
              <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5 bg-muted text-muted-foreground gap-1">
                <Lock className="w-2.5 h-2.5" /> Ended
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 border-emerald-500/40 text-emerald-500 bg-emerald-500/10 gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
              </Badge>
            )}
            {poll.pollType === "MULTIPLE_CHOICE" && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 text-muted-foreground">
                Multiple Choice
              </Badge>
            )}
          </div>

          {poll.description && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{poll.description}</p>
          )}

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
            <span>By {isAuthor ? "You" : poll.createdBy.name}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
            </span>
            {poll.endDate && !isClosed && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-500 font-medium">
                  <Clock className="w-3 h-3" /> Ends in {formatDistanceToNow(new Date(poll.endDate))}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Options / Action menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs rounded-xl">
            {isAuthor && !isClosed && onClosePoll && (
              <DropdownMenuItem onClick={() => onClosePoll(poll.id)} className="gap-2 cursor-pointer">
                <Lock className="w-3.5 h-3.5" /> End Poll Early
              </DropdownMenuItem>
            )}
            {isAuthor && onDeletePoll && (
              <DropdownMenuItem
                onClick={() => onDeletePoll(poll.id)}
                className="gap-2 text-destructive cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Poll
              </DropdownMenuItem>
            )}
            {!isAuthor && onOpenReport && (
              <DropdownMenuItem
                onClick={() => onOpenReport(poll)}
                className="gap-2 text-amber-500 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" /> Report as Spam
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Poll Options List */}
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          const isUserVoteSubmitted = poll.userVotedOptionIds?.includes(opt.id);
          const percentage = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;

          return (
            <div
              key={opt.id}
              onClick={() => handleOptionToggle(opt.id)}
              className={cn(
                "relative overflow-hidden rounded-xl border p-2.5 transition-all text-xs",
                isClosed
                  ? "cursor-default border-border/60 bg-muted/20"
                  : "cursor-pointer border-border hover:border-primary/50",
                isSelected && !isClosed && "border-primary/80 bg-primary/5",
                isUserVoteSubmitted && "ring-1 ring-primary/40"
              )}
            >
              {/* Results progress background */}
              {(hasVoted || isClosed) && (
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 transition-all opacity-15",
                    isUserVoteSubmitted ? "bg-primary" : "bg-muted-foreground"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative flex items-center justify-between gap-2 z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-colors flex-shrink-0",
                      poll.pollType === "MULTIPLE_CHOICE" && "rounded-md",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 bg-background"
                    )}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span className={cn("font-medium truncate", isSelected && "text-foreground font-semibold")}>
                    {opt.optionText}
                  </span>
                </div>

                {(hasVoted || isClosed) && (
                  <div className="flex items-center gap-2 flex-shrink-0 text-muted-foreground text-[11px] font-mono">
                    <span>{opt.voteCount} {opt.voteCount === 1 ? "vote" : "votes"}</span>
                    <span className="font-semibold text-foreground w-8 text-right">{percentage}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer & Voting Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" />
          <span>{poll.totalVotes} total {poll.totalVotes === 1 ? "vote" : "votes"}</span>
          {hasVoted && (
            <span className="text-emerald-500 flex items-center gap-1 ml-1 font-medium">
              • <CheckCircle2 className="w-3 h-3" /> Voted
            </span>
          )}
        </div>

        {!isClosed && hasChanges && (
          <Button
            size="sm"
            onClick={handleSaveVote}
            disabled={isSubmittingVote || selectedIds.length === 0}
            className="h-8 text-xs px-3 rounded-xl font-medium"
          >
            {isSubmittingVote ? "Saving..." : hasVoted ? "Update Vote" : "Submit Vote"}
          </Button>
        )}
      </div>
    </div>
  );
}
