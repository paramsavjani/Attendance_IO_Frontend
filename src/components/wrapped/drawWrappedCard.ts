import type { WrappedSummary } from "@/lib/wrapped";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
const FONT = "Outfit, system-ui, sans-serif";

function tone(percent: number): string {
  if (percent >= 85) return "#34d399";
  if (percent >= 75) return "#a5b4fc";
  if (percent >= 65) return "#fbbf24";
  return "#f87171";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Cut `text` to fit `maxWidth`, adding an ellipsis. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/**
 * Draws the shareable card at 1080×1350 (Instagram's 4:5), the same pixels shown on screen and
 * saved as the PNG, so what students preview is exactly what they post.
 */
export function drawWrappedCard(canvas: HTMLCanvasElement, data: WrappedSummary, firstName: string) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const pad = 80;
  const inner = CARD_WIDTH - pad * 2;

  // Background
  const bg = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  bg.addColorStop(0, "#1e1b4b");
  bg.addColorStop(0.55, "#0b0b12");
  bg.addColorStop(1, "#050507");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const glow = ctx.createRadialGradient(CARD_WIDTH - 120, 160, 0, CARD_WIDTH - 120, 160, 520);
  glow.addColorStop(0, "rgba(129, 140, 248, 0.35)");
  glow.addColorStop(1, "rgba(129, 140, 248, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.textBaseline = "alphabetic";

  // Header
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText("ATTENDANCE IO  ·  WRAPPED", pad, 130);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 64px ${FONT}`;
  ctx.fillText(fit(ctx, `${firstName}'s ${data.semesterLabel}`, inner), pad, 210);

  // Hero number
  ctx.fillStyle = tone(data.overallPercent);
  ctx.font = `800 220px ${FONT}`;
  const hero = `${Math.round(data.overallPercent)}%`;
  ctx.fillText(hero, pad - 8, 440);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `500 36px ${FONT}`;
  ctx.fillText(`overall attendance · ${data.lecturesAttended} of ${data.lecturesHeld} lectures`, pad, 500);

  // Best / toughest tiles
  const tileY = 560;
  const tileW = (inner - 24) / 2;
  const tiles: [string, typeof data.best][] = [
    ["Most regular in", data.best],
    ["Toughest one", data.toughest],
  ];
  tiles.forEach(([label, subject], i) => {
    const x = pad + i * (tileW + 24);
    roundRect(ctx, x, tileY, tileW, 190, 32);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `500 28px ${FONT}`;
    ctx.fillText(label, x + 32, tileY + 56);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 38px ${FONT}`;
    ctx.fillText(fit(ctx, subject?.name ?? "—", tileW - 64), x + 32, tileY + 110);
    if (subject) {
      ctx.fillStyle = tone(subject.percent);
      ctx.font = `700 40px ${FONT}`;
      ctx.fillText(`${Math.round(subject.percent)}%`, x + 32, tileY + 162);
    }
  });

  // Every subject as a bar
  let y = 830;
  const rows = data.subjects.slice(0, 5);
  const rowGap = rows.length > 4 ? 64 : 72;
  rows.forEach((s) => {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `500 30px ${FONT}`;
    ctx.fillText(fit(ctx, s.name, inner - 140), pad, y);
    ctx.textAlign = "right";
    ctx.fillStyle = tone(s.percent);
    ctx.font = `700 30px ${FONT}`;
    ctx.fillText(`${Math.round(s.percent)}%`, pad + inner, y);
    ctx.textAlign = "left";
    roundRect(ctx, pad, y + 14, inner, 10, 5);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();
    roundRect(ctx, pad, y + 14, Math.max(10, (inner * Math.min(100, s.percent)) / 100), 10, 5);
    ctx.fillStyle = tone(s.percent);
    ctx.fill();
    y += rowGap;
  });

  // Where the student stands
  const footerY = CARD_HEIGHT - 120;
  if (data.aheadOfPercent !== null) {
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(`Ahead of ${data.aheadOfPercent}% of students`, pad, footerY - 40);
    if (data.collegeAverage !== null) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `500 28px ${FONT}`;
      ctx.fillText(`College average ${Math.round(data.collegeAverage)}%`, pad, footerY + 4);
    }
  }
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `500 26px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("attendanceio.paramsavjani.in", pad + inner, footerY + 4);
  ctx.textAlign = "left";
}
