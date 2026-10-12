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

/** The date a reply or submission carries, formatted the way the rest of the app does it. */
export function formatFeedbackDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
