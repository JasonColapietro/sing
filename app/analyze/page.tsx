import Link from "next/link";
import AnalyzeClient from "@/components/analyze/analyze-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { ANALYZE_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/analyze"),
  title: ANALYZE_GUIDE.pageName,
  description:
    "Voice spectrogram for singers: see your harmonics on a live spectrogram and track estimated vocal load. Free, no time limit; audio stays on your device.",
  alternates: { canonical: `${SITE_URL}/analyze` },
});

export default function AnalyzePage() {
  return (
    <>
      <AnalyzeClient />
      <section className="mx-auto max-w-4xl px-4 py-8" aria-label="What this room is">
        <p className="rounded-2xl border border-line bg-panel p-5 leading-relaxed text-mut">
          This is the spectrogram room rather than the tools console: it draws
          the harmonic shape of your own voice and keeps the week of vocal load
          behind it.{" "}
          <Link href="/tools" className="text-violet-ink underline underline-offset-4">
            The practice tools tab
          </Link>{" "}
          is where the metronome, keyboard and drone live, and it does not
          analyse anything you sing.
        </p>
      </section>
      <RoomRailBand current="/analyze" />
      <ToolGuide guide={ANALYZE_GUIDE} />
    </>
  );
}
