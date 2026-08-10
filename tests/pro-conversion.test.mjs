import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3100";

let browser;

before(async () => {
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
});

test("high-intent feature upsells target the paid plan", async () => {
  const sources = [
    "app/page.tsx",
    "app/atlas/[slug]/page.tsx",
    "app/songs/[slug]/page.tsx",
    "app/songs/page.tsx",
    "components/atlas/cta.tsx",
    "components/atlas/reader.tsx",
    "components/book/cta.tsx",
    "components/book/reader.tsx",
    "components/songs/library.tsx",
    "components/warmups/library.tsx",
  ];

  for (const source of sources) {
    const contents = await readFile(source, "utf8");
    assert.doesNotMatch(
      contents,
      /href="\/pro"/,
      `${source} should route its feature upsell to /pro#pro-plan`,
    );
  }
});

test("homepage Pro offer discloses price and routes to the paid plan", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const proLink = page.locator("main").getByRole("link", {
    name: "See Suede Pro for $9.99/month",
    exact: true,
  });

  assert.equal(await proLink.count(), 2);
  for (let index = 0; index < 2; index += 1) {
    assert.equal(
      await proLink.nth(index).getAttribute("href"),
      "/pro#pro-plan",
    );
  }

  await page.close();
});

test("value-moment Pro links target the paid plan", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(`${baseUrl}/studio`, { waitUntil: "networkidle" });
  const proLink = page.locator("main").getByRole("link", {
    name: "Pro",
    exact: true,
  });

  assert.equal(await proLink.getAttribute("href"), "/pro#pro-plan");

  await page.close();
});

test("the first-result offer routes to the paid plan", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "suede-sing:progress:v1",
      JSON.stringify({
        xp: 20,
        sessions: [
          {
            id: "first-result",
            type: "warmup",
            date: "2026-08-10T12:00:00.000Z",
            day: "2026-08-10",
            durationSec: 120,
            score: 82,
            xp: 20,
          },
        ],
        streak: { current: 1, best: 1, lastDay: "2026-08-10" },
        range: {},
        rangeHistory: [],
        achievements: ["first-note"],
      }),
    );
  });

  await page.goto(`${baseUrl}/progress`, { waitUntil: "networkidle" });
  const offer = page.getByRole("dialog", { name: "Go Pro" });
  const offerCta = offer.getByRole("button", {
    name: /See Pro.*\$9\.99\/month/i,
  });
  const offerBox = await offerCta.boundingBox();
  assert.ok(offerBox, "first-result CTA should have a rendered box");
  assert.ok(offerBox.height >= 44, "first-result CTA should be a 44px touch target");
  await offerCta.click();
  await page.waitForURL(`${baseUrl}/pro#pro-plan`);

  const checkout = page.locator("#pro-plan").getByRole("button", {
    name: /Pro.*\$9\.99\/month/i,
  });
  assert.equal(await checkout.isVisible(), true);

  await page.close();
});

test("the Pro hero lands on the paid plan with checkout visible on mobile", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto(`${baseUrl}/pro`, { waitUntil: "networkidle" });
  await page
    .locator("main")
    .getByRole("link", { name: /See Pro.*\$9\.99\/month/i })
    .first()
    .click();
  await page.waitForURL(`${baseUrl}/pro#pro-plan`);

  assert.equal(new URL(page.url()).hash, "#pro-plan");

  const paidPlan = page.locator("#pro-plan");
  const checkout = paidPlan.getByRole("button", {
    name: /Pro.*\$9\.99\/month/i,
  });
  assert.equal(
    await paidPlan.evaluate(
      (node) => node.parentElement?.firstElementChild === node,
    ),
    true,
    "the paid plan should be first in DOM and visual order",
  );
  assert.equal(await paidPlan.isVisible(), true);
  assert.equal(await checkout.isVisible(), true);

  const box = await checkout.boundingBox();
  assert.ok(box, "checkout button should have a rendered box");
  assert.ok(box.height >= 44, "checkout button should be a 44px touch target");
  assert.ok(box.y >= 0, "checkout button should not be above the viewport");
  assert.ok(
    box.y + box.height <= 844,
    "checkout button should be visible without another scroll",
  );

  await page.close();
});
