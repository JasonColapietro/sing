import EarTrainingClient from "@/components/ear/ear-training-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { EAR_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";

export const metadata = withCanonicalOpenGraph({
  title: "Ear Training for Singers — Pitch and Interval Games",
  description:
    "Four short ear training games for singers: match pitch, name intervals, and sing melodies back. Ten rounds each, free in the browser.",
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
