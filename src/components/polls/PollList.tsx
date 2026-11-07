import { Poll } from "@/types/poll";
import { PollCard } from "./PollCard";
import { BarChart2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PollListProps {
  polls: Poll[];
  isLoading?: boolean;
  filter: "ALL" | "ACTIVE" | "ENDED";
  currentUserId?: string;
  onVote: (pollId: string, optionIds: string[]) => Promise<void>;
  onClosePoll?: (pollId: string) => Promise<void>;
  onDeletePoll?: (pollId: string) => Promise<void>;
  onOpenReport?: (poll: Poll) => void;
  onCreateClick?: () => void;
}

export function PollList({
  polls,
  isLoading,
  filter,
  currentUserId,
  onVote,
  onClosePoll,
  onDeletePoll,
  onOpenReport,
  onCreateClick,
}: PollListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl bg-card border border-dashed border-border/80 space-y-3">
        <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">No polls found</h4>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {filter === "ALL"
              ? "No questions or polls have been raised for this subject yet. Be the first to start one!"
              : `No ${filter.toLowerCase()} polls right now.`}
          </p>
        </div>
        {onCreateClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateClick}
            className="text-xs h-8 rounded-xl gap-1.5"
          >
            <Plus className="w-3 h-3" /> Create first poll
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          currentUserId={currentUserId}
          onVote={onVote}
          onClosePoll={onClosePoll}
          onDeletePoll={onDeletePoll}
          onOpenReport={onOpenReport}
        />
      ))}
    </div>
  );
}
