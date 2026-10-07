"use client";

import { Button, Card, PageShell } from "@/components/ui";
import { ProWhisper } from "@/components/pro/gate";
import { AudioSetup } from "@/components/audio/audio-setup";
import { IconHeadphones, IconMic } from "./icons";
import { PASS_LABEL } from "./lib";
import type { GuidePass, SessionMode } from "./types";

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
 */
/**
 * Our two session modes, in our own words. Rehearsal loops for as long as the
 * singer wants; performance is the scored take that ends on its own.
 */
const MODES: { id: SessionMode; label: string; blurb: string }[] = [
  {
    id: "rehearsal",
    label: "Rehearsal",
    blurb:
      "Loop the phrase as long as you like. Each pass is scored; stop whenever you are ready.",
  },
  {
    id: "performance",
    label: "Performance",
    blurb:
      "A scored take: points build with your streak and the run ends after the planned loops.",
  },
];

/**
 * How much of the guide melody plays under the singer, in our own words.
 * Listen is the unscored read-through, guided keeps the guide under the voice,
 * and solo drops it so the singer carries the melody alone.
 */
const PASSES: { id: GuidePass; label: string; blurb: string }[] = [
  {
    id: "listen",
    label: PASS_LABEL.listen,
    blurb: "The guide sings it alone. Nothing is scored; just take it in.",
  },
  {
    id: "guided",
    label: PASS_LABEL.guided,
    blurb: "The guide stays under your voice, and the pass is scored.",
  },
  {
    id: "solo",
    label: PASS_LABEL.solo,
    blurb: "The guide goes quiet. Scored, and the pass that masters a song.",
  },
];

export function SongsMicGate({
  heading = "Enable your microphone to get scored",
  error,
  onEnable,
  onListen,
  mode = "rehearsal",
  onModeChange,
  pass = "guided",
  onPassChange,
}: {
  /** Overridden when a deep link names the song being opened. */
  heading?: string;
  error?: string | null;
  onEnable?: () => void;
  onListen?: () => void;
  /** Chosen here so it applies to both entries below — mic and listen mode. */
  mode?: SessionMode;
  onModeChange?: (mode: SessionMode) => void;
  /** Chosen here too: the pass the first run through the song will be. */
  pass?: GuidePass;
  onPassChange?: (pass: GuidePass) => void;
}) {
  return (
    <PageShell
      kicker="Songs"
      title="Song practice"
      subtitle="Listen to a short phrase from a well-known melody, then sing it back on a scrolling piano roll."
    >
      <Card>
        <h2 className="text-xl">{heading}</h2>
        <p className="mt-2 max-w-md text-sm text-mut">
          Suede Sing needs the mic to score your pitch against the melody in
          real time. Audio never leaves your browser. You can also practice
          without a mic in listen mode — the guide melody still plays, just
          without scoring.
        </p>
        <fieldset className="mt-5">
          <legend className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Session mode
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mode === m.id}
                onClick={() => onModeChange?.(m.id)}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm transition-colors ${
                  mode === m.id
                    ? "border-violet-ink bg-violet/10 text-violet-ink"
                    : "border-line2 text-mut hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mt-2 max-w-md text-sm text-mut">
            {MODES.find((m) => m.id === mode)?.blurb}
          </p>
        </fieldset>
        <fieldset className="mt-5">
          <legend className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Guide track
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PASSES.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={pass === p.id}
                onClick={() => onPassChange?.(p.id)}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm transition-colors ${
                  pass === p.id
                    ? "border-violet-ink bg-violet/10 text-violet-ink"
                    : "border-line2 text-mut hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-2 max-w-md text-sm text-mut">
            {PASSES.find((p) => p.id === pass)?.blurb}
          </p>
        </fieldset>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="rec" size="lg" onClick={onEnable}>
            <IconMic /> Enable microphone
          </Button>
          <Button variant="outline" size="lg" onClick={onListen}>
            <IconHeadphones /> Continue without a mic
          </Button>
        </div>
        {error && (
          <p className="mt-4 max-w-md text-sm text-rec" role="alert">
            {error}
          </p>
        )}
        <AudioSetup className="mt-6 max-w-md" />
        <ProWhisper className="mt-4" />
      </Card>
    </PageShell>
  );
}
