"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ATLAS_CONTENTS, ATLAS_TITLE } from "@/lib/atlas-data";
import { BOOK_CONTENTS, BOOK_TITLE } from "@/lib/book-data";
import { ATLAS_PROFILES_NOTE, BOOKS, PRO_PROGRAM_COUNT } from "@/lib/pro-inventory";
import { useProReady, useProState } from "@/lib/pro";
import { SectionLabel } from "@/components/ui";
import { BookCover, type CoverMotif } from "@/components/book/cover";
import { AUTHOR_NAME } from "@/lib/author";
import { Claim } from "./claim";

/**
 * What a buyer gets the moment the payment clears, each thing drawn once: the
 * two books as their covers beside their free chapters, a real pro pack card,
 * and the perks with nothing more to draw. The showcase above the buy card
 * keeps only the charts and the take drawing; the rest of "what Pro adds"
 * lives here, so the card is not a showcase's length down the page.
 *
 * Rules:
 * - Every chapter title is public metadata (BOOK_CONTENTS, ATLAS_CONTENTS
 *   hold no chapter bodies), so the contents ship to everyone while the gated
 *   prose stays on the server. The titles are read from that data, never
 *   typed here.
 * - Figures come from lib/pro-inventory.ts and each is stated once here: the
 *   totals in the "book" and "warmups" perk sentences, each book's own under
 *   its title. No numeral tiles repeating them.
 * - `pack` is the server-rendered pack card (components/pro/pack-sample.tsx):
 *   it reads the exercise catalogue, which this client bundle must not carry.
 * - Nothing here states a price or holds a buy button.
 */
export function UnlockStack({ pack }: { pack?: ReactNode }) {
  // A buyer lands back here seconds after paying, and a lifetime owner opens
  // /pro from the PRO pill: for them every chapter is open, so the list links
  // every chapter instead of locking what they own. The server snapshot is
  // not ready, so the prerendered HTML is the sales version.
  const pro = useProState();
  const owned = useProReady() && pro.active;
  return (
    <section
      id="unlocks"
      className="scroll-mt-20 border-t border-line"
      aria-labelledby="unlocks-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <SectionLabel className="mb-4 border-violet/50 text-violet-ink">
          Included, instantly
        </SectionLabel>
        <h2 id="unlocks-heading" className="max-w-2xl text-2xl sm:text-3xl">
          {owned
            ? "Everything below is open to you now"
            : "Everything below opens the second you upgrade"}
        </h2>
        <p className="mt-3 max-w-2xl text-mut">
          Nothing is drip-fed: both books open in full, both PDFs download,
          and the pro packs appear in your warmup list on your next session.
        </p>

        {/* --- the books: cover, figures and free chapters side by side --- */}
        <Claim id="book" className="mt-8" />
        <div className="mt-5 grid gap-x-10 gap-y-8 lg:grid-cols-2">
          <BookContents
            title={BOOK_TITLE}
            kicker="A singing book"
            motif="trace"
            href="/book"
            entries={BOOK_CONTENTS}
            owned={owned}
          />
          <BookContents
            title={ATLAS_TITLE}
            kicker="How famous singers sing"
            motif="keys"
            href="/atlas"
            entries={ATLAS_CONTENTS}
            note={ATLAS_PROFILES_NOTE}
            owned={owned}
          />
        </div>

        <p className="mt-6 text-sm text-mut">
          Start with the free chapter{" "}
          <Link
            href="/book/when-numbers-lie"
            className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
          >
            When the numbers lie to you
          </Link>
          : it decides whether any measurement on this site is worth anything.
        </p>

        {/* --- a pro pack as the warmups room draws it, beside the perks with
                nothing more to draw: the plan is the coach report at the top
                of the page, the other two are a limit lifted and a sync. Two
                columns of like weight on a desktop, so neither is a short
                claim beside an empty half. ------------------------------- */}
        <div className="mt-10 grid gap-x-10 gap-y-8 border-t border-line pt-8 lg:grid-cols-2">
          <div>
            <Claim id="warmups" />
            {pack && <div className="mt-4">{pack}</div>}
            <p className="mt-3 text-sm text-mut">
              Pro also opens {PRO_PROGRAM_COUNT} programs in full.{" "}
              <Link
                href="/programs"
                className="inline-flex min-h-11 items-center text-sm text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
              >
                Week 1 of every program is free
              </Link>
            </p>
          </div>
          <div className="grid content-start gap-5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-line lg:[&>*]:py-5 lg:[&>*:first-child]:pt-0">
            {(["coach", "songs", "history"] as const).map((id) => (
              <Claim key={id} id={id} compact />
            ))}
          </div>
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
  kicker,
  motif,
  href,
  entries,
  note,
  owned,
}: {
  title: string;
  /** The cover's mono line, as the book's own page draws it. */
  kicker: string;
  /** The book's own figure, drawn on its cover. */
  motif: CoverMotif;
  href: string;
  entries: readonly ContentsEntry[];
  /** One more line about the book, under its figures. */
  note?: string;
  /** Pro is active on this device: every chapter opens. */
  owned: boolean;
}) {
  const meta = BOOKS.find((b) => b.href === href);
  const free = entries.filter((e) => e.free).length;
  const visible = owned ? entries : entries.filter((e) => e.free);
  const locked = owned ? [] : entries.filter((e) => !e.free);
  const row = (entry: ContentsEntry) => (
    <li key={entry.slug}>
            {entry.free || owned ? (
              /* For an owner every row is a link, every chapter of both
                 books: about 1 MB of payload fetched in the background as the
                 list scrolls past. A visitor's few free rows keep Next's
                 default, like any other article link. */
              <Link
                href={`${href}/${entry.slug}`}
                prefetch={owned ? false : undefined}
                className="flex min-h-11 items-baseline gap-3 py-3 outline-offset-2 hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-violet"
              >
                <span className="tabular w-6 shrink-0 font-mono text-[11px] text-violet-ink">
                  {entry.order}
                </span>
                <span className="min-w-0 flex-1 text-sm text-ink">
                  {entry.title}
                </span>
                {entry.free && (
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-violet-ink">
                    Free
                  </span>
                )}
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
  );

  return (
    /* The cover beside the book's name and figures; the chapters beside the
       cover too from sm up, and under both on a phone, where a title would
       wrap to three lines in the column the cover leaves. */
    <div className="grid grid-cols-[auto_minmax(0,1fr)] content-start items-start gap-x-4 gap-y-4 sm:gap-x-6">
      <BookCover title={title} author={AUTHOR_NAME} kicker={kicker} motif={motif} className="sm:row-span-2" />
      <div>
        {/* The book's own hub, by name: this page sells the book and was the
            one place on the site that never linked to it. */}
        <h3 className="text-xl text-ink">
          <Link
            href={href}
            prefetch={href === "/atlas" ? false : undefined}
            className="outline-offset-2 hover:text-violet-ink focus-visible:outline-2 focus-visible:outline-violet"
          >
            {title}
          </Link>
        </h3>
        <p className="tabular mt-1.5 font-mono text-[11px] uppercase leading-5 tracking-[0.14em] text-dim">
          {entries.length} chapters
          <span className="mx-1.5 text-line2">·</span>
          {meta?.words.toLocaleString("en-US")} words
          {meta ? (
            <>
              <span className="mx-1.5 text-line2">·</span>
              {meta.pdfMb} MB PDF
            </>
          ) : null}
        </p>
        <p className="mt-1.5 text-xs text-mut">
          {owned
            ? `All ${entries.length} chapters are open to you; the PDF downloads from the book's page.`
            : `${free} readable now, ${entries.length - free} with Pro.`}
        </p>
        {note && <p className="mt-1.5 text-xs text-mut">{note}</p>}
      </div>

      <div className="col-span-2 sm:col-span-1 sm:col-start-2">
        <ol className="divide-y divide-line border-y border-line">
          {visible.map(row)}
        </ol>
        {/* A free reader's locked titles fold away: two full tables of
            contents ran to about two phone screens between the buy card and
            the comparison table. The count and the fold say what Pro opens;
            the titles are one tap away. An owner's list is their own, in full. */}
        {locked.length > 0 && (
          <details className="mt-1">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-mono text-[11px] uppercase tracking-[0.14em] text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet [&::-webkit-details-marker]:hidden">
              See the {locked.length} chapters Pro opens
            </summary>
            <ol className="mt-2 divide-y divide-line border-y border-line">
              {locked.map(row)}
            </ol>
          </details>
        )}
      </div>
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
