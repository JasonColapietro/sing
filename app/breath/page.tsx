import { BreathStudio } from "@/components/breath/breath-studio";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { BREATH_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/breath"),
  title: "Breathing Exercises for Singers: Breath Support",
  description:
    "Build the air supply behind every long note: a mic-based sustain test plus guided breathing exercises for singers. Free in the browser.",
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
