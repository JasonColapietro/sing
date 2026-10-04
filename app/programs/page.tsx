import { ProgramsClient } from "@/components/programs/programs-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";
import { webPageJsonLd } from "@/lib/page-jsonld";

const TITLE = "Singing Practice Programs: Multi-Week Vocal Training Plans";
const DESCRIPTION =
  "Named singing practice plans from one week to twelve: warmups, breath work and range check-ins scheduled day by day, with rest days built in. Free in the browser; the two Pro programs open their first week to everyone.";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/programs"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/programs` },
});

export default function ProgramsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd({ path: "/programs", name: TITLE, description: DESCRIPTION })) }}
      />
      <ProgramsClient />
      <RoomRailBand current="/programs" />
    </>
  );
}
