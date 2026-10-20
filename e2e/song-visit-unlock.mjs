/** A song-page link stays usable through Exit, browsing and a queued next song. */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const base = (args.find((arg) => !arg.startsWith("--")) ?? "http://127.0.0.1:3100").replace(/\/$/, "");
const executablePath = args.find((arg) => arg.startsWith("--executable="))?.slice(13);
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : { channel: "chrome" }),
  headless: true,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(() => {
  localStorage.setItem("suede-sing:coach-intro:v1", new Date().toISOString());
  if (!localStorage.getItem("suede-sing:setlist:v1")) {
    localStorage.setItem("suede-sing:setlist:v1", JSON.stringify({ ids: ["ode-to-joy", "twinkle"], cursor: -1 }));
  }
  localStorage.setItem("suede-sing:taste:v1", JSON.stringify({ kind: "skipped", at: new Date().toISOString() }));
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(`${base}/songs?song=twinkle-twinkle-little-star`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Continue without a mic", exact: true }).click();
  await page.getByRole("heading", { level: 1, name: "Twinkle Twinkle Little Star", exact: true }).waitFor();
  await page.getByRole("button", { name: "End practice", exact: true }).click();
  const linkedCard = page.getByRole("heading", { level: 3, name: "Twinkle Twinkle Little Star", exact: true }).locator("../..");
  await linkedCard.getByRole("button", { name: "Sing", exact: true }).waitFor();
  await linkedCard.getByText("Open this visit", { exact: true }).waitFor();
  const band = linkedCard.locator("xpath=ancestor::section[@aria-label][1]");
  assert.ok(await band.getByRole("button", { name: "Locked", exact: true }).count() > 0, "other songs keep their mastery gate");
  await page.getByRole("button", { name: "Start setlist", exact: true }).click();
  await page.getByRole("heading", { level: 1, name: "Ode to Joy", exact: true }).waitFor();
  await page.getByRole("button", { name: "Performance", exact: true }).click();
  await page.getByLabel("Loop to", { exact: true }).fill("2");
  await page.getByLabel("Loop from", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Play", exact: true }).first().click();
  await page.getByText("Performance complete", { exact: true }).waitFor({ timeout: 60_000 });
  await page.getByRole("button", { name: "Next: Twinkle Twinkle Little Star", exact: true }).click();
  await page.getByRole("heading", { level: 1, name: "Twinkle Twinkle Little Star", exact: true }).waitFor();
  await page.getByRole("button", { name: "End practice", exact: true }).click();
  await page.getByLabel("Search", { exact: true }).fill("Twinkle Twinkle Little Star");
  await page.getByRole("button", { name: "Surprise me", exact: true }).click();
  await page.getByRole("heading", { level: 1, name: "Twinkle Twinkle Little Star", exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log("PASS visit link: card after Exit, sibling lock, queued next song and filtered dice");
  await page.goto(`${base}/songs`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Continue without a mic", exact: true }).click();
  await linkedCard.getByRole("button", { name: "Locked", exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log("PASS fresh visit: linked song returns to its normal mastery gate");
} finally {
  await context.close();
  await browser.close();
}
