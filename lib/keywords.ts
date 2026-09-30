/**
 * Per-route `<meta name="keywords">` terms.
 *
 * In the App Router a child segment's `keywords` replaces its parent's instead
 * of merging, so every list here is complete on its own. Terms are real search
 * phrasing for what each page actually offers, lowercase, 5-12 per page.
 * `lib/keywords.test.ts` fails when a routed page ships metadata without them.
 */

/** Always-relevant terms a data-driven page appends after its own. */
const BASE = [
  "vocal range test",
  "find my vocal range",
  "suede sing",
] as const;

export const ROUTE_KEYWORDS = {
  "/": [
    "vocal range test",
    "what is my vocal range",
    "vocal range finder",
    "find my vocal range",
    "singing range test",
    "pitch training",
    "vocal warm up exercises",
    "online vocal studio",
    "suede sing",
    "suede ai",
  ],
  "/range": [
    "vocal range test",
    "what is my vocal range",
    "vocal range finder",
    "find my vocal range",
    "singing range test",
    "voice range test",
    "vocal range calculator",
    "how to find your vocal range",
    "vocal range test app",
    "suede sing",
  ],
  "/voice": [
    "vocal range test app",
    "vocal range test",
    "find my vocal range",
    "pitch detector app",
    "singing app",
    "vocal exercises",
    "singers vocal range",
    "suede voice vocal range test",
    "suede sing",
  ],
  "/analyze": [
    "voice spectrogram",
    "voice analyzer",
    "vocal tone analyzer",
    "singing harmonics",
    "voice frequency analyzer",
    "vocal range test",
    "suede sing",
  ],
  "/atlas": [
    "singers vocal range",
    "famous singers vocal ranges",
    "vocal range chart",
    "voice types",
    "singing technique",
    "vocal range test",
    "suede sing",
  ],
  "/atlas/vocal-range-by-voice-type": [
    "vocal range chart",
    "vocal range by voice type",
    "voice types",
    "soprano alto tenor baritone bass range",
    "what is my voice type",
    "vocal range test",
    "what is my vocal range",
    "suede sing",
  ],
  "/book": [
    "singing book",
    "learn to sing",
    "singing technique",
    "vocal training guide",
    "vocal range",
    "vocal range test",
    "suede sing",
  ],
  "/breath": [
    "breathing exercises for singers",
    "breath support singing",
    "breath control for singing",
    "singing breathing technique",
    "vocal warm up exercises",
    "suede sing",
  ],
  "/can-you-sing": [
    "can i sing this song",
    "song vocal range",
    "songs for my vocal range",
    "vocal range test",
    "what is my vocal range",
    "find my vocal range",
    "suede sing",
  ],
  "/changelog": [
    "suede sing changelog",
    "suede sing updates",
    "vocal range test",
    "singing app",
    "vocal training app",
    "suede ai",
  ],
  "/contact": [
    "contact suede sing",
    "suede sing support",
    "suede ai",
    "vocal range test",
    "singing app",
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
    "vocal range test extension",
    "pitch detector chrome extension",
    "singing browser extension",
    "vocal range finder",
    "vocal range test",
    "suede sing",
  ],
  "/glossary": [
    "singing glossary",
    "vocal terms",
    "singing terminology",
    "voice types",
    "vocal range",
    "vocal range test",
    "suede sing",
  ],
  "/learn": [
    "singing lessons",
    "free singing lessons online",
    "how to sing better",
    "learn to sing",
    "vocal range test",
    "vocal warm up exercises",
    "suede sing",
  ],
  "/learn/voice": [
    "free voice lessons",
    "singing lessons online",
    "voice training curriculum",
    "learn to sing",
    "vocal exercises",
    "vocal range test",
    "suede sing",
  ],
  "/pro": [
    "suede pro",
    "ai vocal coach",
    "online vocal coach",
    "singing lessons online",
    "vocal range test",
    "suede sing",
  ],
  "/programs": [
    "singing practice plan",
    "vocal training program",
    "singing practice routine",
    "vocal warm up exercises",
    "vocal range test",
    "suede sing",
  ],
  "/progress": [
    "singing progress tracker",
    "vocal range progress",
    "pitch accuracy",
    "singing practice streak",
    "vocal range test",
    "suede sing",
  ],
  "/recorder": [
    "voice recorder for singing",
    "singing recorder",
    "record yourself singing",
    "vocal practice recorder",
    "vocal range test",
    "suede sing",
  ],
  "/singers": [
    "singers vocal range",
    "famous singers vocal ranges",
    "vocal range chart",
    "singer vocal range comparison",
    "voice types",
    "vocal range test",
    "what is my vocal range",
    "suede sing",
  ],
  "/singers/methodology": [
    "singer vocal range sources",
    "how vocal ranges are measured",
    "singers vocal range",
    "vocal range chart",
    "vocal range test",
    "suede sing",
  ],
  "/singers/records": [
    "widest vocal range",
    "highest note ever sung",
    "lowest note ever sung",
    "singers vocal range",
    "vocal range chart",
    "vocal range test",
    "suede sing",
  ],
  "/songs": [
    "public domain songs to sing",
    "songs to practice singing",
    "song lyrics and key",
    "song vocal range",
    "singing practice songs",
    "vocal range test",
    "suede sing",
  ],
  "/studio": [
    "pitch training",
    "real time pitch feedback",
    "pitch detector for singing",
    "sing in tune",
    "vocal range test",
    "suede sing",
  ],
  "/tools": [
    "singing practice tools",
    "online metronome",
    "online piano keyboard",
    "drone tone",
    "pitch pipe",
    "vocal range test",
    "suede sing",
  ],
  "/warmups": [
    "vocal warm up exercises",
    "vocal warmups",
    "singing warm ups",
    "voice warm up",
    "vocal exercises",
    "vocal range test",
    "suede sing",
  ],
} as const satisfies Record<string, readonly string[]>;

export type KeywordRoute = keyof typeof ROUTE_KEYWORDS;

export function routeKeywords(route: KeywordRoute): string[] {
  return [...ROUTE_KEYWORDS[route]];
}

/** Lowercase, trim, drop empties and duplicates, cap at 12 terms. */
export function normalizeKeywords(terms: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const raw of terms) {
    const t = (raw ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    if (t) seen.add(t);
  }
  return [...seen].slice(0, 12);
}

export function singerKeywords(s: {
  name: string;
  voiceType?: string | null;
  genres?: readonly string[];
  signatureSong?: string | null;
}): string[] {
  const n = s.name;
  return normalizeKeywords([
    `${n} vocal range`,
    `${n} voice type`,
    s.voiceType ? `${n} ${s.voiceType}` : null,
    `${n} highest note`,
    `${n} lowest note`,
    s.signatureSong ? `${s.signatureSong} vocal range` : null,
    "singers vocal range",
    "vocal range chart",
    ...BASE,
  ]);
}

export function singerGenreKeywords(genre: string): string[] {
  return normalizeKeywords([
    `${genre} singers vocal range`,
    `${genre} singers`,
    `famous ${genre} singers`,
    "singers vocal range",
    "vocal range chart",
    ...BASE,
  ]);
}

export function singerVoiceTypeKeywords(voice: string): string[] {
  return normalizeKeywords([
    `${voice} vocal range`,
    `famous ${voice} singers`,
    `${voice} voice type`,
    "voice types",
    "singers vocal range",
    "vocal range chart",
    ...BASE,
  ]);
}

export function popSongKeywords(song: { title: string; artist: string; key?: string | null }): string[] {
  return normalizeKeywords([
    `${song.title} vocal range`,
    `${song.title} key`,
    `can i sing ${song.title}`,
    `${song.artist} ${song.title}`,
    `${song.artist} vocal range`,
    "song vocal range",
    ...BASE,
  ]);
}

export function songKeywords(song: { title: string; tonic?: string | null }): string[] {
  return normalizeKeywords([
    `${song.title} lyrics`,
    `${song.title} key`,
    `${song.title} vocal range`,
    `sing ${song.title}`,
    "public domain songs to sing",
    "song vocal range",
    ...BASE,
  ]);
}

export function chapterKeywords(chapterTitle: string, section: "atlas" | "book"): string[] {
  const extra =
    section === "atlas"
      ? ["singers vocal range", "vocal range chart", "singing technique"]
      : ["singing book", "singing technique", "learn to sing"];
  return normalizeKeywords([chapterTitle, ...extra, ...BASE]);
}

export function lessonKeywords(...names: string[]): string[] {
  return normalizeKeywords([
    ...names,
    "free singing lessons online",
    "voice lessons",
    "vocal exercises",
    "learn to sing",
    ...BASE,
  ]);
}
