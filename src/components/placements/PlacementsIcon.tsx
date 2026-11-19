import { useId } from "react";
import { cn } from "@/lib/utils";

/** The placements icon, a sibling of PollsIcon and LeaveIcon: falling bars with a downward trend arrow. */
export function PlacementsIcon({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 flex-shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="0.55" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#D946EF" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      {/* Bars, tallest first */}
      <rect x="7" y="13" width="4.2" height="12" rx="1.4" fill="#fff" />
      <rect x="13.9" y="16.5" width="4.2" height="8.5" rx="1.4" fill="#fff" fillOpacity="0.85" />
      <rect x="20.8" y="20" width="4.2" height="5" rx="1.4" fill="#fff" fillOpacity="0.7" />
      {/* Falling trend */}
      <path d="M7 6.5l6.5 4.8 3.5-2.3 7 5.5" fill="none" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24.6 11.6v3h-3" fill="none" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
