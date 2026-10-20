"use client";

import { Button, Card, PageShell } from "@/components/ui";
import { ProWhisper } from "@/components/pro/gate";
import { AudioSetup } from "@/components/audio/audio-setup";
import { MicAlert } from "@/components/mic-alert";
import { FREE_DAILY_MINUTES, FREE_DAILY_SEC } from "@/lib/practice-limits";
import { CapWall } from "@/components/practice/free-cap";
import { prepaintWords, useHydrated } from "@/components/prepaint";
import { IconHeadphones, IconMic } from "./icons";

const SUBTITLE_LEAD =
  "Songs to practice singing: listen to a phrase from a well-known public domain melody, then sing it back on a scrolling piano roll with live pitch scoring.";
const SUBTITLE_FIT = "Once you have taken the range test, each song opens fitted to your range.";
/**
 * The second sentence is left off below sm, and the gate's buttons drop to
 * the md size there, so a 320×568 phone has both buttons on its first screen:
 * "Continue without a mic" wrapped to two lines at the lg size and sat across
 * the fold, under a six-line subtitle. The sentence stays in the HTML. The
 * heading is a size down below sm too: on a deep link it names the song, and
 * "She'll Be Coming Round the Mountain" or "Amazing Grace (Opening Lines,
 * Verses 1 & 2)" took it to three lines and the second button across the fold
 * again (to 579px); at text-lg they take two lines and it ends at 553px.
 */
const SUBTITLE = (
  <>
    {SUBTITLE_LEAD}
    <span className="hidden sm:inline"> {SUBTITLE_FIT}</span>
  </>
);
/** The lg size from sm up; md (no wrapping at 320px) below it. */
const GATE_BUTTON = "sm:px-7 sm:py-3.5 sm:text-base";
/** SongsClient's subtitle over the library, which is what a capped singer gets instead of this gate. */
const LIBRARY_SUBTITLE = "Pick a song to start your practice loop.";
/** The cap as the wall reads it once reached; only ever shown where the pre-paint state says so. */
const CAP_REACHED = { isPro: false, usedSec: FREE_DAILY_SEC, leftSec: 0, capped: true, capSec: FREE_DAILY_SEC };

/**
 * The first screen of /songs, for everyone.
 *
 * `usePitch` never auto-starts, so no visitor — first-time or returning —
 * reaches the library without passing through here. That makes this view the
 * one thing the hub can reserve space for, which is the reason it is its own
 * component rather than inline JSX inside SongsClient.
 *
 * SongsClient calls `useSearchParams` to read `?song=`, which client-side
 * renders the tree up to the nearest Suspense boundary, so the hub's static
 * HTML used to open with nothing at all where this gate belongs. Hydration
 * then inserted 494px of it above ~4,100px of prerendered songbook and shoved
 * all of it down: CLS 0.36, in Google's "poor" band. The page now hands this
 * same component to the boundary as its fallback, so the box is the right size
 * from the first paint and the real gate lands in it without moving anything.
 * Shared rather than duplicated so the two can never drift apart — a fallback
 * that is a few pixels off is a fallback that still shifts.
 *
 * Handlers are optional because the fallback has none: it is prerendered, and
 * the buttons go live when SongsClient replaces it a few hundred milliseconds
 * later. Rendering them live-looking but inert for that window is the trade the
 * Next.js docs' own fallback example makes, and it beats the blank the hub
 * shipped before.
 *
 * It asks for one thing — the microphone — and nothing else. Session mode and
 * guide track used to be chosen here, before a single song was on screen; both
 * start at their defaults (rehearsal, sing along) and are chosen in the player,
 * with the song on screen, before the first run or while paused. A singer who
 * came to pick a song can skip straight to the crawlable songbook below.
 *
 * A singer who has used today's free minutes never meets this gate: SongsClient
 * gives them the cap wall over the library instead. As the page's fallback
 * (`prepaint`), it therefore also carries that view's top, the library's
 * subtitle and the wall, plus a screen-tall stand-in for the library, all
 * behind pre-paint markers (components/prepaint.tsx), so a capped singer's
 * first paint is the wall with the songbook below the fold, where the library
 * then keeps it, rather than this gate with the songbook just in view. The
 * capped view's words are attributes until then (prepaintWords), so the
 * hub's static text reads as the gate alone.
 */
export function SongsMicGate({
  heading = "Sing along and see every note you hit",
  error,
  onEnable,
  onListen,
  prepaint = false,
}: {
  /** Overridden when a deep link names the song being opened. */
  heading?: string;
  error?: string | null;
  onEnable?: () => void;
  onListen?: () => void;
  /** True only for the page's fallback: its server HTML is never hydrated. */
  prepaint?: boolean;
}) {
  // Rendered on the client (a fallback shown during a client-side
  // navigation), it is the plain gate: no inline script has marked the page.
  const hydrated = useHydrated();
  const pre = prepaint && !hydrated;
  const gate = (
    <Card>
      <h2 className="text-lg sm:text-xl">{heading}</h2>
      {/* The buttons come straight after the heading that asks for them: with
          the explanation first, a 375×667 phone put "Enable microphone"
          behind the tab bar, on the hub and on every "Sing <song>" link. */}
      <div className="mt-4 flex flex-wrap gap-3">
        {/* After a failure the press is a retry, as MicGate in the other
            rooms labels it; an unchanged label read as a dead button. */}
        <Button variant="rec" size="md" className={GATE_BUTTON} onClick={onEnable}>
          <IconMic /> {error ? "Try again" : "Enable microphone"}
        </Button>
        <Button variant="outline" size="md" className={GATE_BUTTON} onClick={onListen}>
          <IconHeadphones /> Continue without a mic
        </Button>
      </div>
      {/* Right under the buttons that cause it, ahead of the explanation and
          the songbook link: the failure belongs next to the press. MicAlert
          scrolls itself into view, because at 375px the second button wraps
          and the line can land below the fold. */}
      {error && (
        <MicAlert message={error} className="mt-4 max-w-md text-sm text-rec" />
      )}
      <p className="mt-4 max-w-md text-sm text-mut">
        Suede Sing needs the mic to score your pitch against the melody in
        real time. Audio never leaves your browser. Without a mic, listen
        mode still plays the guide melody, just without scoring. Song
        practice counts toward the free plan&apos;s {FREE_DAILY_MINUTES}{" "}
        minutes of guided practice a day; Pro has no daily limit.
      </p>
      <a
        href="#songbook"
        className="mt-4 inline-flex min-h-11 items-center text-sm text-violet-ink underline underline-offset-4"
      >
        Or browse the songbook first ↓
      </a>
      <AudioSetup className="mt-6 max-w-md" />
      <ProWhisper className="mt-4" />
    </Card>
  );
  return (
    <PageShell
      kicker="Songs"
      title="Public domain songs to sing in your key"
      subtitle={
        pre ? (
          <>
            <span data-prepaint-plan="not-capped">{SUBTITLE}</span>
            <span data-prepaint-plan="capped">{prepaintWords(hydrated, LIBRARY_SUBTITLE)}</span>
          </>
        ) : (
          SUBTITLE
        )
      }
    >
      {pre ? (
        <>
          <CapWall cap={CAP_REACHED} className="mb-6" />
          <div aria-hidden="true" data-prepaint-plan="capped" data-prepaint-slot="songs-library" />
          <div data-prepaint-plan="not-capped">{gate}</div>
        </>
      ) : (
        gate
      )}
    </PageShell>
  );
}
