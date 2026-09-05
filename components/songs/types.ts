/**
 * The songbook's shared shape.
 *
 * `notes` stays a flat, time-ordered array because the player's audio-clock
 * scheduler, the piano roll, and the per-note scoring all index into it
 * positionally. Structure (lyric lines, sections) is layered on top by
 * referring to note indices or beat positions rather than nesting notes, so
 * adding structure never changes what index a note has.
 */

/**
 * Which of the two songs-room session modes a run was sung in: "rehearsal"
 * loops until the singer stops, "performance" runs the planned loops once and
 * scores them.
 */
export type SessionMode = "rehearsal" | "performance";

export interface SongNote {
  midi: number;
  startBeat: number;
  durBeats: number;
  /** One syllable, as it should be printed in the lyric line. */
  lyric: string;
  /**
   * Which lyric line this syllable belongs to. Absent means line 0, so a
   * single-phrase song needs no annotation at all.
   */
  line?: number;
  /**
   * False when the next syllable continues the same word ("Twin" -> "kle").
   * Absent means true: the word ends here. Defaulting to "ends" keeps older
   * entries readable — they render one word per syllable rather than
   * silently gluing the whole line together.
   */
  wordEnd?: boolean;
}

export type SongSectionKind =
  | "intro"
  | "verse"
  | "prechorus"
  | "chorus"
  | "refrain"
  | "bridge"
  | "outro";

/** A named span of the beat timeline, used for section labels and A–B looping. */
export interface SongSection {
  kind: SongSectionKind;
  /** Printed label, e.g. "Verse 1", "Chorus". */
  label: string;
  startBeat: number;
  endBeat: number;
}

export type SongGenre =
  | "Folk"
  | "Traditional"
  | "Hymn"
  | "Spiritual"
  | "Classical"
  | "Sea Shanty"
  | "Nursery"
  | "Patriotic"
  | "Christmas"
  | "Blues"
  | "Musical";

/**
 * "phrase" is the house style: one short opening phrase, looped so the
 * practice rep stays tight. "full" is a complete multi-section arrangement
 * sung once through, for singers who want the whole thing.
 */
export type SongForm = "phrase" | "full";

export interface Song {
  id: string;
  /** URL segment for /songs/[slug]. Stable; changing one breaks a live URL. */
  slug: string;
  title: string;
  /** Attribution line: composer, first publication, or tradition. */
  origin: string;
  /**
   * Why this melody is free to use. Every song in the book is public domain;
   * this states the specific reason so the per-song page can show its work.
   */
  publicDomain: string;
  bpm: number;
  /** Beats per bar, for count-in and bar lines. */
  beatsPerBar: number;
  /** Tonic pitch of the key the melody is transcribed in. */
  defaultKeyRootMidi: number;
  form: SongForm;
  /** How many times through by default: 4 to drill a phrase, 1 for a full arrangement. */
  defaultLoops: number;
  genre: SongGenre;
  /** Rough vintage, for browsing: "Traditional", "1700s", "1800s", "1900s". */
  era: string;
  language: string;
  /** Free-text browse tags, lowercase, e.g. "round", "lullaby", "wide range". */
  tags: string[];
  notes: SongNote[];
  /** Absent on a single-phrase song; present on full arrangements. */
  sections?: SongSection[];
  /**
   * For a "full" arrangement, the id of the "phrase" version of the same
   * melody, so the two can link to each other.
   */
  arrangementOf?: string;
}

/** One printed line of lyrics, resolved from the notes that carry it. */
export interface LyricLine {
  index: number;
  /** Indices into the song's `notes` array, in time order. */
  noteIndices: number[];
  startBeat: number;
  endBeat: number;
  /** The line as printed, with syllables joined per `wordEnd`. */
  text: string;
}
