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
  /** Each step is a small melody in midi numbers, built from a root note. */
  buildSteps(rootMidi: number): number[][];
}

const rel = (root: number, offsets: number[]) => offsets.map((o) => root + o);

/**
 * The rate band the vibrato drills aim for. Sung vibrato is conventionally
 * five to seven cycles a second; lib/audio/vibrato.ts accepts a wider band as
 * vibrato at all, and this is the narrower one the drill calls on target.
 */
export const VIBRATO_TARGET_BAND = { minHz: 5, maxHz: 7 } as const;

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
  // The exercise types a documented Singeo warmup runs on and this catalogue
  // did not have. The shapes, note lengths and ladder directions below are not
  // taken from the blog copy but measured from the piano guide in Singeo's two
  // public warm-up videos (the "Easy 7-minute" and the "Complete 10-minute",
  // pitch-tracked 2026-09-03 — see docs/research/singeo-warmup-parameters.md):
  // the bubble is a 1-3-5-8-5-3-1 arpeggio at ~0.42s a note, N and gug are a
  // 13-note run up the arpeggio to the 12th and down the scale, hung-ee-mm is
  // three five-note passes in one breath, and hoo is a slow 8-5-3-1 that walks
  // DOWN by half-steps. The consonant or vowel is in the title and the tip,
  // since the detector only hears the pitch.
  {
    id: "lip-trill-scale",
    title: "Lip-trill arpeggio",
    desc: 'The bubble — "brr" through 1-3-5-8-5-3-1, climbing by half-steps and back down.',
    tier: "beginner",
    tip: "Loose lips, steady air. If the bubble stalls, less push and more breath.",
    noteDur: 0.42,
    buildSteps: (r) => [rel(r, [0, 4, 7, 12, 7, 4, 0])],
  },
  {
    id: "straw-scale",
    title: "Straw scale",
    desc: "Puff the cheeks and blow through pursed lips (or a real straw) up five notes and down.",
    tier: "beginner",
    tip: "Cheeks stay full. The narrow opening does the work — do not press the tone.",
    noteDur: 0.46,
    buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 5, 4, 2, 0])],
  },
  {
    id: "n-hum-scale",
    title: "N run",
    desc: 'Hum on "n" up the arpeggio to the twelfth, then down the scale — thirteen notes on one breath.',
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
    tip: "Long and easy. Start the top note light; do not make vibrato — leave room for it.",
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
    desc: 'Three five-note passes on one breath — "hung" up and down, "ee" up and down, "mm" up and down.',
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
    desc: 'Thirteen short "gug"s — up the arpeggio to the twelfth, down the scale — with space between each.',
    tier: "intermediate",
    tip: "Each note starts from the breath, not the throat. Leave the gap.",
    noteDur: 0.25,
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
    desc: "Start on the octave and come down 8-5-3-1, then back up — the range builder.",
    tier: "intermediate",
    tip: "Begin light on the top; the descent is where the body of the note arrives.",
    noteDur: 0.5,
    buildSteps: (r) => [rel(r, [12, 7, 4, 0, 4, 7, 12])],
  },
  {
    id: "agility-run",
    title: "Agility run",
    desc: 'The speed challenge — five notes up and down twice on "mum", fast. Slow the tempo first.',
    tier: "advanced",
    tip: "Pitch accuracy before speed. Drop to 0.75× under Adjust until every note lands.",
    noteDur: 0.25,
    buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 5, 4, 2, 0, 2, 4, 5, 7, 5, 4, 2, 0])],
  },
  {
    id: "pentatonic-run",
    title: "Pentatonic run",
    desc: 'A riff-shaped run down the pentatonic — 8-6-5-3-2-1 on "no".',
    tier: "advanced",
    tip: "This is the shape of most pop and gospel runs. Make every step a real note, not a slide.",
    noteDur: 0.3,
    buildSteps: (r) => [rel(r, [12, 9, 7, 4, 2, 0])],
  },
  {
    id: "gee-octave",
    title: "Gee to the octave",
    desc: 'Bright "gee" through 1-5-8-5-1 — the head-voice wake-up.',
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
  // Vibrato. Each hold is long enough for lib/audio/vibrato.ts to see several
  // cycles after the onset it skips, and the player reports the rate and width
  // of the wobble it measured. That is all it reports: two numbers about the
  // pitch contour, never whether the vibrato sounded good.
  {
    id: "vibrato-hold",
    title: "Vibrato hold",
    desc: "One long, easy note. Start it straight, then let it wobble. After each hold you see how fast and how wide the pitch moved.",
    tier: "intermediate",
    tip: "Do not shake it out of the jaw or the belly. Relax and let the note move on its own; straight is a fine answer too.",
    noteDur: 4.5,
    vibrato: VIBRATO_TARGET_BAND,
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
    buildSteps: (r) => [[r + 5]],
  },
  // Recovery: small, quiet, low-effort patterns in a narrow comfortable band,
  // for a voice that feels tired. The detector cannot hear vocal fry, so the
  // creak in "Creak to tone" is for the singer; only the pitched note after it
  // is scored, as everywhere else.
  {
    id: "quiet-hum-descent",
    title: "Quiet hum descent",
    desc: "A quiet hum down 3-2-1, each rep a half-step lower. The smallest sound that still has a pitch.",
    tier: "beginner",
    tip: "Half your usual volume. Lips closed, jaw loose, and let each note settle rather than place it.",
    noteDur: 0.8,
    ladder: "down",
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
];

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
        desc: 'A dopey "mum" through 1-3-5-8-5-3-1, same weight on every note.',
        tier: "intermediate",
        tip: "Keep it a little silly and nasal. Do not carry chest weight up to the octave; let it thin out.",
        noteDur: 0.45,
        buildSteps: (r) => [rel(r, [0, 4, 7, 12, 7, 4, 0])],
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
      {
        id: "mix-goo-scale",
        title: "Goo octave scale",
        desc: 'A full octave scale up and down on "goo", eight notes up and back through the middle.',
        tier: "intermediate",
        tip: "The narrow vowel helps the middle notes blend. Keep the lips rounded all the way up.",
        noteDur: 0.32,
        buildSteps: (r) => [rel(r, [0, 2, 4, 5, 7, 9, 11, 12, 11, 9, 7, 5, 4, 2, 0])],
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
 * Every semitone root from the ladder's bottom to its top. With a saved
 * range, start a major third above the low note and stop a fourth below the
 * high note (accounting for the exercise's highest interval). Without one,
 * default to the classic C3→G3 ladder. The player walks this band up and
 * down endlessly — see ladderWalk — so the ladder is the singer's whole
 * comfortable span, not a fixed rep count.
 */
/**
 * The fewest rungs a fitted ladder should have before the courtesies above
 * give way. The 13-note runs reach a 12th above the root, so with the usual
 * major-third floor and fourth of headroom a two-octave singer got a ladder of
 * one rung — every rep on the same note, while the room promised a climb.
 */
export const MIN_RUNGS = 5;

export function computeRootLadder(
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
    // Spend the headroom first (the pattern's top note may reach the measured
    // top, which is what the recordings this catalogue mirrors do), then let
    // the floor drop toward the measured low — never below it — until the
    // ladder has rungs to walk. Patterns narrower than an octave only get here
    // when the courtesy ladder would cross the ceiling; while it fits they keep
    // the courtesies untouched, which the coach's first-practice picker
    // (lib/song-first-practice.ts) relies on.
    const top2 = Math.max(30, highMidi - maxOff);
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
