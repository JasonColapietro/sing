/**
 * What a subscriber gets, counted.
 *
 * These are literals rather than `SONGS.length` on purpose: every number here
 * is rendered on marketing surfaces that are client components, and importing
 * the arrays to measure them would pull the whole songbook, the 636-singer
 * table and both books' contents into the bundle just to print an integer.
 * `lib/book-data.ts` already takes this approach with BOOK_WORDS.
 *
 * Literals drift, so `pro-inventory.test.ts` re-derives every one of them from
 * the real data and fails the build when they disagree. A number on a pricing
 * page that overstates what ships is worse than no number: the subscriber can
 * check it in ten seconds, and the one they catch poisons the ones that were
 * true.
 *
 * Rules for anything added here: it must be verifiable from a file in this
 * repo, and it must be a thing that exists *today*. No cadence promises — the
 * catalogues are checked-in arrays, so "new songs every week" is a claim only
 * a weekly deploy could keep.
 */

export interface BookInventory {
  title: string;
  chapters: number;
  words: number;
  /** Chapters readable without paying. */
  free: number;
  /** Approximate PDF size, for "yours to keep". */
  pdfMb: number;
  href: string;
}

export const BOOKS: BookInventory[] = [
  {
    title: "The Measured Voice",
    chapters: 23,
    words: 33092,
    free: 3,
    pdfMb: 1.0,
    href: "/book",
  },
  {
    title: "The Voice Atlas",
    chapters: 27,
    words: 72505,
    free: 3,
    pdfMb: 5.0,
    href: "/atlas",
  },
];

export const TOTAL_CHAPTERS = BOOKS.reduce((n, b) => n + b.chapters, 0);
export const TOTAL_WORDS = BOOKS.reduce((n, b) => n + b.words, 0);
export const FREE_CHAPTERS = BOOKS.reduce((n, b) => n + b.free, 0);

/** Songs in the practice catalogue. All public domain, all free. */
export const SONG_COUNT = 26;

/**
 * Distinct melodies behind those songs. Two catalogue entries are longer
 * arrangements of a melody that is already in the list (`arrangementOf`), so
 * /songs counts melodies, and any copy that says "melodies" has to use this
 * number rather than SONG_COUNT.
 */
export const MELODY_COUNT = 24;

/** Warmup exercises, split by tier. */
export const FREE_EXERCISES = 39;
export const PRO_EXERCISES = 19;
export const PRO_PACK_COUNT = 3;
export const TOTAL_EXERCISES = FREE_EXERCISES + PRO_EXERCISES;

/**
 * Where the Pro packs start on /warmups: the id on the first Pro routine card.
 * The packs render after every free routine, about eight phone screens down,
 * so a buyer told to sing a pro warmup is sent straight to them rather than
 * to a page whose only start button on screen runs a free set.
 */
export const PRO_PACKS_ANCHOR = "pro-packs";
export const PRO_PACKS_HREF = `/warmups#${PRO_PACKS_ANCHOR}`;

/**
 * Singers with a reported range and a page of their own. Free to read. The
 * ranges are cited catalog spans, not measurements we took, so copy built on
 * this number says "reported" or "singer ranges", never "measured".
 */
export const SINGER_COUNT = 636;

/** Singer entries in The Voice Atlas's genre chapters, one per profile. */
export const ATLAS_VOICE_COUNT = 636;

/**
 * Terms defined in the free glossary on this site. The shared set is larger:
 * the guitar senses live in it too, and the guitar hub publishes those, so
 * counting them here would promise a singer pages this site does not have.
 */
export const GLOSSARY_COUNT = 42;

/** Practice rooms, all free. */
export const ROOM_COUNT = 10;

/**
 * Guided programs at /programs. Week 1 of a Pro program is free (FREE_WEEKS
 * in lib/programs.ts); the weeks after it need Pro. /pro's "Exactly where
 * free ends" table has to say so, or a free singer meets the day-8 wall
 * after reading "no asterisks".
 */
export const PRO_PROGRAM_NAMES: readonly string[] = [
  "Mix in 4 weeks",
  "The Measured Voice: 12 weeks",
];
export const PRO_PROGRAM_COUNT = PRO_PROGRAM_NAMES.length;
export const FREE_PROGRAM_COUNT = 4;

/**
 * The headline tiles under the buy button.
 *
 * Ordered deliberately: the recurring value first and the PDFs last. The PDFs
 * are the highest perceived value and the most extractable thing here — a
 * subscriber can download both on day one — so leading with "4.6 MB of PDF,
 * yours to keep" reads as an instruction to subscribe, download and cancel.
 */
export const UNLOCK_TILES: Array<{ figure: string; label: string; sub: string }> =
  [
    {
      figure: TOTAL_WORDS.toLocaleString("en-US"),
      label: "words, two books",
      sub: `${TOTAL_CHAPTERS} chapters, open the moment you upgrade`,
    },
    // The Atlas profiles, not the ranges: every singer page and its range is
    // free, and the same section's "Already yours" box says so. A tile under
    // "opens the second you upgrade" that counted them sold a free asset.
    {
      figure: String(ATLAS_VOICE_COUNT),
      label: "Atlas singer profiles",
      sub: "Tone and technique for each voice; the ranges stay free on every singer page",
    },
    {
      figure: String(PRO_EXERCISES),
      label: "pro exercises",
      sub: `${PRO_PACK_COUNT} packs: belt prep, head voice and mix`,
    },
    {
      figure: "2",
      label: "PDFs to keep",
      sub: "Both books, downloadable, yours",
    },
  ];
