import type { Metadata } from "next";
import { SingersDirectory } from "@/components/singers/directory";
import { PageShell } from "@/components/ui";
import { SINGERS } from "@/lib/singers";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Famous Singers' Vocal Ranges",
  description: `The vocal ranges of ${SINGERS.length} famous singers — from Mariah Carey's whistle notes to the deepest basses — on one keyboard. Compare voice types, belts and falsetto reach, then overlay your own range for free.`,
  alternates: { canonical: `${SITE_URL}/singers` },
};

export default function SingersPage() {
  return (
    <PageShell
      kicker="Reference"
      title="Famous vocal ranges"
      subtitle={`Every voice on one keyboard — the commonly cited ranges of ${SINGERS.length} famous singers, from the deepest recorded lows to whistle-register highs. Tap any singer for the full breakdown.`}
    >
      <SingersDirectory />
      <p className="mt-10 max-w-2xl text-xs text-mut">
        These are the approximate figures fans and music journalists commonly
        cite — the widest notes a singer has recorded, not the comfortable
        range they sing in every night, and not lab measurements. Treat them
        as a fun reference, not a target.
      </p>
    </PageShell>
  );
}
