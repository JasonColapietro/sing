import Link from "next/link";
import AnalyzeClient from "@/components/analyze/analyze-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { ANALYZE_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";

export const metadata = withCanonicalOpenGraph({
  title: "Voice Spectrogram and Tone Analyzer: See Your Own Harmonics",
  description:
    "Watch your voice as a live spectrogram, see where the harmonics and the 3 kHz ring sit, and track vocal load by vibration cycles rather than minutes. Runs in the browser; no audio leaves your device.",
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
