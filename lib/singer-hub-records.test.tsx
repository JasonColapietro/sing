/**
 * Shared records name every holder.
 *
 * The catalog has ties at the extremes: two profiles share the widest span and
 * two share the lowest note. The record helpers used to keep the first match,
 * which for an alphabetical list is the alphabetically first name, so the
 * records page, the /singers FAQ and eleven hubs crowned one singer while the
 * other's own page (tie-aware) said "number 1". These checks hold every
 * surface to the whole tie, whatever the data holds at the time.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import RecordsPage from "@/app/singers/records/page";
import SingersPage from "@/app/singers/page";
import GenrePage from "@/app/singers/genre/[genre]/page";
import VoiceTypePage from "@/app/singers/voice-type/[type]/page";
import {
  HUB_GENRES,
  SINGERS,
  VOICE_KINDS,
  genreSlug,
  joinNames,
  recordHolders,
  singersByGenre,
  singersByVoiceType,
  voiceTypeSlug,
  type Singer,
} from "@/lib/singers";
import { statsFor } from "@/lib/singers-analysis";

type Graph = { "@graph": Array<Record<string, unknown>> };
type Faq = { mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }> };

function jsonLd(html: string): Graph {
  const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!raw) throw new Error("no JSON-LD");
  return JSON.parse(raw.replace(/&quot;/g, '"').replace(/&amp;/g, "&")) as Graph;
}

function faqAnswers(html: string): Record<string, string> {
  const faq = jsonLd(html)["@graph"].find((n) => n["@type"] === "FAQPage") as unknown as Faq;
  return Object.fromEntries(faq.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]));
}

function text(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

const span = (s: Singer) => s.highMidi - s.lowMidi;

describe("recordHolders and joinNames", () => {
  it("returns every holder of a tied record, in list order", () => {
    const a = { name: "A", lowMidi: 40, highMidi: 70 };
    const b = { name: "B", lowMidi: 30, highMidi: 60 };
    const c = { name: "C", lowMidi: 45, highMidi: 70 };
    const r = recordHolders([a, b, c]);
    expect(r.widest).toEqual([a, b]);
    expect(r.lowest).toEqual([b]);
    expect(r.highest).toEqual([a, c]);
    expect(recordHolders([])).toEqual({ widest: [], lowest: [], highest: [] });
  });

  it("joins names the way a sentence does", () => {
    expect(joinNames(["A"])).toBe("A");
    expect(joinNames(["A", "B"])).toBe("A and B");
    expect(joinNames(["A", "B", "C"])).toBe("A, B and C");
  });

  it("gives hub stats the whole tie, not just its first name", () => {
    for (const list of [
      ...HUB_GENRES.map(singersByGenre),
      ...VOICE_KINDS.map(singersByVoiceType),
    ]) {
      const stats = statsFor(list)!;
      const r = recordHolders(list);
      expect(stats.widestAll).toEqual(r.widest);
      expect(stats.lowestAll).toEqual(r.lowest);
      expect(stats.highestAll).toEqual(r.highest);
      const narrow = Math.min(...list.map(span));
      expect(stats.narrowestAll).toEqual(list.filter((s) => span(s) === narrow));
    }
  });
});

describe("/singers/records", () => {
  const holders = recordHolders(SINGERS);
  const html = renderToStaticMarkup(<RecordsPage />);

  it("names every holder of the widest span in the subtitle and the FAQ", () => {
    const subtitle = text(html.slice(html.search(/<h1\b/)).match(/<p\b[^>]*>([\s\S]*?)<\/p>/)![1]);
    const answer = faqAnswers(html)["Who has the biggest vocal range in the world?"];
    for (const s of holders.widest) {
      expect(subtitle).toContain(s.name);
      expect(answer).toContain(s.name);
    }
    if (holders.widest.length > 1) expect(subtitle).toContain("share the widest reported span");
  });

  it("names every holder of the lowest and highest endpoints", () => {
    const faq = faqAnswers(html);
    expect(faq["What is the lowest note ever sung?"]).toContain(
      `listed for ${joinNames(holders.lowest.map((s) => s.name))}.`,
    );
    expect(faq["What is the highest note ever sung?"]).toContain(
      `listed for ${joinNames(holders.highest.map((s) => s.name))}.`,
    );
  });

  it("states the shared caveat once, as the FAQ's lede, not in every answer", () => {
    expect(html.split("cannot establish a world record").length - 1).toBe(1);
    for (const answer of Object.values(faqAnswers(html))) {
      expect(answer).not.toMatch(/cannot establish|does not establish|evidence status/);
    }
  });

  it("gives tied spans the same rank in the ItemList, as the singer pages do", () => {
    const collection = jsonLd(html)["@graph"].find((n) => n["@type"] === "CollectionPage") as {
      mainEntity: { itemListElement: Array<{ position: number; url: string }> };
    };
    for (const item of collection.mainEntity.itemListElement) {
      const s = SINGERS.find((o) => item.url.endsWith(`/singers/${o.slug}`))!;
      expect(item.position, s.slug).toBe(SINGERS.filter((o) => span(o) > span(s)).length + 1);
    }
    const first = collection.mainEntity.itemListElement.filter((i) => i.position === 1);
    expect(first).toHaveLength(holders.widest.length);
  });

  it("never cuts a tie at the bottom of a table", () => {
    // Widest, lowest and highest tables, in page order. A hard cut at 15 used
    // to show one tied profile at the last rank and silently drop the others.
    const tables = [...html.matchAll(/<ol\b[^>]*>([\s\S]*?)<\/ol>/g)].map((m) =>
      [...m[1].matchAll(/href="\/singers\/([a-z0-9-]+)"/g)].map((h) => h[1]),
    );
    const metrics: Array<(s: Singer) => number> = [span, (s) => s.lowMidi, (s) => s.highMidi];
    expect(tables).toHaveLength(metrics.length);
    tables.forEach((slugs, t) => {
      expect(slugs.length, `table ${t}`).toBeGreaterThanOrEqual(15);
      const shown = new Set(slugs);
      const metric = metrics[t];
      for (const slug of slugs) {
        const value = metric(SINGERS.find((s) => s.slug === slug)!);
        for (const tied of SINGERS.filter((o) => metric(o) === value)) {
          expect(shown.has(tied.slug), `table ${t}: ${tied.slug} ties ${slug}`).toBe(true);
        }
      }
    });
  });
});

describe("/singers FAQ", () => {
  it("names every holder of each record", () => {
    const holders = recordHolders(SINGERS);
    const faq = faqAnswers(renderToStaticMarkup(<SingersPage />));
    for (const s of holders.widest) expect(faq["Who has the widest vocal range?"]).toContain(s.name);
    expect(faq["What is the lowest note sung by a famous singer?"]).toContain(
      `listed for ${joinNames(holders.lowest.map((s) => s.name))}.`,
    );
    expect(faq["What is the highest note sung by a famous singer?"]).toContain(
      `listed for ${joinNames(holders.highest.map((s) => s.name))}.`,
    );
  });
});

describe("hub record sentences", () => {
  it(
    "name every tied holder on genre hubs",
    async () => {
      for (const g of HUB_GENRES) {
        const stats = statsFor(singersByGenre(g))!;
        const html = renderToStaticMarkup(
          await GenrePage({ params: Promise.resolve({ genre: genreSlug(g) }) }),
        );
        const item = html.split("<li>").find((chunk) => chunk.includes("Largest reported span here")) ?? "";
        const line = text(item.slice(0, item.indexOf("</li>")));
        expect(line, g).toContain("Largest reported span here");
        for (const s of [...stats.widestAll, ...stats.lowestAll, ...stats.highestAll]) {
          expect(line, `${g}: ${s.name}`).toContain(s.name);
        }
      }
    },
    60_000,
  );

  it(
    "name every tied holder in voice-type FAQ answers",
    async () => {
      for (const v of VOICE_KINDS) {
        const stats = statsFor(singersByVoiceType(v))!;
        const html = renderToStaticMarkup(
          await VoiceTypePage({ params: Promise.resolve({ type: voiceTypeSlug(v) }) }),
        );
        const answers = Object.values(faqAnswers(html));
        const [high, low] = answers;
        expect(high, v).toContain(`for ${joinNames(stats.highestAll.map((s) => s.name))};`);
        expect(low, v).toContain(`for ${joinNames(stats.lowestAll.map((s) => s.name))};`);
      }
    },
    60_000,
  );
});
