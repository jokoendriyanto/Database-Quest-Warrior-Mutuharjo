/**
 * Generate SEO/PWA PNG assets deterministically (no external deps).
 *
 * Outputs:
 *   public/og/database-quest-warrior-belajar-sql.png  (1200x630 — Open Graph / Twitter)
 *   public/apple-touch-icon.png                       (180x180)
 *   public/icon-512.png                               (512x512 — PWA manifest)
 *
 * Run: node scripts/generate-seo-images.mjs   (or: bun scripts/generate-seo-images.mjs)
 * Generated files are committed to the repo; build does NOT need to run this.
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------ PNG encoding ------------------------------ */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  // Add filter byte 0 to each scanline
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* --------------------------- tiny bitmap canvas --------------------------- */

class Canvas {
  constructor(w, h, bg) {
    this.w = w;
    this.h = h;
    this.buf = Buffer.alloc(w * h * 4);
    this.fillRect(0, 0, w, h, bg);
  }
  set(x, y, [r, g, b, a = 255]) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const na = a / 255;
    const oa = this.buf[i + 3] / 255;
    const outA = na + oa * (1 - na);
    if (outA === 0) return;
    this.buf[i] = Math.round((r * na + this.buf[i] * oa * (1 - na)) / outA);
    this.buf[i + 1] = Math.round((g * na + this.buf[i + 1] * oa * (1 - na)) / outA);
    this.buf[i + 2] = Math.round((b * na + this.buf[i + 2] * oa * (1 - na)) / outA);
    this.buf[i + 3] = Math.round(outA * 255);
  }
  fillRect(x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, color);
  }
  rectStroke(x, y, w, h, color, t = 1) {
    this.fillRect(x, y, w, t, color);
    this.fillRect(x, y + h - t, w, t, color);
    this.fillRect(x, y, t, h, color);
    this.fillRect(x + w - t, y, t, h, color);
  }
}

/* ------------------------------- 5x7 bitmap font -------------------------- */

const F = {
  A: [".XXX.", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  B: ["XXXX.", "X...X", "X...X", "XXXX.", "X...X", "X...X", "XXXX."],
  C: [".XXX.", "X...X", "X....", "X....", "X....", "X...X", ".XXX."],
  D: ["XXXX.", "X...X", "X...X", "X...X", "X...X", "X...X", "XXXX."],
  E: ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "XXXXX"],
  F: ["XXXXX", "X....", "X....", "XXXX.", "X....", "X....", "X...."],
  G: [".XXX.", "X...X", "X....", "X.XXX", "X...X", "X...X", ".XXX."],
  H: ["X...X", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  I: ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X..", "XXXXX"],
  J: ["..XXX", "...X.", "...X.", "...X.", "...X.", "X..X.", ".XX.."],
  K: ["X...X", "X..X.", "X.X..", "XX...", "X.X..", "X..X.", "X...X"],
  L: ["X....", "X....", "X....", "X....", "X....", "X....", "XXXXX"],
  M: ["X...X", "XX.XX", "X.X.X", "X.X.X", "X...X", "X...X", "X...X"],
  N: ["X...X", "XX..X", "X.X.X", "X..XX", "X...X", "X...X", "X...X"],
  O: [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  P: ["XXXX.", "X...X", "X...X", "XXXX.", "X....", "X....", "X...."],
  Q: [".XXX.", "X...X", "X...X", "X...X", "X.X.X", "X..X.", ".XX.X"],
  R: ["XXXX.", "X...X", "X...X", "XXXX.", "X.X..", "X..X.", "X...X"],
  S: [".XXXX", "X....", "X....", ".XXX.", "....X", "....X", "XXXX."],
  T: ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X..", "..X.."],
  U: ["X...X", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  V: ["X...X", "X...X", "X...X", "X...X", "X...X", ".X.X.", "..X.."],
  W: ["X...X", "X...X", "X...X", "X.X.X", "X.X.X", "XX.XX", "X...X"],
  X: ["X...X", "X...X", ".X.X.", "..X..", ".X.X.", "X...X", "X...X"],
  Y: ["X...X", "X...X", ".X.X.", "..X..", "..X..", "..X..", "..X.."],
  Z: ["XXXXX", "....X", "...X.", "..X..", ".X...", "X....", "XXXXX"],
  "0": [".XXX.", "X...X", "X..XX", "X.X.X", "XX..X", "X...X", ".XXX."],
  "1": ["..X..", ".XX..", "..X..", "..X..", "..X..", "..X..", ".XXX."],
  "2": [".XXX.", "X...X", "....X", "...X.", "..X..", ".X...", "XXXXX"],
  "3": ["XXXX.", "....X", "....X", ".XXX.", "....X", "....X", "XXXX."],
  "4": ["...X.", "..XX.", ".X.X.", "X..X.", "XXXXX", "...X.", "...X."],
  "5": ["XXXXX", "X....", "XXXX.", "....X", "....X", "X...X", ".XXX."],
  "6": [".XXX.", "X....", "X....", "XXXX.", "X...X", "X...X", ".XXX."],
  "7": ["XXXXX", "....X", "...X.", "..X..", ".X...", ".X...", ".X..."],
  "8": [".XXX.", "X...X", "X...X", ".XXX.", "X...X", "X...X", ".XXX."],
  "9": [".XXX.", "X...X", "X...X", ".XXXX", "....X", "....X", ".XXX."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ":": [".....", ".XX..", ".XX..", ".....", ".XX..", ".XX..", "....."],
  ">": ["X....", ".X...", "..X..", "...X.", "..X..", ".X...", "X...."],
  "*": [".....", "X.X.X", ".XXX.", "XXXXX", ".XXX.", "X.X.X", "....."],
  "=": [".....", "XXXXX", ".....", "XXXXX", ".....", ".....", "....."],
  ";": [".....", ".XX..", ".XX..", ".....", ".XX..", ".X...", "X...."],
  "&": [".XX..", "X..X.", "X..X.", ".XX..", "X.X.X", "X..X.", ".XX.X"],
  "-": [".....", ".....", ".....", ".XXX.", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".XX..", ".XX.."],
  ",": [".....", ".....", ".....", ".....", ".XX..", ".XX..", ".X..."],
  "·": [".....", ".....", ".XX..", ".XX..", ".....", ".....", "....."],
  "(": ["...X.", "..X..", ".X...", ".X...", ".X...", "..X..", "...X."],
  ")": [".X...", "..X..", "...X.", "...X.", "...X.", "..X..", ".X..."],
  d: ["..XXX", "..X.X", "..X.X", "..X.X", "..X.X", "..X.X", ".XXXX"],
  q: ["XXXX.", "...X.", "...X.", "...X.", "...X.", "X..X.", ".XX.."],
};

/** Draw text at (x, y) with pixel scale `s`; returns width consumed. */
function drawText(canvas, text, x, y, s, color, tracking = 1) {
  let cx = x;
  for (const ch of text) {
    const glyph = F[ch] ?? F["?"];
    if (glyph) {
      for (let gy = 0; gy < 7; gy++) {
        for (let gx = 0; gx < 5; gx++) {
          if (glyph[gy][gx] === "X") canvas.fillRect(cx + gx * s, y + gy * s, s, s, color);
        }
      }
    }
    cx += 5 * s + s * tracking;
  }
  return cx - x - s * tracking;
}

const measure = (text, s, tracking = 1) => text.length * (5 * s + s * tracking) - s * tracking;

/* --------------------------------- palette -------------------------------- */

const BG = [10, 17, 31, 255]; // #0A111F deep navy
const GRID = [255, 255, 255, 8];
const PANEL = [16, 27, 48, 255];
const PANEL_BORDER = [30, 45, 76, 255];
const PANEL_HEADER = [23, 38, 66, 255];
const TEAL = [45, 212, 191, 255]; // teal-400
const TEAL_DIM = [20, 184, 166, 200];
const WHITE = [237, 242, 247, 255];
const MUTED = [148, 163, 184, 255];
const AMBER = [245, 158, 11, 255];

/* ------------------------------ OG 1200x630 ------------------------------- */

function drawOgImage() {
  const W = 1200;
  const H = 630;
  const c = new Canvas(W, H, BG);

  // Grid motif (mirrors the site's .grid-motif)
  for (let x = 0; x < W; x += 48) c.fillRect(x, 0, 1, H, GRID);
  for (let y = 0; y < H; y += 48) c.fillRect(0, y, W, 1, GRID);
  // Soft teal glow blocks
  c.fillRect(0, 0, 340, 6, TEAL_DIM);
  c.fillRect(0, H - 6, W, 6, TEAL_DIM);

  // Brand row: dq: monogram + name
  const brandS = 6;
  let bx = 72;
  bx += drawText(c, "dq:", bx, 84, brandS, TEAL) + brandS * 3;
  drawText(c, "DATABASE QUEST WARRIOR", bx, 84 + 8, 5, WHITE);

  // H1 (two lines)
  const h1S = 8;
  drawText(c, "BELAJAR SQL & DATABASE", 72, 190, h1S, WHITE);
  drawText(c, "DENGAN CARA LEBIH SERU", 72, 268, h1S, TEAL);

  // Subtitle
  drawText(c, "MATERI INTERAKTIF · LATIHAN QUERY · STUDI KASUS · BATTLE", 72, 356, 3, MUTED);

  // Terminal panel (right-bottom)
  const px = 660;
  const py = 396;
  const pw = 470;
  const ph = 176;
  c.rectStroke(px, py, pw, ph, PANEL_BORDER, 2);
  c.fillRect(px, py, pw, 30, PANEL_HEADER);
  // traffic dots
  c.fillRect(px + 14, py + 12, 6, 6, AMBER);
  c.fillRect(px + 28, py + 12, 6, 6, [74, 222, 128, 255]);
  c.fillRect(px + 42, py + 12, 6, 6, MUTED);
  c.fillRect(px + 2, py + 30, pw - 4, 2, PANEL_BORDER);
  drawText(c, "challenge.sql", px + 60, py + 10, 2, MUTED);
  const code = ["SELECT *", "FROM future_developers", "WHERE effort > excuse"];
  code.forEach((line, i) => {
    drawText(c, line, px + 20, py + 48 + i * 40, 3, i === 0 ? WHITE : i === 1 ? TEAL : WHITE);
  });
  c.fillRect(px + 20, py + ph - 18, 3 * 14, 3, TEAL_DIM); // caret-ish underline

  // Footer strip
  drawText(c, "SMK MUHAMMADIYAH 1 SUKOHARJO · PPLG", 72, H - 64, 3, MUTED);
  drawText(c, "GRATIS · UNTUK SISWA SMK", 72, H - 106, 2, TEAL_DIM);

  return encodePng(W, H, c.buf);
}

/* ------------------------- app icon (dq monogram) -------------------------- */

function drawIcon(size) {
  const c = new Canvas(size, size, TEAL);
  // subtle darker corner accent
  c.fillRect(0, size - Math.round(size * 0.06), size, Math.round(size * 0.06), [13, 148, 136, 255]);
  const s = Math.round(size / 24); // glyph scale
  const text = "dq:";
  const w = measure(text, s, 1);
  const x = Math.round((size - w) / 2) - s * 2;
  const y = Math.round((size - 7 * s) / 2);
  drawText(c, text, x, y, s, BG);
  // underline accent under "dq"
  c.fillRect(x, y + 7 * s + s, measure("dq", s, 1), Math.max(2, s), BG);
  return encodePng(size, size, c.buf);
}

/* ---------------------------------- write --------------------------------- */

const outputs = [
  ["public/og/database-quest-warrior-belajar-sql.png", drawOgImage()],
  ["public/apple-touch-icon.png", drawIcon(180)],
  ["public/icon-512.png", drawIcon(512)],
];
for (const [rel, buf] of outputs) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, buf);
  console.log(`✓ ${rel} (${buf.length} bytes)`);
}
