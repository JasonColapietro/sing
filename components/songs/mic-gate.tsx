import { Button, Card, PageShell } from "@/components/ui";
import { ProWhisper } from "@/components/pro/gate";
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
 */
export function SongsMicGate({
  heading = "Enable your microphone to get scored",
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
        <ProWhisper className="mt-4" />
      </Card>
    </PageShell>
  );
}
