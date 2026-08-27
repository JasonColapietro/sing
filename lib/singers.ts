import { SINGERS } from "@/lib/singers-data";
import {
  computeRecords as computeRecordsOf,
  genreSlug,
  type Records,
} from "@/lib/singers-core";

export type { Singer, VoiceKind } from "@/lib/singers-data";
export { SINGERS } from "@/lib/singers-data";

// Pure helpers live in singers-core so client components can use them without
// dragging the full SINGERS array (blurbs, technique prose, sources) into
// their bundle. Server code keeps importing everything from here.
export {
  VOICE_KINDS,
  describeSpan,
  genreSlug,
  pluralVoice,
  rangeLabel,
  rangeOverlap,
  spanOctaves,
  voiceTypeFromSlug,
  voiceTypeSlug,
} from "@/lib/singers-core";

import type { Singer } from "@/lib/singers-data";

export function singerBySlug(slug: string): Singer | undefined {
  return SINGERS.find((s) => s.slug === slug);
}

export type SingerRecords = Records<Singer>;

export function computeRecords(list: Singer[] = SINGERS): SingerRecords {
  return computeRecordsOf(list);
}

/**
 * Singers most comparable to `s`: same voice type first, then nearest
 * range-center, so the "similar voices" links stay musically meaningful.
 */
export function relatedSingers(s: Singer, count = 6): Singer[] {
  const center = (s.lowMidi + s.highMidi) / 2;
  return SINGERS.filter((o) => o.slug !== s.slug)
    .map((o) => ({
      o,
      score:
        (o.voiceType === s.voiceType ? 0 : 24) +
        Math.abs((o.lowMidi + o.highMidi) / 2 - center),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map((x) => x.o);
}

/** Percent (0–100) of the library whose cited span is narrower than this singer's. */
export function spanPercentile(s: Singer): number {
  const span = s.highMidi - s.lowMidi;
  const narrower = SINGERS.filter(
    (o) => o.highMidi - o.lowMidi < span,
  ).length;
  return Math.round((narrower / SINGERS.length) * 100);
}

/**
 * Whether a "wider than N% of the library" line is worth printing. At the
 * extremes the rounded percentile states something false — the narrowest
 * singers tie rather than being beaten by nobody, and the widest is not wider
 * than himself — so those pages get no comparison line rather than a wrong one.
 */
export function hasUsefulPercentile(s: Singer): boolean {
  const p = spanPercentile(s);
  return p > 0 && p < 100;
}

/* ------------------------------------------------------------------ hubs --- */

/** Genres with enough singers to make a page worth having on its own. */
export const HUB_GENRE_MINIMUM = 8;

export const HUB_GENRES: string[] = (() => {
  const counts = new Map<string, number>();
  for (const s of SINGERS) {
    for (const g of s.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= HUB_GENRE_MINIMUM)
    .map(([g]) => g)
    .sort();
})();

export function genreFromSlug(slug: string): string | undefined {
  return HUB_GENRES.find((g) => genreSlug(g) === slug);
}

export function singersByVoiceType(v: Singer["voiceType"]): Singer[] {
  return SINGERS.filter((s) => s.voiceType === v).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function singersByGenre(g: string): Singer[] {
  return SINGERS.filter((s) => s.genres.includes(g)).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

/**
 * Wikipedia titles that name-mangling gets wrong.
 *
 * `sameAs` is an identity assertion: it says "this Person IS the thing at that
 * URL". Deriving the URL from the display name silently breaks for anyone whose
 * name is not the primary topic — every one of these resolved to a *disambiguation
 * page*, which is not a person, so the claim was false rather than merely
 * unhelpful. A 404 would have been safer; a 200 on the wrong kind of page is the
 * failure mode that hides.
 *
 * Checked against the Wikipedia API on 2026-08-02: all 420 titles queried,
 * 18 landed on disambiguation pages and 7 more resolved only via a redirect.
 * Every replacement title below was verified to be a real, non-disambiguation
 * article. Re-run that check when adding singers with single-word or shared names.
 *
 * Re-checked 2026-08-27 for the expansion batches. New trap found: a bare
 * title can be a "name list" page that does NOT carry the disambiguation
 * pageprop ("Mika" is one), so the check must also read the page's short
 * description — anything like "Topics referred to by the same term" or
 * "Name list" is not a person, whatever the pageprops say.
 */
const WIKIPEDIA_TITLE_OVERRIDES: Record<string, string | null> = {
  // Landed on a disambiguation page.
  ado: "Ado (singer)",
  chen: "Chen (singer)",
  halsey: "Halsey (singer)",
  iu: "IU (singer)",
  "james-blake": "James Blake (musician)",
  "jelly-roll": "Jelly Roll (singer)",
  "jeremy-jordan": "Jeremy Jordan (actor)",
  "jill-scott": "Jill Scott (singer)",
  laufey: "Laufey (singer)",
  maxwell: "Maxwell (musician)",
  miguel: "Miguel (singer)",
  rema: "Rema (musician)",
  "robert-smith": "Robert Smith (musician)",
  shaggy: "Shaggy (musician)",
  sting: "Sting (musician)",
  "tom-jones": "Tom Jones (singer)",
  usher: "Usher (musician)",
  zayn: "Zayn Malik",
  // 2026-08-27 expansion batches.
  jin: "Jin (singer)",
  do: "Doh Kyung-soo",
  wendy: "Wendy (singer)",
  solar: "Solar (singer)",
  "james-bay": "James Bay (singer)",
  passenger: "Passenger (singer)",
  "david-kushner": "David Kushner (singer-songwriter)",
  jvke: "Jvke",
  seal: "Seal (musician)",
  jojo: "JoJo (singer)",
  jewel: "Jewel (singer)",
  aurora: "Aurora (singer)",
  marina: "Marina Diamandis",
  raye: "Raye",
  drake: "Drake (musician)",
  "childish-gambino": "Donald Glover",
  "juice-wrld": "Juice Wrld",
  // No personal article exists — only the band's. A Person sameAs pointing at
  // a band asserts the wrong kind of entity, so these emit no sameAs at all.
  "caleb-followill": null,
  "tatiana-shmayluk": null,
  "josh-kiszka": null,
  "glenn-hughes": "Glenn Hughes (musician)",
  "michael-mcdonald": "Michael McDonald (musician)",
  monica: "Monica (singer)",
  ashanti: "Ashanti (singer)",
  fantasia: "Fantasia (singer)",
  indiaarie: "India Arie",
  solange: "Solange Knowles",
  "fka-twigs": "FKA Twigs",
  mika: "Mika (singer)",
  "chloe-bailey": "Chloe Bailey",
  // Resolved only through a redirect; point at the article directly.
  anohni: "Anohni",
  "aulii-cravalho": "Auliʻi Cravalho",
  "dimash-kudaibergen": "Dimash Qudaibergen",
  jungkook: "Jung Kook",
  lisa: "Lisa (Japanese musician, born 1987)",
  "park-hyo-shin": "Park Hyo-shin",
  "sade-adu": "Sade (singer)",
};

/**
 * Canonical Wikipedia URL for a singer, honouring the overrides above.
 * Null when the singer has no personal article (a band article is not an
 * acceptable stand-in for a Person) — callers omit sameAs in that case.
 */
export function wikipediaUrl(s: Pick<Singer, "slug" | "name">): string | null {
  const title =
    s.slug in WIKIPEDIA_TITLE_OVERRIDES
      ? WIKIPEDIA_TITLE_OVERRIDES[s.slug]
      : s.name;
  if (title === null) return null;
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}
