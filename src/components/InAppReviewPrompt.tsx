import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { requestAppReview } from "@/lib/in-app-review";

const FIRST_LAUNCH_KEY = "attendance_io_first_launch_at";
const LAST_PROMPT_KEY = "attendance_io_last_review_prompt_at";
const DAYS_UNTIL_FIRST_PROMPT = 7;
const DAYS_BETWEEN_PROMPTS = 6;

function getStoredDate(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStoredDate(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * Show the Play Store in-app review popup: first time after 7 days, then every 6 days.
 * Google does not provide an API to know if the user reviewed; the Play Store itself
 * throttles the dialog (e.g. won’t show again for users who already reviewed).
 */
export function InAppReviewPrompt() {
  const { isAuthenticated, student } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !student || student.isDemo) return;

    let cancelled = false;

    const run = () => {
      const now = new Date().toISOString().slice(0, 10);
      let firstLaunch = getStoredDate(FIRST_LAUNCH_KEY);
      if (!firstLaunch) {
        setStoredDate(FIRST_LAUNCH_KEY, now);
        firstLaunch = now;
      }

      const daysSinceFirst = daysBetween(firstLaunch, now);
      if (daysSinceFirst < DAYS_UNTIL_FIRST_PROMPT) return;

      const lastPrompt = getStoredDate(LAST_PROMPT_KEY);
      if (lastPrompt) {
        const daysSincePrompt = daysBetween(lastPrompt, now);
        if (daysSincePrompt < DAYS_BETWEEN_PROMPTS) return;
      }

      setStoredDate(LAST_PROMPT_KEY, now);
      requestAppReview();
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, student?.id, student?.isDemo]);

  return null;
}
