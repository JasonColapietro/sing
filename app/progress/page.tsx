import { ProgressClient } from "@/components/progress/progress-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";
import { webPageJsonLd } from "@/lib/page-jsonld";

const TITLE = "Singing Progress Tracker: Range and Streaks";
const DESCRIPTION =
  "Every practice session logged: XP, streaks, achievements, range history and per-exercise scores, stored on your device. Watch your singing improve.";

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
