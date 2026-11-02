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
  joinNames,
  pluralVoice,
  rangeLabel,
  rangeOverlap,
  recordHolders,
  spanOctaves,
  voiceTypeFromSlug,
  voiceTypeSlug,
} from "@/lib/singers-core";

import type { Singer } from "@/lib/singers-data";
import { GENRE_HUB_COPY } from "@/lib/singer-hub-copy";

export function singerBySlug(slug: string): Singer | undefined {
  return SINGERS.find((s) => s.slug === slug);
}

export type SingerRecords = Records<Singer>;

export function computeRecords(list: Singer[] = SINGERS): SingerRecords {
  return computeRecordsOf(list);
}

/**
 * Singers most comparable to `s`: nearest low and high endpoints first, the
 * catalog label only as a tie-breaker, so the "similar catalog range" heading
 * holds. Ranking by range center alone put C3–A#4 beside A#1–C6 (same center,
 * an octave and more wider); a two-octave penalty for a different label then
 * left Wendy's C#3–D#7 off Normani's identical C#3–D#7 and put Tim Storms'
 * B0–B4 on Samuel Ramey's D#2–F4. The label is an unverified catalog field, so
 * it never outranks a closer range.
 */
export function relatedSingers(s: Singer, count = 6): Singer[] {
  return SINGERS.filter((o) => o.slug !== s.slug)
    .map((o) => ({
      o,
      distance: Math.abs(o.lowMidi - s.lowMidi) + Math.abs(o.highMidi - s.highMidi),
      otherLabel: o.voiceType === s.voiceType ? 0 : 1,
    }))
    .sort((a, b) => a.distance - b.distance || a.otherLabel - b.otherLabel)
    .slice(0, count)
    .map((x) => x.o);
}

/* ------------------------------------------------------------------ hubs --- */

/** Genres with enough singers to make a page worth having on its own. */
export const HUB_GENRE_MINIMUM = 8;

/**
 * Genre hubs that are live, by slug: one per entry in GENRE_HUB_COPY.
 *
 * A genre earns a hub by reaching HUB_GENRE_MINIMUM singers, and the hub is
 * published when its copy lands (lib/singer-hub-copy.test.tsx refuses a hub
 * without it, and a hub with copy but no route). From then on the count no
 * longer decides anything. The URL is in the sitemap and llms.txt, it is the
 * primary-genre link on its singers' profiles and another hub's contrast
 * link, and search engines have it indexed, so one profile removed or
 * regenred must not 404 all of that. Before this rule, each hub that sat on
 * the floor had to be named by hand (Grunge at 6, then Reggae at 8), and J-Pop
 * at 8 was one edit away from disappearing.
 *
 * Only a genre left with no singers at all drops out, since its page has
 * nothing to chart; the internal-linking tests then name every link it breaks.
 */
export const PUBLISHED_GENRE_HUBS: ReadonlySet<string> = new Set(
  Object.keys(GENRE_HUB_COPY),
);

/** The hub genres for a singer list: at the floor, or already published. */
export function hubGenresFor(list: readonly Pick<Singer, "genres">[]): string[] {
  const counts = new Map<string, number>();
  for (const s of list) {
    for (const g of s.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(
      ([g, n]) =>
        n >= HUB_GENRE_MINIMUM || PUBLISHED_GENRE_HUBS.has(genreSlug(g)),
    )
    .map(([g]) => g)
    .sort();
}

export const HUB_GENRES: string[] = hubGenresFor(SINGERS);

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
 *
 * Re-checked 2026-10-13. A bare title can also be an ordinary article on
 * something else (Prince, Pink, Brandy, V, Rosé), so the short description
 * must describe a person — a singer, musician or actor — or the title gets
 * an override.
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
  // Re-checked 2026-10-13. The bare title is an ordinary article on something
  // else (a royal title, a colour, a spirit, a letter, a wine). It has no
  // disambiguation pageprop and no name-list description, so both earlier
  // checks passed it. "Brandy (singer)" is only a redirect, so the article
  // itself is named.
  prince: "Prince (musician)",
  pink: "Pink (singer)",
  brandy: "Brandy Norwood",
  v: "V (singer)",
  rose: "Rosé (singer)",
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
