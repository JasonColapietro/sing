/**
 * The practice-parity contract: the web's reference numbers, in one machine
 * readable file that the native apps can assert against.
 *
 * Suede's vocal domain is implemented four times — this repo's TypeScript, the
 * companion web app in Suede-AI/suede-voice, the SwiftUI app, and the Android
 * app. Every parity slice so far has copied the numbers by hand out of a
 * handoff document. That is how they drift, and the drift is silent: nothing
 * fails, the two apps simply start scoring the same performance differently.
 *
 * The one already in the tree when this file was written: the web clamps a
 * song transpose to ±12 semitones and the iOS app clamps it to ±24. Neither
 * side had a test that could notice.
 *
 * So this module does not restate the numbers. It imports them from the modules
 * the app itself runs on and re-exports them as plain JSON-shaped data. The
 * committed `practice-parity.json` is that data serialized, and
 * `practice-parity.test.ts` fails when the file and this builder disagree. A
 * constant cannot change in the app without the contract changing with it.
 *
 * The native repo keeps a byte-identical copy and asserts its own constants
 * against it, so a divergence fails a test on whichever side moved.
 */
import {
  AUTO_TEMPO_DOWN_SCORE,
  AUTO_TEMPO_UP_SCORE,
  BAND_ORDER,
  BAND_UNLOCK_MASTERED,
  BREATH_HELD_BEATS,
  COUNT_IN_BEATS,
  DIFFICULTY_EASY_MAX,
  DIFFICULTY_MEDIUM_MAX,
  INITIAL_MULTIPLIER,
  JUDGMENTS,
  JUDGMENT_POINTS,
  JUDGMENT_THRESHOLDS,
  MASTERY_MIN_TEMPO,
  MASTERY_SCORE,
  MAX_TRANSPOSE,
  MIN_TRANSPOSE,
  MIN_VOLUME,
  MULTIPLIER_RUNGS,
  MULTIPLIER_STREAK,
  PASS_GUIDE_PCT,
  TEMPO_MAX,
  TEMPO_MIN,
  TEMPO_STEP,
  TOLERANCE_CENTS,
} from "@/components/songs/lib";
import {
  LEVEL_TITLES,
  MAX_LEVEL,
  XP_MAX_PER_SESSION,
  XP_MIN_PER_SESSION,
  XP_PER_ACHIEVEMENT,
  XP_PER_MINUTE,
  XP_SCORE_BONUSES,
  xpThreshold,
} from "@/lib/progress";
import { STAR_THRESHOLDS } from "@/lib/stars";

/**
 * Bumped only when the *shape* changes — a key added, removed or renamed.
 * A changed value is not a version bump; it is the thing the contract exists
 * to surface, and the native side should see it as a failing assertion rather
 * than as a version it can skip.
 */
export const CONTRACT_VERSION = 2;
/*
 * 2: added progress.xpEarn (the earn rate, previously unserialized), extended
 *    progress.xpThresholds from the first 12 rungs to all MAX_LEVEL rungs and
 *    gave each a title, and added mastery.minTempo. All three are key additions,
 *    which this contract counts as a shape change; none of the existing values
 *    moved.
 */

/**
 * Rules the native apps must satisfy that are not a single exported number.
 * Stated in prose because the assertion lives in each app's own test; stated
 * here so no one has to go re-read the web source to find out what it was.
 */
const RULES = {
  masteredBy:
    "A song is mastered by one whole-song solo pass in performance mode, sung at or above mastery.minTempo, scoring at or above masteryScore. A listen pass, a guided pass and a rehearsal run never master a song. Transposition never blocks mastery: fitting a song to your own range is the point of the transpose control.",
  autoTempo:
    "After a scored loop: at or above autoTempoUpScore step one tempoStep up, at or below autoTempoDownScore step one down, otherwise hold. The result is clamped to [tempoMin, tempoMax] and snapped to a tempoStep grid.",
  levelXp:
    "Cumulative XP for the end of level n is 40 * n * (n + 1). Level 1 starts at 0. XP past the last rung buys nothing.",
  stars:
    "Three stars at 90 percent, two at 75, one at 50, none below. Native scores are 0..1 fractions and the web's are 0..100 percentages; the thresholds are the same numbers on each scale.",
} as const;

/**
 * Divergences that are known, deliberate, and not to be silently 'fixed'.
 *
 * A key listed here is one the native side is allowed to answer differently.
 * Anything not listed here is a drift, and the native contract test should
 * fail on it. Entries carry the reason so the next reader does not have to
 * reconstruct the argument, and removing one is a deliberate act.
 */
const KNOWN_DIVERGENCES = {
  songTempo: {
    web: { min: TEMPO_MIN, max: TEMPO_MAX, step: TEMPO_STEP },
    ios: [0.75, 1.0],
    android: null,
    reason:
      "Not a value drift but a gap: iOS SongPracticeViewModel.tempoRates offers two fixed playback rates because native song practice is still playback without a microphone. The web's continuous tempo grid and its auto-tempo rules arrive natively with microphone-backed scoring. Listed so the gap is a recorded state rather than an oversight.",
  },
} as const;

/** The contract, built from the values the app itself runs on. */
export function buildContract() {
  return {
    contract: "suede-practice-parity",
    version: CONTRACT_VERSION,
    reference: {
      repo: "JasonColapietro/sing",
      modules: ["components/songs/lib.ts", "lib/progress.ts"],
      note: "Generated by contracts/practice-parity.ts. Do not hand-edit; run the regenerate command in contracts/README.md.",
    },
    scoring: {
      toleranceCents: TOLERANCE_CENTS,
      minVolume: MIN_VOLUME,
      countInBeats: COUNT_IN_BEATS,
      breathHeldBeats: BREATH_HELD_BEATS,
      judgments: [...JUDGMENTS],
      judgmentThresholds: JUDGMENT_THRESHOLDS.map(([j, floor]) => ({ judgment: j, floor })),
      judgmentPoints: { ...JUDGMENT_POINTS },
    },
    tempo: {
      min: TEMPO_MIN,
      max: TEMPO_MAX,
      step: TEMPO_STEP,
      autoUpScore: AUTO_TEMPO_UP_SCORE,
      autoDownScore: AUTO_TEMPO_DOWN_SCORE,
    },
    transpose: { min: MIN_TRANSPOSE, max: MAX_TRANSPOSE },
    difficulty: { easyMax: DIFFICULTY_EASY_MAX, mediumMax: DIFFICULTY_MEDIUM_MAX },
    bands: {
      order: [...BAND_ORDER],
      unlockMastered: BAND_UNLOCK_MASTERED,
    },
    multiplier: {
      rungs: [...MULTIPLIER_RUNGS],
      streak: MULTIPLIER_STREAK,
      initial: INITIAL_MULTIPLIER.multiplier,
    },
    guide: { passGuidePct: { ...PASS_GUIDE_PCT } },
    mastery: { score: MASTERY_SCORE, minTempo: MASTERY_MIN_TEMPO },
    progress: {
      starThresholdsPercent: [...STAR_THRESHOLDS],
      maxLevel: MAX_LEVEL,
      levelTitles: [...LEVEL_TITLES],
      /**
       * How fast a singer climbs the ladder. The rungs were already here; the
       * rate was not, so two surfaces could pass every assertion in this file
       * and still level singers at different speeds.
       */
      xpEarn: {
        perMinute: XP_PER_MINUTE,
        minPerSession: XP_MIN_PER_SESSION,
        maxPerSession: XP_MAX_PER_SESSION,
        scoreBonuses: XP_SCORE_BONUSES.map((rung) => ({ ...rung })),
        perAchievement: XP_PER_ACHIEVEMENT,
      },
      // Every rung, not the first twelve. Serialized rather than described so a
      // native ladder is checked rung by rung instead of by re-implementing the
      // formula from prose — and stopping at 12 of 60 left rungs 13 to 60
      // assertable only by trusting that formula.
      xpThresholds: Array.from({ length: MAX_LEVEL }, (_, i) => ({
        level: i + 1,
        cumulativeXp: xpThreshold(i + 1),
        /**
         * The title shown at this level. LEVEL_TITLES has 15 entries for 60
         * levels, so the last title repeats from level 15 on; spelled out here
         * so a consumer does not index past the end and render undefined.
         */
        title: LEVEL_TITLES[Math.min(i, LEVEL_TITLES.length - 1)],
      })),
    },
    rules: RULES,
    knownDivergences: KNOWN_DIVERGENCES,
  };
}

export type PracticeParityContract = ReturnType<typeof buildContract>;
