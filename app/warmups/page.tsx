import { WarmupsClient } from "@/components/warmups/warmups-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { WARMUPS_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/warmups"),
  title: "Vocal Warm-Up Exercises: Guided Singing Warmups",
  description:
    "Guided vocal warmups with real-time pitch feedback: each exercise plays, counts you in, scores you and climbs by semitone. Three free minutes a day.",
  alternates: { canonical: `${SITE_URL}/warmups` },
});

export default function WarmupsPage() {
  return (
    <>
      <WarmupsClient />
      <RoomRailBand current="/warmups" />
      <ToolGuide guide={WARMUPS_GUIDE} />
    </>
  );
}
