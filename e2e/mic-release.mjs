/**
 * The microphone closes once a warmup or song room has sat idle out of a
 * session, and comes back on the next start, against a running app:
 *
 *   npm run build && npm start            # in another shell
 *   node e2e/mic-release.mjs [baseUrl] [--channel=chrome] [--executable=path]
 *
 * Warmups and songs used to keep the mic open after a session ended (a
 * warmup's summary and the list, a song's Practice summary and the library),
 * with the browser's recording light on and nothing on screen to turn it off.
 * Now a room that is out of a session, with no start waiting on the device,
 * closes the stream after 15 idle seconds (MIC_IDLE_RELEASE_MS in
 * lib/audio/use-idle-mic-release.ts), so a quick "Sing again" keeps it. The
 * room remembers the singer allowed it (no gate, no "Enable microphone" ask
 * comes back), and the next start reopens it before the run begins. The one
 * exception is a warmup that closed itself for silence: "No sound picked up"
 * shows a live input meter, so the mic stays on there until the singer starts
 * again or presses "Turn off the mic".
 *
 * Every case but one sets `window.__singMicReleaseMs` to 400 before load, so
 * a release takes 400 ms rather than 15 s; the grace case leaves the real
 * delay in place and checks the stream is still open 3 s after a run ends.
 *
 * Chrome's fake microphone plays a held A3 (lib/audio/voice-fixture.ts) or
 * silence. getUserMedia is wrapped before the app loads so the page can count
 * the tracks it handed out that are still `live`; a track the app stops
 * reads `ended`. Every step prints the count it measured, so a log shows the
 * 1 an open mic would leave behind, not just a pass. Chrome takes the fake
 * capture file once per process, so the silent cases get their own browser.
 * Exits non-zero when any case fails.
 */
import pw from "playwright";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { encodeWav, midiToHz, synthVoice } from "../lib/audio/voice-fixture.ts";

const argv = process.argv.slice(2);
const flag = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const BASE = (argv.find((a) => !a.startsWith("--")) ?? "http://localhost:3000").replace(/\/$/, "");
const EXECUTABLE = flag("executable");
const CHANNEL = flag("channel") ?? "chrome";
const VIEW = { width: 1280, height: 900 };
const SAMPLE_RATE = 48000;
/** The idle release every case but the grace case runs with, in place of 15 s. */
const TEST_RELEASE_MS = 400;
/** How long after a run ends the stream must read as closed, with that override. */
const RELEASE_MS = 1200;
/** How long after a run ends the stream must still be open, with the real 15 s delay. */
const GRACE_CHECK_MS = 3000;

/**
 * Runs before the app on every document of a context. Clears storage once
 * per tab (a reload inside a case keeps what the case did), marks the coach
 * intro seen so no overlay covers the cards, sets the idle release override
 * (null keeps the app's own delay), and wraps getUserMedia. Setting
 * `window.__micFail` makes the next opens fail as a refused device would.
 */
function init(releaseMs) {
  if (typeof releaseMs === "number") window.__singMicReleaseMs = releaseMs;
  try {
    if (!sessionStorage.getItem("mic-release:init")) {
      localStorage.clear();
      sessionStorage.setItem("mic-release:init", "1");
    }
    localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
  } catch {}
  const tracks = [];
  let stopped = 0;
  const events = [];
  const md = navigator.mediaDevices;
  const original = md.getUserMedia.bind(md);
  md.getUserMedia = async (constraints) => {
    if (window.__micFail) throw new DOMException("Permission denied", "NotAllowedError");
    const stream = await original(constraints);
    for (const track of stream.getTracks()) {
      tracks.push(track);
      const openedAt = performance.now();
      events.push({ kind: "open", at: openedAt });
      const stop = track.stop.bind(track);
      track.stop = () => {
        if (track.readyState === "live") {
          stopped += 1;
          events.push({ kind: "stop", at: performance.now(), elapsed: performance.now() - openedAt,
            headings: [...document.querySelectorAll("h1,h2,[role=dialog]")].map((el) => ({ role: el.getAttribute("role"), label: el.getAttribute("aria-label"), text: el.textContent?.slice(0, 180) })),
            stack: new Error("microphone track stopped").stack });
        }
        stop();
      };
    }
    return stream;
  };
  window.__mic = () => ({
    opened: tracks.length,
    live: tracks.filter((t) => t.readyState === "live").length,
    stopped,
    events,
  });
}

const dir = await mkdtemp(path.join(os.tmpdir(), "sing-mic-release-"));
const heldWav = path.join(dir, "a3.wav");
const silentWav = path.join(dir, "silence.wav");
// A held A3 at a moderate level; the file loops, so 20 s is plenty.
await writeFile(heldWav, encodeWav(synthVoice({ freq: midiToHz(57), sampleRate: SAMPLE_RATE, length: SAMPLE_RATE * 20, level: 0.3 }), SAMPLE_RATE));
await writeFile(silentWav, encodeWav(new Float32Array(SAMPLE_RATE * 20), SAMPLE_RATE));

function launch(wav) {
  return pw.chromium.launch({
    ...(EXECUTABLE ? { executablePath: EXECUTABLE } : { channel: CHANNEL }),
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-audio-capture=${wav}`,
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
}

const mic = (page) => page.evaluate(() => window.__mic());
const fmt = (m) => `live ${m.live} (opened ${m.opened}, stopped ${m.stopped})`;

/**
 * Wait up to `timeout` for exactly `want` live tracks, then record and assert
 * what was measured. A timeout of 0 reads once, without waiting.
 */
async function expectLive(page, want, label, notes, timeout = RELEASE_MS) {
  if (timeout > 0) {
    await page
      .waitForFunction((w) => window.__mic().live === w, want, { timeout, polling: 50 })
      .catch(() => {});
  }
  const m = await mic(page);
  notes.push(`${label}: ${fmt(m)}`);
  assert.equal(m.live, want, `${label}: expected ${want} live mic track(s), measured ${fmt(m)}`);
  return m;
}

/** Hold for `ms`, then require the count to still be `want` (nothing closes or opens late). */
async function expectStill(page, want, label, notes, ms = RELEASE_MS) {
  await page.waitForTimeout(ms);
  return expectLive(page, want, label, notes, 0);
}

/** The Pro upsell's full-screen backdrop eats clicks; close it if it opened. */
async function dismissOverlays(page) {
  for (let i = 0; i < 3; i++) {
    const notNow = page.getByRole("button", { name: /^Not now$/ });
    const dismiss = page.getByRole("button", { name: "Dismiss", exact: true });
    if ((await notNow.count()) === 0 && (await dismiss.count()) === 0) return;
    if (await notNow.count()) await notNow.first().click().catch(() => {});
    else await dismiss.first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(200);
  }
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** An exercise's row on the warmups path: a button whose name opens with the title. */
const pathRow = (page, title) => page.getByRole("button", { name: new RegExp(`^${escapeRe(title)}`) });
const REP_SCORE = /^Rep \d+%$/;

/**
 * The session's "Cents off" readout shows a number, not the dash it shows
 * with no note: the exercise is hearing the held A3. Returns the reading.
 */
async function readoutReacts(page, timeout = 30_000) {
  const handle = await page.waitForFunction(
    () => {
      const label = [...document.querySelectorAll('[role="dialog"] div')].find(
        (el) => el.textContent?.trim() === "Cents off",
      );
      const text = label?.nextElementSibling?.textContent ?? "";
      return /[+-]?\d+/.exec(text)?.[0] ?? false;
    },
    null,
    { timeout, polling: 50 },
  );
  return handle.jsonValue();
}

/** Open /warmups (or a deep link into it) and wait for the client tree. */
async function openWarmups(page, query = "") {
  await page.goto(`${BASE}/warmups${query}`);
  await page.waitForLoadState("networkidle");
  await dismissOverlays(page);
}

/** The gate's button, retried until the mic opens: a click before hydration is a no-op. */
async function enableFromGate(page, name) {
  const button = page.locator("#warmup-gate").getByRole("button", { name, exact: true });
  for (let i = 0; i < 20; i++) {
    await dismissOverlays(page);
    if ((await button.count()) === 0) return;
    await button.click().catch(() => {});
    const opened = await page
      .waitForFunction(() => window.__mic().opened > 0, null, { timeout: 500 })
      .then(() => true, () => false);
    if (opened) return;
  }
  throw new Error(`"${name}" in the warmups gate never opened the mic`);
}

let failed = 0;

// Ends a scored song run on its Practice summary. End practice leaves for the
// library instead when the scored clock (behind the audio by the pitch lag)
// has reached no note yet. A heading or fixed sleep does not prove that the
// scored clock has advanced; a judged note does, even when the held fixture
// misses the melody. A miss names the screen End practice went to and what
// the run showed, rather than a bare timeout.
async function endSongRunOnSummary(page) {
  await page.getByRole("heading", { level: 2, name: "Sing along", exact: true }).waitFor({ timeout: 15_000 });
  // JudgmentReadout retains the last label after its visual flash fades.
  await page.locator('[aria-hidden="true"] span').filter({ hasText: /^(Perfect|Great|Good|Miss)$/ }).first().waitFor({ state: "attached", timeout: 15_000 });
  const before = (await page.getByRole("heading", { level: 2 }).allTextContents()).map((t) => t.trim()).join(" | ");
  const score = (await page.getByText("Running score", { exact: true }).locator("..").textContent().catch(() => ""))?.replace(/\s+/g, " ").trim();
  await page.getByRole("button", { name: "End practice", exact: true }).click();
  const summary = page.getByRole("heading", { level: 1, name: "Practice summary", exact: true });
  await summary.waitFor({ timeout: 15_000 }).catch(() => {});
  if (await summary.count()) return;
  const h1 = (await page.getByRole("heading", { level: 1 }).first().textContent().catch(() => ""))?.trim();
  throw new Error(`End practice did not reach the Practice summary: it showed "${h1}"; before it, the run's headings read "${before}" and "${score}"`);
}

async function runCase(browser, name, body, { releaseMs = TEST_RELEASE_MS } = {}) {
  const context = await browser.newContext({ viewport: VIEW, permissions: ["microphone"] });
  await context.addInitScript(init, releaseMs);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const notes = [];
  const started = Date.now();
  try {
    await body(page, notes);
    assert.deepEqual(errors, [], "page errors");
    console.log(`PASS ${name} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${name}: ${error.message.split("\n")[0]}`);
    console.error("MIC_DIAGNOSTICS", JSON.stringify(await mic(page).catch(() => null)));
  } finally {
    for (const note of notes) console.log(`       ${note}`);
    await context.close();
  }
}

const held = await launch(heldWav);
try {
  // 1. A single exercise: the mic closes after End, the list asks for
  //    nothing, and the next exercise reopens it and hears the note.
  await runCase(held, "warmups single exercise: End closes the mic, the next start reopens it", async (page, notes) => {
    await openWarmups(page);
    await expectLive(page, 0, "list before any ask", notes, 0);
    await enableFromGate(page, "Enable microphone");
    await page.locator("#warmup-gate").waitFor({ state: "detached" });
    // The list is out of a session, so the stream the gate opened goes idle too.
    await expectLive(page, 0, "list after Enable microphone, idle", notes);

    await pathRow(page, "Sustained hold").click();
    await expectLive(page, 1, "Sustained hold opened from the list", notes);
    const first = page.getByRole("dialog", { name: "Sustained hold", exact: true });
    await first.waitFor();
    notes.push(`Sustained hold reads ${await readoutReacts(page)} cents`);
    // Two sung reps: the counter is past rep 2 and a rep has been scored.
    await first.getByText(/^Rep 3$/).waitFor({ timeout: 45_000 });
    await first.getByText(REP_SCORE).waitFor();
    await expectLive(page, 1, "during Sustained hold", notes, 0);
    await first.getByRole("button", { name: "End", exact: true }).click();
    await page.getByRole("heading", { level: 1, name: "Session summary", exact: true }).waitFor();
    await expectLive(page, 0, "summary after End", notes);

    await page.getByRole("button", { name: "Back to library", exact: true }).click();
    await pathRow(page, "Five-note scale").waitFor();
    await expectStill(page, 0, "list after Back to library", notes);
    assert.equal(await page.locator("#warmup-gate").count(), 0, "the gate card came back");
    assert.equal(await page.getByText("Enable mic and start").count(), 0, '"Enable mic and start" came back');
    assert.equal(await page.getByRole("button", { name: "Enable microphone", exact: true }).count(), 0);

    await pathRow(page, "Five-note scale").click();
    const second = page.getByRole("dialog", { name: "Five-note scale", exact: true });
    await second.waitFor();
    await expectLive(page, 1, "Five-note scale opened from the list", notes);
    notes.push(`Five-note scale reads ${await readoutReacts(page)} cents`);
    await second.getByText(REP_SCORE).waitFor({ timeout: 30_000 });
    await second.getByRole("button", { name: "End", exact: true }).click();
    await page.getByRole("heading", { level: 1, name: "Session summary", exact: true }).waitFor();
    await expectLive(page, 0, "summary after the second End", notes);

    // End before any rep closes: nothing to summarize, straight back to the list.
    await page.getByRole("button", { name: "Back to library", exact: true }).click();
    await pathRow(page, "Humming thirds").click();
    const third = page.getByRole("dialog", { name: "Humming thirds", exact: true });
    await third.waitFor();
    await expectLive(page, 1, "Humming thirds opened", notes);
    await third.getByRole("button", { name: "End", exact: true }).click();
    await third.waitFor({ state: "hidden" });
    await expectLive(page, 0, "list after End with no rep sung", notes);
    assert.equal(await page.locator("#warmup-gate").count(), 0, "the gate card came back");
  });

  // 2. A routine ended from its step slide reaches its summary; Play again reopens.
  await runCase(held, "warmups routine: summary closes the mic, Play again reopens it", async (page, notes) => {
    await openWarmups(page, "?routine=quick");
    await enableFromGate(page, "Enable mic and start");
    const slide = page.getByRole("dialog", { name: "Quick warmup", exact: true });
    await slide.getByText("Step 1 of 4").waitFor();
    await slide.getByRole("button", { name: "Start now" }).click();
    const step = page.getByRole("dialog", { name: "Lip-trill arpeggio", exact: true });
    await step.waitFor();
    notes.push(`Lip-trill arpeggio reads ${await readoutReacts(page)} cents`);
    await step.getByText(REP_SCORE).waitFor({ timeout: 30_000 });
    // The header's close button and the strip's button share the name; both end the step.
    await step.getByRole("button", { name: "Finish step", exact: true }).first().click();
    await slide.getByText("Step 2 of 4").waitFor();
    await expectLive(page, 1, "between steps", notes, 0);
    await slide.getByRole("button", { name: "Quit routine", exact: true }).click();
    const results = page.getByRole("dialog", { name: "Session complete", exact: true });
    await results.waitFor();
    await expectLive(page, 0, "routine summary", notes);
    assert.equal(await page.getByText(/Enable mic/).count(), 0, "a mic ask on the routine summary");

    await results.getByRole("button", { name: "Play again", exact: true }).click();
    await slide.getByText("Step 1 of 4").waitFor();
    await expectLive(page, 1, "Play again, on the first step's slide", notes);
    await slide.getByRole("button", { name: "Start now" }).click();
    await step.waitFor();
    notes.push(`Lip-trill arpeggio after Play again reads ${await readoutReacts(page)} cents`);
    // Quit with nothing sung this run: back to the list, mic closed.
    await step.getByRole("button", { name: "Finish step", exact: true }).first().click();
    await slide.getByText("Step 2 of 4").waitFor();
    await slide.getByRole("button", { name: "Quit routine", exact: true }).click();
    await page.getByRole("heading", { level: 1, name: "Guided vocal warm-up exercises", exact: true }).waitFor();
    await expectLive(page, 0, "list after quitting the second run", notes);
    assert.equal(await page.locator("#warmup-gate").count(), 0, "the gate card came back");
  });

  // 3. A set rep count ends on the single-exercise summary by itself; both
  //    of its starts reopen the mic.
  await runCase(held, "warmups single-exercise summary: Run this ladder again and Next exercise reopen", async (page, notes) => {
    await openWarmups(page, "?exercise=sustained-hold&reps=1");
    await page.getByText("This exercise stops by itself after 1 rep.").waitFor();
    await enableFromGate(page, "Enable mic and start");
    const run = page.getByRole("dialog", { name: "Sustained hold", exact: true });
    await run.waitFor();
    await run.getByText("1 rep", { exact: true }).waitFor();
    await page.getByRole("heading", { level: 1, name: "Session summary", exact: true }).waitFor({ timeout: 45_000 });
    await expectLive(page, 0, "summary after a 1-rep link finished itself", notes);

    await page.getByRole("button", { name: "Run this ladder again", exact: true }).click();
    await run.waitFor();
    await expectLive(page, 1, "Run this ladder again", notes);
    notes.push(`Sustained hold again reads ${await readoutReacts(page)} cents`);
    await run.getByText(REP_SCORE).waitFor({ timeout: 45_000 });
    await run.getByRole("button", { name: "End", exact: true }).click();
    await page.getByRole("heading", { level: 1, name: "Session summary", exact: true }).waitFor();
    await expectLive(page, 0, "summary after End", notes);

    // Today's three can put "Sing it" where "Next exercise" goes; both start the next pick.
    const next = page.getByRole("button", { name: /^(Next exercise|Sing it)$/ }).first();
    const label = (await next.textContent())?.trim();
    await next.click();
    await page.getByRole("dialog").waitFor();
    await expectLive(page, 1, `${label} from the summary`, notes);
    notes.push(`${label} opened ${await page.getByRole("dialog").getAttribute("aria-label")}, reads ${await readoutReacts(page)} cents`);
  });

  // 5. Songs: the Practice summary and the library close the mic; Sing
  //    again and a library card reopen it before Play.
  await runCase(held, "songs: summary and library close the mic, Sing again and a card reopen it", async (page, notes) => {
    await page.goto(`${BASE}/songs`);
    await page.waitForLoadState("networkidle");
    await dismissOverlays(page);
    await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
    const libraryTitle = page.getByRole("heading", { level: 1, name: "Public domain songs to sing in your key", exact: true });
    await page.getByRole("button", { name: "Continue without a mic" }).waitFor({ state: "detached" });
    await expectLive(page, 0, "library after the gate, idle", notes);

    const sing = page.getByRole("button", { name: "Sing", exact: true }).first();
    await sing.click();
    const transport = page.locator("#song-transport");
    await transport.waitFor();
    const title = (await page.getByRole("heading", { level: 1 }).textContent())?.trim();
    await page.getByRole("button", { name: "Play", exact: true }).first().click();
    await page.getByText("Running score", { exact: true }).waitFor();
    await expectLive(page, 1, `${title}, running`, notes, 0);
    await endSongRunOnSummary(page);
    await expectLive(page, 0, "Practice summary after End practice", notes);
    assert.equal(await page.getByRole("button", { name: /Enable microphone/ }).count(), 0, "a mic ask on the summary");

    await page.getByRole("button", { name: "Sing again", exact: true }).click();
    await transport.waitFor();
    // Read the instant the player mounts, before Play: the mic is already back.
    await expectLive(page, 1, "Sing again, player open before Play", notes, 0);
    assert.equal(await page.getByText("Listen mode", { exact: true }).count(), 0, '"Listen mode" after Sing again');
    await page.getByRole("button", { name: "Play", exact: true }).first().click();
    await page.getByText("Running score", { exact: true }).waitFor();
    await page.getByRole("heading", { level: 2, name: "Sing along", exact: true }).waitFor({ timeout: 15_000 });
    notes.push("Sing again run is scored: Running score on screen, no Listen mode");

    await page.getByRole("button", { name: "Exit practice", exact: true }).click();
    await libraryTitle.waitFor();
    await expectStill(page, 0, "library after Exit practice", notes);
    assert.equal(await page.getByRole("button", { name: "Continue without a mic" }).count(), 0, "the gate came back");
    assert.equal(await page.getByRole("button", { name: "Enable microphone", exact: true }).count(), 0, 'the header "Enable microphone" came back');

    await sing.click();
    await transport.waitFor();
    await expectLive(page, 1, "library card, player open before Play", notes, 0);
    assert.equal(await page.getByText("Listen mode", { exact: true }).count(), 0, '"Listen mode" from a library card');

    // A reopen that fails brings the gate back, with its way on without a mic.
    await page.getByRole("button", { name: "Exit practice", exact: true }).click();
    await libraryTitle.waitFor();
    await expectLive(page, 0, "library after the second Exit practice", notes);
    await page.evaluate(() => { window.__micFail = true; });
    await sing.click();
    await page.getByRole("button", { name: "Continue without a mic", exact: true }).waitFor();
    assert.equal(await transport.count(), 0, "a player opened on a failed reopen");
    await expectLive(page, 0, "gate after a refused reopen", notes, 0);
  });

  // 6. Listen mode: a singer who went on without a mic is never asked for
  //    one; once they turn it on, the next start reopens it.
  await runCase(held, "songs listen mode: no mic until asked, then starts reopen it", async (page, notes) => {
    await page.goto(`${BASE}/songs`);
    await page.waitForLoadState("networkidle");
    await dismissOverlays(page);
    await page.getByRole("button", { name: "Continue without a mic", exact: true }).click();
    const libraryTitle = page.getByRole("heading", { level: 1, name: "Public domain songs to sing in your key", exact: true });
    await libraryTitle.waitFor();
    // Unchanged: the library still offers the mic to a singer who has not allowed it.
    await page.getByRole("button", { name: "Enable microphone", exact: true }).waitFor();
    const sing = page.getByRole("button", { name: "Sing", exact: true }).first();
    await sing.click();
    await page.locator("#song-transport").waitFor();
    await page.getByText("Listen mode", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Play", exact: true }).first().click();
    await page.getByRole("button", { name: "Pause", exact: true }).first().waitFor();
    await page.waitForTimeout(4000);
    await expectLive(page, 0, "listen mode, running", notes, 0);
    await page.getByRole("button", { name: "End practice", exact: true }).click();
    const summary = page.getByRole("heading", { level: 1, name: "Practice summary", exact: true });
    await Promise.race([summary.waitFor(), libraryTitle.waitFor()]);
    if (await summary.count()) {
      await expectLive(page, 0, "listen-mode summary", notes, 0);
      await page.getByRole("button", { name: "Sing again", exact: true }).click();
      await page.locator("#song-transport").waitFor();
      await page.getByText("Listen mode", { exact: true }).waitFor();
      await expectLive(page, 0, "Sing again in listen mode", notes, 0);
      await page.getByRole("button", { name: "Exit practice", exact: true }).click();
      await libraryTitle.waitFor();
    }
    await expectStill(page, 0, "library in listen mode", notes, 1000);
    const m = await mic(page);
    assert.equal(m.opened, 0, `listen mode opened the mic: ${fmt(m)}`);

    // Turned on later from the library header, the mic is reopened by a start like anyone's.
    await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
    await page.waitForFunction(() => window.__mic().opened > 0, null, { timeout: 5000 });
    await page.getByRole("button", { name: "Enable microphone", exact: true }).waitFor({ state: "detached" });
    await expectLive(page, 0, "library after a late Enable microphone, idle", notes);
    await sing.click();
    await page.locator("#song-transport").waitFor();
    await expectLive(page, 1, "library card after a late enable, before Play", notes, 0);
    assert.equal(await page.getByText("Listen mode", { exact: true }).count(), 0, '"Listen mode" after a late enable');

    // A scored run, then a reopen that fails from its summary: the gate comes
    // back with its error, as it does for a singer who never skipped the mic,
    // and "Sing again" does not quietly start an unscored run.
    await page.getByRole("button", { name: "Play", exact: true }).first().click();
    await endSongRunOnSummary(page);
    await expectLive(page, 0, "scored summary after a late enable", notes);
    await page.evaluate(() => { window.__micFail = true; });
    await page.getByRole("button", { name: "Sing again", exact: true }).click();
    await page.getByRole("button", { name: "Continue without a mic", exact: true }).waitFor();
    assert.equal(await page.locator("#song-transport").count(), 0, "a player opened on a failed reopen");
    await expectLive(page, 0, "gate after a refused reopen from a scored summary", notes, 0);
  });

  // 7. The idle grace, with the app's real delay: a run that just ended
  //    keeps its stream, and a quick "Sing again" uses it without a reopen.
  await runCase(held, "idle grace: the mic is still open 3 s after a run ends", async (page, notes) => {
    await openWarmups(page);
    await enableFromGate(page, "Enable microphone");
    await page.locator("#warmup-gate").waitFor({ state: "detached" });
    await pathRow(page, "Humming thirds").click();
    const run = page.getByRole("dialog", { name: "Humming thirds", exact: true });
    await run.waitFor();
    await run.getByRole("button", { name: "End", exact: true }).click();
    await run.waitFor({ state: "hidden" });
    await expectStill(page, 1, `warmups list ${GRACE_CHECK_MS / 1000} s after End`, notes, GRACE_CHECK_MS);

    await page.goto(`${BASE}/songs`);
    await page.waitForLoadState("networkidle");
    await dismissOverlays(page);
    await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
    await page.getByRole("button", { name: "Continue without a mic" }).waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Sing", exact: true }).first().click();
    await page.locator("#song-transport").waitFor();
    await page.getByRole("button", { name: "Play", exact: true }).first().click();
    await endSongRunOnSummary(page);
    const ended = await expectStill(page, 1, `Practice summary ${GRACE_CHECK_MS / 1000} s after End practice`, notes, GRACE_CHECK_MS);
    await page.getByRole("button", { name: "Sing again", exact: true }).click();
    await page.locator("#song-transport").waitFor();
    const again = await expectLive(page, 1, "Sing again inside the grace", notes, 0);
    assert.equal(again.opened, ended.opened, `Sing again reopened a stream it could keep: ${fmt(ended)} then ${fmt(again)}`);
  }, { releaseMs: null });
} finally {
  await held.close();
}

const silent = await launch(silentWav);
try {
  // 4. The deliberate exception: an exercise that closed itself for silence
  //    keeps the mic so "No sound picked up" can show a live input meter,
  //    however long the idle release is.
  for (let silentAttempt = 0; silentAttempt < 3; silentAttempt++) {
  await runCase(silent, "warmups silent stop: the mic stays open for the No sound picked up meter", async (page, notes) => {
    await openWarmups(page);
    await enableFromGate(page, "Enable microphone");
    await page.locator("#warmup-gate").waitFor({ state: "detached" });
    await pathRow(page, "Five-note scale").click();
    const run = page.getByRole("dialog", { name: "Five-note scale", exact: true });
    await run.waitFor();
    await run.waitFor({ state: "hidden", timeout: 60_000 });
    await page.getByRole("heading", { level: 2, name: "No sound picked up", exact: true }).waitFor();
    await page.getByText("Five-note scale stopped after two reps with no note heard, so nothing was logged.").waitFor();
    // Longer than the 400 ms idle release: the note holds the mic for its meter.
    await expectStill(page, 1, "list after the silent stop", notes);
  });

  }

  // 4b. The note's own control turns the mic off, and the next start reopens it.
  await runCase(silent, 'warmups silent stop: "Turn off the mic" closes it, the next start reopens it', async (page, notes) => {
    await openWarmups(page);
    await enableFromGate(page, "Enable microphone");
    await page.locator("#warmup-gate").waitFor({ state: "detached" });
    await pathRow(page, "Five-note scale").click();
    const run = page.getByRole("dialog", { name: "Five-note scale", exact: true });
    await run.waitFor();
    await run.waitFor({ state: "hidden", timeout: 60_000 });
    await page.getByRole("heading", { level: 2, name: "No sound picked up", exact: true }).waitFor();
    await expectLive(page, 1, "No sound picked up note", notes, 0);
    await page.getByRole("button", { name: "Turn off the mic", exact: true }).click();
    await expectLive(page, 0, "after Turn off the mic", notes);
    await expectStill(page, 0, "still off", notes, 1000);
    await pathRow(page, "Five-note scale").click();
    await run.waitFor();
    await expectLive(page, 1, "Five-note scale started again", notes);
  });
} finally {
  await silent.close();
  await rm(dir, { recursive: true, force: true });
}

if (failed) {
  console.log(`\n${failed} case(s) failed`);
  process.exit(1);
}
