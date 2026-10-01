/**
 * Per-route `<meta name="keywords">` terms.
 *
 * In the App Router a child segment's `keywords` replaces its parent's instead
 * of merging, so every list here is complete on its own. Google ignores meta
 * keywords; their value is as a per-page target map, so the rules are:
 *
 * - One owner page per head term (see HEAD_TERM_OWNERS). No other page,
 *   static or data-driven, carries that exact term.
 * - Each list leads with the page's own primary term, has 3-10 terms, and
 *   ends with at most one brand term.
 * - Terms are lowercase phrases with punctuation stripped, so a comma inside a
 *   title never splits into fragments when the list is comma-joined.
 *
 * `lib/keywords.test.ts` enforces all of this.
 */

/** Hard cap on terms per page, brand included. */
export const MAX_TERMS = 10;

/** The one brand term a data-driven page appends after its own terms. */
const BRAND = "suede sing";

/**
 * Head terms and the single route that owns each. Search volumes are monthly
 * (US) estimates from the 2026-09 keyword review.
 */
export const HEAD_TERM_OWNERS: Readonly<Record<string, string>> = {
  "vocal range test": "/range", // 22,200, KD19
  "find my vocal range": "/range",
  "what is my vocal range": "/range",
  "how to find your vocal range": "/range", // 3,600, KD5
  "vocal range chart": "/singers", // 6,600
  "singers vocal range": "/singers",
  "famous singers vocal ranges": "/singers",
  "free vocal studio": "/",
  "pitch training": "/studio",
  "vocal warm up exercises": "/warmups",
  "learn to sing": "/learn",
  "free singing lessons online": "/learn",
  "free voice lessons": "/learn/voice",
  "singing book": "/book",
  "vocal range by voice type": "/atlas/vocal-range-by-voice-type",
  "voice types": "/atlas/vocal-range-by-voice-type",
  "can i sing this song": "/can-you-sing",
  "song vocal range": "/can-you-sing",
  "public domain songs to sing": "/songs",
  "singing app": "/voice",
};

export const ROUTE_KEYWORDS = {
  "/": [
    "free vocal studio",
    "online vocal studio",
    "singing practice app",
    "pitch detector for singing",
    "vocal training online",
    "singing exercises",
    "suede sing",
  ],
  "/range": [
    "vocal range test",
    "find my vocal range",
    "what is my vocal range",
    "how to find your vocal range",
    "vocal range finder",
    "singing range test",
    "voice range test",
    "vocal range calculator",
    "voice type test",
    "suede sing",
  ],
  "/voice": [
    "singing app",
    "vocal range test app",
    "pitch detector app",
    "vocal practice app",
    "singing app for iphone",
    "suede voice app",
  ],
  "/analyze": [
    "voice spectrogram",
    "voice analyzer",
    "vocal tone analyzer",
    "singing harmonics",
    "voice frequency analyzer",
    "suede sing",
  ],
  "/atlas": [
    "voice atlas",
    "famous singers tone and technique",
    "how famous singers sing",
    "singer vocal technique",
    "singers by genre",
    "suede sing",
  ],
  "/atlas/vocal-range-by-voice-type": [
    "vocal range by voice type",
    "voice types",
    "soprano alto tenor baritone bass range",
    "what is my voice type",
    "voice type ranges",
    "suede sing",
  ],
  "/book": [
    "singing book",
    "singing technique",
    "vocal training guide",
    "the measured voice",
    "voice science for singers",
    "suede sing",
  ],
  "/breath": [
    "breathing exercises for singers",
    "breath support singing",
    "breath control for singing",
    "singing breathing technique",
    "suede sing",
  ],
  "/can-you-sing": [
    "can i sing this song",
    "song vocal range",
    "songs for my vocal range",
    "popular songs vocal range",
    "song key finder for singers",
    "suede sing",
  ],
  "/changelog": [
    "suede sing changelog",
    "singing app updates",
    "vocal practice app release notes",
  ],
  "/contact": [
    "singer range correction",
    "contact suede sing",
  ],
  "/ear-training": [
    "ear training for singers",
    "pitch ear training",
    "interval training",
    "pitch matching game",
    "ear training games",
    "suede sing",
  ],
  "/extension": [
    "pitch detector chrome extension",
    "singing browser extension",
    "vocal coach chrome extension",
    "pitch tuner extension",
    "suede sing",
  ],
  "/glossary": [
    "singing glossary",
    "vocal terms",
    "singing terminology",
    "passaggio meaning",
    "tessitura meaning",
    "suede sing",
  ],
  "/learn": [
    "learn to sing",
    "free singing lessons online",
    "how to sing better",
    "vocal training plan",
    "singing practice plan for beginners",
    "suede sing",
  ],
  "/learn/voice": [
    "free voice lessons",
    "singing lessons online",
    "voice training curriculum",
    "free singing course",
    "beginner voice lessons",
    "suede sing",
  ],
  "/pro": [
    "ai vocal coach",
    "online vocal coach",
    "vocal coaching app",
    "singing coach subscription",
    "suede pro",
  ],
  "/programs": [
    "singing practice programs",
    "vocal training program",
    "singing practice routine",
    "multi week vocal training plan",
    "suede sing",
  ],
  "/progress": [
    "singing progress tracker",
    "vocal range progress",
    "pitch accuracy tracker",
    "singing practice streak",
    "suede sing",
  ],
  "/recorder": [
    "voice recorder for singing",
    "singing recorder",
    "record yourself singing",
    "vocal practice recorder",
    "suede sing",
  ],
  "/singers": [
    "vocal range chart",
    "singers vocal range",
    "famous singers vocal ranges",
    "singer vocal range comparison",
    "famous singers voice types",
    "suede sing",
  ],
  "/singers/methodology": [
    "singer vocal range sources",
    "how vocal ranges are measured",
    "why singer vocal ranges differ",
    "vocal range methodology",
    "suede sing",
  ],
  "/singers/records": [
    "widest vocal range",
    "highest note ever sung",
    "lowest note ever sung",
    "who has the widest vocal range",
    "suede sing",
  ],
  "/songs": [
    "public domain songs to sing",
    "songs to practice singing",
    "song lyrics and key",
    "singing practice songs",
    "suede sing",
  ],
  "/studio": [
    "pitch training",
    "real time pitch feedback",
    "pitch detector for singing practice",
    "sing in tune",
    "pitch training for singers",
    "suede sing",
  ],
  "/tools": [
    "singing practice tools",
    "online metronome",
    "online piano keyboard",
    "drone tone",
    "pitch pipe",
    "suede sing",
  ],
  "/warmups": [
    "vocal warm up exercises",
    "vocal warmups",
    "singing warm ups",
    "voice warm up",
    "suede sing",
  ],
} as const satisfies Record<string, readonly string[]>;

export type KeywordRoute = keyof typeof ROUTE_KEYWORDS;

export function routeKeywords(route: KeywordRoute): string[] {
  return [...ROUTE_KEYWORDS[route]];
}

/** Lowercase, strip punctuation, trim, drop empties and duplicates, cap at MAX_TERMS. */
export function normalizeKeywords(terms: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const raw of terms) {
    const t = (raw ?? "")
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      // Commas, colons, periods, quotes and the like would split or clutter a
      // comma-joined keywords tag; keep letters, digits, apostrophes, & and -.
      .replace(/[^\p{L}\p{N}\s'&-]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (t) seen.add(t);
  }
  return [...seen].slice(0, MAX_TERMS);
}

/** Page-specific terms first (head terms owned elsewhere removed), then one brand term. */
function pageKeywords(terms: readonly (string | null | undefined)[], route: string): string[] {
  const own = normalizeKeywords(terms).filter(
    (t) => !t.includes("suede") && (HEAD_TERM_OWNERS[t] ?? route) === route,
  );
  return [...own.slice(0, MAX_TERMS - 1), BRAND];
}

export function singerKeywords(s: {
  slug?: string;
  name: string;
  voiceType?: string | null;
}): string[] {
  const n = s.name;
  return pageKeywords(
    [
      `${n} vocal range`,
      `${n} voice type`,
      s.voiceType ? `${n} ${s.voiceType}` : null,
      `${n} highest note`,
      `${n} lowest note`,
      `${n} songs`,
    ],
    `/singers/${s.slug ?? ""}`,
  );
}

export function singerGenreKeywords(genre: string): string[] {
  return pageKeywords(
    [
      `${genre} singers vocal range`,
      `${genre} singers`,
      `famous ${genre} singers`,
      `best ${genre} vocalists`,
    ],
    `/singers/genre/${genre}`,
  );
}

export function singerVoiceTypeKeywords(voice: string): string[] {
  return pageKeywords(
    [
      `${voice} vocal range`,
      `famous ${voice} singers`,
      `${voice} voice type`,
      `${voice} range chart`,
    ],
    `/singers/voice-type/${voice}`,
  );
}

export function popSongKeywords(song: { slug?: string; title: string; artist: string }): string[] {
  return pageKeywords(
    [
      `${song.title} vocal range`,
      `${song.title} key`,
      `can i sing ${song.title}`,
      `${song.artist} ${song.title}`,
      `${song.title} highest note`,
    ],
    `/can-you-sing/${song.slug ?? ""}`,
  );
}

export function songKeywords(song: { slug?: string; title: string }): string[] {
  return pageKeywords(
    [
      `${song.title} lyrics`,
      `${song.title} key`,
      `${song.title} vocal range`,
      `sing ${song.title}`,
    ],
    `/songs/${song.slug ?? ""}`,
  );
}

export function chapterKeywords(chapterTitle: string, section: "atlas" | "book"): string[] {
  const extra =
    section === "atlas"
      ? ["voice atlas chapter", "how famous singers sing", "singer tone and technique"]
      : ["singing technique guide", "voice science for singers", "the measured voice"];
  return pageKeywords([chapterTitle, ...extra], `/${section}/chapter`);
}

/**
 * Voice-course pages: a stage ({ name }), a module ({ name, skill }) or a
 * lesson ({ name: lesson title, group: module name }).
 */
export function lessonKeywords(page: { name: string; skill?: string; group?: string }): string[] {
  return pageKeywords(
    [
      page.name,
      page.skill,
      page.group,
      `${page.group ?? page.name} voice lessons`,
      "free voice course",
    ],
    "/learn/voice/lesson",
  );
}
