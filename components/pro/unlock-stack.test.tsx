import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { PRO_PERKS } from "@/lib/pro";
import { ATLAS_PROFILES_NOTE, BOOKS, PRO_PROGRAM_COUNT } from "@/lib/pro-inventory";
import { routineMinutes, stepExercise } from "@/components/warmups/routines";
import { PACK_SAMPLE, PackSample } from "./pack-sample";

const state = vi.hoisted(() => ({ active: false, ready: true, hydrated: false }));
// The real module with the two hooks replaced: the stack now heads its
// exhibits with PRO_PERKS rows (components/pro/claim.tsx), which a bare
// two-hook mock did not carry.
vi.mock("@/lib/pro", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/pro")>()),
  useProState: () => ({ active: state.active }),
  useIsPro: () => state.active,
  useProReady: () => state.ready,
}));

// The free-only nudges are NotPro (components/pro/gate.tsx), which keys off hydration.
vi.mock("@/components/prepaint", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/prepaint")>()),
  useHydrated: () => state.hydrated,
}));

import { UnlockStack } from "./unlock-stack";

const paid = BOOK_CONTENTS.find((e) => !e.free)!;
const render = () =>
  renderToStaticMarkup(<UnlockStack pack={<PackSample />} />)
    .replace(/<!-- -->/g, "")
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&");

describe("the unlock stack on /pro", () => {
  beforeEach(() => {
    state.active = false;
    state.ready = true;
    state.hydrated = false;
  });

  it("gives an owner their index with no free-or-paid framing: no FREE badge, free-chapter nudge or free week", () => {
    state.active = true;
    state.hydrated = true;
    const html = render();
    expect(html).not.toMatch(/>Free</);
    expect(html).not.toContain("Start with the free chapter");
    expect(html).not.toContain("Week 1 of every program is free");
    // The contents themselves stay: every chapter of both books, the pack, the programs.
    expect(html.match(/href="\/(book|atlas)\/[^"]+"/g)).toHaveLength(BOOK_CONTENTS.length + ATLAS_CONTENTS.length);
    expect(html).toContain(`<h4 class="text-lg">${PACK_SAMPLE.name}</h4>`);
    expect(html).toContain(`Pro also opens ${PRO_PROGRAM_COUNT} programs in full.`);
  });

  it("keeps those nudges in a free visitor's first paint, each behind the pre-paint not-pro marker", () => {
    const html = render();
    const freeBadges = BOOK_CONTENTS.filter((e) => e.free).length + ATLAS_CONTENTS.filter((e) => e.free).length;
    expect(html.match(/<span[^>]*data-prepaint-plan="not-pro"[^>]*>Free<\/span>/g)).toHaveLength(freeBadges);
    expect(html).toMatch(/<p class="mt-6 text-sm text-mut" data-prepaint-plan="not-pro">Start with the free chapter/);
    expect(html).toMatch(/<span data-prepaint-plan="not-pro"> <a[^>]*href="\/programs"[^>]*>Week 1 of every program is free<\/a><\/span>/);
    // After hydration a free visitor's markup is the same words without the markers.
    state.hydrated = true;
    const after = render();
    expect(after.replace(/ data-prepaint-plan="not-pro"/g, "")).toBe(html.replace(/ data-prepaint-plan="not-pro"/g, ""));
  });

  it("sells the locked chapters to a free reader", () => {
    const html = render();
    expect(html).toContain("Everything below opens the second you upgrade");
    expect(html).toContain("with Pro.");
    expect(html).toContain('aria-label="Included with Pro"');
    expect(html).not.toContain(`href="/book/${paid.slug}"`);
  });

  it("opens every chapter to an owner, without calling paid chapters free", () => {
    state.active = true;
    const html = render();
    expect(html).toContain("Everything below is open to you now");
    expect(html).toContain(`All ${BOOK_CONTENTS.length} chapters are open to you`);
    expect(html).toContain(`href="/book/${paid.slug}"`);
    expect(html).not.toContain('aria-label="Included with Pro"');
    const freeLabels = html.match(/>Free</g)?.length ?? 0;
    const freeChapters = html.match(/href="\/(book|atlas)\/[^"]+"/g)?.length ?? 0;
    expect(freeLabels).toBeLessThan(freeChapters);
  });

  it("folds a free reader's locked chapters away, and unfolds them for an owner", () => {
    // Two full tables of contents ran to about two phone screens between the
    // buy card and the comparison table; the free rows stay in view and the
    // locked ones sit behind a details element that names what Pro opens.
    const locked = BOOK_CONTENTS.filter((e) => !e.free).length;
    let html = render();
    expect(html).toContain(`See the ${locked} chapters Pro opens`);
    expect(html.indexOf("<details")).toBeLessThan(html.indexOf('aria-label="Included with Pro"'));
    state.active = true;
    html = render();
    expect(html).not.toContain("<details");
    expect(html).not.toContain("chapters Pro opens");
  });

  it("draws both book covers at the head of their contents", () => {
    const html = render();
    expect(html.match(/aspect-\[3\/4\]/g)).toHaveLength(2);
    expect(html.indexOf("aspect-[3/4]")).toBeLessThan(html.indexOf('href="/book"'));
  });

  it("prerenders the sales version until the entitlement is read", () => {
    state.active = true;
    state.ready = false;
    expect(render()).toContain("Everything below opens the second you upgrade");
  });

  // The next four moved here from pro-showcase.test.tsx with the exhibits
  // they hold: the pack card, the books and the three undrawn perks left the
  // showcase for this section, so each is on the page once.
  it("shows a real pro pack as its card, from the pack's own data", () => {
    const html = render();
    const card = html.slice(html.indexOf(`<h4 class="text-lg">${PACK_SAMPLE.name}</h4>`));
    expect(PACK_SAMPLE.pro).toBe(true);
    expect(card).toContain(PACK_SAMPLE.tagline);
    expect(card).toContain(`${PACK_SAMPLE.steps.length} exercises`);
    expect(card).toContain(`~${routineMinutes(PACK_SAMPLE)} min`);
    const chips = card.slice(card.indexOf("<ol"), card.indexOf("</ol>"));
    const titles = PACK_SAMPLE.steps.map((s) => stepExercise(s).title);
    for (const title of titles.slice(0, 3)) expect(chips).toContain(`${title}</span>`);
    expect(chips).toContain(`+${titles.length - 3} more`);
    expect(chips.match(/<svg/g)).toHaveLength(3);
    // No numeral panel, and each count once.
    expect(html).not.toMatch(/class="tabular text-(3|4)xl/);
    expect(html.split(`${PACK_SAMPLE.steps.length} exercises`).length - 1).toBeLessThanOrEqual(2);
    expect(html).toContain(`Pro also opens ${PRO_PROGRAM_COUNT} programs in full.`);
    expect(html).toMatch(/<a[^>]*href="\/programs"[^>]*>Week 1 of every program is free<\/a>/);
  });

  it("makes each book concrete: its cover with its own figure, its figures, and its free chapters to read now", () => {
    const html = render();
    const books = html.slice(html.indexOf(">Two books, with PDFs</h3>"), html.indexOf(">Pro warmup packs</h3>"));
    expect(books.match(/class="figure relative flex aspect-\[3\/4\]/g)).toHaveLength(BOOKS.length);
    // A drawing on each cover, not a blank tile.
    expect(books.match(/<svg viewBox="0 0 96 36"/g)).toHaveLength(BOOKS.length);
    for (const [book, contents] of [
      [BOOKS[0], BOOK_CONTENTS],
      [BOOKS[1], ATLAS_CONTENTS],
    ] as const) {
      const at = books.indexOf(`>${book.title}</a></h3>`);
      expect(at, book.title).toBeGreaterThan(-1);
      const block = books.slice(at, books.indexOf("</details>", at));
      expect(block).toContain(`${book.chapters} chapters`);
      expect(block).toContain(`${book.words.toLocaleString("en-US")} words`);
      // The titles a visitor can open are the generated data's free chapters,
      // every one of them, each linked to its page, and no other.
      const free = contents.filter((e) => e.free);
      expect(free).toHaveLength(book.free);
      const open = block.slice(0, block.indexOf("<details"));
      for (const entry of free) {
        expect(open, entry.slug).toMatch(
          new RegExp(`<a[^>]*href="${book.href}/${entry.slug}"[^>]*>.*?<span[^>]*>${entry.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</span>`),
        );
      }
      expect(open.match(new RegExp(`href="${book.href}/`, "g"))).toHaveLength(free.length);
      // The locked titles are the data's too, behind the fold.
      const locked = block.slice(block.indexOf("<details"));
      for (const entry of contents.filter((e) => !e.free)) expect(locked, entry.slug).toContain(`>${entry.title}</span>`);
    }
    expect(books).toContain(ATLAS_PROFILES_NOTE);
    expect(html).not.toMatch(/\$\d/);
    expect(html).not.toMatch(/<button/);
  });

  it("states each book total once, in the perk's sentence", () => {
    // Four numeral tiles used to repeat them above the covers.
    const html = render();
    const total = BOOKS.reduce((n, b) => n + b.words, 0).toLocaleString("en-US");
    expect(html.split(total).length - 1).toBe(1);
    for (const book of BOOKS) expect(html.split(book.words.toLocaleString("en-US")).length - 1, book.title).toBe(1);
  });

  it("heads its exhibits with the perks' own words, and keeps the undrawn ones compact, with no glyph cards", () => {
    const html = render();
    for (const id of ["book", "warmups", "coach", "songs", "history"]) {
      const perk = PRO_PERKS.find((p) => p.id === id)!;
      expect(html.match(new RegExp(`<h3[^>]*>${perk.title}</h3>`, "g")), id).toHaveLength(1);
      expect(html, id).toContain(perk.desc);
    }
    const row = html.slice(html.indexOf(">Adaptive coach plan</h3>") - 200);
    expect(row.match(/<h3 class="font-extrabold text-ink text-base">/g)).toHaveLength(3);
    expect(row).not.toContain("rounded-2xl");
    expect(html).not.toMatch(/inline-flex h-10 w-10 shrink-0/);
  });
});
