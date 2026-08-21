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
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { generateStaticParams as genreParams } from "@/app/singers/genre/[genre]/page";
import { generateStaticParams as voiceTypeParams } from "@/app/singers/voice-type/[type]/page";
import { APP_NAME } from "./app-store";
import { GENRE_HUBS, SING_HOME, VOICE_TYPE_HUBS, buildLlmsTxt } from "./llms-txt";
import { SINGERS } from "./singers-data";
import { singerBySlug } from "./singers";
import { SITE_URL } from "./site";

const STORE_URL =
  "https://chromewebstore.google.com/detail/dbimnmcokgmibdenmonoafhmdbjhpicd";

const llms = buildLlmsTxt();

describe("/llms.txt", () => {
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
    const examples = advertised(/\/singers\/([a-z0-9-]+)/g).filter(
      (s) => !["genre", "voice-type", "records"].includes(s),
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
      .find((l) => l.startsWith("- Voice-type coverage"));
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
    // The data file itself says these are cited figures, not measurements.
    // If llms.txt ever drops that framing, models will quote them as clinical.
    expect(llms).toMatch(/not laboratory measurements|approximate/i);
    const sourced = SINGERS.filter((s) => s.lowSource || s.highSource).length;
    expect(llms).toContain(`${sourced} profiles carry an explicit citation`);
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
    expect(llms).not.toContain("Suede Sing: Vocal Coach,");
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
