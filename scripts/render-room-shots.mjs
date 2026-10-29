/**
 * Captures three of Sing's own rooms at phone width for the homepage figures:
 * public/room-range.png, public/room-studio.png, public/room-progress.png.
 *
 *   npx next dev -p 3200          # in another shell; this script starts nothing
 *   node scripts/render-room-shots.mjs http://localhost:3200 [--executable=path]
 *
 * A sample progress record is seeded into localStorage first, so the shots
 * show a measured range, a streak and a coach plan instead of empty states.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { browserTarget, cliArgs } from "../e2e/lib/args.mjs";

const { base, executable } = cliArgs("http://localhost:3200");
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

/** Local calendar day, as lib/progress.ts localDay writes it. */
function localDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Eleven short sessions over the last twelve days, two range tests, a live streak. */
function sampleProgress() {
  const now = new Date();
  const sessions = [];
  const kinds = ["warmup", "pitch", "song", "warmup", "ear", "pitch", "warmup", "breath", "song", "warmup", "pitch"];
  kinds.forEach((type, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (10 - i));
    d.setHours(18, 10 + i, 0, 0);
    const scored = type === "warmup" || type === "song" || type === "ear" || type === "pitch";
    sessions.push({
      id: `sample-${i}`,
      type,
      date: d.toISOString(),
      day: localDay(d),
      durationSec: 150 + (i % 3) * 60,
      ...(scored ? { score: 72 + ((i * 7) % 19) } : {}),
      detail: type === "warmup" ? "Five-note scale" : type === "song" ? "Scarborough Fair" : undefined,
      xp: 40 + (i % 4) * 10,
    });
  });
  const firstTest = new Date(now);
  firstTest.setDate(firstTest.getDate() - 45);
  const lastTest = new Date(now);
  lastTest.setDate(lastTest.getDate() - 3);
  const range = { lowMidi: 50, highMidi: 74, voiceType: "contralto", voiceTypeLabel: "Contralto", testedAt: lastTest.toISOString() };
  return {
    xp: sessions.reduce((n, s) => n + s.xp, 0),
    sessions,
    streak: { current: 6, best: 9, lastDay: localDay(now) },
    range,
    rangeHistory: [
      { lowMidi: 51, highMidi: 73, testedAt: firstTest.toISOString(), voiceTypeLabel: "Contralto" },
      { lowMidi: 50, highMidi: 74, testedAt: lastTest.toISOString(), voiceTypeLabel: "Contralto" },
    ],
    achievements: ["first-session", "streak-3"],
  };
}

/** Monday of the current week, the value the weekly report card stores once seen. */
function thisWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return localDay(d);
}

const SEED = {
  "suede-sing:progress:v1": JSON.stringify(sampleProgress()),
  // Prompts, the weekly report and the Pro moment already seen, so nothing
  // opens over the room.
  "suede-sing:coach-intro:v1": new Date().toISOString(),
  "suede-sing:account-prompt:v1": new Date().toISOString(),
  "suede-sing:backup-prompt:v1": new Date().toISOString(),
  "suede-sing:weekly-report-seen:v1": thisWeekStart(),
};

/** `scrollTo` is the element framed at the top of the shot, under the sticky header. */
const SHOTS = [
  { file: "room-range.png", path: "/range?mode=range", scrollTo: "text=Saved result", card: true },
  { file: "room-studio.png", path: "/studio", scrollTo: 'button:has-text("Enable microphone")', card: true },
  { file: "room-progress.png", path: "/progress", scrollTo: 'section[aria-label="Today\'s coached session"]' },
];
const HEADER_PX = 56;

const browser = await chromium.launch(browserTarget(executable, {}));
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  await context.addInitScript((seed) => {
    for (const [key, value] of Object.entries(seed)) {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    }
  }, SEED);
  await mkdir(OUT, { recursive: true });
  const page = await context.newPage();
  for (const shot of SHOTS) {
    await page.goto(`${base}${shot.path}`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal{display:none}" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const target = page.locator(shot.scrollTo).first();
    await target.waitFor();
    await target.evaluate((el, { card, header }) => {
      const box = card ? el.closest("[class*='rounded-2xl']") ?? el : el;
      box.scrollIntoView({ block: "start" });
      window.scrollBy(0, -header);
    }, { card: Boolean(shot.card), header: HEADER_PX });
    await page.waitForTimeout(300);
    const out = path.join(OUT, shot.file);
    await page.screenshot({ path: out, fullPage: false });
    console.log(`wrote ${path.relative(process.cwd(), out)} from ${shot.path}`);
  }
} finally {
  await browser.close();
}
