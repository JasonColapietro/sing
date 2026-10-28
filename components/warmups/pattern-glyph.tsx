import type { WarmupExercise } from "./exercises";

/** The shape of an exercise's pattern, read from the notes it builds. */
export type PatternShape = "siren" | "scale" | "arpeggio" | "sustain" | "trill" | "hum";

export function patternShape(ex: WarmupExercise): PatternShape {
  if (ex.glide) return "siren";
  const notes = ex.buildSteps(60).flat();
  if (notes.length <= 1) return "sustain";
  if (/trill/i.test(ex.title)) return "trill";
  if (/\bhum/i.test(ex.title)) return "hum";
  let widest = 0;
  for (let i = 1; i < notes.length; i++) widest = Math.max(widest, Math.abs(notes[i] - notes[i - 1]));
  return widest >= 3 ? "arpeggio" : "scale";
}

const PATHS: Record<PatternShape, string> = {
  siren: "M3 17c3-10 6-14 9-14s6 4 9 14",
  scale: "M3 19h4v-4h4v-4h4v-4h4",
  arpeggio: "M3 19l9-14 9 14",
  sustain: "M3 12h18",
  trill: "M3 14l3-5 3 5 3-5 3 5 3-5 3 5",
  hum: "M11 12h10",
};

/** A 24px static glyph of the pattern's shape, in `currentColor`, before an exercise name. */
export function PatternGlyph({ shape, className }: { shape: PatternShape; className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {shape === "hum" && <circle cx="6" cy="12" r="2" fill="currentColor" stroke="none" />}
      <path d={PATHS[shape]} />
    </svg>
  );
}
