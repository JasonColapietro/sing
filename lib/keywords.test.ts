import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  HEAD_TERM_OWNERS,
  MAX_TERMS,
  ROUTE_KEYWORDS,
  chapterKeywords,
  lessonKeywords,
  normalizeKeywords,
  popSongKeywords,
  singerGenreKeywords,
  singerKeywords,
  singerVoiceTypeKeywords,
  songKeywords,
} from "@/lib/keywords";
import { HUB_GENRES, SINGERS, VOICE_KINDS } from "@/lib/singers";
import { ALL_SONGS } from "@/components/songs/data";
import { POP_SONGS } from "@/lib/pop-songs";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { LESSONS } from "@/lib/lesson-data";
import { COURSE } from "@/lib/voice-lessons";

const APP_DIR = join(__dirname, "..", "app");

/** Auth-only routes: Clerk sign-in/up are noindex and carry no search intent. */
const SKIP = [/^sign-in\//, /^sign-up\//];

function pageFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return pageFiles(p);
    return name === "page.tsx" ? [p] : [];
  });
}

describe("meta keywords guard", () => {
  const pages = pageFiles(APP_DIR).filter(
    (p) => !SKIP.some((re) => re.test(relative(APP_DIR, p))),
  );

  it("finds the routed pages", () => {
    expect(pages.length).toBeGreaterThan(30);
  });

  it.each(pages.map((p) => [relative(APP_DIR, p), p]))(
    "%s sets keywords from lib/keywords",
    (_rel, file) => {
      const src = readFileSync(file, "utf8");
      expect(src).toMatch(/from "@\/lib\/keywords"/);
      expect(src).toMatch(/\bkeywords:\s*\w+Keywords\(/);
    },
  );

  it("root layout sets default keywords", () => {
    const src = readFileSync(join(APP_DIR, "layout.tsx"), "utf8");
    expect(src).toMatch(/\bkeywords:\s*routeKeywords\("\/"\)/);
  });
});

/** Every keyword list the site stamps, keyed by route, built from the real data. */
function allPageKeywords(): Record<string, readonly string[]> {
  const out: Record<string, readonly string[]> = { ...ROUTE_KEYWORDS };
  for (const s of SINGERS) out[`/singers/${s.slug}`] = singerKeywords(s);
  for (const g of HUB_GENRES) out[`/singers/genre/${g}`] = singerGenreKeywords(g);
  for (const v of VOICE_KINDS) out[`/singers/voice-type/${v}`] = singerVoiceTypeKeywords(v);
  for (const s of ALL_SONGS) out[`/songs/${s.slug}`] = songKeywords(s);
  for (const s of POP_SONGS) out[`/can-you-sing/${s.slug}`] = popSongKeywords(s);
  for (const c of BOOK_CONTENTS) out[`/book/${c.slug}`] = chapterKeywords(c.title, "book");
  for (const c of ATLAS_CONTENTS) out[`/atlas/${c.slug}`] = chapterKeywords(c.title, "atlas");
  const moduleNames = new Map<string, string>();
  for (const st of COURSE) {
    out[`/learn/voice/${st.slug}`] = lessonKeywords({ name: st.catalog.name });
    for (const m of st.modules) {
      moduleNames.set(`${st.slug}/${m.slug}`, m.catalog.name);
      out[`/learn/voice/${st.slug}/${m.slug}`] = lessonKeywords({
        name: m.catalog.name,
        skill: m.catalog.skill,
      });
    }
  }
  for (const l of LESSONS) {
    out[`/learn/voice/${l.stageSlug}/${l.moduleSlug}/${l.slug}`] = lessonKeywords({
      name: l.title,
      group: moduleNames.get(`${l.stageSlug}/${l.moduleSlug}`),
    });
  }
  return out;
}

describe("keyword map", () => {
  const pages = allPageKeywords();

  it("covers the data-driven pages too", () => {
    expect(Object.keys(pages).length).toBeGreaterThan(500);
  });

  it("every list has 3-10 lowercase, deduped, punctuation-free terms and at most one brand term", () => {
    for (const [route, terms] of Object.entries(pages)) {
      const min = route === "/contact" ? 2 : 3;
      expect(terms.length, route).toBeGreaterThanOrEqual(min);
      expect(terms.length, route).toBeLessThanOrEqual(MAX_TERMS);
      expect(terms.every((t) => t === t.toLowerCase()), route).toBe(true);
      expect(new Set(terms).size, route).toBe(terms.length);
      expect(terms.filter((t) => /[,.:;!?"()]/.test(t)), route).toEqual([]);
      expect(terms.filter((t) => t.includes("suede")).length, route).toBeLessThanOrEqual(1);
    }
  });

  it("static route lists carry exactly one brand term", () => {
    for (const [route, terms] of Object.entries(ROUTE_KEYWORDS)) {
      expect(terms.filter((t) => t.includes("suede")).length, route).toBe(1);
    }
  });

  it("each head term appears only on its owner page, and the owner leads with one", () => {
    for (const [term, owner] of Object.entries(HEAD_TERM_OWNERS)) {
      const carriers = Object.entries(pages)
        .filter(([, terms]) => terms.includes(term))
        .map(([route]) => route);
      expect(carriers, term).toEqual([owner]);
    }
    for (const owner of new Set(Object.values(HEAD_TERM_OWNERS))) {
      expect(HEAD_TERM_OWNERS[pages[owner][0]], owner).toBe(owner);
    }
  });

  it("singer pages carry no song-title terms", () => {
    for (const s of SINGERS) {
      const terms = singerKeywords(s);
      const name = normalizeKeywords([s.name])[0];
      expect(terms.every((t) => t.includes(name) || t.includes("suede")), s.slug).toBe(true);
    }
  });

  it("normalizeKeywords strips punctuation, lowercases, dedupes and caps", () => {
    const out = normalizeKeywords([
      "A b",
      "a  B",
      "Add effects, carefully",
      "Match five, no scoop.",
      null,
      "",
      ...Array.from({ length: 20 }, (_, i) => `t${i}`),
    ]);
    expect(out.slice(0, 3)).toEqual(["a b", "add effects carefully", "match five no scoop"]);
    expect(out.length).toBe(MAX_TERMS);
  });

  it("data-driven helpers keep page terms plus brand", () => {
    const s = singerKeywords({ slug: "adele", name: "Adele", voiceType: "mezzo-soprano" });
    expect(s[0]).toBe("adele vocal range");
    expect(s).toContain("adele songs");
    expect(s.at(-1)).toBe("suede sing");
    expect(lessonKeywords({ name: "Breath Support" })).toContain("breath support");
  });
});
