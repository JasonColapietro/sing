import Link from "next/link";
import ToolsClient from "@/components/tools/tools-page";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { TOOLS_GUIDE } from "@/lib/guides";
import { SectionLabel } from "@/components/ui";

export const metadata = {
  title: "Singing Practice Tools — Metronome, Keyboard, Drone, Recorder",
  description:
    "The console modules every practice session leans on: a metronome, an on-screen keyboard, and a sustained drone for pitch matching — plus the take recorder and the spectrogram analyzer. Free in the browser.",
  alternates: { canonical: `${SITE_URL}/tools` },
};

/**
 * The rooms this tab absorbed when the header went from thirteen tabs to ten.
 * Server-rendered so the links exist in the HTML a crawler reads — this page
 * and the footer are now the crawl path into /recorder and /analyze.
 */
const MORE_TOOLS = [
  {
    href: "/recorder",
    label: "Voice recorder",
    note: "Cut a take, listen back, keep the good ones. Stays on your device.",
  },
  {
    href: "/analyze",
    label: "Spectrogram & tone analyzer",
    note: "Watch your harmonics live and track vocal load as you sing.",
  },
] as const;

export default function ToolsPage() {
  return (
    <>
      <ToolsClient />
      <section className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
        <SectionLabel>More tools</SectionLabel>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {MORE_TOOLS.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="block rounded-2xl border border-line bg-panel px-4 py-4 transition-colors hover:border-amber"
              >
                <span className="block text-sm font-medium">{t.label}</span>
                <span className="mt-1 block text-sm text-mut">{t.note}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <ToolGuide guide={TOOLS_GUIDE} />
    </>
  );
}