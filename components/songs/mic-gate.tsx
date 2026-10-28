"use client";

import { Button, Card, PageShell } from "@/components/ui";
import { ProWhisper } from "@/components/pro/gate";
import { AudioSetup } from "@/components/audio/audio-setup";
import { MicAlert } from "@/components/mic-alert";
import { FigureFrame, PianoRollFigure } from "@/components/figures";
import { FREE_DAILY_MINUTES, FREE_DAILY_SEC } from "@/lib/practice-limits";
import { CapWall } from "@/components/practice/free-cap";
import { prepaintWords, useHydrated } from "@/components/prepaint";
import { IconHeadphones, IconMic } from "./icons";

const SUBTITLE_LEAD =
  "Songs to practice singing: listen to a phrase from a well-known public domain melody, then sing it back on a scrolling piano roll with live pitch scoring.";
const SUBTITLE_FIT = "Once you have taken the range test, each song opens fitted to your range.";
// The second sentence and the lg button size are left off below sm so a 320×568 phone keeps both buttons on its first screen.
const SUBTITLE = (
  <>
    {SUBTITLE_LEAD}
    <span className="hidden sm:inline"> {SUBTITLE_FIT}</span>
  </>
);
const GATE_BUTTON = "sm:px-7 sm:py-3.5 sm:text-base";
/** SongsClient's subtitle over the library, which is what a capped singer gets instead of this gate. */
const LIBRARY_SUBTITLE = "Pick a song to start your practice loop.";
/** The cap as the wall reads it once reached; only ever shown where the pre-paint state says so. */
const CAP_REACHED = { isPro: false, usedSec: FREE_DAILY_SEC, leftSec: 0, capped: true, capSec: FREE_DAILY_SEC };

/**
 * The first screen of /songs, and the page's Suspense fallback: one component
 * for both so the box is the same height before and after hydration (the
 * null fallback this replaced cost CLS 0.36). It asks for the mic and nothing
 * else; mode and guide track are chosen in the player. As the fallback
 * (`prepaint`) it also carries the capped view behind pre-paint markers.
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
  const hydrated = useHydrated();
  const pre = prepaint && !hydrated;
  // With no song named, the way in without a mic is picking one: the player asks for the mic at Play.
  const deepLinked = heading !== "Sing along and see every note you hit";
  const gate = (
    <Card>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div>
          <h2 className="text-lg sm:text-xl">{heading}</h2>
          {/* Buttons straight after the heading: with the explanation first, "Enable microphone" sat behind a 375×667 phone's tab bar. */}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="rec" size="md" className={GATE_BUTTON} onClick={onEnable}>
              <IconMic /> {error ? "Try again" : "Enable microphone"}
            </Button>
            <Button variant="outline" size="md" className={GATE_BUTTON} onClick={onListen}>
              <IconHeadphones /> {deepLinked ? "Continue without a mic" : "Pick a song first"}
            </Button>
          </div>
          {/* Right under the buttons that cause it; MicAlert scrolls itself into view. */}
          {error && (
            <MicAlert message={error} className="mt-4 max-w-md text-sm text-rec" />
          )}
          <p className="mt-4 max-w-md text-sm text-mut">
            Suede Sing needs the mic to score your pitch against the melody in
            real time. Audio never leaves your browser. Without a mic, listen
            mode still plays the guide melody, just without scoring. Song
            practice counts toward the free plan&apos;s {FREE_DAILY_MINUTES}{" "}
            minutes of guided practice a day.
          </p>
          <a
            href="#songbook"
            className="mt-4 inline-flex min-h-11 items-center text-sm text-violet-ink underline underline-offset-4"
          >
            Or read the songbook pages first ↓
          </a>
          <AudioSetup className="mt-6 max-w-md" />
          {/* The gate's one ask; the sentence above states the allowance. */}
          <ProWhisper className="mt-4" />
        </div>
        {/* The room's instrument before the prompt: the piano roll the heading promises. */}
        <FigureFrame className="self-start" caption="What a run looks like">
          <PianoRollFigure />
        </FigureFrame>
      </div>
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
