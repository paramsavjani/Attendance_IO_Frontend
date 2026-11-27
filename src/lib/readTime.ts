import { useEffect, useRef } from "react";

/**
 * Active reading time for whatever is open while `key` is set (an experience, a JD file). A second counts only
 * while the page is visible and the reader touched, scrolled or typed in the last minute, so a phone left on
 * the screen doesn't run the clock. `progress` (0–100) is sampled on scroll; the furthest point is kept.
 *
 * `report(seconds, maxProgress, final)` gets the seconds since the last report: when the app goes to the
 * background (the OS may kill it there, so time is never lost) and once more when `key` changes or the
 * view closes (final = true). Nothing is sent for under 2 seconds.
 */
export function useReadTime(
  key: string | null,
  progress: () => number,
  report: (seconds: number, maxProgress: number, final: boolean) => void,
) {
  const progressRef = useRef(progress);
  const reportRef = useRef(report);
  progressRef.current = progress;
  reportRef.current = report;

  useEffect(() => {
    if (!key) return;
    const TICK = 5_000;
    const IDLE = 60_000;
    let seconds = 0;
    let max = 0;
    let lastInput = Date.now();
    const sample = () => {
      const p = Math.max(0, Math.min(100, Math.round(progressRef.current() || 0)));
      if (p > max) max = p;
    };
    const onInput = () => {
      lastInput = Date.now();
      sample();
    };
    const tick = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInput < IDLE) seconds += TICK / 1000;
    }, TICK);
    const flush = (final: boolean) => {
      sample();
      if (seconds >= 2 || (final && max > 0 && seconds > 0)) reportRef.current(seconds, max, final);
      seconds = 0;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush(false);
      else lastInput = Date.now();
    };
    sample();
    document.addEventListener("scroll", onInput, { capture: true, passive: true });
    document.addEventListener("touchstart", onInput, { passive: true });
    document.addEventListener("pointerdown", onInput, { passive: true });
    document.addEventListener("keydown", onInput);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(tick);
      document.removeEventListener("scroll", onInput, { capture: true });
      document.removeEventListener("touchstart", onInput);
      document.removeEventListener("pointerdown", onInput);
      document.removeEventListener("keydown", onInput);
      document.removeEventListener("visibilitychange", onVisibility);
      flush(true);
    };
  }, [key]);
}

/** How much of `el` has scrolled into view, 0–100: its bottom edge reaching the bottom of the screen = 100. */
export function seenPercent(el: HTMLElement | null): number {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  if (r.height <= 0) return 0;
  return ((window.innerHeight - r.top) / r.height) * 100;
}
