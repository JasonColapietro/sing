import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { RangeTest } from "@/components/range/range-test";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { RANGE_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";

const TITLE = "Free Vocal Range Test & Voice Type | Suede Sing";
const DESCRIPTION =
  "Find your lowest and highest singing notes in about two minutes. This free vocal range test runs in your browser, shows your voice type, and needs no signup.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/range` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/range`,
    siteName: "Suede Sing",
    type: "website",
    locale: "en_US",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RangePage() {
  return (
    <>
      <RangeTest />
      <RoomRailBand current="/range" />
      <section className="mx-auto max-w-4xl px-4 py-8" aria-label="Singing with guitar">
        <p className="rounded-2xl border border-line bg-panel p-5 leading-relaxed text-mut">
          Singing with a guitarist? Once you know the most comfortable key for your voice, use{" "}
          <a
            href="https://strumly.suedeai.ai/capo"
            className="text-violet-ink underline underline-offset-4"
          >
            Strumly&apos;s guitar capo calculator
          </a>{" "}
          to keep the song in that key with easier chord shapes.
        </p>
      </section>
      <ToolGuide guide={RANGE_GUIDE} />
    </>
  );
}
