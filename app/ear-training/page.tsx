import EarTrainingClient from "@/components/ear/ear-training-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { EAR_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/ear-training"),
  title: EAR_GUIDE.pageName,
  description:
    "Ear training for singers in five short games: match pitch, catch moving notes, name intervals, sing melodies back. Guided practice is 3 free minutes a day.",
  alternates: { canonical: `${SITE_URL}/ear-training` },
});

export default function EarTrainingPage() {
  return (
    <>
      <EarTrainingClient />
      <RoomRailBand current="/ear-training" />
      <ToolGuide guide={EAR_GUIDE} />
    </>
  );
}
