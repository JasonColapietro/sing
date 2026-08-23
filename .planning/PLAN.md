# PLAN: warmups sing along, on a clock that tells the truth

**Goal.** Turn the warmup player from a memory test into a warmup: the guide sounds
under the singer's voice by default, there is a real breath before every scored
window, and call-and-response survives as a separately named and separately scored
mode.

**Approach.** Move the per-rep clock off `performance.now()` and onto the
AudioContext clock, the way `components/songs/song-player.tsx` already runs. Pull
the two pieces of hard logic — rep timing and rep scoring — out of the player into
pure, unit-tested modules before touching the player itself, so the rewrite is
wiring rather than invention. Compensate both directions of audio latency once, in
one shared helper, because a guide sounding under the voice makes input and output
lag compound instead of cancel. Give `lib/audio/synth.ts` the ability to silence
tones it has already scheduled, which is the defect that stops being cosmetic the
moment a guide plays during a scored window.

**Stack.** Next.js 16.2.11 (App Router), React 19.2.4, TypeScript 5, Tailwind 4,
vitest 4.1.10 (node environment, no DOM — component assertions go through
`renderToStaticMarkup`), Playwright 1.62 for browser-level audits under `scripts/`.

**This plan ships in two chunks.** Chunk A is Waves 1 and 2 (Tasks 1–6): the audio
clock helpers, the schema change, and the songs-room latency fix. It lands as its
own PR and changes no warmup behaviour. Chunk B is Waves 3–5 (Tasks 7–10): the
player rewrite and everything a singer sees. The split is context cost, not scope
reduction — every requirement below is planned in full — and it matches the
ordering decision that audio correctness lands before or alongside the mode work.

---

## Before Execution Can Start

No user setup required. No accounts, keys, DNS, dashboard configuration, or paid
tiers are involved. Every task runs against the local checkout.

One task (Task 10) needs a dev server running to audit against, started by the
executor with `npm run dev`, which is not user setup.

---

## Assumptions

1. This assumes the decisions recorded on 2026-08-23 are locked input: sing-along
   is the default and teaches the pattern once before running continuously; a
   0–100 guide-level slider governs how loud the guide sits under the voice;
   call-and-response is a separately named mode with its own scoring; a singer's
   chosen microphone and chosen monitoring mode are always respected and never
   gated; the note lane stays the primary feedback surface.
2. This assumes `echoCancellation: monitoring === "speakers"` in
   `lib/audio/mic.ts` remains the only defence against the app scoring its own
   guide, and that no headphones gate of the kind `components/ear/melody-echo-game.tsx`
   applies is added to warmups.
3. This assumes the stored practice record stays additive: a session written
   before modes existed must still load and read as a valid warmup.
4. This assumes `AudioContext.outputLatency` is absent on some browsers and that
   `baseLatency` is the fallback, rather than the two being summed.
5. This assumes the ladder walk itself is correct and out of scope. `computeRootLadder`
   and `ladderWalk` in `components/warmups/exercises.ts` are not modified by any task
   here.
6. This assumes a headless browser has no acoustic path from output to microphone,
   so guide bleed on real speakers cannot be proven by an automated check. Task 10
   states exactly what it does and does not cover.

---

## Tasks

### Task 1: extend lib/audio/synth.ts with cancellable tone groups

**Files:** `lib/audio/synth.ts`

**What:** Add an optional `out` destination to `ToneOptions` and a `createToneGroup()`
factory that returns a gain node every tone in the group routes through, plus a
`cancel()` that silences the group including tones scheduled to start later.

Add to `ToneOptions`:

```ts
  /** Where the tone connects. Defaults to the shared context destination. */
  out?: AudioNode;
```

In `playTone`, change the single line `out.connect(ctx.destination)` to
`out.connect(opts.out ?? ctx.destination)`. Add a matching `out?: AudioNode` to
`SequenceOptions` and pass it through in `playSequence`. Every existing call site
omits the option and keeps its current behaviour, and `playTone`'s return value
stays the end offset in seconds so `components/ear/pitch-match-game.tsx` and
`components/ear/melody-echo-game.tsx` are untouched.

Then add:

```ts
/**
 * A set of scheduled tones that can be silenced together.
 *
 * Nothing in this module could previously un-schedule a sound. Every tone is
 * committed to the audio clock at the moment it is scheduled, so a guide melody
 * kept sounding through a transpose, a tempo change, a skipped rung and an exit
 * back to the library. That is survivable while the guide only ever plays into
 * silence; it is a scoring bug the moment a guide sounds under the voice, because
 * a stale group at the previous root is then bleeding into a scored take.
 */
export interface ToneGroup {
  /** Pass as `out` to playTone/playSequence to route a tone into this group. */
  readonly node: GainNode;
  /** True once cancel() has run. */
  readonly cancelled: boolean;
  /** Silence the group over 40 ms, including tones scheduled to start later. */
  cancel(): void;
}

export function createToneGroup(): ToneGroup {
  const ctx = getAudioContext();
  const node = ctx.createGain();
  node.gain.setValueAtTime(1, ctx.currentTime);
  node.connect(ctx.destination);
  let cancelled = false;
  return {
    node,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      if (cancelled) return;
      cancelled = true;
      const t = ctx.currentTime;
      node.gain.cancelScheduledValues(t);
      node.gain.setValueAtTime(node.gain.value, t);
      node.gain.linearRampToValueAtTime(0, t + 0.04);
      // The gain stays at zero rather than disconnecting immediately: tones
      // already scheduled ramp their own envelopes through this node and each
      // stops itself at t0 + dur + 0.05. Five seconds clears the longest tone
      // this app schedules (an octave siren at 0.75x is 3.2 s).
      setTimeout(() => node.disconnect(), 5000);
    },
  };
}
```

**Why:** Every later task that plays a guide during a scored window needs a way to
take that guide back. Without it, four ordinary actions in the player (transpose,
tempo change, skip, exit) each leave a melody sounding at the wrong root.

**Verify:**
```bash
npx tsc --noEmit && npx vitest run lib/audio
```
Expected: tsc exits 0 with no output; the `lib/audio` suite passes with the same
test count as before this task (`pitch.test.ts`, `spectrum.test.ts`,
`vocal-dose.test.ts` are unchanged and must all still pass).

**Done:** `createToneGroup` and `ToneOptions.out` are exported from
`lib/audio/synth.ts`, `npx tsc --noEmit` is clean, and every existing caller of
`playTone`/`playSequence` compiles without change.

**Depends on:** none

**Wave:** 1

---

### Task 2: create lib/audio/latency.ts

**Files:** `lib/audio/latency.ts` `[NEW]`, `lib/audio/latency.test.ts` `[NEW]`,
`lib/audio/use-pitch.ts`

**What:** Create one module that answers how far behind reality the pitch reading is,
and how far ahead of the ear the audio clock is, so both rooms correct by the same
numbers.

First, in `lib/audio/use-pitch.ts`, extract the analyser frame size to a named export
so the constant and the analyser cannot drift:

```ts
/**
 * Analyser frame the pitch loop opens. Exported because lib/audio/latency.ts
 * converts it into the seconds a reading lags reality, and a frame size changed
 * in one place and not the other silently mis-aligns every scored room.
 */
export const PITCH_FFT_SIZE = 4096;
```

Use it at the existing `analyser.fftSize = 4096;` line, keeping the comment already
there. Then create the latency module:

```ts
import { getAudioContext } from "./context";

/**
 * Frames `usePitch` keeps in its median window. Mirrors the `hist.length > 4`
 * bound in lib/audio/use-pitch.ts; the two must move together, because this is
 * what converts that smoothing into a number of seconds.
 */
export const PITCH_MEDIAN_WINDOW = 4;

/**
 * Seconds between a sound reaching the microphone and `usePitch` reporting it.
 *
 * Two sources, both real. The analyser holds the last `fftSize` samples, so its
 * estimate describes the midpoint of that window rather than its end. The median
 * of the last `PITCH_MEDIAN_WINDOW` accepted frames then pushes the answer back
 * by half the window's span.
 *
 * At 48 kHz with the 4096-sample frame use-pitch.ts opens, this is about 68 ms.
 * Scoring a frame against the target at *now* therefore misattributes roughly
 * 68 ms of every note onset to the note before it.
 */
export function pitchReportLagSec(
  sampleRate: number,
  fftSize: number,
  frameSec = 1 / 60,
): number {
  if (!(sampleRate > 0) || !(fftSize > 0)) return 0;
  const analyserHalf = fftSize / sampleRate / 2;
  const medianHalf = ((PITCH_MEDIAN_WINDOW - 1) / 2) * frameSec;
  return analyserHalf + medianHalf;
}

/**
 * Seconds between scheduling a tone on the audio clock and hearing it.
 *
 * `outputLatency` is the full path to the speaker and already includes the graph
 * buffer that `baseLatency` reports, so the two are never summed. Bluetooth
 * routinely reports 150–300 ms here, which is why a guide sounding under the
 * voice cannot be aligned by assuming zero.
 */
export function outputLagSec(ctx: AudioContext): number {
  const reported = (ctx as AudioContext & { outputLatency?: number }).outputLatency;
  if (typeof reported === "number" && Number.isFinite(reported) && reported > 0) {
    return reported;
  }
  return Number.isFinite(ctx.baseLatency) ? ctx.baseLatency : 0;
}

/**
 * How far to rewind the target timeline when scoring a pitch frame.
 *
 * A guide scheduled at audio time `t0` is heard at `t0 + outputLag`. A singer
 * following it makes sound at that moment, and `usePitch` reports that sound
 * `pitchLag` later still. So a frame read at audio time `now` describes the
 * pattern at `now - t0 - scoreLagSec(...)`. The two lags add; they do not cancel.
 */
export function scoreLagSec(pitchLag: number, outputLag: number): number {
  return Math.max(0, pitchLag) + Math.max(0, outputLag);
}

/** Both lags for the live context, in one call, for a room about to score. */
export function liveLags(sampleRate: number, fftSize: number): {
  pitchLag: number;
  outputLag: number;
  scoreLag: number;
} {
  const pitchLag = pitchReportLagSec(sampleRate, fftSize);
  const outputLag = outputLagSec(getAudioContext());
  return { pitchLag, outputLag, scoreLag: scoreLagSec(pitchLag, outputLag) };
}
```

The test file covers the three pure functions only (`liveLags` touches the
AudioContext singleton and is exercised by Task 10's browser audit instead):

- `pitchReportLagSec(48000, 4096)` is within 0.001 of 0.0677.
- `pitchReportLagSec(44100, 4096)` is greater than the 48 kHz answer, because a
  slower rate makes the same frame span more time.
- `pitchReportLagSec(48000, 2048)` is roughly 21 ms smaller than the 4096 answer,
  matching the halved analyser window.
- `pitchReportLagSec(0, 4096)` and `pitchReportLagSec(48000, 0)` both return 0
  rather than Infinity or NaN, so a context that has not started cannot poison a
  timeline with a non-finite offset.
- `scoreLagSec(0.068, 0.2)` is 0.268, asserting the lags add.
- `scoreLagSec(-1, 0.2)` is 0.2, so a nonsense reading cannot rewind the timeline
  past its own start.

**Why:** Both rooms currently compare a stale pitch frame against a live target
clock, and neither reads output latency at all. Sing-along makes the error worse
rather than better, so the correction has to exist before the mode does.

**Verify:**
```bash
npx vitest run lib/audio && npx tsc --noEmit
```
Expected: 6 new latency tests pass alongside the existing `lib/audio` suite; tsc
exits 0.

**Done:** `pitchReportLagSec`, `outputLagSec`, `scoreLagSec` and `liveLags` are
exported from `lib/audio/latency.ts`, `PITCH_FFT_SIZE` is exported from
`lib/audio/use-pitch.ts` and drives its own analyser, and the six assertions above
pass.

**Depends on:** none

**Wave:** 1

---

### Task 3: extend the stored record with a warmup mode, and correct what the tally claims

**Files:** `lib/progress-shape.ts`, `lib/progress.ts`, `lib/analytics.ts`,
`lib/progress.test.ts`

**What:** Two edits to one idea — what a persisted practice record holds, and what
it truthfully says about itself.

First, the mode. In `lib/progress-shape.ts`, beside `ACTIVITY_TYPES`:

```ts
/**
 * How a warmup was sung. Sing-along scores a voice against a guide that is
 * sounding; call-and-response scores a voice reproducing a guide that has
 * stopped. Matching a sounding tone is the easier task, so the two never share
 * an average — see components/warmups/session-summary.tsx.
 */
export const WARMUP_MODES = ["sing-along", "call-response"] as const;
export type WarmupMode = (typeof WARMUP_MODES)[number];

const WARMUP_MODE_SET: ReadonlySet<string> = new Set(WARMUP_MODES);

export function isWarmupMode(value: unknown): value is WarmupMode {
  return typeof value === "string" && WARMUP_MODE_SET.has(value);
}
```

Add to `SessionLog`:

```ts
  /**
   * How a warmup was sung. Absent on every session logged before modes existed
   * and on every activity that has none.
   */
  mode?: WarmupMode;
```

Add `optional(value.mode, isWarmupMode) &&` to `isValidSession`, and this line to
`repairSession`, beside the existing `score`/`detail`/`notes` lines:

```ts
  if (isWarmupMode(value.mode)) session.mode = value.mode;
```

That `repairSession` line is the one that is easy to miss and silent when missed.
`repairSession` constructs a fresh object and copies fields by name, so a `mode`
added to the interface without a copy line survives `isValidSession`, is written to
localStorage, and is then dropped by `sanitizeProgress` on the next read, on the
sync merge, and on every import.

In `lib/progress.ts`, add `mode?: WarmupMode;` to the `logSession` input type,
re-export `WarmupMode` and `isWarmupMode` alongside the existing
`export type { ActivityType, ProgressState, SessionLog, VocalRange }`, and add to
the constructed session, using the same omit-when-absent form the `notes` key
already uses:

```ts
    ...(input.mode ? { mode: input.mode } : {}),
```

Second, the tally. `lib/analytics.ts` exports `IN_TUNE_CENTS = 25` documented as
"matching the ±25 cents the studio shows singers", and nothing anywhere reads it.
Both writers of `NoteTally.hitSec` — `components/warmups/exercise-player.tsx` and
`components/songs/song-player.tsx` — accumulate at ±50. Delete the unused constant
and correct the `NoteTally.hitSec` doc comment to read:

```ts
  /**
   * Of those, seconds sung within ±50 cents of the target. Both writers
   * (components/warmups/exercise-player.tsx and components/songs/song-player.tsx)
   * use that window; it is deliberately wider than the ±25 the studio draws,
   * because a held note that drifts to 40 cents is still a held note.
   */
  hitSec: number;
```

Add to `lib/progress.test.ts`, in the existing `describe("sanitizeProgress")` and
`describe("a record written by the first release still loads")` style:

- A session with `mode: "sing-along"` survives a `sanitizeProgress` round trip with
  `mode` still set. This is the assertion that fails if the `repairSession` line is
  forgotten.
- A session with `mode: "nonsense"` survives sanitize with `mode` absent and every
  other field intact, rather than being dropped whole.
- A session with no `mode` key survives sanitize with `mode` still absent.
- `checkProgress` accepts a payload whose session carries `mode: "call-response"`
  and returns null.
- `checkProgress` rejects a payload whose session carries `mode: 7` with a
  `malformed` rejection.

**Why:** Call-and-response scores differently from sing-along, so the stored record
has to say which one produced a number. Without the field, the history silently
averages two difficulties and a singer who switches modes reads it as improvement.

**Verify:**
```bash
npx vitest run lib/progress.test.ts && npx tsc --noEmit
```
Expected: the progress suite passes with 5 more tests than before this task, and
tsc exits 0. `grep -rn "IN_TUNE_CENTS" lib components app` returns nothing.

**Done:** A `SessionLog` carrying `mode` round-trips through `sanitizeProgress`,
`checkProgress` and `logSession` intact; an invalid mode is stripped without
dropping the session; `IN_TUNE_CENTS` no longer exists.

**Depends on:** none

**Wave:** 1

---

### Task 4: create components/warmups/timeline.ts

**Files:** `components/warmups/timeline.ts` `[NEW]`,
`components/warmups/timeline.test.ts` `[NEW]`

**What:** Lay one rep out as offsets on the audio clock, for both modes, as pure
functions with no React and no AudioContext.

```ts
import type { WarmupMode } from "@/lib/progress-shape";

/** Count-in clicks before every scored window. */
export const COUNT_IN_CLICKS = 2;

/**
 * Seconds of lead-in before a scored window opens: two beats of the exercise's
 * own pulse, floored so a fast pattern still leaves room to breathe.
 *
 * The player previously opened the scored window in the same instant the guide's
 * last note decayed, so a singer lost the whole first note to an ordinary breath.
 * Scaling by noteDur rather than using a constant means a slow exercise gets a
 * slow breath and 0.75x tempo stretches it with everything else.
 */
export const MIN_LEAD_SEC = 0.8;
export function leadSec(noteDur: number): number {
  return Math.max(MIN_LEAD_SEC, noteDur * 2);
}

/**
 * Seconds the scored window stays open past the pattern's last note.
 *
 * Not extra singing time: `targetMidiAt` returns null past the final segment, so
 * nothing accumulates here. It exists so the final note's frames, which arrive
 * up to `scoreLagSec` late, are still inside the window when they land.
 */
export const GRACE_SEC = 0.35;

export interface RepPlan {
  /** Audio-clock time of this rep's first scheduled event. */
  t0: number;
  /** Offset from t0 where a guide-alone pass starts, or null when there is none. */
  guideAt: number | null;
  /** Offset from t0 of the first count-in click. */
  leadAt: number;
  /** Offset from t0 where the scored window opens. */
  singAt: number;
  /** Length of the scored window, pattern plus grace. */
  singDur: number;
  /** Length of the whole rep. The next rep's t0 is t0 + repDur. */
  repDur: number;
  /** Whether the guide sounds during the scored window. */
  guideUnderVoice: boolean;
}

/**
 * One rep, in both modes.
 *
 * Sing-along teaches the pattern once: rep 0 carries a guide-alone pass, every
 * later rep goes straight to the count-in and the guide sounds under the voice.
 * Call-and-response plays the guide alone before every rep and leaves the scored
 * window silent, which is the harder task and is scored as its own thing.
 */
export function planRep(opts: {
  mode: WarmupMode;
  repIndex: number;
  t0: number;
  patternSec: number;
  noteDur: number;
}): RepPlan {
  const { mode, repIndex, t0, patternSec, noteDur } = opts;
  const lead = leadSec(noteDur);
  const teaches = mode === "call-response" || repIndex === 0;
  const guideAt = teaches ? 0 : null;
  const leadAt = teaches ? patternSec : 0;
  const singAt = leadAt + lead;
  const singDur = patternSec + GRACE_SEC;
  return {
    t0,
    guideAt,
    leadAt,
    singAt,
    singDur,
    repDur: singAt + singDur,
    guideUnderVoice: mode === "sing-along",
  };
}

/** Audio-clock times of this rep's count-in clicks, first one accented. */
export function clickTimes(plan: RepPlan, noteDur: number): number[] {
  const beat = leadSec(noteDur) / COUNT_IN_CLICKS;
  return Array.from(
    { length: COUNT_IN_CLICKS },
    (_, i) => plan.t0 + plan.leadAt + i * beat,
  );
}
```

The test file asserts:

- Sing-along rep 0 has `guideAt === 0` and `leadAt === patternSec`, so the pattern
  is taught before the first scored window.
- Sing-along rep 1 has `guideAt === null` and `leadAt === 0`, so the teaching pass
  happens exactly once.
- Sing-along rep 1's `repDur` is strictly less than rep 0's, which is the whole
  point of teaching once.
- Call-and-response rep 5 has `guideAt === 0` and `leadAt === patternSec`, so every
  rep re-teaches.
- `guideUnderVoice` is true for every sing-along rep including rep 0, and false for
  every call-and-response rep.
- `singAt` is strictly greater than `leadAt` in every mode and at every rep index,
  which is the assertion that the zero-breath defect cannot come back.
- `leadSec(0.5)` is 1.0 and `leadSec(0.3)` is `MIN_LEAD_SEC`, so a fast pattern is
  floored rather than given a 0.6 s breath.
- `clickTimes` returns `COUNT_IN_CLICKS` times, the first equal to
  `plan.t0 + plan.leadAt`, the last strictly before `plan.t0 + plan.singAt`, so no
  click lands inside the scored window.
- Chaining `t0 + repDur` across five sing-along reps produces strictly increasing
  `singAt` absolute times with no overlap between one rep's scored window and the
  next rep's `leadAt`.

**Why:** This is the breath and the teach-once cadence, expressed as arithmetic that
can be tested without a browser. Extracting it is also what keeps Task 7 a wiring
job instead of a rewrite with new logic in it.

**Verify:**
```bash
npx vitest run components/warmups/timeline.test.ts
```
Expected: 9 tests pass, 0 fail.

**Done:** `planRep`, `leadSec`, `clickTimes`, `COUNT_IN_CLICKS`, `MIN_LEAD_SEC` and
`GRACE_SEC` are exported and the nine assertions above pass.

**Depends on:** Task 3 (imports `WarmupMode` from `lib/progress-shape.ts`)

**Wave:** 2

---

### Task 5: create components/warmups/scoring.ts

**Files:** `components/warmups/scoring.ts` `[NEW]`,
`components/warmups/scoring.test.ts` `[NEW]`

**What:** Move the per-rep accumulation out of the player's animation-frame callback
into a closure that can be driven by a test.

The player currently keeps five refs (`hitAccumRef`, `centsSumRef`, `centsCountRef`,
`segCentsSumRef`, `segCentsFramesRef`) and builds the `RepResult` inline at
`components/warmups/exercise-player.tsx:292-324`. Move all of it here, unchanged in
behaviour, behind:

```ts
import { centsOff } from "@/lib/audio/notes";
import { segmentIndexAt, targetMidiAt, totalTargetDur, type RepResult } from "./lib";
import type { Segment } from "./exercises";

/** In-tune window a rep is scored against. */
export const TOLERANCE_CENTS = 50;

export interface RepScorer {
  /**
   * Fold one pitch frame in.
   *
   * `patternSec` is the position in the *pattern* the frame describes, which the
   * caller has already rewound by `scoreLagSec` — this module never guesses at
   * latency. `freq` is null for an unvoiced frame. `dt` is the frame's duration.
   */
  feed(patternSec: number, freq: number | null, dt: number): void;
  /** Voiced frames that landed on a target so far. Zero means nobody sang. */
  readonly voicedFrames: number;
  /** The finished rep, or null when nothing voiced ever landed on a target. */
  result(root: number): RepResult | null;
  /** Per-segment in-tolerance seconds, for the note lane's fill. */
  hitSec(): number[];
}

export function createRepScorer(segs: Segment[]): RepScorer;
```

`result(root)` returns null when `voicedFrames === 0`, which replaces the
`centsCountRef.current === 0` check the player does inline today; the player's
unsung-rep branch then keys off that null instead of reading a ref. Score, average
cents error, and the per-note `NoteScore[]` including the half-share split for glide
endpoints are computed exactly as they are today — copy the arithmetic across
without altering it.

`TOLERANCE_CENTS` moves here from `exercise-player.tsx`.
`components/warmups/session-summary.tsx:17` imports it from `./exercise-player`;
update that import to `./scoring` in this task, since it is the one line that breaks
otherwise. `exercise-player.tsx` keeps compiling by re-exporting it
(`export { TOLERANCE_CENTS } from "./scoring";`) until Task 7 removes the re-export.

The test file asserts:

- A scorer fed a perfectly on-pitch frequency for every segment of `five-note-scale`
  at root 52 returns a score of 100.
- A scorer fed a frequency 60 cents sharp throughout returns a score of 0 but a
  non-null result, because the singer sang — being wrong is not the same as being
  absent.
- A scorer fed 40 cents sharp throughout returns 100, pinning the ±50 window.
- A scorer fed only `null` frequencies returns null from `result()`, and
  `voicedFrames` is 0.
- A scorer fed on-pitch frames for the first half of the pattern and null for the
  second returns a score near 50, so partial credit is proportional to held time.
- A glide exercise (`ng-siren-fifth`) credits both endpoints of each segment with
  half its possible seconds, asserted by summing `possibleSec` per midi in the
  returned `notes` array.
- Feeding a `patternSec` past the last segment adds nothing to any total, which is
  what makes `GRACE_SEC` safe.

**Why:** The rep score is the number the whole room is judged on, and it currently
has no test at any level because it lives inside an animation-frame callback. It
also has to change shape in Task 7 to accept a latency-corrected time, and changing
untested arithmetic inside a rewrite is how a scoring regression ships.

**Verify:**
```bash
npx vitest run components/warmups && npx tsc --noEmit
```
Expected: the warmups suite passes with 7 more tests than the 40 passing before this
task, and tsc exits 0.

**Done:** `createRepScorer` is exported with the seven behaviours above pinned, the
player still compiles, and `session-summary.tsx` imports `TOLERANCE_CENTS` from
`./scoring`.

**Depends on:** none

**Wave:** 1

---

### Task 6: apply latency compensation in components/songs/song-player.tsx

**Files:** `components/songs/song-player.tsx`

**What:** Rewind the song's scoring position by `scoreLagSec` so a pitch frame is
judged against the beat it actually belongs to.

In `rafTick`, `beatInSong` is computed from `audioNow()` and used both to draw and to
score. Split those uses. Keep the existing `beatInSong` for the piano roll, the lyric
band and the section label. Add, inside the `if (listeningRef.current)` block that
starts at `components/songs/song-player.tsx:479` (not the one at `:460`, which is the
per-loop score push, nor the one at `:521`):

```ts
      // The frame in hand describes the voice `scoreLag` ago, and the guide it
      // was following was heard `outputLag` after it was scheduled. Judge it
      // against where the song was then, not where the song is now.
      const scoredBeat = beatInSong - scoreLagRef.current / spb;
      const idx = noteIndexAtBeat(currentNotesRef.current, scoredBeat);
```

replacing the current `noteIndexAtBeat(currentNotesRef.current, beatInSong)`. Leave
the judgment cursor (`while (cursor < order.length && beatInSong >= ...)`) on the
uncorrected `beatInSong`: it decides when a note's window has closed for display, and
moving it would delay every judgment badge by the same lag the singer cannot see.

Seed `scoreLagRef` once per session in `start()`, beside the existing
`sessionTempoRef` assignment, from the live analyser settings, importing
`liveLags` from `@/lib/audio/latency` and `PITCH_FFT_SIZE` from
`@/lib/audio/use-pitch` (both exist as of Task 2):

```ts
    const ctx = getAudioContext();
    scoreLagRef.current = liveLags(ctx.sampleRate, PITCH_FFT_SIZE).scoreLag;
```

**Why:** The songs room has the identical uncompensated-latency defect the warmup
room does, from the identical cause. Fixing one room and not the other leaves two
scoring rulers in an app that already had to be corrected once for exactly that.

**Verify:**
```bash
npx tsc --noEmit && npx vitest run components/songs
```
Expected: tsc exits 0; the songs suite passes with the same test count as before.

**Done:** `song-player.tsx` scores against `beatInSong - scoreLag/spb` while drawing
against `beatInSong`, the judgment cursor still runs on the uncorrected beat, and tsc
is clean.

**Depends on:** Task 2

**Wave:** 2

---

### Task 7: rewrite the exercise player onto the audio clock

**Files:** `components/warmups/exercise-player.tsx`,
`components/warmups/exercise-player.test.ts`, `components/warmups/lib.ts`

**What:** Replace the three-phase `performance.now()` machine with one animation loop
driven by `audioNow()` walking the `RepPlan` chain from Task 4.

The mode is held in local component state in this task, initialised to
`"sing-along"`, with no control rendered for it. Task 8 replaces that local state
with the persisted preference and adds the control. Task 7 must not read
`components/warmups/prefs.ts`, which does not exist until Task 8.

Delete the `Phase` union, `SKIPPABLE_PHASES`, `REP_RESULT_PAUSE_MS`, the three phase
effects at lines 190, 215 and 337, and the `TOLERANCE_CENTS` re-export added in
Task 5. Keep and do not modify the four exported pure functions
(`unsungRepAction`, `practicedDurationSec`, `ladderHeightPct`, `repAscending`) and
their existing tests.

The new shape:

- A `planRef` holding the current `RepPlan`, and a `scorerRef` holding the current
  `RepScorer` from Task 5.
- A `groupRef` holding the current `ToneGroup` from Task 1. Every guide tone and
  count-in click for a rep is scheduled into that group's node.
- `scheduleRep(repIndex, t0)`: builds the plan with `planRep`, creates a fresh
  `ToneGroup`, schedules the guide pass at `plan.guideAt` when it is not null, the
  `clickTimes` clicks, and — when `plan.guideUnderVoice` and the guide level is above
  zero — the same pattern again at `plan.t0 + plan.singAt` at
  `(guidePct / 100) * GUIDE_MAX_GAIN` with `GUIDE_MAX_GAIN = 0.22`, matching the gain
  `playGuide` uses today. `playGuide` in `components/warmups/lib.ts` gains an `out`
  and a `gain` parameter so it can serve all three of those calls; its two existing
  call sites pass the group node.
- One `requestAnimationFrame` loop. Each tick reads `audioNow()`, derives
  `elapsed = audioNow() - plan.t0`, and:
  - draws the playhead at `elapsed - plan.singAt - outputLag` so the cursor sits where
    the singer *hears* the guide rather than where it was scheduled;
  - when `elapsed >= plan.singAt`, feeds the scorer with
    `plan` position `elapsed - plan.singAt - scoreLag`, the current frame's `freq`
    when `frame.volume >= MIN_VOLUME`, and the frame `dt` clamped at 0.12 as today;
  - when `elapsed >= plan.repDur`, closes the rep: `scorer.result(currentRoot)` null
    means unsung and routes through the existing `unsungRepAction`; non-null appends
    to `results`, clears the unsung streak and sets `lastScoredAtRef`. Then it calls
    `scheduleRep(repIndex + 1, plan.t0 + plan.repDur)` so reps run edge to edge with
    no result pause.
- `scoreLag` and `outputLag` are read once when the exercise mounts, via
  `liveLags(getAudioContext().sampleRate, PITCH_FFT_SIZE)`, and held in refs.
- Skip, transpose, tempo change and exit each call `groupRef.current.cancel()` before
  doing anything else, then reschedule from `audioNow()`. This is what closes the
  four stale-guide paths.
- A `visibilitychange` listener that, on `hidden`, cancels the current tone group and
  stops the loop, and on `visible` reschedules the current rep from `audioNow()`.
  Model it on `components/songs/song-player.tsx:405-413`. Without this a hidden tab
  plays a full guide melody out loud and then stalls, because the phase timers were
  `setTimeout` and the scoring loop was `requestAnimationFrame`.
- The rep-score readout stops being a phase. Render the last completed rep's score as
  a pill that updates in place while the next rep is already running, so the ladder
  never stops for it. Keep the "No sound picked up" pill for an unsung rep, keyed off
  a null scorer result rather than the deleted `repSilent` state.
- The card's live treatment (`border-rec bg-rec/[0.04]`, the blinking dot, the
  "Your turn" heading) now keys off `elapsed >= plan.singAt && elapsed < plan.repDur`
  rather than `phase === "sing"`, and the "Listen" heading shows during a guide pass
  or a count-in. The `aria-live="polite"` heading and the lane's `opacity-70` treatment
  keep their current behaviour against those new conditions.

Add to `exercise-player.test.ts`, alongside the existing 40 tests:

- Chaining `planRep` across a sing-along session and asserting that the absolute
  scored-window start of rep N+1 is later than the absolute scored-window end of
  rep N, for N in 0..4, which is the no-overlap property the loop depends on.
- `unsungRepAction` continues to behave as its existing tests assert when driven by
  a null `RepScorer.result()` rather than a zero frame count: feed a scorer only
  null frequencies, assert `result()` is null, and assert
  `unsungRepAction(1, 3) === "continue"` and `unsungRepAction(2, 0) === "exit"` still
  hold. This pins the contract between the two modules.

**Why:** This is the rewrite every one of Jason's asks depends on: the breath, the
teach-once cadence, the guide under the voice, and the four stale-guide defects all
land here.

**Verify:**
```bash
npx tsc --noEmit && npx vitest run components/warmups && npm run lint
```
Expected: tsc exits 0; the warmups suite passes with 2 more tests than after Task 5;
lint reports no errors.

**Done:** The player runs one rAF loop off `audioNow()`, reps chain with no result
pause, every guide and click routes through a cancellable tone group that is
cancelled on skip, transpose, tempo change, exit and tab-hide, and scoring is fed a
latency-corrected pattern position.

**Depends on:** Task 1, Task 2, Task 3, Task 4, Task 5

**Wave:** 3

---

### Task 8: add the mode, guide-level and click controls

**Files:** `components/warmups/exercise-player.tsx`,
`components/warmups/prefs.ts` `[NEW]`, `components/warmups/prefs.test.ts` `[NEW]`,
`components/warmups/icons.tsx`

**What:** Give the singer the three controls the mode work exists for, persist the
choice, and raise the two caps that make the warmup room stricter than the songs room.

Create `components/warmups/prefs.ts`, mirroring the storage shape of
`lib/audio/devices.ts` (a module-level cache, a `subscribe` callback set, a
`useSyncExternalStore` hook, and localStorage keys under the `suede-sing:` prefix):

```ts
const MODE_KEY = "suede-sing:warmup:mode:v1";
const GUIDE_KEY = "suede-sing:warmup:guide:v1";
const CLICK_KEY = "suede-sing:warmup:click:v1";

export interface WarmupPrefs {
  mode: WarmupMode;
  /** Guide level 0–100. 0 is silent, and is how a singer practises unaccompanied. */
  guidePct: number;
  click: boolean;
}

export const DEFAULT_WARMUP_PREFS: WarmupPrefs = {
  mode: "sing-along",
  guidePct: 70,
  click: true,
};

export function getWarmupPrefs(): WarmupPrefs;
export function setWarmupMode(mode: WarmupMode): void;
export function setGuidePct(pct: number): void;   // clamped 0..100, rounded
export function setClick(on: boolean): void;
export function useWarmupPrefs(): WarmupPrefs;
export function subscribeWarmupPrefs(cb: () => void): () => void;
```

`prefs.test.ts` asserts the pure parts against a stubbed `window.localStorage`:
a stored mode of `"call-response"` reads back; a stored mode of `"banana"` falls back
to `"sing-along"`; a stored `guidePct` of `"250"` clamps to 100 and `"-4"` clamps to
0; a stored `guidePct` of `"abc"` falls back to 70; an absent store returns
`DEFAULT_WARMUP_PREFS` exactly.

In the player's controls card:

- A mode segmented control using the same `rounded-full border border-line2` pattern
  the tempo buttons already use, with `aria-pressed` on each, labelled "Sing along"
  and "Call and response". It is disabled once `sungReps(results).length > 0`, with
  `title="The mode is fixed once a rep has been scored, so one session is one
  score. End the exercise to switch."` This mirrors the rule the songs Mixer already
  documents: anything that changes what gets scored is fixed once scoring starts.
- A guide-level slider, copied in structure from `components/songs/mixer.tsx:149-172`:
  `<input type="range" min={0} max={100} step={5}>` with
  `className="min-w-0 flex-1 cursor-pointer accent-amber"`, an
  `aria-valuetext` of `"Off"` at 0 and `"NN percent"` otherwise, and a tabular
  readout showing `Off` or `NN%`. It stays live during a scored window, because level
  is monitoring rather than scoring. When the mode is call-and-response the slider
  governs the guide-alone pass only, and its label reads "Reference level".
- A click toggle, `aria-pressed`, using a new `IconMetronome` added to
  `components/warmups/icons.tsx` in the same `Svg` wrapper style as the existing
  icons (a triangle outline with a swung arm: `<path d="M9 3h6l4 18H5z" />` plus
  `<line x1="12" y1="19" x2="17" y2="7" />`).
- Raise `TEMPOS` from `[0.75, 1, 1.25]` to `[0.5, 0.75, 1, 1.25]`, matching
  `components/songs/lib.ts:7`. The room a singer is most likely to need slow is the
  one that currently will not go slow.
- Raise the transpose clamp from `Math.max(-6, …)` / `Math.min(6, …)` to `-12` / `12`,
  matching `MAX_TRANSPOSE`/`MIN_TRANSPOSE` in `components/songs/lib.ts:10-11`.

The player passes `mode` into `logSession` in `finalize`, so the mode reaches the
stored record through the field Task 3 added.

No monitoring gate is added anywhere in this task. A singer on speakers gets the
guide at whatever level they chose, riding the `echoCancellation: true` path
`lib/audio/mic.ts` already opens for them.

**Why:** These are the controls the whole plan exists to deliver, and locking the
mode at the first scored rep is what makes "separate scoring" true rather than
nominal.

**Verify:**
```bash
npx vitest run components/warmups/prefs.test.ts && npx tsc --noEmit && npm run lint
```
Expected: 6 prefs tests pass; tsc exits 0; lint reports no errors.

**Done:** Mode, guide level and click are visible in the controls card and persist
across a reload; the mode control disables after the first scored rep; tempo offers
0.5x and transpose reaches ±12; a finished session logs with its `mode` set.

**Depends on:** Task 7

**Wave:** 4

---

### Task 9: make the mode visible everywhere a singer reads a warmup

**Files:** `components/warmups/session-summary.tsx`, `components/warmups/library.tsx`,
`components/warmups/warmups-client.tsx`

**What:** Carry the mode into the three surfaces that currently describe the old loop
or would silently blend the two modes.

In `components/warmups/lib.ts`, add `mode: WarmupMode` to `SessionSummaryData`, and
have `finalize` populate it.

In `session-summary.tsx`:
- Render the mode beside the exercise title as a `Pill`, reading "Sing along" or
  "Call and response".
- Add one sentence to the existing "What that means" card, after the sentence about
  the ±50 window: for sing-along, "The guide was sounding while you sang, so this
  score measures how well you held to a note you could hear."; for call-and-response,
  "The guide had stopped before you sang, so this score measures how well you held to
  a note you were carrying yourself." These two are different skills and the summary
  is where a singer forms their idea of what the number means.

In `library.tsx`, `isRecentlyDone` matches `s.type === "warmup" && s.detail === ex.title`.
Leave that match alone — a rung is recent whichever mode sang it — and add the mode of
the most recent matching session to the card's existing recency treatment, so a card
that reads as recently done also says which way it was sung.

In `warmups-client.tsx`, the "How a warmup ladder works" list at lines 160-175 still
describes the deleted loop. Replace step 2, "A short melody plays, then it is your
turn to sing it back", with: "The pattern plays once so you have it, then a two-beat
count-in, then you sing it with the guide underneath you." Add a fifth item naming
the other mode: "Prefer to sing it back from memory? Switch to Call and response in
the exercise controls. It is scored separately, because it is a harder thing to do."

**Why:** A mode that is invisible in the summary and the history is a mode that
silently mixes two difficulties into one number, which is the exact outcome the
separate-scoring decision exists to prevent.

**Verify:**
```bash
npx tsc --noEmit && npx vitest run components/warmups && npm run lint
```
Expected: tsc exits 0; the warmups suite passes at its post-Task-8 count; lint reports
no errors. `grep -n "sing it back" components/warmups/warmups-client.tsx` returns only
the new Call-and-response sentence.

**Done:** The summary names the mode and explains what its score measures, the library
card shows the mode of the most recent take, and the mic-gate explainer describes the
loop the player actually runs.

**Depends on:** Task 8

**Wave:** 5

---

### Task 10: create scripts/audit-warmup-timing.mjs

**Files:** `scripts/audit-warmup-timing.mjs` `[NEW]`

**What:** A Playwright audit in the style of `scripts/audit-mic-gate.mjs` — same
header-comment convention, same `check(label, pass, detail)` helper, same non-zero
exit on failure — that drives a real browser and asserts what the unit suite cannot.

The rig replaces `navigator.mediaDevices.getUserMedia` in an init script with a
`MediaStreamAudioDestinationNode` fed by an oscillator the test controls, which is the
established synthetic-stream approach for this repo. Seed a known range
(`lowMidi: 48, highMidi: 72`) into `suede-sing:progress:v1` so the ladder is
deterministic, and seed `suede-sing:warmup:*` prefs per case.

Four checks:

1. **A silent mic scores nothing.** Oscillator gain at 0, `sustained-hold`,
   sing-along, guide at 100. After two rep periods, the page shows "No sound picked
   up" and `suede-sing:progress:v1` has gained no warmup session. This is the check
   that fails if the app ever scores its own guide through the analysis path.
2. **An aligned voice scores high.** `five-note-scale`, sing-along, guide at 0 so the
   only sound is the synthetic voice. Script the oscillator's frequency to follow the
   pattern from the root the ladder starts on, using the same
   `noteDur`/`gap` arithmetic `buildSegments` uses, started at the rep's scored-window
   time. Assert the first rep's score is at least 85.
3. **A misaligned voice scores materially lower.** Identical to check 2 with the
   synthetic melody shifted 250 ms late. Assert the score is at most 70, and at least
   15 points below the score from check 2. Without this differential, check 2 would
   pass just as happily against a scorer that ignored timing altogether.
4. **The guide is silent at level zero.** `five-note-scale`, sing-along, guide at 0.
   Count `AudioContext.prototype.createOscillator` calls during one scored window via
   a counter installed in the init script. Assert the count matches the count-in
   clicks alone and no pattern tones are scheduled.

The header comment must state plainly what this cannot cover: a headless browser has
no acoustic path from the speakers to the microphone, so it cannot prove that echo
cancellation stops a real room from scoring the guide. Document the manual check
beside it, as steps: set monitoring to Speakers in Audio setup, set the guide to 100,
start `sustained-hold`, stay silent through two full reps, and confirm both read "No
sound picked up".

Add the script to `package.json` scripts as
`"audit:warmup": "node scripts/audit-warmup-timing.mjs"`.

**Why:** Timing alignment is the one property of this plan that no unit test can
observe, because it only exists once a real audio clock, a real analyser and a real
animation loop are running together.

**Verify:**
```bash
npm run dev &
sleep 8 && npm run audit:warmup; kill %1
```
Expected: four lines beginning `  ok  `, and exit code 0.

**Done:** `npm run audit:warmup` passes all four checks against a local dev server,
and its header documents the manual speaker check it cannot automate.

**Depends on:** Task 8

**Wave:** 5

---

## Dependency DAG

```text
Task 1  (synth tone groups)        requires: none
Task 2  (latency helper)           requires: none
Task 3  (schema + tally doc)       requires: none
Task 4  (timeline)                 requires: Task 3
Task 5  (scoring)                  requires: none          [Wave 1]
Task 6  (songs latency)            requires: Task 2
Task 7  (player rewrite)           requires: Task 1, Task 2, Task 3, Task 4, Task 5
Task 8  (controls + prefs)         requires: Task 7
Task 9  (summary, library, copy)   requires: Task 8
Task 10 (browser audit)            requires: Task 8
```

Hidden dependencies surfaced, each one a thing the task list would otherwise treat as
parallel:

- **Task 4 needs Task 3**, not for behaviour but for the `WarmupMode` type. The
  timeline branches on mode, so the union has to exist before it compiles.
- **Task 7 needs Task 3** for the same reason plus one more: `finalize` cannot pass
  `mode` to `logSession` until `logSession` accepts it.
- **Task 7 needs Task 2**, for both `liveLags` and `PITCH_FFT_SIZE`. This is easy to
  miss, because the visible subject of Task 7 is the clock rather than the latency,
  and Task 6 is the task that reads as "the latency one".
- **Task 7 needs Task 5 before Task 4 matters.** A rewrite that moves the clock and
  the scoring arithmetic at the same time has no green state to fall back to; Task 5
  pins the arithmetic first.
- **`PITCH_FFT_SIZE` is created in Task 2, not Task 6.** Both Task 6 and Task 7
  consume it, and only Task 2 precedes both. Neither consumer may add it.
- **Task 5 must update the `TOLERANCE_CENTS` import in `session-summary.tsx`** in the
  same task that moves the constant, or the tree does not compile between tasks.
- **Task 7 must not import `components/warmups/prefs.ts`.** That module arrives in
  Task 8; Task 7 holds the mode in local state so it can land green on its own.
- **Task 8 must reach `logSession` through Task 3's field.** If Task 3's
  `repairSession` copy line is missing, Task 8 appears to work and the mode vanishes
  on the next read. Task 3's first test is the guard.

No cycles.

## Waves, file ownership, and the critical path

**Wave 1** — Tasks 1, 2, 3, 5. Every task with no dependencies.
File ownership: Task 1 owns `lib/audio/synth.ts`. Task 2 owns `lib/audio/latency.ts`,
its test, and `lib/audio/use-pitch.ts`. Task 3 owns `lib/progress-shape.ts`,
`lib/progress.ts`, `lib/analytics.ts` and `lib/progress.test.ts`. Task 5 owns
`components/warmups/scoring.ts`, its test, and the single `TOLERANCE_CENTS` import
line in `components/warmups/session-summary.tsx`. No overlap. Task 5 touches
`session-summary.tsx`, which Task 9 also writes, but they are four waves apart and
serialized.

**Wave 2** — Tasks 4, 6.
File ownership: Task 4 owns `components/warmups/timeline.ts` and its test. Task 6 owns
`components/songs/song-player.tsx` only; it reads `lib/audio/use-pitch.ts` but does
not write it, because Task 2 already did. No overlap.

**Wave 3** — Task 7 alone.
It is a single-task wave on purpose. Task 7 rewrites `components/warmups/exercise-player.tsx`,
and Tasks 8 and 9 both write that file or files that read its exports, so nothing can
run beside it without racing. It stays one task rather than three because Tasks 4 and 5
have already removed the timing and the scoring logic from it, leaving wiring. It also
writes `components/warmups/lib.ts`, to give `playGuide` its `out` and `gain`
parameters; Task 9 writes that file again five waves later for `SessionSummaryData`.

**Wave 4** — Task 8 alone.
Same file as Task 7, so it cannot merge into Wave 3 and nothing else can join it. Task 9
and Task 10 both depend on it.

**Wave 5** — Tasks 9, 10.
File ownership: Task 9 owns `components/warmups/session-summary.tsx`,
`components/warmups/library.tsx`, `components/warmups/warmups-client.tsx` and the
`SessionSummaryData` type in `components/warmups/lib.ts`. Task 10 owns
`scripts/audit-warmup-timing.mjs` and the `scripts` block of `package.json`. No overlap.

**Critical path:** Task 3 → Task 4 → Task 7 → Task 8 → Task 9. Five deep. Tasks 1, 2
and 5 all join at Task 7, and Task 10 hangs off Task 8 in parallel with Task 9. Task 6
is the only leaf that never joins the path, which is why it is the one task here that
could be dropped without stranding another.

**Chunk boundary:** Waves 1 and 2 (Tasks 1–6) are Chunk A and ship as one PR. Waves 3
through 5 (Tasks 7–10) are Chunk B and ship as a second.

Chunk A changes nothing a singer sees in the warmup room: Tasks 1, 2, 4 and 5 add
unused exports and move arithmetic behind an identical result, and Task 3 adds an
optional field nothing writes yet. It does change one visible behaviour, in a
different room: Task 6 makes song scoring latency-corrected, which will move real
song scores upward for singers who were being penalised at note onsets. That is the
intended fix rather than a side effect, and it is worth naming in the PR description
so a score that jumps is not read as a regression.

## Threat model

### The shared foundation (Tasks 1, 2, 3)

```text
Risk: The `repairSession` copy line for `mode` is omitted, so the field passes
      validation, is written, and is silently dropped on the next read, the sync
      merge, and every import.
Likelihood: High
Impact: High
Mitigation: Task 3's first test asserts a `mode` survives a full sanitizeProgress
      round trip. It fails loudly if the line is missing, and it is the first
      assertion in the task so it cannot be reached past.
```

```text
Risk: `createToneGroup` leaves its gain node connected forever, leaking one node
      per cancelled rep across a long session.
Likelihood: Medium
Impact: Low
Mitigation: cancel() schedules `node.disconnect()` at 5 s, which exceeds the longest
      tone this app schedules (an octave siren at 0.75x is 3.2 s). Specified in the
      Task 1 code.
```

```text
Risk: `outputLatency` and `baseLatency` are summed, double-counting on Chromium and
      pushing the scored window a full buffer out of alignment.
Likelihood: Medium
Impact: High
Mitigation: `outputLagSec` returns one or the other, never both, and Task 2's doc
      comment states why. Task 10 check 3 is the differential that catches an
      alignment error of this size end to end.
```

### Timing and scoring primitives (Tasks 4, 5, 6)

```text
Risk: The extracted scorer changes the arithmetic while moving it, so every stored
      warmup score before and after the change means something different.
Likelihood: Medium
Impact: High
Mitigation: Task 5 says copy the arithmetic without altering it, and pins seven
      behaviours including the exact ±50 boundary at 40 and 60 cents. Any drift in
      the tolerance or the glide half-share fails a named assertion.
```

```text
Risk: A rep's scored window overlaps the next rep's count-in, so a singer is scored
      against one root while hearing clicks for the next.
Likelihood: Medium
Impact: Medium
Mitigation: Task 4 asserts `clickTimes` all land before `singAt`, and asserts
      no-overlap across five chained reps. Task 7 adds the same chaining assertion
      against the loop's own scheduling.
```

```text
Risk: Task 6 moves the songs judgment cursor onto the corrected beat as well as the
      scoring index, delaying every judgment badge by the lag.
Likelihood: Medium
Impact: Medium
Mitigation: Task 6 names the cursor line explicitly and says to leave it on the
      uncorrected `beatInSong`, with the reason.
```

### The player and its surfaces (Tasks 7, 8, 9, 10)

```text
Risk: A stale tone group survives one of the five cancel paths (skip, transpose,
      tempo, exit, tab-hide) and bleeds a wrong-root guide into a scored window —
      the exact defect the plan exists to close, now scored instead of merely audible.
Likelihood: Medium
Impact: High
Mitigation: Task 7 names all five paths and requires cancel() before any reschedule.
      Task 10 check 4 counts oscillators scheduled during a scored window, so an
      uncancelled group shows up as a count that does not match the clicks.
```

```text
Risk: Sing-along and call-and-response averages end up in one number anyway, because
      the mode is recorded but nothing reads it.
Likelihood: Medium
Impact: High
Mitigation: Task 9 renders the mode in the summary and states what each score
      measures. The mode control locks at the first scored rep (Task 8), so one
      session cannot contain both.
```

```text
Risk: On speakers with the guide up, echo cancellation fails to hold and the detector
      locks the guide tone, reporting a flawless hold for a silent singer.
Likelihood: Medium
Impact: High
Mitigation: Task 10 check 1 catches the analysis-path half of this automatically, and
      its header documents the manual speaker check that covers the acoustic half,
      as reproducible steps. The decision not to gate on headphones is deliberate, so
      the check is the control rather than a gate.
```

## Done state

A singer opens `/warmups`, picks an exercise, and hears the pattern once. Two clicks
count them in. They sing the pattern with the guide underneath at whatever level they
set, and the next rung follows without the ladder stopping to grade them. The score
they finish with was measured against the beat they actually sang, not one 70 to 300
milliseconds ahead of it. Switching to Call and response gives them the pattern, a
breath, and silence to sing into, and that session is stored and labelled as its own
thing. Their microphone and monitoring choices are honoured throughout, with no gate.

Mechanically: `npx tsc --noEmit` exits 0, `npm test` passes, `npm run lint` reports no
errors, and `npm run audit:warmup` passes four checks against a dev server.

---

## Handoff

Chunk A (Tasks 1–6) is ready to execute. Waves 1 and 2 each hold three tasks with no
file overlap, so they parallelize cleanly; Chunk B is strictly serial from Task 7
onward and is one worker's job.
