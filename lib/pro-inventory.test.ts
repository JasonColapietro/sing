import { describe, expect, it } from "vitest";
import { ATLAS, ATLAS_WORDS } from "./atlas-data";
import { BOOK, BOOK_WORDS } from "./book-data";
import { GLOSSARY_TERMS } from "./glossary";
import { SINGERS } from "./singers-data";
import { SONGS, PRO_SONGS } from "@/components/songs/data";
import { ALL_EXERCISES, EXERCISES, PRO_PACKS } from "@/components/warmups/exercises";
import {
  BOOKS,
  FREE_CHAPTERS,
  FREE_EXERCISES,
  GLOSSARY_COUNT,
  PRO_EXERCISES,
  PRO_PACK_COUNT,
  SINGER_COUNT,
  SONG_COUNT,
  TOTAL_CHAPTERS,
  TOTAL_EXERCISES,
  TOTAL_WORDS,
} from "./pro-inventory";

/**
 * Every number in `pro-inventory.ts` is a literal, so that a pricing page can
 * print it without dragging the whole songbook and the 420-singer table into
 * the client bundle. This is the thing that stops those literals from becoming
 * a lie: each one is re-derived here from the data that actually ships.
 *
 * A failure here is not a broken test, it is a pricing page that overstates
 * the product. Fix the number, not the assertion.
 */
describe("pro inventory matches what actually ships", () => {
  it("counts the books", () => {
    const measured = BOOKS.find((b) => b.title === "The Measured Voice")!;
    const atlas = BOOKS.find((b) => b.title === "The Voice Atlas")!;

    expect(measured.chapters).toBe(BOOK.length);
    expect(measured.words).toBe(BOOK_WORDS);
    expect(measured.free).toBe(BOOK.filter((c) => c.free).length);

    expect(atlas.chapters).toBe(ATLAS.length);
    expect(atlas.words).toBe(ATLAS_WORDS);
    expect(atlas.free).toBe(ATLAS.filter((c) => c.free).length);

    expect(TOTAL_CHAPTERS).toBe(BOOK.length + ATLAS.length);
    expect(TOTAL_WORDS).toBe(BOOK_WORDS + ATLAS_WORDS);
    expect(FREE_CHAPTERS).toBe(
      BOOK.filter((c) => c.free).length + ATLAS.filter((c) => c.free).length,
    );
  });

  it("counts the songs, and every one of them is free", () => {
    expect(SONG_COUNT).toBe(SONGS.length + PRO_SONGS.length);
    // The songbook was un-gated deliberately: six public-domain folk tunes
    // against twenty free ones was a paywall that argued against buying.
    expect(PRO_SONGS.length).toBe(0);
  });

  it("counts the warmups on both sides of the paywall", () => {
    const gated = PRO_PACKS.reduce((n, p) => n + p.exercises.length, 0);
    expect(FREE_EXERCISES).toBe(EXERCISES.length);
    expect(PRO_EXERCISES).toBe(gated);
    expect(PRO_PACK_COUNT).toBe(PRO_PACKS.length);
    expect(TOTAL_EXERCISES).toBe(ALL_EXERCISES.length);
  });

  it("counts the singers and the glossary", () => {
    expect(SINGER_COUNT).toBe(SINGERS.length);
    expect(GLOSSARY_COUNT).toBe(GLOSSARY_TERMS.length);
  });
});
