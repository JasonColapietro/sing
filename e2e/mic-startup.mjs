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
    { path: "/analyze", start: "Enable microphone", retry: "Enable microphone", stop: "Stop" },
  ]) {
    for (const stage of ["createMediaStreamSource", "createAnalyser"]) {
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
            return stream;
          };
          const original = AudioContext.prototype[failureStage];
          AudioContext.prototype[failureStage] = function (...params) {
            if (fail && tracks.length > 0) {
              fail = false;
              throw new DOMException("Injected audio setup failure", "InvalidStateError");
            }
            return original.apply(this, params);
          };
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
        const alert = page.getByRole("alert").filter({ hasText: "The microphone couldn't start." });
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
} finally {
  await browser.close();
}
