import { useId } from "react";
import { cn } from "@/lib/utils";

/** The class-polls app icon: a gradient tile holding three coloured result bars, the top one ticked. */
export function PollsIcon({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 flex-shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="0.55" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      {/* Bar tracks */}
      <rect x="6.5" y="8" width="19" height="4" rx="2" fill="#fff" fillOpacity="0.22" />
      <rect x="6.5" y="14" width="19" height="4" rx="2" fill="#fff" fillOpacity="0.22" />
      <rect x="6.5" y="20" width="19" height="4" rx="2" fill="#fff" fillOpacity="0.22" />
      {/* Results */}
      <rect x="6.5" y="8" width="14" height="4" rx="2" fill="#34D399" />
      <rect x="6.5" y="14" width="9.5" height="4" rx="2" fill="#FBBF24" />
      <rect x="6.5" y="20" width="5.5" height="4" rx="2" fill="#38BDF8" />
      {/* Winning answer tick */}
      <circle cx="23.5" cy="10" r="3.6" fill="#fff" />
      <path d="M21.9 10.1l1.1 1.1 2.1-2.3" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
