"use client";

import { useProState } from "@/lib/pro";
import { formatPrice, PRICING } from "@/lib/pro-shared";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { LinkButton } from "@/components/ui";
import { PdfDownload } from "@/components/book/pdf-download";

/** Start reading if subscribed, otherwise sample the free chapter. */
export function BookCta() {
  const pro = useProState();
  const first = BOOK_CONTENTS[0];
  const sample = BOOK_CONTENTS.find((c) => c.free);

  if (pro.active && first) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <LinkButton href={`/book/${first.slug}`} size="md">
          Start reading
        </LinkButton>
        <PdfDownload book="measured-voice" filename="the-measured-voice.pdf" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {sample && (
        <LinkButton href={`/book/${sample.slug}`} size="md">
          Read the free chapter
        </LinkButton>
      )}
      <LinkButton href="/pro" variant="outline" size="md">
        See what Pro includes
      </LinkButton>
      <span className="text-xs text-dim">
        First chapter free · all {BOOK_CONTENTS.length} and a PDF to keep with
        Pro, {formatPrice(PRICING.monthly.amount)}/month
      </span>
    </div>
  );
}
