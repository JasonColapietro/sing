import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  ROUTE_KEYWORDS,
  normalizeKeywords,
  singerKeywords,
  lessonKeywords,
} from "@/lib/keywords";

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

describe("keyword map", () => {
  it("every route list is non-empty, lowercase, deduped and carries the brand", () => {
    for (const [route, terms] of Object.entries(ROUTE_KEYWORDS)) {
      expect(terms.length, route).toBeGreaterThanOrEqual(5);
      expect(terms.every((t) => t === t.toLowerCase()), route).toBe(true);
      expect(new Set(terms).size, route).toBe(terms.length);
      expect(
        terms.some((t) => t.includes("suede")),
        route,
      ).toBe(true);
    }
  });

  it("normalizeKeywords lowercases, dedupes case-insensitively and caps at 12", () => {
    const out = normalizeKeywords(["A b", "a  B", null, "", ...Array.from({ length: 20 }, (_, i) => `t${i}`)]);
    expect(out[0]).toBe("a b");
    expect(out.filter((t) => t === "a b")).toHaveLength(1);
    expect(out.length).toBe(12);
  });

  it("data-driven helpers keep page terms plus brand", () => {
    const s = singerKeywords({ name: "Adele", voiceType: "mezzo-soprano" });
    expect(s).toContain("adele vocal range");
    expect(s).toContain("suede sing");
    expect(lessonKeywords("Breath Support")).toContain("breath support");
  });
});
