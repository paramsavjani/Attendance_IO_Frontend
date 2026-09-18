/**
 * "Sunrise" page transition anchored at a point on screen: a dark sun with a violet rim grows out
 * of the assistant launcher until it covers the page, the route swaps underneath, and the sun
 * fades away. Leaving runs it in reverse — the sun appears and shrinks back into the icon.
 *
 * Performance notes (this runs on mid-range Android WebViews):
 * - The sun is a SMALL element (BASE_PX wide) scaled up by transform, so the GPU holds a tiny
 *   texture instead of a viewport-sized one. Scaling a soft gradient stays soft.
 * - Only transform/opacity are animated (compositor thread) — no shadows, no filters — so frames
 *   keep coming even while React mounts the new page on the main thread.
 * - While the sun moves, backdrop-filter surfaces underneath (the glass nav) are switched off via
 *   `html.sunrise-active`; re-blurring them every frame is what made the effect stutter.
 */

export interface RevealOrigin {
  x: number;
  y: number;
}

let lastOrigin: RevealOrigin | null = null;
let running = false;

/** Centre of an element, for use as the reveal origin. */
export function originOf(el: Element | null): RevealOrigin | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Where the page last opened from, so "back" can collapse to the same spot. */
export function lastRevealOrigin(): RevealOrigin | null {
  return lastOrigin;
}

const BASE_PX = 200;
const OPEN_MS = 420;
/** Point in the growth (0–1) at which the disc has covered the viewport; the route swaps here. */
const SWAP_AT = 0.62;
const FADE_MS = 50;
const COVER_MS = 110;
const CLOSE_MS = 400;

function reducedMotion(): boolean {
  return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Small circle centred on [origin]; `scale` is the factor that makes it reach past the farthest corner. */
function makeSun(origin: RevealOrigin): { sun: HTMLDivElement; scale: number } {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const radius = Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y)) + 12;
  const sun = document.createElement("div");
  sun.className = "sunrise-sun";
  sun.style.width = `${BASE_PX}px`;
  sun.style.height = `${BASE_PX}px`;
  sun.style.left = `${origin.x - BASE_PX / 2}px`;
  sun.style.top = `${origin.y - BASE_PX / 2}px`;
  document.body.appendChild(sun);
  return { sun, scale: (radius * 2) / BASE_PX };
}

function animate(el: HTMLElement, keyframes: Keyframe[], ms: number, easing: string): Promise<void> {
  return el.animate(keyframes, { duration: ms, easing, fill: "forwards" }).finished.then(() => undefined);
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

function begin(origin: RevealOrigin) {
  running = true;
  document.documentElement.classList.add("sunrise-active");
  return makeSun(origin);
}

function end(sun: HTMLElement) {
  sun.remove();
  document.documentElement.classList.remove("sunrise-active");
  running = false;
}

/** Open a page so it grows out of [origin]. Remembers the origin for [collapseTo]. */
export async function revealFrom(origin: RevealOrigin | null, navigateNow: () => void): Promise<void> {
  lastOrigin = origin;
  if (!origin || running || reducedMotion()) {
    navigateNow();
    return;
  }
  const { sun, scale } = begin(origin);
  try {
    const grow = animate(sun, [{ transform: "scale(0)" }, { transform: `scale(${scale})` }], OPEN_MS, "cubic-bezier(0.22, 0.9, 0.24, 1)");
    // Swap the route while the sun is still growing — by SWAP_AT the disc already hides the
    // whole viewport (the ease-out curve front-loads the growth), so the new page mounts and
    // paints underneath and is ready the instant the growth ends.
    await new Promise((r) => setTimeout(r, OPEN_MS * SWAP_AT));
    navigateNow();
    await grow;
    await animate(sun, [{ opacity: 1 }, { opacity: 0 }], FADE_MS, "ease-out");
  } finally {
    end(sun);
  }
}

/** Leave a page so it shrinks back into [origin] (defaults to where it was opened from). */
export async function collapseTo(origin: RevealOrigin | null, navigateNow: () => void): Promise<void> {
  const target = origin ?? lastOrigin;
  if (!target || running || reducedMotion()) {
    navigateNow();
    return;
  }
  const { sun, scale } = begin(target);
  try {
    sun.style.transform = `scale(${scale})`;
    await animate(sun, [{ opacity: 0 }, { opacity: 1 }], COVER_MS, "ease-in");
    navigateNow();
    await nextFrame();
    await animate(sun, [{ transform: `scale(${scale})` }, { transform: "scale(0)" }], CLOSE_MS, "cubic-bezier(0.55, 0.05, 0.35, 1)");
  } finally {
    end(sun);
  }
}
