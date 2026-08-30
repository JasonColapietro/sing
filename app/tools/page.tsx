import Link from "next/link";
import ToolsClient from "@/components/tools/tools-page";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { TOOLS_GUIDE } from "@/lib/guides";
import { SectionLabel } from "@/components/ui";
import { AnalyzeGlyph, RecorderGlyph } from "@/components/landing/glyphs";

export const metadata = withCanonicalOpenGraph({
  title: "Singing Practice Tools — Metronome, Keyboard, Drone, Recorder",
  description:
    "The console modules every practice session leans on: a metronome, an on-screen keyboard, and a sustained drone for pitch matching — plus the take recorder and the spectrogram analyzer. Free in the browser.",
  alternates: { canonical: `${SITE_URL}/tools` },
});

/**
 * The rooms this tab absorbed when the header went from thirteen tabs to ten.
 * They were built for Googlebot first and it showed: two grey text links under
 * a console that gets the whole page above the fold. Recorder and Analyze are
 * roughly three times the feature code of the three tools above them, so they
 * get the homepage's card treatment and a line naming what is actually inside.
 * Still server-rendered links, because this page and the footer are the crawl
 * path into both.
 */
const MIC_ROOMS = [
  {
    href: "/recorder",
    label: "Take recorder",
    desc: "Cut a take, listen back, and keep the good ones. Every take stays on this device.",
    Glyph: RecorderGlyph,
    inside: [
      "Waveform per take",
      "A/B two takes",
      "Star and note each one",
      "Pitch trace with Pro",
    ],
  },
  {
    href: "/analyze",
    label: "Spectrogram and tone",
    desc: "Watch the shape of your voice while you sing it, harmonic by harmonic.",
    Glyph: AnalyzeGlyph,
    inside: [
      "Live spectrogram",
      "Ring band percentage",
      "Vocal load today",
      "The week behind it",
    ],
  },
] as const;

export default function ToolsPage() {
  return (
    <>
      <ToolsClient />
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <SectionLabel>Also in this tab</SectionLabel>
          <h2 className="mt-4 max-w-2xl text-2xl sm:text-3xl">Two more rooms, both listening</h2>
          <p className="mt-3 max-w-2xl text-mut">
            The metronome, keyboard and drone above only need speakers. These
            two read your microphone and draw what they hear. Nothing uploads.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {MIC_ROOMS.map(({ href, label, desc, Glyph, inside }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-violet/50 sm:p-6"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel2 text-violet-ink">
                    <Glyph />
                  </span>
                  <span className="mt-4 block text-xl text-ink group-hover:text-violet-ink">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm text-mut">{desc}</span>
                  <span className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                    {inside.map((item, i) => (
                      <span key={item} className="flex items-center gap-2">
                        {i > 0 && (
                          <span aria-hidden="true" className="text-line2">
                            ·
                          </span>
                        )}
                        {item}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ToolGuide guide={TOOLS_GUIDE} />
    </>
  );
}
