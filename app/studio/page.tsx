import { StudioClient } from "@/components/studio/studio-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { STUDIO_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/studio"),
  title: "Pitch Training for Singers: Real-Time Feedback",
  description:
    "Sing into your mic and watch your pitch trace against target notes, live. Free browser pitch training with scales, slides and hold drills. No install.",
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
