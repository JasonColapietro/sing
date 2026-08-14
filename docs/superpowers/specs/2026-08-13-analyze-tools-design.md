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
| Access | Free and open, no gate |
| Nav | 13th main nav link |
| Tests | Add vitest, covering the pure DSP modules only |

A 13th nav link lengthens an already long nav; accepted.

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

components/analyze/analyze-client.tsx   route shell, mic gate, owns the hook
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

Formant tracking and vowel labelling are out of scope for v1 — LPC extraction is
its own build, and the spectrogram already shows the structure visually.

### Tone

Instantaneous spectrum. Because `detectPitch` supplies a confident F0, true
harmonic positions (F0, 2F0, 3F0 …) are marked rather than estimated. A **ring
meter** shows energy in 2.8–3.2 kHz as a proportion of total energy — the
calibration-free version of "does this voice carry."

### Vocal load

Built on the published vocal-dose measures (Titze & Hunter):

- **Phonation time** — seconds of confidently voiced frames
- **Cycle dose** — Σ F0 · Δt, total vocal-fold vibration cycles

Both derive from pitch and time, which this app already measures accurately. The
readout shows today's figures and a 7-day strip.

## Access

`/analyze` is public, indexable, and free. It carries a `ToolGuide` like every
other route. An explicit "enable microphone" button starts the session, matching
every other mic surface in the app; all three instruments then run off the one
stream.

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
| No `AudioContext` support | Explanatory line in place of the canvas; no crash |
| Silence or unvoiced input | Spectrogram scrolls empty, Tone shows no harmonic markers, dose does not accumulate |
| Tab hidden | rAF pauses naturally; dose accumulation stops with it, so a backgrounded tab does not inflate the dose |
| `localStorage` unavailable | Dose held in memory for the session, matching how `lib/pro.ts` degrades |

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
