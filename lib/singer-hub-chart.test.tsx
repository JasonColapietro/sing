/**
 * Range bars draw only what the catalog cites.
 *
 * A singer with no cited full-voice ceiling (beltMidi null) used to be drawn
 * as a solid "full voice" bar to the top note, so falsetto specialists such as
 * Al Green and Curtis Mayfield read as full voice up to B♭5 on the /singers
 * chart and on every genre and voice-type hub. Those bars are now dashed and
 * unfilled, and every hub chart carries the key that explains the marks.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { HubChart } from "@/components/singers/hub-chart";
import { fullVoicePct, rangeBarWords } from "@/components/singers/range-bar";
import { midiToLabel } from "@/lib/audio/notes";
import GenrePage from "@/app/singers/genre/[genre]/page";
import RecordsPage from "@/app/singers/records/page";
import VoiceTypePage from "@/app/singers/voice-type/[type]/page";
import AtlasPage from "@/app/atlas/page";
import { SINGERS, rangeLabel, type Singer } from "@/lib/singers";
import { balancedChunks } from "@/lib/singers-core";

function singer(slug: string): Singer {
  const s = SINGERS.find((x) => x.slug === slug);
  if (!s) throw new Error(`no singer ${slug}`);
  return s;
}

/** The <a> for one singer's chart row. */
function rowHtml(html: string, slug: string): string {
  const row = html.match(
    new RegExp(`<a[^>]*href="/singers/${slug}"[^>]*>([\\s\\S]*?)</a>`),
  )?.[1];
  if (!row) throw new Error(`no chart row for ${slug}`);
  return row;
}

/** The accessible name of one singer's chart row. */
function rowLabel(html: string, slug: string): string {
  const tag = html.match(new RegExp(`<a[^>]*href="/singers/${slug}"[^>]*>`))?.[0];
  const label = tag?.match(/aria-label="([^"]*)"/)?.[1];
  if (!label) throw new Error(`no aria-label on the chart row for ${slug}`);
  return label;
}

const FILL = "bg-cool/70";

describe("range bars", () => {
  it("gives no full-voice share when no ceiling is cited", () => {
    expect(fullVoicePct({ lowMidi: 41, highMidi: 82, beltMidi: null })).toBeNull();
    // Inclusive of the top semitone: a ceiling on the top note fills the bar.
    expect(fullVoicePct({ lowMidi: 60, highMidi: 71, beltMidi: 71 })).toBe(100);
    expect(fullVoicePct({ lowMidi: 60, highMidi: 71, beltMidi: 65 })).toBe(50);
  });

  it("draws a no-ceiling singer dashed and unfilled, and a cited ceiling as a solid share", () => {
    const alGreen = singer("al-green");
    const adele = singer("adele");
    expect(alGreen.beltMidi).toBeNull();
    expect(adele.beltMidi).not.toBeNull();

    const html = renderToStaticMarkup(
      <HubChart list={[adele, alGreen]} axisLow={24} axisHigh={96} />,
    );
    const noCeiling = rowHtml(html, "al-green");
    expect(noCeiling).toContain("border-dashed");
    expect(noCeiling).not.toContain(FILL);

    const withCeiling = rowHtml(html, "adele");
    expect(withCeiling).not.toContain("border-dashed");
    expect(withCeiling).toContain(FILL);
    expect(withCeiling).toContain(`width:${fullVoicePct(adele)}%`);

    // The bar is aria-hidden, so the row's accessible name says the same.
    expect(rowLabel(html, "al-green")).toContain("no full-voice ceiling cited");
    expect(rowLabel(html, "al-green")).not.toContain("full voice to");
    expect(rowLabel(html, "adele")).toContain(
      `full voice to ${midiToLabel(adele.beltMidi!)}`,
    );
  });

  it("puts the bar's marks into words with the key's wording", () => {
    expect(rangeBarWords({ lowMidi: 41, highMidi: 82, beltMidi: null, whistle: false })).toEqual([
      "no full-voice ceiling cited",
    ]);
    expect(rangeBarWords({ lowMidi: 48, highMidi: 96, beltMidi: 77, whistle: true })).toEqual([
      "full voice to F5",
      "whistle register listed",
    ]);
  });

  it("keys every mark a hub chart draws, in the server HTML", async () => {
    const html = renderToStaticMarkup(
      await GenrePage({ params: Promise.resolve({ genre: "soul" }) }),
    );
    expect(html).toContain("full voice, up to the cited ceiling");
    expect(html).toContain("above it: falsetto · head · whistle");
    expect(html).toContain("no full-voice ceiling cited");
    expect(rowHtml(html, "al-green")).not.toContain(FILL);
  });

  it("leaves out key items for marks a chart does not draw", () => {
    const html = renderToStaticMarkup(
      <HubChart list={[singer("adele")]} axisLow={24} axisHigh={96} />,
    );
    expect(html).toContain("full voice, up to the cited ceiling");
    expect(html).not.toContain("no full-voice ceiling cited");
    expect(html).not.toContain("whistle register listed");
  });
});

describe("chart and roster group headings", () => {
  const sizes = (n: number, max: number) =>
    balancedChunks(Array.from({ length: n }, (_, i) => i), max).map((g) => g.length);

  it("split a long list into the fewest even groups, never leaving one name alone", () => {
    expect(sizes(97, 24)).toEqual([20, 20, 19, 19, 19]);
    expect(sizes(25, 24)).toEqual([13, 12]);
    expect(sizes(24, 24)).toEqual([24]);
    expect(sizes(7, 3)).toEqual([3, 2, 2]);
    expect(sizes(0, 24)).toEqual([]);
    for (let n = 25; n <= 200; n++) {
      const groups = sizes(n, 24);
      expect(Math.max(...groups), `${n}`).toBeLessThanOrEqual(24);
      expect(Math.min(...groups), `${n}`).toBeGreaterThan(1);
      expect(groups.reduce((a, b) => a + b, 0)).toBe(n);
    }
    const list = Array.from({ length: 49 }, (_, i) => i);
    expect(balancedChunks(list, 24).flat()).toEqual(list);
  });

  it("never read 'Singers X through X' on the hubs and the atlas contents", async () => {
    const pages = [
      renderToStaticMarkup(await VoiceTypePage({ params: Promise.resolve({ type: "soprano" }) })),
      renderToStaticMarkup(await GenrePage({ params: Promise.resolve({ genre: "opera" }) })),
      renderToStaticMarkup(<AtlasPage />),
    ];
    for (const html of pages) {
      const headings = [...html.matchAll(/>Singers ([^<]+?) through ([^<]+?)</g)];
      expect(headings.length).toBeGreaterThan(1);
      for (const [heading, first, last] of headings) expect(first, heading).not.toBe(last);
    }
  });
});

describe("the singer-songwriter hub's structured data", () => {
  it("names the page as its heading does, not 'Singer-Songwriter singers'", async () => {
    const html = renderToStaticMarkup(await GenrePage({ params: Promise.resolve({ genre: "singer-songwriter" }) }));
    expect(html).toContain('"name":"Singer-songwriters and their vocal ranges"');
    expect(html).not.toContain("Singer-Songwriter singers");
  });
});

describe("voice-type hubs the range test cannot answer", () => {
  // The classifier has six bands, bass to soprano (lib/voice-types.test.ts
  // records the two it can never assign), so "Estimate my voice type" on these
  // two hubs says it will not name the page's own type.
  it.each([
    ["countertenor", "G3–G5"],
    ["bass-baritone", "F#2–F#4"],
  ])("%s says the estimate never names it, and points at the page's band", async (type, band) => {
    const html = renderToStaticMarkup(await VoiceTypePage({ params: Promise.resolve({ type }) }));
    expect(html).toContain("Estimate my voice type");
    expect(html).toContain(`never names ${type}`);
    expect(html).toContain(`${band} band.`);
  });

  it("adds nothing on a hub the estimate can return", async () => {
    const html = renderToStaticMarkup(await VoiceTypePage({ params: Promise.resolve({ type: "tenor" }) }));
    expect(html).toContain("Estimate my voice type");
    expect(html).not.toContain("never names");
  });
});

describe("/singers/records rows", () => {
  it("lead with the reported range on a line that wraps instead of truncating", () => {
    const html = renderToStaticMarkup(<RecordsPage />);
    const lines = [...html.matchAll(/<span class="([^"]*)">Reported ([^<·]+) · catalog label: /g)];
    expect(lines.length).toBeGreaterThan(10);
    const labels = new Set(SINGERS.map(rangeLabel));
    for (const [, className, range] of lines) {
      expect(className).not.toContain("truncate");
      expect(labels.has(range), range).toBe(true);
    }
  });
});
