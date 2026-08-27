/**
 * What a subscriber gets, counted.
 *
 * These are literals rather than `SONGS.length` on purpose: every number here
 * is rendered on marketing surfaces that are client components, and importing
 * the arrays to measure them would pull the whole songbook, the 420-singer
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
    words: 31659,
    free: 3,
    pdfMb: 1.0,
    href: "/book",
  },
  {
    title: "The Voice Atlas",
    chapters: 27,
    words: 72394,
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

/** Warmup exercises, split by tier. */
export const FREE_EXERCISES = 17;
export const PRO_EXERCISES = 15;
export const PRO_PACK_COUNT = 2;
export const TOTAL_EXERCISES = FREE_EXERCISES + PRO_EXERCISES;

/** Singers with a measured range and a page of their own. Free to read. */
export const SINGER_COUNT = 636;

/** Terms defined in the free glossary. */
export const GLOSSARY_COUNT = 31;

/** Practice rooms, all free. */
export const ROOM_COUNT = 10;

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
      sub: `${TOTAL_CHAPTERS} chapters, open the moment you subscribe`,
    },
    {
      figure: String(SINGER_COUNT),
      label: "voices measured",
      sub: "The Atlas chapters that explain how to borrow them",
    },
    {
      figure: String(PRO_EXERCISES),
      label: "pro exercises",
      sub: `${PRO_PACK_COUNT} packs: belt prep and head-voice builders`,
    },
    {
      figure: "2",
      label: "PDFs to keep",
      sub: "Both books, downloadable, yours",
    },
  ];
