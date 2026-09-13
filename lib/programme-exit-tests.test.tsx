/**
 * Holds the programme's exit tests to what this app can actually measure, and
 * checks that a singer can read them.
 *
 * Two failures are worth guarding separately. The first is an exit test that
 * rests on something no Suede surface measures — the exact defect the
 * suede-vocal contract was built to catch in GuitarHub's lesson claims, which it
 * would be absurd to reintroduce here in the other direction. So every
 * measurement named is looked up in the contract and has to be reported
 * `measurable: "yes"`, and every room named has to be a room the contract
 * publishes, at the path the contract publishes for it.
 *
 * The second is a phase chapter with no exit test at all, which is the state the
 * whole programme was in: twelve weeks of instruction whose only completion
 * signal was the calendar running out. Deriving the phase list from the book's
 * own contents means a new fortnight cannot be added without a condition.
 *
 * The render half follows `internal-linking.test.tsx`: the markup is read back
 * from the server pass, because the exit test has to reach a reader of a gated
 * chapter too, and "it is in the data" is not that.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { buildContract } from "@/contracts/suede-vocal";
import { BOOK_CONTENTS } from "@/lib/book-data";
import {
  PROGRAMME_EXIT_TESTS,
  PROGRAMME_PART,
  exitTestFor,
  programmePhaseChapters,
} from "@/lib/programme-exit-tests";
import ChapterPage from "@/app/book/[slug]/page";

const contract = buildContract();

describe("the programme's exit tests", () => {
  it("covers every practice phase of the twelve weeks", () => {
    const phases = programmePhaseChapters();
    expect(phases.length).toBeGreaterThan(0);
    expect(Object.keys(PROGRAMME_EXIT_TESTS).sort()).toEqual([...phases].sort());

    // The explanatory chapter asks nothing of the voice and must stay absent,
    // or the list below becomes "every chapter in the part" and the derivation
    // stops meaning anything.
    expect(exitTestFor("how-the-program-works")).toBeUndefined();
    expect(
      BOOK_CONTENTS.some(
        (c) => c.part === PROGRAMME_PART && c.slug === "how-the-program-works",
      ),
    ).toBe(true);
  });

  it("names only a chapter the book actually has", () => {
    const slugs = new Set(BOOK_CONTENTS.map((c) => c.slug));
    for (const [slug, exit] of Object.entries(PROGRAMME_EXIT_TESTS)) {
      expect(slugs.has(slug), `no chapter ${slug}`).toBe(true);
      expect(exit.chapter).toBe(slug);
    }
  });

  /**
   * The load-bearing one. An exit test a singer cannot settle is worse than no
   * exit test, because it reads like a standard and behaves like a mood.
   */
  it("rests only on a measurement this app implements", () => {
    const measurements = contract.measurement as unknown as Record<
      string,
      { measurable: string }
    >;
    for (const [slug, exit] of Object.entries(PROGRAMME_EXIT_TESTS)) {
      const row = measurements[exit.measurement];
      expect(row, `${slug} rests on unknown measurement ${exit.measurement}`).toBeTruthy();
      expect(
        row.measurable,
        `${slug} rests on ${exit.measurement}, which this app reports as "${row.measurable}"`,
      ).toBe("yes");
    }
  });

  it("sends a singer to a room that exists, at the path the contract publishes", () => {
    const rooms = contract.deepLinks.rooms as Record<string, { path: string }>;
    for (const [slug, exit] of Object.entries(PROGRAMME_EXIT_TESTS)) {
      const room = rooms[exit.room];
      expect(room, `${slug} names unknown room ${exit.room}`).toBeTruthy();
      expect(exit.roomPath, `${slug} links ${exit.room} at a stale path`).toBe(room.path);
      expect(exit.roomLabel.length, `${slug} has no room name for a reader`).toBeGreaterThan(3);
    }
  });

  /**
   * Each one has to state its own limit. The guitar track's stages do, and an
   * exit test without one quietly becomes the proof of something wider than it
   * measured — which is how "held a note for twenty seconds" turns into "has
   * breath support".
   */
  it("states what passing does not prove, and names a blocker", () => {
    for (const [slug, exit] of Object.entries(PROGRAMME_EXIT_TESTS)) {
      expect(exit.test.length, `${slug} has no condition`).toBeGreaterThan(40);
      expect(exit.blocker.length, `${slug} names no blocker`).toBeGreaterThan(40);
      expect(exit.doesNotProve.length, `${slug} states no limit`).toBeGreaterThan(40);
    }
  });
});

describe("a reader can see the exit test", () => {
  /** React escapes `&`, `<`, `>` and quotes in text nodes; the prose has apostrophes. */
  function escaped(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  async function render(slug: string): Promise<string> {
    return renderToStaticMarkup(
      await ChapterPage({ params: Promise.resolve({ slug }) }),
    );
  }

  it("prints the condition and the room on a gated phase chapter", async () => {
    const exit = exitTestFor("weeks-5-6-passaggio");
    expect(exit).toBeTruthy();
    // The fortnight chapters are all behind Pro. The condition is not, and the
    // regression that would break that is someone moving this block inside the
    // `full ?` branch, which renders only for a free chapter.
    expect(BOOK_CONTENTS.find((c) => c.slug === "weeks-5-6-passaggio")?.free).toBe(false);

    const html = await render("weeks-5-6-passaggio");
    expect(html).toContain("Move on when");
    expect(html).toContain(escaped(exit!.test));
    expect(html).toContain(escaped(exit!.blocker));
    expect(html).toContain(escaped(exit!.doesNotProve));
    expect(html).toContain(`href="${exit!.roomPath}"`);
  });

  it("prints nothing extra on a chapter that sets no condition", async () => {
    const html = await render("how-the-program-works");
    expect(html).not.toContain("Move on when");
  });
});
