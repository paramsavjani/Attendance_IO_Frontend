import { useState, useEffect, useMemo } from "react";
import { Poll, CreatePollPayload, ReportPollPayload } from "@/types/poll";
import {
  fetchPollsForSubject,
  createPoll,
  castPollVote,
  closePoll,
  deletePoll,
  reportPoll,
} from "@/lib/polls";
import { PollCard } from "./PollCard";
import { CreatePollDialog } from "./CreatePollDialog";
import { ReportPollDialog } from "./ReportPollDialog";
import { Button } from "@/components/ui/button";
import { Plus, BarChart2, Filter, Inbox } from "lucide-react";
import { toast } from "sonner";
import { isPast } from "date-fns";

interface PollSectionProps {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  currentUserId?: string;
  currentUserName?: string;
}

export function PollSection({
  subjectId,
  subjectCode,
  subjectName,
  currentUserId,
  currentUserName,
}: PollSectionProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "ENDED">("ALL");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [reportingPoll, setReportingPoll] = useState<Poll | null>(null);

  const loadPolls = async () => {
    try {
      setIsLoading(true);
      const data = await fetchPollsForSubject(subjectId);
      setPolls(data);
    } catch (e) {
      console.error("Failed to load polls:", e);
      toast.error("Failed to load polls");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, [subjectId]);

  const handleCreatePoll = async (payload: CreatePollPayload) => {
    const created = await createPoll(payload, {
      id: currentUserId || "user_current",
      name: currentUserName || "Student",
    });
    setPolls((prev) => [created, ...prev]);
  };

  const handleVote = async (pollId: string, optionIds: string[]) => {
    try {
      const updated = await castPollVote({ pollId, optionIds });
      setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success("Vote recorded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit vote");
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      const updated = await closePoll(pollId);
      setPolls((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success("Poll ended successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to end poll");
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      await deletePoll(pollId);
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
      toast.success("Poll deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete poll");
    }
  };

  const handleReport = async (payload: ReportPollPayload) => {
    const { isHidden } = await reportPoll(payload);
    if (isHidden) {
      setPolls((prev) =>
        prev.map((p) => (p.id === payload.pollId ? { ...p, isFlaggedSpam: true } : p))
      );
    }
  };

  const filteredPolls = useMemo(() => {
    return polls.filter((poll) => {
      const isExpired = poll.endDate ? isPast(new Date(poll.endDate)) : false;
      const isClosed = poll.status === "CLOSED" || isExpired;

      if (filter === "ACTIVE") return !isClosed;
      if (filter === "ENDED") return isClosed;
      return true;
    });
  }, [polls, filter]);

  return (
    <div className="space-y-4">
      {/* Subheader Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              filter === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({polls.length})
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              filter === "ACTIVE"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("ENDED")}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              filter === "ENDED"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ended
          </button>
        </div>

        {/* Create Poll Trigger */}
        <Button
          onClick={() => setShowCreateDialog(true)}
          size="sm"
          className="text-xs h-8 px-3 rounded-xl gap-1.5 font-medium shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Poll
        </Button>
      </div>

      {/* Poll Cards Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
        </div>
      ) : filteredPolls.length === 0 ? (
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="text-xs h-8 rounded-xl gap-1.5"
          >
            <Plus className="w-3 h-3" /> Create first poll
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPolls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              currentUserId={currentUserId}
              onVote={handleVote}
              onClosePoll={handleClosePoll}
              onDeletePoll={handleDeletePoll}
              onOpenReport={(p) => setReportingPoll(p)}
            />
          ))}
        </div>
      )}

      {/* Creation Modal */}
      <CreatePollDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        subjectId={subjectId}
        subjectName={subjectName}
        onPollCreated={handleCreatePoll}
      />

      {/* Report Modal */}
      {reportingPoll && (
        <ReportPollDialog
          open={Boolean(reportingPoll)}
          onOpenChange={(open) => !open && setReportingPoll(null)}
          pollId={reportingPoll.id}
          pollTitle={reportingPoll.title}
          authorName={reportingPoll.createdBy.name}
          onReport={handleReport}
        />
      )}
    </div>
  );
}
