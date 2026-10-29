/**
 * A Web Audio failure after permission must release the mic and allow retry.
 * Run against a local build: node e2e/mic-startup.mjs [base] [--executable=path]
 * Browser-created silent streams keep physical microphones and accounts out
 * of the test. Faults are injected at the actual Web Audio API boundary.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const base = (args.find((arg) => !arg.startsWith("--")) ?? "http://127.0.0.1:3100").replace(/\/$/, "");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname), "Use a local test server");
const executable = args.find((arg) => arg.startsWith("--executable="))?.slice(13);
const browser = await chromium.launch({
  ...(executable ? { executablePath: executable } : { channel: "chrome" }),
  args: ["--autoplay-policy=no-user-gesture-required"],
});

try {
  for (const room of [
    { path: "/range?mode=pitch#start", start: "Start singing", retry: "Try again", stop: "Stop mic" },
    { path: "/analyze", start: "Enable microphone", retry: "Try again", stop: "Stop mic" },
  ]) {
    for (const stage of ["createMediaStreamSource", "createAnalyser", "endedStream"]) {
      const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
      try {
        await context.addInitScript((failureStage) => {
          localStorage.clear();
          localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
          const tracks = [];
          let fail = true;
          navigator.mediaDevices.getUserMedia = async () => {
            const audio = new AudioContext();
            const stream = audio.createMediaStreamDestination().stream;
            tracks.push(...stream.getTracks());
            if (failureStage === "endedStream" && fail) {
              fail = false;
              stream.getTracks().forEach((track) => track.stop());
            }
            return stream;
          };
          if (failureStage !== "endedStream") {
            const original = AudioContext.prototype[failureStage];
            AudioContext.prototype[failureStage] = function (...params) {
              if (fail && tracks.length > 0) {
                fail = false;
                throw new DOMException("Injected audio setup failure", "InvalidStateError");
              }
              return original.apply(this, params);
            };
          }
          window.__micStartup = () => ({
            opened: tracks.length,
            live: tracks.filter((track) => track.readyState === "live").length,
          });
        }, stage);
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(`${base}${room.path}`);
        await page.waitForLoadState("networkidle");
        const start = page.getByRole("button", { name: room.start, exact: true });
        await start.click();
        const alert = page.getByRole("alert").filter({ hasText: stage === "endedStream"
          ? "The microphone stopped." : "The microphone couldn't start." });
        await alert.waitFor({ timeout: 5000 });
        assert.deepEqual(await page.evaluate(() => window.__micStartup()), { opened: 1, live: 0 });
        const retry = page.getByRole("button", { name: room.retry, exact: true });
        assert.equal(await retry.isEnabled(), true, "the failure leaves a retry control");
        const bounds = await alert.boundingBox();
        assert.ok(bounds && bounds.y >= 0 && bounds.y + bounds.height <= 667, "failure feedback is visible on a phone");
        await retry.click();
        const stop = page.getByRole("button", { name: room.stop, exact: true });
        await stop.waitFor();
        assert.equal(await alert.count(), 0, "successful retry clears the error");
        assert.deepEqual(await page.evaluate(() => window.__micStartup()), { opened: 2, live: 1 });
        await stop.click();
        assert.deepEqual(await page.evaluate(() => window.__micStartup()), { opened: 2, live: 0 });
        assert.deepEqual(errors, [], "no unhandled startup rejection");
        console.log(`PASS ${room.path} ${stage}: release, visible error, retry, stop`);
      } finally {
        await context.close();
      }
    }
  }

  // A room's one start button is on a 375x667 phone's first screen: the
  // example figures sit under it (round 16), not between the heading and it.
  for (const room of [
    { path: "/studio", start: "Enable microphone" },
    { path: "/range?mode=range#start", start: "Start free range test" },
    { path: "/range?mode=pitch#start", start: "Start singing" },
  ]) {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
    try {
      await context.addInitScript(() => {
        localStorage.clear();
        localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
      });
      const page = await context.newPage();
      await page.goto(`${base}${room.path}`);
      await page.waitForLoadState("networkidle");
      const start = page.getByRole("button", { name: room.start, exact: true });
      await start.waitFor();
      const bounds = await start.boundingBox();
      assert.ok(bounds && bounds.y >= 0 && bounds.y + bounds.height <= 667,
        `${room.path}: "${room.start}" is on a phone's first screen (${bounds && `${Math.round(bounds.y)}-${Math.round(bounds.y + bounds.height)}`})`);
      console.log(`PASS ${room.path}: "${room.start}" on the first 375x667 screen`);
    } finally {
      await context.close();
    }
  }

  // BreathStudio owns the mic across its drill and home views. Leaving the
  // drill must cancel permission even though the hook itself stays mounted.
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  try {
    await context.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
      const pending = [];
      const tracks = [];
      navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => pending.push(resolve));
      window.__pendingMicCount = () => pending.length;
      window.__grantPendingMic = () => {
        const audio = new AudioContext();
        const stream = audio.createMediaStreamDestination().stream;
        tracks.push(...stream.getTracks());
        pending.shift()(stream);
      };
      window.__cancelledMicState = () => ({
        opened: tracks.length,
        live: tracks.filter((track) => track.readyState === "live").length,
      });
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/breath?drill=sustain`);
    await page.waitForLoadState("networkidle");
    const drill = page.getByRole("dialog", { name: "Sustain test", exact: true });
    await drill.getByRole("button", { name: "Enable microphone", exact: true }).click();
    await page.waitForFunction(() => window.__pendingMicCount() === 1);
    await drill.getByRole("button", { name: "Exit drill", exact: true }).click();
    // The room's heading stays mounted under a session, so wait for the drill
    // to close and the room's home view to come back.
    await drill.waitFor({ state: "detached" });
    await page.getByRole("heading", { name: "Breath routines", exact: true }).waitFor();
    await page.evaluate(() => window.__grantPendingMic());
    await page.waitForFunction(() => {
      const state = window.__cancelledMicState();
      return state.opened === 1 && state.live === 0;
    }, null, { timeout: 5000 });
    assert.equal(await drill.count(), 0, "late permission does not reopen the drill");
    assert.deepEqual(errors, []);
    console.log("PASS breath drill: late permission after Exit drill is released on home");
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}
