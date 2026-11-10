import { Capacitor, registerPlugin } from "@capacitor/core";

/** Native side lives in android/.../WidgetBridgePlugin.java. */
interface WidgetBridgePlugin {
  update(options: { snapshot: string }): Promise<void>;
  clear(): Promise<void>;
  status(): Promise<WidgetCounts>;
}

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
    await WidgetBridge.update({ snapshot: JSON.stringify({ updatedAt: Date.now(), days, subjects }) });
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
