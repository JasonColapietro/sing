/**
 * /pro's showcase: the real charts on a labelled sample for a visitor with
 * no record, on their own record (faded, as /progress gives it to a free
 * singer) once they have one, and nothing sold to an owner.
 */
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
import { BOOKS, PRO_EXERCISES, PRO_PACK_COUNT, PRO_PROGRAM_NAMES } from "@/lib/pro-inventory";
import { TAKE_SAMPLE_LABEL } from "./take-sample";
import { ProClient } from "./pro-client";
import {
  OWN_DATA_LABEL,
  ProShowcase,
  SAMPLE_NOTES_LABEL,
  SAMPLE_RANGE_LABEL,
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

const BUY = <button>buy</button>;
const render = (owned = false) =>
  renderToStaticMarkup(<ProShowcase owned={owned} cta={BUY} />).replace(/<!-- -->/g, "").replaceAll("&#x27;", "'");
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
    expect(render()).toMatch(/<section id="showcase"/);
  });

  it("draws both real charts on the sample, each under a visible sample label", () => {
    for (const hydrated of [false, true]) {
      store.hydrated = hydrated;
      const html = render();
      const notes = frame(html, "Accuracy by note");
      expect(notes).toContain(`>${SAMPLE_NOTES_LABEL}</p>`);
      // The chart component's own output, on the sample voice (C3 to G4).
      expect(notes).toContain("Accuracy for each note you've been scored on, from C3 to G4");
      const range = frame(html, "Range over time");
      expect(range).toContain(`>${SAMPLE_RANGE_LABEL}</p>`);
      expect(range).toContain("Your vocal range across 3 tests");
      expect(html).not.toContain(OWN_DATA_LABEL);
      // A sample is not locked: nothing is faded or hidden from a reader.
      expect(notes).not.toContain("opacity-60");
      expect(range).not.toContain("opacity-60");
    }
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

  it("holds each chart in the same fixed frame as the sample, so the swap moves nothing", () => {
    const FRAME = /grid grid-rows-\[auto_4rem\] overflow-hidden/g;
    expect(render().match(FRAME)).toHaveLength(2);
    store.progress = DEFAULT_PROGRESS as ProgressState;
    expect(render().match(FRAME)).toHaveLength(2);
    // The label's two lines are reserved whichever label it is.
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

  it("counts packs, programs and books from the inventory, and states no price", () => {
    const html = render();
    expect(html).toContain(`>${PRO_EXERCISES}</p>`);
    expect(html).toContain(`>${PRO_PACK_COUNT}</p>`);
    expect(html).toContain(`>${PRO_PROGRAM_NAMES.length}</p>`);
    for (const name of PRO_PROGRAM_NAMES) expect(html).toContain(name);
    expect(html).toMatch(/<a[^>]*href="\/programs"[^>]*>Week 1 of every program is free<\/a>/);
    for (const book of BOOKS) {
      expect(html).toContain(`${book.chapters} chapters, ${book.words.toLocaleString("en-US")} words`);
      expect(html).toContain(`${book.free} chapters free to read now`);
    }
    expect(html).toMatch(/<a href="#unlocks"[^>]*>See every chapter title<\/a>/);
    expect(html).not.toMatch(/\$\d/);
  });
});

describe("the showcase on /pro", () => {
  it("ends on one buy button for a free visitor, and points the hero at what it shows them", () => {
    const html = renderToStaticMarkup(<ProClient />);
    const section = html.slice(html.indexOf('<section id="showcase"'), html.indexOf('<section id="plans"'));
    expect(section.match(/>Get lifetime Pro: \$79 once<\/button>/g)).toHaveLength(1);
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
