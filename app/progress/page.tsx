import { ProgressClient } from "@/components/progress/progress-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";
import { webPageJsonLd } from "@/lib/page-jsonld";

const TITLE = "Singing Progress Tracker: Range and Streaks";
const DESCRIPTION =
  "Singing progress tracker: XP, streaks, achievements, your saved range and a daily coached session, kept on your device. Pro adds per-note accuracy charts.";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/progress"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/progress` },
});

export default function ProgressPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd({ path: "/progress", name: TITLE, description: DESCRIPTION })) }}
      />
      <ProgressClient />
      <RoomRailBand current="/progress" />
    </>
  );
}
