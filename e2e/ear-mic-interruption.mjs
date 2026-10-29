/**
 * Ear-game device loss through the real usePitch hook in Chromium.
 *
 * node e2e/ear-mic-interruption.mjs [baseUrl] [--executable=/path/to/chrome]
 *
 * getUserMedia is replaced before the app loads with a silent browser-created
 * MediaStream. No physical microphone, permission prompt, account or payment
 * service is used. Ending its actual track must show a retry gate, stop answer
 * clocks/shortcuts, and reconnect without losing the unscored round.
 */
import pw from "playwright";
import assert from "node:assert/strict";

const args = process.argv.slice(2);
const base = (args.find((arg) => !arg.startsWith("--")) ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const executable = args.find((arg) => arg.startsWith("--executable="))?.slice(13);
const channel = args.find((arg) => arg.startsWith("--channel="))?.slice(10) ?? "chrome";
const browser = await pw.chromium.launch({
  ...(executable ? { executablePath: executable } : { channel }),
  args: ["--autoplay-policy=no-user-gesture-required"],
});

try {
  for (const name of ["Pitch match", "Melody echo", "Note catcher"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    try {
      await context.addInitScript(() => {
        localStorage.clear();
        localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
        window.__earFakeMics = [];
        navigator.mediaDevices.getUserMedia = async () => {
          const audio = new AudioContext();
          const destination = audio.createMediaStreamDestination();
          window.__earFakeMics.push({ audio, stream: destination.stream });
          return destination.stream;
        };
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`${base}/ear-training`);
      await page.waitForLoadState("networkidle");
      for (const label of ["Not now", "Dismiss"]) {
        const dismiss = page.getByRole("button", { name: label, exact: true });
        if (await dismiss.count()) await dismiss.first().click({ force: true }).catch(() => {});
      }
      await page.getByRole("button", { name: new RegExp(name) }).first().click();
      const game = page.getByRole("dialog", { name, exact: true });
      await game.getByRole("button", { name: "Enable microphone", exact: true }).click();
      if (name === "Pitch match") await game.getByText("Sing the note and hold it inside the band.", { exact: true }).waitFor();
      else if (name === "Melody echo") await game.getByText(/Sing it back:/).waitFor();
      else await game.getByRole("button", { name: /Pause/ }).waitFor();

      await page.evaluate(() => {
        const track = window.__earFakeMics.at(-1).stream.getAudioTracks()[0];
        // stop() itself deliberately emits no ended event; device loss does.
        track.stop();
        track.dispatchEvent(new Event("ended"));
      });
      await game.getByText("The microphone stopped. Check it is still connected, then try again.", { exact: true }).waitFor();
      const retry = game.getByRole("button", { name: "Try again", exact: true });
      await retry.waitFor();
      await page.evaluate(() => {
        for (const key of ["Enter", "r", "R", " "])
          window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      });
      // Longer than Pitch match's entire 8s answer window. In Note catcher
      // this also lets at least one target pass if its clock is still live.
      await page.waitForTimeout(9000);
      assert.match(await game.innerText(), /Round 1\/10/i);
      assert.equal(await retry.count(), 1);
      const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem("suede-sing:progress:v1") ?? "{}").sessions ?? []);
      assert.deepEqual(sessions, [], `${name} logged practice while disconnected`);

      await retry.click();
      await retry.waitFor({ state: "hidden" });
      assert.equal(await page.evaluate(() => window.__earFakeMics.length), 2);
      assert.match(await game.innerText(), /Round 1\/10/i);
      if (name === "Note catcher") {
        await game.getByRole("button", { name: "Resume", exact: true }).first().click();
        await game.getByRole("button", { name: /Pause/ }).waitFor();
      } else {
        await game.getByText(name === "Pitch match" ? "Listen…" : "Listen to the melody…", { exact: true }).waitFor();
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${name}: ended track stops scoring/shortcuts; reconnect retains round 1`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
