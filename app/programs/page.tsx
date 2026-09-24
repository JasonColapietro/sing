import { ProgramsClient } from "@/components/programs/programs-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { RoomRailBand } from "@/components/discover/room-rail";

export const metadata = withCanonicalOpenGraph({
  title: "Singing Practice Programs: Multi-Week Vocal Training Plans",
  description:
    "Named singing practice plans from one week to six: warmups, breath work and range check-ins scheduled day by day, with rest days built in. Free in the browser, with one Pro program.",
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
