import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Floating launcher for the assistant: a round gradient button pinned above the bottom nav on
 * the right, independent of the nav pill. Hidden on pages that have their own full-screen flow.
 */
export function AssistantFab() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith("/assistant")) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/assistant")}
      aria-label="Ask the assistant"
      className={cn(
        "fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full",
        "bg-gradient-to-br from-primary via-[hsl(262_83%_62%)] to-[hsl(292_84%_60%)] text-white",
        "shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.75),0_0_0_1px_hsl(0_0%_100%/0.25)_inset]",
        "transition-transform duration-200 ease-out active:scale-90",
      )}
      style={{ bottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* soft glow ring */}
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-primary to-[hsl(292_84%_60%)] opacity-60 blur-md" />
      <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-primary/25 [animation-duration:2.4s]" />
      <SparkIcon className="relative h-7 w-7" />
    </button>
  );
}

/** Four-point AI spark with a small companion star — reads as "AI" at a glance, no vendor logo. */
export function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M11 3.5c.3-.9 1.7-.9 2 0l1.6 4.9a1 1 0 0 0 .6.6l4.9 1.6c.9.3.9 1.7 0 2l-4.9 1.6a1 1 0 0 0-.6.6L13 19.7c-.3.9-1.7.9-2 0l-1.6-4.9a1 1 0 0 0-.6-.6L3.9 12.6c-.9-.3-.9-1.7 0-2l4.9-1.6a1 1 0 0 0 .6-.6L11 3.5Z"
        fill="currentColor"
      />
      <path
        d="M18.5 2.2c.1-.4.7-.4.8 0l.5 1.4c0 .1.1.2.2.2l1.4.5c.4.1.4.7 0 .8l-1.4.5a.3.3 0 0 0-.2.2l-.5 1.4c-.1.4-.7.4-.8 0l-.5-1.4a.3.3 0 0 0-.2-.2l-1.4-.5c-.4-.1-.4-.7 0-.8l1.4-.5c.1 0 .2-.1.2-.2l.5-1.4Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}
