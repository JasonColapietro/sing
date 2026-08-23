"use client";

import { useProState } from "@/lib/pro";
import { proHeadline } from "@/lib/pro-shared";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { LinkButton } from "@/components/ui";
import { PdfDownload } from "@/components/book/pdf-download";

/** Start reading if subscribed, otherwise sample the free chapter. */
export function AtlasCta() {
  const pro = useProState();
  const first = ATLAS_CONTENTS[0];

  if (pro.active && first) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <LinkButton href={`/atlas/${first.slug}`} size="md">
          Start reading
        </LinkButton>
        <PdfDownload book="atlas" filename="the-voice-atlas.pdf" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {first && (
        <LinkButton href={`/atlas/${first.slug}`} size="md">
          Read a free chapter
        </LinkButton>
      )}
      <LinkButton href="/pro" variant="outline" size="md">
        See what Pro includes
      </LinkButton>
      <span className="text-xs text-dim">
        First {ATLAS_CONTENTS.filter((c) => c.free).length} chapters free ·
        full book and PDF with Pro, {proHeadline()}
      </span>
    </div>
  );
}
