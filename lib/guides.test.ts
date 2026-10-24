/**
 * Answer-first shape and claim discipline for the tool guides.
 *
 * Each practice room renders one of these under the tool: an H2, a direct
 * answer, then everything else. Answer engines lift that pair, so the H2 is a
 * question a person would ask and the answer resolves it in two or three
 * sentences. The WebPage node is named from `pageName`, so a guide whose H2 is
 * a question must carry a page name or the page would be named after a
 * question.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import * as guides from "./guides";
import { TOOL_GUIDES } from "./guides";
import { GUIDED_PRACTICE_ROOMS } from "./llms-txt";
import { FREE_DAILY_MINUTES } from "./practice-limits";
import { COURSE } from "./voice-lessons";
import { BOOK_CONTENTS } from "./book-data";
import { ToolGuide, guideJsonLd, type GuideContent } from "@/components/guide";
import { DIFFICULTIES, GAME_NAMES } from "@/components/ear/lib";
import { PRO_PACKS } from "@/components/warmups/exercises";

const exported = Object.entries(guides).filter(
  (entry): entry is [string, GuideContent] => entry[0].endsWith("_GUIDE"),
);

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean);
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

describe("TOOL_GUIDES", () => {
  it("lists every exported guide exactly once", () => {
    expect(exported.length).toBeGreaterThan(5);
    expect(new Set(TOOL_GUIDES)).toEqual(new Set(exported.map(([, g]) => g)));
    expect(TOOL_GUIDES).toHaveLength(exported.length);
  });

  it("gives each guide its own route", () => {
    const paths = TOOL_GUIDES.map((g) => g.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe.each(TOOL_GUIDES.map((g) => [g.path, g] as const))("%s guide", (_, guide) => {
  it("asks a question in its H2", () => {
    expect(guide.heading.endsWith("?")).toBe(true);
    expect(guide.heading.split("?")).toHaveLength(2);
  });

  it("names the WebPage after the page, not the question", () => {
    expect(guide.pageName).toBeTruthy();
    expect(guide.pageName).not.toMatch(/\?$/);
    const page = guideJsonLd(guide)["@graph"].find((n) => n["@type"] === "WebPage");
    expect(page?.name).toBe(guide.pageName);
  });

  it("answers first, briefly", () => {
    const answer = sentences(guide.answer);
    expect(answer.length).toBeGreaterThanOrEqual(1);
    expect(answer.length).toBeLessThanOrEqual(3);
    expect(words(answer[0])).toBeLessThanOrEqual(40);
    expect(words(guide.answer)).toBeLessThanOrEqual(70);
  });

  it("phrases every FAQ entry as a question", () => {
    for (const item of guide.faq) expect(item.q.endsWith("?")).toBe(true);
  });

  /**
   * The repo's evidence rules: no superlatives or exclusivity claims, no
   * perceptual thresholds or durations stated as fact without a source, no
   * accuracy promises. Each pattern is a phrase these guides used to contain.
   */
  it("makes no unsourced superlative, threshold or accuracy claim", () => {
    const copy = JSON.stringify(guide);
    for (const banned of [
      /\bthe fastest\b/i,
      /\bthe only reliable\b/i,
      /\bsingle most useful\b/i,
      /\bcheapest injury prevention\b/i,
      /inaudible to most listeners/i,
      /audible to most listeners/i,
      /\bmore accurately\b/i,
      /covers essentially all repertoire/i,
      /several times faster/i,
      /directly produces better/i,
      /what every professional does/i,
      /studies show/i,
      /\bunlimited\b/i,
    ]) {
      expect(copy, String(banned)).not.toMatch(banned);
    }
  });
});

describe("range guide", () => {
  it("keeps range a session measurement and voice type an estimate", () => {
    const copy = JSON.stringify(guides.RANGE_GUIDE);
    expect(guides.RANGE_GUIDE.answer).toMatch(/in that session/);
    expect(guides.RANGE_GUIDE.answer).toMatch(/an estimate of the voice type/);
    expect(copy).toContain("Is my vocal range the same as my voice type?");
  });
});

describe("analyze guide", () => {
  it("states the cycle-dose arithmetic correctly", () => {
    // Cycles = frequency x voiced seconds. A4 = 440 Hz, A2 = 110 Hz.
    const body = guides.ANALYZE_GUIDE.body.join(" ");
    expect(body).toContain(`${(440 * 3600).toLocaleString("en-US")} cycles`);
    expect(body).toContain(`${(110 * 3600).toLocaleString("en-US")}`);
    expect(body).toMatch(/four times/);
  });
});

/**
 * The way back to the tool. A reader who has finished the steps gets a button
 * to the room the guide is about, anchored to the #content wrapper the root
 * layout renders, because a same-URL link would not reliably scroll anywhere.
 * A room that shares the free plan's daily guided-practice allowance says so
 * beside the button.
 */
describe("start button", () => {
  const guided = new Set<string>(GUIDED_PRACTICE_ROOMS.map((room) => room.path));

  it.each(TOOL_GUIDES.map((g) => [g.path, g] as const))("%s starts its own tool", (path, guide) => {
    const target = new URL(guide.start.href, "https://sing.suedeai.ai");
    expect(target.pathname).toBe(path);
    expect(target.hash).toBe("#content");
    expect(guide.start.label.length).toBeGreaterThan(0);
  });

  it.each(TOOL_GUIDES.map((g) => [g.path, g] as const))(
    "%s states the daily limit only where there is one",
    (path, guide) => {
      if (guided.has(path)) {
        expect(guide.start.note).toContain(`${FREE_DAILY_MINUTES} free minutes`);
        expect(guide.start.note).toMatch(/Pro removes the limit/);
        // The capped rooms, named the way llms.txt and the glossary name them.
        const labels = GUIDED_PRACTICE_ROOMS.map((room) => room.label);
        const rooms = `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
        expect(guide.start.note!.toLowerCase()).toContain(rooms);
      } else {
        expect(guide.start.note ?? "").not.toMatch(/minutes/);
      }
    },
  );

  it("renders the button with the guide", () => {
    const html = renderToStaticMarkup(createElement(ToolGuide, { guide: guides.RANGE_GUIDE }));
    expect(html).toContain(`href="${guides.RANGE_GUIDE.start.href}"`);
    expect(html).toContain(guides.RANGE_GUIDE.start.label);
  });
});

/**
 * A related link into the range test lands on the start button (#start, the
 * anchor voice-test.tsx carries) rather than the intro above it, which on a
 * phone leaves the button under the tab bar.
 */
describe("range-test links", () => {
  const rangeLinks = TOOL_GUIDES.flatMap((g) =>
    g.related.filter((link) => link.href.startsWith("/range")).map((link) => [g.path, link.href] as const),
  );

  it("exist", () => {
    expect(rangeLinks.length).toBeGreaterThan(0);
  });

  it.each(rangeLinks)("%s links %s at #start", (_, href) => {
    expect(new URL(href, "https://sing.suedeai.ai").hash).toBe("#start");
  });

  /**
   * The range test reports two ends. It locates no register transition (the
   * passaggio lessons find that by ear, the spectrogram on a slow slide) and
   * the studio's own guide works in the middle first, so a note on a link
   * into it says what it measures and puts any transition on the page that
   * shows it, never on the test.
   */
  const rangeNotes = TOOL_GUIDES.flatMap((g) =>
    g.related.filter((link) => link.href.startsWith("/range")).map((link) => [g.path, link.note] as const),
  );

  it.each(rangeNotes)("%s says the range test measures the two ends: %s", (_, note) => {
    expect(note).not.toMatch(/^(Find|Locate|Show|See|Hear)\b[^.;]*\b(transition|passaggio|register|break)/i);
    if (/transition|passaggio|register|break/i.test(note)) {
      expect(note).toMatch(/^Measure your lowest and highest notes;/);
      expect(note).toMatch(/\bshow up here\b/);
    }
    expect(note).not.toMatch(/\bedges?\b.*\bstrengthen/i);
  });
});

/**
 * What the guides say Pro and the privacy model do, as they behave: studio
 * sessions log no per-note tallies (only scored warmups and songs do), and Pro
 * sync uploads progress records, so only audio is never uploaded.
 */
describe("product claims", () => {
  const all = JSON.stringify(TOOL_GUIDES);

  it("does not say Pro tracks studio notes", () => {
    expect(all).not.toMatch(/Pro keeps per-note accuracy across sessions/);
    expect(guides.STUDIO_GUIDE.advanced.points.join(" ")).toMatch(/scored warmups and songs/);
  });

  /**
   * Pro's "Accuracy by note" chart is one tally over every kept session, one
   * bar per note and no time axis, so it shows which note keeps missing but
   * not whether a note is improving.
   */
  it("sells the per-note chart as a tally, not a trend over time", () => {
    expect(all).not.toMatch(/becomes a trend rather than a hunch/);
    expect(all).not.toMatch(/per-note accuracy (trends?|over time)/i);
  });

  it("scopes the upload claim to audio", () => {
    expect(all).not.toMatch(/nothing is uploaded|nothing uploads/i);
    // Every room logs a session record, and Pro sync uploads it, so "nothing"
    // sent, stored or recorded is false for a Pro singer; audio is the claim.
    expect(all).not.toMatch(/nothing is sent|nothing you sing|nothing is recorded/i);
  });

  /**
   * Each song's personal best and score trend are free (the song summary);
   * Pro's per-note chart pools notes by pitch across sessions, so it shows no
   * phrase's history.
   */
  it("sells songs' Pro extra as the per-note chart, not a history free singers have", () => {
    const songs = guides.SONGS_GUIDE.advanced.points.join(" ");
    expect(songs).not.toMatch(/phrase's history/);
    expect(songs).toMatch(/personal best and a score trend on the free plan/);
    expect(songs).toMatch(/per-note accuracy chart/);
  });

  /**
   * "Is my microphone audio recorded or uploaded?" used to open "No.", which
   * an answer engine lifts as the whole answer, though the recorder and song
   * practice's opt-in take both record. The studio itself records nothing, so
   * the answer leads with that and names both places a take is kept.
   */
  it("answers the studio's record question without a bare No", () => {
    const a = guides.STUDIO_GUIDE.faq.find((f) => /recorded or uploaded/.test(f.q))!.a;
    expect(a).not.toMatch(/^No\b/);
    expect(a).toMatch(/^Not in the studio, and never uploaded\./);
    expect(a).toMatch(/in the recorder or in song practice/);
  });

  it("does not urge a range retest within a few sessions", () => {
    expect(all).not.toMatch(/Retest after several practice sessions/);
    expect(guides.RANGE_GUIDE.beginner.points.join(" ")).toMatch(/few weeks/);
  });
});

/**
 * Every guide hands a reader on to the free course, and every course link is a
 * module page that exists with the three lessons its note promises.
 */
describe("course links", () => {
  const modules = new Map(
    COURSE.flatMap((stage) => stage.modules).flatMap((m) => (m.href ? [[m.href, m] as const] : [])),
  );

  it.each(TOOL_GUIDES.map((g) => [g.path, g] as const))("%s links one free module", (_, guide) => {
    const course = guide.related.filter((link) => link.href.startsWith("/learn/voice/"));
    expect(course).toHaveLength(1);
    const mod = modules.get(course[0].href);
    expect(mod, course[0].href).toBeDefined();
    const words = (text: string) => text.toLowerCase().replace(/[^a-z]+/g, " ").trim();
    expect(words(course[0].label)).toContain(words(mod!.catalog.name));
    const published = mod!.lessons.filter((lesson) => lesson.href).length;
    if (/three short free lessons/.test(course[0].note)) expect(published).toBe(3);
  });
});

/**
 * HowTo markup states only what the visible copy states: a duration where the
 * intro names one, and a microphone only where the procedure needs one.
 */
describe("HowTo markup", () => {
  const howTo = (guide: GuideContent) => {
    const page = guideJsonLd(guide)["@graph"].find((n) => n["@type"] === "WebPage") as {
      mainEntity: Array<Record<string, unknown>>;
    };
    return page.mainEntity.find((n) => n["@type"] === "HowTo")!;
  };

  it("matches the durations the intros give", () => {
    expect(guides.RANGE_GUIDE.howTo?.intro).toMatch(/about two minutes/);
    expect(howTo(guides.RANGE_GUIDE).totalTime).toBe("PT2M");
    expect(guides.WARMUPS_GUIDE.howTo?.intro).toMatch(/about ten minutes/);
    expect(howTo(guides.WARMUPS_GUIDE).totalTime).toBe("PT10M");
    expect(howTo(guides.STUDIO_GUIDE)).not.toHaveProperty("totalTime");
  });

  it("names a microphone only where the procedure needs one", () => {
    expect(howTo(guides.TOOLS_GUIDE)).not.toHaveProperty("supply");
    expect(howTo(guides.RANGE_GUIDE).supply).toEqual([
      { "@type": "HowToSupply", name: "A microphone" },
    ]);
  });
});

/**
 * Voice-science corrections, pinned so the old claims cannot return. Each
 * pattern is a sentence these guides used to contain.
 */
describe("voice-science claims", () => {
  const all = JSON.stringify(TOOL_GUIDES);

  it("does not read a full harmonic stack as good support", () => {
    expect(all).not.toMatch(/breathy or pressed tone shows fewer/);
    expect(all).not.toMatch(/well-supported tone shows many harmonics/);
    const step = guides.ANALYZE_GUIDE.howTo!.steps.find((s) => s.title === "Count how far the stack goes");
    expect(step?.body).toMatch(/pressed/);
    expect(step?.body).toMatch(/not proof of good support/);
  });

  it("does not use a siren as a test for amusia", () => {
    expect(all).not.toMatch(/you are not tone deaf in the clinical sense/);
  });

  /**
   * The finer check the answer offers is a real level of a real game, named as
   * the ear-training room names it, so a renamed game or level fails here
   * rather than leaving the answer pointing at nothing.
   */
  it("points a worried singer at an ear-game level that exists", () => {
    const a = guides.EAR_GUIDE.faq.find((f) => /tone deaf/i.test(f.q))!.a;
    const hard = DIFFICULTIES.find((d) => d.id === "hard")!.label;
    expect(a).toContain(`${GAME_NAMES["higher-lower"]} on ${hard}`);
    expect(a).toMatch(/semitone/);
    expect(a).not.toMatch(/will improve/);
  });

  /** The range test saves its own result; the steps may not ask for a save. */
  it("does not ask for a save the range test makes itself", () => {
    const steps = guides.RANGE_GUIDE.howTo!.steps;
    expect(steps.map((s) => s.title).join(" ")).not.toMatch(/save it/i);
    expect(steps[steps.length - 1].body).toMatch(/fitted to it/);
  });

  it("sends pain, hoarseness and lost range to a doctor, not a teacher", () => {
    for (const guide of TOOL_GUIDES) {
      if (!guide.safety) continue;
      expect(guide.safety.body).toMatch(/doctor who can examine the vocal folds/);
      expect(guide.safety.body).not.toMatch(/voice teacher or a clinician|voice professional or clinician/);
    }
  });

  it("says cycle dose leaves out loudness", () => {
    expect(guides.ANALYZE_GUIDE.body.join(" ")).toMatch(/ignores loudness/);
    expect(all).not.toMatch(/how much work the vocal folds have done/);
  });

  /**
   * The warmup ladder moves a semitone every rep whatever the score, and walks
   * back down; nothing waits for a clean rep. The room's own explainer says so,
   * and the guide under it, its HowTo markup included, may not say otherwise.
   */
  it("does not make the warmup key wait for a cleared pattern", () => {
    expect(all).not.toMatch(/clear a pattern|cleared pattern/);
    const copy = JSON.stringify(guides.WARMUPS_GUIDE);
    expect(copy).toMatch(/semitone every rep, whatever the score/);
    expect(copy).toMatch(/come back down/);
  });

  /** The packs Pro sells are the three technique packs, named as the room names them. */
  it("sells only the Pro warmup packs the room has", () => {
    const point = guides.WARMUPS_GUIDE.advanced.points.find((p) => /^Pro /.test(p))!;
    expect(point).not.toMatch(/\bgenre\b|voice-type/i);
    const count = ["one", "two", "three", "four", "five"][PRO_PACKS.length - 1];
    expect(point).toContain(`${count} technique packs`);
    for (const pack of PRO_PACKS) expect(point.toLowerCase()).toContain(pack.name.toLowerCase());
  });

  /** Ear games keep a score per game and a best per level; nothing per interval or in cents. */
  it("promises no ear-training metric the games do not keep", () => {
    const copy = JSON.stringify(guides.EAR_GUIDE);
    expect(copy).not.toMatch(/per-interval|pitch-matching deviation/);
  });

  /**
   * The advanced section says drilling the whole set equally leaves the weak
   * intervals where they are, so its advice for the missed ones cannot be to
   * replay a level that shuffles the whole set again. The piano in Tools
   * plays any pair on demand, free and without a clock.
   */
  it("drills missed intervals on their own, as the ear guide says to", () => {
    const point = guides.EAR_GUIDE.advanced.points.find((p) => /keep missing/.test(p))!;
    expect(point).not.toMatch(/replay the level/);
    expect(point).toMatch(/piano in Tools/);
    expect(guides.EAR_GUIDE.related.map((r) => r.href)).toContain("/tools");
  });

  /**
   * A score that falls as the ladder climbs can be a limit as easily as a
   * passaggio; only a dip that repeats at the same place reads as a break,
   * which is how the glossary's Passaggio entry puts it.
   */
  it("calls a repeating dip a passaggio, not any drop", () => {
    const copy = JSON.stringify(guides.WARMUPS_GUIDE);
    expect(copy).not.toMatch(/starts dropping/);
    expect(copy).toMatch(/same place every session is usually a passaggio/);
  });

  /**
   * Vocal load counts any voiced frame, speech included, and only while
   * /analyze is the visible tab.
   */
  it("says what vocal load counts and where", () => {
    const copy = JSON.stringify(guides.ANALYZE_GUIDE);
    expect(copy).not.toMatch(/talking between exercises do not/);
    expect(copy).toMatch(/talking near the mic counts/);
    expect(copy).toMatch(/only counts while it is visible/);
  });

  it("describes song keys the way the player sets them", () => {
    const copy = JSON.stringify(guides.SONGS_GUIDE);
    expect(copy).not.toMatch(/transposed automatically|into a key that suits your (?:measured range|voice)/);
    expect(copy).toMatch(/fitted to your measured range/);
    expect(copy).toMatch(/written key/);
    expect(copy).toMatch(/scored in either octave/);
  });

  /**
   * Inhale noise is turbulence at a narrow throat, wherever the breath fills
   * (book ch. 4), and a shoulder-lifting breath is a separate fault.
   */
  it("does not call a noisy inhale a high breath", () => {
    const points = guides.BREATH_GUIDE.beginner.points.join(" ");
    expect(points).not.toMatch(/noisy gasp is a high breath/);
    expect(points).toMatch(/narrow throat/);
  });

  /**
   * The breath room reads only loudness and time; pitch steadiness is seen in
   * the studio's trace, so the guide says which room shows which half.
   */
  it("sends pitch steadiness to the studio and keeps the breath room to loudness", () => {
    expect(guides.BREATH_GUIDE.body.join(" ")).toMatch(/pitch studio's trace shows whether the pitch held/);
    const studio = guides.BREATH_GUIDE.related.find((r) => r.href === "/studio")!;
    expect(studio.note).not.toMatch(/loudness/);
    expect(studio.note).toMatch(/pitch/);
  });

  /** The keyboard on /tools stops at C3, above the bass and baritone bands' floors. */
  it("does not promise the C3 keyboard finds a low voice's floor", () => {
    const a = guides.TOOLS_GUIDE.faq.find((f) => /piano to find my range/.test(f.q))!.a;
    expect(a).not.toMatch(/until you run out at either end/);
    expect(a).toMatch(/C3 to C6/);
  });
});

/**
 * The popular-song hub owns "can I sing this song"; the range and songs
 * guides are where that question comes up, so both link it in the body.
 */
describe("popular-song links", () => {
  it("range and songs guides link the popular-song hub", () => {
    expect(guides.RANGE_GUIDE.related.map((r) => r.href)).toContain("/can-you-sing");
    expect(guides.SONGS_GUIDE.related.map((r) => r.href)).toContain("/can-you-sing");
  });
});

/**
 * The range and studio guides each answer an FAQ ("Why is my range different
 * every time I test?", "Why is the pitch reading jumping around?") in two
 * sentences that a free chapter answers at length, so each links that chapter,
 * and only while it stays free, since the label says so.
 */
describe("free chapter links", () => {
  it("range and studio guides link the free chapter behind their FAQ", () => {
    for (const [guide, slug] of [
      [guides.RANGE_GUIDE, "reading-the-range-test"],
      [guides.STUDIO_GUIDE, "when-numbers-lie"],
    ] as const) {
      const link = guide.related.find((r) => r.href === `/book/${slug}`);
      expect(link, `${guide.path} links /book/${slug}`).toBeTruthy();
      expect(link!.label).toMatch(/\(free chapter\)$/);
      expect(BOOK_CONTENTS.find((c) => c.slug === slug)?.free, slug).toBe(true);
    }
  });
});
