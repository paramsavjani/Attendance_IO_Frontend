/**
 * Last good copy of the read-only data the app needs to open: who you are, your subjects,
 * timetables and attendance. When a request can't reach the server, `authenticatedFetch` answers
 * from here, so the app opens on its last-known state instead of the "No internet" page.
 *
 * The same copy also lets the app draw its first screen immediately on a normal launch, then
 * refresh from the network (see AuthContext / AttendanceContext).
 *
 * Only GET responses from the endpoints below are kept, and everything is wiped on logout.
 */
const CACHE_KEY = "attendance_io_offline_cache_v1";
/** Attendance is cached per date (?date=...), so cap how many responses are kept. */
const MAX_ENTRIES = 40;
/** Answers served from the cache carry this header, so callers can tell. */
export const OFFLINE_HEADER = "X-Offline-Cache";

const CACHEABLE_PATHS = [
  "/api/user/init",
  "/api/user/me",
  "/api/student/enrollment/subjects",
  "/api/student/enrollment/sleep-duration",
  "/api/timetable",
  "/api/lab-timetable",
  "/api/tutorial-timetable",
  "/api/time-slots",
  "/api/attendance",
  "/api/attendance/lab-tutorial",
];

interface Entry {
  body: string;
  at: number;
}

function pathOf(url: string): string {
  try {
    return new URL(url, "http://local").pathname;
  } catch {
    return url;
  }
}

export function isCacheable(url: string, method?: string): boolean {
  if (method && method.toUpperCase() !== "GET") return false;
  return CACHEABLE_PATHS.includes(pathOf(url));
}

function readAll(): Record<string, Entry> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveToOfflineCache(url: string, body: string): void {
  try {
    const all = readAll();
    all[url] = { body, at: Date.now() };
    const urls = Object.keys(all);
    if (urls.length > MAX_ENTRIES) {
      urls
        .sort((a, b) => all[a].at - all[b].at)
        .slice(0, urls.length - MAX_ENTRIES)
        .forEach((u) => delete all[u]);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(all));
  } catch {
    // storage full or blocked: the app simply won't open offline
  }
}

/** The cached response for `url` as if the server had sent it, or null if there is none. */
export function offlineResponse(url: string): Response | null {
  const entry = readAll()[url];
  if (!entry) return null;
  return new Response(entry.body, {
    status: 200,
    headers: { "Content-Type": "application/json", [OFFLINE_HEADER]: String(entry.at) },
  });
}

/**
 * The saved body for `url`, parsed, for drawing the first screen instantly while the network
 * catches up. Null when nothing is saved.
 */
export function readCachedJson<T = unknown>(url: string): T | null {
  const entry = readAll()[url];
  if (!entry) return null;
  try {
    return JSON.parse(entry.body) as T;
  } catch {
    return null;
  }
}

/** When `url`'s saved copy was stored (ms), or 0 if there is none. */
export function savedAt(url: string): number {
  return readAll()[url]?.at ?? 0;
}

/** True when the app has enough saved to open without a connection. */
export function hasOfflineSnapshot(): boolean {
  return Object.keys(readAll()).some((url) => pathOf(url) === "/api/user/init");
}

export function clearOfflineCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
