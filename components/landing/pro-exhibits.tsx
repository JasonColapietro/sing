import Link from "next/link";
import { AUTHOR_NAME } from "@/lib/author";
import { BOOKS } from "@/lib/pro-inventory";
import { BookCover } from "@/components/book/cover";
import { NotPro } from "@/components/pro/gate";
import { TakeSample } from "@/components/pro/take-sample";

/** Where /pro demonstrates the paid charts (components/pro/pro-showcase.tsx). */
export const PRO_SHOWCASE_HREF = "/pro#showcase";

/**
 * Two more things Pro adds, shown under the homepage teaser's coach report:
 * the take analysis as a drawing that labels itself a sample, and the two
 * books as covers beside their own counts.
 *
 * A server component. The counts come from lib/pro-inventory.ts, whose
 * literals pro-inventory.test.ts holds to the real books; nothing here
 * imports the books' contents, the charts or the progress store (the bundle
 * rule at the top of that file). No price: the homepage states it once, on
 * the teaser's button (pro-claims.test.tsx).
 */
export function ProExhibits({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
        <TakeSample />
        {/* The recorder's locked panel says the same of the real thing. */}
        <p className="mt-3 text-sm text-mut">
          The pitch line of each take, and two takes overlaid.
        </p>
      </div>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {BOOKS.map((book) => (
          <li
            key={book.href}
            className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4"
          >
            {/* One width at every breakpoint: the card is half a column wide. */}
            <BookCover title={book.title} author={AUTHOR_NAME} className="w-28! sm:w-28!" />
            <div className="min-w-0">
              <Link
                href={book.href}
                prefetch={false}
                className="inline-flex min-h-11 items-center text-lg leading-tight text-ink underline decoration-line2 underline-offset-4 hover:text-violet-ink hover:decoration-violet"
              >
                {book.title}
              </Link>
              <p className="text-sm text-mut">
                {book.chapters} chapters
                <br />
                {book.words.toLocaleString("en-US")} words
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Sells, so a Pro browser hides it before first paint, like the button. */}
      <NotPro as="p" className="mt-2">
        <Link
          href={PRO_SHOWCASE_HREF}
          className="inline-flex min-h-11 items-center text-sm text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
        >
          See Pro on a sample voice
        </Link>
      </NotPro>
    </div>
  );
}
