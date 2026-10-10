import { StudioClient } from "@/components/studio/studio-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { STUDIO_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/studio"),
  title: STUDIO_GUIDE.pageName,
  description:
    "Pitch training for singers with real-time feedback: see the note, how many cents off you are and an 8-second trace. Free in your browser, no time limit.",
  alternates: { canonical: `${SITE_URL}/studio` },
});

export default function StudioPage() {
  return (
    <>
      <StudioClient />
      <RoomRailBand current="/studio" />
      <ToolGuide guide={STUDIO_GUIDE} />
    </>
  );
}
