import type { Metadata } from "next";
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
      <ToolGuide guide={RANGE_GUIDE} />
    </>
  );
}
