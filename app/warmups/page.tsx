import { WarmupsClient } from "@/components/warmups/warmups-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { WARMUPS_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/warmups"),
  title: WARMUPS_GUIDE.pageName,
  description:
    "Vocal warm-up exercises with live pitch feedback: each plays, counts you in, scores you and climbs by semitone. Guided practice is 3 free minutes a day.",
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
