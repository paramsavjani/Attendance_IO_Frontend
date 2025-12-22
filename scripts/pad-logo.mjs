import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

const inputPath = join(projectRoot, 'public', 'logo.png');
const outputDir = join(projectRoot, 'resources');
const outputLogoPath = join(outputDir, 'logo.png');

const outputIconPath = join(outputDir, 'icon.png');

function parseOffset(value, canvasSize) {
  // Accept pixels ("24", "24.5") or percent ("2%")
  const raw = (value ?? '').toString().trim();
  if (!raw) return 0;
  if (raw.endsWith('%')) {
    const pct = Number.parseFloat(raw.slice(0, -1));
    if (!Number.isFinite(pct)) throw new Error(`Invalid percent offset: ${value}`);
    return (canvasSize * pct) / 100;
  }
  const px = Number.parseFloat(raw);
  if (!Number.isFinite(px)) throw new Error(`Invalid pixel offset: ${value}`);
  return px;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Tune this to adjust icon "zoom".
// 1.0 = no padding (largest logo), smaller = more padding (smaller logo).
const scale = Number.parseFloat(process.env.ICON_SCALE ?? '0.82');
if (!Number.isFinite(scale) || scale <= 0 || scale > 1) {
  throw new Error(`ICON_SCALE must be a number between (0, 1]. Got: ${process.env.ICON_SCALE}`);
}

await mkdir(outputDir, { recursive: true });

const input = sharp(inputPath);
const meta = await input.metadata();
const w = meta.width ?? 0;
const h = meta.height ?? 0;
if (!w || !h) {
  throw new Error(`Unable to read image dimensions for ${inputPath}`);
}

const canvasSize = Math.max(w, h);
const targetSize = Math.max(1, Math.round(canvasSize * scale));

// Shift the logo within the square canvas (positive X = right, positive Y = down).
// Defaults to a small right shift to better match common launcher icon visual centering.
const offsetX = parseOffset(process.env.ICON_OFFSET_X ?? '2%', canvasSize);
const offsetY = parseOffset(process.env.ICON_OFFSET_Y ?? '0%', canvasSize);

const resized = await sharp(inputPath)
  .resize(targetSize, targetSize, { fit: 'contain' })
  .png()
  .toBuffer();

const canvas = sharp({
  create: {
    width: canvasSize,
    height: canvasSize,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
});

const baseLeft = (canvasSize - targetSize) / 2;
const baseTop = (canvasSize - targetSize) / 2;
const left = Math.round(clamp(baseLeft + offsetX, 0, canvasSize - targetSize));
const top = Math.round(clamp(baseTop + offsetY, 0, canvasSize - targetSize));

await canvas.composite([{ input: resized, left, top }]).png().toFile(outputLogoPath);
await canvas.composite([{ input: resized, left, top }]).png().toFile(outputIconPath);

console.log(`Wrote padded logo: ${outputLogoPath}`);
console.log(`Wrote padded icon: ${outputIconPath}`);

