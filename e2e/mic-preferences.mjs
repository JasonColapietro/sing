/** Rapid microphone choices while permission is pending must use the latest choice. */
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
    { path: "/range?mode=pitch#start", start: "Start singing", ready: "Stop mic", stop: "Stop mic" },
    { path: "/recorder", start: "Enable microphone", ready: "Start recording", rejectStale: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
    try {
      await context.addInitScript(() => {
        localStorage.clear();
        localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
        const requests = [], pending = [], tracks = [], attached = [];
        const streamDevices = new Map();
        navigator.mediaDevices.enumerateDevices = async () => ["a", "b", "c"].map((id) => ({
          deviceId: `qa-${id}`, kind: "audioinput", label: `Fixture ${id.toUpperCase()}`, groupId: "fixture",
        }));
        navigator.mediaDevices.getUserMedia = ({ audio }) => new Promise((resolve, reject) => {
          const request = { device: audio.deviceId?.exact ?? "", echo: audio.echoCancellation };
          requests.push(request);
          pending.push({ ...request, resolve, reject });
        });
        const source = AudioContext.prototype.createMediaStreamSource;
        AudioContext.prototype.createMediaStreamSource = function (stream) {
          attached.push(streamDevices.get(stream));
          return source.call(this, stream);
        };
        window.__grantNextMic = () => {
          const request = pending.shift();
          const audio = new AudioContext();
          const stream = audio.createMediaStreamDestination().stream;
          streamDevices.set(stream, request.device);
          tracks.push(...stream.getTracks().map((track) => ({ track, device: request.device })));
          request.resolve(stream);
        };
        window.__rejectNextMic = () => pending.shift().reject(new DOMException("The old input disappeared", "OverconstrainedError"));
        window.__micPreferences = () => ({
          requests, attached,
          live: tracks.filter(({ track }) => track.readyState === "live").map(({ device }) => device),
        });
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}${room.path}`, { waitUntil: "networkidle" });
      await page.locator("summary").filter({ hasText: "Audio setup" }).click();
      const input = page.getByLabel("Microphone", { exact: true });
      await input.selectOption("qa-a");
      await page.getByRole("button", { name: room.start, exact: true }).click();
      await page.waitForFunction(() => window.__micPreferences().requests.length === 1);
      await input.selectOption("qa-b");
      await page.getByRole("radio", { name: /^Speakers/ }).check();
      await page.evaluate(() => window.__grantNextMic());
      await page.waitForFunction(() => window.__micPreferences().requests.length === 2);
      await input.selectOption("qa-c");
      if (room.rejectStale) await page.evaluate(() => window.__rejectNextMic());
      else await page.evaluate(() => window.__grantNextMic());
      await page.waitForFunction(() => window.__micPreferences().requests.length === 3);
      assert.equal(await input.inputValue(), "qa-c");
      await page.evaluate(() => window.__grantNextMic());
      await page.getByRole("button", { name: room.ready, exact: true }).waitFor();
      assert.deepEqual(await page.evaluate(() => window.__micPreferences()), {
        requests: [
          { device: "qa-a", echo: false },
          { device: "qa-b", echo: true },
          { device: "qa-c", echo: true },
        ],
        attached: ["qa-c"], live: ["qa-c"],
      });
      if (room.stop) {
        await page.getByRole("button", { name: room.stop, exact: true }).click();
        await input.locator('option[value="qa-c"]').waitFor({ state: "attached" });
        assert.equal(await input.inputValue(), "qa-c", "the picker retains the selected input after stopping");
      } else {
        // Recorder has no mic-only Stop; leave through its ordinary client link.
        await page.locator('header a[href="/"]').click();
        await page.waitForURL(`${base}/`);
      }
      await page.waitForFunction(() => window.__micPreferences().live.length === 0);
      assert.equal((await page.evaluate(() => window.__micPreferences())).requests.length, 3,
        "cleanup does not open another input or replace the document fixture");
      assert.deepEqual(errors, []);
      console.log(`PASS ${room.path}: pending A→B→C uses C with speaker echo cancellation, releases stale streams`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
