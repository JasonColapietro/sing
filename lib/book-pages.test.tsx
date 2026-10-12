/**
 * The book's free chapters are its only indexable pages, so they have to lead
 * somewhere: each "Try this" names a room, and the reader should be one tap
 * from it. These checks hold the renderer, the chapter text and the page
 * together, plus a few facts the prose once got wrong against the app.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { AUTHOR_NAME } from "@/lib/author";
import { BOOK, BOOK_CONTENTS, BOOK_TITLE } from "@/lib/book-data";
import { Markdown } from "@/lib/markdown";
import { PLAN_ROWS } from "@/lib/pro";
import { VOICE_TYPE_PASSAGGIO } from "@/lib/voice-types";
import BookPage from "@/app/book/page";
import ChapterPage, { generateMetadata } from "@/app/book/[slug]/page";

const APP_DIR = join(__dirname, "..", "app");
const FREE = BOOK.filter((c) => c.free);

function md(source: string): string {
  return renderToStaticMarkup(<Markdown source={source} />);
}

async function page(slug: string): Promise<string> {
  return renderToStaticMarkup(await ChapterPage({ params: Promise.resolve({ slug }) }));
}

function titleOf(meta: Awaited<ReturnType<typeof generateMetadata>>): string {
  return typeof meta.title === "string" ? meta.title : "";
}

describe("markdown links", () => {
  it("renders a site-relative link as an anchor", () => {
    const html = md("Open the [pitch studio](/studio) and **hold** it.");
    expect(html).toMatch(/<a [^>]*href="\/studio"[^>]*>pitch studio<\/a>/);
    expect(html).toContain("<strong");
    expect(html).not.toContain("](");
  });

  it("keeps a query string on the path", () => {
    expect(md("Take the [range test](/range?mode=range).")).toContain('href="/range?mode=range"');
  });

  it("leaves off-site and protocol-relative links as text", () => {
    for (const src of ["[x](https://example.com)", "[x](//example.com)"]) {
      const html = md(src);
      expect(html, src).not.toContain("<a ");
      expect(html, src).toContain(src);
    }
  });
});

describe("the free chapters", () => {
  it("are the three the book says", () => {
    expect(FREE.map((c) => c.order)).toEqual([1, 8, 12]);
  });

  it.each(FREE.map((c) => [c.slug, c] as const))(
    "%s links its Try this to a room that exists",
    (_slug, chapter) => {
      const tryThis = chapter.body.split(/^## Try this\s*$/m)[1] ?? "";
      const hrefs = [...tryThis.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        const path = href.split("?")[0];
        expect(existsSync(join(APP_DIR, path, "page.tsx")), href).toBe(true);
      }
    },
  );

  it.each(FREE.map((c) => c.slug))(
    "%s shows a byline, a room button and the lessons that use it",
    async (slug) => {
      const html = await page(slug);
      expect(html).toContain('rel="author"');
      expect(html).toContain(AUTHOR_NAME);
      expect(html).toContain("Try this now");
      expect(html).toMatch(/href="\/(studio|range\?mode=range)"/);
      expect(html).toContain("Free lessons that use this chapter");
      expect(html).toMatch(/href="\/learn\/voice\/[^"]+\/[^"]+"/);
      // Markdown link syntax never reaches the page raw.
      expect(html).not.toMatch(/\]\(\//);
    },
  );

  it("says what the free plan caps when it sends a reader to the warmups", async () => {
    const html = await page("reading-the-range-test");
    expect(html).toContain('href="/warmups"');
    expect(html).toMatch(/minutes a day/);
  });

  it("does not add the free-chapter extras to a gated chapter", async () => {
    const html = await page("registers");
    expect(html).not.toContain("Try this now");
    expect(html).not.toContain('rel="author"');
  });
});

describe("chapter titles", () => {
  it("uses the search wording in the title tag and keeps the chapter title as the H1", async () => {
    const chapter = BOOK_CONTENTS.find((c) => c.slug === "when-numbers-lie")!;
    expect(chapter.searchTitle).toBeTruthy();
    const meta = await generateMetadata({ params: Promise.resolve({ slug: chapter.slug }) });
    expect(titleOf(meta).startsWith(chapter.searchTitle)).toBe(true);
    expect((meta.keywords as string[])[0]).toBe(chapter.searchTitle.toLowerCase());

    const html = await page(chapter.slug);
    expect(html).toMatch(new RegExp(`<h1[^>]*>${chapter.title}</h1>`));
    expect(html).toContain(`"name":"${chapter.title}"`);
  });

  it("leaves a chapter without search wording on its own title and the book's name", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "reading-the-range-test" }) });
    expect(titleOf(meta)).toBe(`Reading your range test · ${BOOK_TITLE}`);
  });
});

describe("the contents page", () => {
  it("states no page count it cannot back, and sells no subscription", () => {
    const html = renderToStaticMarkup(<BookPage />);
    expect(html).not.toContain("numberOfPages");
    expect(html).not.toMatch(/subscription/i);
  });

  it("offers the free chapter in the header, once, above the stats card", () => {
    const html = renderToStaticMarkup(<BookPage />);
    const cta = html.indexOf("Read a free chapter");
    expect(cta).toBeGreaterThan(html.indexOf("</h1>"));
    // The first card opens with the chapter count; the button now precedes it.
    expect(cta).toBeLessThan(html.indexOf(">Chapters<"));
    expect(html.split("Read a free chapter").length - 1).toBe(1);
  });

  it("sends pain, lasting hoarseness and blood to a doctor who can examine the folds", () => {
    const html = renderToStaticMarkup(<BookPage />);
    expect(html).toContain("a doctor who can examine the vocal folds, such as an ENT or laryngologist");
    expect(html).not.toMatch(/doctor or a\s+speech-language pathologist/);
  });
});

/**
 * Facts the chapters once stated against the app or against each other. Each
 * is pinned to the source of truth rather than to a sentence, so a rewrite is
 * free to change the wording.
 */
describe("the chapters agree with the app", () => {
  const body = (slug: string) => BOOK.find((c) => c.slug === slug)?.body ?? "";
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const label = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;

  it("chapter 10 quotes chapter 3's tenor and soprano zones", () => {
    for (const kind of ["Tenor", "Soprano"] as const) {
      const zone = VOICE_TYPE_PASSAGGIO[kind];
      expect(body("finding-your-break"), kind).toMatch(
        new RegExp(`${kind.toLowerCase()}'s [^.]*?around ${label(zone.low)} to ${label(zone.high)}`),
      );
    }
  });

  it("never blames automatic gain, which the app switches off", () => {
    for (const c of BOOK) {
      expect(c.body, c.slug).not.toMatch(/with automatic gain|automatic gain rides/i);
    }
  });

  it("never says Songs transposes into a comfortable range on its own", () => {
    for (const c of BOOK) {
      expect(c.body, c.slug).not.toMatch(/auto-?transpos/i);
    }
  });

  it("says how many Coach steps the free plan shows, as the Coach card does", () => {
    // The card's own cap: `isPro ? items.length : Math.min(N, items.length)`.
    const coach = readFileSync(join(__dirname, "..", "components", "progress", "coach.tsx"), "utf8");
    const cap = Number(/isPro \? items\.length : Math\.min\((\d+), items\.length\)/.exec(coach)?.[1]);
    expect(cap).toBeGreaterThan(0);
    const words = ["", "first step", "first two steps", "first three steps"];
    expect(body("how-the-program-works")).toContain(`you see the ${words[cap]} of the plan`);
  });

  it("puts the week-one comparison take where the program does, at the start of week twelve", () => {
    expect(body("how-the-program-works")).not.toMatch(/in week eleven you will record/i);
    expect(body("how-the-program-works")).toMatch(/start of week twelve you will record/i);
    // The baseline and the "why" sentence are read at the same retest.
    expect(body("how-the-program-works")).not.toMatch(/week eleven (depends|that sentence)|in week eleven that sentence/i);
  });

  it("sends the final review back to the chapter that asks for the sentence about why", () => {
    const asks = BOOK.find((c) => /\*\*A sentence about why\.\*\*/.test(c.body));
    expect(asks).toBeTruthy();
    expect(body("weeks-11-12-songs")).toMatch(
      new RegExp(`sentence you wrote[^.]*chapter ${asks!.order}\\b[^.]*about why`),
    );
  });

  /**
   * The range test saves the moment the singer finishes it (setVocalRange in
   * finish()), and that saved range fits the warmups and songs. There is no
   * discard. A chapter that tells the reader to "not save" or "discard" a
   * finished test asks for a button that does not exist.
   */
  it("never asks the reader to discard a finished range test, which the app saves", () => {
    const rangeTest = readFileSync(join(__dirname, "..", "components", "range", "range-test.tsx"), "utf8");
    // The body of finish(), up to its closing brace at component indent, so an
    // inner block (an if, an object literal) does not cut the search short.
    const start = rangeTest.indexOf("const finish = () => {");
    expect(start).toBeGreaterThan(-1);
    expect(rangeTest.slice(start, rangeTest.indexOf("\n  };", start))).toContain("setVocalRange(");
    for (const c of BOOK) {
      expect(c.body, c.slug).not.toMatch(/do not save the range test|discard it and test another day|do not log the result/i);
    }
  });

  it("does not send a free reader to a range history the free plan does not show", () => {
    const row = PLAN_ROWS.find((r) => r.label === "Range history");
    expect(row?.free).toBe("Latest test");
    for (const c of FREE) {
      expect(c.body, c.slug).not.toMatch(/range history in Progress|\]\(\/progress\)/);
    }
  });

  it("claims only that audio stays on the device, since Pro sync uploads scores", () => {
    for (const c of BOOK) {
      expect(c.body, c.slug).not.toMatch(/nothing is uploaded/i);
    }
    expect(body("when-numbers-lie")).toMatch(/No audio is uploaded/);
  });

  it("points a speaker user at the Speakers setting instead of an unloggable session", () => {
    const setup = readFileSync(join(__dirname, "..", "components", "audio", "audio-setup.tsx"), "utf8");
    expect(setup).toContain('title="Speakers"');
    expect(setup).toContain("I&rsquo;m listening through");
    expect(body("when-numbers-lie")).toMatch(/choose Speakers under "I'm listening through"/);
    // The chapter names the pitch studio as the place to find the control.
    const studio = readFileSync(join(__dirname, "..", "components", "studio", "studio-client.tsx"), "utf8");
    expect(body("when-numbers-lie")).toMatch(/in the pitch studio, open Audio setup/);
    expect(studio).toContain("<AudioSetup");
  });

  it("rounds open vowels through the transition, and opens them at a high voice's top", () => {
    expect(body("resonance")).not.toMatch(/round a little at the very top/);
    expect(body("resonance")).toMatch(/round a little through the transition/);
  });

  it("names the earlier shift out of chest that a woman's quiet slide finds", () => {
    expect(body("the-passaggio")).toMatch(/earlier, lighter shift, somewhere around E4 to G4/);
    expect(body("finding-your-break")).toMatch(/earlier, lighter shift out of chest voice[^.]*E4 to G4/);
  });
});
