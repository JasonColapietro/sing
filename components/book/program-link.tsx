import Link from "next/link";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";

/**
 * The in-app program that runs the book's twelve weeks (chapters 13–19) day by
 * day. Restated rather than imported from lib/programs.ts, which would pull the
 * warmup library and the songbook into the book's pages to print one name; a
 * test in lib/book-pages.test.tsx holds the id, the name and the free week to
 * the program itself.
 */
export const BOOK_PROGRAM_ID = "measured-voice-12w";
export const BOOK_PROGRAM_NAME = "The Measured Voice: 12 weeks";
export const BOOK_PROGRAM_HREF = `/programs?program=${BOOK_PROGRAM_ID}`;

/**
 * The bridge from reading about the plan to running it. "plan" is the whole
 * twelve weeks (the contents page, the chapter that explains the shape);
 * "fortnight" is one phase chapter. Either way the program is Pro past its
 * first week, and the sentence says so rather than letting "free" read as if
 * this fortnight were. The free week is guided practice, so the note names the
 * daily cap it fits inside wherever it sends a reader there.
 */
export function BookProgramNote({
  scope,
  className,
}: {
  scope: "plan" | "fortnight";
  className?: string;
}) {
  return (
    <p className={className}>
      The app runs this {scope} day by day in{" "}
      <Link href={BOOK_PROGRAM_HREF} className="text-violet-ink hover:underline">
        {BOOK_PROGRAM_NAME}
      </Link>
      , a Suede Pro program. Its first week is free, and each day of that week
      fits inside the free plan&apos;s {FREE_DAILY_MINUTES} guided minutes.
    </p>
  );
}
