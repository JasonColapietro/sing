/** Native Enter activation must not also trigger an ear game's global shortcut. */
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
  for (const name of ["Interval ID", "Pitch match", "Melody echo"]) {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
    try {
      await context.addInitScript(() => {
        localStorage.clear();
        localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
        window.__toneStarts = 0;
        for (const prototype of [AudioBufferSourceNode.prototype, OscillatorNode.prototype]) {
          const start = prototype.start;
          prototype.start = function (...args) { window.__toneStarts++; return start.apply(this, args); };
        }
        navigator.mediaDevices.getUserMedia = async () => {
          const audio = new AudioContext();
          return audio.createMediaStreamDestination().stream;
        };
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/ear-training`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: new RegExp(name) }).first().click();
      const game = page.getByRole("dialog", { name, exact: true });
      if (name === "Interval ID") {
        await game.getByRole("button", { name: /shortcut 1$/ }).click();
        await game.getByRole("button", { name: "Next round", exact: true }).waitFor();
      } else {
        await game.getByRole("button", { name: "Enable microphone", exact: true }).click();
        if (name === "Pitch match") {
          // A silent actual MediaStream reaches the ordinary timed result.
          await game.getByRole("button", { name: "Next round", exact: true }).waitFor({ timeout: 20000 });
        } else {
          await game.getByText(/Sing it back:/).waitFor();
        }
      }
      const before = await page.evaluate(() => window.__toneStarts);
      await game.getByRole("button", { name: "Hear again", exact: true }).press("Enter");
      await page.waitForFunction((count) => window.__toneStarts > count, before);
      if (name === "Melody echo") {
        assert.match(await game.innerText(), /Round 1\/10/i, "Hear again must not record an answer");
        await game.getByText(/Sing it back:/).waitFor();
        await game.getByRole("button", { name: "I'm done", exact: true }).press("Enter");
      }
      assert.equal(await game.getByRole("button", { name: "Next round", exact: true }).count(), 1,
        "Hear again keeps the result until the singer chooses Next round");
      await game.getByRole("button", { name: "Next round", exact: true }).press("Enter");
      await game.getByRole("button", { name: "Next round", exact: true }).waitFor({ state: "hidden" });
      await game.getByRole("button", { name: "Exit game", exact: true }).press("Enter");
      await game.waitFor({ state: "hidden" });
      assert.deepEqual(errors, []);
      console.log(`PASS ${name}: Enter activates Hear again, Next round, and Quit without hijacking`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
