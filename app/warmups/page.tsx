import { WarmupsClient } from "@/components/warmups/warmups-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { WARMUPS_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";

export const metadata = withCanonicalOpenGraph({
  title: "Vocal Warmups — Guided Singing Warm-Up Exercises",
  description:
    "Guided vocal warmup routines with real-time pitch feedback: each exercise plays, counts you in, scores you and climbs by semitone. Three free minutes a day in the browser — no install.",
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
