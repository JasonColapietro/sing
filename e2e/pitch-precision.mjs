/**
 * Pitch precision through the real browser audio path.
 *
 *   npm run dev          # or `npm run build && npm start`, in another shell
 *   (Node 22.18+, which imports the TypeScript fixture directly)
 *   node e2e/pitch-precision.mjs [baseUrl] [--channel=chrome] [--executable=path] [--json=path]
 *
 * `lib/audio/pitch-precision.test.ts` scores the detector on frames handed to
 * it directly. That skips everything between a singer and the detector:
 * getUserMedia, the browser's capture processing, resampling into the
 * AudioContext, and the AnalyserNode frame the room reads. This plays the same
 * synthetic voice in as Chrome's fake microphone, opens /studio exactly as a
 * singer would, and scores what `usePitch` actually heard, via the
 * `window.__singPitchProbe` hook in lib/audio/use-pitch.ts.
 *
 * Chrome takes the fake capture file once per process, so every case gets its
 * own browser. Exits non-zero when any case misses its ceiling.
 *
 * Channel defaults to "chrome", as in run.mjs, because the bundled
 * headless-shell never signals ready on some machines. Pass
 * `--channel=chromium` where only Playwright's own Chromium is installed, or
 * `--executable=/path/to/chrome` for a browser build Playwright didn't install.
 */
import pw from "playwright";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  centsBetween,
  encodeWav,
  expectedHz,
  midiToHz,
  synthVoice,
} from "../lib/audio/voice-fixture.ts";

const { chromium } = pw;

const argv = process.argv.slice(2);
const flag = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const CHANNEL = flag("channel") ?? "chrome";
/** A browser binary to use instead of a channel, e.g. a system Chromium. */
const EXECUTABLE = flag("executable");
const JSON_OUT = flag("json");

const SAMPLE_RATE = 48000;
/** Long enough that the looped file never wraps inside the scored window. */
const FILE_SECONDS = 6;
/** Readings before this are the mic warming up and the median filling. */
const SETTLE_MS = 600;
const LISTEN_MS = 3000;

/**
 * Ceilings, per case:
 *   bias   |mean signed cents|: is the room centred on the note sung?
 *   p95    95th-percentile |cents|: how far single readings stray.
 *   voiced share of readings that must be voiced at all.
 *
 * Bias is signed on purpose. A symmetric vibrato is on pitch, but half its
 * readings are sharp and half flat, so a median of |cents| reports ~0.7× its
 * depth as error even when the detector is exact. It is a mean rather than a
 * median because those readings are bimodal: the ~60 Hz animation frame
 * aliases against a 5.5 Hz vibrato and lands mostly near its two peaks, so
 * the median jumps to whichever peak got a few more samples (8 c measured on
 * an exact detector). The browser path adds
 * resampling and 16-bit capture on top of the unit fixtures, so these sit
 * above the unit suite's; e2e/README.md has the values they were set from.
 */
const CLEAN = { bias: 1, p95: 3, voiced: 0.9 };
const CASES = [
  { name: "E2", spec: { freq: midiToHz(40) }, limits: CLEAN },
  { name: "A2", spec: { freq: midiToHz(45) }, limits: CLEAN },
  { name: "C3", spec: { freq: midiToHz(48) }, limits: CLEAN },
  { name: "A3", spec: { freq: midiToHz(57) }, limits: CLEAN },
  { name: "E4", spec: { freq: midiToHz(64) }, limits: CLEAN },
  { name: "A4", spec: { freq: midiToHz(69) }, limits: CLEAN },
  { name: "E5", spec: { freq: midiToHz(76) }, limits: CLEAN },
  { name: "C6", spec: { freq: midiToHz(84) }, limits: CLEAN },
  { name: "A3 +25c", spec: { freq: midiToHz(57), detuneCents: 25 }, limits: CLEAN },
  { name: "A3 -25c", spec: { freq: midiToHz(57), detuneCents: -25 }, limits: CLEAN },
  {
    name: "A3 vibrato",
    // Scored against the note's centre, which a symmetric vibrato averages to.
    // Known issue, held as a regression ceiling: usePitch smooths with a
    // median of the last 4 readings but takes `sorted[2]`, the upper of the
    // two middle values, so a swinging pitch reads ~5.5 c sharp. The raw
    // detector's bias on the same signal is 0.4 c. Tighten to 1 c once the
    // smoothing takes the true median.
    spec: { freq: midiToHz(57), vibratoHz: 5.5, vibratoCents: 40 },
    limits: { bias: 7, p95: 45, voiced: 0.9 },
  },
  {
    name: "A3 20dB SNR",
    spec: { freq: midiToHz(57), snrDb: 20 },
    limits: { bias: 2, p95: 6, voiced: 0.9 },
  },
];

function quantile(sorted, q) {
  return sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : NaN;
}

async function runCase(dir, testCase) {
  const spec = {
    level: 0.3,
    ...testCase.spec,
    sampleRate: SAMPLE_RATE,
    length: SAMPLE_RATE * FILE_SECONDS,
  };
  const wav = path.join(dir, `${testCase.name.replace(/\W+/g, "_")}.wav`);
  await writeFile(wav, encodeWav(synthVoice(spec), SAMPLE_RATE));
  // Vibrato averages out over the file, so this is the note's centre pitch.
  const target = expectedHz({ ...spec, vibratoHz: 0 });

  const browser = await chromium.launch({
    ...(EXECUTABLE ? { executablePath: EXECUTABLE } : { channel: CHANNEL }),
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${wav}`,
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      try { localStorage.clear(); sessionStorage.clear(); } catch {}
      window.__singPitchProbe = [];
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/studio`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Enable microphone" }).first().click();
    await page.waitForFunction(() => window.__singPitchProbe.length > 0, null, { timeout: 15000 });
    await page.waitForTimeout(SETTLE_MS + LISTEN_MS);
    const readings = await page.evaluate(() => window.__singPitchProbe.slice());

    const t0 = readings[0].t + SETTLE_MS;
    const scored = readings.filter((r) => r.t >= t0 && r.t < t0 + LISTEN_MS);
    const voiced = scored.filter((r) => r.freq !== null);
    const cents = voiced.map((r) => centsBetween(r.freq, target));
    const octaveErrors = cents.filter((c) => Math.abs(c) > 600).length;
    const inRange = cents.filter((c) => Math.abs(c) <= 600);
    const abs = inRange.map(Math.abs).sort((a, b) => a - b);
    const result = {
      name: testCase.name,
      targetHz: Number(target.toFixed(2)),
      contextSampleRate: readings[0].sampleRate,
      readings: scored.length,
      voicedShare: scored.length ? voiced.length / scored.length : 0,
      octaveErrors,
      bias: inRange.length ? inRange.reduce((sum, c) => sum + c, 0) / inRange.length : NaN,
      p50: quantile(abs, 0.5),
      p95: quantile(abs, 0.95),
      max: abs.at(-1) ?? NaN,
    };
    const { limits } = testCase;
    result.failures = [
      scored.length < 30 && `only ${scored.length} readings in ${LISTEN_MS} ms`,
      result.voicedShare < limits.voiced &&
        `voiced ${(result.voicedShare * 100).toFixed(0)}% < ${limits.voiced * 100}%`,
      octaveErrors > 0 && `${octaveErrors} octave errors`,
      !(Math.abs(result.bias) <= limits.bias) &&
        `bias ${result.bias?.toFixed(2)}c, beyond ±${limits.bias}c`,
      !(result.p95 <= limits.p95) && `p95 ${result.p95?.toFixed(2)}c > ${limits.p95}c`,
    ].filter(Boolean);
    return result;
  } finally {
    await browser.close();
  }
}

const dir = await mkdtemp(path.join(os.tmpdir(), "sing-pitch-"));
const results = [];
try {
  console.log(`sing pitch precision — ${CASES.length} cases against ${BASE}/studio (${EXECUTABLE ?? CHANNEL})\n`);
  for (const testCase of CASES) {
    let result;
    try {
      result = await runCase(dir, testCase);
    } catch (error) {
      result = { name: testCase.name, failures: [`crashed: ${error.message.split("\n")[0]}`] };
    }
    results.push(result);
    const stats =
      result.bias === undefined
        ? ""
        : `voiced ${(result.voicedShare * 100).toFixed(0).padStart(3)}%  ` +
          `bias ${result.bias.toFixed(2).padStart(6)}c  ` +
          `p50 ${result.p50.toFixed(2).padStart(6)}c  p95 ${result.p95.toFixed(2).padStart(6)}c  ` +
          `max ${result.max.toFixed(2).padStart(6)}c  n=${result.readings} @${result.contextSampleRate}Hz`;
    const mark = result.failures.length ? "FAIL" : "ok  ";
    console.log(`${mark} ${result.name.padEnd(12)} ${stats}`);
    for (const f of result.failures) console.log(`       ${f}`);
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}

if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.failures.length);
console.log(`\n${results.length - failed.length}/${results.length} cases within their ceilings`);
process.exit(failed.length ? 1 : 0);
