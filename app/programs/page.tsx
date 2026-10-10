import { ProgramsClient } from "@/components/programs/programs-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";
import { webPageJsonLd } from "@/lib/page-jsonld";

const TITLE = "Singing Practice Programs: Vocal Training Plans";
const DESCRIPTION =
  "Singing practice programs from one to twelve weeks: warmups, breath and range check-ins, day by day. Four are free; Pro plans open week one free.";

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
