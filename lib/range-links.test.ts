/**
 * Range-test link guard.
 *
 * A link into the voice test at /range lands on #start, the mode tablist just
 * above the start button (components/range/voice-test.tsx). Without it a phone
 * opens on the headline and intro, and the start button sits under the bottom
 * tab bar. Rounds 2 and 3 of the audit added #start one surface at a time and
 * the next audit still found the footer, the 404 page, every singer hub, the
 * lessons, the book and the More sheet without it. So this reads every source
 * file instead of rendering a sample of pages: a new link without #start fails
 * here, not in an audit. Build links with rangeTestHref() from lib/site.ts.
 *
 * A "link into /range" is any string literal, or markdown link target, that is
 * /range, /range?… or /range#…; and any literal that carries the range test's
 * ?mode=range deep link, which catches a URL assembled from a room path. Bare
 * "/range" is also how the app names the route (sitemap, keyword ownership,
 * room keys a renderer swaps for the real link), so those lines are listed in
 * NOT_LINKS, each with the reason it is not a link that needs #start.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import NotFound from "@/app/not-found";
import { rangeTestHref } from "@/lib/site";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCANNED = ["app", "components", "lib", "content"];
const SOURCE = /\.(?:tsx?|mts|m?js|mdx?|json)$/;
const TEST = /\.test\.[cm]?[jt]sx?$/;

interface Exception {
  file: string;
  /** Matched against the whole source line the literal sits on. */
  line: RegExp;
  why: string;
}

/** The only lines that may name /range without landing on #start. */
const NOT_LINKS: Exception[] = [
  {
    file: "app/sitemap.ts",
    line: /^\s*"\/range",$/,
    why: "A sitemap lists canonical page URLs; a fragment is not part of a page's address.",
  },
  {
    file: "app/range/page.tsx",
    line: /routeKeywords\("\/range"\)|<RoomRailBand current="\/range" \/>/,
    why: "The test page naming its own route for its keywords and to leave itself out of the room rail.",
  },
  {
    file: "components/nav.tsx",
    line: /^\s*href: "\/range",$|\{ href: "\/range", target: rangeTestHref\(/,
    why: "The Sing tab's and the More sheet's route key, which isActiveLink matches on; each entry's `target`, built by rangeTestHref(), is where a tap goes (components/nav.test.tsx).",
  },
  {
    file: "components/discover/room-rail.tsx",
    line: /\{ href: "\/range", label: "Range test"|href=\{href === "\/range" \? rangeTestHref\(\) : href\}/,
    why: "The room's key, used to leave the current room out of the rail; the rail renders it as rangeTestHref().",
  },
  {
    file: "lib/glossary.ts",
    line: /^\s*href: "\/range",$|^\s*"\/range": "the range test",$/,
    why: "A term's room key and its name in a sentence; app/glossary/page.tsx links the key as rangeTestHref() (lib/glossary-publishing.test.tsx checks the rendered hrefs).",
  },
  {
    file: "app/glossary/page.tsx",
    line: /href=\{entry\.href === "\/range" \? RANGE_TEST_HREF : entry\.href\}/,
    why: "The comparison that swaps the glossary's /range room key for the #start link.",
  },
  {
    file: "lib/guides.ts",
    line: /^\s*path: "\/range",$/,
    why: "The route the range guide belongs to: its canonical URL and JSON-LD, not a link.",
  },
  {
    file: "lib/guides.ts",
    line: /start: \{ label: "Start the range test", href: "\/range\?mode=range#content" \}/,
    why: "The guide's own start button, which renders on /range itself. Most readers arrive on #start, where a link to the same URL would not scroll at all, so every guide's button goes to #content (pinned in lib/guides.test.ts, 'start button').",
  },
  {
    file: "lib/lesson-practice.ts",
    line: /^\s*range: "\/range",$/,
    why: "The contract's room path, restated (pinned to contracts/suede-vocal.json); companionHref links the range room as rangeTestHref().",
  },
  {
    file: "lib/query-ownership.ts",
    line: /^\s*href: "\/range",$/,
    why: "The page's identity in the query-ownership register; lib/query-ownership.test.tsx checks the /voice page's own link to the test.",
  },
  {
    file: "lib/keywords.ts",
    line: /^\s*"[a-z ]+": "\/range",$|^\s*"\/range": \[$/,
    why: "Keyword ownership: which route a query belongs to, not a link.",
  },
];

interface Hit {
  file: string;
  line: number;
  text: string;
  value: string;
}

/**
 * Lines that are only comments carry no links, and prose there may quote a
 * path ("bare /range opens at the top"). Blanked rather than removed, so line
 * numbers still point at the source.
 */
function withoutCommentLines(source: string): string {
  return source
    .split("\n")
    .map((line) => (/^\s*(?:\/\/|\/\*|\*|\{\/\*)/.test(line) ? "" : line))
    .join("\n");
}

/** A path into /range: the route alone, or with a query or fragment. */
const PATH = String.raw`\/range(?:[?#][^QUOTE\n]*)?`;
const RANGE_LITERAL = new RegExp(
  [
    `"(${PATH.replace("QUOTE", '"')})"`,
    `'(${PATH.replace("QUOTE", "'")})'`,
    "`(" + PATH.replace("QUOTE", "`") + ")`",
    // Markdown, in content/ and in the compiled lib/*-data.ts that embed it.
    String.raw`\]\((?:https:\/\/sing\.suedeai\.ai)?(\/range(?:[?#][^)\s]*)?)\)`,
  ].join("|"),
  "g",
);
/**
 * Any URL that deep-links the range test, however its path was built: the
 * unbroken run after a quote or a markdown "(" that carries ?mode=range.
 */
const MODE_LINK = /["'`(]([^"'`()\s]*[?&]mode=range\b[^"'`()\s]*)/g;

function rangeLinks(file: string, raw: string): Hit[] {
  const source = /\.mdx?$/.test(file) ? raw : withoutCommentLines(raw);
  const lines = source.split("\n");
  const hits = new Map<string, Hit>();
  for (const re of [RANGE_LITERAL, MODE_LINK]) {
    for (const m of source.matchAll(re)) {
      const value = m.slice(1).find((g) => g !== undefined) ?? m[0];
      const line = source.slice(0, m.index).split("\n").length;
      // "/range?mode=range…" matches both patterns; count it once.
      hits.set(`${line}|${value}`, { file, line, text: lines[line - 1], value });
    }
  }
  return [...hits.values()];
}

function sourceFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return SOURCE.test(entry.name) && !TEST.test(entry.name) ? [path] : [];
  });
}

const FILES = SCANNED.flatMap(sourceFiles);
const HITS = FILES.flatMap((file) => rangeLinks(file, readFileSync(join(ROOT, file), "utf8")));

function exceptionFor(hit: Hit): Exception | undefined {
  return NOT_LINKS.find((e) => e.file === hit.file && e.line.test(hit.text));
}

describe("links into the range test land on #start", () => {
  it("scans the sources the links live in", () => {
    // Non-vacuous: the scan reaches TSX, data modules and markdown alike.
    const files = new Set(HITS.map((h) => h.file));
    for (const file of [
      "app/voice/page.tsx",
      "lib/glossary.ts",
      "content/book/08-reading-the-range-test.md",
      "lib/book-data.ts",
    ]) {
      expect(files, file).toContain(file);
    }
  });

  it("finds no link into /range without #start outside the listed exceptions", () => {
    const offenders = HITS.filter((h) => !h.value.endsWith("#start") && !exceptionFor(h)).map(
      (h) => `${h.file}:${h.line}  ${h.value}`,
    );
    expect(offenders, "use rangeTestHref() from lib/site.ts, or a literal ending in #start").toEqual([]);
  });

  it("lists only exceptions that still match a line", () => {
    const stale = NOT_LINKS.filter((e) => !HITS.some((h) => h.file === e.file && e.line.test(h.text)));
    expect(stale.map((e) => `${e.file} ${e.line}`)).toEqual([]);
  });

  it("gives every exception a reason", () => {
    for (const e of NOT_LINKS) expect(e.why.length, e.file).toBeGreaterThan(20);
  });
});

/**
 * Two entry points the source scan cannot see rendered: the installed app's
 * shortcut, which named the range test but opened the pitch meter, and the
 * 404 page's primary button.
 */
describe("entry points outside the page body", () => {
  it("opens the range test from the installed app's range shortcut", () => {
    const shortcut = manifest().shortcuts?.find((s) => s.name === "Vocal range test");
    expect(shortcut?.url).toBe(rangeTestHref());
    expect(new URL(shortcut!.url, "https://sing.suedeai.ai").searchParams.get("mode")).toBe("range");
  });

  it("sends a dead link's visitor to the range test's start button", () => {
    const html = renderToStaticMarkup(createElement(NotFound));
    expect(html).toContain(`href="${rangeTestHref()}"`);
    expect(html).not.toMatch(/href="\/range(\?[^"#]*)?"/);
  });
});

describe("the scanner", () => {
  const scan = (file: string, source: string) => rangeLinks(file, source).map((h) => h.value);

  it("catches each way a link has been written without #start", () => {
    const source = [
      '<LinkButton href="/range">Test</LinkButton>',
      '{ href: "/range?mode=range", label: "Range" }',
      "href={`/range?compare=${s.slug}`}",
      "return `${path}?mode=range`;",
      "const a = '/range#top';",
    ].join("\n");
    expect(scan("x.tsx", source)).toEqual(
      expect.arrayContaining(["/range", "/range?mode=range", "/range?compare=${s.slug}", "${path}?mode=range", "/range#top"]),
    );
    expect(scan("x.md", "Take the [range test](/range?mode=range) now.")).toEqual(["/range?mode=range"]);
    expect(scan("x.md", "[test](https://sing.suedeai.ai/range)")).toEqual(["/range"]);
  });

  it("ignores comment lines, other routes and absolute URLs in prose", () => {
    const source = [
      "// bare \"/range\" opens at the top",
      " * e.g. \"/range\".",
      'const other = "/ranges";',
      'const canonical = `${SITE_URL}/range`;',
      'const songs = "/songs?range=low";',
    ].join("\n");
    expect(scan("x.ts", source)).toEqual([]);
  });

  it("accepts what rangeTestHref builds", () => {
    for (const href of [rangeTestHref(), rangeTestHref({ compare: "adele" }), rangeTestHref({ check: "espresso" })]) {
      expect(scan("x.ts", `const a = "${href}";`)).toEqual([href]);
      expect(href.endsWith("#start")).toBe(true);
    }
  });
});
