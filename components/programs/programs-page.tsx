import { ProgramsClient } from "@/components/programs/programs-client";
import { RoomRailBand } from "@/components/discover/room-rail";
import { webPageJsonLd } from "@/lib/page-jsonld";
import { SITE_URL } from "@/lib/site";

export const PROGRAMS_TITLE = "Singing Practice Programs: Vocal Training Plans";
export const PROGRAMS_DESCRIPTION =
  "Singing practice programs, one to twelve weeks: warmups, breath and range check-ins, day by day. Four are free; guided practice is 5 free minutes a day.";
/** /programs, and every `?program=` deep link into it. */
export const PROGRAMS_CANONICAL = `${SITE_URL}/programs`;

/**
 * /programs, as app/programs/page.tsx serves it (the list) and as
 * app/programs/[program]/page.tsx serves each program's own view, which
 * next.config.ts rewrites `/programs?program=<id>` onto. The deep link keeps
 * its address and its canonical, and its HTML is the program from the first
 * paint rather than the list until hydration swapped it out.
 */
export function ProgramsPage({ program = null }: { program?: string | null }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageJsonLd({ path: "/programs", name: PROGRAMS_TITLE, description: PROGRAMS_DESCRIPTION })),
        }}
      />
      <ProgramsClient initialProgram={program} />
      <RoomRailBand current="/programs" />
      {/* Every ?program= URL canonicalises to /programs, so the list's own
          server HTML would say only what each plan is called. This says how
          a program runs. */}
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
