import Link from "next/link";
import { ProgressClient } from "@/components/progress/progress-client";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { RoomRailBand } from "@/components/discover/room-rail";
import { routeKeywords } from "@/lib/keywords";
import { webPageJsonLd } from "@/lib/page-jsonld";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";

const TITLE = "Singing Progress Tracker: Range and Streaks";
const DESCRIPTION =
  "Singing progress tracker: XP, streaks, achievements, your saved range and a daily coached session, kept on your device. Pro adds per-note accuracy charts.";

export const metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/progress"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/progress` },
});

export default function ProgressPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd({ path: "/progress", name: TITLE, description: DESCRIPTION })) }}
      />
      <ProgressClient />
      <RoomRailBand current="/progress" />
      {/* The dashboard is client-only, so without this the server HTML for the
          page that owns "singing progress tracker" was an H1, a subtitle and a
          skeleton. This says what is tracked and where it comes from. */}
      <section className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl sm:text-3xl">What the singing progress tracker records</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Sessions from the warmups, ear-training games, breath drills, song
            practice, the range test, the pitch studio, the take recorder, the
            tools and the analyzer are logged here. Each logged session earns XP,
            with a bonus when a scored exercise goes well, and practising on
            consecutive days builds your streak. The calendar shows the days you
            practised, and your latest range test result is kept as your saved
            range.
          </p>
          <p className="mt-3 max-w-3xl text-mut">
            The pitch studio, range test, recorder and tools are free with no
            daily clock. Warmups, ear training, breath and songs share{" "}
            {FREE_DAILY_MINUTES} free minutes of guided practice a day, and Pro
            removes that limit.
          </p>
          <p className="mt-3 max-w-3xl text-mut">
            Nothing logged yet?{" "}
            <Link href={rangeTestHref()} className="text-violet-ink underline">
              Take the vocal range test
            </Link>{" "}
            or{" "}
            <Link href="/warmups" className="text-violet-ink underline">
              start a warmup
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
