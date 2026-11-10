import { useEffect, useState } from "react";
import { CloudOff, RefreshCw } from "lucide-react";
import { useAttendance } from "@/contexts/AttendanceContext";

/** Small pill at the top: shown while offline, and while offline marks are waiting to sync. */
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
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex justify-center"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 6px)" }}
    >
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-neutral-900/95 px-3 py-1 text-[11px] font-medium text-neutral-200 shadow-lg backdrop-blur"
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
