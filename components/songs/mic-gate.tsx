"use client";

import { Button, Card, PageShell } from "@/components/ui";
import { ProWhisper } from "@/components/pro/gate";
import { AudioSetup } from "@/components/audio/audio-setup";
import { MicAlert } from "@/components/mic-alert";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { IconHeadphones, IconMic } from "./icons";

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
 */
export function SongsMicGate({
  heading = "Sing along and see every note you hit",
  error,
  onEnable,
  onListen,
}: {
  /** Overridden when a deep link names the song being opened. */
  heading?: string;
  error?: string | null;
  onEnable?: () => void;
  onListen?: () => void;
}) {
  return (
    <PageShell
      kicker="Songs"
      title="Public domain songs to sing in your key"
      subtitle="Songs to practice singing: listen to a phrase from a well-known public domain melody, then sing it back on a scrolling piano roll with live pitch scoring. Once you have taken the range test, each song opens fitted to your range."
    >
      <Card>
        <h2 className="text-xl">{heading}</h2>
        {/* The buttons come straight after the heading that asks for them: with
            the explanation first, a 375×667 phone put "Enable microphone"
            behind the tab bar, on the hub and on every "Sing <song>" link. */}
        <div className="mt-4 flex flex-wrap gap-3">
          {/* After a failure the press is a retry, as MicGate in the other
              rooms labels it; an unchanged label read as a dead button. */}
          <Button variant="rec" size="lg" onClick={onEnable}>
            <IconMic /> {error ? "Try again" : "Enable microphone"}
          </Button>
          <Button variant="outline" size="lg" onClick={onListen}>
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
    </PageShell>
  );
}
