// Color helpers shared by the server (search) and the browser (palette extraction).

export type RGB = [number, number, number];

const HEX = /^#[0-9a-f]{6}$/i;

export function isHex(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

// Weighted RGB distance ("redmean"). Cheap, and close enough to how people see color.
export function colorDistance(a: RGB, b: RGB): number {
  const rMean = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
}

export const COLOR_MATCH_THRESHOLD = 110;

export function paletteMatches(palette: string[] | null | undefined, target: string): boolean {
  if (!palette?.length || !isHex(target)) return false;
  const t = hexToRgb(target);
  return palette.some((hex) => isHex(hex) && colorDistance(hexToRgb(hex), t) < COLOR_MATCH_THRESHOLD);
}

// Keeps only valid, distinct, lowercase hex values, at most `max`.
export function cleanPalette(input: unknown, max = 6): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const value of input) {
    if (isHex(value)) {
      const lower = value.toLowerCase();
      if (!out.includes(lower)) out.push(lower);
    }
    if (out.length === max) break;
  }
  return out;
}

// Buckets pixels into a 4 bit per channel grid, then keeps the biggest buckets
// that are visibly different from each other. Takes raw RGBA so it runs in a
// canvas or in a test.
export function extractPalette(rgba: Uint8ClampedArray | Uint8Array, count = 5): string[] {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.n++; bucket.r += r; bucket.g += g; bucket.b += b;
    } else {
      buckets.set(key, { n: 1, r, g, b });
    }
  }
  const sorted = [...buckets.values()]
    .map((v) => ({ n: v.n, rgb: [v.r / v.n, v.g / v.n, v.b / v.n] as RGB }))
    .sort((a, b) => b.n - a.n);

  const picked: RGB[] = [];
  for (const { rgb } of sorted) {
    if (picked.every((p) => colorDistance(p, rgb) > 60)) picked.push(rgb);
    if (picked.length === count) break;
  }
  return picked.map(rgbToHex);
}

// The swatches offered above the wall.
export const SEARCH_SWATCHES: { hex: string; name: string }[] = [
  { hex: '#d23b2f', name: 'Red' },
  { hex: '#e8892b', name: 'Orange' },
  { hex: '#e9c73f', name: 'Yellow' },
  { hex: '#3f8f4f', name: 'Green' },
  { hex: '#2f78c4', name: 'Blue' },
  { hex: '#7a4bb3', name: 'Purple' },
  { hex: '#e48fae', name: 'Pink' },
  { hex: '#8a5a3b', name: 'Brown' },
  { hex: '#1d1f24', name: 'Black' },
  { hex: '#f2efe8', name: 'White' },
];
