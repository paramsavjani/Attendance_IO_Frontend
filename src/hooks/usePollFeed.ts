import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  clearPollVote,
  closePoll,
  createPoll,
  deletePoll,
  fetchPollFeed,
  reportPoll,
  votePoll,
} from "@/lib/polls";
import type { CreatePollInput, Poll, PollFeed, PollReportReason } from "@/types/poll";

const EMPTY_FEED: PollFeed = { polls: [], unvotedOpenCount: 0, canCreate: false, createdToday: 0, dailyLimit: 3 };

const countUnvoted = (polls: Poll[]) => polls.filter((p) => p.isOpen && !p.isMine && p.myOptionIds.length === 0).length;

/**
 * Class polls for the signed-in student. Votes apply instantly and roll back if the server
 * refuses, so tapping an option never feels like waiting on the network.
 */
export function usePollFeed(enabled: boolean) {
  const [feed, setFeed] = useState<PollFeed>(EMPTY_FEED);
  const [isLoading, setIsLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState<number | null>(null);

  const replacePolls = useCallback((update: (polls: Poll[]) => Poll[]) => {
    setFeed((prev) => {
      const polls = update(prev.polls);
      return { ...prev, polls, unvotedOpenCount: countUnvoted(polls) };
    });
  }, []);

  const upsert = useCallback(
    (poll: Poll) => replacePolls((polls) => polls.map((p) => (p.id === poll.id ? poll : p))),
    [replacePolls],
  );

  const refresh = useCallback(async () => {
    try {
      setFeed(await fetchPollFeed());
    } catch (error) {
      console.error("Failed to load polls:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    // Votes and new polls from classmates arrive while the app sits in the background.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, refresh]);

  const vote = useCallback(
    async (poll: Poll, optionIds: number[]) => {
      const previous = poll;
      const hadVoted = poll.myOptionIds.length > 0;
      // Optimistic: move my ballot locally; real totals come back from the server.
      upsert({
        ...poll,
        myOptionIds: optionIds,
        totalVoters: hadVoted ? poll.totalVoters : poll.totalVoters + 1,
        options: poll.options.map((o) => {
          const was = poll.myOptionIds.includes(o.id) ? 1 : 0;
          const now = optionIds.includes(o.id) ? 1 : 0;
          return { ...o, votes: o.votes - was + now };
        }),
      });
      setVotingPollId(poll.id);
      try {
        upsert(await votePoll(poll.id, optionIds));
      } catch (error) {
        upsert(previous);
        toast.error(error instanceof Error ? error.message : "Couldn't save your vote");
      } finally {
        setVotingPollId(null);
      }
    },
    [upsert],
  );

  const clearVote = useCallback(
    async (poll: Poll) => {
      try {
        upsert(await clearPollVote(poll.id));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't remove your vote");
      }
    },
    [upsert],
  );

  const create = useCallback(
    async (input: CreatePollInput) => {
      const poll = await createPoll(input);
      setFeed((prev) => {
        const polls = [poll, ...prev.polls];
        const createdToday = prev.createdToday + 1;
        return {
          ...prev,
          polls,
          createdToday,
          canCreate: createdToday < prev.dailyLimit,
          unvotedOpenCount: countUnvoted(polls),
        };
      });
      return poll;
    },
    [],
  );

  const close = useCallback(
    async (poll: Poll) => {
      try {
        upsert(await closePoll(poll.id));
        toast.success("Poll ended. Results are final.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't end the poll");
      }
    },
    [upsert],
  );

  const remove = useCallback(
    async (poll: Poll) => {
      try {
        await deletePoll(poll.id);
        replacePolls((polls) => polls.filter((p) => p.id !== poll.id));
        toast.success("Poll deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't delete the poll");
      }
    },
    [replacePolls],
  );

  const report = useCallback(
    async (poll: Poll, reason: PollReportReason) => {
      try {
        const updated = await reportPoll(poll.id, reason);
        if (updated.hidden) {
          replacePolls((polls) => polls.filter((p) => p.id !== poll.id));
          toast.success("Thanks. That poll is now hidden.");
        } else {
          upsert(updated);
          toast.success("Thanks for reporting. It will be hidden if more classmates agree.");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Couldn't send the report");
      }
    },
    [replacePolls, upsert],
  );

  const { openPolls, endedPolls } = useMemo(
    () => ({
      openPolls: feed.polls.filter((p) => p.isOpen),
      endedPolls: feed.polls.filter((p) => !p.isOpen),
    }),
    [feed.polls],
  );

  return {
    feed,
    openPolls,
    endedPolls,
    isLoading,
    votingPollId,
    refresh,
    vote,
    clearVote,
    create,
    close,
    remove,
    report,
  };
}

export type PollFeedController = ReturnType<typeof usePollFeed>;
