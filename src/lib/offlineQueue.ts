/**
 * Attendance marks made without a connection, kept on the phone until they can be sent.
 *
 * One entry per class slot: marking the same class again replaces its entry, so only the
 * student's final choice is sent. Entries are sent oldest first when the connection returns.
 */
const QUEUE_KEY = "attendance_io_offline_queue_v1";
const CHANGED_EVENT = "attendance-offline-queue-changed";

export type AttendanceStatus = "present" | "absent" | "cancelled";

export interface QueuedMark {
  /** The slot key AttendanceContext uses, e.g. `2026-11-10-3-slot2`. */
  slotKey: string;
  date: string;
  subjectId: string;
  /** "mark" sends the POST body; "delete" removes an attendance row the server already has. */
  kind: "mark" | "delete";
  status?: AttendanceStatus;
  /** What the server had for this slot before any offline change, so stats can be adjusted correctly. */
  serverStatus?: AttendanceStatus | null;
  body?: Record<string, unknown>;
  attendanceId?: number;
  queuedAt: number;
}

export function readQueue(): QueuedMark[] {
  try {
    const items = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedMark[]): void {
  try {
    if (items.length === 0) localStorage.removeItem(QUEUE_KEY);
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // storage blocked: the mark stays on screen but won't survive a restart
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** Add or replace the entry for this slot. */
export function enqueueMark(item: Omit<QueuedMark, "queuedAt">): void {
  const rest = readQueue().filter((q) => q.slotKey !== item.slotKey);
  writeQueue([...rest, { ...item, queuedAt: Date.now() }]);
}

/** Drop the entry for this slot; with `queuedAt`, only if it is still that exact entry (not a newer tap). */
export function dequeueMark(slotKey: string, queuedAt?: number): void {
  writeQueue(readQueue().filter((q) => q.slotKey !== slotKey || (queuedAt !== undefined && q.queuedAt !== queuedAt)));
}

export function findQueued(slotKey: string): QueuedMark | undefined {
  return readQueue().find((q) => q.slotKey === slotKey);
}

export function clearQueue(): void {
  writeQueue([]);
}

/** Calls `onChange` with the number of waiting marks now and whenever it changes. */
export function subscribeQueue(onChange: (count: number) => void): () => void {
  const notify = () => onChange(readQueue().length);
  notify();
  window.addEventListener(CHANGED_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(CHANGED_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

/** A request that failed because there was no network, as opposed to the server saying no. */
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || (typeof navigator !== "undefined" && navigator.onLine === false);
}
