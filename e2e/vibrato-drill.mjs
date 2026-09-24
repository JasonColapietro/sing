/**
 * The vibrato drill, end to end, through the real browser audio path.
 *
 *   npm run build && npm start        # in another shell
 *   (Node 22.18+, which imports the TypeScript fixture directly)
 *   node e2e/vibrato-drill.mjs [baseUrl] [--channel=chrome] [--executable=path] [--json=path]
 *
 * `components/warmups/vibrato-feedback.test.ts` reads vibrato off an f0 trace
 * built in the test. That skips the part that can actually go wrong in a room:
 * the trace is sampled from the live pitch frames by the player's animation
 * loop, after getUserMedia, resampling, the analyser frame and usePitch's
 * median smoothing, all of which narrow or smear a wobble. This plays a
 * synthetic sustained vowel in as Chrome's fake microphone, opens
 * /warmups?exercise=vibrato-hold exactly as a deep link would, lets the drill
 * run one hold, and reads the reading the page shows.
 *
 * Two cases: a 5.5 Hz ±50 cent vibrato, which has to read near 5.5 Hz and in
 * the 5-7 Hz band, and the same note sung straight, which has to read as no
 * vibrato. Chrome takes the fake capture file once per process, so each case
 * gets its own browser. Exits non-zero when a case misses.
 *
 * Channel defaults to "chrome", as in pitch-precision.mjs. Pass
 * `--executable=/path/to/chrome` for a browser build Playwright didn't install.
 */
import pw from "playwright";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { encodeWav, midiToHz, synthVoice } from "../lib/audio/voice-fixture.ts";

const { chromium } = pw;

const argv = process.argv.slice(2);
const flag = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const CHANNEL = flag("channel") ?? "chrome";
const EXECUTABLE = flag("executable");
const JSON_OUT = flag("json");

const SAMPLE_RATE = 48000;
/**
 * Long enough that the looped file never wraps before the first hold closes:
 * the teach pass, the count-in and the scored window of rep 0 take about 12 s,
 * and a wrap inside the hold would put a phase jump in the middle of it.
 */
const FILE_SECONDS = 30;
/** Rep 0's root on the default C3-G3 ladder, which a fresh browser gets. */
const ROOT_MIDI = 48;
/** Rep 0 closes around 12 s in; the rest is headroom for a slow machine. */
const READING_TIMEOUT_MS = 40000;

const CASES = [
  {
    name: "5.5 Hz ±50c vibrato",
    spec: { vibratoHz: 5.5, vibratoCents: 50 },
    check(r) {
      return [
        r.kind !== "measured" && `read as "${r.kind}", expected a measured vibrato`,
        r.kind === "measured" &&
          !(Math.abs(r.rateHz - 5.5) <= 0.3) &&
          `rate ${r.rateHz} Hz, expected 5.5 ± 0.3`,
        r.kind === "measured" && r.inBand !== true && "rate not reported in the 5-7 Hz band",
        // 100¢ peak to peak is the truth. The drill corrects for the live
        // tracker's analysis frame but not for usePitch's median smoothing,
        // so it reads somewhat under; uncorrected it read 57¢.
        r.kind === "measured" &&
          !(r.extentCents >= 70 && r.extentCents <= 110) &&
          `width ${r.extentCents}¢, expected roughly 100¢ peak to peak`,
      ].filter(Boolean);
    },
  },
  {
    name: "straight tone",
    spec: {},
    check(r) {
      return [
        r.kind !== "none" && `read as "${r.kind}" (${r.headline}), expected no vibrato`,
        // Detector noise on a steady voice must read as straight, not as an
        // irregular wobble or a hold that could not be read.
        r.kind === "none" && r.reason !== "too-narrow" && `reason "${r.reason}", expected "too-narrow"`,
      ].filter(Boolean);
    },
  },
];

async function runCase(dir, testCase) {
  const spec = {
    freq: midiToHz(ROOT_MIDI),
    level: 0.3,
    ...testCase.spec,
    sampleRate: SAMPLE_RATE,
    length: SAMPLE_RATE * FILE_SECONDS,
  };
  const wav = path.join(dir, `${testCase.name.replace(/\W+/g, "_")}.wav`);
  await writeFile(wav, encodeWav(synthVoice(spec), SAMPLE_RATE));

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
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/warmups?exercise=vibrato-hold`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Enable microphone" }).first().click();
    const panel = page.locator('[data-testid="vibrato-reading"]:not([data-vibrato="pending"])').first();
    await panel.waitFor({ timeout: READING_TIMEOUT_MS });
    const reading = await panel.evaluate((el) => ({
      kind: el.getAttribute("data-vibrato"),
      reason: el.getAttribute("data-reason"),
      rateHz: el.hasAttribute("data-rate-hz") ? Number(el.getAttribute("data-rate-hz")) : null,
      extentCents: el.hasAttribute("data-extent-cents") ? Number(el.getAttribute("data-extent-cents")) : null,
      inBand: el.hasAttribute("data-in-band") ? el.getAttribute("data-in-band") === "true" : null,
      headline: el.querySelector("p")?.textContent ?? "",
      detail: el.querySelectorAll("p")[1]?.textContent ?? "",
    }));
    return { name: testCase.name, ...reading, failures: testCase.check(reading) };
  } finally {
    await browser.close();
  }
}

const dir = await mkdtemp(path.join(os.tmpdir(), "sing-vibrato-"));
const results = [];
try {
  console.log(`sing vibrato drill — ${CASES.length} cases against ${BASE}/warmups (${EXECUTABLE ?? CHANNEL})\n`);
  for (const testCase of CASES) {
    let result;
    try {
      result = await runCase(dir, testCase);
    } catch (error) {
      result = { name: testCase.name, failures: [`crashed: ${error.message.split("\n")[0]}`] };
    }
    results.push(result);
    const mark = result.failures.length ? "FAIL" : "ok  ";
    const shown = result.headline ? `${result.headline}  |  ${result.detail}` : "";
    console.log(`${mark} ${result.name.padEnd(22)} ${shown}`);
    for (const f of result.failures) console.log(`       ${f}`);
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}

if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.failures.length);
console.log(`\n${results.length - failed.length}/${results.length} cases passed`);
process.exit(failed.length ? 1 : 0);
