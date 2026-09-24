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
import type { ActivityType } from "@/lib/progress-shape";

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
    // Usable input time is what a confidently-voiced time measurement reports.
    basis: measured("phonationSeconds"),
    companion: { room: "analyze" },
    studies: ["sustained-hold"],
    readings: ["what-your-voice-is", "when-numbers-lie"],
  },
  "v-l1-m2": {
    // Strain is not measurable. What a scan establishes is the two extremes.
    basis: measured("rangeExtremes"),
    companion: { room: "range" },
    studies: ["morning-hum", "morning-siren"],
    readings: ["reading-the-range-test", "range-is-not-one-number"],
  },
  "v-l1-m3": {
    // A hiss is unvoiced, so phonation time reads zero on it; the RMS-gated
    // sustain timer is the measurement that sees a hiss.
    basis: measured("sustainSeconds"),
    companion: { room: "breath", param: "drill", value: "sustain" },
    studies: [],
    readings: ["breath", "weeks-1-2-baseline"],
  },

  // Stage 2 · Steady Tone
  "v-l2-m1": {
    basis: measured("sustainSeconds"),
    companion: { room: "warmups", param: "exercise", value: "straw-scale" },
    studies: ["straw-scale", "lip-trill-scale"],
    readings: ["breath", "stamina-and-health"],
  },
  "v-l2-m2": {
    basis: measured("centsFromTarget"),
    companion: { room: "studio" },
    studies: ["five-note-scale", "chromatic-neighbor"],
    readings: ["pitch-accuracy"],
  },
  "v-l2-m3": {
    basis: measured("inTuneHoldTime"),
    companion: { room: "warmups", param: "exercise", value: "sustained-hold" },
    studies: ["sustained-hold", "morning-sustain"],
    readings: ["breath", "pitch-accuracy"],
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
    companion: { room: "analyze" },
    studies: ["humming-thirds", "head-wee-descent"],
    readings: ["registers"],
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
    readings: ["resonance"],
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
    studies: ["morning-sustain"],
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
      "That the phrase came back on the beat by ear, against a click. There is no onset detector and no timing-error number.",
    ),
    companion: { room: "tools" },
    studies: ["row-row-row", "ode-to-joy"],
    readings: ["weeks-11-12-songs"],
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
    companion: { room: "analyze" },
    studies: ["sustained-hold", "simple-gifts"],
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
    companion: { room: "range" },
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
    studies: ["head-wee-descent", "legato-triad"],
    readings: ["registers", "atlas:the-safety-rail"],
  },
  "v-l5-m5": {
    basis: selfCheck(
      "keyAdherence",
      "That your answering phrase stayed in key, by ear. With no written target there is nothing for a score to compare against.",
    ),
    companion: { room: "earTraining" },
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
    readings: ["weeks-3-4-middle"],
  },
  "v-l6-m2": {
    basis: measured("scorePercent"),
    companion: { room: "warmups", param: "exercise", value: "hoo-four-note" },
    studies: ["hoo-four-note"],
    readings: ["breath", "weeks-3-4-middle"],
  },
  "v-l6-m3": {
    basis: selfCheck(
      "vibratoOnCue",
      "That you moved from straight tone to vibrato on cue. The vibrato hold in the warmups reads how fast and how wide a held note wobbled, but nothing times the switch itself, so the cue is yours to judge.",
    ),
    companion: { room: "analyze" },
    studies: ["sustained-hold"],
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
    companion: { room: "earTraining" },
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
    // The one module where cycle dose is the right evidence.
    basis: measured("cycleDose"),
    companion: { room: "warmups", param: "routine", value: "full" },
    studies: ["morning-hum", "humming-thirds", "descending-five"],
    readings: ["stamina-and-health", "how-the-program-works"],
  },
  "v-l7-m2": {
    basis: selfCheck(
      "vowelOrFormant",
      "That you sang one phrase two recognisably different ways. Style is a human judgement and is not scored.",
    ),
    companion: { room: "atlas" },
    studies: ["amazing-grace-full", "simple-gifts"],
    readings: ["atlas:how-to-borrow-a-voice", "learning-from-other-voices"],
  },
  "v-l7-m3": {
    basis: selfCheck(
      "strainOrPressedPhonation",
      "That you tried production choices on cue and returned to neutral. Neither the choices nor the absence of strain is measured.",
    ),
    companion: { room: "analyze" },
    studies: ["morning-sustain"],
    readings: ["atlas:a-vocabulary-for-tone", "atlas:the-safety-rail"],
  },
  "v-l7-m4": {
    basis: selfCheck(
      "strainOrPressedPhonation",
      "That you read the safety material and wrote a stop plan. Effects carry real injury risk and nothing here can verify safety.",
    ),
    companion: { room: "analyze" },
    studies: [],
    readings: ["atlas:the-safety-rail", "stamina-and-health"],
  },
  "v-l7-m5": {
    basis: measured("rangeExtremes"),
    companion: { room: "range" },
    studies: ["morning-three-note", "chromatic-neighbor"],
    readings: ["tracking-change", "range-is-not-one-number"],
  },
  "v-l7-m6": {
    // The detector returns one fundamental per frame, so a harmony against a
    // lead is not two measurable parts.
    basis: selfCheck(
      "simultaneousVoices",
      "That you rehearsed the study and compared takes. The harmony half cannot be measured: the pitch detector hears one voice at a time.",
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
};

/** What a singer calls each room. */
export const ROOM_LABELS: Record<string, string> = {
  range: "the range test",
  warmups: "the warm-up room",
  breath: "the breath room",
  earTraining: "ear training",
  studio: "the pitch studio",
  songs: "the songbook",
  analyze: "take analysis",
  recorder: "the recorder",
  progress: "your progress",
  tools: "the practice tools",
  atlas: "the voice atlas",
  glossary: "the glossary",
  singers: "the singer directory",
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
  if (c.room === "warmups" && c.param === "routine") return "the full warm-up routine";
  return ROOM_LABELS[c.room] ?? c.room;
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
  /** When set, the session's `detail` must equal it. */
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

export interface MaterialItem {
  kind: "exercise" | "song" | "book" | "atlas";
  title: string;
  /** Absent for a Pro exercise: a free page never deep-links one. */
  href?: string;
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
