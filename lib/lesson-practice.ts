/**
 * Where each voice module's work happens on sing, what backs its self-check,
 * and the practice material a lesson page lists.
 *
 * Ported from GuitarHub, where the same table (`lib/learning/voice-proof.ts`)
 * linked each module out to a sing room and the material
 * (`voice-learning-material.json`) bundled copies of sing's own exercises,
 * songs and chapters. Here none of that is a copy any more: the material
 * resolves to the real rooms, songs and book, and every link is relative.
 *
 * Kept by module, not by lesson. A module is the unit that carries an outcome,
 * and the unit a singer is sent to a room to practise.
 *
 * Two rules from contracts/suede-vocal.ts are enforced in
 * lib/voice-lessons.test.tsx rather than trusted here:
 *
 *   - `measured` may only name a measurement the contract reports as
 *     `measurable: "yes"`, and `selfCheck` must name one it doesn't. A lesson
 *     page says sing measures something only when this table says so.
 *   - A deep link uses only a room and parameter from the contract's
 *     `deepLinks`, and never points at a Pro exercise, because every lesson
 *     page is free.
 */
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { ALL_SONGS, isProSong } from "@/components/songs/data";
import { EXERCISES, PRO_PACKS } from "@/components/warmups/exercises";
import { routineById, stepExercise } from "@/components/warmups/routines";
import type { ActivityType } from "@/lib/progress-shape";
import { rangeTestHref } from "@/lib/site";

export type ProofBasis =
  /** A measurement the contract reports as implemented. */
  | { kind: "measured"; measurement: string }
  /**
   * Nothing measures this. `missing` names the contract measurement that would
   * be needed; `showsInstead` is what the self-check really establishes.
   */
  | { kind: "selfCheck"; missing: string; showsInstead: string };

/** A room key from the contract's `deepLinks.rooms`, optionally with one parameter. */
export interface Companion {
  room: string;
  param?: string;
  value?: string;
}

export interface ModulePractice {
  basis: ProofBasis;
  companion: Companion;
  /**
   * A lesson whose own steps send the singer somewhere other than the
   * module's room, keyed by lesson ID. Its page's first button opens this
   * room instead; the practice panel, which describes the module's evidence,
   * keeps the module's.
   */
  lessonCompanion?: Partial<Record<string, Companion>>;
  /** Warm-up exercise IDs and song IDs, in the order GuitarHub listed them. */
  studies: string[];
  /** Book slugs, or `atlas:<slug>` for an atlas chapter. */
  readings: string[];
}

const measured = (measurement: string): ProofBasis => ({ kind: "measured", measurement });
const selfCheck = (missing: string, showsInstead: string): ProofBasis => ({
  kind: "selfCheck",
  missing,
  showsInstead,
});

/**
 * Every module in the catalog. The comments on a basis are GuitarHub's,
 * kept because each records a wrong claim that was made once and corrected.
 */
export const MODULE_PRACTICE: Record<string, ModulePractice> = {
  // Stage 1 · Room Check
  "v-l1-m1": {
    // The module's evidence is a recording heard back: its lessons compare
    // takes made with playback on and with it stopped, and its self-check is
    // one clear recording. Voiced time was the basis once, but it counts any
    // confident pitch, so a reference bleeding in from a speaker raises it;
    // and the analyzer, where it was read, has no record or playback.
    basis: selfCheck(
      "simultaneousVoices",
      "That a take recorded with playback stopped holds only your voice when you play it back. The pitch detector reports one pitch from everything the microphone hears, so it cannot pick a reference out from under your voice; your ear on playback can.",
    ),
    companion: { room: "recorder" },
    studies: ["sustained-hold"],
    // Chapter 12 covers room noise, mic placement and headphone bleed, which
    // is this module, so it comes first. Chapter 1, how the voice works, stays
    // as the course's opening read and is listed again in the breath, register
    // and vowel modules its three sections teach.
    readings: ["when-numbers-lie", "what-your-voice-is"],
  },
  "v-l1-m2": {
    // Strain is not measurable. What a scan establishes is the two extremes.
    basis: measured("rangeExtremes"),
    companion: { room: "range" },
    // The first two lessons practise the slides in the recorder, as their
    // steps say; only the self-check takes the range test, because every
    // finished test replaces the saved range and refits the warm-ups and
    // songs. Repeating an exercise lesson must not mean repeating the test.
    lessonCompanion: {
      "v-l1-m2-01": { room: "recorder" },
      "v-l1-m2-02": { room: "recorder" },
    },
    studies: ["morning-hum", "morning-siren"],
    readings: ["reading-the-range-test", "range-is-not-one-number"],
  },
  "v-l1-m3": {
    // A hiss is unvoiced, so phonation time reads zero on it; the RMS-gated
    // sustain timer is the measurement that sees a hiss.
    basis: measured("sustainSeconds"),
    companion: { room: "breath", param: "drill", value: "sustain" },
    studies: [],
    // Chapter 1's "The power: breath" is the free reading of this module.
    readings: ["breath", "weeks-1-2-baseline", "what-your-voice-is"],
  },

  // Stage 2 · Steady Tone
  "v-l2-m1": {
    // Straw scale is a pitched pattern scored by the warm-up room; the
    // sustain timer lives in the breath room and never sees this drill.
    basis: measured("scorePercent"),
    companion: { room: "warmups", param: "exercise", value: "straw-scale" },
    studies: ["straw-scale", "lip-trill-scale"],
    readings: ["breath", "stamina-and-health"],
  },
  "v-l2-m2": {
    basis: measured("centsFromTarget"),
    companion: { room: "studio" },
    studies: ["five-note-scale", "chromatic-neighbor"],
    // Chapter 15 (weeks 3-4) is the book's onset and steady-tone block, so it
    // is read here and in Hold It, not beside the Stage 6 runs.
    readings: ["pitch-accuracy", "weeks-3-4-middle"],
  },
  "v-l2-m3": {
    basis: measured("inTuneHoldTime"),
    companion: { room: "warmups", param: "exercise", value: "sustained-hold" },
    studies: ["sustained-hold", "morning-sustain"],
    readings: ["breath", "pitch-accuracy", "weeks-3-4-middle"],
  },
  "v-l2-m4": {
    basis: measured("scorePercent"),
    companion: { room: "songs", param: "song", value: "amazing-grace" },
    studies: ["amazing-grace", "amazing-grace-full"],
    readings: ["choosing-songs", "transposition"],
  },

  // Stage 3 · Two Registers
  "v-l3-m1": {
    basis: selfCheck(
      "registerMechanism",
      "That you can produce a pitch two ways on cue and hear the difference. Nothing classifies which mechanism you used.",
    ),
    // Its lessons sing the fuller and lighter versions in one take and judge
    // the switch on playback; the analyzer has no record or playback.
    companion: { room: "recorder" },
    studies: ["humming-thirds", "head-wee-descent"],
    // Chapter 1's "The vibrator: the folds" is the free reading of this module.
    readings: ["registers", "what-your-voice-is"],
  },
  "v-l3-m2": {
    // A crack stays voiced, so a longest-voiced-run figure reports one
    // continuous run straight through one. Break detection is the gap.
    basis: selfCheck(
      "registerBreakDetection",
      "That the slide sounded continuous to you. The pitch trace is shown; no number scores the absence of a crack.",
    ),
    companion: { room: "warmups", param: "exercise", value: "octave-siren" },
    studies: ["octave-siren", "morning-siren"],
    readings: ["registers", "the-passaggio"],
  },
  "v-l3-m3": {
    basis: selfCheck(
      "vowelOrFormant",
      "That tone stayed consistent to your own ear across five vowels. No formant tracking exists, so vowel consistency is not scored.",
    ),
    companion: { room: "warmups", param: "exercise", value: "hung-ee-mm" },
    studies: ["hung-ee-mm", "legato-triad"],
    // Chapter 1's "The filter: the tract" is the free reading of this module.
    readings: ["resonance", "what-your-voice-is"],
  },
  "v-l3-m4": {
    basis: measured("scorePercent"),
    companion: { room: "songs", param: "song", value: "deep-river" },
    studies: ["deep-river", "auld-lang-syne"],
    readings: ["choosing-songs", "transposition"],
  },
  "v-l3-m5": {
    basis: selfCheck(
      "strainOrPressedPhonation",
      "That you can tell breathy, nasal and tight apart in your own takes. Nothing measures any of the three.",
    ),
    companion: { room: "recorder" },
    // Tongue-trill descent first: "Release the Jaw and Tongue" needs a drill
    // that works the tongue, which a plain sustain does not.
    studies: ["tongue-trill-descent", "morning-sustain"],
    readings: ["when-numbers-lie", "stamina-and-health", "atlas:a-vocabulary-for-tone"],
  },

  // Stage 4 · Pitch, Time, Words
  "v-l4-m1": {
    basis: measured("centsFromTarget"),
    companion: { room: "songs", param: "song", value: "amazing-grace-full" },
    studies: ["amazing-grace-full", "chromatic-neighbor"],
    readings: ["pitch-accuracy"],
  },
  "v-l4-m2": {
    basis: selfCheck(
      "onsetTimingError",
      "That the phrase, notes between the taps included, came back in time by ear against your own recorded taps. There is no onset detector and no timing-error number.",
    ),
    companion: { room: "tools" },
    // Ode to Joy puts every note on a tap; Swing Low, Sweet Chariot has the
    // notes between taps that lesson one's subdivisions are about ("char-i"
    // is 1.5 + 0.5 beats, "comin' for to carry" is three pairs of halves),
    // and the self-check is taken on it. Row Row Row, all on the beat, could
    // not show a note placed between two taps.
    studies: ["ode-to-joy", "swing-low"],
    // No book or atlas chapter teaches counting, subdivision or swing, so the
    // module lists no reading rather than one that does not teach its skill.
    readings: [],
  },
  "v-l4-m3": {
    basis: selfCheck(
      "dictionClarity",
      "That the lyric was understandable on playback. No consonant or intelligibility analysis exists.",
    ),
    companion: { room: "recorder" },
    studies: ["yankee-doodle", "old-macdonald"],
    readings: ["resonance", "weeks-11-12-songs"],
  },
  "v-l4-m4": {
    basis: selfCheck(
      "onsetTimingError",
      "That three articulations were produced on cue and sound different. Articulation is not detected.",
    ),
    companion: { room: "recorder" },
    studies: ["ode-to-joy", "gug-staccato"],
    readings: ["resonance", "atlas:a-vocabulary-for-tone"],
  },
  "v-l4-m5": {
    basis: selfCheck(
      "absoluteLoudness",
      "That the levels sound distinct on one note. Input level is uncalibrated, so discrete dynamic levels are not measurable.",
    ),
    // The recorder, where the lesson has you record the levels in one take
    // and play them back; the analyzer has no record or playback.
    companion: { room: "recorder" },
    // Swell and fade is the dynamics drill itself: one note, soft to medium
    // and back. Only its pitch is scored, which is the honest half.
    studies: ["swell-and-fade", "sustained-hold", "simple-gifts"],
    readings: ["breath", "resonance"],
  },

  // Stage 5 · Through the Break
  "v-l5-m1": {
    // A range scan does not yield a passaggio: see the contract's
    // taxonomy.passaggio.derivableFromRangeScan.
    basis: selfCheck(
      "passaggioPitches",
      "That you located your own transition by ear and can name the published zone for your voice type. A range scan does not give you a passaggio.",
    ),
    // The pitch studio, not the range test: its live trace is where the book
    // has you find the gear change, and a range result shows no passaggio.
    companion: { room: "studio" },
    studies: ["ng-siren-fifth"],
    readings: ["the-passaggio", "finding-your-break"],
  },
  "v-l5-m2": {
    basis: selfCheck(
      "vowelOrFormant",
      "That the word survived the crossing on three vowels, by ear. Vowel modification is not measured.",
    ),
    companion: { room: "warmups", param: "exercise", value: "ng-siren-fifth" },
    studies: ["ng-siren-fifth", "head-fifth-siren"],
    readings: ["resonance", "weeks-5-6-passaggio"],
  },
  "v-l5-m3": {
    // ringRatio is real but self-relative: it compares you with your own
    // earlier takes and says nothing about strain.
    basis: measured("ringRatio"),
    companion: { room: "analyze" },
    studies: ["humming-thirds"],
    readings: ["resonance", "atlas:a-vocabulary-for-tone"],
  },
  "v-l5-m4": {
    basis: selfCheck(
      "strainOrPressedPhonation",
      "That you tried the pattern gently and noted your own effort. Nothing detects strain, so a safe belt cannot be scored.",
    ),
    companion: { room: "studio" },
    // The free Legato triad first, so a free reader's first choice opens.
    studies: ["legato-triad", "head-wee-descent"],
    readings: ["registers", "atlas:the-safety-rail"],
  },
  "v-l5-m5": {
    basis: selfCheck(
      "keyAdherence",
      "That your answering phrase stayed in key, by ear. With no written target there is nothing for a score to compare against.",
    ),
    // The lessons record the call and answer in one take; the reference
    // patterns are in the practice material. Ear training can do neither.
    companion: { room: "recorder" },
    studies: ["pentatonic-run", "minor-scale"],
    readings: ["pitch-accuracy", "atlas:a-vocabulary-for-tone"],
  },

  // Stage 6 · Agility
  "v-l6-m1": {
    // GuitarHub bundled only Agility run here, which is a five-note scale up
    // and down twice; the module's lessons teach a three-note turn. Small
    // three-note climb (1-2-3-2-1) is that turn, so it is what the room scores.
    basis: measured("scorePercent"),
    companion: { room: "warmups", param: "exercise", value: "morning-three-note" },
    studies: ["morning-three-note", "agility-run"],
    readings: ["pitch-accuracy"],
  },
  "v-l6-m2": {
    basis: measured("scorePercent"),
    companion: { room: "warmups", param: "exercise", value: "hoo-four-note" },
    studies: ["hoo-four-note"],
    readings: ["breath", "pitch-accuracy"],
  },
  "v-l6-m3": {
    basis: selfCheck(
      "vibratoOnCue",
      "That you moved from straight tone to vibrato on cue. The vibrato hold in the warmups reads how fast and how wide a held note wobbled, but nothing times the switch itself, so the cue is yours to judge.",
    ),
    // The drill that asks for exactly this, a straight start and then a wobble
    // if one comes, rather than a plain hold that only allows it.
    companion: { room: "warmups", param: "exercise", value: "vibrato-hold" },
    studies: ["vibrato-hold", "sustained-hold"],
    readings: ["atlas:a-vocabulary-for-tone", "stamina-and-health"],
  },
  "v-l6-m4": {
    basis: selfCheck(
      "ornamentClassification",
      "That you placed the ornaments where you meant to. Nothing labels a turn, a slide or a trill, though the pitch trace shows the gesture.",
    ),
    companion: { room: "studio" },
    studies: ["chromatic-neighbor", "legato-triad"],
    readings: ["atlas:a-vocabulary-for-tone"],
  },
  "v-l6-m5": {
    // A continuous sound is not an invented one: an unbroken-phrase figure
    // cannot stand in for improvisation.
    basis: selfCheck(
      "improvisationQuality",
      "That you made your own phrases over the pattern rather than repeating a line. Nothing judges improvisation.",
    ),
    // The lessons record the call and answer in one take; the reference
    // patterns are in the practice material. Ear training can do neither.
    companion: { room: "recorder" },
    studies: ["minor-scale", "pentatonic-run"],
    readings: ["atlas:a-vocabulary-for-tone", "pitch-accuracy"],
  },
  "v-l6-m6": {
    basis: measured("scorePercent"),
    companion: { room: "songs", param: "song", value: "deep-river" },
    studies: ["deep-river", "amazing-grace-full"],
    readings: ["transposition", "weeks-11-12-songs"],
  },

  // Stage 7 · Signature
  "v-l7-m1": {
    // The one module where cycle dose is the right evidence, and the analyzer
    // is the room that shows it. The studies are the drills a singer builds
    // the short warm-up from; the Full warmup is a 14-minute routine.
    basis: measured("cycleDose"),
    companion: { room: "analyze" },
    studies: ["morning-hum", "humming-thirds", "descending-five"],
    readings: ["stamina-and-health", "how-the-program-works"],
  },
  "v-l7-m2": {
    basis: selfCheck(
      "vowelOrFormant",
      "That you sang one phrase two recognizably different ways. Style is a human judgment and is not scored.",
    ),
    // The lessons record both styles in one take; the atlas chapter stays
    // listed under the readings.
    companion: { room: "recorder" },
    studies: ["amazing-grace-full", "simple-gifts"],
    readings: ["atlas:how-to-borrow-a-voice", "learning-from-other-voices"],
  },
  "v-l7-m3": {
    basis: selfCheck(
      "strainOrPressedPhonation",
      "That you tried production choices on cue and returned to neutral. Neither the choices nor the absence of strain is measured.",
    ),
    companion: { room: "recorder" },
    studies: ["morning-sustain"],
    readings: ["atlas:a-vocabulary-for-tone", "atlas:the-safety-rail"],
  },
  "v-l7-m4": {
    basis: selfCheck(
      "strainOrPressedPhonation",
      "That you read the safety material and wrote a stop plan. Effects carry real injury risk and nothing here can verify safety.",
    ),
    // Where earlier supervised takes are played back; nothing here asks for
    // the effect to be produced.
    companion: { room: "recorder" },
    studies: [],
    readings: ["atlas:the-safety-rail", "stamina-and-health"],
  },
  "v-l7-m5": {
    // The lessons take their evidence in one recorded take and save the range
    // test for the next retest, weeks apart; a test is not practice, and every
    // finished one replaces the saved range. Not the warm-up room either: it
    // fits each pattern under the measured high, so it can never place the
    // semitone past today's comfortable endpoint that these lessons ask for.
    basis: selfCheck(
      "strainOrPressedPhonation",
      "That you compared today's easy low and high notes with an earlier baseline taken the same way, by ear and on playback, without forcing an extension. Whether a new note is usable rather than forced is your judgment; the range test measures your extremes, and it belongs to your next retest, weeks apart.",
    ),
    companion: { room: "recorder" },
    studies: ["morning-three-note", "chromatic-neighbor"],
    // Chapter 8's "Retesting fairly" is this module's retest rule, and free.
    readings: ["tracking-change", "range-is-not-one-number", "reading-the-range-test"],
  },
  "v-l7-m6": {
    // The detector returns one fundamental per frame, so a harmony against a
    // lead is not two measurable parts.
    basis: selfCheck(
      "simultaneousVoices",
      "That you rehearsed the study and compared takes. A harmony, if you add one, cannot be measured: the pitch detector hears one voice at a time.",
    ),
    companion: { room: "recorder" },
    studies: ["amazing-grace-full", "home-on-the-range-full"],
    readings: ["building-a-set", "weeks-11-12-songs"],
  },
};

/**
 * The contract's room paths, restated so a client component can build a link
 * without importing the whole contract. The test pins them to the contract.
 */
export const ROOM_PATHS: Record<string, string> = {
  range: "/range",
  warmups: "/warmups",
  breath: "/breath",
  earTraining: "/ear-training",
  studio: "/studio",
  songs: "/songs",
  analyze: "/analyze",
  recorder: "/recorder",
  progress: "/progress",
  tools: "/tools",
  atlas: "/atlas",
  glossary: "/glossary",
  singers: "/singers",
  programs: "/programs",
};

/** What a singer calls each room. */
export const ROOM_LABELS: Record<string, string> = {
  range: "the range test",
  warmups: "the warm-up room",
  breath: "the breath room",
  earTraining: "ear training",
  studio: "the pitch studio",
  songs: "the songbook",
  // The live analyzer, not the Pro "take analysis" of recorded takes.
  analyze: "the voice analyzer",
  recorder: "the recorder",
  progress: "your progress",
  tools: "the practice tools",
  atlas: "the voice atlas",
  glossary: "the glossary",
  singers: "the singer directory",
  programs: "the practice programs",
};

const FREE_EXERCISES = new Map(EXERCISES.map((e) => [e.id, e]));
const PRO_EXERCISES = new Map(
  PRO_PACKS.flatMap((p) => p.exercises).map((e) => [e.id, e]),
);
const SONGS_BY_ID = new Map(ALL_SONGS.map((s) => [s.id, s]));

/** A `?song=` link takes the song's slug, which is not always its ID. */
function companionValue(c: Companion): string | undefined {
  if (c.room === "songs" && c.value) return SONGS_BY_ID.get(c.value)?.slug;
  return c.value;
}

/** A relative link into the companion room. */
export function companionHref(c: Companion): string {
  const path = ROOM_PATHS[c.room];
  if (!path) throw new Error(`Unknown room ${c.room}`);
  if (c.room === "range") return rangeTestHref();
  const value = companionValue(c);
  return c.param && value ? `${path}?${c.param}=${encodeURIComponent(value)}` : path;
}

/** What to call the companion: the exercise or song by name where there is one. */
export function companionLabel(c: Companion): string {
  if (c.room === "warmups" && c.param === "exercise" && c.value) {
    return `${FREE_EXERCISES.get(c.value)?.title ?? c.value} in the warm-up room`;
  }
  if (c.room === "songs" && c.value) {
    return `${SONGS_BY_ID.get(c.value)?.title ?? c.value} in the songbook`;
  }
  if (c.room === "breath" && c.value === "sustain") return "the sustain test in the breath room";
  return ROOM_LABELS[c.room] ?? c.room;
}

/** The room a lesson page's first button opens: the lesson's own, else its module's. */
export function lessonCompanion(practice: ModulePractice, lessonId: string): Companion {
  return practice.lessonCompanion?.[lessonId] ?? practice.companion;
}

/**
 * The warm-up offered ahead of every link into the range test: a cold voice
 * under-reports at both ends, and the result replaces the saved range. The
 * Morning reset is about four minutes, inside the free daily allowance, and
 * it is the set the Your Range lessons and /learn's Day 1 name.
 */
export const RANGE_WARM_UP = {
  routine: "morning",
  href: "/warmups?routine=morning",
  label: "Warm up first: Morning reset",
} as const;

/** True when a link into this room comes after the warm-up. */
export function warmsUpFirst(c: Companion): boolean {
  return c.room === "range";
}

/**
 * Which logged sessions count as practising a module. Derived from what the
 * rooms already log (lib/progress.ts `logSession`), so there is no separate
 * lesson record: a warm-up is logged under its exercise title, a song under
 * its title, the sustain test as "Sustain test". The atlas logs nothing, so a
 * module sent there has no match and shows no practice count.
 */
export interface PracticeMatch {
  type: ActivityType;
  /**
   * When set, the session's `detail` must name it: this title, or for a song
   * or warm-up exercise one of the titles it was logged under before a rename.
   */
  detail?: string;
}

const ROOM_ACTIVITY: Partial<Record<string, ActivityType>> = {
  range: "range",
  warmups: "warmup",
  breath: "breath",
  earTraining: "ear",
  studio: "pitch",
  songs: "song",
  analyze: "analyze",
  recorder: "recording",
  tools: "tools",
};

/**
 * The activities that draw on the free daily allowance of guided practice.
 * Restates CAPPED_TYPES from lib/free-cap.ts, which is client-only; the test
 * holds the two together.
 */
export const GUIDED_ACTIVITY: ReadonlySet<ActivityType> = new Set<ActivityType>([
  "warmup",
  "ear",
  "breath",
  "song",
]);

/** True when practising here uses the free daily guided-practice allowance. */
export function isGuidedPractice(c: Companion): boolean {
  const type = ROOM_ACTIVITY[c.room];
  return type !== undefined && GUIDED_ACTIVITY.has(type);
}

/**
 * True when the buttons into this room send the singer to guided practice:
 * the room itself, or the warm-up offered before a range test. Wherever this
 * holds, the page states the daily allowance.
 */
export function linksGuidedPractice(c: Companion): boolean {
  return isGuidedPractice(c) || warmsUpFirst(c);
}

export function practiceMatch(c: Companion): PracticeMatch | undefined {
  const type = ROOM_ACTIVITY[c.room];
  if (!type) return undefined;
  if (c.room === "warmups" && c.param === "exercise" && c.value) {
    const title = FREE_EXERCISES.get(c.value)?.title;
    return title ? { type, detail: title } : { type };
  }
  if (c.room === "songs" && c.value) {
    const title = SONGS_BY_ID.get(c.value)?.title;
    return title ? { type, detail: title } : { type };
  }
  if (c.room === "breath" && c.value === "sustain") return { type, detail: "Sustain test" };
  return { type };
}

/**
 * Every session a module's pages send the singer to log: its room, any
 * lesson's own room, and each step of the warm-up offered before a range
 * test, which logs under its exercises' titles like any other warm-up.
 */
function sessionsSentTo(p: ModulePractice): PracticeMatch[] {
  const rooms = [p.companion, ...Object.values(p.lessonCompanion ?? {})].filter(
    (c): c is Companion => c !== undefined,
  );
  const matches = rooms.flatMap((c) => practiceMatch(c) ?? []);
  if (rooms.some(warmsUpFirst)) {
    for (const step of routineById(RANGE_WARM_UP.routine)?.steps ?? []) {
      matches.push({ type: "warmup", detail: stepExercise(step).title });
    }
  }
  return matches;
}

/**
 * A module's match for the "Practised" mark on the course and stage pages,
 * or nothing when a session another module sends the singer to would satisfy
 * it too. A recording, a studio or analyzer session, or a song that two
 * modules share is evidence for none of them in particular: one take in the
 * recorder once marked eleven modules across Stages 3 to 7 as practised. So
 * is a drill inside the Morning reset that Stage 1 prescribes before the
 * range test: every new singer sings it on day one. The module and lesson
 * pages still count the room's sessions, naming the room they count.
 */
export function distinctPracticeMatch(moduleId: string): PracticeMatch | undefined {
  const own = MODULE_PRACTICE[moduleId];
  const match = own ? practiceMatch(own.companion) : undefined;
  if (!match) return undefined;
  const shared = Object.entries(MODULE_PRACTICE).some(
    ([id, p]) =>
      id !== moduleId &&
      sessionsSentTo(p).some((other) => other.type === match.type && other.detail === match.detail),
  );
  return shared ? undefined : match;
}

export interface MaterialItem {
  kind: "exercise" | "song" | "book" | "atlas";
  title: string;
  /** Absent for a Pro exercise: a free page never deep-links one. */
  href?: string;
  /**
   * A free song's own page, which prints its range and key. `href` opens the
   * song in the songbook to sing; that URL canonicalises to /songs, so the
   * song's name links here and the practice link sits beside it.
   */
  page?: string;
  /** Part of Suede Pro rather than free. */
  pro: boolean;
  /** A one-line description where the source has one. */
  note?: string;
}

function studyItem(id: string): MaterialItem {
  const free = FREE_EXERCISES.get(id);
  if (free) {
    return { kind: "exercise", title: free.title, href: `/warmups?exercise=${id}`, pro: false };
  }
  const pro = PRO_EXERCISES.get(id);
  if (pro) return { kind: "exercise", title: pro.title, pro: true };
  const song = SONGS_BY_ID.get(id);
  if (song) {
    return {
      kind: "song",
      title: song.title,
      href: isProSong(id) ? undefined : `/songs?song=${song.slug}`,
      page: isProSong(id) ? undefined : `/songs/${song.slug}`,
      pro: isProSong(id),
    };
  }
  throw new Error(`Unknown study ${id}`);
}

function readingItem(id: string): MaterialItem {
  if (id.startsWith("atlas:")) {
    const slug = id.slice("atlas:".length);
    const chapter = ATLAS_CONTENTS.find((c) => c.slug === slug);
    if (!chapter) throw new Error(`Unknown atlas chapter ${slug}`);
    return { kind: "atlas", title: chapter.title, href: `/atlas/${slug}`, pro: !chapter.free, note: chapter.summary };
  }
  const chapter = BOOK_CONTENTS.find((c) => c.slug === id);
  if (!chapter) throw new Error(`Unknown book chapter ${id}`);
  return { kind: "book", title: chapter.title, href: `/book/${id}`, pro: !chapter.free, note: chapter.summary };
}

/** The practice material a module's lessons point at, resolved to sing's own pages. */
export function moduleMaterial(moduleId: string): MaterialItem[] {
  const practice = MODULE_PRACTICE[moduleId];
  if (!practice) return [];
  return [...practice.studies.map(studyItem), ...practice.readings.map(readingItem)];
}
