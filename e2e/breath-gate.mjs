/**
 * The breath gate through the real browser audio path.
 *
 *   npm run build && npm start   # in another shell
 *   (Node 22.18+, which imports the TypeScript fixtures directly)
 *   node e2e/breath-gate.mjs [baseUrl] [--channel=chrome] [--executable=path] [--json=path] [--case="breathe and sing"]
 *
 * `lib/audio/breath-detect.test.ts` scores the inhale classifier on frames
 * handed to it directly. This plays the same synthetic scenes in as Chrome's
 * fake microphone, opens /breath?drill=sustain as a singer would, and checks
 * what the room did with them, reading `window.__singBreathProbe` (the hook in
 * lib/audio/use-breath-detect.ts) and the page itself:
 *
 *   inhale then vowel  the gate opens on the breath, the hold is recorded, and
 *                      the results screen reports the breath beside the hold.
 *   inhale then hiss   the breath runs straight into an "sss" with no gap; the
 *                      breath is split off at the step, the gate opens, and
 *                      the hiss is timed as the hold from where it began.
 *   fan then vowel     no inhale is reported, the note alone does not start
 *                      the hold, the fallback is offered after 8 s, and taking
 *                      it records the next note on sound alone.
 *   breathe and sing   /breath?drill=cue at four reps: each rep's note counts
 *                      only after a breath, and every breath is heard.
 *
 * Chrome takes the fake capture file once per process and loops it, so each
 * case gets its own browser. Visibility cases require --executable or
 * --channel=chromium so they can launch without Playwright focus overrides.
 * Exits non-zero when any case fails.
 */
import pw from "playwright";
import { launchLifecycleBrowser } from "./chromium-lifecycle.mjs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { encodeWav, midiToHz, synthVoice } from "../lib/audio/voice-fixture.ts";
import { bandNoise, concat, fan, inhale, mixAt, silence } from "../lib/audio/breath-fixture.ts";

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
const CASE_FILTER = flag("case");

const SR = 48000;
const VOWEL_SEC = 4;
/** The fallback copy names the wait, so the case can find it by that. */
const FALLBACK_TEXT = /No breath heard in 8 seconds/;

const room = (sec) =>
  bandNoise({ sampleRate: SR, length: Math.round(sec * SR), loHz: 0, hiHz: SR / 2, level: 0.0005, seed: 3 });
const vowel = (seconds = VOWEL_SEC) =>
  synthVoice({ freq: midiToHz(57), sampleRate: SR, length: SR * seconds, level: 0.3, snrDb: 30 });

/** 1.5 s of room, a 1 s breath, a sung A3, then room again until the file loops. */
function inhaleThenVowel(seconds = VOWEL_SEC) {
  const take = concat(
    silence(SR, 1.5),
    inhale({ sampleRate: SR, durationSec: 1, level: 0.015 }),
    silence(SR, 0.1),
    vowel(seconds),
    silence(SR, 4),
  );
  return mixAt(room(take.length / SR), take);
}

/** The same breath, then straight into a 4 s "sss" — louder and brighter, no gap. */
function inhaleThenHiss() {
  const take = concat(
    silence(SR, 1.5),
    inhale({ sampleRate: SR, durationSec: 1, level: 0.015 }),
    inhale({ sampleRate: SR, durationSec: VOWEL_SEC, level: 0.04, loHz: 3000, hiHz: 9000, seed: 51 }),
    silence(SR, 4),
  );
  return mixAt(room(take.length / SR), take);
}

/** A fan running throughout, with the same A3 sung from 2 s in. No breath anywhere. */
function fanThenVowel() {
  const take = concat(silence(SR, 2), vowel(), silence(SR, 6));
  return mixAt(fan({ sampleRate: SR, length: take.length, level: 0.01 }), take);
}

async function withBrowser(wav, drill, fn, lifecycle = false) {
  const args = [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-audio-capture=${wav}`,
    "--autoplay-policy=no-user-gesture-required",
  ];
  const owned = lifecycle
    ? await launchLifecycleBrowser(EXECUTABLE ?? (CHANNEL === "chromium" ? chromium.executablePath() : null), args)
    : null;
  const browser = owned?.browser ?? await chromium.launch({
    ...(EXECUTABLE ? { executablePath: EXECUTABLE } : { channel: CHANNEL }),
    args,
  });
  try {
    const context = owned?.context ?? await browser.newContext();
    await context.addInitScript(() => {
      try { localStorage.clear(); sessionStorage.clear(); } catch {}
      window.__singBreathProbe = [];
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/breath?drill=${drill}`, { waitUntil: "networkidle" });
    if (owned) {
      await page.bringToFront();
      await page.waitForFunction(() => document.visibilityState === "visible", null, { polling: 50 });
    }
    await page.getByRole("button", { name: "Enable microphone" }).first().click();
    const beganAt = await page.evaluate(() => performance.now());
    try {
      return await fn(page);
    } catch (error) {
      console.error("Breath test state:", JSON.stringify({
        drill,
        ...(owned ? { browserStderr: owned.diagnostics() } : {}),
        elapsedMs: await page.evaluate((began) => performance.now() - began, beganAt),
        visibility: await page.evaluate(() => document.visibilityState),
        interruption: await page.evaluate(() => window.__breathInterruption ?? null),
        text: await page.locator('[role="dialog"]').allTextContents(),
        inhales: await page.evaluate(() => window.__singBreathProbe.filter((p) => p.inhale).map((p) => p.inhale)),
      }));
      throw error;
    }
  } finally {
    if (owned) await owned.close();
    else await browser.close();
  }
}

const inhales = (page) =>
  page.evaluate(() => window.__singBreathProbe.filter((p) => p.inhale).map((p) => p.inhale));

/** The hold and breath the results screen reports, from its subtitle. */
async function readResult(page) {
  const subtitle = page.getByText(/^Breath · /).first();
  await subtitle.waitFor({ timeout: 20000 });
  const text = await subtitle.innerText();
  const m = /([\d.]+) s(?: · ([\d.]+) s breath in)?/i.exec(text);
  return { text, holdSec: m ? Number(m[1]) : NaN, breathSec: m?.[2] ? Number(m[2]) : null };
}

const CASES = [
  ...["sustain", "cue"].map((drill) => ({
    name: `${drill} visibility interruption`,
    lifecycle: true,
    drill,
    make: () => inhaleThenVowel(8),
    async run(page) {
      if (drill === "cue") await page.getByRole("button", { name: "Start", exact: true }).click();
      await page.getByText("Hold", { exact: true }).waitFor({ timeout: 15000 });
      const before = await page.locator('[role="dialog"]').innerText();
      await page.evaluate(() => {
        const probe = { events: [], maxFrameGap: 0, frames: 0 };
        window.__breathInterruption = probe;
        for (const type of ["visibilitychange", "freeze", "resume"]) {
          document.addEventListener(type, () => probe.events.push({ type, visibility: document.visibilityState }));
        }
        let previous = performance.now();
        const frame = (now) => {
          probe.maxFrameGap = Math.max(probe.maxFrameGap, now - previous);
          probe.frames++;
          previous = now;
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      await page.waitForFunction(() => window.__breathInterruption.frames > 0);
      const cdp = await page.context().newCDPSession(page);
      let cover;
      try {
        // This case uses the default context of a noDefaults CDP connection,
        // so no other session owns a focus-emulation visible-capture handle.
        // Unfreezing alone leaves Chromium's page hidden. Select a separate
        // tab so returning below is a real hidden -> visible tab transition,
        // not bringToFront on an already-selected (but still hidden) page.
        cover = await page.context().newPage();
        await cover.bringToFront();
        await page.waitForFunction(() => document.visibilityState === "hidden", null, { timeout: 3000, polling: 50 });
        await cdp.send("Page.setWebLifecycleState", { state: "frozen" });
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } finally {
        try {
          await cdp.send("Page.setWebLifecycleState", { state: "active" });
          await page.bringToFront();
          // rAF polling cannot observe visibility while rAF is suspended.
          await page.waitForFunction(() => document.visibilityState === "visible", null, { timeout: 3000, polling: 50 });
        } finally {
          try { await cover?.close(); }
          finally { await cdp.detach(); }
        }
      }
      const failures = [];
      // Visibility can return before the first resumed animation frame. Let
      // the probe observe that frame before evaluating the interruption.
      await page.waitForFunction(() => window.__breathInterruption.maxFrameGap > 900, null, { timeout: 3000, polling: 50 }).catch(() => {});
      const interruption = await page.evaluate(() => window.__breathInterruption);
      if (!interruption.events.some((event) => event.type === "visibilitychange" && event.visibility === "hidden"))
        failures.push("fixture did not deliver a hidden visibility event");
      if (!interruption.events.some((event) => event.type === "visibilitychange" && event.visibility === "visible"))
        failures.push("fixture did not deliver a visible visibility event on return");
      if (!(interruption.maxFrameGap > 900))
        failures.push(`fixture did not interrupt observed frames: largest gap ${interruption.maxFrameGap.toFixed(0)} ms`);
      try { await page.getByText("Breathe in", { exact: true }).waitFor({ timeout: 3000 }); }
      catch { failures.push("unobserved time did not reset the unfinished hold to a fresh breath"); }
      if (drill === "cue" && await page.getByRole("img", { name: "0 of 6 reps done", exact: true }).count() !== 1)
        failures.push("interrupted cue counted a rep");
      const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem("suede-sing:progress:v1") ?? "{}").sessions ?? []);
      if (sessions.length) failures.push("interrupted hold logged practice");
      if (await page.getByText(/^Breath · /).count()) failures.push("interrupted hold completed the drill");
      return { failures, interruption, before, after: await page.locator('[role="dialog"]').innerText() };
    },
  })),
  {
    name: "inhale then vowel",
    drill: "sustain",
    make: inhaleThenVowel,
    async run(page) {
      const failures = [];
      await page.waitForFunction(() => window.__singBreathProbe.some((p) => p.inhale), null, {
        timeout: 15000,
      });
      const heard = await inhales(page);
      const result = await readResult(page);
      const first = heard[0];
      if (!(first.durationSec >= 0.6 && first.durationSec <= 1.2))
        failures.push(`inhale ${first.durationSec.toFixed(2)} s, expected 0.6–1.2`);
      if (!(Math.abs(result.holdSec - VOWEL_SEC) <= 0.6))
        failures.push(`hold ${result.holdSec} s, expected ${VOWEL_SEC} ± 0.6`);
      if (result.breathSec === null) failures.push(`results did not report the breath: "${result.text}"`);
      return { inhales: heard.length, inhaleSec: first.durationSec, ...result, failures };
    },
  },
  {
    name: "inhale then hiss",
    drill: "sustain",
    make: inhaleThenHiss,
    async run(page) {
      const failures = [];
      await page.waitForFunction(() => window.__singBreathProbe.some((p) => p.inhale), null, {
        timeout: 15000,
      });
      const heard = await inhales(page);
      const result = await readResult(page);
      const first = heard[0];
      if (!first.endedByHiss) failures.push("the breath was not split from the hiss");
      if (!(first.durationSec >= 0.6 && first.durationSec <= 1.2))
        failures.push(`inhale ${first.durationSec.toFixed(2)} s, expected 0.6–1.2`);
      if (!(Math.abs(result.holdSec - VOWEL_SEC) <= 0.6))
        failures.push(`hold ${result.holdSec} s, expected ${VOWEL_SEC} ± 0.6`);
      if (result.breathSec === null) failures.push(`results did not report the breath: "${result.text}"`);
      return { inhales: heard.length, inhaleSec: first.durationSec, ...result, failures };
    },
  },
  {
    name: "fan then vowel",
    drill: "sustain",
    make: fanThenVowel,
    async run(page) {
      const failures = [];
      // Past the sung note and past the fallback's 8 s.
      // A false inhale here opens the gate and records the note instead; the
      // first run of this case caught exactly that, from the zeros a stream
      // starts with (see BREATH_RULES.warmupMs).
      await page.getByText(FALLBACK_TEXT).waitFor({ timeout: 15000 });
      const heard = await inhales(page);
      if (heard.length) failures.push(`${heard.length} inhales reported over a fan`);
      // The note came and went while the gate was shut, so nothing was held.
      if ((await page.getByText(/^Breath · /).count()) > 0) failures.push("a hold was recorded with no breath heard");
      if ((await page.getByText("Breathe in", { exact: true }).count()) === 0)
        failures.push("not waiting for a breath");
      await page.getByRole("button", { name: "Start without breath detection" }).click();
      // The file loops: the next pass of the note is recorded on sound alone.
      const result = await readResult(page);
      if (!(Math.abs(result.holdSec - VOWEL_SEC) <= 0.6))
        failures.push(`fallback hold ${result.holdSec} s, expected ${VOWEL_SEC} ± 0.6`);
      if (result.breathSec !== null) failures.push(`fallback hold claims a breath: "${result.text}"`);
      const after = await inhales(page);
      if (after.length) failures.push(`${after.length} inhales reported over a fan`);
      return { inhales: after.length, fallbackOffered: true, ...result, failures };
    },
  },
  {
    name: "breathe and sing",
    drill: "cue",
    // The microphone's frame windows trim a little from each end of the note.
    // Leave signal margin beyond the four-second target, as a singer holding
    // until the completion cue would. Sustain cases still measure four seconds.
    make: () => inhaleThenVowel(5),
    async run(page) {
      const failures = [];
      await page.getByRole("button", { name: "4", exact: true }).click();
      await page.getByRole("button", { name: "Start", exact: true }).click();
      // The results row carries the drill's own line: reps, and breaths heard.
      const row = page.getByText(/^\d+ reps · \d+ breaths heard$/);
      await row.waitFor({ timeout: 60000 });
      const text = await row.innerText();
      const [, reps, heard] = /^(\d+) reps · (\d+) breaths heard$/.exec(text).map(Number);
      const probed = await inhales(page);
      if (reps !== 4) failures.push(`${reps} reps, expected 4`);
      if (heard !== 4) failures.push(`${heard} breaths heard, expected 4`);
      return { inhales: probed.length, text, failures };
    },
  },
];

const selectedCases = CASES.filter((c) => !CASE_FILTER || c.name === CASE_FILTER);
if (!selectedCases.length) throw new Error(`Unknown breath case: ${CASE_FILTER}`);
const dir = await mkdtemp(path.join(os.tmpdir(), "sing-breath-"));
const results = [];
try {
  console.log(`sing breath gate — ${selectedCases.length} cases against ${BASE}/breath (${EXECUTABLE ?? CHANNEL})\n`);
  for (const testCase of selectedCases) {
    const wav = path.join(dir, `${testCase.name.replace(/\W+/g, "_")}.wav`);
    await writeFile(wav, encodeWav(testCase.make(), SR));
    let result;
    try {
      result = {
        name: testCase.name,
        ...(await withBrowser(wav, testCase.drill, (page) => testCase.run(page), testCase.lifecycle)),
      };
    } catch (error) {
      result = { name: testCase.name, failures: [`crashed: ${error.message.split("\n")[0]}`] };
    }
    results.push(result);
    const mark = result.failures.length ? "FAIL" : "ok  ";
    const stats =
      result.text === undefined
        ? ""
        : `inhales ${result.inhales}  ${result.inhaleSec !== undefined ? `breath ${result.inhaleSec.toFixed(2)} s  ` : ""}results "${result.text}"`;
    console.log(`${mark} ${result.name.padEnd(18)} ${stats}`);
    for (const f of result.failures) console.log(`       ${f}`);
    if (result.failures.length && result.interruption)
      console.log(`       interruption diagnostics: ${JSON.stringify({ interruption: result.interruption, before: result.before, after: result.after })}`);
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}

if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.failures.length);
console.log(`\n${results.length - failed.length}/${results.length} cases passed`);
process.exit(failed.length ? 1 : 0);
