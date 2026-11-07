import { API_CONFIG, authenticatedFetch } from "./api";
import {
  Poll,
  CreatePollPayload,
  CastVotePayload,
  ReportPollPayload,
  PollNotificationPreferences,
} from "@/types/poll";

const LOCAL_STORAGE_POLLS_KEY = "attendance_io_mock_polls_v1";
const LOCAL_STORAGE_POLL_NOTIF_KEY = "attendance_io_poll_notification_prefs";
const LOCAL_STORAGE_REPORTED_POLLS_KEY = "attendance_io_reported_polls";
const SPAM_REPORT_HIDE_THRESHOLD = 3;

/**
 * Helper to retrieve local mock/cached polls from localStorage
 */
function getStoredPolls(): Poll[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_POLLS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredPolls(polls: Poll[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_POLLS_KEY, JSON.stringify(polls));
  } catch (e) {
    console.error("Failed to save polls in local cache:", e);
  }
}

/**
 * Fetch all polls for a given subject.
 * Falls back to local resilient store when backend is pending or in dev.
 */
export async function fetchPollsForSubject(subjectId: string): Promise<Poll[]> {
  try {
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.POLLS_BY_SUBJECT(subjectId));
    if (response.ok) {
      const data = await response.json();
      const pollsList: Poll[] = Array.isArray(data) ? data : data.polls || [];
      // sync to local cache
      const cached = getStoredPolls().filter((p) => p.subjectId !== subjectId);
      saveStoredPolls([...cached, ...pollsList]);
      return pollsList;
    }
  } catch (error) {
    console.debug("[Polls API] Server poll endpoint not reachable, loading local polls store:", error);
  }

  // Graceful fallback for offline / mock dev mode
  const localPolls = getStoredPolls().filter((p) => p.subjectId === subjectId);
  return localPolls;
}

/**
 * Fetch single poll details
 */
export async function fetchPollDetail(pollId: string): Promise<Poll | null> {
  try {
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.POLL_DETAIL(pollId));
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.debug("[Polls API] Using local poll detail cache:", error);
  }

  const found = getStoredPolls().find((p) => p.id === pollId);
  return found || null;
}

/**
 * Create a new poll for a subject
 */
export async function createPoll(payload: CreatePollPayload, creatorInfo?: { id: string; name: string }): Promise<Poll> {
  try {
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.POLLS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const created: Poll = await response.json();
      const all = getStoredPolls();
      saveStoredPolls([created, ...all]);
      return created;
    }
  } catch (error) {
    console.debug("[Polls API] Server offline/pending, saving locally:", error);
  }

  // Resilient local store implementation
  const now = new Date().toISOString();
  const options = payload.options.map((text, idx) => ({
    id: `opt_${Date.now()}_${idx}`,
    pollId: `poll_${Date.now()}`,
    optionText: text,
    displayOrder: idx,
    voteCount: 0,
  }));

  const localPoll: Poll = {
    id: `poll_${Date.now()}`,
    subjectId: payload.subjectId,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    pollType: payload.pollType,
    status: "ACTIVE",
    endDate: payload.endDate || null,
    createdAt: now,
    createdBy: {
      id: creatorInfo?.id || "me",
      name: creatorInfo?.name || "You",
    },
    options,
    totalVotes: 0,
    userVotedOptionIds: [],
    reportCount: 0,
    isFlaggedSpam: false,
  };

  const stored = getStoredPolls();
  saveStoredPolls([localPoll, ...stored]);
  return localPoll;
}

/**
 * Vote or update a vote on a poll
 */
export async function castPollVote(payload: CastVotePayload): Promise<Poll> {
  try {
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.POLL_VOTE(payload.pollId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionIds: payload.optionIds }),
    });

    if (response.ok) {
      const updated: Poll = await response.json();
      const stored = getStoredPolls().map((p) => (p.id === updated.id ? updated : p));
      saveStoredPolls(stored);
      return updated;
    }
  } catch (error) {
    console.debug("[Polls API] Server offline/pending, persisting vote locally:", error);
  }

  // Local fallback vote calculator
  const stored = getStoredPolls();
  const poll = stored.find((p) => p.id === payload.pollId);
  if (!poll) throw new Error("Poll not found");

  const prevVoted = poll.userVotedOptionIds || [];

  const updatedOptions = poll.options.map((opt) => {
    let diff = 0;
    const wasSelected = prevVoted.includes(opt.id);
    const isNowSelected = payload.optionIds.includes(opt.id);

    if (wasSelected && !isNowSelected) diff = -1;
    if (!wasSelected && isNowSelected) diff = 1;

    return {
      ...opt,
      voteCount: Math.max(0, opt.voteCount + diff),
    };
  });

  const total = updatedOptions.reduce((acc, o) => acc + o.voteCount, 0);

  const updatedPoll: Poll = {
    ...poll,
    options: updatedOptions,
    totalVotes: total,
    userVotedOptionIds: payload.optionIds,
  };

  saveStoredPolls(stored.map((p) => (p.id === updatedPoll.id ? updatedPoll : p)));
  return updatedPoll;
}

/**
 * Close a poll (Creator action)
 */
export async function closePoll(pollId: string): Promise<Poll> {
  try {
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.POLL_CLOSE(pollId), {
      method: "POST",
    });

    if (response.ok) {
      const updated: Poll = await response.json();
      return updated;
    }
  } catch (error) {
    console.debug("[Polls API] Server offline/pending, closing locally:", error);
  }

  const stored = getStoredPolls();
  const poll = stored.find((p) => p.id === pollId);
  if (!poll) throw new Error("Poll not found");

  const updatedPoll: Poll = { ...poll, status: "CLOSED" };
  saveStoredPolls(stored.map((p) => (p.id === pollId ? updatedPoll : p)));
  return updatedPoll;
}

/**
 * Delete a poll (Creator action, allowed if no votes or creator cleanup)
 */
export async function deletePoll(pollId: string): Promise<boolean> {
  try {
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.POLL_DELETE(pollId), {
      method: "DELETE",
    });

    if (response.ok) {
      const stored = getStoredPolls().filter((p) => p.id !== pollId);
      saveStoredPolls(stored);
      return true;
    }
  } catch (error) {
    console.debug("[Polls API] Deleting locally:", error);
  }

  const stored = getStoredPolls().filter((p) => p.id !== pollId);
  saveStoredPolls(stored);
  return true;
}

/**
 * Report a poll or author for spam / offensive content.
 * If reportCount >= SPAM_REPORT_HIDE_THRESHOLD, the poll is automatically hidden/flagged.
 */
export async function reportPoll(payload: ReportPollPayload): Promise<{ isHidden: boolean; reportCount: number }> {
  try {
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.POLL_REPORT(payload.pollId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (error) {
    console.debug("[Polls API] Recording report locally:", error);
  }

  const stored = getStoredPolls();
  const poll = stored.find((p) => p.id === payload.pollId);
  const currentReports = (poll?.reportCount || 0) + 1;
  const isHidden = currentReports >= SPAM_REPORT_HIDE_THRESHOLD;

  if (poll) {
    const updatedPoll: Poll = {
      ...poll,
      reportCount: currentReports,
      isFlaggedSpam: isHidden,
      hasReported: true,
    };
    saveStoredPolls(stored.map((p) => (p.id === payload.pollId ? updatedPoll : p)));
  }

  // Also record locally reported poll IDs
  try {
    const reports = JSON.parse(localStorage.getItem(LOCAL_STORAGE_REPORTED_POLLS_KEY) || "[]");
    if (!reports.includes(payload.pollId)) {
      reports.push(payload.pollId);
      localStorage.setItem(LOCAL_STORAGE_REPORTED_POLLS_KEY, JSON.stringify(reports));
    }
  } catch {
    // ignore
  }

  return { isHidden, reportCount: currentReports };
}

/**
 * Get student's poll notification preferences
 */
export async function getPollNotificationPreferences(): Promise<PollNotificationPreferences> {
  try {
    const res = await authenticatedFetch(API_CONFIG.ENDPOINTS.POLL_NOTIFICATION_PREFERENCES);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }

  try {
    const local = localStorage.getItem(LOCAL_STORAGE_POLL_NOTIF_KEY);
    if (local) return JSON.parse(local);
  } catch {
    // ignore
  }

  return { notifyNewPolls: true, notifyPollResults: true };
}

/**
 * Save student's poll notification preferences
 */
export async function savePollNotificationPreferences(
  prefs: PollNotificationPreferences
): Promise<boolean> {
  try {
    await authenticatedFetch(API_CONFIG.ENDPOINTS.POLL_NOTIFICATION_PREFERENCES, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
  } catch {
    // ignore
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_POLL_NOTIF_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

