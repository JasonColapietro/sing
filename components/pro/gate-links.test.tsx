/**
 * One gate grammar: wherever a free singer meets a Pro boundary, the ask goes
 * to the buy card (/pro#buy, never the top of /pro, where the buy button is a
 * scroll away) and says what Pro costs before the tap.
 *
 * Two passes. The rendered pass draws each locked surface as a free singer and
 * reads its anchors. The source pass covers the surfaces that cannot be drawn
 * without a browser or a whole page (the cap slide, the chapter readers, the
 * song pages), by reading the files for a bare /pro link.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/pro", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/pro")>()),
  useIsPro: () => false,
  useProReady: () => true,
}));

import { CoachCard } from "@/components/progress/coach";
import { PLAN_ROWS, PRO_PERKS } from "@/lib/pro";
import { PathSection, RoutineGrid } from "@/components/warmups/routine-home";
import { DEFAULT_PROGRESS } from "@/lib/progress-shape";
import { formatPrice, PRICING } from "@/lib/pro-shared";
import { ProInlineNudge } from "./gate";
import { TakeSample } from "./take-sample";
import { LockedPanel, PRO_BUY_HREF, PRO_PRICE_ONCE, UNLOCK_WITH_PRO, UpgradeCard } from "./ui";

const PRICE = formatPrice(PRICING.lifetime.amount);
const noop = () => {};

/** Every anchor into /pro: its href and its visible text. */
function proLinks(html: string): Array<{ href: string; text: string }> {
  return [...html.matchAll(/<a\b[^>]*href="(\/pro[^"]*)"[^>]*>(.*?)<\/a>/g)].map((m) => ({
    href: m[1],
    text: m[2].replace(/<[^>]+>/g, "").replace(/<!-- -->/g, ""),
  }));
}

/**
 * `priced: "link"` means every buy link's own text carries the price;
 * `"none"` is a navigation row whose destination is checked but which prints
 * no price (the path's locked pack rows, components/practice/learn-home.tsx).
 */
const SURFACES: Array<[name: string, el: ReactElement, priced: "link" | "none", links: number | null]> = [
  [
    "LockedPanel",
    <LockedPanel key="p" label="Accuracy by note" gives="Every note you've sung.">
      <p>chart</p>
    </LockedPanel>,
    "link",
    1,
  ],
  ["UpgradeCard", <UpgradeCard key="u" title="Your full report" body="Every note." context="Coach" />, "link", 1],
  ["ProInlineNudge", <ProInlineNudge key="n">Pro charts your range tests over time</ProInlineNudge>, "link", 1],
  [
    "locked pro packs (/warmups routines)",
    <RoutineGrid key="r" progress={DEFAULT_PROGRESS} onStart={noop} error={null} errorRoutineId={null} />,
    "link",
    null,
  ],
  [
    "locked pro packs (/warmups path)",
    <PathSection key="s" progress={DEFAULT_PROGRESS} onSelect={noop} micReady={false} error={null} errorExerciseId={null} />,
    "none",
    null,
  ],
  ["coach plan", <CoachCard key="c" state={DEFAULT_PROGRESS} />, "link", 1],
];

describe("purchase asks on locked surfaces", () => {
  it("reads the price from PRICING", () => {
    expect(PRO_PRICE_ONCE).toBe(`${PRICE} once`);
    expect(UNLOCK_WITH_PRO).toBe(`Unlock with Pro: ${PRICE} once`);
    expect(PRO_BUY_HREF).toBe("/pro#buy");
  });

  it.each(SURFACES)("%s: goes to the buy card, with the price", (_name, el, priced, count) => {
    const links = proLinks(renderToStaticMarkup(el));
    expect(links.length).toBeGreaterThan(0);
    if (count !== null) expect(links).toHaveLength(count);
    for (const link of links) {
      // /pro#restore is the owner's way back in, not a purchase.
      if (link.href === "/pro#restore") continue;
      expect(link.href, link.text).toBe("/pro#buy");
      if (priced === "link") expect(link.text).toContain(`${PRICE} once`);
    }
  });

  it("says what the locked panel is, in words a screen reader gets", () => {
    const html = renderToStaticMarkup(
      <LockedPanel label="Take pitch analysis" gives="The pitch line of each take, and two takes overlaid.">
        <TakeSample />
      </LockedPanel>,
    );
    // The sentence sits outside the aria-hidden preview.
    const hidden = html.slice(html.indexOf('aria-hidden="true"'), html.indexOf("The pitch line of each take"));
    expect(hidden).toContain("Sample takes");
    expect(html).toMatch(/<p[^>]*>The pitch line of each take, and two takes overlaid\.<\/p>/);
    expect(html).toContain(`>${UNLOCK_WITH_PRO}</a>`);
  });

  it("counts the coach's locked steps from the plan itself", () => {
    const html = renderToStaticMarkup(<CoachCard state={DEFAULT_PROGRESS} />).replace(/<!-- -->/g, "");
    // Free shows two steps; every further <li> is a locked one.
    const locked = (html.match(/<li/g) ?? []).length - 2;
    expect(locked).toBeGreaterThan(0);
    expect(html).toContain(locked === 1 ? "1 more step in today&#x27;s plan" : `${locked} more steps in today&#x27;s plan`);
    // Another ask owns the screen: the card leaves its own out.
    expect(proLinks(renderToStaticMarkup(<CoachCard state={DEFAULT_PROGRESS} hideProNudge />))).toEqual([]);
  });
});

describe("the mid-session cap slide", () => {
  // The slide lives in the session shell, which draws nothing outside a
  // browser, so its body is read from the source.
  const source = readFileSync(join(__dirname, "..", "practice", "free-cap.tsx"), "utf8");
  const slide = source.slice(source.indexOf("export function CapSlide"), source.indexOf("export function CappedAgainNote"));

  it("says what Pro adds, once, with one priced buy link", () => {
    expect(slide.replace(/\s+/g, " ")).toContain(
      "Pro has no daily limit, and adds every step of the coach&apos;s plan, the pro warmup packs and both books.",
    );
    expect(slide.match(/href=\{PRO_BUY_HREF\}/g)).toHaveLength(1);
    expect(slide).toContain("{GO_PRO_LABEL}");
    expect(source).toContain('const PRO_BUY_HREF = "/pro#buy";');
  });

  it("claims only what the plan table and the perks list hold", () => {
    expect(PLAN_ROWS.some((r) => r.pro === "No daily limit")).toBe(true);
    const perk = (id: string) => PRO_PERKS.find((p) => p.id === id)!;
    expect(perk("coach").desc).toMatch(/full daily plan: every step/);
    expect(perk("warmups").title).toBe("Pro warmup packs");
    expect(perk("book").desc).toMatch(/The Measured Voice and The Voice Atlas/);
  });
});

describe("gate sources", () => {
  const ROOT = join(__dirname, "..", "..");
  /** File, and how many bare /pro links it may keep (each one explained). */
  const FILES: Array<[file: string, bareAllowed: number]> = [
    ["components/pro/ui.tsx", 0],
    ["components/pro/gate.tsx", 0],
    ["components/warmups/routine-home.tsx", 0],
    ["components/programs/today-card.tsx", 0],
    ["components/practice/free-cap.tsx", 0],
    ["components/progress/coach.tsx", 0],
    ["components/progress/progress-client.tsx", 0],
    ["components/range/result-view.tsx", 0],
    ["components/recorder/recorder-page.tsx", 0],
    ["components/can-you-sing/verdict.tsx", 0],
    ["components/book/reader.tsx", 0],
    ["components/atlas/reader.tsx", 0],
    ["app/book/[slug]/page.tsx", 0],
    ["app/atlas/[slug]/page.tsx", 0],
    ["app/songs/page.tsx", 0],
    ["app/songs/[slug]/page.tsx", 0],
    // The header pill (the page itself, for owners and visitors alike) and
    // the drawer card's owner branch (manage the plan).
    ["components/nav.tsx", 2],
  ];
  const BARE = /["'`]\/pro["'`]/g;

  it.each(FILES)("%s links purchases to /pro#buy, not the top of /pro", (file, bareAllowed) => {
    const source = readFileSync(join(ROOT, file), "utf8");
    expect(source.match(BARE) ?? []).toHaveLength(bareAllowed);
    expect(source).not.toContain("/pro#plans");
  });

  it("sends a free singer's drawer card to the buy card and an owner's to their plan", () => {
    const nav = readFileSync(join(ROOT, "components/nav.tsx"), "utf8");
    expect(nav).toContain('href={proActive ? "/pro" : "/pro#buy"}');
  });

  it("never types the price: every priced gate label is built from PRICING", () => {
    for (const [file] of FILES) {
      const source = readFileSync(join(ROOT, file), "utf8");
      expect(source, file).not.toMatch(/\$\d/);
    }
  });

  it("prices the locked chapter and cap asks", () => {
    const read = (f: string) => readFileSync(join(ROOT, f), "utf8");
    for (const f of ["components/book/reader.tsx", "components/atlas/reader.tsx", "app/book/[slug]/page.tsx", "app/atlas/[slug]/page.tsx"]) {
      expect(read(f), f).toContain("{`Unlock both books: ${formatPrice(PRICING.lifetime.amount)} once`}");
    }
    expect(read("components/practice/free-cap.tsx")).toContain(
      "const GO_PRO_LABEL = `Keep practicing today with Pro: ${formatPrice(PRICING.lifetime.amount)} once`;",
    );
    expect(read("components/can-you-sing/verdict.tsx")).toContain("{`See Pro: ${PRO_PRICE_ONCE}`}");
  });
});
