/**
 * /pro's showcase: the real charts on a labelled sample for a visitor with
 * no record, on their own record (faded, as /progress gives it to a free
 * singer) once they have one, and nothing sold to an owner.
 */
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProState } from "@/lib/pro";
import type { ProgressState } from "@/lib/progress";

const store = vi.hoisted(() => ({
  pro: null as unknown as ProState,
  progress: null as unknown as ProgressState,
  hydrated: false,
}));

vi.mock("@/lib/pro", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pro")>();
  return { ...actual, useProState: () => store.pro };
});
vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return { ...actual, useProgress: () => store.progress };
});
vi.mock("@/components/prepaint", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/prepaint")>();
  return { ...actual, useHydrated: () => store.hydrated };
});

import { DEFAULT_PROGRESS } from "@/lib/progress-shape";
import { PRO_PERKS } from "@/lib/pro";
import { BOOKS, PRO_PROGRAM_COUNT, PRO_SHOWCASE_ANCHOR } from "@/lib/pro-inventory";
import { SAMPLE_ACCURACY, SAMPLE_RANGE, SAMPLE_WEAK_NOTE } from "@/lib/pro-sample";
import { routineMinutes, stepExercise } from "@/components/warmups/routines";
import ProPage from "@/app/pro/page";
import { PACK_SAMPLE, PackSample } from "./pack-sample";
import { TAKE_SAMPLE_LABEL } from "./take-sample";
import { ProClient } from "./pro-client";
import {
  OWN_DATA_LABEL,
  ProShowcase,
  SAMPLE_NOTES_CAPTION,
  SAMPLE_NOTES_LABEL,
  SAMPLE_NOTES_NAME,
  SAMPLE_RANGE_CAPTION,
  SAMPLE_RANGE_LABEL,
  SAMPLE_RANGE_NAME,
  useOwnVoice,
} from "./pro-showcase";

const FREE: ProState = {
  active: false,
  plan: null,
  status: null,
  subscriptionId: null,
  paymentIntentId: null,
  customerId: null,
  email: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  proKey: null,
  since: null,
  lastVerified: null,
};
const OWNER: ProState = { ...FREE, active: true, plan: "lifetime", status: "active", paymentIntentId: "pi_1" };

/** A record with scored notes (A3 strongest) and two range tests. */
const SUNG: ProgressState = {
  ...DEFAULT_PROGRESS,
  sessions: [
    {
      id: "s1",
      type: "warmup",
      date: "2026-10-01T10:00:00.000Z",
      day: "2026-10-01",
      durationSec: 120,
      score: 80,
      detail: "Five-note scale",
      xp: 20,
      notes: {
        "57": { sec: 20, hitSec: 19, cents: 8, frames: 800 },
        "59": { sec: 20, hitSec: 5, cents: 41, frames: 800 },
      },
    },
  ],
  rangeHistory: [
    { lowMidi: 45, highMidi: 64, testedAt: "2026-08-01T10:00:00.000Z" },
    { lowMidi: 45, highMidi: 65, testedAt: "2026-10-01T10:00:00.000Z" },
  ],
} as ProgressState;

/** The showcase as /pro mounts it: the page reads the visitor's record once and hands it in. */
function Shown({ owned }: { owned: boolean }) {
  const own = useOwnVoice(owned);
  return <ProShowcase owned={owned} own={own} pack={<PackSample />} />;
}
const render = (owned = false) =>
  renderToStaticMarkup(<Shown owned={owned} />).replace(/<!-- -->/g, "").replaceAll("&#x27;", "'").replaceAll("&amp;", "&").replaceAll("&gt;", ">");
/** What assistive tech is given: the markup with every aria-hidden subtree's own words removed. */
function exposed(html: string): string {
  let out = "";
  let rest = html;
  for (;;) {
    const at = rest.indexOf('aria-hidden="true"');
    if (at < 0) return out + rest;
    const open = rest.lastIndexOf("<", at);
    const tag = /^<(\w+)/.exec(rest.slice(open))![1];
    out += rest.slice(0, open);
    // Skip to this element's matching close tag.
    let depth = 0;
    const walk = new RegExp(`<${tag}\\b[^>]*?(/?)>|</${tag}>`, "g");
    walk.lastIndex = open;
    let end = rest.length;
    for (let m = walk.exec(rest); m; m = walk.exec(rest)) {
      if (m[0].startsWith("</")) depth--;
      else if (m[1] !== "/") depth++;
      if (depth === 0) {
        end = walk.lastIndex;
        break;
      }
    }
    rest = rest.slice(end);
  }
}
/** The chart frame under a mono title: from the title to the next frame or row. */
function frame(html: string, title: string): string {
  const start = html.indexOf(`>${title}</h4>`);
  expect(start, title).toBeGreaterThan(-1);
  const next = html.indexOf("<h4", start + 1);
  return html.slice(start, next > -1 ? next : html.indexOf("<h3", start));
}

beforeEach(() => {
  store.pro = FREE;
  store.progress = DEFAULT_PROGRESS as ProgressState;
  store.hydrated = false;
});

describe("the showcase with no record", () => {
  it("is the landing page's /pro#showcase target", () => {
    expect(PRO_SHOWCASE_ANCHOR).toBe("showcase");
    expect(render()).toMatch(/<section id="showcase"/);
  });

  it("draws both real charts on the sample, each under a visible sample label", () => {
    for (const hydrated of [false, true]) {
      store.hydrated = hydrated;
      const html = render();
      const notes = frame(html, "Accuracy by note");
      expect(notes).toContain(`>${SAMPLE_NOTES_LABEL}</p>`);
      // The chart component's own output, on the sample voice. (Its name is
      // asserted as drawn, not as announced: see the next test.)
      expect(notes).toContain(`Accuracy for each note you've been scored on, from ${SAMPLE_RANGE.low} to ${SAMPLE_RANGE.high}`);
      const range = frame(html, "Range over time");
      expect(range).toContain(`>${SAMPLE_RANGE_LABEL}</p>`);
      expect(range).toContain("across 3 tests");
      expect(html).not.toContain(OWN_DATA_LABEL);
      // A sample is not locked: nothing is faded or hidden from a reader.
      expect(notes).not.toContain("opacity-60");
      expect(range).not.toContain("opacity-60");
    }
  });

  it("never announces or captions a sample chart as the visitor's own", () => {
    // Both charts speak to their owner ("each note you've been scored on",
    // "Your vocal range", "since your first test"). On the sample those words
    // reached a screen reader as the page's claim about the visitor.
    const html = render();
    for (const [title, name, caption] of [
      ["Accuracy by note", SAMPLE_NOTES_NAME, SAMPLE_NOTES_CAPTION],
      ["Range over time", SAMPLE_RANGE_NAME, SAMPLE_RANGE_CAPTION],
    ]) {
      const f = frame(html, title);
      const heard = exposed(f);
      expect(heard, title).toContain(`<div role="img" aria-label="${name}">`);
      expect(name, title).toMatch(/^Sample chart/);
      expect(heard, title).toContain(`<p class="mt-2 text-xs text-mut">${caption}</p>`);
      expect(caption, title).toMatch(/^Sample voice/);
      expect(heard, title).not.toMatch(/\byou(r|'ve)?\b(?! own (notes|range) appear)/i);
      // The chart's own caption is still in the markup, hidden from everyone.
      expect(f, title).toContain('<div aria-hidden="true" class="[&>p]:hidden"><svg');
    }
    // The figures are the sample's, the ones the coach report prints.
    expect(SAMPLE_NOTES_CAPTION).toContain(`${SAMPLE_ACCURACY}%`);
    expect(SAMPLE_NOTES_CAPTION).toContain(`Weakest note ${SAMPLE_WEAK_NOTE.label} at ${SAMPLE_WEAK_NOTE.accuracy}%`);
    expect(SAMPLE_RANGE_CAPTION).toContain(`${SAMPLE_RANGE.low}–${SAMPLE_RANGE.high}`);
  });

  it("says nothing about the visitor's own voice in its lede while it shows a sample", () => {
    // "See it on your own voice." used to open the section whatever it drew.
    expect(render()).not.toContain("See it on your own voice");
  });

  it("prints the sample's dates the same for every reader, so the server HTML hydrates", () => {
    const html = render();
    for (const day of ["Jun 1", "Jul 13", "Aug 24"]) expect(html).toContain(`>${day}</text>`);
  });

  it("is the sample in the server HTML even when this browser holds a record", () => {
    store.progress = SUNG;
    const html = render();
    expect(html).toContain(SAMPLE_NOTES_LABEL);
    expect(html).not.toContain(OWN_DATA_LABEL);
  });

  it("labels the take drawing as a sample", () => {
    expect(render()).toContain(`>${TAKE_SAMPLE_LABEL}</figcaption>`);
  });
});

describe("the showcase on a free visitor's own record", () => {
  beforeEach(() => {
    store.progress = SUNG;
    store.hydrated = true;
  });

  it("labels each chart as theirs and drops the sample label", () => {
    const html = render();
    expect(html.match(new RegExp(OWN_DATA_LABEL, "g"))).toHaveLength(2);
    expect(html).not.toContain("Sample data");
    expect(html).not.toMatch(/Sample (chart|voice)/);
    expect(frame(html, "Accuracy by note")).toContain("from A3 to B3");
    expect(frame(html, "Range over time")).toContain("Your vocal range across 2 tests");
  });

  it("never draws it more clearly than /progress does for a free singer", () => {
    // components/pro/ui.tsx LockedPanel: inert, faded, hidden from assistive
    // tech, the caption under a gradient. Each chart here gets all four.
    const html = render();
    for (const title of ["Accuracy by note", "Range over time"]) {
      const f = frame(html, title);
      expect(f, title).toMatch(/<div aria-hidden="true" class="[^"]*pointer-events-none select-none opacity-60/);
      expect(f, title).toContain("bg-gradient-to-t from-panel to-transparent");
      // Nothing of the chart sits outside the hidden, faded wrapper.
      expect(f.slice(0, f.indexOf('aria-hidden="true"')), title).not.toContain("<svg");
    }
  });

  it("keeps the sample for a chart the record cannot fill", () => {
    store.progress = { ...SUNG, rangeHistory: SUNG.rangeHistory.slice(0, 1) };
    const html = render();
    expect(frame(html, "Accuracy by note")).toContain(OWN_DATA_LABEL);
    expect(frame(html, "Range over time")).toContain(SAMPLE_RANGE_LABEL);
  });

  it("fills the frame's two rows the same way on the sample and on a record, so the swap moves nothing", () => {
    // The frame is a two-row grid: the drawing, then a caption row of fixed
    // height. Each state must put exactly one block in each row, with the
    // caption styled alike; a caption left inside the drawing's row would
    // leave the second row empty in one state and full in the other.
    const OWN =
      /grid grid-rows-\[auto_4rem\] overflow-hidden [^"]*"><svg[\s\S]*?<\/svg><p class="mt-2 text-xs text-mut">[\s\S]*?<\/p><\/div>/g;
    const SAMPLE =
      /grid grid-rows-\[auto_4rem\] overflow-hidden "><div role="img"[^>]*><div aria-hidden="true" class="\[&>p\]:hidden"><svg[\s\S]*?<\/svg><p[^>]*>[\s\S]*?<\/p><\/div><\/div><p class="mt-2 text-xs text-mut">[^<]*<\/p><\/div>/g;
    expect(render().match(OWN)).toHaveLength(2);
    expect(render().match(SAMPLE)).toBeNull();
    store.progress = DEFAULT_PROGRESS as ProgressState;
    expect(render().match(SAMPLE)).toHaveLength(2);
    expect(render().match(OWN)).toBeNull();
    // The label above reserves its two lines whichever label it is.
    expect(render().match(/<p class="min-h-12 /g)).toHaveLength(2);
  });
});

describe("the showcase's claims", () => {
  it("heads every perk with its own title and sentence, once", () => {
    const html = render();
    for (const perk of PRO_PERKS) {
      expect(html.match(new RegExp(`<h3[^>]*>${perk.title}</h3>`, "g")), perk.id).toHaveLength(1);
      expect(html, perk.id).toContain(perk.desc);
    }
  });

  it("shows a real pro pack as its card, from the pack's own data", () => {
    // Was three big numerals (exercises, packs, programs) and a sentence
    // listing the programs: figures the perk above and the buy card below
    // already state. The pack and exercise counts are still in the perk's
    // sentence (the test above); the program names are on the buy card.
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
    expect(html).not.toMatch(/class="tabular text-3xl/);
    expect(html.split(`${PACK_SAMPLE.steps.length} exercises`).length - 1).toBeLessThanOrEqual(2);
    expect(html).toContain(`Pro also opens ${PRO_PROGRAM_COUNT} programs in full.`);
    expect(html).toMatch(/<a[^>]*href="\/programs"[^>]*>Week 1 of every program is free<\/a>/);
  });

  it("shows both books as their covers, each with its own figures, and states no price", () => {
    const html = render();
    const books = html.slice(html.indexOf(">Two books, with PDFs</h3>"), html.indexOf(">Adaptive coach plan</h3>"));
    expect(books.match(/class="figure relative flex aspect-\[3\/4\]/g)).toHaveLength(BOOKS.length);
    for (const book of BOOKS) {
      // The cover is hidden from assistive tech, so the figures carry the title.
      expect(books).toContain(
        `<span class="sr-only">${book.title}: </span>${book.chapters} chapters, ${book.words.toLocaleString("en-US")} words`,
      );
      expect(books).toContain(`${book.free} chapters free to read now`);
    }
    expect(html).toMatch(/<a href="#unlocks"[^>]*>See every chapter title<\/a>/);
    expect(html).not.toMatch(/\$\d/);
  });

  it("keeps the perks with nothing to draw to one compact row, with no glyph cards", () => {
    const html = render();
    const row = html.slice(html.indexOf(">Adaptive coach plan</h3>") - 200);
    expect(row.match(/<h3 class="font-extrabold text-ink text-base">/g)).toHaveLength(3);
    expect(row).not.toContain("rounded-2xl");
    expect(html).not.toMatch(/inline-flex h-10 w-10 shrink-0/);
  });

  it("hands /pro the pack card from the server page", () => {
    const page = renderToStaticMarkup(<ProPage />);
    expect(page).toContain(`<h4 class="text-lg">${PACK_SAMPLE.name}</h4>`);
    // The showcase is a client component and must not import the catalogue.
    const src = readFileSync(new URL("./pro-showcase.tsx", import.meta.url), "utf8");
    expect(src).not.toMatch(/from "@\/components\/warmups\//);
    expect(readFileSync(new URL("./pack-sample.tsx", import.meta.url), "utf8")).not.toContain('"use client"');
  });
});

describe("the showcase on /pro", () => {
  it("sells a free visitor nothing itself, and points the hero at what it shows them", () => {
    const html = renderToStaticMarkup(<ProClient />);
    const section = html.slice(html.indexOf('<section id="showcase"'), html.indexOf('<section id="plans"'));
    // It ended on a fourth "Get lifetime Pro" button for one revision: the
    // card is the next thing down and the buy bar follows the visitor to it.
    expect(section).not.toMatch(/<button/);
    expect(section).not.toMatch(/\$\d/);
    // No record in the server HTML, so the link does not promise "your own voice".
    expect(html).toMatch(/<a href="#showcase"[^>]*>See Pro on a sample voice<\/a>/);
    store.progress = SUNG;
    store.hydrated = true;
    expect(renderToStaticMarkup(<ProClient />)).toMatch(/<a href="#showcase"[^>]*>See it on your own voice<\/a>/);
  });

  it("sells an owner nothing, and draws their own charts plainly", () => {
    store.pro = OWNER;
    store.progress = SUNG;
    store.hydrated = true;
    const html = renderToStaticMarkup(<ProClient />).replaceAll("&#x27;", "'");
    const section = html.slice(html.indexOf('<section id="showcase"'), html.indexOf('<section id="plans"'));
    expect(section).not.toMatch(/\$\d/);
    expect(section).not.toMatch(/<button/);
    expect(section).not.toMatch(/Get lifetime|Go Pro|Unlock/);
    expect(section).not.toContain("Faded here");
    expect(section).not.toContain("opacity-60");
    expect(section.match(new RegExp(`${OWN_DATA_LABEL}\\.`, "g"))).toHaveLength(2);
    expect(section).toMatch(/<a[^>]*href="\/progress"[^>]*>Open your coach report<\/a>/);
    // Nor anywhere else on the page: no price button, no jump to the showcase.
    expect(html).not.toContain("Get lifetime Pro");
    expect(html).not.toContain('href="#showcase"');
    expect(html).not.toContain("Before you pay");
  });
});
