import { Capacitor, registerPlugin } from "@capacitor/core";
import { API_CONFIG, authenticatedFetch } from "@/lib/api";
import { getToken } from "@/lib/token";

/** Native side lives in android/.../WidgetBridgePlugin.java. */
interface WidgetBridgePlugin {
  update(options: { snapshot: string; token?: string; apiBase?: string }): Promise<void>;
  clear(): Promise<void>;
  status(): Promise<WidgetCounts>;
  // Added with marking from notifications and shortcuts; older app builds reject these
  setClassCheck(options: { enabled: boolean }): Promise<void>;
  getClassCheck(): Promise<{ enabled: boolean }>;
  takeMarks(): Promise<{ marks: string }>;
  canPin(): Promise<{ supported: boolean }>;
  pin(options: { kind: WidgetKind }): Promise<{ requested: boolean }>;
}

export type WidgetKind = "today" | "subjects" | "mini";

/** How many of each widget the student has on their home screen. */
export interface WidgetCounts {
  today: number;
  subjects: number;
  mini: number;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>("WidgetBridge");

export interface WidgetClass {
  start: string; // "HH:mm"
  end: string;
  name: string;
  room: string;
  type: "lecture" | "lab" | "tutorial";
  percent: number | null;
  min: number;
  /** What a mark from the notification or a shortcut sends: the subject, and its lecture slot (null for labs and custom times). */
  subjectId: string;
  slot: number | null;
  /** Today's classes only: how the student marked it, if they have. */
  status: "present" | "absent" | "cancelled" | null;
}

export interface WidgetSubject {
  name: string;
  code: string;
  present: number;
  total: number;
  percent: number | null;
  min: number;
  /** Lectures that can still be skipped this semester without going under `min`. */
  canSkip: number;
  /** Lectures in a row needed to get back to `min`, when under it. */
  needed: number;
}

/** False on the web and on app versions built before the widget existed (an OTA bundle can reach those). */
function available(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("WidgetBridge");
}

/** Hand the widgets the coming days' classes (keyed by date, YYYY-MM-DD) and every subject's standing. */
export async function updateWidget(days: Record<string, WidgetClass[]>, subjects: WidgetSubject[]): Promise<void> {
  if (!available()) return;
  try {
    await WidgetBridge.update({
      snapshot: JSON.stringify({ updatedAt: Date.now(), days, subjects }),
      // Lets the after-class notification and the app-icon shortcuts mark with this sign-in
      token: getToken() ?? undefined,
      apiBase: API_CONFIG.BASE_URL,
    });
  } catch (error) {
    console.debug("Widget update failed:", error);
  }
}

const REPORTED_KEY = "attendance_io_widget_counts_reported";

/**
 * Log a `widget_status` event whenever the student's widgets change (added, removed, or first
 * seen), so usage shows up per student in user_event without logging on every app open.
 */
export async function reportWidgetCounts(track: (eventType: string, metadata: Record<string, unknown>) => Promise<void>): Promise<void> {
  // trackAppEvent swallows network errors, so only report when the request can actually go out
  if (!available() || !navigator.onLine) return;
  try {
    const counts = await WidgetBridge.status();
    const key = `${counts.today},${counts.subjects},${counts.mini}`;
    if (localStorage.getItem(REPORTED_KEY) === key) return;
    await track("widget_status", { ...counts, total: counts.today + counts.subjects + counts.mini });
    localStorage.setItem(REPORTED_KEY, key);
  } catch {
    // older app versions or a failed request: try again next time
  }
}

export async function clearWidget(): Promise<void> {
  if (!available()) return;
  try {
    await WidgetBridge.clear();
  } catch {
    // nothing to clear
  }
}

/** A mark made from the after-class notification or an app-icon shortcut, handed back by the native side. */
export interface NativeMark {
  date: string;
  subjectId: string;
  slot: number | null;
  start: string;
  end: string;
  status: "present" | "absent" | "cancelled";
  /** False when there was no connection: the app should queue it like any offline mark. */
  sent: boolean;
  body: Record<string, unknown>;
}

/** Marks made outside the app since the last call (each is returned once). */
export async function takeNativeMarks(): Promise<NativeMark[]> {
  if (!available()) return [];
  try {
    const { marks } = await WidgetBridge.takeMarks();
    const parsed = JSON.parse(marks);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // an app build without it
  }
}

/** Whether the phone asks after each class itself; null on builds that can't. */
export async function getClassCheck(): Promise<boolean | null> {
  if (!available()) return null;
  try {
    return (await WidgetBridge.getClassCheck()).enabled;
  } catch {
    return null;
  }
}

export async function setClassCheck(enabled: boolean): Promise<boolean> {
  if (!available()) return false;
  try {
    await WidgetBridge.setClassCheck({ enabled });
    return true;
  } catch {
    return false;
  }
}

interface ReminderPrefs {
  id: string;
  dailyReminderHours?: number[];
  afterLectureReminderEnabled?: boolean;
  pollNotificationsEnabled?: boolean;
}

/**
 * Builds that can ask after class on the phone (with Present / Absent buttons) take over the
 * server's "after lecture" push, once per student on this phone: the phone's question follows the
 * student's setting, and the server one is switched off so the two never both arrive.
 */
const adoptedKey = (studentId: string) => `attendance_io_class_check_adopted_${studentId}`;

/** True once this phone has taken over the after-lecture reminder for this student. */
export function hasAdoptedClassCheck(studentId: string | undefined): boolean {
  if (!studentId) return false;
  try {
    return localStorage.getItem(adoptedKey(studentId)) === "1";
  } catch {
    return false;
  }
}

export async function adoptClassCheck(student: ReminderPrefs): Promise<void> {
  const key = adoptedKey(student.id);
  try {
    if (localStorage.getItem(key)) return;
  } catch {
    return;
  }
  if ((await getClassCheck()) === null || !navigator.onLine) return;

  const wanted = student.afterLectureReminderEnabled !== false;
  if (wanted) {
    const res = await authenticatedFetch(API_CONFIG.ENDPOINTS.NOTIFICATION_PREFERENCES, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dailyReminderHours: student.dailyReminderHours ?? [],
        afterLectureReminderEnabled: false,
        pollNotificationsEnabled: student.pollNotificationsEnabled !== false,
      }),
    }).catch(() => null);
    if (!res?.ok) return; // try again next open
  }
  await setClassCheck(wanted);
  try {
    localStorage.setItem(key, "1");
  } catch {
    // asked again next open; harmless
  }
}

/** Widgets on the home screen right now, or null on the web and builds without widgets. */
export async function getWidgetCounts(): Promise<WidgetCounts | null> {
  if (!available()) return null;
  try {
    return await WidgetBridge.status();
  } catch {
    return null;
  }
}

/** True when the launcher can add a widget straight from the app; null on builds that can't ask. */
export async function canPinWidget(): Promise<boolean | null> {
  if (!available()) return null;
  try {
    return (await WidgetBridge.canPin()).supported;
  } catch {
    return null;
  }
}

/** Ask the launcher to add a widget; it shows its own "Add to home screen" sheet. */
export async function pinWidget(kind: WidgetKind): Promise<boolean> {
  if (!available()) return false;
  try {
    return (await WidgetBridge.pin({ kind })).requested;
  } catch {
    return false;
  }
}
