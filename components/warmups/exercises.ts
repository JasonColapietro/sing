// Guided warmup exercise library for Suede Sing.

export type WarmupTier = "beginner" | "intermediate" | "advanced";

export const TIER_ORDER: WarmupTier[] = ["beginner", "intermediate", "advanced"];

export const TIER_LABELS: Record<WarmupTier, string> = {
  beginner: "Tier 1 · Foundations",
  intermediate: "Tier 2 · Building",
  advanced: "Tier 3 · Stretching",
};

export interface WarmupExercise {
  id: string;
  title: string;
  desc: string;
  tier: WarmupTier;
  /** Friendly coaching cue shown while practicing. */
  tip: string;
  /** Seconds per note at 1x tempo (glide steps last twice this). */
  noteDur?: number;
  /** Steps are two-note pitch glides (sirens) instead of discrete notes. */
  glide?: boolean;
  /** Each step is a small melody in midi numbers, built from a root note. */
  buildSteps(rootMidi: number): number[][];
}

const rel = (root: number, offsets: number[]) => offsets.map((o) => root + o);

export const EXERCISES: WarmupExercise[] = [
  {
    id: "five-note-scale",
    title: "Five-note scale",
    desc: 'The classic warmup ladder — up the first five notes of the major scale and back down on "ah".',
    tier: "beginner",
    tip: "Keep every step light and connected — no pushing at the top.",
    noteDur: 0.5,
    buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 5, 4, 2, 0])],
  },
  {
    id: "humming-thirds",
    title: "Humming thirds",
    desc: "Hum gently between the root and the major third to wake up resonance.",
    tier: "beginner",
    tip: "Lips together, teeth apart. Feel the buzz in your face, not your throat.",
    noteDur: 0.6,
    buildSteps: (r) => [rel(r, [0, 4, 0, 4, 0])],
  },
  {
    id: "descending-five",
    title: "Descending five",
    desc: 'Start on the fifth and melt down to the root — 5-4-3-2-1 on "oo".',
    tier: "beginner",
    tip: "Think of a sigh — let gravity carry each note down.",
    noteDur: 0.55,
    buildSteps: (r) => [rel(r, [7, 5, 4, 2, 0])],
  },
  {
    id: "legato-triad",
    title: "Legato triad",
    desc: "Pour through 1-3-5-3-1 on one smooth breath — no bumps between notes.",
    tier: "beginner",
    tip: "Imagine the notes as one line, not five dots.",
    noteDur: 0.7,
    buildSteps: (r) => [rel(r, [0, 4, 7, 4, 0])],
  },
  {
    id: "sustained-hold",
    title: "Sustained hold",
    desc: "One note, held steady. Keep the pitch dead center for the whole block.",
    tier: "beginner",
    tip: "Steady air, relaxed jaw. Keep the amber dot inside the block.",
    noteDur: 3.5,
    buildSteps: (r) => [[r]],
  },
  {
    id: "octave-arpeggio",
    title: "Octave arpeggio",
    desc: "Climb the triad to the octave and back — 1-3-5-8-5-3-1.",
    tier: "intermediate",
    tip: "Stay tall on the top note — don't reach with your chin.",
    noteDur: 0.5,
    buildSteps: (r) => [rel(r, [0, 4, 7, 12, 7, 4, 0])],
  },
  {
    id: "minor-scale",
    title: "Minor five-note scale",
    desc: "The same ladder with a darker color — up and down the natural minor.",
    tier: "intermediate",
    tip: "Let the flat third sit low and easy. Don't brighten it.",
    noteDur: 0.5,
    buildSteps: (r) => [rel(r, [0, 2, 3, 5, 7, 5, 3, 2, 0])],
  },
  {
    id: "ng-siren-fifth",
    title: "Ng siren to the fifth",
    desc: 'Slide up a fifth and back down on an "ng" sound, like a small siren.',
    tier: "intermediate",
    glide: true,
    noteDur: 0.9,
    tip: "Slide, don't step — one unbroken sound from bottom to top.",
    buildSteps: (r) => [
      [r, r + 7],
      [r + 7, r],
    ],
  },
  {
    id: "chromatic-neighbor",
    title: "Chromatic neighbor",
    desc: "Pitch precision in the smallest step — root, up one semitone, back home.",
    tier: "intermediate",
    noteDur: 0.75,
    tip: "A tiny move — half a step. Precision over power.",
    buildSteps: (r) => [rel(r, [0, 1, 0])],
  },
  {
    id: "octave-siren",
    title: "Octave siren",
    desc: "Glide a full octave up and all the way back down like a fire siren.",
    tier: "advanced",
    glide: true,
    noteDur: 1.2,
    tip: "Slide down like a siren — let it fall all the way home.",
    buildSteps: (r) => [
      [r, r + 12],
      [r + 12, r],
    ],
  },
  {
    id: "sixth-leaps",
    title: "Major sixth leaps",
    desc: "Leap a major sixth cleanly and land back on the root, twice.",
    tier: "advanced",
    tip: "Hear the top note in your head before you jump.",
    noteDur: 0.65,
    buildSteps: (r) => [rel(r, [0, 9, 0, 9, 0])],
  },
];

/** One scored/rendered chunk of the melody. Plain notes have start === end. */
export interface Segment {
  startMidi: number;
  endMidi: number;
  /** Seconds from melody start (at the given tempo). */
  t0: number;
  dur: number;
}

/** Lay the exercise melody out as timed segments for a given root and tempo. */
export function buildSegments(
  ex: WarmupExercise,
  rootMidi: number,
  tempo: number,
): { segs: Segment[]; totalSec: number; noteDur: number; gap: number } {
  const noteDur = (ex.noteDur ?? 0.55) / tempo;
  const gap = 0.08 / tempo;
  const steps = ex.buildSteps(rootMidi);
  const segs: Segment[] = [];
  let t = 0;
  if (ex.glide) {
    for (const step of steps) {
      const a = step[0];
      const b = step[step.length - 1] ?? a;
      const dur = noteDur * 2;
      segs.push({ startMidi: a, endMidi: b, t0: t, dur });
      t += dur + gap;
    }
  } else {
    for (const step of steps) {
      for (const m of step) {
        segs.push({ startMidi: m, endMidi: m, t0: t, dur: noteDur });
        t += noteDur + gap;
      }
    }
  }
  return { segs, totalSec: Math.max(0.1, t - gap), noteDur, gap };
}

/**
 * Roots for each rep, climbing by semitones. With a saved range, start a
 * major third above the low note and stop a fourth below the high note
 * (accounting for the exercise's highest interval). Without one, default
 * to the classic C3→G3 ladder.
 */
export function computeRootLadder(
  ex: WarmupExercise,
  lowMidi?: number,
  highMidi?: number,
): number[] {
  const offsets = ex.buildSteps(0).flat();
  const maxOff = Math.max(...offsets);
  if (lowMidi !== undefined && highMidi !== undefined) {
    const start = Math.max(30, lowMidi + 4);
    const top = Math.max(start, highMidi - 5 - maxOff);
    const count = Math.max(6, Math.min(8, top - start + 1));
    return Array.from({ length: count }, (_, i) => Math.min(start + i, top));
  }
  return Array.from({ length: 8 }, (_, i) => 48 + i); // C3..G3
}

/** Rough session length: each rep plays the guide then a 120% sing window. */
export function estimateMinutes(ex: WarmupExercise, reps: number): number {
  const { totalSec } = buildSegments(ex, 60, 1);
  const secs = reps * (totalSec * 2.2 + 2);
  return Math.max(1, Math.round(secs / 60));
}
