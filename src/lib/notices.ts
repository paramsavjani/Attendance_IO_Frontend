import { API_CONFIG, authenticatedFetch } from "./api";
import { UrgentNotice, CreateNoticePayload, ReportNoticePayload } from "@/types/notice";

const LOCAL_STORAGE_NOTICES_KEY = "attendance_io_urgent_notices_v1";
const LOCAL_STORAGE_SEEN_NOTICES_KEY = "attendance_io_seen_notices_v1";
const LOCAL_STORAGE_REPORTED_NOTICES_KEY = "attendance_io_reported_notices_v1";
const LOCAL_STORAGE_USER_DAILY_POSTS_KEY = "attendance_io_user_daily_notice_posts_v1";

/** Get today date string YYYY-MM-DD */
export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Local resilient storage helper */
function getStoredNotices(): UrgentNotice[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_NOTICES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStoredNotices(notices: UrgentNotice[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_NOTICES_KEY, JSON.stringify(notices));
  } catch (e) {
    console.error("Failed to save local notices:", e);
  }
}

export function getSeenNoticeIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SEEN_NOTICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markNoticeSeenLocal(noticeId: string) {
  try {
    const seen = getSeenNoticeIds();
    if (!seen.includes(noticeId)) {
      seen.push(noticeId);
      localStorage.setItem(LOCAL_STORAGE_SEEN_NOTICES_KEY, JSON.stringify(seen));
    }
  } catch (e) {
    console.error("Failed to mark notice seen:", e);
  }
}

/** Check user daily notice post limit (max 2 per student per day) */
export function getTodayPostCountForUser(): number {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_DAILY_POSTS_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    if (data.date === getTodayDateString()) {
      return data.count || 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function incrementUserDailyPostCount() {
  try {
    const today = getTodayDateString();
    const current = getTodayPostCountForUser();
    localStorage.setItem(
      LOCAL_STORAGE_USER_DAILY_POSTS_KEY,
      JSON.stringify({ date: today, count: current + 1 })
    );
  } catch {
    // ignore
  }
}

/**
 * Fetch active unseen notices for today.
 * Notices expire at the end of the day.
 */
export async function fetchActiveNotices(): Promise<UrgentNotice[]> {
  try {
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.NOTICES_ACTIVE_TODAY);
    if (response.ok) {
      const data = await response.json();
      const list: UrgentNotice[] = Array.isArray(data) ? data : data.notices || [];
      return list;
    }
  } catch (err) {
    console.debug("[Notice API] Falling back to local notices cache:", err);
  }

  // Filter local store by today's date
  const today = getTodayDateString();
  const all = getStoredNotices();
  return all.filter((n) => n.createdAt.startsWith(today) && !n.isFlaggedSpam);
}

/**
 * Check if a duplicate notice of same type for this subject has already been posted today
 */
export function findDuplicateNoticeToday(subjectId: string, noticeType: string): UrgentNotice | null {
  const today = getTodayDateString();
  const notices = getStoredNotices();
  return (
    notices.find(
      (n) =>
        n.subjectId === subjectId &&
        n.noticeType === noticeType &&
        n.createdAt.startsWith(today) &&
        !n.isFlaggedSpam
    ) || null
  );
}

/**
 * Post an urgent notice
 */
export async function createUrgentNotice(
  payload: CreateNoticePayload,
  creatorInfo: { id: string; name: string; rollNumber?: string; pictureUrl?: string }
): Promise<UrgentNotice> {
  // Check daily limit (max 2 per day)
  if (getTodayPostCountForUser() >= 2) {
    throw new Error("You have reached the maximum limit of 2 urgent notices for today.");
  }

  try {
    const response = await authenticatedFetch(API_CONFIG.ENDPOINTS.NOTICES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const created: UrgentNotice = await response.json();
      const stored = getStoredNotices();
      saveStoredNotices([created, ...stored]);
      incrementUserDailyPostCount();
      return created;
    }
  } catch (err) {
    console.debug("[Notice API] Server endpoint offline, persisting locally:", err);
  }

  const now = new Date().toISOString();
  const localNotice: UrgentNotice = {
    id: `notice_${Date.now()}`,
    subjectId: payload.subjectId,
    title: payload.title.trim(),
    message: payload.message.trim(),
    noticeType: payload.noticeType,
    createdAt: now,
    createdBy: {
      id: creatorInfo.id,
      name: creatorInfo.name,
      sid: creatorInfo.rollNumber,
      pictureUrl: creatorInfo.pictureUrl,
    },
    reportCount: 0,
    isFlaggedSpam: false,
  };

  const stored = getStoredNotices();
  saveStoredNotices([localNotice, ...stored]);
  incrementUserDailyPostCount();
  return localNotice;
}

/**
 * Mark notice as seen (Got it button)
 */
export async function markNoticeSeen(noticeId: string): Promise<void> {
  markNoticeSeenLocal(noticeId);
  try {
    await authenticatedFetch(API_CONFIG.ENDPOINTS.NOTICES_SEEN(noticeId), {
      method: "POST",
    });
  } catch {
    // ignore
  }
}

/**
 * Report a notice for spam / incorrect information
 */
export async function reportNotice(payload: ReportNoticePayload): Promise<{ isHidden: boolean; message: string }> {
  try {
    const res = await authenticatedFetch(API_CONFIG.ENDPOINTS.NOTICES_REPORT(payload.noticeId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }

  // Local fallback: count reports, hide if reportCount >= 3
  const stored = getStoredNotices();
  const notice = stored.find((n) => n.id === payload.noticeId);
  if (notice) {
    const newReports = (notice.reportCount || 0) + 1;
    const isHidden = newReports >= 3;
    const updated = { ...notice, reportCount: newReports, isFlaggedSpam: isHidden };
    saveStoredNotices(stored.map((n) => (n.id === payload.noticeId ? updated : n)));
    return { isHidden, message: isHidden ? "Notice hidden due to community reports" : "Report recorded" };
  }

  return { isHidden: false, message: "Report recorded" };
}

