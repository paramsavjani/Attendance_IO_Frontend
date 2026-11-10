import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { useAttendance } from "@/contexts/AttendanceContext";

/**
 * Small pill just above the bottom navigation: shown while offline, and while offline marks are
 * waiting to sync. Left-aligned so it never sits under the assistant button on the right, and low
 * on the screen so it never covers the page title.
 */
export function OfflineStatusPill() {
  const { pendingSyncCount } = useAttendance();
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online && pendingSyncCount === 0) return null;

  const waiting = pendingSyncCount > 0 ? `${pendingSyncCount} ${pendingSyncCount === 1 ? "mark" : "marks"} to sync` : null;

  return (
    <div
      className="pointer-events-none fixed left-4 z-[90] flex max-w-[calc(100%-6.5rem)]"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)" }}
    >
      <div
        role="status"
        aria-live="polite"
        className="flex min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-neutral-900/95 px-3 py-1.5 text-[11px] font-medium text-neutral-200 shadow-lg backdrop-blur"
      >
        {online ? (
          <RefreshCw className="h-3 w-3 animate-spin text-sky-400" />
        ) : (
          <CloudOff className="h-3 w-3 text-amber-400" />
        )}
        {online ? `Syncing ${waiting}` : waiting ? `Offline · ${waiting}` : "Offline · showing saved data"}
      </div>
    </div>
  );
}
