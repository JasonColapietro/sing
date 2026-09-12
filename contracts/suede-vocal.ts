/**
 * The suede-vocal contract: what Suede's vocal domain *is*, and — the part
 * that matters most — what it can and cannot measure.
 *
 * `practice-parity.json` already pins the song-scoring numbers. This file
 * exists for a different failure, found by auditing GuitarHub's voice
 * curriculum against this app:
 *
 * GuitarHub ships a seven-level voice track whose modules promise measured
 * outcomes — "a twelve-second even hiss", "five pitches within twenty-five
 * cents", "both passaggio pitches", "vibrato rate on cue", "no strain". Those
 * promises were authored against an idea of this app rather than against this
 * app. Some of them this app measures exactly. Some it measures differently
 * from how they are worded. And several it cannot measure at all, because the
 * acoustic analysis they need exists in no Suede surface:
 *
 *   - There is no strain or pressed-phonation detector anywhere. `ringRatio`
 *     is a self-relative resonance share and is explicitly not a strain proxy.
 *   - There is no vibrato rate analysis.
 *   - The pitch detector is strictly monophonic, so "a held harmony against a
 *     lead" is not two measurable voices.
 *   - A passaggio is not derivable from a range scan. `VOICE_TYPE_PASSAGGIO`
 *     is a per-category published table, not a personal measurement, and
 *     `lib/voice-types.ts` says so at length.
 *
 * A curriculum cannot discover any of that by reading prose, and nothing
 * failed when it got it wrong. So the capability list is serialized here as
 * data, with explicit `measurable` verdicts, and the consuming repo asserts
 * its lesson claims against it. A claim with no backing measurement becomes a
 * failing test instead of a promise to a singer that the product cannot keep.
 *
 * It is generated, not written: every number is imported from the modules the
 * app runs on, exactly like `practice-parity.ts`. See contracts/README.md.
 */
import { VOICE_TYPE_PASSAGGIO, type VoiceTypePassaggio } from "@/lib/voice-types";
import { REFERENCE_BANDS } from "@/lib/singers-analysis";
import { VOICE_KINDS } from "@/lib/singers-core";
import { A4, VOICE_TYPES } from "@/lib/audio/notes";
import { MAX_FREQ, MIN_FREQ } from "@/lib/audio/pitch";
import { TOLERANCE_CENTS } from "@/components/songs/lib";
import { STAR_THRESHOLDS } from "@/lib/stars";
import {
  BREATH_ROUTINES,
  BREATH_STEP_INTRO_SEC,
  FARINELLI_LEAD_SEC,
  FARINELLI_START_N,
  SUSTAIN_ATTEMPT_SEC,
  boxSeconds,
  breathRoutineSeconds,
  farinelliSeconds,
  routineNeedsMic,
} from "@/components/breath/routines";
import {
  EAR_GAME_SECONDS,
  EAR_ROUTINES,
  EAR_STEP_INTRO_SEC,
  GAME_MIC,
  GAME_TRAINS,
  earRoutineSeconds,
} from "@/components/ear/routines";
import { EXERCISES, PRO_PACKS, buildSegments, type WarmupExercise } from "@/components/warmups/exercises";
import {
  ALL_ROUTINES,
  STEP_INTRO_SEC,
  isFreeExercise,
  routineSeconds,
} from "@/components/warmups/routines";

/**
 * Bumped only when the *shape* changes — a key added, removed or renamed.
 * A changed value is not a version bump; it is the thing the contract exists
 * to surface.
 */
export const CONTRACT_VERSION = 1;

/**
 * Every measurement this app can take from a microphone, and every one a
 * curriculum might reasonably assume it can take but which does not exist.
 *
 * `measurable` is the field consumers assert against:
 *   "yes"      — implemented, with the named unit, today.
 *   "adaptable"— the underlying signal is already captured and correct, but no
 *                function computes this number yet. Real work, not research.
 *   "no"       — not implemented, and not a small job: it needs acoustic
 *                analysis that exists in no Suede surface.
 *
 * A lesson may only promise proof that a "yes" row can supply. Anything else
 * is an aspiration and must be worded as practice rather than as proof.
 */
const MEASUREMENTS = {
  pitchHz: {
    measurable: "yes",
    unit: "hertz",
    module: "lib/audio/pitch.ts",
    note: "NSDF (McLeod-Wyvill) with parabolic interpolation, monophonic, one f0 per frame.",
  },
  centsFromTarget: {
    measurable: "yes",
    unit: "cents",
    module: "lib/audio/notes.ts centsOff",
    note: "Signed deviation from a named target pitch. The strongest measurement the app has.",
  },
  inTuneHoldTime: {
    measurable: "yes",
    unit: "seconds",
    module: "components/warmups/scoring.ts, components/songs/song-player.tsx",
    note: "Time held inside the tolerance window, latency-corrected before it is credited.",
  },
  scorePercent: {
    measurable: "yes",
    unit: "percent",
    module: "components/songs/song-player.tsx",
    note: "In-tolerance hold time over possible hold time.",
  },
  sustainSeconds: {
    measurable: "yes",
    unit: "seconds",
    module: "components/breath/sustain-test.tsx",
    note: "Longest continuous above-threshold tone. RMS-gated, so it counts an unvoiced hiss too.",
  },
  loudnessSteadiness: {
    measurable: "yes",
    unit: "percent",
    module: "components/breath/sustain-test.tsx",
    note: "1 minus the coefficient of variation of RMS. This is a LOUDNESS measure. It is not airflow and it is not pitch.",
  },
  phonationSeconds: {
    measurable: "yes",
    unit: "seconds",
    module: "lib/audio/vocal-dose.ts",
    note: "Confidently voiced time. Counts singing rather than time with the page open. An unvoiced hiss reads as zero here.",
  },
  cycleDose: {
    measurable: "yes",
    unit: "vocal fold cycles",
    module: "lib/audio/vocal-dose.ts",
    note: "f0 integrated over phonation time. Load evidence, with no published safe ceiling.",
  },
  rangeExtremes: {
    measurable: "yes",
    unit: "midi",
    module: "components/range/range-test.tsx",
    note: "Lowest and highest comfortable note by cumulative dwell. Falsetto and head voice count toward the high note.",
  },
  ringRatio: {
    measurable: "yes",
    unit: "ratio",
    module: "lib/audio/spectrum.ts",
    note: "Share of energy in a fixed 2800-3200 Hz band. Self-relative only: compare a singer against their own takes, never against a target or another singer. NOT a strain measure.",
  },
  unbrokenPhraseLength: {
    measurable: "adaptable",
    unit: "seconds",
    module: null,
    note: "The voiced/unvoiced trace already carries this; no function reduces it to a longest-run number.",
  },
  onsetTimingError: {
    measurable: "adaptable",
    unit: "milliseconds",
    module: null,
    note: "The latency model needed to do this honestly exists, but there is no onset detector and no timing-error number.",
  },
  vibratoRateHz: {
    measurable: "no",
    unit: "hertz",
    module: null,
    note: "No analysis of the f0 contour's periodicity. The data to build it is captured; zero code exists.",
  },
  strainOrPressedPhonation: {
    measurable: "no",
    unit: null,
    module: null,
    note: "No jitter, shimmer, HNR or CPP anywhere in any Suede surface. Not cheaply buildable. Do not substitute ringRatio for it.",
  },
  registerMechanism: {
    measurable: "no",
    unit: null,
    module: null,
    note: "No chest/head/falsetto classification on the web. The iOS app reports a single H1-H2 derived boundary, which is a different and narrower claim.",
  },
  vowelOrFormant: {
    measurable: "no",
    unit: null,
    module: null,
    note: "One fixed band ratio is the whole of the spectral analysis. No formant tracking, so vowel consistency cannot be scored.",
  },
  dictionClarity: {
    measurable: "no",
    unit: null,
    module: null,
    note: "No consonant or intelligibility analysis.",
  },
  absoluteLoudness: {
    measurable: "no",
    unit: null,
    module: null,
    note: "Input RMS is uncalibrated. Disabling AGC makes it stable, not absolute, so discrete dynamic levels are not measurable.",
  },
  simultaneousVoices: {
    measurable: "no",
    unit: null,
    module: null,
    note: "The detector returns one f0 per frame. A harmony sung against a lead is not two measurable parts.",
  },
  passaggioPitches: {
    measurable: "no",
    unit: null,
    module: null,
    note: "See taxonomy.passaggio.derivableFromRangeScan. The published zones are per-category, not personal, and a range scan does not imply them.",
  },
} as const;

/**
 * Claims a consuming curriculum has made that this app does not support, kept
 * as data so the consumer's test can name them rather than rediscovering them.
 *
 * This is not a wishlist. Each entry is a promise currently shown to a singer
 * on some Suede surface that the measurement layer cannot keep.
 */
const UNSUPPORTED_CLAIMS = {
  "flow-consistency": {
    claimedAs: "airflow or flow steadiness during a sustain",
    reality: "loudnessSteadiness is a coefficient of variation of LOUDNESS, not of airflow.",
    useInstead: ["sustainSeconds", "loudnessSteadiness"],
  },
  "pitch-steadiness-in-breath-room": {
    claimedAs: "the breath room watching how steady the pitch stays",
    reality:
      "The sustain test reads frame volume only and never reads f0. No cents drift is measured in the breath room at all.",
    useInstead: ["sustainSeconds", "loudnessSteadiness"],
  },
  "personal-passaggio-from-range-scan": {
    claimedAs: "both passaggio pitches computed from a range scan",
    reality:
      "A range scan returns a low note, a high note and an estimated category label. Passaggio zones are published per category.",
    useInstead: ["rangeExtremes"],
  },
  "strain-free-verdict": {
    claimedAs: "a pass/fail that the singer was not straining",
    reality: "No strain detector exists. A strain claim cannot be scored, only self-reported.",
    useInstead: [],
  },
  "vibrato-rate-on-cue": {
    claimedAs: "vibrato rate in hertz",
    reality: "No vibrato analysis exists.",
    useInstead: [],
  },
  "held-harmony-against-a-lead": {
    claimedAs: "a harmony line measured against a simultaneous lead",
    reality: "The pitch detector is monophonic.",
    useInstead: ["centsFromTarget"],
  },
} as const;

/** Rules that are not a single exported number, stated once so nobody re-derives them. */
const RULES = {
  voiceTypeIsEstimate:
    "A range scan shows which conventional band overlaps a result. It cannot diagnose or permanently classify a voice, and no lesson may present the label as settled.",
  passaggioIsPublishedNotMeasured:
    "Passaggio zones are per-category published bands. Male rows are Miller's primo and secondo, exactly five semitones apart. Female rows are contemporary-commercial break figures, three to four semitones wide, and must not be relabelled as Miller's primo and secondo. Countertenor carries a required caveat instead of a confident number.",
  rangeScanOutputs:
    "A range scan yields lowMidi, highMidi and an estimated voice type label. It yields nothing else, and in particular no passaggio and no register boundary.",
  workingRangeIsTrimmed:
    "The scan records extremes reached by pushing. A usable working range trims the edges; the scan and the working range are different numbers and a curriculum must not call the scan 'the one you can use'.",
  sustainIsLoudnessNotPitch:
    "Sustain steadiness is the coefficient of variation of loudness. The breath room never reads f0.",
  freeExerciseGate:
    "A warmup is free if and only if it is in EXERCISES. Pro packs are gated by array membership, not by a flag, so a free surface must never deep-link a pack exercise.",
} as const;

/**
 * Deliberate divergences, kept so removing one is a decision rather than
 * cleanup. Shaped to allow any number of surfaces, unlike practice-parity's
 * fixed web/ios/android triple.
 */
const KNOWN_DIVERGENCES = {
  classifiableVoiceTypes: {
    surfaces: {
      web: VOICE_TYPES.map((v) => v.id),
      editorial: VOICE_KINDS,
    },
    reason:
      "The classifier can return six categories; the editorial taxonomy publishes eight. Bass-baritone and countertenor have atlas pages and passaggio rows but are not reachable classifier outputs. Recorded so a consumer routing on a classified label knows two published categories can never arrive.",
  },
  pitchToleranceCents: {
    surfaces: { singWeb: TOLERANCE_CENTS, guitarHubLessons: 35, tunerStrict: 5 },
    reason:
      "Sung-note judgment is deliberately more forgiving than a fretted-instrument lesson check, and a tuner is stricter than both. Same key name, three different jobs; not a drift to collapse.",
  },
  starScales: {
    surfaces: { practiceRooms: [...STAR_THRESHOLDS], songbookLinearMax: 5 },
    reason:
      "Practice rooms grade on three stars at percentage floors; the songbook grades on five linear stars plus a letter. Two instruments, not one drifted number. A consumer asserting 'stars' must say which.",
  },
} as const;

/** Offsets from the root, which is how a warmup pattern is actually defined. */
function exerciseOffsets(ex: WarmupExercise): number[][] {
  return ex.buildSteps(0);
}

function serializeExercise(ex: WarmupExercise, free: boolean) {
  const { segs, totalSec } = buildSegments(ex, 60, 1);
  return {
    id: ex.id,
    // Carried alongside the id because practice history is keyed on the title,
    // not the id. A consumer matching sessions must have both.
    title: ex.title,
    tier: ex.tier,
    free,
    noteDur: ex.noteDur ?? null,
    glide: ex.glide ?? false,
    ladder: ex.ladder ?? "up",
    /** Semitone offsets from the root, one array per step. */
    steps: exerciseOffsets(ex),
    segmentCount: segs.length,
    patternSeconds: Number(totalSec.toFixed(3)),
  };
}

/** The contract, built from the values the app itself runs on. */
export function buildContract() {
  return {
    contract: "suede-vocal",
    version: CONTRACT_VERSION,
    reference: {
      repo: "JasonColapietro/sing",
      modules: [
        "lib/voice-types.ts",
        "lib/singers-analysis.ts",
        "lib/singers-core.ts",
        "lib/audio/notes.ts",
        "lib/audio/pitch.ts",
        "components/warmups/exercises.ts",
        "components/warmups/routines.ts",
        "components/breath/routines.ts",
        "components/ear/routines.ts",
      ],
      note: "Generated by contracts/suede-vocal.ts. Do not hand-edit; run the regenerate command in contracts/README.md.",
    },

    pitch: {
      a4Hz: A4,
      detectorMinHz: MIN_FREQ,
      detectorMaxHz: MAX_FREQ,
      sungToleranceCents: TOLERANCE_CENTS,
      monophonic: true,
      /**
       * Spelled out because the two repos print accidentals differently and a
       * note label compared across them fails on the glyph alone.
       */
      accidentalGlyph: "#",
      labelFormat: "scientific",
    },

    taxonomy: {
      /** The editorial set: what the atlas and the singer directory publish. */
      voiceKinds: [...VOICE_KINDS],
      /** The subset a range scan can actually return. */
      classifiableVoiceTypes: VOICE_TYPES.map((v) => ({
        id: v.id,
        label: v.label,
        lowMidi: v.lowMidi,
        highMidi: v.highMidi,
      })),
      referenceBands: Object.fromEntries(
        VOICE_KINDS.map((kind) => [kind, { ...REFERENCE_BANDS[kind] }]),
      ),
      passaggio: {
        /**
         * The single most important boolean in this file. GuitarHub's
         * curriculum promised a personal passaggio computed from a range scan;
         * this says, in data, that no such computation exists.
         */
        derivableFromRangeScan: false,
        source: "published per-category bands",
        zones: Object.fromEntries(
          VOICE_KINDS.map((kind) => {
            const zone: VoiceTypePassaggio = VOICE_TYPE_PASSAGGIO[kind];
            const span = zone.high - zone.low;
            return [
              kind,
              {
                low: zone.low,
                high: zone.high,
                spanSemitones: span,
                /**
                 * Which registration event the row describes. A consumer must
                 * not relabel a ccm-break row as Miller's primo and secondo.
                 */
                semantics:
                  kind === "Countertenor"
                    ? "m1-m2-crossing"
                    : span === 5
                      ? "miller-primo-secondo"
                      : "ccm-break",
                caveat: zone.caveat ?? null,
              },
            ];
          }),
        ),
      },
      registerMechanisms: ["M1", "M2"],
      headVoiceIsSeparateMechanism: false,
    },

    rangeScan: {
      outputs: ["lowMidi", "highMidi", "voiceType", "voiceTypeLabel"],
      includesFalsettoAndHeadVoice: true,
      stopBeforeStrain: true,
      voiceTypeIsEstimate: true,
    },

    measurement: MEASUREMENTS,
    unsupportedClaims: UNSUPPORTED_CLAIMS,

    breath: {
      stepIntroSec: BREATH_STEP_INTRO_SEC,
      sustain: {
        /**
         * The published benchmark ladder. Note 12 seconds is NOT a rung: it
         * sits inside the lowest band. A curriculum promising a twelve-second
         * milestone has no threshold here to pass or fail against.
         */
        benchmarksSec: { fair: 10, good: 20, strong: 30, excellent: 45 },
        starsSec: { one: 10, two: 20, three: 30 },
        attemptEstimateSec: SUSTAIN_ATTEMPT_SEC,
        steadinessMetric: "loudness_cv",
        measuresPitchDrift: false,
        acceptsUnvoicedHiss: true,
      },
      box: {
        phases: ["Inhale", "Hold", "Exhale", "Hold"],
        usesMicrophone: false,
        exampleSeconds: boxSeconds({ side: 4, minutes: 1 }),
      },
      farinelli: {
        phases: ["Inhale", "Hold", "Exhale"],
        startN: FARINELLI_START_N,
        leadSec: FARINELLI_LEAD_SEC,
        beatsPerSecond: 1,
        usesMicrophone: false,
        exampleSeconds: farinelliSeconds({ cap: 8 }),
      },
      routines: BREATH_ROUTINES.map((r) => ({
        id: r.id,
        name: r.name,
        steps: r.steps.map((s) => ({ ...s })),
        seconds: Number(breathRoutineSeconds(r).toFixed(3)),
        needsMic: routineNeedsMic(r),
      })),
    },

    warmups: {
      stepIntroSec: STEP_INTRO_SEC,
      tempos: [0.5, 0.75, 1, 1.25],
      exercises: [
        ...EXERCISES.map((ex) => serializeExercise(ex, true)),
        ...PRO_PACKS.flatMap((pack) => pack.exercises.map((ex) => serializeExercise(ex, false))),
      ],
      packs: PRO_PACKS.map((p) => ({
        id: p.id,
        name: p.name,
        exerciseIds: p.exercises.map((e) => e.id),
      })),
      routines: ALL_ROUTINES.map((r) => ({
        id: r.id,
        name: r.name,
        pro: r.pro,
        steps: r.steps.map((s) => ({ ...s })),
        seconds: Number(routineSeconds(r).toFixed(3)),
        allStepsFree: r.steps.every((s) => isFreeExercise(s.exerciseId)),
      })),
    },

    earTraining: {
      stepIntroSec: EAR_STEP_INTRO_SEC,
      games: Object.keys(GAME_TRAINS).map((id) => {
        const game = id as keyof typeof GAME_TRAINS;
        return {
          id: game,
          trains: GAME_TRAINS[game],
          usesMicrophone: GAME_MIC[game],
          seconds: EAR_GAME_SECONDS[game],
        };
      }),
      routines: EAR_ROUTINES.map((r) => ({
        id: r.id,
        name: r.name,
        steps: r.steps.map((s) => ({ ...s })),
        seconds: earRoutineSeconds(r),
      })),
    },

    /**
     * Which rooms accept a deep link, and with what parameter. A consumer
     * linking into a room not listed here gets the room's default state, so
     * linking `?drill=` at a room with no parser silently does nothing.
     */
    deepLinks: {
      origin: "https://sing.suedeai.ai",
      rooms: {
        range: { path: "/range", params: [] },
        warmups: { path: "/warmups", params: ["exercise", "routine"] },
        breath: { path: "/breath", params: ["drill", "routine"] },
        earTraining: { path: "/ear-training", params: [] },
        studio: { path: "/studio", params: [] },
        songs: { path: "/songs", params: ["song"] },
        analyze: { path: "/analyze", params: [] },
        recorder: { path: "/recorder", params: [] },
        progress: { path: "/progress", params: [] },
        tools: { path: "/tools", params: [] },
        atlas: { path: "/atlas", params: [] },
        glossary: { path: "/glossary", params: [] },
        singers: { path: "/singers", params: [] },
      },
    },

    rules: RULES,
    knownDivergences: KNOWN_DIVERGENCES,
  };
}

export type SuedeVocalContract = ReturnType<typeof buildContract>;
