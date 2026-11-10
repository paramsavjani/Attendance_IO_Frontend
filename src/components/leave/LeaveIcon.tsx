import { useId } from "react";
import { cn } from "@/lib/utils";

/** The leave planner's icon, a sibling of PollsIcon: a calendar with days off picked and a plane badge. */
export function LeaveIcon({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 flex-shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06B6D4" />
          <stop offset="0.55" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      {/* Calendar page */}
      <rect x="5.5" y="8" width="17" height="17" rx="3" fill="#fff" fillOpacity="0.95" />
      <path d="M5.5 11a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v1.6h-17z" fill="#F43F5E" />
      <rect x="9" y="6.2" width="1.8" height="4" rx="0.9" fill="#fff" />
      <rect x="17.2" y="6.2" width="1.8" height="4" rx="0.9" fill="#fff" />
      {/* Days, two of them taken off */}
      <rect x="8" y="15" width="3.2" height="3" rx="1" fill="#CBD5E1" />
      <rect x="12.4" y="15" width="3.2" height="3" rx="1" fill="#F59E0B" />
      <rect x="16.8" y="15" width="3.2" height="3" rx="1" fill="#F59E0B" />
      <rect x="8" y="19.5" width="3.2" height="3" rx="1" fill="#CBD5E1" />
      <rect x="12.4" y="19.5" width="3.2" height="3" rx="1" fill="#CBD5E1" />
      {/* Plane badge */}
      <circle cx="23" cy="22.5" r="5.2" fill="#fff" />
      <path
        d="M25.6 20.1c.3-.3.3-.7 0-1s-.7-.3-1 0l-1.4 1.4-3.3-1-.7.7 2.7 1.6-1.4 1.4-1.1-.2-.5.5 1.4.8.8 1.4.5-.5-.2-1.1 1.4-1.4 1.6 2.7.7-.7-1-3.3z"
        fill="#3B82F6"
      />
    </svg>
  );
}
