"use client";

import Link from "next/link";
import { ATLAS_CONTENTS, ATLAS_TITLE } from "@/lib/atlas-data";
import { BOOK_CONTENTS, BOOK_TITLE } from "@/lib/book-data";
import {
  BOOKS,
  GLOSSARY_COUNT,
  PRO_EXERCISES,
  PRO_PACK_COUNT,
  ROOM_COUNT,
  SINGER_COUNT,
  SONG_COUNT,
  TOTAL_CHAPTERS,
  TOTAL_WORDS,
  UNLOCK_TILES,
} from "@/lib/pro-inventory";
import { SectionLabel } from "@/components/ui";

/**
 * What a subscriber gets the moment the payment clears.
 *
 * The tease this replaced was one line in the buy card — "Two books + PDFs:
 * The Measured Voice and The Voice Atlas" — carrying the largest asset in the
 * product. A stranger cannot weigh that sentence. Fifty chapter titles they
 * can see and cannot open is a different kind of argument, and every one of
 * those titles is already public metadata: `BOOK_CONTENTS` and
 * `ATLAS_CONTENTS` hold the titles and summaries with no chapter bodies, which
 * is exactly why the gated prose can stay on the server while the table of
 * contents ships to everyone.
 *
 * Nothing here is drip-fed and nothing is on a waitlist, so the section says
 * so. That matters more for a yearly plan than a monthly one: the buyer is
 * committing twelve months up front and is entitled to know that the library
 * is not a roadmap.
 */
export function UnlockStack() {
  return (
    <section
      id="unlocks"
      className="scroll-mt-20 border-t border-line"
      aria-labelledby="unlocks-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <SectionLabel className="mb-4 border-violet/50 text-violet-ink">
          Included, instantly
        </SectionLabel>
        <h2 id="unlocks-heading" className="max-w-2xl text-2xl sm:text-3xl">
          Everything below opens the second you subscribe
        </h2>
        <p className="mt-3 max-w-2xl text-mut">
          No drip feed, no unlock schedule, no chapter that arrives in month
          four. Both books open in full, both PDFs download, and the pro packs
          are in the warmup list on your next session.
        </p>

        {/* --- the numbers ------------------------------------------------ */}
        {/* A plain list rather than a <dl>: the description-list version needed
            an sr-only <dt> carrying the same words as the visible label, so a
            screen reader read every tile's label twice ("words, two books —
            82,734 words, two books"). Nothing here is a term/definition pair
            anyway; it is four figures. */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UNLOCK_TILES.map((tile) => (
            <li
              key={tile.label}
              className="rounded-2xl border border-line bg-panel p-5"
            >
              <p className="tabular text-4xl text-violet-ink">
                {tile.figure}
              </p>
              <p className="mt-1 text-sm text-ink">{tile.label}</p>
              <p className="mt-1.5 text-xs text-mut">{tile.sub}</p>
            </li>
          ))}
        </ul>

        {/* --- the table of contents -------------------------------------- */}
        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <BookContents
            title={BOOK_TITLE}
            href="/book"
            entries={BOOK_CONTENTS}
          />
          <BookContents
            title={ATLAS_TITLE}
            href="/atlas"
            entries={ATLAS_CONTENTS}
          />
        </div>

        <p className="mt-8 text-sm text-mut">
          {TOTAL_CHAPTERS} chapters, {TOTAL_WORDS.toLocaleString("en-US")} words.
          The unlocked ones are readable right now — start with{" "}
          <Link
            href="/book/when-numbers-lie"
            className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
          >
            When the numbers lie to you
          </Link>
          , which is free and is the chapter that decides whether any
          measurement on this site is worth anything.
        </p>

        {/* --- and the part that was always free -------------------------- */}
        <div className="mt-10 rounded-2xl border border-line bg-panel2/60 p-5 sm:p-6">
          <h3 className="text-lg">Already yours, without paying</h3>
          <p className="mt-2 text-sm text-mut">
            {ROOM_COUNT} practice rooms, {SONG_COUNT} songs, {SINGER_COUNT}{" "}
            measured voices, {GLOSSARY_COUNT} glossary terms and the range test
            are free and stay free. Pro adds {PRO_EXERCISES} exercises across{" "}
            {PRO_PACK_COUNT} packs, both books in full, pitch analysis on every
            take, and the long record of your own voice.
          </p>
        </div>
      </div>
    </section>
  );
}

interface ContentsEntry {
  slug: string;
  order: number;
  title: string;
  part: string;
  free: boolean;
  words: number;
}

function BookContents({
  title,
  href,
  entries,
}: {
  title: string;
  href: string;
  entries: readonly ContentsEntry[];
}) {
  const meta = BOOKS.find((b) => b.href === href);
  const free = entries.filter((e) => e.free).length;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-xl text-ink">{title}</h3>
        <span className="tabular font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          {entries.length} chapters
          <span className="mx-1.5 text-line2">·</span>
          {meta?.words.toLocaleString("en-US")} words
          {meta ? (
            <>
              <span className="mx-1.5 text-line2">·</span>
              {meta.pdfMb} MB PDF
            </>
          ) : null}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-mut">
        {free} readable now, {entries.length - free} with Pro.
      </p>

      <ol className="mt-4 divide-y divide-line border-y border-line">
        {entries.map((entry) => (
          <li key={entry.slug}>
            {entry.free ? (
              <Link
                href={`${href}/${entry.slug}`}
                className="flex items-baseline gap-3 py-2 outline-offset-2 hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-violet"
              >
                <span className="tabular w-6 shrink-0 font-mono text-[11px] text-violet-ink">
                  {entry.order}
                </span>
                <span className="min-w-0 flex-1 text-sm text-ink">
                  {entry.title}
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-violet-ink">
                  Free
                </span>
              </Link>
            ) : (
              /* Not a link, and not a button: there is nothing to open. Making
                 a locked title clickable to /pro from a page that *is* /pro
                 sends the reader in a circle. */
              <div className="flex items-baseline gap-3 py-2">
                <span className="tabular w-6 shrink-0 font-mono text-[11px] text-dim">
                  {entry.order}
                </span>
                <span className="min-w-0 flex-1 text-sm text-mut">
                  {entry.title}
                </span>
                <LockGlyph />
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function LockGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0 text-dim"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      role="img"
      aria-label="Included with Pro"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
