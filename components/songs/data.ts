export interface SongNote {
  midi: number;
  startBeat: number;
  durBeats: number;
  lyric: string;
}

export interface Song {
  id: string;
  title: string;
  origin: string;
  bpm: number;
  /** Tonic pitch of the key the melody is transcribed in. */
  defaultKeyRootMidi: number;
  notes: SongNote[];
}

/**
 * Six public-domain songs, each transcribed as one short opening phrase
 * (not a full verse) so the practice loop stays tight and repeatable.
 */
export const SONGS: Song[] = [
  {
    id: "twinkle",
    title: "Twinkle Twinkle Little Star",
    origin: "Traditional (French melody, English lyrics 1806)",
    bpm: 100,
    defaultKeyRootMidi: 60,
    notes: [
      { midi: 60, startBeat: 0, durBeats: 1, lyric: "Twin" },
      { midi: 60, startBeat: 1, durBeats: 1, lyric: "kle" },
      { midi: 67, startBeat: 2, durBeats: 1, lyric: "twin" },
      { midi: 67, startBeat: 3, durBeats: 1, lyric: "kle" },
      { midi: 69, startBeat: 4, durBeats: 1, lyric: "lit" },
      { midi: 69, startBeat: 5, durBeats: 1, lyric: "tle" },
      { midi: 67, startBeat: 6, durBeats: 2, lyric: "star" },
      { midi: 65, startBeat: 8, durBeats: 1, lyric: "how" },
      { midi: 65, startBeat: 9, durBeats: 1, lyric: "I" },
      { midi: 64, startBeat: 10, durBeats: 1, lyric: "won" },
      { midi: 64, startBeat: 11, durBeats: 1, lyric: "der" },
      { midi: 62, startBeat: 12, durBeats: 1, lyric: "what" },
      { midi: 62, startBeat: 13, durBeats: 1, lyric: "you" },
      { midi: 60, startBeat: 14, durBeats: 2, lyric: "are" },
    ],
  },
  {
    id: "ode-to-joy",
    title: "Ode to Joy",
    origin: "Beethoven, Symphony No. 9 (1824); hymn text 1907",
    bpm: 120,
    defaultKeyRootMidi: 60,
    notes: [
      { midi: 64, startBeat: 0, durBeats: 1, lyric: "Joy" },
      { midi: 64, startBeat: 1, durBeats: 1, lyric: "ful," },
      { midi: 65, startBeat: 2, durBeats: 1, lyric: "joy" },
      { midi: 67, startBeat: 3, durBeats: 1, lyric: "ful," },
      { midi: 67, startBeat: 4, durBeats: 1, lyric: "we" },
      { midi: 65, startBeat: 5, durBeats: 1, lyric: "a" },
      { midi: 64, startBeat: 6, durBeats: 1, lyric: "dore" },
      { midi: 62, startBeat: 7, durBeats: 2, lyric: "thee" },
    ],
  },
  {
    id: "row-row-row",
    title: "Row Row Row Your Boat",
    origin: "Traditional (American round, published 1852)",
    bpm: 76,
    defaultKeyRootMidi: 60,
    notes: [
      { midi: 60, startBeat: 0, durBeats: 1, lyric: "Row," },
      { midi: 60, startBeat: 1, durBeats: 1, lyric: "row," },
      { midi: 60, startBeat: 2, durBeats: 1, lyric: "row" },
      { midi: 62, startBeat: 3, durBeats: 1, lyric: "your" },
      { midi: 64, startBeat: 4, durBeats: 1, lyric: "boat," },
      { midi: 64, startBeat: 5, durBeats: 1, lyric: "gent" },
      { midi: 62, startBeat: 6, durBeats: 1, lyric: "ly" },
      { midi: 64, startBeat: 7, durBeats: 1, lyric: "down" },
      { midi: 65, startBeat: 8, durBeats: 1, lyric: "the" },
      { midi: 67, startBeat: 9, durBeats: 2, lyric: "stream" },
    ],
  },
  {
    id: "mary-lamb",
    title: "Mary Had a Little Lamb",
    origin: "Traditional (Sarah Josepha Hale, 1830)",
    bpm: 104,
    defaultKeyRootMidi: 60,
    notes: [
      { midi: 64, startBeat: 0, durBeats: 1, lyric: "Ma" },
      { midi: 62, startBeat: 1, durBeats: 1, lyric: "ry" },
      { midi: 60, startBeat: 2, durBeats: 1, lyric: "had" },
      { midi: 62, startBeat: 3, durBeats: 1, lyric: "a" },
      { midi: 64, startBeat: 4, durBeats: 1, lyric: "lit" },
      { midi: 64, startBeat: 5, durBeats: 1, lyric: "tle" },
      { midi: 64, startBeat: 6, durBeats: 1, lyric: "lamb," },
      { midi: 62, startBeat: 7, durBeats: 1, lyric: "lit" },
      { midi: 62, startBeat: 8, durBeats: 1, lyric: "tle" },
      { midi: 62, startBeat: 9, durBeats: 1, lyric: "lamb," },
      { midi: 64, startBeat: 10, durBeats: 1, lyric: "lit" },
      { midi: 67, startBeat: 11, durBeats: 1, lyric: "tle" },
      { midi: 67, startBeat: 12, durBeats: 2, lyric: "lamb" },
    ],
  },
  {
    id: "frere-jacques",
    title: "Frère Jacques",
    origin: "Traditional (French round, 18th century)",
    bpm: 120,
    defaultKeyRootMidi: 60,
    notes: [
      { midi: 60, startBeat: 0, durBeats: 1, lyric: "Frè" },
      { midi: 62, startBeat: 1, durBeats: 1, lyric: "re" },
      { midi: 64, startBeat: 2, durBeats: 1, lyric: "Jac" },
      { midi: 60, startBeat: 3, durBeats: 1, lyric: "ques," },
      { midi: 60, startBeat: 4, durBeats: 1, lyric: "Frè" },
      { midi: 62, startBeat: 5, durBeats: 1, lyric: "re" },
      { midi: 64, startBeat: 6, durBeats: 1, lyric: "Jac" },
      { midi: 60, startBeat: 7, durBeats: 1, lyric: "ques" },
    ],
  },
  {
    id: "london-bridge",
    title: "London Bridge Is Falling Down",
    origin: "Traditional (English nursery rhyme)",
    bpm: 104,
    defaultKeyRootMidi: 60,
    notes: [
      { midi: 67, startBeat: 0, durBeats: 1, lyric: "Lon" },
      { midi: 69, startBeat: 1, durBeats: 1, lyric: "don" },
      { midi: 67, startBeat: 2, durBeats: 1, lyric: "Bridge" },
      { midi: 65, startBeat: 3, durBeats: 1, lyric: "is" },
      { midi: 64, startBeat: 4, durBeats: 1, lyric: "fall" },
      { midi: 65, startBeat: 5, durBeats: 1, lyric: "ing" },
      { midi: 67, startBeat: 6, durBeats: 1, lyric: "down," },
      { midi: 62, startBeat: 7, durBeats: 1, lyric: "fall" },
      { midi: 64, startBeat: 8, durBeats: 1, lyric: "ing" },
      { midi: 65, startBeat: 9, durBeats: 1, lyric: "down," },
      { midi: 67, startBeat: 10, durBeats: 1, lyric: "fall" },
      { midi: 64, startBeat: 11, durBeats: 1, lyric: "ing" },
      { midi: 60, startBeat: 12, durBeats: 2, lyric: "down" },
    ],
  },
];

/**
 * The Pro songbook — same one-phrase house style, gated to Pro members.
 * Titles must stay exactly as the teaser cards spelled them: the title is
 * the key best-scores are stored under.
 */
export const PRO_SONGS: Song[] = [
  {
    // Contour: rising step opening, phrase peak on "call" — Medium (span 14 st).
    id: "danny-boy",
    title: "Danny Boy",
    origin: "Traditional (Londonderry Air, publ. 1855); lyrics Frederic Weatherly, 1913",
    bpm: 63,
    defaultKeyRootMidi: 60,
    notes: [
      { midi: 55, startBeat: 0, durBeats: 1, lyric: "Oh" },
      { midi: 60, startBeat: 1, durBeats: 1, lyric: "Dan" },
      { midi: 62, startBeat: 2, durBeats: 1, lyric: "ny" },
      { midi: 64, startBeat: 3, durBeats: 2, lyric: "boy," },
      { midi: 64, startBeat: 5, durBeats: 1, lyric: "the" },
      { midi: 65, startBeat: 6, durBeats: 1, lyric: "pipes," },
      { midi: 64, startBeat: 7, durBeats: 1, lyric: "the" },
      { midi: 65, startBeat: 8, durBeats: 1, lyric: "pipes" },
      { midi: 67, startBeat: 9, durBeats: 1, lyric: "are" },
      { midi: 69, startBeat: 10, durBeats: 2, lyric: "call" },
      { midi: 67, startBeat: 12, durBeats: 2, lyric: "ing" },
    ],
  },
  {
    // Long held tones over a gentle arch — Easy tempo, Medium reach to A4.
    id: "shenandoah",
    title: "Shenandoah",
    origin: "Traditional (American river shanty, early 1800s)",
    bpm: 66,
    defaultKeyRootMidi: 60,
    notes: [
      { midi: 60, startBeat: 0, durBeats: 1, lyric: "Oh" },
      { midi: 64, startBeat: 1, durBeats: 1, lyric: "Shen" },
      { midi: 65, startBeat: 2, durBeats: 1, lyric: "an" },
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
    title: "Scarborough Fair",
    origin: "Traditional (English ballad, 17th century)",
    bpm: 96,
    defaultKeyRootMidi: 62,
    notes: [
      { midi: 62, startBeat: 0, durBeats: 1, lyric: "Are" },
      { midi: 62, startBeat: 1, durBeats: 1, lyric: "you" },
      { midi: 69, startBeat: 2, durBeats: 2, lyric: "go" },
      { midi: 69, startBeat: 4, durBeats: 1, lyric: "ing" },
      { midi: 71, startBeat: 5, durBeats: 1, lyric: "to" },
      { midi: 69, startBeat: 6, durBeats: 2, lyric: "Scar" },
      { midi: 67, startBeat: 8, durBeats: 1, lyric: "bo" },
      { midi: 64, startBeat: 9, durBeats: 1, lyric: "rough" },
      { midi: 62, startBeat: 10, durBeats: 3, lyric: "Fair?" },
    ],
  },
];

export const ALL_SONGS: Song[] = [...SONGS, ...PRO_SONGS];
