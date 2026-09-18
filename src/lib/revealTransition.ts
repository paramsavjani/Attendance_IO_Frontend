/**
 * "Sunrise" page transition anchored at a point on screen: a soft gray sun with a violet halo
 * grows out of the assistant launcher until it covers the page, the route swaps underneath, and
 * the sun fades away. Leaving runs it in reverse — the sun appears and shrinks back into the icon.
 *
 * Done with a plain overlay element rather than the View Transitions API on purpose: that API
 * animates static snapshots, so on a black-on-black app the growing circle is invisible. An
 * overlay can carry its own colour. Users who prefer reduced motion get a plain navigation.
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

const OPEN_MS = 440;
/** Point in the growth (0–1) at which the disc has covered the viewport; the route swaps here. */
const SWAP_AT = 0.62;
const FADE_MS = 50;
const COVER_MS = 120;
const CLOSE_MS = 420;

function reducedMotion(): boolean {
  return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A circle that, centred on [origin], reaches past the farthest corner of the viewport. */
function makeSun(origin: RevealOrigin): HTMLDivElement {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const radius = Math.ceil(Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y))) + 8;
  const sun = document.createElement("div");
  sun.className = "sunrise-sun";
  sun.style.width = `${radius * 2}px`;
  sun.style.height = `${radius * 2}px`;
  sun.style.left = `${origin.x - radius}px`;
  sun.style.top = `${origin.y - radius}px`;
  document.body.appendChild(sun);
  return sun;
}

function animate(el: HTMLElement, keyframes: Keyframe[], ms: number, easing: string): Promise<void> {
  return el.animate(keyframes, { duration: ms, easing, fill: "forwards" }).finished.then(() => undefined);
}

/** Open a page so it grows out of [origin]. Remembers the origin for [collapseTo]. */
export async function revealFrom(origin: RevealOrigin | null, navigateNow: () => void): Promise<void> {
  lastOrigin = origin;
  if (!origin || running || reducedMotion()) {
    navigateNow();
    return;
  }
  running = true;
  const sun = makeSun(origin);
  try {
    const grow = animate(sun, [{ transform: "scale(0)", opacity: 1 }, { transform: "scale(1)", opacity: 1 }], OPEN_MS, "cubic-bezier(0.22, 0.9, 0.24, 1)");
    // Swap the route while the sun is still growing — by SWAP_AT the disc already hides the
    // whole viewport (the ease-out curve front-loads the growth), so the new page mounts and
    // paints underneath and is ready the instant the growth ends. No wait after cover.
    await new Promise((r) => setTimeout(r, OPEN_MS * SWAP_AT));
    navigateNow();
    await grow;
    await animate(sun, [{ opacity: 1 }, { opacity: 0 }], FADE_MS, "ease-out");
  } finally {
    sun.remove();
    running = false;
  }
}

/** Leave a page so it shrinks back into [origin] (defaults to where it was opened from). */
export async function collapseTo(origin: RevealOrigin | null, navigateNow: () => void): Promise<void> {
  const target = origin ?? lastOrigin;
  if (!target || running || reducedMotion()) {
    navigateNow();
    return;
  }
  running = true;
  const sun = makeSun(target);
  try {
    await animate(sun, [{ transform: "scale(1)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], COVER_MS, "ease-in");
    navigateNow();
    await new Promise((r) => requestAnimationFrame(r));
    await animate(sun, [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0)", opacity: 1 }], CLOSE_MS, "cubic-bezier(0.55, 0.05, 0.35, 1)");
  } finally {
    sun.remove();
    running = false;
  }
}
