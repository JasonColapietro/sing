"use client";

import { useProState } from "@/lib/pro";
import { PRICING, formatPrice } from "@/lib/pro-shared";
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
      {/* A priced ask lands on the buy card, as the locked chapters' do. */}
      <LinkButton href="/pro#buy" variant="outline" size="md">
        {`See what Pro includes, ${formatPrice(PRICING.lifetime.amount)} once`}
      </LinkButton>
      <span className="text-xs text-dim">
        First {ATLAS_CONTENTS.filter((c) => c.free).length} chapters free ·
        full book and PDF with Pro
      </span>
    </div>
  );
}
