/** Recorder keyboard/download recovery against a local production build. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { encodeWav } from "../lib/audio/voice-fixture.ts";

const args = process.argv.slice(2);
const base = (args.find((arg) => !arg.startsWith("--")) ?? "http://127.0.0.1:3100").replace(/\/$/, "");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname), "Use a local test server");
const executable = args.find((arg) => arg.startsWith("--executable="))?.slice(13);
const wav = encodeWav(new Float32Array(48000 * 5), 48000);
const browser = await chromium.launch({
  ...(executable ? { executablePath: executable } : { channel: "chrome" }),
  args: ["--autoplay-policy=no-user-gesture-required"],
});
try {
  const context = await browser.newContext({ viewport: { width: 375, height: 667 }, acceptDownloads: true });
  await context.addInitScript((byteLength) => {
    localStorage.clear();
    localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
    window.__failTakeDecode = false;
    window.__takeDecodeReads = 0;
    window.__takeDecodePending = 0;
    window.__takePlays = 0;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      if (this.src.startsWith("blob:")) window.__takePlays++;
      return play.apply(this, args);
    };
    const decode = AudioContext.prototype.decodeAudioData;
    AudioContext.prototype.decodeAudioData = function (bytes, ...callbacks) {
      if (bytes.byteLength !== byteLength) return decode.call(this, bytes, ...callbacks);
      window.__takeDecodeReads++;
      if (window.__failTakeDecode) {
        window.__failTakeDecode = false;
        return Promise.reject(new DOMException("Injected decode failure", "EncodingError"));
      }
      window.__takeDecodePending++;
      return decode.call(this, bytes, ...callbacks).finally(() => window.__takeDecodePending--);
    };
  }, wav.length);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  // Disposable browser-owned IndexedDB fixture, never an account or server.
  await page.evaluate(async (bytes) => {
    const db = await new Promise((resolve, reject) => {
      const open = indexedDB.open("suede-sing-takes", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("takes", { keyPath: "id" });
      open.onerror = () => reject(open.error);
      open.onsuccess = () => resolve(open.result);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction("takes", "readwrite");
      tx.objectStore("takes").put({
        id: "qa-take", name: "QA take", createdAt: Date.now(), durationSec: 5,
        mimeType: "audio/wav", blob: new Blob([new Uint8Array(bytes)], { type: "audio/wav" }), starred: false,
      });
      tx.objectStore("takes").put({
        id: "broken-take", name: "Broken take", createdAt: 0, durationSec: 5,
        mimeType: "audio/wav", blob: new Blob(["damaged recording"], { type: "audio/wav" }), starred: false,
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  }, [...wav]);
  await page.goto(`${base}/recorder`);
  await page.waitForLoadState("networkidle");
  const takeRow = page.getByRole("listitem").filter({
    has: page.getByRole("button", { name: "Rename QA take", exact: true }),
  });
  await takeRow.getByRole("button", { name: "Play QA take", exact: true }).click();
  await takeRow.getByRole("button", { name: "Pause QA take", exact: true }).click();
  await page.waitForFunction(() => window.__takeDecodeReads > 0 && window.__takeDecodePending === 0);

  await page.evaluate(() => { window.__failTakeDecode = true; });
  await page.getByRole("button", { name: "Download QA take as WAV", exact: true }).press("Space");
  const error = page.getByRole("alert").filter({ hasText: "couldn’t be converted to WAV" });
  await error.waitFor({ timeout: 5000 });
  assert.equal(await takeRow.getByRole("button", { name: "Play QA take", exact: true }).count(), 1,
    "Space activates Download instead of starting playback");

  async function downloadFrom(button) {
    const pending = page.waitForEvent("download");
    await button.click();
    const download = await pending;
    assert.match(download.suggestedFilename(), /\.wav$/);
    const file = await download.path();
    assert.ok(file);
    const bytes = await readFile(file);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WAVE");
    assert.ok(bytes.length > 44);
  }
  await downloadFrom(error.getByRole("button", { name: "Download original", exact: true }));
  await downloadFrom(error.getByRole("button", { name: "Retry WAV download", exact: true }));
  assert.equal(await error.count(), 0, "successful retry clears conversion failure");

  await page.getByRole("button", { name: "Delete QA take", exact: true }).press("Space");
  await page.getByText("Delete take? This can’t be undone.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Keep", exact: true }).press("Space");
  assert.equal(await page.getByRole("button", { name: "Rename QA take", exact: true }).count(), 1);
  assert.equal(await takeRow.getByRole("button", { name: "Play QA take", exact: true }).count(), 1);

  const brokenRow = page.getByRole("listitem").filter({
    has: page.getByRole("button", { name: "Rename Broken take", exact: true }),
  });
  await brokenRow.getByRole("button", { name: "Play Broken take", exact: true }).click();
  const playbackError = page.getByRole("alert").filter({ hasText: "couldn’t play" });
  await playbackError.waitFor();
  assert.equal(await brokenRow.getByRole("button", { name: "Play Broken take", exact: true }).count(), 1,
    "A real unsupported media resource returns the controls to idle");
  const attempts = await page.evaluate(() => window.__takePlays);
  await playbackError.getByRole("button", { name: "Retry playback", exact: true }).click();
  await page.waitForFunction((previous) => window.__takePlays > previous, attempts);
  await playbackError.waitFor();
  const originalPending = page.waitForEvent("download");
  await playbackError.getByRole("button", { name: "Download original", exact: true }).click();
  const original = await originalPending;
  assert.equal(await readFile(await original.path(), "utf8"), "damaged recording",
    "The original bytes remain downloadable after playback failure");
  await takeRow.getByRole("button", { name: "Play QA take", exact: true }).click();
  await takeRow.getByRole("button", { name: "Pause QA take", exact: true }).waitFor();
  assert.equal(await playbackError.count(), 0, "A different valid take still plays");
  await takeRow.getByRole("button", { name: "Pause QA take", exact: true }).click();
  assert.deepEqual(errors, []);
  console.log("PASS recorder: Space activation, WAV retry, original download, Keep, real media failure and playback retry");
  await context.close();
} finally {
  await browser.close();
}
