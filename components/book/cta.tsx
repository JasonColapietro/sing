"use client";

import { useProState } from "@/lib/pro";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { LinkButton } from "@/components/ui";
import { PdfDownload } from "@/components/book/pdf-download";

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
        <PdfDownload book="measured-voice" filename="the-measured-voice.pdf" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <LinkButton href="/pro#pro-plan" size="md">
        See Pro for $9.99/month
      </LinkButton>
      <span className="text-xs text-dim">
        {BOOK_CONTENTS.length} chapters and a PDF to keep, $9.99/month
      </span>
    </div>
  );
}
