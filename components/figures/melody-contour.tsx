import { COOL } from "@/lib/chart-colors";
import { cn } from "./chip";

interface ContourNote {
  midi: number;
  startBeat: number;
  durBeats: number;
  line?: number;
}

const W = 60;
const H = 16;
const MAX_NOTES = 12;

/** The first phrase: notes on the first lyric line, capped so a long line stays legible. */
export function contourPoints(notes: readonly ContourNote[]): string {
  const first = notes[0]?.line ?? 0;
  const phrase = notes.filter((n) => (n.line ?? 0) === first).slice(0, MAX_NOTES);
  if (phrase.length === 0) return "";
  const t0 = phrase[0].startBeat;
  const t1 = phrase[phrase.length - 1].startBeat + phrase[phrase.length - 1].durBeats;
  const lo = Math.min(...phrase.map((n) => n.midi));
  const hi = Math.max(...phrase.map((n) => n.midi));
  const x = (beat: number) => 1.5 + ((beat - t0) / Math.max(1, t1 - t0)) * (W - 3);
  const y = (midi: number) => (hi === lo ? H / 2 : H - 1.5 - ((midi - lo) / (hi - lo)) * (H - 3));
  return phrase
    .map((n) => `${x(n.startBeat).toFixed(1)},${y(n.midi).toFixed(1)} ${x(n.startBeat + n.durBeats).toFixed(1)},${y(n.midi).toFixed(1)}`)
    .join(" ");
}

/** A song's opening phrase as a 60×16 staircase, drawn beside its title. Decorative. */
export function MelodyContour({ notes, className }: { notes: readonly ContourNote[]; className?: string }) {
  const points = contourPoints(notes);
  if (!points) return null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" className={cn("shrink-0", className)}>
      <polyline points={points} fill="none" stroke={COOL} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
