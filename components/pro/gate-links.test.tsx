/**
 * One gate grammar: wherever a free singer meets a Pro boundary, the ask goes
 * to the buy card (/pro#buy, never the top of /pro, where the buy button is a
 * scroll away) and says what Pro costs before the tap.
 *
 * Two passes. The rendered pass draws each locked surface as a free singer and
 * reads its anchors: the label a singer is shown, not the line of source that
 * builds it. The source pass only scans the gate files for what must be
 * absent from every one of them (a bare /pro link, a typed price).
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

import { AtlasCta } from "@/components/atlas/cta";
import { AtlasChapterReader } from "@/components/atlas/reader";
import { BookCta } from "@/components/book/cta";
import { ChapterReader } from "@/components/book/reader";
import { CoachCard, lockedStepsLine } from "@/components/progress/coach";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { PLAN_ROWS, PRO_PERKS } from "@/lib/pro";
import { PathSection, RoutineGrid } from "@/components/warmups/routine-home";
import { DEFAULT_PROGRESS } from "@/lib/progress-shape";
import { formatPrice, PRICING } from "@/lib/pro-shared";
import { ProInlineNudge } from "./gate";
import { ProSlotProvider } from "./slot";
import { TakeSample } from "./take-sample";
import {
  GO_PRO,
  LockedPanel,
  PRO_BUY_HREF,
  PRO_PRICE_ONCE,
  UNLOCK_BOTH_BOOKS,
  UNLOCK_PRO_PACKS,
  UNLOCK_PRO_SONGBOOK,
  UNLOCK_WITH_PRO,
  UpgradeCard,
} from "./ui";

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
const lockedBookChapter = BOOK_CONTENTS.find((c) => !c.free)!;
const lockedAtlasChapter = ATLAS_CONTENTS.find((c) => !c.free)!;

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
  // One priced line above the packs; the locked cards are whole-card links
  // whose price is in their accessible name (cap-controls.test.tsx).
  [
    "locked pro packs (/warmups routines)",
    <RoutineGrid key="r" progress={DEFAULT_PROGRESS} onStart={noop} error={null} errorRoutineId={null} />,
    "none",
    null,
  ],
  [
    "locked pro packs (/warmups path)",
    <PathSection key="s" progress={DEFAULT_PROGRESS} onSelect={noop} micReady={false} error={null} errorExerciseId={null} />,
    "none",
    null,
  ],
  ["coach plan", <CoachCard key="c" state={DEFAULT_PROGRESS} />, "link", 1],
  // The chapter readers and the books' front pages, drawn as the prerendered
  // page draws them (was a check that the source held the label's template).
  ["locked chapter (The Measured Voice)", <ChapterReader key="b" chapter={lockedBookChapter} />, "link", null],
  ["locked chapter (The Voice Atlas)", <AtlasChapterReader key="a" chapter={lockedAtlasChapter} />, "link", null],
  ["book front page", <BookCta key="bc" />, "link", 1],
  ["atlas front page", <AtlasCta key="ac" />, "link", 1],
];

describe("purchase asks on locked surfaces", () => {
  it("reads the price from PRICING", () => {
    expect(PRO_PRICE_ONCE).toBe(`${PRICE} once`);
    expect(UNLOCK_WITH_PRO).toBe(`Unlock with Pro: ${PRICE} once`);
    expect(PRO_BUY_HREF).toBe("/pro#buy");
  });

  it("keeps one purchase vocabulary: a gate unlocks a named thing, a nudge says Go Pro", () => {
    expect(UNLOCK_PRO_PACKS).toBe(`Unlock the pro packs: ${PRICE} once`);
    expect(UNLOCK_PRO_SONGBOOK).toBe(`Unlock the Pro songbook: ${PRICE} once`);
    expect(UNLOCK_BOTH_BOOKS).toBe(`Unlock both books: ${PRICE} once`);
    expect(GO_PRO).toBe(`Go Pro: ${PRICE} once`);
    // The buy links only: a locked chapter also carries the owner's way back in (/pro#restore).
    const label = (el: ReactElement) =>
      proLinks(renderToStaticMarkup(el)).filter((l) => l.href === PRO_BUY_HREF).map((l) => l.text);
    expect(label(<ChapterReader chapter={lockedBookChapter} />)).toEqual([UNLOCK_BOTH_BOOKS]);
    expect(label(<AtlasChapterReader chapter={lockedAtlasChapter} />)).toEqual([UNLOCK_BOTH_BOOKS]);
    // Were "See what Pro includes, $79 once": a tour's label with a price on it.
    expect(label(<BookCta />)).toEqual([UNLOCK_BOTH_BOOKS]);
    expect(label(<AtlasCta />)).toEqual([UNLOCK_BOTH_BOOKS]);
    expect(label(<ProInlineNudge>Pro charts your range tests over time</ProInlineNudge>)).toEqual([GO_PRO]);
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

  it("names the coach's locked steps by their numbers, counted from the plan itself", () => {
    const html = renderToStaticMarkup(<CoachCard state={DEFAULT_PROGRESS} />).replace(/<!-- -->/g, "");
    // Free shows two steps; every further <li> is a locked one.
    const locked = (html.match(/<li/g) ?? []).length - 2;
    expect(locked).toBeGreaterThan(0);
    // Was "N more steps in today's plan", which read as steps beyond the ones
    // listed; the line now names the locked rows by the numbers beside them.
    expect(html).toContain(`${lockedStepsLine(3, locked)}.`);
    expect(html).not.toContain("more step");
    // Another ask owns the screen: the card leaves its own out.
    expect(proLinks(renderToStaticMarkup(<CoachCard state={DEFAULT_PROGRESS} hideProNudge />))).toEqual([]);
  });

  it("words the locked steps for one, two and more", () => {
    expect(lockedStepsLine(3, 1)).toBe("Step 3 opens with Pro");
    expect(lockedStepsLine(3, 2)).toBe("Steps 3 and 4 open with Pro");
    expect(lockedStepsLine(3, 3)).toBe("Steps 3 to 5 open with Pro");
  });

  it("keeps the coach's ask a quiet text line where another ask holds the page's slot", () => {
    // /progress: the locked chart panel holds the slot with the one
    // "Unlock with Pro" button. The coach row used to print the same label
    // beside it, outside the slot. Inside a provider it does not hold the
    // slot (as on the page, where the panel outranks it), and it is a
    // sentence and a text link: no chip, no button, not the panel's words.
    const quiet = renderToStaticMarkup(
      <ProSlotProvider>
        <CoachCard state={DEFAULT_PROGRESS} />
      </ProSlotProvider>,
    ).replace(/<!-- -->/g, "");
    const links = proLinks(quiet);
    // Still one upgrade route at the coach's own section.
    expect(links).toEqual([{ href: "/pro#buy", text: GO_PRO }]);
    expect(quiet).not.toContain(UNLOCK_WITH_PRO);
    const at = quiet.indexOf('href="/pro#buy"');
    const ask = quiet.slice(quiet.lastIndexOf("<p", at), quiet.indexOf("</p>", at));
    expect(ask).toContain("open with Pro.");
    expect(ask).not.toContain(">Pro</span>");
    expect(ask).not.toMatch(/bg-violet|rounded-full|rounded-xl/);
    // Holding the slot (no provider: the only ask on its page) it is still a
    // text link, marked with the Pro chip like any inline nudge.
    const holding = renderToStaticMarkup(<CoachCard state={DEFAULT_PROGRESS} />).replace(/<!-- -->/g, "");
    expect(proLinks(holding)).toEqual([{ href: "/pro#buy", text: GO_PRO }]);
    expect(holding).toContain(">Pro</span>");
  });

  it("never lists more of a locked step than its title, which the card already showed", () => {
    const html = renderToStaticMarkup(<CoachCard state={DEFAULT_PROGRESS} />).replace(/<!-- -->/g, "");
    const lockedRows = [...html.matchAll(/<li[^>]*>(.*?)<\/li>/g)].slice(2).map((m) => m[1]);
    expect(lockedRows.length).toBeGreaterThan(0);
    for (const row of lockedRows) {
      expect(row).not.toContain("<a ");
      expect(row).not.toMatch(/\d+ min/);
    }
  });
});

describe("the pages a locked song or chapter is read on", () => {
  const buyLabels = (html: string) =>
    [...new Set(proLinks(html.replace(/<!-- -->/g, "")).filter((l) => l.href === PRO_BUY_HREF).map((l) => l.text))];

  // The songbook's own ask (UNLOCK_PRO_SONGBOOK, app/songs) has nothing to
  // render against while PRO_SONGS is empty; its wording is pinned above.

  it("unlocks both books from a locked chapter's page", async () => {
    const { default: BookChapter } = await import("@/app/book/[slug]/page");
    const { default: AtlasChapter } = await import("@/app/atlas/[slug]/page");
    for (const html of [
      renderToStaticMarkup(await BookChapter({ params: Promise.resolve({ slug: lockedBookChapter.slug }) })),
      renderToStaticMarkup(await AtlasChapter({ params: Promise.resolve({ slug: lockedAtlasChapter.slug }) })),
    ]) {
      expect(buyLabels(html)).toEqual([UNLOCK_BOTH_BOOKS]);
      expect(html).not.toContain('href="/pro"');
    }
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
});
