"use client";

import { useProState } from "@/lib/pro";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { LinkButton } from "@/components/ui";

/** Start reading if subscribed, otherwise point at Pro. */
export function BookCta() {
  const pro = useProState();
  const first = BOOK_CONTENTS[0];

  if (pro.active && first) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <LinkButton href={`/book/${first.slug}`} size="md">
          Start reading
        </LinkButton>
        <a
          href="/the-measured-voice.pdf"
          download
          className="inline-flex items-center justify-center gap-2 rounded-full border border-line2 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-amber hover:text-amber-ink"
        >
          Download the PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <LinkButton href="/pro" size="md">
        See what Pro includes
      </LinkButton>
      <span className="text-xs text-dim">
        {BOOK_CONTENTS.length} chapters and a PDF to keep, $9.99/month
      </span>
    </div>
  );
}
