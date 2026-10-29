"use client";

import { useProState } from "@/lib/pro";
import { PRICING, formatPrice } from "@/lib/pro-shared";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { LinkButton } from "@/components/ui";
import { PdfDownload } from "@/components/book/pdf-download";

/** Start reading with Pro, otherwise sample a free chapter. */
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
          Read a free chapter
        </LinkButton>
      )}
      {/* A priced ask lands on the buy card, as the locked chapters' do. */}
      <LinkButton href="/pro#buy" variant="outline" size="md">
        {`See what Pro includes, ${formatPrice(PRICING.lifetime.amount)} once`}
      </LinkButton>
      <span className="text-xs text-dim">
        {BOOK_CONTENTS.filter((c) => c.free).length} chapters free · all{" "}
        {BOOK_CONTENTS.length} and a PDF to keep with Pro
      </span>
    </div>
  );
}
