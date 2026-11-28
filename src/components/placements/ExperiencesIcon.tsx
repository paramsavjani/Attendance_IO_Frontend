import { useId } from "react";
import { cn } from "@/lib/utils";

/** The interview experiences icon, a sibling of PlacementsIcon: a senior's speech bubble in front of a junior's. */
export function ExperiencesIcon({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 flex-shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0EA5E9" />
          <stop offset="0.55" stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      {/* The bubble behind */}
      <path
        d="M17 9.5h7.5a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5H24v2.6l-3.2-2.6H17a2.5 2.5 0 0 1-2.5-2.5v-5A2.5 2.5 0 0 1 17 9.5z"
        fill="#fff"
        fillOpacity="0.35"
      />
      {/* The bubble in front, with its two lines of text */}
      <path
        d="M7.5 12.5h10a2.5 2.5 0 0 1 2.5 2.5v5.5a2.5 2.5 0 0 1-2.5 2.5h-6.2L8 25.6V23h-.5A2.5 2.5 0 0 1 5 20.5V15a2.5 2.5 0 0 1 2.5-2.5z"
        fill="#fff"
      />
      <rect x="8" y="15.6" width="9" height="1.7" rx="0.85" fill="#6366F1" />
      <rect x="8" y="18.9" width="6" height="1.7" rx="0.85" fill="#6366F1" fillOpacity="0.55" />
    </svg>
  );
}
