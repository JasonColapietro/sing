import { ProgramsClient } from "@/components/programs/programs-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/programs"),
  title: "Singing Practice Programs: Multi-Week Vocal Training Plans",
  description:
    "Named singing practice plans from one week to twelve: warmups, breath work and range check-ins scheduled day by day, with rest days built in. Free in the browser; the two Pro programs open their first week to everyone.",
  alternates: { canonical: `${SITE_URL}/programs` },
});

export default function ProgramsPage() {
  return (
    <>
      <ProgramsClient />
      <RoomRailBand current="/programs" />
    </>
  );
}
