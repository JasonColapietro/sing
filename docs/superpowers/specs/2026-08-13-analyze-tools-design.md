# /analyze — voice analysis instruments

**Date:** 2026-08-13
**Status:** approved design, not yet implemented

## Origin

The request was a screenshot of a professional acoustics-measurement app's tool
list — Oscilloscope, FFT Analyzer, Spectrogram, XY Scope, Signal Generator,
MultiTool, Octave Analyzer, Level Meter, Noise Dosimeter, Max Levels, Data
Recorder, File Player — with "add these features to app."

`sing` is a vocal-training app, not an acoustics-measurement app. Building the
twelve verbatim would make it a different product, and several of them measure
rooms and PA systems rather than voices. The set was triaged against a single
question: does this help a singer?

| Screenshot tool | Disposition |
|---|---|
| Spectrogram | **Build** — harmonics, register breaks, vibrato |
| FFT Analyzer | **Build** as "Tone" — harmonic content and ring band |
| Noise Dosimeter | **Build** as "Vocal load" — phonation time and cycle dose |
| Octave Analyzer | Deferred — 1/3-octave bands are room measurement |
| File Player | Deferred — overlaps `/recorder`; revisit after v1 |
| Oscilloscope | Deferred — thin on its own |
| MultiTool | Rejected — that is what `/studio` already is |
| Signal Generator | Rejected — the Drone on `/tools` already covers it |
| Level Meter | Rejected — exists at `components/studio/level-meter.tsx` |
| Max Levels | Rejected — folds into the level meter |
| Data Recorder | Rejected — exists as `/progress` |
| XY Scope | Rejected — stereo phase correlation is meaningless for a mono vocal mic |

Scope for this spec is the three marked **Build**.

## Decisions taken

| Decision | Choice |
|---|---|
| Framing | Singer-first translation, not a measurement suite |
| Build set | Spectrogram, Tone, Vocal load |
| Placement | New `/analyze` route |
| Pro gating | Entirely Pro, with a static locked preview for free users |
| Nav | 13th main nav link |
| Tests | Add vitest, covering the pure DSP modules only |

Two of these were flagged as carrying a cost and confirmed anyway:

- **Entirely Pro** means a visitor never watches their own voice before paying.
  Mitigated by keeping the route public and indexable with a full `ToolGuide`,
  and by rendering a static painted preview inside `LockedPanel` rather than an
  empty page.
- **A 13th nav link** lengthens an already long nav.

## Architecture

One microphone stream feeds one `AnalyserNode`, whose output is published
through a ref that three presentational canvases read inside their own
animation frames. This is the shape `lib/audio/use-pitch.ts` already
established; the new hook is its frequency-domain sibling.

Rejected alternatives: extending `usePitch` itself (five other surfaces consume
it and would pay for FFT work they never read), and moving analysis to an
AudioWorklet with OffscreenCanvas (correct at scale, unnecessary for three
canvases at 60 fps).

### New files

```
lib/audio/use-analyser.ts     mic → AnalyserNode(fftSize 4096) → ref
lib/audio/spectrum.ts         pure: bin↔Hz, log mapping, band energy, magnitude→color
lib/audio/vocal-dose.ts       pure: dose accumulation, day rollover, persistence

components/analyze/analyze-client.tsx   route shell, mic gate, Pro gate, owns the hook
components/analyze/spectrogram.tsx      scrolling time×frequency canvas
components/analyze/tone.tsx             live spectrum, harmonic markers, ring meter
components/analyze/vocal-load.tsx       dose readout and 7-day strip

app/analyze/page.tsx          metadata + shell, mirrors app/tools/page.tsx
```

### Modified files

```
components/nav.tsx            add { href: "/analyze", label: "Analyze" }
app/sitemap.ts                add "/analyze"
lib/progress.ts               ActivityType gains "analyze"
components/progress/format.ts TYPE_META gains the matching entry (compiler-forced)
lib/guides.ts                 add ANALYZE_GUIDE
package.json                  vitest devDependency + "test" script
.github/workflows/ci.yml      add a test step
```

`TYPE_META` is typed `Record<ActivityType, …>`, so widening the union produces a
compile error until the map is updated. That is the intended mechanism, not an
obstacle.

### `use-analyser.ts` contract

Mirrors `usePitch`: renders a valid idle state before `start()` is called,
`start()` returns a promise resolving to whether the mic opened, and microphone
failures map to the same actionable messages. Reuse `micErrorMessage` from
`use-pitch.ts` by extracting it to a shared module rather than duplicating it.

Published per frame, via ref:

- `freqBins: Uint8Array` — 2048 bins from `getByteFrequencyData`
- `timeBuf: Float32Array` — 4096 samples
- `rms: number` — 0..~0.5, relative
- `f0: number | null` — confident fundamental, reusing `detectPitch`
- `t: number` — `performance.now()`

React state carries only `listening` and `error`. Every numeric readout that
changes per frame — the ring meter percentage, the dose counters — is written
into the DOM by the same animation loop that draws the canvases, not through
`setState`. The canvases never trigger a React render.

## The three instruments

### Spectrogram

A scrolling time×frequency canvas, log frequency axis, roughly 80 Hz to 8 kHz.
Harmonics appear as a stack of horizontal lines; a register break appears as the
stack jumping; vibrato appears as ripple. The singer's-formant band
(2.8–3.2 kHz) is drawn as a marked region.

Not built: F1/F2 formant tracking or vowel labels. LPC formant extraction from a
browser FFT is noisy enough that a vowel label would be a guess presented as a
measurement.

### Tone

Instantaneous spectrum. Because `detectPitch` supplies a confident F0, true
harmonic positions (F0, 2F0, 3F0 …) are marked rather than estimated. A **ring
meter** shows energy in 2.8–3.2 kHz as a proportion of total energy — the
calibration-free version of "does this voice carry."

### Vocal load

Browser microphones are not SPL-calibrated, so a dBA dosimeter is impossible
without inventing units. The published vocal-dose measures (Titze & Hunter)
include measures that need no calibration:

- **Phonation time** — seconds of confidently voiced frames
- **Cycle dose** — Σ F0 · Δt, total vocal-fold vibration cycles

Both derive from pitch and time, which this app already measures accurately. The
readout shows today's figures and a 7-day strip.

Presented as a practice-volume signal. Never as medical or vocal-health advice.

## Honesty constraints

These are requirements, testable at review:

1. No dB SPL, dBA, or OSHA/NIOSH dose percentage anywhere in the UI. Levels are
   labeled relative.
2. No vowel labels or F1/F2 numbers on the spectrogram.
3. The ring meter is labeled as relative band energy — not "projection," not
   "how far your voice carries."
4. Vocal load carries no health claim.

## Pro gating

`/analyze` is public and indexable. The `ToolGuide` is the content that ranks;
the instruments are what is gated.

- **Free user**: page shell plus three `LockedPanel`s (`components/pro/ui.tsx`),
  each painted with a static representative frame, plus the unlock CTA. The
  preview is drawn by the same canvas component from a deterministic synthetic
  buffer (a sustained tone with harmonics) — one frame, no animation loop, no
  image asset, so the locked and live views can never drift apart. The
  microphone is never requested for a free user — asking for a permission that
  will not be used is how an app loses that permission for good.
- **Pro user**: an explicit "enable microphone" button, matching every other mic
  surface, then all three instruments run off the one stream.

The gate is client-side, consistent with every other gate in the app: Pro state
is a localStorage cache of Stripe (`lib/pro.ts`). It is defeatable with
devtools. This is accepted — there are no accounts and no database, and these
instruments are pure browser computation, so a bypass costs nothing but the
visitor's own CPU.

## Progress integration

- Per-day phonation seconds and cycle dose persist under `suede-sing:dose:v1`.
- Session logging copies the shape proven in `components/tools/tools-page.tsx`:
  a session logged per 5 minutes of active use, plus one flush on `pagehide`
  above a 15-second floor. No new XP mechanic.
- Sessions log as `type: "analyze"`.

## Error handling and edge cases

| Case | Behavior |
|---|---|
| Mic denied, missing, busy, or insecure origin | Existing `micErrorMessage` text, shown in place |
| No `AudioContext` support | Static preview with an explanatory line; no crash |
| Silence or unvoiced input | Spectrogram scrolls empty, Tone shows no harmonic markers, dose does not accumulate |
| Tab hidden | rAF pauses naturally; dose accumulation stops with it, so a backgrounded tab does not inflate the dose |
| `localStorage` unavailable | Dose held in memory for the session, matching how `lib/pro.ts` degrades |
| Pro lapses mid-session | Hook stops, mic released, panels revert to locked |

## Testing

The repo has no test harness today — CI is typecheck, lint, build
(`.github/workflows/ci.yml`), and `playwright` sits in devDependencies unused.

This adds `vitest`, an `npm test` script, and one CI step, covering only the pure
modules:

- `spectrum.ts` — bin↔Hz round-trip, log mapping at both axis boundaries,
  band-energy sums against a synthetic spectrum with known content
- `vocal-dose.ts` — accumulation, local-day rollover, cycle dose for a known F0
  held a known duration, persistence round-trip

Canvas rendering and the microphone hook get no unit tests; against mocks they
would only test the mocks. They are verified by running the app.

## Out of scope

Octave Analyzer, File Player, Oscilloscope, and any form of file or reference
track analysis. Revisit once `/analyze` has real usage.
