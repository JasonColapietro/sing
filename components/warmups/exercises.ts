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
    tip: "Steady air, relaxed jaw. Keep the violet dot inside the block.",
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
  // The Morning reset pack, moved out from behind the paywall. It was the
  // gentle-wake-up set for rough days — which is to say, the pack that builds
  // the daily habit. Charging for the habit and giving away the hard work had
  // it backwards: the routine someone reaches for on a bad morning is exactly
  // the one that should be there before they have paid anything.
    {
      id: "morning-lip-trill",
      title: "Lip-trill wake-up",
      desc: 'A sleepy "brr" lip trill gliding up a third and back down.',
      tier: "beginner",
      glide: true,
      noteDur: 0.7,
      tip: "If the trill sputters, more air and looser lips — never more push.",
      buildSteps: (r) => [
        [r, r + 4],
        [r + 4, r],
      ],
    },
    {
      id: "morning-hum",
      title: "First hum",
      desc: "Three tiny hummed steps — root, up one tone, back home.",
      tier: "beginner",
      tip: "Barely more than breathing. Let the buzz find your face on its own.",
      noteDur: 0.8,
      buildSteps: (r) => [rel(r, [0, 2, 0])],
    },
    {
      id: "morning-three-note",
      title: "Small three-note climb",
      desc: 'Walk up 1-2-3 and back down on a soft "noo" — no hurry.',
      tier: "beginner",
      tip: "Morning voice is allowed. Keep it small and let the notes wake slowly.",
      noteDur: 0.6,
      buildSteps: (r) => [rel(r, [0, 2, 4, 2, 0])],
    },
    {
      id: "morning-siren",
      title: "Easy fourth siren",
      desc: "A lazy little siren up a fourth and back — half awake is fine.",
      tier: "beginner",
      glide: true,
      noteDur: 0.6,
      tip: "Think yawn, not siren drill. Loose jaw, easy slide.",
      buildSteps: (r) => [
        [r, r + 5],
        [r + 5, r],
      ],
    },
    {
      id: "morning-sigh",
      title: "Sighing slide",
      desc: "Slide from the third down to the root like a long, relieved sigh.",
      tier: "beginner",
      glide: true,
      noteDur: 1,
      tip: "Start the sigh before the note — let the pitch ride out on the air.",
      buildSteps: (r) => [[r + 4, r]],
    },
    {
      id: "morning-sustain",
      title: "Soft sustain",
      desc: "One soft, steady note to finish — quiet, centered, unhurried.",
      tier: "beginner",
      tip: "Steady beats loud. If it wobbles, sing it smaller.",
      noteDur: 2.5,
      buildSteps: (r) => [[r]],
    },
];

export interface WarmupPack {
  id: string;
  name: string;
  desc: string;
  exercises: WarmupExercise[];
}

export const PRO_PACKS: WarmupPack[] = [
  {
    id: "belt-prep",
    name: "Belt prep",
    desc: "Chest-voice power without strain, 8 exercises.",
    exercises: [
      {
        id: "belt-hey-thirds",
        title: "Hey on falling thirds",
        desc: 'Call and answer — a bright "hey" dropping a major third, twice.',
        tier: "intermediate",
        tip: "Think playground call, not scream. Power comes from the body, never the throat.",
        noteDur: 0.6,
        buildSteps: (r) => [rel(r, [4, 0, 4, 0])],
      },
      {
        id: "belt-forte-ah",
        title: "Forte ah hold",
        desc: 'One strong "ah" at forte — full voice, held steady on a single note.',
        tier: "intermediate",
        tip: "Big sound, low effort. If your neck tightens, back off ten percent.",
        noteDur: 3,
        buildSteps: (r) => [[r]],
      },
      {
        id: "belt-yah-triad",
        title: "Yah triad",
        desc: 'Punch through 1-3-5-3-1 on "yah" — bright vowel, chest-voice color.',
        tier: "intermediate",
        tip: 'Let the "y" spring each note forward. No gripping at the top of the triad.',
        noteDur: 0.55,
        buildSteps: (r) => [rel(r, [0, 4, 7, 4, 0])],
      },
      {
        id: "belt-octave-drop",
        title: "Octave-drop hey",
        desc: 'Start "hey" on the octave and drop straight home, twice.',
        tier: "intermediate",
        tip: "Start light up top and land solid — the drop does the work, not you.",
        noteDur: 0.6,
        buildSteps: (r) => [rel(r, [12, 0, 12, 0])],
      },
      {
        id: "belt-nay-speech",
        title: "Speech-level nays",
        desc: '"Nay nay nay nay nay" on one repeated note, right at speaking volume.',
        tier: "intermediate",
        tip: "Bratty is correct. Keep it forward and buzzy, like a playground taunt.",
        noteDur: 0.45,
        buildSteps: (r) => [rel(r, [0, 0, 0, 0, 0])],
      },
      {
        id: "belt-bah-bursts",
        title: "Bah bursts",
        desc: 'Four short "bah" bursts climbing 1-2-3-4 — crisp starts, no sliding.',
        tier: "intermediate",
        tip: "Each burst starts from air, not from squeeze. Reset between notes.",
        noteDur: 0.4,
        buildSteps: (r) => [rel(r, [0, 2, 4, 5])],
      },
      {
        id: "belt-fifth-hold",
        title: "Fifth hold",
        desc: "Sustain the root, then the fifth — two long, even holds at full voice.",
        tier: "intermediate",
        tip: "Match the fifth to the root's effort — same body, higher pitch.",
        noteDur: 2,
        buildSteps: (r) => [rel(r, [0, 7])],
      },
      {
        id: "belt-hah-descent",
        title: "Hah descent",
        desc: 'Descend 5-4-3-2-1 on an open "hah", keeping chest color all the way down.',
        tier: "intermediate",
        tip: "Stay full as you descend — don't let the bottom notes go breathy.",
        noteDur: 0.5,
        buildSteps: (r) => [rel(r, [7, 5, 4, 2, 0])],
      },
    ],
  },
  {
    id: "head-voice-builder",
    name: "Head-voice builder",
    desc: "Light, connected top notes, 7 exercises.",
    exercises: [
      {
        id: "head-oo-siren",
        title: "Oo siren to the octave",
        desc: 'Glide a full octave up and back down on a small, hooty "oo".',
        tier: "intermediate",
        glide: true,
        noteDur: 1,
        tip: "Small mouth, tall sound. Let the top feel like it floats off the breath.",
        buildSteps: (r) => [
          [r, r + 12],
          [r + 12, r],
        ],
      },
      {
        id: "head-wee-descent",
        title: "Wee from the fifth",
        desc: 'Fall 5-3-1 on a light "wee" — thin, sweet, and connected.',
        tier: "intermediate",
        tip: 'Keep the "w" soft and let each note land like a feather.',
        noteDur: 0.7,
        buildSteps: (r) => [rel(r, [7, 4, 0])],
      },
      {
        id: "head-hum-five",
        title: "Hummed five down",
        desc: "Hum down 5-4-3-2-1 with the buzz parked behind your nose.",
        tier: "intermediate",
        tip: "If the hum rattles your throat, lighten until it only buzzes your face.",
        noteDur: 0.55,
        buildSteps: (r) => [rel(r, [7, 5, 4, 2, 0])],
      },
      {
        id: "head-octave-leaps",
        title: "Octave leaps on oo",
        desc: 'Leap a clean octave on "oo" and return, twice — no weight up top.',
        tier: "intermediate",
        tip: "Aim just above the top note and drop onto it — never climb into it.",
        noteDur: 0.6,
        buildSteps: (r) => [rel(r, [0, 12, 0, 12, 0])],
      },
      {
        id: "head-loo-arpeggio",
        title: "Loo octave arpeggio",
        desc: 'Roll through 1-5-8-5-1 on "loo", light as a music box.',
        tier: "intermediate",
        tip: 'Let the "l" reset each note. The octave should feel easier than the fifth.',
        noteDur: 0.6,
        buildSteps: (r) => [rel(r, [0, 7, 12, 7, 0])],
      },
      {
        id: "head-fifth-siren",
        title: "Gentle fifth siren",
        desc: "A soft siren to the fifth and back — the smallest sound that still slides.",
        tier: "intermediate",
        glide: true,
        noteDur: 0.8,
        tip: "Half the volume you think you need. Smooth beats loud here.",
        buildSteps: (r) => [
          [r, r + 7],
          [r + 7, r],
        ],
      },
      {
        id: "head-float-hold",
        title: "Top-note float",
        desc: "Hold one light note at the fifth and let it hover — pure head voice.",
        tier: "intermediate",
        tip: "Imagine the note resting on the breath, like a ball on a fountain.",
        noteDur: 3,
        buildSteps: (r) => [[r + 7]],
      },
    ],
  },
];

export const ALL_EXERCISES: WarmupExercise[] = [
  ...EXERCISES,
  ...PRO_PACKS.flatMap((p) => p.exercises),
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
 * Every semitone root from the ladder's bottom to its top. With a saved
 * range, start a major third above the low note and stop a fourth below the
 * high note (accounting for the exercise's highest interval). Without one,
 * default to the classic C3→G3 ladder. The player walks this band up and
 * down endlessly — see ladderWalk — so the ladder is the singer's whole
 * comfortable span, not a fixed rep count.
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
    return Array.from({ length: top - start + 1 }, (_, i) => start + i);
  }
  return Array.from({ length: 8 }, (_, i) => 48 + i); // C3..G3
}

/** One rep of the endless up-and-down ladder walk. */
export interface LadderStep {
  /** Root midi to sing on this rep. */
  root: number;
  /** Position in the ladder, 0 = bottom note. */
  index: number;
  /** Where the walk heads after this rep: up toward the top, or back down. */
  ascending: boolean;
}

/**
 * Map a rep counter onto the ladder walked as a triangle wave —
 * 0, 1, …, n-1, n-2, …, 1, 0, 1, … — so an exercise keeps ascending and
 * descending for as long as the singer keeps going. The top and bottom
 * notes are sung once per turn, never twice in a row.
 */
export function ladderWalk(ladder: number[], rep: number): LadderStep {
  const n = ladder.length;
  if (n <= 1) return { root: ladder[0] ?? 48, index: 0, ascending: true };
  const period = 2 * n - 2;
  const pos = rep % period;
  const index = pos < n ? pos : period - pos;
  return { root: ladder[index], index, ascending: pos < n - 1 };
}

/** Rough length of one climb of the ladder: each rep plays the guide then a 120% sing window. */
export function estimateMinutes(ex: WarmupExercise, reps: number): number {
  const { totalSec } = buildSegments(ex, 60, 1);
  const secs = reps * (totalSec * 2.2 + 2);
  return Math.max(1, Math.round(secs / 60));
}
