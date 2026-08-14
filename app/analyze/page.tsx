import AnalyzeClient from "@/components/analyze/analyze-client";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { ANALYZE_GUIDE } from "@/lib/guides";

export const metadata = {
  title: "Voice Spectrogram and Tone Analyzer — See Your Own Harmonics",
  description:
    "Watch your voice as a live spectrogram, see where the harmonics and the 3 kHz ring sit, and track vocal load by vibration cycles rather than minutes. Runs in the browser; no audio leaves your device.",
  alternates: { canonical: `${SITE_URL}/analyze` },
};

export default function AnalyzePage() {
  return (
    <>
      <AnalyzeClient />
      <ToolGuide guide={ANALYZE_GUIDE} />
    </>
  );
}
