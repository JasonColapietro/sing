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
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { PROGRAMME_EXIT_TESTS, PROGRAMME_PART, programmePhaseChapters } from "@/lib/programme-exit-tests";
import { FREE_WEEKS, programById } from "@/lib/programs";
import { VOICE_TYPE_PASSAGGIO } from "@/lib/voice-types";
import BookPage from "@/app/book/page";
import ChapterPage, { generateMetadata } from "@/app/book/[slug]/page";
import AtlasChapterPage from "@/app/atlas/[slug]/page";
import { BOOK_PROGRAM_HREF, BOOK_PROGRAM_ID, BOOK_PROGRAM_NAME } from "@/components/book/program-link";

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

/**
 * Every chapter outside the programme ends with a "Try this" that sends the
 * reader to a room, and a Pro reader gets no room button under a gated
 * chapter (only the free chapters carry one), so the link lives in the prose.
 * The programme chapters link their exit-test room and the program instead.
 */
describe("every chapter outside the programme", () => {
  it.each(BOOK.filter((c) => c.part !== PROGRAMME_PART).map((c) => [c.slug, c] as const))(
    "%s links its Try this to a room that exists",
    (_slug, chapter) => {
      const tryThis = chapter.body.split(/^## Try this\s*$/m)[1] ?? "";
      const hrefs = [...tryThis.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        const path = href.split(/[?#]/)[0];
        expect(existsSync(join(APP_DIR, path, "page.tsx")), href).toBe(true);
      }
    },
  );
});

describe("the free chapters", () => {
  it("are the three the book says", () => {
    expect(FREE.map((c) => c.order)).toEqual([1, 8, 12]);
  });

  it.each(FREE.map((c) => c.slug))(
    "%s shows a byline, a room button and the lessons that use it",
    async (slug) => {
      const html = await page(slug);
      expect(html).toContain('rel="author"');
      expect(html).toContain(AUTHOR_NAME);
      expect(html).toContain("Try this now");
      expect(html).toMatch(/href="\/(studio|range\?mode=range#start)"/);
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

  /**
   * The chapter says a cold voice under-reports at both ends, so its buttons
   * offer the Morning reset before the test, in the header and the end card,
   * as the Your Range lessons and /learn's Day 1 do.
   */
  it("offers the warm-up before the range test wherever chapter 8 links the test", async () => {
    const html = await page("reading-the-range-test");
    const warm = '<a[^>]*href="/warmups\\?routine=morning"';
    const test = '<a[^>]*href="/range\\?mode=range#start"[^>]*>Take the range test honestly';
    const pairs = [...html.matchAll(new RegExp(`(${warm})|(${test})`, "g"))].map((m) => (m[1] ? "warm" : "test"));
    expect(pairs).toEqual(["warm", "test", "warm", "test"]);
  });

  it("does not add the free-chapter extras to a gated chapter", async () => {
    const html = await page("registers");
    expect(html).not.toContain("Try this now");
    expect(html).not.toContain('rel="author"');
  });

  it("link one another in the server HTML, before entitlement is known", async () => {
    for (const chapter of FREE) {
      const html = await page(chapter.slug);
      for (const other of FREE.filter((c) => c.slug !== chapter.slug)) {
        expect(html, `${chapter.slug} -> ${other.slug}`).toContain(`href="/book/${other.slug}"`);
      }
    }
  });
});

describe("a locked chapter", () => {
  /** The href of the locked page's "Read a free chapter" button. */
  async function freeChapterButton(slug: string): Promise<string | undefined> {
    const html = await page(slug);
    return /<a [^>]*href="(\/book\/[^"]+)"[^>]*>Read a free chapter<\/a>/.exec(html)?.[1];
  }

  it("offers the next free chapter, not the one the reader just finished", async () => {
    // Chapter 1's Next is chapter 2, which is locked; sending that reader
    // back to chapter 1 was a loop.
    expect(await freeChapterButton("registers")).toBe("/book/reading-the-range-test");
    expect(await freeChapterButton("pitch-accuracy")).toBe("/book/when-numbers-lie");
    // Past the last free chapter there is none ahead, so the first.
    expect(await freeChapterButton("weeks-7-8-top")).toBe("/book/what-your-voice-is");
  });

  it("lists the free lessons that cite it, as a free chapter does", async () => {
    const html = await page("registers");
    expect(html).toContain("Free lessons that use this chapter");
    expect(html).toMatch(/href="\/learn\/voice\/[^"]+\/[^"]+"/);
  });
});

describe("chapter 15's lesson list", () => {
  it("names the Stage 2 lessons it teaches, not the Stage 6 runs", async () => {
    // Weeks 3-4 are onsets, steady tone and sustain, which Land the Note and
    // Hold It teach; nothing in the chapter is about runs or melisma.
    const html = await page("weeks-3-4-middle");
    expect(html).toContain('href="/learn/voice/steady-tone/land-the-note"');
    expect(html).toContain('href="/learn/voice/steady-tone/hold-it"');
    expect(html).not.toContain('href="/learn/voice/agility/');
  });
});

describe("the free chapters' lesson lists", () => {
  it("send chapter 1 to the breath, register and vowel modules its three sections teach", async () => {
    // "The power: breath", "The vibrator: the folds" and "The filter: the
    // tract" are Breathe Low, Chest, Head, Falsetto and Vowels That Work; the
    // room-setup module alone once stood in for all three.
    const html = await page("what-your-voice-is");
    expect(html).toContain('href="/learn/voice/room-check/breathe-low"');
    expect(html).toContain('href="/learn/voice/two-registers/chest-head-falsetto"');
    expect(html).toContain('href="/learn/voice/two-registers/vowels-that-work"');
  });

  it("send chapter 8, whose 'Retesting fairly' is its retest rule, to Higher and Lower", async () => {
    const html = await page("reading-the-range-test");
    expect(html).toContain('href="/learn/voice/signature/higher-and-lower"');
  });
});

describe("a locked atlas chapter", () => {
  async function atlasPage(slug: string): Promise<string> {
    return renderToStaticMarkup(await AtlasChapterPage({ params: Promise.resolve({ slug }) }));
  }

  it.each([
    ["a-vocabulary-for-tone", "/learn/voice/two-registers/fix-the-wobble"],
    ["the-safety-rail", "/learn/voice/through-the-break/mix-not-shout"],
    ["how-to-borrow-a-voice", "/learn/voice/signature/style-rooms"],
  ])("%s lists the free lessons that cite it", async (slug, href) => {
    const html = await atlasPage(slug);
    expect(html).toContain("Free lessons that use this chapter");
    expect(html).toContain(`href="${href}"`);
  });

  it("offers a free chapter other than the one its back link already names", async () => {
    const html = await atlasPage("a-vocabulary-for-tone");
    const sample = /<a [^>]*href="(\/atlas\/[^"]+)"[^>]*>Read a free chapter<\/a>/.exec(html)?.[1];
    // Chapter 4's "←" is chapter 3; the sample was chapter 3 too.
    expect(sample).toBe("/atlas/how-to-read-an-entry");
  });
});

describe("the twelve-week program", () => {
  it("names the in-app program as it is, Pro past a free first week", () => {
    const program = programById(BOOK_PROGRAM_ID);
    expect(program?.name).toBe(BOOK_PROGRAM_NAME);
    expect(program?.pro).toBe(true);
    // The bridge says "first week is free".
    expect(FREE_WEEKS).toBe(1);
    expect(program?.chapters?.map((c) => c.slug)).toEqual(programmePhaseChapters());
  });

  it("links the program from the contents page and from every chapter of its part", async () => {
    // The free week is guided practice, so every bridge into it names the cap.
    const cap = new RegExp(`free plan&#x27;s ${FREE_DAILY_MINUTES} guided minutes`);
    const contents = renderToStaticMarkup(<BookPage />);
    expect(contents).toContain(`href="${BOOK_PROGRAM_HREF}"`);
    expect(contents).toMatch(cap);
    for (const slug of ["how-the-program-works", ...programmePhaseChapters()]) {
      const html = await page(slug);
      expect(html, slug).toContain(`href="${BOOK_PROGRAM_HREF}"`);
      expect(html, slug).toContain("a Suede Pro program");
      expect(html, slug).toMatch(/first\s+week is free/);
      expect(html, slug).toMatch(cap);
    }
  });

  it("names the daily cap where an exit test sends a reader into guided practice", async () => {
    const note = `guided minutes a day; Pro removes the limit`;
    for (const slug of programmePhaseChapters()) {
      const room = PROGRAMME_EXIT_TESTS[slug].room;
      const html = await page(slug);
      // The studio and the range test have no clock; breath and songs do.
      if (room === "studio" || room === "range") expect(html, slug).not.toContain(note);
      else expect(html, `${slug} (${room})`).toContain(note);
    }
    // Both kinds are exercised, so neither branch is vacuous.
    const rooms = programmePhaseChapters().map((s) => PROGRAMME_EXIT_TESTS[s].room);
    expect(rooms).toContain("studio");
    expect(rooms).toContain("breath");
    expect(rooms).toContain("songs");
  });

  it("does not link it from chapters outside the program", async () => {
    expect(await page("registers")).not.toContain(BOOK_PROGRAM_HREF);
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
