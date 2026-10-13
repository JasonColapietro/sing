import { ProgramsClient } from "@/components/programs/programs-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";
import { webPageJsonLd } from "@/lib/page-jsonld";

const TITLE = "Singing Practice Programs: Vocal Training Plans";
const DESCRIPTION =
  "Singing practice programs, one to twelve weeks: warmups, breath and range check-ins, day by day. Four are free; guided practice is 5 free minutes a day.";

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
      {/* A program's calendar and rules open from ?program= after mount, and
          every such URL canonicalises to this one, so without this the server
          HTML of the page that owns "singing practice programs" said only what
          each plan is called. This says how a program runs. */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl sm:text-3xl">How a singing practice program works</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Each program is a calendar of days, with rest days built in. A practice
            day lists what to sing, in order: breath sets and drills, warmup routines
            and single exercises, ear training, a song or a recorded take, and range
            or sustain tests on the days that measure. Each row opens the room that
            runs it.
          </p>
          <p className="mt-3 max-w-3xl text-mut">
            A day ticks itself off once the practice log shows each of its items, one
            program day per calendar day at most; if you did something the log cannot
            see, you mark the day done yourself. Miss a day and the program waits: the
            next day is there when you come back. Your place is kept in this browser
            only.
          </p>
        </div>
      </section>
    </>
  );
}
