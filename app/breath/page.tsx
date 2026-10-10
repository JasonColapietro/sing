import { BreathStudio } from "@/components/breath/breath-studio";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { BREATH_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/breath"),
  title: BREATH_GUIDE.pageName,
  description:
    "Breathing exercises for singers: guided breath sets and a mic-based sustain test for support on long notes. Guided practice is 3 free minutes a day.",
  alternates: { canonical: `${SITE_URL}/breath` },
});

export default function BreathPage() {
  return (
    <>
      <BreathStudio />
      <RoomRailBand current="/breath" />
      <ToolGuide guide={BREATH_GUIDE} />
    </>
  );
}
