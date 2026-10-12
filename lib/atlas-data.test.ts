/**
 * Which chapter of The Voice Atlas each singer is filed under.
 *
 * scripts/compile-atlas.mjs files a singer by its batch file's chapter
 * (FILE_GROUPS) unless ASSIGN places it by hand. The lookup once ran the other
 * way round, so every batch exception in ASSIGN was dead and 77 singers sat in
 * the wrong genre: six opera and crossover singers under Jazz, Tom Waits under
 * Metal, the Latin lane under K-pop, and 1950s and 60s soul shouters opening
 * "the streaming era's R&B". These tests hold the compiled book to the
 * editor's placements.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ATLAS, ATLAS_CONTENTS } from "./atlas-data";
import { ASSIGN } from "../scripts/compile-atlas.mjs";

/** singer slug → the chapter slug whose entries hold it */
const chapterOf = new Map(
  ATLAS.flatMap((c) => c.entries.map((e) => [e.slug, c.slug] as const)),
);

/** A chapter's `group:` frontmatter, the key ASSIGN and FILE_GROUPS use. */
const ATLAS_DIR = join(__dirname, "..", "content", "atlas");
const chapterForGroup = new Map(
  readdirSync(ATLAS_DIR)
    .filter((f) => f.endsWith(".md"))
    .flatMap((f) => {
      const group = /\ngroup:\s*"?([a-z-]+)"?\s*\n/.exec(readFileSync(join(ATLAS_DIR, f), "utf8"))?.[1];
      return group ? [[group, f.replace(/^\d+-/, "").replace(/\.md$/, "")] as const] : [];
    }),
);

describe("atlas chapter placement", () => {
  it("files every hand-placed singer in the chapter ASSIGN names", () => {
    const assign = ASSIGN as Record<string, string>;
    expect(Object.keys(assign).length).toBeGreaterThan(100);
    const wrong = Object.entries(assign).flatMap(([slug, group]) => {
      const want = chapterForGroup.get(group);
      const got = chapterOf.get(slug);
      return want && got === want ? [] : [`${slug}: in ${got ?? "no chapter"}, ASSIGN says ${want ?? group}`];
    });
    expect(wrong).toEqual([]);
  });

  it("keeps well-known batch exceptions out of their file's chapter", () => {
    const expected: Record<string, string[]> = {
      "the-soul-men": ["jackie-wilson", "david-ruffin", "wilson-pickett"],
      "folk-and-the-songwriters": ["tom-waits", "sufjan-stevens"],
      "opera-and-classical-crossover": ["birgit-nilsson", "sumi-jo", "samuel-ramey"],
      "latin-voices": ["maluma", "julio-iglesias", "luis-fonsi"],
      "gospel-and-a-cappella": ["tamela-mann", "tim-storms"],
    };
    for (const [chapter, slugs] of Object.entries(expected)) {
      for (const slug of slugs) expect(chapterOf.get(slug), slug).toBe(chapter);
    }
  });

  it("opens Modern R&B in the streaming era, not with the 1960s soul shouters", () => {
    const rnb = ATLAS.find((c) => c.slug === "modern-rnb")!;
    expect(Math.min(...rnb.entries.map((e) => e.activeFrom))).toBeGreaterThanOrEqual(1990);
  });

  it("lists each singer once, and the free contents roster matches the gated entries", () => {
    const all = ATLAS.flatMap((c) => c.entries.map((e) => e.slug));
    expect(new Set(all).size).toBe(all.length);
    for (const c of ATLAS) {
      const roster = ATLAS_CONTENTS.find((x) => x.slug === c.slug)!.singers.map((s) => s.slug);
      expect(roster, c.slug).toEqual(c.entries.map((e) => e.slug));
    }
  });
});
