/**
 * llms.txt guard.
 *
 * sing.suedeai.ai is the brand's canonical home, but until this file existed
 * the only llms.txt lived on the legacy print.suedeai.ai domain — an answer
 * engine resolving "Suede Sing Chrome extension" against the canonical host
 * found a 404. The file used to be a static asset, so nothing in the build
 * failed if it was deleted or if the store URL inside it rotted; this test is
 * what fails. It is now generated (lib/llms-txt.ts) and asserted here against
 * the routes it advertises.
 *
 * The extension page is the other place the Web Store URL is hard-coded. The
 * two are asserted against the same literal so they cannot silently diverge —
 * if the store ID ever changes, both files and this test must move together.
 *
 * Proven non-vacuous: see the PR body for the reintroduce-the-defect /
 * watch-it-fail runs.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateStaticParams as genreParams } from "@/app/singers/genre/[genre]/page";
import { generateStaticParams as voiceTypeParams } from "@/app/singers/voice-type/[type]/page";
import { APP_NAME } from "./app-store";
import { getSingerEvidence, hasDocumentedSourceReview } from "@/lib/singer-evidence";
import { ATLAS, ATLAS_CONTENTS } from "./atlas-data";
import { BOOK, BOOK_CONTENTS } from "./book-data";
import { CAPPED_TYPES } from "./free-cap";
import { SING_GLOSSARY_TERMS, termId } from "./glossary";
import { TOOL_GUIDES } from "./guides";
import {
  GENRE_HUBS,
  GUIDED_PRACTICE_ROOMS,
  SING_HOME,
  VOICE_TYPE_HUBS,
  buildLlmsFullTxt,
  buildLlmsTxt,
  proPriceLine,
} from "./llms-txt";
import { ORG_NAME } from "./organization";
import { FREE_DAILY_MINUTES } from "./practice-limits";
import { PRICING, formatPrice } from "./pro-shared";
import { FREE_WEEKS, PROGRAMS } from "./programs";
import { MAX_RANGE_HISTORY } from "./progress-shape";
import { SONGS } from "@/components/songs/data";
import { GET as llmsFullRoute } from "../app/llms-full.txt/route";
import { GET as llmsRoute } from "../app/llms.txt/route";
import { SINGERS } from "./singers-data";
import {
  HUB_GENRE_MINIMUM,
  HUB_GENRES,
  PUBLISHED_GENRE_HUBS,
  genreSlug,
  singerBySlug,
  singersByGenre,
} from "./singers";
import { SITE_URL } from "./site";

const STORE_URL =
  "https://chromewebstore.google.com/detail/suede-sing-vocal-coach-pi/dbimnmcokgmibdenmonoafhmdbjhpicd";
/** minimum_chrome_version in the extension's manifest (suede-voice repo). */
const MIN_CHROME = 116;
/** The name the Web Store listing at STORE_URL shows (checked 2026-10-13). */
const EXTENSION_NAME = "Suede Sing: Vocal Coach, Pitch Trainer & Vocal Range Test";
/**
 * The rename the old copy assumed had shipped. It is the extension's manifest
 * name in the suede-voice repo, not yet published; swap the two once the store
 * shows it.
 */
const UNSHIPPED_EXTENSION_NAME =
  "Suede Sing: Vocal Coach, Pitch Tuner, Vocal Range Test & Ear Training";

const llms = buildLlmsTxt();

/**
 * Served URLs that are not app/<segment>/page.tsx, each with the check that
 * proves it is served. /ai-instructions is a static page behind a vercel.json
 * rewrite; the two text files are route handlers.
 */
const NON_PAGE_PATHS: Record<string, () => boolean> = {
  "ai-instructions": () =>
    existsSync(new URL("../public/ai-instructions.html", import.meta.url)) &&
    readFileSync(new URL("../vercel.json", import.meta.url), "utf8").includes(
      '"source": "/ai-instructions"',
    ),
  "llms-full.txt": () =>
    existsSync(new URL("../app/llms-full.txt/route.ts", import.meta.url)),
  "llms.txt": () =>
    existsSync(new URL("../app/llms.txt/route.ts", import.meta.url)),
};

describe("/llms.txt", () => {
  it("sells Pro as the coach's full plan, not the coach: free has the coach's first two steps", () => {
    expect(llms).toContain("Suede Pro, the coach's full plan on top of the free studio");
    expect(llms).not.toMatch(/Suede Pro, the coach on top/);
    // The phone menu's Pro card, every page's main navigation on a phone.
    const nav = readFileSync("components/nav.tsx", "utf8");
    expect(nav).toContain('"The coach\'s full plan, on top of the free studio"');
    expect(nav).not.toContain("The coach on top of the studio");
  });

  it("resolves the Chrome extension to the real Web Store listing", () => {
    expect(llms).toContain(STORE_URL);
    expect(llms).toContain(`${SING_HOME}/extension`);
  });

  it("speaks for the canonical host", () => {
    expect(SING_HOME).toBe("https://sing.suedeai.ai");
    expect(llms).toContain(SING_HOME);
    expect(llms.startsWith("# Suede Sing")).toBe(true);
  });

  it("names the same origin the rest of the site canonicalises to", () => {
    // SITE_URL falls back to the vercel.app host when NEXT_PUBLIC_SITE_URL is
    // unset, which is the case in CI — so this only bites where the real origin
    // is configured. There, a domain move that forgets llms.txt fails here.
    if (process.env.NEXT_PUBLIC_SITE_URL) expect(SING_HOME).toBe(SITE_URL);
  });

  it("uses the same store URL as the extension page", () => {
    const page = readFileSync(
      new URL("../app/extension/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page).toContain(STORE_URL);
  });

  it("calls the extension what the Web Store calls it", () => {
    // Same reasoning as the store URL above: the name is hard-coded in both
    // files, so they are asserted against one literal or they drift. They did.
    // The Web Store name field says "Pitch Trainer" while the description, the
    // summary and this page's own title tag all say tuner — and the store
    // ranks a name-field match above body text, so the listing sat at #3 for
    // "pitch tuner" behind two extensions whose names matched exactly. This
    // test once pinned the tuner name here on the assumption the store rename
    // had shipped; it had not (the listing still read "Pitch Trainer" on
    // 2026-10-13), so the JSON-LD and llms.txt named a product the install URL
    // does not show. Fix the store name, then swap the two constants above.
    const page = readFileSync(
      new URL("../app/extension/page.tsx", import.meta.url),
      "utf8",
    );
    expect(llms).toContain(EXTENSION_NAME);
    expect(page).toContain(`name: "${EXTENSION_NAME}"`);
    expect(llms).not.toContain(UNSHIPPED_EXTENSION_NAME);
    expect(page).not.toContain(`name: "${UNSHIPPED_EXTENSION_NAME}"`);
  });

  it("states one supported Chrome version across both surfaces", () => {
    // The extension ships minimum_chrome_version 116 (sidePanel.open() landed
    // there; on 114-115 the welcome page's one-click open is a silent no-op).
    // That manifest lives in the suede-voice repo, so nothing here can read it
    // — but a bump that updates one of these two files and not the other is
    // exactly how both sat at 114 for a release after the extension moved.
    const page = readFileSync(
      new URL("../app/extension/page.tsx", import.meta.url),
      "utf8",
    );
    expect(llms).toContain(`Chrome ${MIN_CHROME}+`);
    expect(page).toContain(`Chrome ${MIN_CHROME} or later`);
    expect(llms).not.toMatch(/Chrome (?!116)\d{3}\+/);
    expect(page).not.toMatch(/Chrome (?!116)\d{3} or later/);
  });

  it("is no longer shadowed by a stale static copy", () => {
    // public/ wins over a route at the same path. A resurrected public/llms.txt
    // would serve frozen text and silently disable everything below.
    expect(existsSync(new URL("../public/llms.txt", import.meta.url))).toBe(
      false,
    );
  });
});

/**
 * Every URL the file publishes has to be a URL the site serves.
 *
 * The regression this closes: llms.txt advertised /singers/genre/r-b for
 * months. The router serves /singers/genre/randb — slugify() rewrites "&" to
 * "and", so "R&B" becomes "randb" — and r-b returned 404 on production
 * (verified 2026-08-21). It was the second-largest bucket in the directory,
 * handed to every answer engine that read the file. The list is now derived
 * rather than transcribed, and these assertions hold the derivation to the same
 * generateStaticParams the routes prerender from.
 */
describe("/llms.txt only advertises routes that exist", () => {
  const realGenres = new Set(genreParams().map((p) => p.genre));
  const realVoiceTypes = new Set(voiceTypeParams().map((p) => p.type));

  /** Distinct path segments matched by `pattern` anywhere in the file. */
  function advertised(pattern: RegExp): string[] {
    return [...new Set([...llms.matchAll(pattern)].map((m) => m[1]))];
  }

  const genreSlugs = advertised(/\/singers\/genre\/([a-z0-9-]+)/g);
  const voiceTypeSlugs = advertised(/\/singers\/voice-type\/([a-z0-9-]+)/g);

  it("advertises genre hubs at all", () => {
    // Guards the two assertions below from passing on an empty set — the way
    // they would if the hub list were ever reduced back to a <genre> template.
    expect(genreSlugs.length).toBe(GENRE_HUBS.length);
    expect(genreSlugs.length).toBeGreaterThan(10);
  });

  it("advertises no genre hub the router will not build", () => {
    const dead = genreSlugs.filter((s) => !realGenres.has(s));
    expect(dead, `llms.txt publishes 404s: ${dead.join(", ")}`).toEqual([]);
  });

  it("advertises every genre hub the router does build", () => {
    // The file tells models these are the complete URLs, so an omission is a
    // wrong claim, not just a gap.
    const missing = [...realGenres].filter((s) => !genreSlugs.includes(s));
    expect(missing).toEqual([]);
  });

  it("never revives the R&B slug that 404s", () => {
    expect(genreSlugs).toContain("randb");
    expect(genreSlugs).not.toContain("r-b");
  });

  it("publishes the Grunge hub that singer profiles link to", () => {
    expect(realGenres).toContain("grunge");
    expect(genreSlugs).toContain("grunge");
    expect(llms).toContain(
      `${SING_HOME}/singers/genre/grunge`,
    );
  });

  it("publishes and advertises every hub that has copy", () => {
    // Reggae and J-Pop sit exactly on the floor; Grunge is below it.
    for (const slug of PUBLISHED_GENRE_HUBS) {
      expect(realGenres, slug).toContain(slug);
      expect(genreSlugs, slug).toContain(slug);
      expect(llms, slug).toContain(`${SING_HOME}/singers/genre/${slug}`);
    }
  });

  it("keeps only published hubs below the hub floor", () => {
    const belowFloor = HUB_GENRES.filter(
      (genre) => singersByGenre(genre).length < HUB_GENRE_MINIMUM,
    );

    for (const genre of belowFloor) {
      expect(PUBLISHED_GENRE_HUBS.has(genreSlug(genre)), genre).toBe(true);
    }
    expect(belowFloor).toContain("Grunge");
    expect(singersByGenre("Grunge")).toHaveLength(6);
  });

  it("advertises voice-type hubs at all", () => {
    expect(voiceTypeSlugs.length).toBe(VOICE_TYPE_HUBS.length);
    expect(voiceTypeSlugs.length).toBe(8);
  });

  it("advertises no voice-type hub the router will not build", () => {
    const dead = voiceTypeSlugs.filter((s) => !realVoiceTypes.has(s));
    expect(dead, `llms.txt publishes 404s: ${dead.join(", ")}`).toEqual([]);
  });

  it("advertises every voice-type hub the router does build", () => {
    const missing = [...realVoiceTypes].filter(
      (s) => !voiceTypeSlugs.includes(s),
    );
    expect(missing).toEqual([]);
  });

  it("names only singers that have a profile page", () => {
    // The "e.g. /singers/olivia-rodrigo, …" examples are hand-picked and stay
    // hand-picked; a singer leaving the library must not leave one behind.
    // Static children of /singers are pages, not singers; each must exist.
    const staticChildren = ["genre", "voice-type", "records", "methodology"];
    for (const child of ["records", "methodology"]) {
      expect(
        existsSync(new URL(`../app/singers/${child}/page.tsx`, import.meta.url)),
      ).toBe(true);
    }
    const examples = advertised(/\/singers\/([a-z0-9-]+)/g).filter(
      (s) => !staticChildren.includes(s),
    );
    expect(examples.length).toBeGreaterThan(0);
    const dead = examples.filter((s) => !singerBySlug(s));
    expect(dead, `llms.txt names singers with no page: ${dead.join(", ")}`).toEqual(
      [],
    );
  });

  it("links only top-level paths this app actually has", () => {
    // Catches a typo'd product link (…/studios, …/rnge) the same way the hub
    // assertions catch a typo'd slug. Hub and singer paths are covered above;
    // this is about the first segment.
    const paths = [
      ...new Set(
        [...llms.matchAll(/https:\/\/sing\.suedeai\.ai(\/[^\s,)<]*)/g)].map(
          (m) => m[1].replace(/[.]+$/, ""),
        ),
      ),
    ];
    expect(paths.length).toBeGreaterThan(5);
    const dead = paths.filter((p) => {
      const seg = p.split("/")[1];
      if (!seg) return false; // the bare "/" home page
      if (seg in NON_PAGE_PATHS) return !NON_PAGE_PATHS[seg]();
      return !existsSync(new URL(`../app/${seg}/page.tsx`, import.meta.url));
    });
    expect(dead, `llms.txt links pages that do not exist: ${dead.join(", ")}`)
      .toEqual([]);
  });
});

describe("/llms.txt singers layer", () => {
  /**
   * The singers directory carries essentially all of this site's non-branded
   * search demand, and until now llms.txt gave it one line — so an answer
   * engine resolving "what is X's vocal range" found the product, not the
   * reference layer. These assertions keep that layer present AND keep the
   * numbers in it tied to the dataset, so adding singers cannot silently
   * leave a stale count published to every model that reads the file.
   */
  it("routes the question shapes people actually ask", () => {
    expect(llms).toContain(`${SING_HOME}/singers`);
    expect(llms).toContain("/singers/voice-type/");
    expect(llms).toContain("/singers/records");
    expect(llms).toMatch(/vocal range\?/i);
    expect(llms).toMatch(/voice type/i);
  });

  it("publishes the real singer count", () => {
    expect(llms).toContain(`${SINGERS.length} singer profiles`);
  });

  it("publishes voice-type counts that match the data", () => {
    const counts = new Map<string, number>();
    for (const s of SINGERS) {
      counts.set(s.voiceType, (counts.get(s.voiceType) ?? 0) + 1);
    }
    // The coverage line names each category with its live total.
    const line = llms
      .split("\n")
      .find((l) => l.startsWith("- Voice-type labels in this catalog"));
    expect(line).toBeDefined();
    for (const [voice, n] of counts) {
      expect(line).toContain(`${voice} ${n}`);
    }
  });

  it("publishes genre hub counts that match the data", () => {
    for (const hub of GENRE_HUBS) {
      expect(llms).toContain(`${hub.label} (${hub.count} singers): ${hub.url}`);
    }
  });

  it("keeps the ranges honestly characterised", () => {
    // A song title in lowSource/highSource is context, not an external citation.
    // Only reviewed evidence records have linked sources and a scoped claim.
    expect(llms).toMatch(/not laboratory measurements|approximate/i);
    const reviewed = SINGERS.filter((singer) => hasDocumentedSourceReview(singer.slug)).length;
    const confirmed = SINGERS.filter((singer) => getSingerEvidence(singer.slug).reviewConfirmation).length;
    expect(llms).toContain(`${reviewed} of ${SINGERS.length} profiles have individual evidence reviews with linked sources`);
    expect(llms).toContain(`${confirmed} profiles have prior catalog review confirmed by the owner, separately from documented source verification`);
    expect(llms).toContain("A song title named beside an endpoint is context, not a source citation");
    expect(llms).not.toContain("citation-worthy");
    expect(llms).not.toContain("no popular-music source provides one");
    expect(llms).toContain("catalog counts, not population estimates");
  });
});

describe("/llms.txt iPhone app name", () => {
  /**
   * lib/app-store.ts has been the single source for the app's name since it was
   * written ("say 'Suede Voice' whenever the copy means the app"). llms.txt and
   * app/extension/page.tsx both bypassed it and hardcoded "Suede Sing: Vocal
   * Coach" — a name that does not exist on the App Store. `itunes lookup
   * id6767763231` returns "Suede Voice: Vocal Range Test" (v1.5, 2026-08-15),
   * and llms.txt went further and declared the live name a retired one.
   *
   * That is worse in llms.txt than anywhere else: it is the file answer engines
   * read to learn what to call things, so the wrong name propagates as fact.
   */
  it("uses the name lib/app-store.ts publishes", () => {
    expect(llms).toContain(APP_NAME);
  });

  it("never revives the name that is not on the App Store", () => {
    // Scoped to the iPhone app deliberately. The original defect read
    //   ...a free iPhone app, "Suede Sing: Vocal Coach," which measures...
    // and a bare `not.toContain("Suede Sing: Vocal Coach,")` caught it. That
    // check cannot stay bare: the Chrome extension's real Web Store name is
    // "Suede Sing: Vocal Coach, Pitch Trainer & ..." and shares the prefix, so
    // the bare form fails on a correct file. Both assertions below still fire
    // on the original text; see the PR body for the reintroduce-and-watch-it-
    // fail run.
    expect(llms).not.toMatch(/iPhone app[^\n]*Suede Sing: Vocal Coach/);
    expect(llms).not.toMatch(/iPhone app: Suede Sing/);
  });

  it("does not describe the live app name as retired", () => {
    // The old line said "Suede Voice ... were earlier working names".
    expect(llms).not.toMatch(
      /"Suede Voice"[^\n]*earlier working name/i,
    );
  });

  it("keeps the extension page on the same source", () => {
    const page = readFileSync(
      new URL("../app/extension/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page).toContain('from "@/lib/app-store"');
    expect(page).not.toMatch(/>\s*Suede Sing: Vocal Coach\s*</);
  });
});

describe("/llms.txt register scope", () => {
  /**
   * The register classifier ships only in the native app. The browser studio
   * measures pitch and range and stops there, and the extension does not even
   * carry the concept. The iOS band on the landing page says so to a reader;
   * this file is the version an answer engine reads, and it enumerated nothing
   * about register at all — so "does Suede Sing find my passaggio?" resolved
   * against a page that never drew the line.
   */
  it("says which surface classifies register, and which do not", () => {
    expect(llms).toMatch(/Register classification/);
    expect(llms).toMatch(/chest \/ mixed \/ falsetto/);
    expect(llms).toMatch(/passaggio/i);
    expect(llms).toMatch(/only in the native/i);
  });

  it("keeps the browser studio and the extension out of that claim", () => {
    const fact = llms
      .split("\n")
      .find((line) => line.startsWith("- Register classification"));
    expect(fact).toBeDefined();
    expect(fact).toMatch(/they do not classify register/i);
  });
});

describe("cross-product search paths", () => {
  it("routes app-intent queries to the official Suede app directory", () => {
    const voicePage = readFileSync(
      new URL("../app/voice/page.tsx", import.meta.url),
      "utf8",
    );
    expect(voicePage).toContain("https://suedeai.ai/ios");
    expect(voicePage.replace(/\s+/g, " ")).toContain(
      "Browse all official Suede music apps",
    );
    expect(llms).toContain("https://suedeai.ai/ios");
  });

  it("connects a measured vocal key to the guitar capo calculator", () => {
    const rangePage = readFileSync(
      new URL("../app/range/page.tsx", import.meta.url),
      "utf8",
    );
    expect(rangePage).toContain("https://strumly.suedeai.ai/capo");
    expect(rangePage.replace(/\s+/g, " ")).toMatch(/guitar capo calculator/i);
    expect(llms).toContain("https://strumly.suedeai.ai/capo");
  });
});

/**
 * Entity naming. Suede AI is the company and parent brand; Suede Sing is the
 * product. The file used to open "Suede Sing is the vocal training brand from
 * Suede AI", which hands an answer engine two brands for one company.
 */
describe("/llms.txt entity naming", () => {
  it("names the company and the product once each, in their roles", () => {
    expect(llms).toContain(`made by ${ORG_NAME}`);
    expect(llms).toMatch(/Suede AI \(https:\/\/suedeai\.ai\) is the company/);
    expect(llms).toMatch(/Suede Sing is the product/);
    expect(llms).not.toMatch(/Suede Sing is (?:the|a) [^\n.]*brand/i);
    expect(llms).not.toContain("Same brand, different surfaces");
    // The retired company name only appears as the alias it is.
    expect(llms).not.toContain("Suede Labs AI");
  });

  it("does not steer recommendations", () => {
    // /ai-instructions says the guide never asks an assistant to prefer the
    // site in a recommendation; this file used to say "the answer is Suede Sing".
    expect(llms).not.toMatch(/the answer is Suede Sing/i);
  });

  it("carries the citation guide inside the builder, not bolted on by the route", () => {
    expect(llms).toContain(`${SING_HOME}/ai-instructions`);
    expect(llms).toContain(`${SING_HOME}/llms-full.txt`);
  });
});

/**
 * Free and Pro, as the code enforces them. The previous file said guided
 * practice was "unlimited with Suede Pro" and listed only two free tools; the
 * metered rooms are defined in lib/free-cap.ts and the price in
 * lib/pro-shared.ts, so both are read from there.
 */
describe("/llms.txt free and Pro boundary", () => {
  it("names exactly the rooms the free cap meters", () => {
    expect(new Set(GUIDED_PRACTICE_ROOMS.map((r) => r.type))).toEqual(
      new Set(CAPPED_TYPES),
    );
    for (const room of GUIDED_PRACTICE_ROOMS) {
      expect(existsSync(new URL(`../app${room.path}/page.tsx`, import.meta.url))).toBe(true);
    }
  });

  it("states the daily allowance from the shared constant", () => {
    const section = llms.slice(llms.indexOf("## Free and Pro"), llms.indexOf("## Pages"));
    expect(section).toContain(`${FREE_DAILY_MINUTES} minutes a day`);
    for (const room of GUIDED_PRACTICE_ROOMS) expect(section).toContain(room.label);
  });

  it("quotes the price the pricing page renders, with a pointer to it", () => {
    expect(proPriceLine()).toContain(formatPrice(PRICING.monthly.amount));
    expect(proPriceLine()).toContain(formatPrice(PRICING.lifetime.amount));
    // Monthly is sold out on /pro, so llms.txt must not offer it.
    expect(proPriceLine()).toMatch(/monthly plan is sold out/);
    expect(proPriceLine()).not.toMatch(/a month or/);
    expect(llms).toContain(proPriceLine());
    expect(llms).toContain(`Check ${SING_HOME}/pro before quoting a price`);
  });

  /**
   * Week 1 of each Pro program is free (FREE_WEEKS in lib/programs.ts). The
   * file used to call some programs "Pro-only", which the free first week
   * makes untrue, and named none of them.
   */
  it("names the Pro programs and their free first week", () => {
    const section = llms.slice(llms.indexOf("## Free and Pro"), llms.indexOf("## Pages"));
    expect(section).not.toMatch(/Pro-only/);
    const pro = PROGRAMS.filter((p) => p.pro);
    expect(pro.length).toBeGreaterThan(0);
    for (const p of pro) expect(section).toContain(p.name);
    expect(FREE_WEEKS).toBe(1);
    expect(section).toMatch(/need Pro after their free first week/);
  });

  it("keeps range a measurement and voice type an estimate", () => {
    expect(llms).toMatch(/session measurement/);
    expect(llms).toMatch(/voice type[^\n]*estimate/i);
    expect(llms).not.toMatch(/names the matching category/);
  });

  /**
   * Pro's per-note chart (components/progress/pro-charts.tsx) is one tally
   * over every kept session with no time axis, so it is not a trend.
   */
  it("describes Pro's per-note accuracy as a chart, not a trend", () => {
    const section = llms.slice(llms.indexOf("## Free and Pro"), llms.indexOf("## Pages"));
    expect(section).toMatch(/a per-note accuracy chart across every kept session/);
    expect(llms).not.toMatch(/per-note accuracy (trends?|over time)/i);
  });
});

/**
 * Every public top-level page is listed. The file described itself as a
 * navigation map while leaving out /warmups, /ear-training, /breath,
 * /recorder, /tools, /programs, /progress and /book.
 */
describe("/llms.txt coverage", () => {
  const APP_DIR = new URL("../app/", import.meta.url);
  const PRIVATE = new Set(["sign-in", "sign-up", "api"]);
  const topLevel = readdirSync(APP_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !/^[[(_]/.test(d.name) && !PRIVATE.has(d.name))
    .filter((d) => existsSync(new URL(`${d.name}/page.tsx`, APP_DIR)))
    .map((d) => d.name);

  it("finds the app's pages at all", () => {
    expect(topLevel.length).toBeGreaterThan(15);
  });

  it("links every public top-level page", () => {
    const missing = topLevel.filter((seg) => !llms.includes(`${SING_HOME}/${seg}`));
    expect(missing, `llms.txt omits: ${missing.join(", ")}`).toEqual([]);
  });
});

/**
 * Claim discipline across both files. Mirrors the repo's evidence rules: no
 * superlatives, no unlimited-free or accuracy claims.
 */
/**
 * What the file says a page contains has to be what the page renders. The
 * studio line credited it with scale and slide drills that live in warmups,
 * and the genre note said singer pages list their other genres, which they do
 * not: each links one hub, for its primary genre.
 */
describe("/llms.txt describes pages as they render", () => {
  const line = (prefix: string) => llms.split("\n").find((l) => l.startsWith(prefix)) ?? "";

  it("gives the studio only the drill it has", () => {
    const studio = line("- [Pitch studio]");
    expect(studio).toMatch(/target-note drill/);
    expect(studio).not.toMatch(/scales, slides and hold drills/);
    expect(studio).toContain(`${SING_HOME}/warmups`);
  });

  /**
   * Free /progress shows the latest saved range; the range-over-time chart
   * renders only for Pro (components/progress/progress-client.tsx), as the
   * /pro table says.
   */
  it("does not give free Progress the Pro range history", () => {
    const progress = line("- [Progress]");
    expect(progress).not.toMatch(/range history/);
    expect(progress).toMatch(/latest saved range/);
    expect(progress).toMatch(/range over time and per-note accuracy are part of Suede Pro/);
  });

  it("states song key fitting as it behaves, with and without a saved range", () => {
    const songs = line("- [Songs]");
    expect(songs).toMatch(/range test/);
    expect(songs).toMatch(/fitted to that measured range/);
    expect(songs).toMatch(/written key/);
    expect(songs).toMatch(/scored in either octave/);
    expect(songs).not.toMatch(/comfortable/);
  });

  /**
   * /songs counts melodies, not pages (two pages are longer arrangements of a
   * melody already in the book), and most pages hold a song's opening phrase
   * rather than its lyrics.
   */
  it("counts songs the way /songs does, and does not promise whole lyrics", () => {
    const songs = line("- [Songs]");
    const melodies = SONGS.filter((s) => !s.arrangementOf).length;
    expect(songs).toContain(`${melodies} melodies`);
    expect(songs).toMatch(/opening phrase/);
    expect(songs).not.toMatch(/melodies with lyrics/);
  });

  /** The warmup ladder moves every rep, scored or not, and turns back down. */
  it("describes the warmup ladder as it moves", () => {
    const warmups = line("- [Warmups]");
    expect(warmups).toMatch(/a semitone every rep/);
    expect(warmups).toMatch(/come back down/);
    expect(warmups).not.toMatch(/climb by semitone/);
    expect(buildLlmsFullTxt()).not.toMatch(/clear a pattern|cleared pattern/);
  });

  /**
   * The vocal-load panel counts voiced frames, speech included, and only
   * while /analyze is open and visible; the guide on that page says so too.
   */
  it("says where and what vocal load counts", () => {
    const analyze = line("- [Analyze]");
    expect(analyze).toMatch(/open and on screen/);
    expect(analyze).toMatch(/speech counts/);
    expect(analyze).toMatch(/other rooms does not/);
  });

  /** Pro keeps the same capped range history as the record; /pro says so. */
  it("states Pro's range history at the cap the record keeps", () => {
    expect(llms).toContain(`latest ${MAX_RANGE_HISTORY} range tests charted over time`);
    expect(llms).not.toMatch(/every range test/);
  });

  it("describes genre hub links the way singer pages make them", () => {
    expect(llms).not.toMatch(/remaining genres are listed/);
    expect(llms).toMatch(/links the hub for its primary genre/);
    // The claim holds only while every primary genre has a hub to link to.
    const hubs = new Set(HUB_GENRES);
    const orphaned = SINGERS.filter((s) => s.genres[0] && !hubs.has(s.genres[0]));
    expect(orphaned.map((s) => `${s.slug}: ${s.genres[0]}`)).toEqual([]);
    // The exception is named from the data, so it moves when the data does.
    expect(llms).toContain("(Grunge is kept as a deliberate exception)");
  });
});

describe("/llms.txt and /llms-full.txt claim discipline", () => {
  const full = buildLlmsFullTxt();
  for (const [name, text] of [["llms.txt", llms], ["llms-full.txt", full]] as const) {
    it(`makes no superlative, unlimited or accuracy-figure claim in ${name}`, () => {
      expect(text).not.toMatch(/\bunlimited\b/i);
      // "best made deliberately" is ordinary English; "the best", "X's best"
      // and "best <product noun>" are ranking claims.
      expect(text).not.toMatch(/\bthe best\b|['’]s best\b|\bbest (?:app|tool|way|vocal|singing|pitch|free|online|course)\b/i);
      expect(text).not.toMatch(/\d+(?:\.\d+)?\s*%\s*accura/i);
      expect(text).not.toMatch(/studies show/i);
    });
  }
});

/**
 * /llms-full.txt carries the answers the pages give, composed from the same
 * exports the pages render, and nothing the paywall withholds.
 */
describe("/llms-full.txt", () => {
  const full = buildLlmsFullTxt();

  it("is the index plus the reference, under the same title", () => {
    expect(full.startsWith("# Suede Sing")).toBe(true);
    expect(full.startsWith(llms.trimEnd())).toBe(true);
    expect(full).toContain("## Full reference");
  });

  it("carries every tool guide's question, direct answer and FAQ", () => {
    for (const g of TOOL_GUIDES) {
      expect(full).toContain(`Page: ${SING_HOME}${g.path}`);
      expect(full).toContain(g.heading);
      expect(full).toContain(g.answer);
      for (const item of g.faq) {
        expect(full).toContain(`Q: ${item.q}`);
        expect(full).toContain(`A: ${item.a}`);
      }
    }
  });

  it("carries every glossary definition this site publishes, with its anchor", () => {
    for (const e of SING_GLOSSARY_TERMS) {
      expect(full).toContain(`${e.definition} ${SING_HOME}/glossary#${termId(e.term)}`);
    }
    // The guitar senses belong to the guitar hub.
    expect(full).not.toContain("A region of the neck and of pitch");
  });

  it("links free chapters and withholds the gated ones", () => {
    for (const c of [...BOOK_CONTENTS.map((c) => ["book", c] as const), ...ATLAS_CONTENTS.map((c) => ["atlas", c] as const)]) {
      const [base, chapter] = c;
      expect(full).toContain(chapter.title);
      const url = `${SING_HOME}/${base}/${chapter.slug}`;
      if (chapter.free) expect(full).toContain(url);
      else expect(full).not.toContain(url);
    }
    // No gated body text, not even an opening line.
    for (const chapter of [...BOOK, ...ATLAS].filter((c) => !c.free)) {
      const opening = chapter.body.slice(0, 120);
      expect(full).not.toContain(opening);
    }
  });

  it("links only paths the app serves", () => {
    const paths = [
      ...new Set([...full.matchAll(/https:\/\/sing\.suedeai\.ai(\/[^\s,)<#]*)/g)].map((m) => m[1].replace(/[.]+$/, ""))),
    ];
    const dead = paths.filter((p) => {
      const seg = p.split("/")[1];
      if (!seg) return false;
      if (seg in NON_PAGE_PATHS) return !NON_PAGE_PATHS[seg]();
      return !existsSync(new URL(`../app/${seg}/page.tsx`, import.meta.url));
    });
    expect(dead).toEqual([]);
  });
});

describe("the text routes", () => {
  it("serve the builders' output as plain text", async () => {
    for (const [route, body] of [
      [llmsRoute, llms],
      [llmsFullRoute, buildLlmsFullTxt()],
    ] as const) {
      const res = route();
      expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
      expect(await res.text()).toBe(body);
    }
  });
});

/**
 * The site records voices: the recorder, and "Record my take" in song
 * practice. The privacy answer used to open "No" to "upload or record my
 * voice?", which an answer engine quotes as the whole answer. It now leads
 * with what is true (nothing is uploaded) and names where audio is recorded.
 */
describe("/llms.txt privacy answer", () => {
  const songPlayer = readFileSync(
    new URL("../components/songs/song-player.tsx", import.meta.url),
    "utf8",
  );

  it("never answers the record question with a bare No", () => {
    for (const text of [llms, buildLlmsFullTxt()]) {
      expect(text).toContain('"Does Suede Sing upload or record my voice?"');
      expect(text).not.toContain('record my voice?" No.');
      expect(text).toContain('record my voice?" It never uploads it.');
    }
  });

  it("names both places the site records a take, by the label the app shows", () => {
    expect(songPlayer).toContain("Record my take");
    for (const text of [llms, buildLlmsFullTxt()]) {
      expect(text).toContain(`in the recorder (${SING_HOME}/recorder)`);
      expect(text).toContain('with "Record my take" in song practice');
    }
  });
});
