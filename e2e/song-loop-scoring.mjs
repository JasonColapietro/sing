/**
 * Short-loop scoring through the real browser audio path.
 *
 *   npm run build && npm start            # in another shell
 *   node e2e/song-loop-scoring.mjs [baseUrl] [--channel=chrome] [--executable=path]
 *
 * Plays a perfectly held G4 in as Chrome's fake microphone, loops the one
 * matching note of Silent Night ("lent", one beat) as a performance, and
 * requires every loop to score at least 95%.
 *
 * This guards the lag-aware loop close in components/songs/song-player.tsx.
 * Pitch reports trail the audio clock by the analyser frame plus output
 * latency; when loops were closed on the audio clock, the last note's tail
 * arrived after its loop was already scored, and this exact run read 77-81%
 * per loop for a perfect note.
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
const MIN_LOOP_SCORE = 95;

const dir = await mkdtemp(path.join(os.tmpdir(), "sing-loop-"));
const wav = path.join(dir, "g4.wav");
await writeFile(wav, encodeWav(synthVoice({ freq: midiToHz(67), sampleRate: 48000, length: 48000 * 30, level: 0.3 }), 48000));
const browser = await pw.chromium.launch({
  ...(EXECUTABLE ? { executablePath: EXECUTABLE } : { channel: CHANNEL }),
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    `--use-file-for-fake-audio-capture=${wav}`,
    "--autoplay-policy=no-user-gesture-required",
  ],
});
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ["microphone"] });
  await context.addInitScript(() => {
    try { localStorage.clear(); localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString()); } catch {}
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${BASE}/songs?song=silent-night`);
  await page.waitForLoadState("networkidle");
  for (const name of ["Not now", "Dismiss"]) {
    const button = page.getByRole("button", { name, exact: true });
    if (await button.count()) await button.first().click({ force: true }).catch(() => {});
  }
  // A click that lands before hydration is a no-op; retry until React reports it.
  const performance = page.getByRole("button", { name: "Performance", exact: true }).first();
  for (let i = 0; i < 20 && (await performance.getAttribute("aria-pressed")) !== "true"; i++) {
    await performance.click();
    await page.waitForTimeout(250);
  }
  await page.getByRole("button", { name: "Enable microphone", exact: true }).click();
  const from = page.getByLabel("Loop from", { exact: true });
  await from.waitFor();
  // Boundaries 1..2 are the single one-beat note "lent" (G4).
  await page.getByLabel("Loop to", { exact: true }).fill("2");
  await from.fill("1");
  assert.match(await from.getAttribute("aria-valuetext"), /“lent”/);
  await page.getByRole("button", { name: "Play", exact: true }).first().click();
  const main = page.locator("main");
  await main.getByText("Performance complete").waitFor({ timeout: 60_000 });
  // The summary lists "loop N" followed by that loop's score.
  const perLoop = [...(await main.innerText()).matchAll(/loop \d+\s+(\d+)%/gi)].map((m) => Number(m[1]));
  console.log(`per-loop scores: ${perLoop.join("% ")}%`);
  assert.ok(perLoop.length >= 4, `expected 4 loop scores, read ${perLoop.length}`);
  for (const score of perLoop.slice(0, 4)) {
    assert.ok(score >= MIN_LOOP_SCORE, `a perfectly held note scored ${score}% (< ${MIN_LOOP_SCORE}%)`);
  }
  assert.deepEqual(errors, []);
  console.log("PASS short loop: a perfect one-note loop scores every loop");
} finally {
  await browser.close();
  await rm(dir, { recursive: true, force: true });
}
