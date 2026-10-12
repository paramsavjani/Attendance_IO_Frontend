import { API_CONFIG, authenticatedFetch } from "@/lib/api";

export interface FeedbackReply {
  id: number;
  body: string;
  author: "OWNER" | "STUDENT";
  createdAt: string;
}

export interface MyFeedbackItem {
  id: number;
  type: "BUG" | "FEEDBACK" | "SUGGESTION";
  title: string;
  description: string;
  createdAt: string;
  replies: FeedbackReply[];
  hasUnreadReply: boolean;
}

export interface MyFeedback {
  items: MyFeedbackItem[];
  unreadCount: number;
  latestUnread: MyFeedbackItem | null;
}

/** Fired after a thread is marked read, so badges elsewhere can recount without a navigation. */
export const FEEDBACK_READ_EVENT = "aio:feedback-read";

const EMPTY: MyFeedback = { items: [], unreadCount: 0, latestUnread: null };

/**
 * The caller's own feedback threads. Never throws: this drives a badge and an optional dialog,
 * neither of which is worth failing a screen over, so a network problem just means "nothing new".
 */
export async function fetchMyFeedback(): Promise<MyFeedback> {
  try {
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.MY_FEEDBACK);
    if (!response.ok) return EMPTY;
    const data = (await response.json()) as Partial<MyFeedback>;
    return {
      items: data.items ?? [],
      unreadCount: data.unreadCount ?? 0,
      latestUnread: data.latestUnread ?? null,
    };
  } catch {
    return EMPTY;
  }
}

/** Clears the unread badge for one thread. Best effort — the badge reappearing is not a bug worth a toast. */
export async function markFeedbackSeen(feedbackId: number): Promise<void> {
  try {
    await authenticatedFetch(API_CONFIG.ENDPOINTS.FEEDBACK_SEEN(feedbackId), { method: "POST" });
  } catch {
    // ignore
  }
}

/**
 * The server stores timestamps as IST wall-clock with no zone (the backend runs in Asia/Kolkata),
 * so "2026-10-12T20:25:00" means 8:25 pm IST. Reading it as UTC would push every evening reply
 * onto the next day.
 */
export function parseServerTime(value: string): Date | null {
  if (!value) return null;
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(hasZone ? value : `${value}+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "12 Oct", or "12 Oct 2025" when it is not this year. */
export function formatFeedbackDate(value: string): string {
  const date = parseServerTime(value);
  if (!date) return "";
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** "just now", "5m ago", "3h ago", "yesterday", "4 days ago", then a date. */
export function relativeTime(value: string): string {
  const date = parseServerTime(value);
  if (!date) return "";
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return formatFeedbackDate(value);
}

/** How long the owner took to answer: "within an hour", "in 3 hours", "in 2 days". */
export function answeredIn(item: MyFeedbackItem): string | null {
  const first = item.replies[0];
  const sent = parseServerTime(item.createdAt);
  const replied = first ? parseServerTime(first.createdAt) : null;
  if (!sent || !replied) return null;
  const hours = (replied.getTime() - sent.getTime()) / 3_600_000;
  if (hours < 1) return "within an hour";
  if (hours < 24) return `in ${Math.round(hours)} ${Math.round(hours) === 1 ? "hour" : "hours"}`;
  const days = Math.round(hours / 24);
  return `in ${days} ${days === 1 ? "day" : "days"}`;
}

export function latestReply(item: MyFeedbackItem): FeedbackReply | undefined {
  return item.replies[item.replies.length - 1];
}

/** How long after [from] something happened, phrased for a chat timestamp: "2 days later". */
export function laterThan(from: string, to: string): string | null {
  const a = parseServerTime(from);
  const b = parseServerTime(to);
  if (!a || !b) return null;
  const hours = (b.getTime() - a.getTime()) / 3_600_000;
  if (hours < 1) return "within the hour";
  if (hours < 24) {
    const h = Math.round(hours);
    return `${h} ${h === 1 ? "hour" : "hours"} later`;
  }
  const days = Math.round(hours / 24);
  return days === 1 ? "a day later" : `${days} days later`;
}

/** Unread replies first, then newest first — the order an inbox is read in. */
export function inboxOrder(items: MyFeedbackItem[]): MyFeedbackItem[] {
  return [...items].sort((a, b) => {
    if (a.hasUnreadReply !== b.hasUnreadReply) return a.hasUnreadReply ? -1 : 1;
    const ta = parseServerTime(a.createdAt)?.getTime() ?? 0;
    const tb = parseServerTime(b.createdAt)?.getTime() ?? 0;
    return tb - ta;
  });
}
