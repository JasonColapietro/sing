import type { Song } from "./types";

export type {
  LyricLine,
  Song,
  SongForm,
  SongGenre,
  SongNote,
  SongSection,
  SongSectionKind,
} from "./types";

/**
 * The free songbook. Every melody here is public domain — the `publicDomain`
 * field on each entry says why, because that is the constraint the whole
 * catalog is built around.
 *
 * The house style is one short opening phrase (`form: "phrase"`), looped four
 * times, so a practice rep stays tight and repeatable. Full multi-section
 * arrangements set `form: "full"` and `defaultLoops: 1`.
 */
export const SONGS: Song[] = [
  {
    id: "twinkle",
    slug: "twinkle-twinkle-little-star",
    title: "Twinkle Twinkle Little Star",
    origin: "Traditional (French melody, English lyrics 1806)",
    publicDomain:
      "Melody from the French air “Ah! vous dirai-je, Maman” (1761); English lyrics by Jane Taylor (1806). Both long out of copyright.",
    bpm: 100,
    beatsPerBar: 4,
    defaultKeyRootMidi: 60,
    form: "phrase",
    defaultLoops: 4,
    genre: "Nursery",
    era: "1700s",
    language: "English",
    tags: ["first song", "stepwise", "narrow range"],
    notes: [
      { midi: 60, startBeat: 0, durBeats: 1, lyric: "Twin", wordEnd: false },
      { midi: 60, startBeat: 1, durBeats: 1, lyric: "kle" },
      { midi: 67, startBeat: 2, durBeats: 1, lyric: "twin", wordEnd: false },
      { midi: 67, startBeat: 3, durBeats: 1, lyric: "kle" },
      { midi: 69, startBeat: 4, durBeats: 1, lyric: "lit", wordEnd: false },
      { midi: 69, startBeat: 5, durBeats: 1, lyric: "tle" },
      { midi: 67, startBeat: 6, durBeats: 2, lyric: "star" },
      { midi: 65, startBeat: 8, durBeats: 1, lyric: "how", line: 1 },
      { midi: 65, startBeat: 9, durBeats: 1, lyric: "I", line: 1 },
      { midi: 64, startBeat: 10, durBeats: 1, lyric: "won", line: 1, wordEnd: false },
      { midi: 64, startBeat: 11, durBeats: 1, lyric: "der", line: 1 },
      { midi: 62, startBeat: 12, durBeats: 1, lyric: "what", line: 1 },
      { midi: 62, startBeat: 13, durBeats: 1, lyric: "you", line: 1 },
      { midi: 60, startBeat: 14, durBeats: 2, lyric: "are", line: 1 },
    ],
  },
  {
    id: "ode-to-joy",
    slug: "ode-to-joy",
    title: "Ode to Joy",
    origin: "Beethoven, Symphony No. 9 (1824); hymn text 1907",
    publicDomain:
      "Beethoven’s melody dates from 1824 and he died in 1827; the “Joyful, joyful” hymn text by Henry van Dyke was published in 1907.",
    bpm: 120,
    beatsPerBar: 4,
    defaultKeyRootMidi: 60,
    form: "phrase",
    defaultLoops: 4,
    genre: "Classical",
    era: "1800s",
    language: "English",
    tags: ["stepwise", "narrow range", "hymn"],
    notes: [
      { midi: 64, startBeat: 0, durBeats: 1, lyric: "Joy", wordEnd: false },
      { midi: 64, startBeat: 1, durBeats: 1, lyric: "ful," },
      { midi: 65, startBeat: 2, durBeats: 1, lyric: "joy", wordEnd: false },
      { midi: 67, startBeat: 3, durBeats: 1, lyric: "ful," },
      { midi: 67, startBeat: 4, durBeats: 1, lyric: "we" },
      { midi: 65, startBeat: 5, durBeats: 1, lyric: "a", wordEnd: false },
      { midi: 64, startBeat: 6, durBeats: 1, lyric: "dore" },
      { midi: 62, startBeat: 7, durBeats: 2, lyric: "thee" },
    ],
  },
  {
    id: "row-row-row",
    slug: "row-row-row-your-boat",
    title: "Row Row Row Your Boat",
    origin: "Traditional (American round, published 1852)",
    publicDomain:
      "Traditional American round, in print since 1852 and never under active copyright.",
    bpm: 76,
    beatsPerBar: 3,
    defaultKeyRootMidi: 60,
    form: "phrase",
    defaultLoops: 4,
    genre: "Nursery",
    era: "1800s",
    language: "English",
    tags: ["round", "stepwise", "narrow range"],
    notes: [
      { midi: 60, startBeat: 0, durBeats: 1, lyric: "Row," },
      { midi: 60, startBeat: 1, durBeats: 1, lyric: "row," },
      { midi: 60, startBeat: 2, durBeats: 1, lyric: "row" },
      { midi: 62, startBeat: 3, durBeats: 1, lyric: "your" },
      { midi: 64, startBeat: 4, durBeats: 1, lyric: "boat," },
      { midi: 64, startBeat: 5, durBeats: 1, lyric: "gent", wordEnd: false },
      { midi: 62, startBeat: 6, durBeats: 1, lyric: "ly" },
      { midi: 64, startBeat: 7, durBeats: 1, lyric: "down" },
      { midi: 65, startBeat: 8, durBeats: 1, lyric: "the" },
      { midi: 67, startBeat: 9, durBeats: 2, lyric: "stream" },
    ],
  },
  {
    id: "mary-lamb",
    slug: "mary-had-a-little-lamb",
    title: "Mary Had a Little Lamb",
    origin: "Traditional (Sarah Josepha Hale, 1830)",
    publicDomain:
      "Lyrics published by Sarah Josepha Hale in 1830; the melody is a traditional tune of the same period.",
    bpm: 104,
    beatsPerBar: 4,
    defaultKeyRootMidi: 60,
    form: "phrase",
    defaultLoops: 4,
    genre: "Nursery",
    era: "1800s",
    language: "English",
    tags: ["first song", "stepwise", "narrow range"],
    notes: [
      { midi: 64, startBeat: 0, durBeats: 1, lyric: "Ma", wordEnd: false },
      { midi: 62, startBeat: 1, durBeats: 1, lyric: "ry" },
      { midi: 60, startBeat: 2, durBeats: 1, lyric: "had" },
      { midi: 62, startBeat: 3, durBeats: 1, lyric: "a" },
      { midi: 64, startBeat: 4, durBeats: 1, lyric: "lit", wordEnd: false },
      { midi: 64, startBeat: 5, durBeats: 1, lyric: "tle" },
      { midi: 64, startBeat: 6, durBeats: 1, lyric: "lamb," },
      { midi: 62, startBeat: 7, durBeats: 1, lyric: "lit", line: 1, wordEnd: false },
      { midi: 62, startBeat: 8, durBeats: 1, lyric: "tle", line: 1 },
      { midi: 62, startBeat: 9, durBeats: 1, lyric: "lamb,", line: 1 },
      { midi: 64, startBeat: 10, durBeats: 1, lyric: "lit", line: 1, wordEnd: false },
      { midi: 67, startBeat: 11, durBeats: 1, lyric: "tle", line: 1 },
      { midi: 67, startBeat: 12, durBeats: 2, lyric: "lamb", line: 1 },
    ],
  },
  {
    id: "frere-jacques",
    slug: "frere-jacques",
    title: "Frère Jacques",
    origin: "Traditional (French round, 18th century)",
    publicDomain:
      "Traditional French round, in circulation since the 18th century.",
    bpm: 120,
    beatsPerBar: 4,
    defaultKeyRootMidi: 60,
    form: "phrase",
    defaultLoops: 4,
    genre: "Nursery",
    era: "1700s",
    language: "French",
    tags: ["round", "stepwise", "narrow range"],
    notes: [
      { midi: 60, startBeat: 0, durBeats: 1, lyric: "Frè", wordEnd: false },
      { midi: 62, startBeat: 1, durBeats: 1, lyric: "re" },
      { midi: 64, startBeat: 2, durBeats: 1, lyric: "Jac", wordEnd: false },
      { midi: 60, startBeat: 3, durBeats: 1, lyric: "ques," },
      { midi: 60, startBeat: 4, durBeats: 1, lyric: "Frè", wordEnd: false },
      { midi: 62, startBeat: 5, durBeats: 1, lyric: "re" },
      { midi: 64, startBeat: 6, durBeats: 1, lyric: "Jac", wordEnd: false },
      { midi: 60, startBeat: 7, durBeats: 1, lyric: "ques" },
    ],
  },
  {
    id: "london-bridge",
    slug: "london-bridge-is-falling-down",
    title: "London Bridge Is Falling Down",
    origin: "Traditional (English nursery rhyme)",
    publicDomain:
      "Traditional English nursery rhyme, printed since the 18th century.",
    bpm: 104,
    beatsPerBar: 4,
    defaultKeyRootMidi: 60,
    form: "phrase",
    defaultLoops: 4,
    genre: "Nursery",
    era: "1700s",
    language: "English",
    tags: ["stepwise", "playground"],
    notes: [
      { midi: 67, startBeat: 0, durBeats: 1, lyric: "Lon", wordEnd: false },
      { midi: 69, startBeat: 1, durBeats: 1, lyric: "don" },
      { midi: 67, startBeat: 2, durBeats: 1, lyric: "Bridge" },
      { midi: 65, startBeat: 3, durBeats: 1, lyric: "is" },
      { midi: 64, startBeat: 4, durBeats: 1, lyric: "fall", wordEnd: false },
      { midi: 65, startBeat: 5, durBeats: 1, lyric: "ing" },
      { midi: 67, startBeat: 6, durBeats: 1, lyric: "down," },
      { midi: 62, startBeat: 7, durBeats: 1, lyric: "fall", line: 1, wordEnd: false },
      { midi: 64, startBeat: 8, durBeats: 1, lyric: "ing", line: 1 },
      { midi: 65, startBeat: 9, durBeats: 1, lyric: "down,", line: 1 },
      { midi: 67, startBeat: 10, durBeats: 1, lyric: "fall", line: 1, wordEnd: false },
      { midi: 64, startBeat: 11, durBeats: 1, lyric: "ing", line: 1 },
      { midi: 60, startBeat: 12, durBeats: 2, lyric: "down", line: 1 },
    ],
  },
];

/**
 * The Pro songbook — same house style, gated to Pro members.
 *
 * Membership in this array IS the paywall: `songs-client` refuses to start
 * anything that is not in `SONGS` unless Pro is active. Moving an entry
 * between the two arrays changes who can sing it, so treat the split as
 * access control, not as categorisation.
 *
 * Titles must stay exactly as the teaser cards spell them: the title is the
 * key best-scores are stored under.
 */
export const PRO_SONGS: Song[] = [
  {
    // Contour: rising step opening, phrase peak on "call" — Medium (span 14 st).
    id: "danny-boy",
    slug: "danny-boy",
    title: "Danny Boy",
    origin: "Traditional (Londonderry Air, publ. 1855); lyrics Frederic Weatherly, 1913",
    publicDomain:
      "The Londonderry Air melody was published in 1855; Frederic Weatherly’s lyrics date from 1913, before the 1929 US public-domain cutoff.",
    bpm: 63,
    beatsPerBar: 4,
    defaultKeyRootMidi: 60,
    form: "phrase",
    defaultLoops: 4,
    genre: "Folk",
    era: "1800s",
    language: "English",
    tags: ["ballad", "wide range", "legato"],
    notes: [
      { midi: 55, startBeat: 0, durBeats: 1, lyric: "Oh" },
      { midi: 60, startBeat: 1, durBeats: 1, lyric: "Dan", wordEnd: false },
      { midi: 62, startBeat: 2, durBeats: 1, lyric: "ny" },
      { midi: 64, startBeat: 3, durBeats: 2, lyric: "boy," },
      { midi: 64, startBeat: 5, durBeats: 1, lyric: "the" },
      { midi: 65, startBeat: 6, durBeats: 1, lyric: "pipes," },
      { midi: 64, startBeat: 7, durBeats: 1, lyric: "the" },
      { midi: 65, startBeat: 8, durBeats: 1, lyric: "pipes" },
      { midi: 67, startBeat: 9, durBeats: 1, lyric: "are" },
      { midi: 69, startBeat: 10, durBeats: 2, lyric: "call", wordEnd: false },
      { midi: 67, startBeat: 12, durBeats: 2, lyric: "ing" },
    ],
  },
  {
    // Long held tones over a gentle arch — Easy tempo, Medium reach to A4.
    id: "shenandoah",
    slug: "shenandoah",
    title: "Shenandoah",
    origin: "Traditional (American river shanty, early 1800s)",
    publicDomain:
      "Traditional American river shanty, collected and printed through the 19th century.",
    bpm: 66,
    beatsPerBar: 4,
    defaultKeyRootMidi: 60,
    form: "phrase",
    defaultLoops: 4,
    genre: "Sea Shanty",
    era: "1800s",
    language: "English",
    tags: ["ballad", "legato", "long tones"],
    notes: [
      { midi: 60, startBeat: 0, durBeats: 1, lyric: "Oh" },
      { midi: 64, startBeat: 1, durBeats: 1, lyric: "Shen", wordEnd: false },
      { midi: 65, startBeat: 2, durBeats: 1, lyric: "an", wordEnd: false },
      { midi: 67, startBeat: 3, durBeats: 2, lyric: "doah," },
      { midi: 67, startBeat: 5, durBeats: 1, lyric: "I" },
      { midi: 69, startBeat: 6, durBeats: 2, lyric: "long" },
      { midi: 67, startBeat: 8, durBeats: 1, lyric: "to" },
      { midi: 64, startBeat: 9, durBeats: 1, lyric: "hear" },
      { midi: 67, startBeat: 10, durBeats: 2, lyric: "you" },
    ],
  },
  {
    // Dorian: the raised sixth on "to" is the tune's signature color.
    id: "scarborough-fair",
    slug: "scarborough-fair",
    title: "Scarborough Fair",
    origin: "Traditional (English ballad, 17th century)",
    publicDomain:
      "Traditional English ballad, documented from the 17th century onward.",
    bpm: 96,
    beatsPerBar: 3,
    defaultKeyRootMidi: 62,
    form: "phrase",
    defaultLoops: 4,
    genre: "Folk",
    era: "1600s",
    language: "English",
    tags: ["ballad", "modal", "dorian"],
    notes: [
      { midi: 62, startBeat: 0, durBeats: 1, lyric: "Are" },
      { midi: 62, startBeat: 1, durBeats: 1, lyric: "you" },
      { midi: 69, startBeat: 2, durBeats: 2, lyric: "go", wordEnd: false },
      { midi: 69, startBeat: 4, durBeats: 1, lyric: "ing" },
      { midi: 71, startBeat: 5, durBeats: 1, lyric: "to" },
      { midi: 69, startBeat: 6, durBeats: 2, lyric: "Scar", wordEnd: false },
      { midi: 67, startBeat: 8, durBeats: 1, lyric: "bo", wordEnd: false },
      { midi: 64, startBeat: 9, durBeats: 1, lyric: "rough" },
      { midi: 62, startBeat: 10, durBeats: 3, lyric: "Fair?" },
    ],
  },
];

export const ALL_SONGS: Song[] = [...SONGS, ...PRO_SONGS];

/** Look up a song by its URL slug, across both books. */
export function songBySlug(slug: string): Song | undefined {
  return ALL_SONGS.find((s) => s.slug === slug);
}

/** Whether a song id belongs to the Pro-gated book. */
export function isProSong(id: string): boolean {
  return PRO_SONGS.some((s) => s.id === id);
}
