import { useId } from "react";
import { cn } from "@/lib/utils";

/** The placements icon, a sibling of PollsIcon and LeaveIcon: a briefcase with a rising-package badge. */
export function PlacementsIcon({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 flex-shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="0.55" stopColor="#F97316" />
          <stop offset="1" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      {/* Briefcase */}
      <path d="M11.5 10.5V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" fill="none" stroke="#fff" strokeWidth="1.8" />
      <rect x="5.5" y="10.5" width="20" height="13.5" rx="3" fill="#fff" fillOpacity="0.95" />
      <path d="M5.5 15.5h20" stroke="#FDBA74" strokeWidth="1.4" />
      <rect x="13.8" y="14.2" width="3.4" height="2.8" rx="0.8" fill="#F97316" />
      {/* Rising badge */}
      <circle cx="23.5" cy="23" r="5.2" fill="#fff" />
      <path d="M20.9 25.1l2-2.1 1.3 1.2 2.3-2.6" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24.8 21.5h1.8v1.8" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
