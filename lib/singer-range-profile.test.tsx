/**
 * Search Console (Aug 18) listed 284 of the ~421 singer profiles of the time as
 * "Discovered, currently not indexed": found, then judged not worth crawling.
 * The pages shared one template whose words were mostly caveats with the name
 * and notes swapped in. This file guards the fix: every profile answers "what
 * is <singer>'s vocal range?" with a range explainer computed from its own
 * catalog numbers, an FAQ whose markup matches what is on screen, at least
 * three inbound links from other profiles, and a self-canonical, indexable,
 * sitemap-listed URL.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingerPage, { generateMetadata } from "@/app/singers/[slug]/page";
import sitemap from "@/app/sitemap";
import { INDEXABLE_ROBOTS } from "@/lib/robots-meta";
import { getSingerPageLastModified } from "@/lib/singer-evidence";
import {
  bandCoverage,
  endpointMates,
  keyboardFacts,
  keyboardNeighbors,
  keyboardParagraphs,
  linkedSingerSlugs,
  otherArtistSongs,
  similarRangeAnswer,
  songsInRange,
  songsInRangeCount,
  songsInRangeLead,
  voiceTypeParagraphs,
} from "@/lib/singer-range-profile";
import rawEvidence from "@/data/singer-evidence.json";
import { ATLAS } from "@/lib/atlas-data";
import { evidenceContestsCatalogLabel } from "@/lib/singer-evidence";
import { popFit } from "@/lib/pop-songs";
import { SINGERS, relatedSingers, singerBySlug } from "@/lib/singers";
import { SITE_URL } from "@/lib/site";

const decode = (html: string) =>
  html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

/** Visible words: scripts dropped, tags stripped. */
const visibleText = (html: string) =>
  decode(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

/** Every profile page renders at least this many visible words (before: 576 to 965 on the built site). */
const MIN_WORDS = 850;

const aaliyah = singerBySlug("aaliyah")!;

describe("range explainer arithmetic", () => {
  it("places Aaliyah's C#3–A5 on an 88-key piano", () => {
    expect(keyboardFacts(aaliyah)).toEqual({
      keys: 33,
      whiteKeys: 19,
      blackKeys: 14,
      pianoKeys: { low: 29, high: 61 },
      octaves: [3, 4, 5],
      centerMidi: 65,
      frequencyRatio: expect.closeTo(6.35, 2),
    });
    const text = keyboardParagraphs(aaliyah).join(" ");
    expect(text).toContain("from key 29 (C#3) to key 61 (A5)");
    expect(text).toContain("C#3, sits 11 semitones below middle C (C4). The highest, A5, sits 21 semitones, about 1.8 octaves, above middle C, so the span crosses middle C.");
    expect(text).toContain("C#3 is about 138.6 Hz and A5 is about 880.0 Hz");
    expect(text).toContain("the note halfway through it is F4");
  });

  it("lists only the textbook bands the span really contains as fully covered", () => {
    const { full, partial } = bandCoverage(aaliyah);
    expect(full).toEqual(["Contralto", "Countertenor", "Mezzo-soprano"]);
    expect(partial.find((p) => p.type === "Soprano")).toEqual({ type: "Soprano", semitones: 21 });
    const text = voiceTypeParagraphs(aaliyah, true).join(" ");
    expect(text).toContain("fully covers the contralto (F3–F5), countertenor (G3–G5) and mezzo-soprano (A3–A5) bands");
    expect(text).toContain("soprano (C4–C6, 21 of 24 semitones)");
    expect(text).toMatch(/^Across the \d+ sopranos in this catalog/);
  });

  it("leaves the catalog-label comparison out where a reviewed correction disputes the label", () => {
    const sam = singerBySlug("sam-smith")!;
    const text = voiceTypeParagraphs(sam, false).join(" ");
    expect(text).not.toMatch(/Across the \d+/);
    expect(text).toContain("textbook voice-type bands");
  });

  it("keeps songs that fit inside the span as written, and never the singer's own", () => {
    for (const s of SINGERS) {
      for (const song of songsInRange(s)) {
        expect(song.artistSlugs).not.toContain(s.slug);
        expect(song.lowMidi).toBeGreaterThanOrEqual(s.lowMidi);
        expect(song.highMidi).toBeLessThanOrEqual(s.highMidi);
      }
    }
  });
});

/** Sum of the two endpoint distances: the rule relatedSingers ranks by. */
const endpointDistance = (a: { lowMidi: number; highMidi: number }, b: { lowMidi: number; highMidi: number }) =>
  Math.abs(a.lowMidi - b.lowMidi) + Math.abs(a.highMidi - b.highMidi);

describe("the similar-range FAQ answer states the rule the ranking uses", () => {
  it("names the top three similar voices, nearest endpoints first, and claims no shared voice type", () => {
    let otherLabel = 0;
    for (const s of SINGERS) {
      const answer = similarRangeAnswer(s);
      const top = relatedSingers(s).slice(0, 3);
      // The answer names exactly the cards' first three, in order.
      const at = top.map((o) => answer.indexOf(`${o.name} (`));
      expect(at.every((i) => i >= 0), s.slug).toBe(true);
      expect([...at].sort((a, b) => a - b), s.slug).toEqual(at);
      // The rule it states holds: distance never falls down the list.
      const d = top.map((o) => endpointDistance(o, s));
      expect([...d].sort((a, b) => a - b), s.slug).toEqual(d);
      expect(answer, s.slug).toContain("ranked by how close their reported lowest and highest notes are");
      // The label only breaks ties, so the answer never says the matches share it.
      expect(answer, s.slug).not.toMatch(/voice type|catalog label|matched by|same type/i);
      if (top.some((o) => o.voiceType !== s.voiceType)) otherLabel += 1;
    }
    // The case the old wording got wrong is common, so this guard is live.
    expect(otherLabel).toBeGreaterThan(100);
    expect(relatedSingers(singerBySlug("samuel-ramey")!).slice(0, 3).some((o) => o.voiceType !== "Bass")).toBe(true);
  });
});

describe("the songs-in-range card counts what it lists", () => {
  it("counts and lists the same songs, by other artists, on every profile", () => {
    for (const s of SINGERS) {
      const fitting = otherArtistSongs(s).filter((song) => popFit(song, s).verdict === "fits");
      expect(songsInRangeCount(s), s.slug).toBe(fitting.length);
      expect(songsInRange(s, Infinity).map((x) => x.slug), s.slug).toEqual(
        expect.arrayContaining(fitting.map((x) => x.slug)),
      );
      if (!fitting.length) continue;
      const lead = songsInRangeLead(s);
      expect(lead, s.slug).toContain("by other artists on Suede Sing’s song-range pages");
      expect(lead, s.slug).not.toMatch(/song catalog|^1 of the \d+ [^.]* sit inside|The widest of them/);
      if (fitting.length === 1) expect(lead, s.slug).toMatch(/^1 of the \d+ .* sits inside/);
    }
  });

  it("lists Whitney Houston's widest fitting song by another artist first, and leaves her own out of count and list", () => {
    const whitney = singerBySlug("whitney-houston")!;
    const span = (x: { lowMidi: number; highMidi: number }) => x.highMidi - x.lowMidi;
    const widest = otherArtistSongs(whitney)
      .filter((song) => popFit(song, whitney).verdict === "fits")
      .sort((a, b) => span(b) - span(a) || a.title.localeCompare(b.title))[0];
    expect(songsInRange(whitney)[0].slug).toBe(widest.slug);
    expect(songsInRange(whitney).map((x) => x.slug)).not.toContain("i-will-always-love-you");
    expect(songsInRangeLead(whitney)).toMatch(/^All 23 popular songs by other artists/);
  });
});

/** "describes X as (a) [lyric] tenor": the voice type a cited source gives, if any. */
const SOURCE_TYPE = /\bas (?:an? )?(?:[a-z]+ )?(bass-baritone|mezzo-soprano|countertenor|contralto|soprano|baritone|tenor|bass)\b/i;

describe("a cited source that names another voice type unsettles the label", () => {
  it("drops the same-label comparison on every profile whose own source names a different type", async () => {
    const evidence = rawEvidence as Record<string, { voiceTypeCopy?: string }>;
    const contested: string[] = [];
    for (const [slug, entry] of Object.entries(evidence)) {
      const named = SOURCE_TYPE.exec(entry.voiceTypeCopy ?? "")?.[1]?.toLowerCase();
      const s = singerBySlug(slug)!;
      if (!named || named === s.voiceType.toLowerCase()) continue;
      contested.push(slug);
      const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug }) }));
      const text = visibleText(html);
      expect(text, slug).toContain(`How ${s.name}’s range lines up with the textbook voice types`);
      expect(text, slug).not.toMatch(new RegExp(`compares with other ${s.voiceType.toLowerCase()}`, "i"));
      expect(text, slug).not.toMatch(/Across the \d+ /);
      // The catalog-position list drops the facts that read the label as settled, too.
      expect(text, slug).not.toMatch(/Span, [a-z-]+ group|Against the textbook band/);
    }
    expect(contested).toContain("peter-steele");
    expect(evidenceContestsCatalogLabel("peter-steele")).toBe(true);
  });
});

describe("note ranges use the house en dash in singer and atlas copy", () => {
  it("prints no hyphenated note range anywhere in the singer data, evidence or atlas", () => {
    const HYPHEN_RANGE = /\b[A-G][#b]?-?\d-[A-G][#b]?-?\d\b/g;
    const corpus = JSON.stringify([SINGERS, rawEvidence, ATLAS]);
    expect(corpus.match(HYPHEN_RANGE) ?? []).toEqual([]);
  });
});

describe("every singer is linked from at least three other singer pages", () => {
  it("counts inbound profile links across the catalog", () => {
    const inbound = new Map(SINGERS.map((s) => [s.slug, new Set<string>()]));
    for (const s of SINGERS) {
      for (const slug of linkedSingerSlugs(s)) if (slug !== s.slug) inbound.get(slug)!.add(s.slug);
    }
    const starved = [...inbound].filter(([, from]) => from.size < 3).map(([slug, from]) => `${slug}:${from.size}`);
    expect(starved).toEqual([]);
  });

  it("keyboard neighbors never include the singer and always hold six", () => {
    for (const s of SINGERS) {
      const n = keyboardNeighbors(s);
      expect(n).toHaveLength(6);
      expect(n.map((o) => o.slug)).not.toContain(s.slug);
    }
  });

  it("mirrors the links the page actually renders", async () => {
    for (const slug of ["aaliyah", SINGERS[0].slug, SINGERS.at(-1)!.slug, "sam-smith"]) {
      const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug }) }));
      const rendered = new Set(
        [...html.matchAll(/href="\/singers\/([a-z0-9-]+)"/g)].map((m) => m[1]),
      );
      for (const linked of linkedSingerSlugs(singerBySlug(slug)!)) {
        expect(rendered.has(linked), `${slug} -> ${linked}`).toBe(true);
      }
    }
  });
});

describe("shared-floor and shared-ceiling chips show the closest voices, not the first names", () => {
  it("orders chips by the other endpoint's distance, then name, and repeats no card or neighbor", () => {
    for (const s of SINGERS) {
      const { allLow, allHigh, lowMates, highMates } = endpointMates(s);
      const shown = new Set([...relatedSingers(s), ...keyboardNeighbors(s)].map((o) => o.slug));
      const check = (mates: typeof lowMates, all: typeof allLow, gap: (o: (typeof all)[number]) => number) => {
        const candidates = all.filter((o) => !shown.has(o.slug));
        // Every chip comes from the full list; none is a card or neighbor already on the page.
        for (const m of mates) expect(all).toContain(m);
        expect(mates.filter((m) => shown.has(m.slug))).toEqual([]);
        // Sorted closest first, ties by name, and no closer candidate left off.
        for (let i = 1; i < mates.length; i++) {
          const d = gap(mates[i - 1]) - gap(mates[i]);
          expect(d < 0 || (d === 0 && mates[i - 1].name.localeCompare(mates[i].name) <= 0), s.slug).toBe(true);
        }
        if (mates.length) {
          const worst = gap(mates.at(-1)!);
          const skipped = candidates.filter((o) => !mates.includes(o) && gap(o) < worst);
          expect(skipped.map((o) => o.slug), s.slug).toEqual([]);
        }
        return candidates.length;
      };
      const lowCandidates = check(lowMates, allLow, (o) => Math.abs(o.highMidi - s.highMidi));
      const highCandidates = check(highMates, allHigh, (o) => Math.abs(o.lowMidi - s.lowMidi));
      // The page's budget: four per row when both rows exist, eight when one does.
      expect(lowMates).toHaveLength(Math.min(lowCandidates, allHigh.length ? 4 : 8));
      expect(highMates).toHaveLength(Math.min(highCandidates, allLow.length ? 4 : 8));
    }
  });

  it("gives Adele's C3 chips the floor-mates nearest her A#5 ceiling, not Akon or Andrea Bocelli", () => {
    const adele = singerBySlug("adele")!;
    const { lowMates } = endpointMates(adele);
    const slugs = lowMates.map((o) => o.slug);
    expect(slugs).not.toContain("akon");
    expect(slugs).not.toContain("andrea-bocelli");
    for (const m of lowMates) expect(Math.abs(m.highMidi - adele.highMidi)).toBeLessThanOrEqual(2);
    // Fiona Apple (C3–A5) is one semitone off; she is linked as a keyboard neighbor rather than repeated as a chip.
    expect(linkedSingerSlugs(adele)).toContain("fiona-apple");
  });

  it("spreads chip links across the catalog instead of the names that sort first", () => {
    const inbound = new Map<string, number>();
    for (const s of SINGERS) {
      const { lowMates, highMates } = endpointMates(s);
      for (const m of [...lowMates, ...highMates]) inbound.set(m.slug, (inbound.get(m.slug) ?? 0) + 1);
    }
    // Alphabetical slicing sent 4,989 chip links to 208 profiles, Adam Lambert taking 146.
    // Closest-first measured 601 profiles reached and a maximum of 31 (Ailee) on 2026-11-02;
    // 40 leaves room for catalog growth while catching any return to name order.
    const max = Math.max(...inbound.values());
    expect(max).toBeLessThanOrEqual(40);
    expect(inbound.size).toBeGreaterThan(SINGERS.length * 0.8);
  });

  it("keeps the full count and says the matches are linked when every one is already a card or neighbor", async () => {
    const s = SINGERS.find((o) => {
      const m = endpointMates(o);
      return m.allLow.length > 0 && m.lowMates.length === 0;
    })!;
    expect(s).toBeDefined();
    const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug: s.slug }) }));
    const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
    const n = endpointMates(s).allLow.length;
    expect(text).toContain(`${n} other ${n === 1 ? "voice" : "voices"} here ${n === 1 ? "has" : "have"} the same reported floor in this catalog.`);
    expect(text).toMatch(/reported floor in this catalog\. (That voice is|All of them are) already linked on this page\./);
  });
});

const BATCH = 32;
/** Page text with the singer's name masked, by slug: no two profiles may read the same. */
const seenPages = new Map<string, string>();
const BATCHES = Array.from({ length: Math.ceil(SINGERS.length / BATCH) }, (_, i) => [
  SINGERS.slice(i * BATCH, (i + 1) * BATCH),
] as const);

describe("every singer page is a thick, indexable answer page", () => {
  it.each(BATCHES)(
    "render batch %#",
    async (singers) => {
      const map = sitemap();
      for (const s of singers) {
        const url = `${SITE_URL}/singers/${s.slug}`;
        const meta = await generateMetadata({ params: Promise.resolve({ slug: s.slug }) });
        expect(meta.alternates?.canonical, s.slug).toBe(url);
        expect(meta.robots, s.slug).toEqual(INDEXABLE_ROBOTS);
        const entries = map.filter((e) => e.url === url);
        expect(entries, s.slug).toHaveLength(1);
        expect(entries[0].lastModified, s.slug).toBe(getSingerPageLastModified(s.slug));

        const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug: s.slug }) }));
        const text = visibleText(html);

        // The answer: the H1 names the singer and the vocal range.
        const h1 = decode(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)![1]);
        expect(h1, s.slug).toContain(s.name);
        expect(h1, s.slug).toContain("Vocal Range");

        // The explainer sections, each with the singer's own computed figures.
        expect(html, s.slug).toContain('id="piano"');
        expect(html, s.slug).toContain('id="voice-type-comparison"');
        expect(html, s.slug).toContain('id="practice"');
        for (const line of [...keyboardParagraphs(s)]) expect(text, s.slug).toContain(line);

        // The closing card: the reference songs are named as range pages, never a catalog to sing in the app.
        const card = visibleText(html.slice(html.indexOf('id="practice"')));
        expect(card, s.slug).not.toMatch(/Suede Sing song catalog|same keyboard|which to train next|Sing in .* range with Suede Sing|sit at each end/);
        if (songsInRange(s).length) {
          expect(card, s.slug).toContain(songsInRangeLead(s));
          expect(html.slice(html.indexOf('id="practice"')), s.slug).toContain('href="/songs"');
        }

        expect(text.split(" ").length, `${s.slug} word count`).toBeGreaterThanOrEqual(MIN_WORDS);
        const masked = text.replaceAll(s.name, "NAME");
        expect(seenPages.get(masked), `${s.slug} reads the same as another profile`).toBeUndefined();
        seenPages.set(masked, s.slug);

        // JSON-LD parses; FAQPage questions are the visible questions; the page is about the singer.
        const ld = JSON.parse(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)![1],
        ) as { "@graph": Array<Record<string, unknown>> };
        const graph = ld["@graph"];
        const page = graph.find((n) => n["@type"] === "WebPage")!;
        const person = graph.find((n) => n["@type"] === "Person")!;
        expect(page.about, s.slug).toEqual({ "@id": person["@id"] });
        expect(page.url, s.slug).toBe(url);
        expect((page.breadcrumb as { "@type": string })["@type"]).toBe("BreadcrumbList");
        const faq = graph.find((n) => n["@type"] === "FAQPage") as {
          mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
        };
        const questions = faq.mainEntity.map((q) => q.name);
        expect(questions, s.slug).toContain(`What is ${s.name}’s highest note?`);
        expect(questions, s.slug).toContain(`How many octaves can ${s.name} sing?`);
        expect(questions, s.slug).toContain(`What voice type is ${s.name}?`);
        expect(questions, s.slug).toContain(`Who has a similar vocal range to ${s.name}?`);
        for (const q of faq.mainEntity) {
          expect(text, `${s.slug}: ${q.name}`).toContain(q.name);
          expect(text, `${s.slug}: ${q.name}`).toContain(q.acceptedAnswer.text);
        }
      }
    },
    60_000,
  );

});
