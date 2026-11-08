import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import type { CreatePollInput, Poll, PollFeed, PollReportReason } from "@/types/poll";

/** Limits mirrored from the backend so the form can guide before the server has to refuse. */
export const POLL_LIMITS = {
  questionMax: 200,
  optionMax: 80,
  minOptions: 2,
  maxOptions: 6,
} as const;

export const POLL_DURATIONS = [
  { hours: 1, label: "1 hour" },
  { hours: 6, label: "6 hours" },
  { hours: 24, label: "1 day" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "1 week" },
] as const;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : "Something went wrong. Please try again.");
  }
  return body as T;
}

export const fetchPollFeed = () => request<PollFeed>(API_CONFIG.ENDPOINTS.POLLS);

export const createPoll = (input: CreatePollInput) =>
  request<Poll>(API_CONFIG.ENDPOINTS.POLLS, { method: "POST", body: JSON.stringify(input) });

export const votePoll = (pollId: number, optionIds: number[]) =>
  request<Poll>(API_CONFIG.ENDPOINTS.POLL_VOTE(pollId), { method: "PUT", body: JSON.stringify({ optionIds }) });

export const clearPollVote = (pollId: number) =>
  request<Poll>(API_CONFIG.ENDPOINTS.POLL_VOTE(pollId), { method: "DELETE" });

export const closePoll = (pollId: number) =>
  request<Poll>(API_CONFIG.ENDPOINTS.POLL_CLOSE(pollId), { method: "POST" });

export const deletePoll = (pollId: number) =>
  request<{ deleted: boolean }>(API_CONFIG.ENDPOINTS.POLL(pollId), { method: "DELETE" });

export const reportPoll = (pollId: number, reason: PollReportReason) =>
  request<Poll>(API_CONFIG.ENDPOINTS.POLL_REPORT(pollId), { method: "POST", body: JSON.stringify({ reason }) });

/** "5h left", "Ends in 12m", "Ended 2d ago". */
export function pollTimeLabel(poll: Poll, now: number = Date.now()): string {
  const diff = poll.endsAt - now;
  if (poll.isOpen && diff > 0) {
    const minutes = Math.ceil(diff / 60_000);
    if (minutes < 60) return `${minutes}m left`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h left`;
    return `${Math.round(hours / 24)}d left`;
  }
  const ago = Math.max(0, now - poll.endsAt);
  const minutes = Math.floor(ago / 60_000);
  if (minutes < 1) return "Ended just now";
  if (minutes < 60) return `Ended ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Ended ${hours}h ago`;
  return `Ended ${Math.floor(hours / 24)}d ago`;
}

/** Share of voters who picked an option, as a whole percent (multi-choice can sum past 100). */
export function optionPercent(votes: number, totalVoters: number): number {
  if (!votes || totalVoters === 0) return 0;
  return Math.round((votes / totalVoters) * 100);
}
