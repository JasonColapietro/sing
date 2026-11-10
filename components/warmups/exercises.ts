// Guided warmup exercise library for Suede Sing.

import { planRep } from "./timeline";

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
  /**
   * Which end of the root ladder the walk starts from. Most exercises climb
   * from the bottom; Singeo's raspberries, hoo and puffy-cheeks descend by
   * half-steps from the top of the band, and the player honours that.
   */
  ladder?: "up" | "down";
  /**
   * Measure vibrato on every hold and report its rate against this band, in
   * hertz. Only for a single held note: the analysis reads one unbroken voiced
   * run, and a note change in the middle of it would read as modulation.
   */
  vibrato?: { minHz: number; maxHz: number };
  /**
   * Seconds at 1x of open time before the first note, inside the scored
   * window but with no target in it, so nothing sung there is scored or
   * counted against the score. For an onset the detector cannot hear, such
   * as a creak rolling into a note.
   */
  unscoredLeadSec?: number;
  /**
   * Seconds at 1x of silence between consecutive notes (or glide steps).
   * Defaults to NOTE_GAP_SEC, which is a re-articulation rather than a rest; a
   * staccato drill sets a longer one so each note is genuinely detached. The
   * gap is part of the pattern's length and is never scored: targetMidiAt
   * reads null there.
   */
  gapSec?: number;
  /**
   * Walk only this slice of the fitted root ladder, as fractions of it from
   * the bottom rung (0) to the top rung (1). Off by default, so the drill walks
   * the singer's whole comfortable span. For drills that belong in the middle
   * of the voice rather than at its edges, such as a swell or a strong hold.
   * See capLadder for the exact rounding.
   */
  rangeCap?: RangeCap;
  /** Each step is a small melody in midi numbers, built from a root note. */
  buildSteps(rootMidi: number): number[][];
}

/** A slice of the root ladder, as fractions from its bottom rung (0) to its top (1). */
export interface RangeCap {
  from: number;
  to: number;
}

/**
 * Seconds at 1x between consecutive notes when an exercise sets no `gapSec`:
 * long enough for the guide to re-strike a repeated note, short enough to read
 * as connected singing.
 */
export const NOTE_GAP_SEC = 0.08;

/**
 * The gap the staccato drills leave after each note at 1x: a short silence a
 * singer can hear and the detector reads as unvoiced, rather than the
 * re-articulation NOTE_GAP_SEC is.
 */
export const STACCATO_GAP_SEC = 0.15;

/**
 * The middle of the comfortable range: the ladder's middle half. Where a swell
 * or a strong hold is practised before it is taken toward either edge.
 */
export const MIDDLE_OF_RANGE: RangeCap = { from: 0.25, to: 0.75 };

/**
 * The lower part of the comfortable range, for loud, speech-like holds and
 * calls: a strong sound held high is the version of the drill to build toward,
 * not the one to repeat every rung.
 */
export const LOWER_MIDDLE_OF_RANGE: RangeCap = { from: 0, to: 0.6 };

/**
 * The lower half of the comfortable range, for the cool-down and recovery
 * drills. A "down" ladder starts on its top rung, so without this a cool-down
 * spent every rep in the upper half of the voice and never came back toward
 * speaking pitch.
 */
export const LOWER_HALF_OF_RANGE: RangeCap = { from: 0, to: 0.5 };

/**
 * The upper half of the comfortable range, for a light hold meant to sit at or
 * near the singer's transition rather than below it. Walked from the bottom of
 * the whole ladder, a bass's float sat at D#3–A#3, under his first break.
 */
export const UPPER_HALF_OF_RANGE: RangeCap = { from: 0.5, to: 1 };

/**
 * The span every ladder is fitted to before a range test has been taken:
 * A2–E4, inside the baritone band lib/audio/notes.ts uses (A2–A4) and, an
 * octave up (A3–E5), inside its mezzo band (A3–A5). Without a saved range the
 * scorer counts either octave, so one nominal span serves lower and higher
 * voices. It is a placeholder, not a guess at anyone's voice: a tenor's floor
 * or a bass's ceiling can sit inside it, and the range test replaces it with
 * the singer's own.
 */
export const NOMINAL_RANGE = { lowMidi: 45, highMidi: 64 } as const;

const rel = (root: number, offsets: number[]) => offsets.map((o) => root + o);

/**
 * The rate band the vibrato drills aim for. Sung vibrato is conventionally
 * five to seven cycles a second; lib/audio/vibrato.ts accepts a wider band as
 * vibrato at all, and this is the narrower one the drill calls on target.
 */
export const VIBRATO_TARGET_BAND = { minHz: 5, maxHz: 7 } as const;

/**
 * The free catalogue, grouped by where each exercise came from. The order a
 * singer meets them in is PATH_ORDER below, not this array's: grouping by
 * origin keeps the notes on each group next to the exercises they explain.
 */
const CATALOGUE: WarmupExercise[] = [
  {
    id: "five-note-scale",
    title: "Five-note scale",
    desc: 'The classic warmup ladder: up the first five notes of the major scale and back down on "ah".',
    tier: "beginner",
    tip: "Keep every step light and connected, with no pushing at the top.",
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
    desc: 'Start on the fifth and melt down to the root: 5-4-3-2-1 on "oo".',
    tier: "beginner",
    tip: "Think of a sigh, and let gravity carry each note down.",
    noteDur: 0.55,
    buildSteps: (r) => [rel(r, [7, 5, 4, 2, 0])],
  },
  {
    id: "legato-triad",
    title: "Legato triad",
    desc: "Pour through 1-3-5-3-1 on one smooth breath, with no bumps between notes.",
    tier: "beginner",
    tip: "Imagine the notes as one line, not five dots.",
    noteDur: 0.7,
    buildSteps: (r) => [rel(r, [0, 4, 7, 4, 0])],
  },
  {
    id: "sustained-hold",
    title: "Sustained hold",
    desc: "One note, held steady. Keep the pitch dead center from start to finish.",
    tier: "beginner",
    tip: "Start the note gently, with no click or push at the front of it. Steady air, relaxed jaw, and keep your dot on the bar: it turns green while you are within 50 cents of the note.",
    noteDur: 3.5,
    buildSteps: (r) => [[r]],
  },
  {
    id: "octave-arpeggio",
    title: "Octave arpeggio",
    desc: "Climb the triad to the octave and back: 1-3-5-8-5-3-1.",
    tier: "intermediate",
    tip: "Stay tall on the top note. Don't reach with your chin.",
    noteDur: 0.5,
    buildSteps: (r) => [rel(r, [0, 4, 7, 12, 7, 4, 0])],
  },
  {
    id: "minor-scale",
    title: "Minor five-note scale",
    desc: "The same ladder with a darker color: up and down the first five notes of the minor scale.",
    tier: "intermediate",
    tip: "The third is only a half-step lower than in the major ladder. Tune it there on purpose rather than letting it sag.",
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
    tip: "Slide, don't step: one unbroken sound from bottom to top.",
    buildSteps: (r) => [
      [r, r + 7],
      [r + 7, r],
    ],
  },
  {
    id: "chromatic-neighbor",
    title: "Chromatic neighbor",
    desc: "Pitch precision in the smallest step: root, up one semitone, back home.",
    tier: "intermediate",
    noteDur: 0.75,
    tip: "A tiny move: half a step. Precision over power.",
    buildSteps: (r) => [rel(r, [0, 1, 0])],
  },
  {
    id: "octave-siren",
    title: "Octave siren",
    desc: "Glide a full octave up and all the way back down like a fire siren.",
    tier: "advanced",
    glide: true,
    noteDur: 1.2,
    tip: "Start small and quiet. Let the sound get lighter as it climbs instead of pushing it up; if it flips at the top, keep sliding and let it fall all the way home.",
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
  // The exercise types a documented Singeo warmup runs on and this catalogue
  // did not have. The shapes, note lengths and ladder directions below are not
  // taken from the blog copy but measured from the piano guide in Singeo's two
  // public warm-up videos (the "Easy 7-minute" and the "Complete 10-minute",
  // pitch-tracked 2026-09-03 — see docs/research/singeo-warmup-parameters.md):
  // the bubble is a 1-3-5-8-5-3-1 arpeggio at ~0.42s a note, N and gug are a
  // 13-note run up the arpeggio to the 12th (1-3-5-8-10-12) and back down
  // 11-9-7-5-4-2-1, mostly in skips rather than down the scale, hung-ee-mm is
  // three five-note passes in one breath, and hoo is a slow 8-5-3-1 that walks
  // DOWN by half-steps. The consonant or vowel is in the title and the tip,
  // since the detector only hears the pitch.
  {
    id: "lip-trill-scale",
    title: "Lip-trill arpeggio",
    desc: 'The bubble: "brr" through 1-3-5-8-5-3-1, climbing by half-steps and back down.',
    tier: "beginner",
    tip: "Loose lips, steady air. If the bubble stalls, less push and more breath; a fingertip lifting each cheek helps lips that will not trill.",
    noteDur: 0.42,
    buildSteps: (r) => [rel(r, [0, 4, 7, 12, 7, 4, 0])],
  },
  {
    id: "straw-scale",
    title: "Straw scale",
    desc: "Puff the cheeks and blow through pursed lips (or a real straw) up five notes and down.",
    tier: "beginner",
    tip: "Cheeks stay full. The narrow opening does the work, so do not press the tone.",
    noteDur: 0.46,
    buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 5, 4, 2, 0])],
  },
  {
    id: "n-hum-scale",
    title: "N run",
    desc: 'Hum on "n" up the arpeggio to the twelfth (1-3-5-8-10-12), then back down 11-9-7-5-4-2-1: thirteen notes on one breath.',
    tier: "intermediate",
    tip: "All of it through the nose, tongue on the roof of the mouth. Feel the buzz behind the top teeth.",
    noteDur: 0.3,
    buildSteps: (r) => [rel(r, [0, 4, 7, 12, 16, 19, 17, 14, 11, 7, 5, 2, 0])],
  },
  {
    id: "hoo-four-note",
    title: "Hoo descent",
    desc: 'A slow "hoo" down 8-5-3-1, each rep a half-step lower. Let vibrato happen if it wants to.',
    tier: "beginner",
    tip: "Long and easy. Start the top note light. Leave room for vibrato instead of making it.",
    noteDur: 1,
    ladder: "down",
    buildSteps: (r) => [rel(r, [12, 7, 4, 0])],
  },
  {
    id: "tongue-trill-descent",
    title: "Tongue-trill descent",
    desc: 'Raspberries or a rolled "r" falling 5-4-3-2-1, each rep a half-step lower.',
    tier: "intermediate",
    tip: "If the tongue will not roll, a loose raspberry counts. Stretch the tongue out between reps.",
    noteDur: 0.6,
    ladder: "down",
    buildSteps: (r) => [rel(r, [7, 5, 4, 2, 0])],
  },
  {
    id: "hung-ee-mm",
    title: "Hung-ee-mm",
    desc: 'Three five-note passes on one breath: "hung" up and down, "ee" up and down, "mm" up and down.',
    tier: "intermediate",
    tip: "Blend the three sounds into one line. Nothing restarts between them.",
    noteDur: 0.3,
    buildSteps: (r) => [
      rel(r, [0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0]),
    ],
  },
  {
    id: "gug-staccato",
    title: "Staccato gug",
    desc: 'Thirteen short, detached "gug"s, up the arpeggio to the twelfth and back down 11-9-7-5-4-2-1, with a little silence after each one.',
    tier: "intermediate",
    tip: 'Short and bouncy, and leave a small gap of silence after every note. The "g" restarts each one from the breath, never a squeeze in the throat, and every note still gets its pitch.',
    noteDur: 0.25,
    gapSec: STACCATO_GAP_SEC,
    buildSteps: (r) => [rel(r, [0, 4, 7, 12, 16, 19, 17, 14, 11, 7, 5, 2, 0])],
  },
  {
    id: "v-double-arpeggio",
    title: "V double arpeggio",
    desc: 'A "vvv" (or "zzz") through 1-3-5-8-5-3-1 twice on one breath.',
    tier: "intermediate",
    tip: "Teeth on the lip, air moving the whole time. The second arpeggio is the same as the first.",
    noteDur: 0.3,
    buildSteps: (r) => [rel(r, [0, 4, 7, 12, 7, 4, 0, 4, 7, 12, 7, 4, 0])],
  },
  {
    id: "reverse-arpeggio",
    title: "Reverse arpeggio",
    desc: "The range builder: start on the octave and come down 8-5-3-1, then back up.",
    tier: "intermediate",
    tip: "Begin light on the top; the descent is where the body of the note arrives.",
    noteDur: 0.5,
    buildSteps: (r) => [rel(r, [12, 7, 4, 0, 4, 7, 12])],
  },
  {
    id: "agility-run",
    title: "Agility run",
    desc: 'The speed challenge: five notes up and down twice on "mum", fast. Slow the tempo first.',
    tier: "advanced",
    tip: "Pitch accuracy before speed. Drop to 0.75× under Adjust until every note lands.",
    noteDur: 0.25,
    buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0])],
  },
  {
    id: "pentatonic-run",
    title: "Pentatonic run",
    desc: 'A riff-shaped run down the pentatonic: 8-6-5-3-2-1 on "no".',
    tier: "advanced",
    tip: "This is the shape of most pop and gospel runs. Make every step a real note, not a slide.",
    noteDur: 0.3,
    buildSteps: (r) => [rel(r, [12, 9, 7, 4, 2, 0])],
  },
  {
    id: "gee-octave",
    title: "Gee to the octave",
    desc: 'The head-voice wake-up: a bright "gee" through 1-5-8-5-1.',
    tier: "advanced",
    tip: 'Let the "g" flip the note up light. No weight on the octave.',
    noteDur: 0.6,
    buildSteps: (r) => [rel(r, [0, 7, 12, 7, 0])],
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
      tip: "If the trill sputters, more air and looser lips, never more push.",
      buildSteps: (r) => [
        [r, r + 4],
        [r + 4, r],
      ],
    },
    {
      id: "morning-hum",
      title: "First hum",
      desc: "Three tiny hummed steps: root, up one tone, back home.",
      tier: "beginner",
      tip: "Soft but voiced, a hum you could hear across a quiet room. Let the buzz find your face on its own.",
      noteDur: 0.8,
      buildSteps: (r) => [rel(r, [0, 2, 0])],
    },
    {
      id: "morning-three-note",
      title: "Small three-note climb",
      desc: 'Walk up 1-2-3 and back down on a soft "noo". No hurry.',
      tier: "beginner",
      tip: "Morning voice is allowed. Keep it small and let the notes wake slowly.",
      noteDur: 0.6,
      buildSteps: (r) => [rel(r, [0, 2, 4, 2, 0])],
    },
    {
      id: "morning-siren",
      title: "Easy fourth siren",
      desc: "A lazy little siren up a fourth and back. Half awake is fine.",
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
      tip: "Start the sigh before the note, and let the pitch ride out on the air.",
      buildSteps: (r) => [[r + 4, r]],
    },
    {
      id: "morning-sustain",
      title: "Soft sustain",
      desc: "One soft, steady note to finish: quiet, centered, unhurried.",
      tier: "beginner",
      tip: "Steady beats loud. If it wobbles, sing it smaller.",
      noteDur: 2.5,
      buildSteps: (r) => [[r]],
    },
  // Vibrato. Each hold is long enough for lib/audio/vibrato.ts to see several
  // cycles after the onset it skips, and the player reports the rate and width
  // of the wobble it measured. That is all it reports: two numbers about the
  // pitch contour, never whether the vibrato sounded good.
  //
  // Both holds walk the middle of the range (MIDDLE_OF_RANGE), like the swell.
  // Uncapped, a bounded routine step walks from rung 0, a third above the
  // floor, so the vibrato routine and the program built on it held every note
  // in the bottom of the voice, where a free vibrato is least likely to turn
  // up, against the float's own tip.
  {
    id: "vibrato-hold",
    title: "Vibrato hold",
    desc: "One long, easy note. Start it straight, then let it wobble. After each hold you see how fast and how wide the pitch moved.",
    tier: "intermediate",
    tip: "Do not shake it out of the jaw or the belly. Relax and let the note move on its own; straight is a fine answer too.",
    noteDur: 4.5,
    vibrato: VIBRATO_TARGET_BAND,
    rangeCap: MIDDLE_OF_RANGE,
    buildSteps: (r) => [[r]],
  },
  {
    id: "vibrato-float-high",
    title: "Vibrato on the fourth",
    desc: "The same long hold a fourth higher, sung light. The reading shows the rate and width of the wobble, nothing more.",
    tier: "intermediate",
    tip: "Lighter than you think. A higher note held softly is often where vibrato turns up first.",
    noteDur: 4.5,
    vibrato: VIBRATO_TARGET_BAND,
    rangeCap: MIDDLE_OF_RANGE,
    buildSteps: (r) => [[r + 5]],
  },
  // Recovery: small, quiet, low-effort patterns in a narrow comfortable band,
  // for a voice that feels tired. The two descents walk only the lower half of
  // the fitted ladder (LOWER_HALF_OF_RANGE), easing down toward speaking pitch
  // rather than starting at the top of it. The detector cannot hear vocal fry,
  // so the creak in "Creak to tone" is for the singer; only the pitched note
  // after it is scored, as everywhere else.
  {
    id: "quiet-hum-descent",
    title: "Quiet hum descent",
    desc: "A quiet hum down 3-2-1, each rep a half-step lower: soft, but loud enough for the mic to hear the pitch.",
    tier: "beginner",
    tip: "Softer than usual, but still a voiced hum. Lips closed, jaw loose, and let each note settle rather than place it.",
    noteDur: 0.8,
    ladder: "down",
    rangeCap: LOWER_HALF_OF_RANGE,
    buildSteps: (r) => [rel(r, [4, 2, 0])],
  },
  {
    id: "soft-trill-slide",
    title: "Soft lip-trill slide",
    desc: 'A gentle "brr" sliding down a third, like a slow sigh through loose lips.',
    tier: "beginner",
    glide: true,
    noteDur: 1,
    ladder: "down",
    rangeCap: LOWER_HALF_OF_RANGE,
    tip: "Easy air, loose lips. If the trill stops, use a hum instead; nothing here needs effort.",
    buildSteps: (r) => [[r + 4, r]],
  },
  {
    id: "fry-onset",
    title: "Creak to tone",
    desc: "Start in a quiet creak (vocal fry) and roll up into a clean, soft note when the guide comes in, then hold it. Only the pitched note is scored.",
    tier: "beginner",
    tip: "Creak through the gap before the bar, then roll into the note. The app hears the note, not the creak; if the creak scratches, start on a soft sigh instead.",
    noteDur: 2.5,
    unscoredLeadSec: 1.5,
    buildSteps: (r) => [[r]],
  },
  // Range expansion: arpeggios and sirens that reach past the octave to the
  // tenth, walked up the root ladder a semitone at a time, and a top-down float
  // that starts high and light. computeRootLadder keeps every top note inside
  // the singer's measured range.
  {
    id: "high-arpeggio-tenth",
    title: "Arpeggio to the tenth",
    desc: 'Climb 1-3-5-8-10 and back down on "nee", one step past the octave.',
    tier: "advanced",
    tip: "Get lighter as you climb. The tenth should feel like the octave with less weight, not more.",
    noteDur: 0.45,
    buildSteps: (r) => [rel(r, [0, 4, 7, 12, 16, 12, 7, 4, 0])],
  },
  {
    id: "high-siren-tenth",
    title: "Siren to the tenth",
    desc: 'Slide from the root up to the tenth and back on "oo", like a long siren.',
    tier: "advanced",
    glide: true,
    noteDur: 1.3,
    tip: "Keep the sound small at the top. If it cracks, slide on; the slide is the exercise.",
    buildSteps: (r) => [
      [r, r + 16],
      [r + 16, r],
    ],
  },
  {
    id: "high-float-descent",
    title: "Top-down float",
    desc: "Start on the tenth, soft and high, and float down 10-8-5-3-1. Each rep starts a half-step lower.",
    tier: "advanced",
    tip: "Begin light on the top note and let the weight arrive as you come down.",
    noteDur: 0.6,
    ladder: "down",
    buildSteps: (r) => [rel(r, [16, 12, 7, 4, 0])],
  },
  // Two gaps a voice teacher's session plan fills and this catalogue did not.
  // Messa di voce: one note that swells and fades. The detector cannot hear
  // loudness as a level, so what is scored is the part it can hear and the part
  // that is genuinely hard: the pitch holding still while the volume moves.
  // And a semi-occluded cool-down: a straw slide down, walked down the lower
  // half of the ladder, so a session can end the way it started, on the
  // easiest sound there is, settling toward speaking pitch.
  {
    id: "swell-and-fade",
    title: "Swell and fade",
    desc: 'Messa di voce: one long "ah" that starts soft, grows to a comfortable medium and fades back to soft. Only the pitch is scored, so the drill is keeping it level while the volume moves.',
    tier: "intermediate",
    tip: "Grow it with air, not squeeze, and stop well short of loud. Pitch likes to rise as you swell and sag as you fade; keep it on the line. The ladder stays in the middle of your range, where the swell is easiest to control.",
    noteDur: 5,
    rangeCap: MIDDLE_OF_RANGE,
    buildSteps: (r) => [[r]],
  },
  {
    id: "straw-slide-down",
    title: "Straw cool-down",
    desc: "Slide gently down a fifth through a straw or pursed lips, each rep a half-step lower. The easy way to finish a session.",
    tier: "beginner",
    glide: true,
    noteDur: 1,
    ladder: "down",
    rangeCap: LOWER_HALF_OF_RANGE,
    tip: "Soft, like a sigh through the straw. Let the voice settle back toward speaking pitch; nothing here needs effort.",
    buildSteps: (r) => [[r + 7, r]],
  },
];

/**
 * The order the path teaches the free catalogue in, tier by tier. The path's
 * "Next" pill goes on the first unstarred row of the lowest unfinished tier,
 * so this is the order a new singer meets the exercises in, and it follows the
 * order a voice teacher builds a session: semi-occluded sounds first (hums,
 * lip trills, the straw), then easy slides and descending patterns, then open
 * vowels on scales and arpeggios, then long holds, with the quiet recovery and
 * cool-down drills at the end of the tier. The middle tier goes sirens and
 * semi-occluded runs, then wider patterns, onsets and the long-hold drills;
 * the top tier goes slides before leaps, and speed last.
 *
 * Every catalogue id appears exactly once (the test pins it). An id missing
 * from this list would still be served, after the listed ones, rather than
 * vanish.
 */
export const PATH_ORDER: readonly string[] = [
  // Tier 1 · Foundations
  "morning-hum",
  "humming-thirds",
  "morning-lip-trill",
  "lip-trill-scale",
  "straw-scale",
  "morning-siren",
  "morning-sigh",
  "descending-five",
  "hoo-four-note",
  "morning-three-note",
  "five-note-scale",
  "legato-triad",
  "morning-sustain",
  "sustained-hold",
  "fry-onset",
  "quiet-hum-descent",
  "soft-trill-slide",
  "straw-slide-down",
  // Tier 2 · Building
  "ng-siren-fifth",
  "tongue-trill-descent",
  "n-hum-scale",
  "v-double-arpeggio",
  "hung-ee-mm",
  "octave-arpeggio",
  "reverse-arpeggio",
  "minor-scale",
  "chromatic-neighbor",
  "gug-staccato",
  "swell-and-fade",
  "vibrato-hold",
  "vibrato-float-high",
  // Tier 3 · Stretching
  "octave-siren",
  "gee-octave",
  "sixth-leaps",
  "high-siren-tenth",
  "high-float-descent",
  "high-arpeggio-tenth",
  "agility-run",
  "pentatonic-run",
];

function pathRank(id: string): number {
  const i = PATH_ORDER.indexOf(id);
  return i === -1 ? PATH_ORDER.length : i;
}

/** The free catalogue, in path order. Array.prototype.sort is stable. */
export const EXERCISES: WarmupExercise[] = [...CATALOGUE].sort(
  (a, b) => pathRank(a.id) - pathRank(b.id),
);

export interface WarmupPack {
  id: string;
  name: string;
  desc: string;
  exercises: WarmupExercise[];
}

/**
 * Titles an exercise used to log under. Sessions carry the title, not an id,
 * so a rename would otherwise zero a returning singer's stars and "Best %"
 * for that row. Add a line here whenever a title changes; the test pins it.
 */
export const RETIRED_TITLES: Record<string, readonly string[]> = {
  "Lip-trill arpeggio": ["Lip-trill scale"],
  "N run": ["N-hum scale"],
  "Hoo descent": ["Four-note hoo", "Hoo descending arpeggio"],
  "Hung-ee-mm": ["Hung-ee-mm scale"],
};

/** Every title a session for this exercise may have been filed under. */
export function titlesFor(exerciseTitle: string): readonly string[] {
  return [exerciseTitle, ...(RETIRED_TITLES[exerciseTitle] ?? [])];
}

export const PRO_PACKS: WarmupPack[] = [
  {
    id: "belt-prep",
    name: "Belt prep",
    desc: "Speech-level calls that build to strong chest-voice holds, then come back down, 8 exercises.",
    exercises: [
      {
        id: "belt-nay-speech",
        title: "Speech-level nays",
        desc: '"Nay nay nay nay nay" on one repeated note, right at speaking volume.',
        tier: "intermediate",
        tip: "Bratty is correct. Keep it forward and buzzy, like a playground taunt.",
        noteDur: 0.45,
        rangeCap: LOWER_MIDDLE_OF_RANGE,
        buildSteps: (r) => [rel(r, [0, 0, 0, 0, 0])],
      },
      {
        id: "belt-hey-thirds",
        title: "Hey on falling thirds",
        desc: 'Call and answer: a bright "hey" dropping a major third, twice.',
        tier: "intermediate",
        tip: "Think playground call, not scream. The size comes from a bright, forward \"hey\", not from pushing more air or squeezing the throat.",
        noteDur: 0.6,
        rangeCap: LOWER_MIDDLE_OF_RANGE,
        buildSteps: (r) => [rel(r, [4, 0, 4, 0])],
      },
      {
        id: "belt-bah-bursts",
        title: "Bah bursts",
        desc: 'Four short "bah" bursts climbing 1-2-3-4, with crisp starts and no sliding.',
        tier: "intermediate",
        tip: "Each burst starts from air, not from squeeze. Leave a short silence to reset between notes.",
        noteDur: 0.4,
        gapSec: STACCATO_GAP_SEC,
        rangeCap: LOWER_MIDDLE_OF_RANGE,
        buildSteps: (r) => [rel(r, [0, 2, 4, 5])],
      },
      {
        id: "belt-yah-triad",
        title: "Yah triad",
        desc: 'Punch through 1-3-5-3-1 on "yah" with a bright vowel and chest-voice color.',
        tier: "intermediate",
        tip: 'Let the "y" spring each note forward. No gripping at the top of the triad.',
        noteDur: 0.55,
        rangeCap: LOWER_MIDDLE_OF_RANGE,
        buildSteps: (r) => [rel(r, [0, 4, 7, 4, 0])],
      },
      {
        id: "belt-forte-ah",
        title: "Forte ah hold",
        desc: 'One strong "ah", loud but comfortable, held steady on a single note.',
        tier: "intermediate",
        tip: "Big sound, low effort. If your neck tightens or the sound turns rough, back off; if it tickles or hurts, stop for the day.",
        noteDur: 3,
        rangeCap: LOWER_MIDDLE_OF_RANGE,
        buildSteps: (r) => [[r]],
      },
      {
        id: "belt-fifth-hold",
        title: "Fifth hold",
        desc: "Sustain the root, then the fifth: two long, even holds in a strong, speech-like voice.",
        tier: "intermediate",
        tip: "Match the fifth to the root's effort: same body, higher pitch.",
        noteDur: 2,
        rangeCap: LOWER_MIDDLE_OF_RANGE,
        buildSteps: (r) => [rel(r, [0, 7])],
      },
      {
        id: "belt-octave-drop",
        title: "Octave-drop hey",
        desc: 'Start "hey" on the octave and drop straight home, twice.',
        tier: "intermediate",
        tip: "Start light up top and land solid. The drop does the work, not you.",
        noteDur: 0.6,
        buildSteps: (r) => [rel(r, [12, 0, 12, 0])],
      },
      {
        id: "belt-hah-descent",
        title: "Hah descent",
        desc: 'Descend 5-4-3-2-1 on an open "hah", keeping chest color all the way down.',
        tier: "intermediate",
        tip: "Keep the same speech-like color all the way down. The low notes need less push, not more; just do not let them go breathy.",
        noteDur: 0.5,
        rangeCap: LOWER_MIDDLE_OF_RANGE,
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
        id: "head-hum-five",
        title: "Hummed five down",
        desc: "Hum down 5-4-3-2-1 with the buzz parked behind your nose.",
        tier: "intermediate",
        tip: "If the hum rattles your throat, lighten until it only buzzes your face.",
        noteDur: 0.55,
        buildSteps: (r) => [rel(r, [7, 5, 4, 2, 0])],
      },
      {
        id: "head-fifth-siren",
        title: "Gentle fifth siren",
        desc: "A soft siren to the fifth and back, quiet but voiced the whole way, so the pitch still slides.",
        tier: "intermediate",
        glide: true,
        noteDur: 0.8,
        tip: "Softer than you think you need, but always voiced. Smooth beats loud here.",
        buildSteps: (r) => [
          [r, r + 7],
          [r + 7, r],
        ],
      },
      {
        id: "head-wee-descent",
        title: "Wee from the fifth",
        desc: 'Fall 5-3-1 on a light "wee": thin, sweet, and connected.',
        tier: "intermediate",
        tip: 'Keep the "w" soft and let each note land like a feather.',
        noteDur: 0.7,
        buildSteps: (r) => [rel(r, [7, 4, 0])],
      },
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
        id: "head-loo-arpeggio",
        title: "Loo octave arpeggio",
        desc: 'Roll through 1-5-8-5-1 on "loo", light as a music box.',
        tier: "intermediate",
        tip: 'Let the "l" reset each note. The octave should feel easier than the fifth.',
        noteDur: 0.6,
        buildSteps: (r) => [rel(r, [0, 7, 12, 7, 0])],
      },
      {
        id: "head-octave-leaps",
        title: "Octave leaps on oo",
        desc: 'Leap a clean octave on "oo" and return, twice. No weight up top.',
        tier: "intermediate",
        tip: "Hear the top note before you leave the bottom, then land on it lightly. No reaching, and no scooping up into it.",
        noteDur: 0.6,
        buildSteps: (r) => [rel(r, [0, 12, 0, 12, 0])],
      },
      {
        id: "head-float-hold",
        title: "Top-note float",
        desc: "Hold one note at the fifth and let it hover, light but clearly voiced.",
        tier: "intermediate",
        tip: "Imagine the note resting on the breath, like a ball on a fountain.",
        noteDur: 3,
        rangeCap: UPPER_HALF_OF_RANGE,
        buildSteps: (r) => [[r + 7]],
      },
    ],
  },
  {
    // Chest-to-head blend. Every pattern spans an octave, so as the root ladder
    // climbs the singer's range one of the rungs carries it across their break;
    // the drill is to keep that crossing smooth. Nothing here detects the break
    // or the register (see registerBreakDetection in contracts/suede-vocal.ts):
    // the score is pitch, as everywhere else.
    id: "mix",
    name: "Mix builder",
    desc: "Smooth, connected crossings through the break, 4 exercises.",
    exercises: [
      {
        id: "mix-ng-slide",
        title: "Ng slide through the break",
        desc: 'Slide an octave up and back on "ng", keeping one sound all the way through the middle.',
        tier: "intermediate",
        glide: true,
        noteDur: 1.2,
        tip: "Where the note wants to flip, get quieter instead of pushing. The goal is no seam.",
        buildSteps: (r) => [
          [r, r + 12],
          [r + 12, r],
        ],
      },
      {
        id: "mix-mum-octave",
        title: "Mum octave",
        desc: 'A dopey "mum" through 1-3-5-8-5-3-1: the same easy effort on every note, lighter as it climbs.',
        tier: "intermediate",
        tip: "Keep it a little silly and nasal. Do not carry chest weight up to the octave; let it thin out.",
        noteDur: 0.45,
        buildSteps: (r) => [rel(r, [0, 4, 7, 12, 7, 4, 0])],
      },
      {
        id: "mix-goo-scale",
        title: "Goo octave scale",
        desc: 'A full octave scale up and down on "goo", eight notes up and back through the middle.',
        tier: "intermediate",
        tip: "The narrow vowel helps the middle notes blend. Keep the lips rounded all the way up.",
        noteDur: 0.32,
        buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0])],
      },
      {
        id: "mix-nay-fifth-octave",
        title: "Nay fifth to octave",
        desc: 'A bratty "nay" leaping to the fifth, home, then to the octave and home: 1-5-1-8-1.',
        tier: "intermediate",
        tip: "Same bright buzz on both leaps. The octave borrows the fifth's placement, not more volume.",
        noteDur: 0.55,
        buildSteps: (r) => [rel(r, [0, 7, 0, 12, 0])],
      },
    ],
  },
  // The 2026-11 packs. Five skills a singer asks for by name, each built only
  // from what the room already runs: discrete notes, glides, ladders and range
  // caps. The score is pitch, as everywhere else. Nothing here hears a
  // consonant, a breath or how a low note is made, so every desc that could be
  // read that way says what is scored and what is the singer's to judge.
  {
    // Riffs and runs. The cells most pop, gospel and R&B runs are made of, on
    // the major pentatonic, the minor pentatonic and the blues scale. The pack
    // goes slow cells first and the quick ones last, the order a run is learned
    // in: every note placed before any of them is fast.
    id: "runs",
    name: "Riffs and runs",
    desc: "Pentatonic and blues-scale cells, five to eleven notes, slow first and quick last, 8 exercises.",
    exercises: [
      {
        id: "runs-three-note-cell",
        title: "Three-note cell",
        desc: 'The smallest piece of a run: 3-2-1, twice, on "no". Slow enough to place every note.',
        tier: "intermediate",
        tip: "Three separate notes, not one slide. If any of them smears, slow it under Adjust before you speed anything up.",
        noteDur: 0.45,
        buildSteps: (r) => [rel(r, [4, 2, 0, 4, 2, 0])],
      },
      {
        id: "runs-pentatonic-climb",
        title: "Pentatonic climb",
        desc: "Up the major pentatonic scale to the sixth and back down: 1-2-3-5-6-5-3-2-1.",
        tier: "intermediate",
        tip: "The scale skips a note between 3 and 5. Sing the skip as cleanly as the steps on either side of it.",
        noteDur: 0.4,
        buildSteps: (r) => [rel(r, [0, 2, 4, 7, 9, 7, 4, 2, 0])],
      },
      {
        id: "runs-minor-fall",
        title: "Minor pentatonic fall",
        desc: "Down the minor pentatonic scale from the octave: 8, flat 7, 5, 4, flat 3, 1.",
        tier: "intermediate",
        tip: "The flat third near the bottom is the note that drifts. Hear it before you get there.",
        noteDur: 0.45,
        buildSteps: (r) => [rel(r, [12, 10, 7, 5, 3, 0])],
      },
      {
        id: "runs-turn",
        title: "Turn and fall",
        desc: "A turn around the third, then down to the root: 3-5-3-2-3-2-1.",
        tier: "intermediate",
        tip: "The turn is a decoration on one note. Keep it small and come back to the same third you left.",
        noteDur: 0.4,
        buildSteps: (r) => [rel(r, [4, 7, 4, 2, 4, 2, 0])],
      },
      {
        id: "runs-blues-cell",
        title: "Blues cell",
        desc: "Five notes from the blues scale: 5, flat 5, 4, flat 3, 1. Two of the steps are half-steps.",
        tier: "intermediate",
        tip: "The flat five is a passing note, but it is still a note. Land on it, then move.",
        noteDur: 0.45,
        buildSteps: (r) => [rel(r, [7, 6, 5, 3, 0])],
      },
      {
        id: "runs-triplet-cells",
        title: "Triplet cells",
        desc: "Three falling triplets, each starting a step lower: 6-5-3, 5-3-2, 3-2-1.",
        tier: "advanced",
        tip: "Lean a little on the first note of each three and let the other two follow. That grouping is what makes a run sound like a run.",
        noteDur: 0.3,
        buildSteps: (r) => [rel(r, [9, 7, 4, 7, 4, 2, 4, 2, 0])],
      },
      {
        id: "runs-seven-note-riff",
        title: "Seven-note riff",
        desc: "Up one step to the octave, then all the way down the pentatonic scale: 6-8-6-5-3-2-1.",
        tier: "advanced",
        tip: "The top note is a flick, not a hold. Touch it and let the rest fall.",
        noteDur: 0.3,
        buildSteps: (r) => [rel(r, [9, 12, 9, 7, 4, 2, 0])],
      },
      {
        id: "runs-quick-pentatonic",
        title: "Quick pentatonic, up and back",
        desc: "The whole major pentatonic scale to the octave and back, eleven notes, quick. Slow the tempo first.",
        tier: "advanced",
        tip: "Speed comes last. Drop to 0.75× under Adjust until every note scores, then bring it back up.",
        noteDur: 0.22,
        buildSteps: (r) => [rel(r, [0, 2, 4, 7, 9, 12, 9, 7, 4, 2, 0])],
      },
    ],
  },
  {
    // Low notes. Every drill walks only the lower part of the fitted ladder,
    // and all but the octave walk step down a half-step each rep. The low end
    // is found by easing into it, never by pressing: nothing here teaches fry,
    // growl or rasp, and the tips say to stop when the sound turns rough.
    id: "low-notes",
    name: "Low notes",
    desc: "Slow descents, low holds and drops that settle toward the bottom of your range, 8 exercises.",
    exercises: [
      {
        id: "low-slow-five",
        title: "Slow five down",
        desc: 'Down 5-4-3-2-1 on "oh", slowly, each rep a half-step lower.',
        tier: "intermediate",
        tip: "Low notes need less air and less push, not more. Let each one get quieter if it wants to, as long as it is still a clear note.",
        noteDur: 0.7,
        ladder: "down",
        rangeCap: LOWER_HALF_OF_RANGE,
        buildSteps: (r) => [rel(r, [7, 5, 4, 2, 0])],
      },
      {
        id: "low-falling-triad",
        title: "Falling triad",
        desc: 'Fall 5-3-1 on "ah" and rest on the bottom note, each rep a half-step lower.',
        tier: "intermediate",
        tip: "Keep your chin level. Reaching down with the head makes the low note harder, not easier.",
        noteDur: 0.85,
        ladder: "down",
        rangeCap: LOWER_HALF_OF_RANGE,
        buildSteps: (r) => [rel(r, [7, 4, 0])],
      },
      {
        id: "low-hold",
        title: "Low hold",
        desc: "One long, quiet note, each rep a half-step lower. Hold the pitch level to the end.",
        tier: "intermediate",
        tip: "Speak-sing it at talking volume. If the note turns to gravel you did not choose, that rung is the floor for today: stop there.",
        noteDur: 4,
        ladder: "down",
        rangeCap: LOWER_HALF_OF_RANGE,
        buildSteps: (r) => [[r]],
      },
      {
        id: "low-octave-drop",
        title: "Octave drop and settle",
        desc: "Start an octave up, drop to the low note and stay on it: two long notes.",
        tier: "intermediate",
        tip: "Start the top note light so the drop has somewhere to land. Arrive on the low note; do not press down onto it from above.",
        noteDur: 1.4,
        ladder: "down",
        rangeCap: LOWER_MIDDLE_OF_RANGE,
        buildSteps: (r) => [rel(r, [12, 0])],
      },
      {
        id: "low-glide-fifth",
        title: "Slow glide down a fifth",
        desc: 'One slow slide down a fifth on "oo", each rep a half-step lower.',
        tier: "intermediate",
        glide: true,
        noteDur: 1.4,
        ladder: "down",
        rangeCap: LOWER_HALF_OF_RANGE,
        tip: "Slide through every pitch on the way down and keep the sound going to the very bottom of the slide.",
        buildSteps: (r) => [[r + 7, r]],
      },
      {
        id: "low-minor-three",
        title: "Minor three down",
        desc: "Flat 3, 2, 1: three slow steps to the low note, the first one only a half-step wide.",
        tier: "intermediate",
        tip: "Small steps low in the voice go flat easily. Aim each one a little higher than feels natural.",
        noteDur: 0.9,
        ladder: "down",
        rangeCap: LOWER_HALF_OF_RANGE,
        buildSteps: (r) => [rel(r, [3, 2, 0])],
      },
      {
        id: "low-rocking-tone",
        title: "Rocking tone",
        desc: "Rock between the second and the low note: 2-1-2-1, slow and even.",
        tier: "intermediate",
        tip: "Return to exactly the same low note each time. The second landing tends to sag under the first.",
        noteDur: 0.8,
        ladder: "down",
        rangeCap: LOWER_HALF_OF_RANGE,
        buildSteps: (r) => [rel(r, [2, 0, 2, 0])],
      },
      {
        id: "low-octave-walk",
        title: "Octave walk down",
        desc: "Walk the major scale down a whole octave to the low note, eight steps.",
        tier: "intermediate",
        tip: "Keep one color from the top of the walk to the bottom. If the last notes turn breathy, sing the whole walk quieter.",
        noteDur: 0.5,
        rangeCap: LOWER_MIDDLE_OF_RANGE,
        buildSteps: (r) => [rel(r, [12, 11, 9, 7, 5, 4, 2, 0])],
      },
    ],
  },
  {
    // Long phrases. Patterns of six to thirteen seconds meant to be sung on
    // one breath. The app does not hear the breath: it scores each note's
    // pitch, and a note dropped to breathe simply scores as missed. So the
    // breath plan is in the tip and the judging of it is the singer's.
    id: "long-phrases",
    name: "Long phrases",
    desc: "Six- to thirteen-second patterns to sing as one phrase on one breath, with the breath plan in each tip, 8 exercises.",
    exercises: [
      {
        id: "phrase-scale-twice",
        title: "Five-note scale, twice",
        desc: "The five-note scale up and down twice without a break, about ten seconds. The app scores the pitch, not the breath.",
        tier: "intermediate",
        tip: "One breath in, low and quiet, then spend it evenly. If you run short, sing the first pass softer rather than rushing the second.",
        noteDur: 0.5,
        buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0])],
      },
      {
        id: "phrase-scale-three",
        title: "Five-note scale, three times",
        desc: "Three passes of the five-note scale on one breath, about thirteen seconds. The app scores the pitch, not the breath.",
        tier: "advanced",
        tip: "Plan the air in thirds. The last pass should sound like the first; if it fades, that is the length to work at.",
        noteDur: 0.45,
        buildSteps: (r) => [
          rel(r, [0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0]),
        ],
      },
      {
        id: "phrase-nine-note",
        title: "Nine-note scale",
        desc: "Up the major scale one step past the octave and back: seventeen notes in one line.",
        tier: "advanced",
        tip: "The turn at the top is where breath gets spent early. Go over it lightly and save some for the walk home.",
        noteDur: 0.45,
        buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 9, 11, 12, 14, 12, 11, 9, 7, 5, 4, 2, 0])],
      },
      {
        id: "phrase-slow-five",
        title: "Slow five, every note held",
        desc: "The five-note scale up and down with every note close to a second long. The app scores the pitch, not the breath.",
        tier: "intermediate",
        tip: "Nine long notes on one breath. Keep the volume medium and the air steady; a big first note leaves nothing for the last.",
        noteDur: 0.9,
        buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 5, 4, 2, 0])],
      },
      {
        id: "phrase-arpeggio-chain",
        title: "Arpeggio chain",
        desc: "Three small arpeggios joined into one line: the home chord, the chord on the fourth, and home again.",
        tier: "intermediate",
        tip: "No breath where the chord changes. Think of the three arpeggios as one sentence with two commas.",
        noteDur: 0.55,
        buildSteps: (r) => [rel(r, [0, 4, 7, 4, 0, 5, 9, 5, 0, 4, 7, 4, 0])],
      },
      {
        id: "phrase-three-long-notes",
        title: "Three long notes",
        desc: "1, 2, 3: three notes of two and a half seconds each, joined on one breath.",
        tier: "intermediate",
        tip: "Move to the next note without a bump or a fresh push of air. The pitch changes; the breath does not.",
        noteDur: 2.5,
        buildSteps: (r) => [rel(r, [0, 2, 4])],
      },
      {
        id: "phrase-thirds-sequence",
        title: "Thirds in sequence",
        desc: "Climb in overlapping thirds to the sixth, then walk home: 1-3, 2-4, 3-5, 4-6, 5-4-3-2-1.",
        tier: "advanced",
        tip: "The pattern invites a breath after each pair. Do not take it; let the pairs run into each other.",
        noteDur: 0.5,
        buildSteps: (r) => [rel(r, [0, 4, 2, 5, 4, 7, 5, 9, 7, 5, 4, 2, 0])],
      },
      {
        id: "phrase-minor-octave",
        title: "Minor octave, slow",
        desc: "The natural minor scale up an octave and back at an unhurried pace, about ten seconds.",
        tier: "advanced",
        tip: "Fifteen notes. Breathe before you start, not when you notice you need to, and keep the last three as clear as the first three.",
        noteDur: 0.55,
        buildSteps: (r) => [rel(r, [0, 2, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 2, 0])],
      },
    ],
  },
  {
    // Leaps and intervals. A leap is scored from the moment its note starts, so
    // a scoop up into the top note costs points: the drill is to hear the note
    // first and land on it. The wide ones are tier 3, and computeRootLadder
    // keeps every top note inside the singer's measured range.
    id: "leaps",
    name: "Leaps and intervals",
    desc: "Fourths, fifths, sixths, octaves and a tenth, up and down, landing on the note without a scoop, 8 exercises.",
    exercises: [
      {
        id: "leap-fourths",
        title: "Fourths up and back",
        desc: "Leap a fourth and return, twice: 1-4-1-4-1.",
        tier: "intermediate",
        tip: "A fourth is the opening leap of many hymns and anthems. Hear it, then sing it; do not feel for it on the way up.",
        noteDur: 0.6,
        buildSteps: (r) => [rel(r, [0, 5, 0, 5, 0])],
      },
      {
        id: "leap-fifths",
        title: "Fifths up and back",
        desc: "Leap a fifth and return, twice: 1-5-1-5-1.",
        tier: "intermediate",
        tip: "Land on top of the fifth. Scoring allows a short onset tolerance, then measures pitch accuracy, so a lingering scoop can lower the score.",
        noteDur: 0.6,
        buildSteps: (r) => [rel(r, [0, 7, 0, 7, 0])],
      },
      {
        id: "leap-falling-sixths",
        title: "Falling sixths",
        desc: "Start on the sixth and drop to the root, twice: 6-1-6-1.",
        tier: "intermediate",
        tip: "Falling leaps overshoot. Aim for the root as a note of its own, not as wherever the drop ends.",
        noteDur: 0.65,
        buildSteps: (r) => [rel(r, [9, 0, 9, 0])],
      },
      {
        id: "leap-falling-fifths",
        title: "Falling fifths",
        desc: "Drop a fifth and climb back, twice, each rep a half-step lower: 5-1-5-1.",
        tier: "intermediate",
        tip: "Keep the upper note light so the lower one has room to sound. Same volume on both.",
        noteDur: 0.6,
        ladder: "down",
        buildSteps: (r) => [rel(r, [7, 0, 7, 0])],
      },
      {
        id: "leap-staccato-fourth-fifth",
        title: "Staccato fourth and fifth",
        desc: "Short, detached notes: root, fourth, root, fifth, root, with a little silence after each.",
        tier: "intermediate",
        tip: "Each note starts on pitch and stops clean. The silence between them is where you hear the next one.",
        noteDur: 0.35,
        gapSec: STACCATO_GAP_SEC,
        buildSteps: (r) => [rel(r, [0, 5, 0, 7, 0])],
      },
      {
        id: "leap-staccato-octaves",
        title: "Staccato octaves",
        desc: "Short, detached octave leaps: 1-8-1-8-1, with a little silence after each note.",
        tier: "advanced",
        tip: "Light on the top note, every time. Bounce from the breath; the throat does nothing between notes.",
        noteDur: 0.35,
        gapSec: STACCATO_GAP_SEC,
        buildSteps: (r) => [rel(r, [0, 12, 0, 12, 0])],
      },
      {
        id: "leap-widening",
        title: "Widening leaps",
        desc: "From the same root, leap a third, a fourth, a fifth, a sixth and an octave, returning home between each.",
        tier: "advanced",
        tip: "The root is your reference. Come back to exactly the same note each time, and the next interval is easier to measure.",
        noteDur: 0.45,
        buildSteps: (r) => [rel(r, [0, 4, 0, 5, 0, 7, 0, 9, 0, 12, 0])],
      },
      {
        id: "leap-tenth",
        title: "Tenth and back",
        desc: "The widest leap in the pack: root to the tenth, an octave and a third, and home.",
        tier: "advanced",
        tip: "Think of the tenth as a light note that happens to be far away. Get quieter as you go up, and stop the rep if you have to push to reach it.",
        noteDur: 0.7,
        buildSteps: (r) => [rel(r, [0, 16, 0])],
      },
    ],
  },
  {
    // Clear words. Consonants and vowels on moving pitch. The detector reads
    // pitch only: it cannot tell "ta" from "la", so every desc ends by saying
    // so. What the score does show is whether the pitch stayed true while the
    // mouth was busy, which is the half of diction a tuner can see.
    id: "clear-words",
    name: "Clear words",
    desc: "Consonants and vowels on moving pitch. The app scores the pitch; how clear the words are is yours to judge, 8 exercises.",
    exercises: [
      {
        id: "words-ta-ka",
        title: "Ta-ka on three notes",
        desc: 'Two syllables on every pitch, "ta-ka", up 1-2-3 and back. The app scores the pitch; the words are yours to judge.',
        tier: "intermediate",
        tip: 'Tip of the tongue for "ta", back of the tongue for "ka". Keep the jaw still and let the tongue do the work.',
        noteDur: 0.3,
        buildSteps: (r) => [rel(r, [0, 0, 2, 2, 4, 4, 2, 2, 0, 0])],
      },
      {
        id: "words-la-ga-triad",
        title: "La-ga triad",
        desc: 'Two syllables on every pitch, "la-ga", up the triad and back. The app scores the pitch; the words are yours to judge.',
        tier: "intermediate",
        tip: "The pitch should not dip while the tongue moves. Sing the vowel on the note and fit the consonant in front of it.",
        noteDur: 0.35,
        buildSteps: (r) => [rel(r, [0, 0, 4, 4, 7, 7, 4, 4, 0, 0])],
      },
      {
        id: "words-mini-patter",
        title: "Mini-mini patter",
        desc: 'Eight quick syllables on one note: "mi-ni-mi-ni-mi-ni-mi-ni". The app scores the pitch; the words are yours to judge.',
        tier: "intermediate",
        tip: "Lips and tongue tip only, small and fast. If the note wobbles, slow it down until the pitch holds.",
        noteDur: 0.22,
        buildSteps: (r) => [rel(r, [0, 0, 0, 0, 0, 0, 0, 0])],
      },
      {
        id: "words-five-vowels",
        title: "Five vowels, down and back",
        desc: '"Ee, eh, ah, oh, oo" on 3-2-1-2-3, one vowel a note. The app scores the pitch; the words are yours to judge.',
        tier: "intermediate",
        tip: "Change the vowel with the tongue and lips, not the jaw. The pitch should not move when the vowel does.",
        noteDur: 0.6,
        buildSteps: (r) => [rel(r, [4, 2, 0, 2, 4])],
      },
      {
        id: "words-tee-tay-climb",
        title: "Tee-tay-tah-toh-too",
        desc: 'Five notes up, a new vowel on each, every one started with the consonant "t". The app scores the pitch; the words are yours to judge.',
        tier: "intermediate",
        tip: 'A quick, dry "t" and straight onto the vowel. No puff of air before the note starts.',
        noteDur: 0.5,
        buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7])],
      },
      {
        id: "words-pa-ta-ka",
        title: "Pa-ta-ka climb",
        desc: 'Three syllables on every pitch, "pa-ta-ka", up 1-2-3, back to 2 and home. The app scores the pitch; the words are yours to judge.',
        tier: "advanced",
        tip: "Lips, tongue tip, tongue back, in that order, like a drum roll. Keep it even before you make it fast.",
        noteDur: 0.25,
        buildSteps: (r) => [rel(r, [0, 0, 0, 2, 2, 2, 4, 4, 4, 2, 2, 2, 0])],
      },
      {
        id: "words-zinga-triad",
        title: "Zing-a triad, twice",
        desc: 'A buzzy "zing-a" through 1-3-5-3 twice and home. The app scores the pitch; the words are yours to judge.',
        tier: "intermediate",
        tip: 'Let the "z" buzz on the pitch before the vowel opens. The "ng" closes each note; it should hum, not stop.',
        noteDur: 0.35,
        buildSteps: (r) => [rel(r, [0, 4, 7, 4, 0, 4, 7, 4, 0])],
      },
      {
        id: "words-patter-scale",
        title: "Patter scale",
        desc: 'One quick syllable a note up the whole octave: "da-ba-da-ba-da-ba-da-ba". The app scores the pitch; the words are yours to judge.',
        tier: "advanced",
        tip: "Eight notes, eight syllables, no slowing at the top. Drop to 0.75× under Adjust until the notes and the words line up.",
        noteDur: 0.28,
        buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 9, 11, 12])],
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
  const gap = (ex.gapSec ?? NOTE_GAP_SEC) / tempo;
  const steps = ex.buildSteps(rootMidi);
  const segs: Segment[] = [];
  // An unscored lead is a gap before the first segment: targetMidiAt reads
  // null there, so the scorer neither credits it nor counts it as possible.
  let t = (ex.unscoredLeadSec ?? 0) / tempo;
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
 * The fewest rungs a fitted ladder should have before the courtesies above
 * give way. The 13-note runs reach a 12th above the root, so with the usual
 * major-third floor and fourth of headroom a two-octave singer got a ladder of
 * one rung — every rep on the same note, while the room promised a climb.
 */
export const MIN_RUNGS = 5;

/**
 * The rungs of `ladder` a range cap keeps: from rung round(from * (n - 1)) to
 * rung round(to * (n - 1)), inclusive, so a cap always keeps at least one rung
 * and a ladder of one rung is returned as it is. No cap returns the ladder.
 */
export function capLadder(ladder: number[], cap: RangeCap | undefined): number[] {
  if (!cap || ladder.length <= 1) return ladder;
  const last = ladder.length - 1;
  const clamp = (f: number) => Math.min(last, Math.max(0, Math.round(f * last)));
  const lo = clamp(cap.from);
  const hi = Math.max(lo, clamp(cap.to));
  return ladder.slice(lo, hi + 1);
}

/**
 * Measured span, in semitones, before the octave siren is worth recommending,
 * shared by the coach's plan (components/progress/coach.tsx) and a fresh range
 * result (components/range/result-view.tsx). computeRootLadder fits that
 * exercise's ladder (fitRootLadder below). From a 25-semitone span up, its
 * ladder starts at `lowMidi + 4` and its glides top out five semitones under
 * `highMidi`. Narrower spans give up that headroom so the ladder keeps
 * MIN_RUNGS rungs: from 16 to 24 semitones the glides top out two under
 * `highMidi` while the lowest root slides from `lowMidi + 4` (at 22) down to
 * `lowMidi` (at 18 and under); from 12 to 15 they reach `highMidi` itself,
 * and under 12 the top is pinned there with the bottom below the range. So
 * below 21 the octave would run from within two semitones of the measured
 * floor to within two of the measured ceiling, the extremes a cold range test
 * found, and a narrower span gets the fifth, which keeps five semitones under
 * the ceiling from a 16-semitone span up. When that leaves the weak note
 * above every glide, the coach's plan says so rather than promising a ladder
 * through it.
 */
export const OCTAVE_SIREN_MIN_SEMIS = 21;

/**
 * Every semitone root from the ladder's bottom to its top. With a saved
 * range, start a major third above the low note and stop a fourth below the
 * high note (accounting for the exercise's highest interval). Without one,
 * fit a nominal A2–E4 range (NOMINAL_RANGE): the old fixed C3→G3 roots
 * ignored the pattern's width, so a twelfth run topped out on D5. The player
 * walks this band up and down endlessly — see ladderWalk — so the ladder is
 * the singer's whole comfortable span, not a fixed rep count, unless the
 * exercise sets a `rangeCap`, which keeps only that slice of it.
 */
export function computeRootLadder(
  ex: WarmupExercise,
  lowMidi?: number,
  highMidi?: number,
): number[] {
  return capLadder(fitRootLadder(ex, lowMidi, highMidi), ex.rangeCap);
}

/**
 * A routine step this saved range cannot hold: a run wider than a tenth (the
 * twelfth runs, N run and Staccato gug) in a range no wider than the run. The
 * ladder then pins every rep's top note to the measured high and, under the
 * run's width, starts it below the measured low, so a fixed routine would sing
 * the range test's extremes on every rep. The tenth patterns are left alone:
 * the High notes routine exists to reach the top of the measured range. The
 * endless single-exercise ladder keeps its pinned fit; only routines skip.
 */
export function tooWideForRange(
  ex: WarmupExercise,
  range: { lowMidi?: number; highMidi?: number },
): boolean {
  if (range.lowMidi === undefined || range.highMidi === undefined) return false;
  const maxOff = patternSpan(ex);
  return maxOff > 16 && range.highMidi - range.lowMidi <= maxOff;
}

/** Semitones from a pattern's root to its highest note. */
export function patternSpan(ex: WarmupExercise): number {
  return Math.max(...ex.buildSteps(0).flat());
}

/** The whole comfortable ladder, before any range cap. */
function fitRootLadder(
  ex: WarmupExercise,
  lowMidi?: number,
  highMidi?: number,
): number[] {
  const offsets = ex.buildSteps(0).flat();
  const maxOff = Math.max(...offsets);
  if (lowMidi !== undefined && highMidi !== undefined) {
    const range = (start: number, top: number) =>
      Array.from({ length: top - start + 1 }, (_, i) => start + i);
    const start = Math.max(30, lowMidi + 4);
    const top = Math.max(start, highMidi - 5 - maxOff);
    // In a narrow range the courtesy ladder collapses to its floor, and that
    // single rung can put the pattern's top above the measured high — a fifth
    // from a root of 52 is 59 in a 48–55 range, a tenth from 54 is 70 in a
    // 50–66 range. The ceiling wins over the courtesies for every pattern.
    const overCeiling = top + maxOff > highMidi;
    if (!overCeiling && (top - start + 1 >= MIN_RUNGS || maxOff < 12)) {
      return range(start, top);
    }
    // Spend most of the headroom first (the pattern's top note stays two
    // semitones under the measured top when the range has room, and reaches it
    // only when it does not: the measured top is the extreme a cold range test
    // found, falsetto included, not a note to warm up on every rep), then let
    // the floor drop toward the measured low — never below it — until the
    // ladder has rungs to walk. Patterns narrower than an octave only get here
    // when the courtesy ladder would cross the ceiling; while it fits they keep
    // the courtesies untouched, which the coach's first-practice picker
    // (lib/song-first-practice.ts) relies on.
    const headroom = highMidi - lowMidi >= maxOff + 4 ? 2 : 0;
    const top2 = Math.max(30, highMidi - headroom - maxOff);
    const start2 = Math.max(30, lowMidi, Math.min(lowMidi + 4, top2 - (MIN_RUNGS - 1)));
    // Take the fallback whenever the courtesy ladder would cross the ceiling,
    // and when the range is narrower than the pattern itself, pin the top note
    // to the measured high and let the bottom fall below the measured low.
    if (top2 >= start2 && (top2 - start2 + 1 > top - start + 1 || overCeiling)) {
      return range(start2, top2);
    }
    if (overCeiling) return [top2];
    return range(start, top);
  }
  return fitRootLadder(ex, NOMINAL_RANGE.lowMidi, NOMINAL_RANGE.highMidi);
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

/**
 * A bounded routine step on a "down" ladder walks down once and then stays
 * on its bottom rung, so a step with more reps than rungs never turns round
 * and climbs: a cool-down that heads back up partway through breaks its own
 * "each rep a half-step lower". The endless deep-link walk keeps ladderWalk's
 * triangle. `ladder` is the reversed band the player walks, top note first.
 */
export function descentWalk(ladder: number[], rep: number): LadderStep {
  const index = Math.min(Math.max(0, rep), Math.max(0, ladder.length - 1));
  return { root: ladder[index] ?? 48, index, ascending: index < ladder.length - 1 };
}

/**
 * Length of one climb of the ladder in the default sing-along mode, in whole
 * minutes: the teach rep, then `reps - 1` count-in-and-sing reps, from the
 * same planner the routine cards time their steps with (routines.ts
 * stepSeconds), so a path row and a routine card never disagree.
 */
export function estimateMinutes(ex: WarmupExercise, reps: number): number {
  const { totalSec, noteDur } = buildSegments(ex, 60, 1);
  let t = 0;
  for (let i = 0; i < reps; i++) {
    t += planRep({ mode: "sing-along", repIndex: i, t0: 0, patternSec: totalSec, noteDur }).repDur;
  }
  return Math.max(1, Math.round(t / 60));
}
