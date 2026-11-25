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
  "Singing progress tracker: XP, streaks, achievements, your saved range and a daily coached session, kept on your device. Pro adds a per-note accuracy chart.";

/**
 * The questions a singer asks about the tracker, answered from the constants
 * the tracker runs on (lib/progress.ts) and the data card's own copy
 * (components/progress/data-copy.ts), so the page cannot promise more than
 * the dashboard does. Rendered under visible headings and as FAQPage markup.
 *
 * lib/progress.ts is a "use client" module, so this server page cannot read
 * its constants; app/progress/page.test.ts holds the numbers here to them.
 */
export const PROGRESS_FAQ = [
  {
    q: "How do I earn XP?",
    a: "Every logged session earns 10 XP a minute, with at least 4 and at most 80 XP for one session, so a single long sitting cannot buy a level. A scored exercise adds a bonus: 8 XP for a score of 70 or more, 15 for 85, and 25 for 95. Each of the 16 achievements adds 30 XP. Levels run from 1 to 60, and each level needs more XP than the one before.",
  },
  {
    q: "How does the practice streak work?",
    a: "Your streak counts consecutive days with at least one logged session, using the calendar day where you are. Missing a day starts it again. A rest day scheduled by a program you are running keeps the streak without adding to it, and achievements mark streaks of 3, 7 and 30 days.",
  },
  {
    q: "Where is my singing progress saved?",
    a: "On the free plan, progress lives only in the browser you practice in. Under Your data you can export it as a JSON file and import it in another browser; an import adds to what that browser already holds. With Suede Pro, progress syncs to the cloud and follows your Pro key to any device. Song mastery, the stars on the ear-training and breath paths, and your place in a program stay in the browser either way.",
  },
  {
    q: "What does Suede Pro add to the tracker?",
    a: "Pro adds an accuracy chart for each note you have been scored on, a chart of your range tests over time, and cloud sync. It also removes the daily limit on guided practice. XP, streaks, achievements, the practice calendar and your saved range are free.",
  },
  {
    q: "Can I reset my progress?",
    a: "Yes. Erase browser progress, in the Danger zone card, removes XP, sessions, streaks, range data and achievements from this browser. Recordings are kept. Export a backup first if you might want the record back.",
  },
] as const;

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd({ path: "/progress", name: TITLE, description: DESCRIPTION, faq: PROGRESS_FAQ })) }}
      />
      <ProgressClient />
      <RoomRailBand current="/progress" />
      {/* The dashboard is client-only, so without this the server HTML for the
          page that owns "singing progress tracker" was an H1, a subtitle and a
          skeleton. This says what is tracked and where it comes from. */}
      {/* A labelled region: it sits after the dashboard's <main>, and
          without a name it was content outside every landmark. */}
      <section aria-labelledby="progress-records-heading" className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="progress-records-heading" className="text-2xl sm:text-3xl">
            What the singing progress tracker records
          </h2>
          <p className="mt-3 max-w-3xl text-mut">
            Sessions from the warmups, ear-training games, breath drills, song
            practice, the range test, the pitch studio, the recorder, the
            tools and the analyzer are logged here. Each logged session earns XP,
            with a bonus when a scored exercise goes well, and practicing on
            consecutive days builds your streak. A scheduled rest day in a
            program you are running keeps the streak without adding to it. The
            calendar shows the days you
            practiced, and your latest range test result is kept as your saved
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
          <h2 className="mt-12 text-2xl sm:text-3xl">Questions about tracking your practice</h2>
          <div className="mt-6 max-w-3xl space-y-6">
            {PROGRESS_FAQ.map(({ q, a }) => (
              <div key={q}>
                <h3 className="text-lg text-ink">{q}</h3>
                <p className="mt-2 text-mut">{a}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-mut">
            For a plan that fills the calendar for you, see the{" "}
            <Link href="/programs" className="text-violet-ink underline">
              practice programs
            </Link>
            , or work through the{" "}
            <Link href="/learn/voice" className="text-violet-ink underline">
              free voice lessons
            </Link>{" "}
            one module at a time.
          </p>
        </div>
      </section>
    </>
  );
}
