# Handoff: the pitch detector on an FFT autocorrelation (2026-10-23)

Follows `2026-09-25-sing-3.1-state.md`, which stays the entry point. This file
records one slice of pitch-engine work on the branch `pitch/amdf-coarse-search`.

The request was to use the average magnitude difference function (AMDF) to
improve Suede Sing's pitch detection end to end. Measured, the AMDF improved no
reading. It could find the period cheaply, but that version misread some high
notes, so it was replaced. What ships computes the same NSDF from one FFT
autocorrelation. On all 162,515 frames tested it reads exactly what the old full scan
read. On 4096-sample frames at 44.1 and 48 kHz it costs 16 to 20 times less CPU
in Node.

## Shipped

| Slice | Branch/commit | What |
|---|---|---|
| FFT autocorrelation | `pitch/amdf-coarse-search`, 0c5dad3 | `detectPitch` takes every lag's NSDF numerator from one FFT autocorrelation. A per-lag guard sums a lag directly when its FFT value could round to a different Float32. Adds 27 regression frames. |
| Exact-zero runs | 46b3316 | Lags whose correlation is provably exactly zero are stored as +0 without the FFT. A lag that still needs a direct sum visits only the stretches where nonzero runs overlap. The error-bound comment carries the audited figures. |
| Superseded | 490ead5, 5cc918e, c2a2e02 | The AMDF coarse search with NSDF refinement, and two comment fixes to it. 0c5dad3 replaced it. The commits stay on the branch as history. |

The branch is pushed and open as `JasonColapietro/sing#240`. Against `main`
(ee6569c) it touches seven files:

| File | Change |
|---|---|
| `lib/audio/pitch.ts` | An FFT plan cache, a radix-2 FFT, `autocorrelate`, `fftErrorUnits`, the rounding guard and the zero runs. Past the numerator, the code is the full scan's, from the energy normalization through the range check. Exports `nsdfDirectSums()` for the tests. |
| `lib/audio/pitch-fft.test.ts` | Replaces `pitch-coarse.test.ts`. Keeps the full scan verbatim and asserts bitwise equality on 867 sweep frames, 1,600 seeded random frames, and the frame types the FFT path handles specially. |
| `lib/audio/pitch-regressions.test.ts`, `lib/audio/pitch-regressions.json` | New. The 27 frames the coarse search misread, stored as raw Float32 samples next to the full scan's reading. 21 have clarity of 0.75 or more on at least one side. |
| `lib/audio/breath-detect.ts` | Comment only. Halving the frame's rate now saves a little over half the cost, about 0.12 ms against 0.29 ms. |
| `app/changelog/page.tsx` | One October 2026 entry for the change. |
| `docs/handoffs/2026-10-23-pitch-fft-autocorrelation.md` | New. This handoff. |

## Decisions

**The AMDF does not improve readings.** Weighting the NSDF by an AMDF term, or
replacing the NSDF with the AMDF, never beat the current detector once misses
and octave errors are counted together: where it cut misses, it added at least
as many octave-down reads. Its cents gains came with octave errors, or only under
key clicks and reverb (below). That held on 21 synthetic sweeps (most C2 to C6,
four on the bass range only; both browser rates, three seeds) and on a second
bench of harder conditions. Apart from the full product form's small shifts under
noise and clicks, every peak the weighting changed was an octave error.

| Variant | Against the current detector |
|---|---|
| Product weighting n(1-a), parabola on the NSDF | Lazy form: identical readings on every sweep. Full form: one more miss at 0 dB SNR, a worst click reading of 40 c against 10 c, small p95 shifts under noise |
| Ratio weighting n/(a+k) | Octave-down reads on clean frames: 63 of 294 at k = 0.1, 9 at k = 0.3 |
| Product weighting, parabola on the weighted function | Clean p50 from 0.08 to 0.44 c; vibrato p50 from 0.88 to 3.15 c |
| AMDF alone | Clean p50 0.52 to 0.88 c, against 0.08 c; every frame missed at 0 dB SNR |
| Weighting under harder conditions | 222 more subharmonic reads at a 0.8 cycle alternation; 75 more octave-down reads on a mid-frame note change, 48 under a major-third guide at -10 dB, 35 on breathy noise at 2048 samples |

The weighting's only gains were a lower p95 under key clicks and on reverb
carrying the previous note (8.59 to 6.02 c). It cost 3 to 6 times the p95 on
clean frames, and the live median of four already drops an isolated click frame.

**The AMDF coarse search was dropped too.** It used the AMDF to pick candidate
periods and computed the NSDF only around them. On 6,486 synthetic sweep frames
it matched the full scan exactly, at about a twelfth of the CPU. A random search
over frames in the app's own shapes then found disagreements. Those shapes are
44.1 and 48 kHz at 2048 and 4096 samples, plus the breath path's 2048 samples at
22.05 and 24 kHz.

| Corpus | Frames | Read differently | Clarity 0.75 or more on either side |
|---|---|---|---|
| Random frames, the app's shapes | 20,000 | 123 | 21 |
| Recorded and synthetic clips (the repo's piano samples, LibreOffice sound effects, synthetic phrases), every frame as run | 37,877 | 34 | 21 |

The 21 random frames that mattered were all high notes, 723 to 1505 Hz.

| What the coarse search read | Frames |
|---|---|
| A minor third to an octave low | 16 |
| Null | 4 |
| 79 Hz | 1 |

In 122 of the 123, the coarse stage never computed the lag the full scan chose.
On those clips, the 15 material misses logged in detail were LibreOffice sound
effects (falling and explosion sounds) that the full scan read at 923 to 1292 Hz,
returned as null.

Repairs to the coarse stage were scored on the same 20,000 frames. Speed-ups are
against the full scan in the same run, because absolute times moved with machine
load. The voiced column covers A3, E2 at 10 dB SNR, C6 and A5.

| Repair | Best variant | Read differently | Material | Voiced, 4096 samples | Noise, 48 kHz | Breath path, 24 kHz |
|---|---|---|---|---|---|---|
| None (as built) | | 123 | 21 | 10.1 to 13.5x | 1.2x | 4.5x |
| Full NSDF scan of the short lags | 800 to 1600 Hz, dip tolerance 0.3 | 38 | 1 | 7.7 to 15.5x | 1.7x | 3.1x |
| Dip tolerance | Shoulder rule, tolerance 0 | 0 | 0 | 0.8 to 8.3x | 0.7x | 1.7x |
| Decimation | No decimation, dip tolerance 0 | 43 | 2 | 1.0 to 1.6x | 0.7x | 1.4x |
| Sub-multiples of the winner | Every qualifying peak, lag fractions p/q with p up to 5 | 29 | 0 | 1.0 to 8.6x | 1.1x | 2.1x |
| AMDF and NSDF candidates combined | | 15 | 1 | 5.1 to 12.6x | 1.4x | 1.9x |
| FFT, no guard | | 4 | 0 | 13.7 to 19.5x | 20.3x | 13.2x |
| FFT with guard | As shipped in 46b3316 | 0 | 0 | 14.2 to 18.5x | 14.7x | 10.4x |

The one exact repair ran slower than the full scan on noise and on E2 at 10 dB.
Each coarse-stage repair rests on measured constants, so none could be argued
exact.

**An FFT with a guard, not a near-exact FFT.** A plain FFT read 4 of the 20,000
frames differently, none material. Suede Voice compares its readings with
`detectPitch` frame for frame, so a near match would show up there as drift. The
guard widens each lag's FFT value by the worst-case error of both computations.
If that interval rounds to one Float32, the direct sum would have stored the same
value. Otherwise the lag is summed directly with the full scan's own arithmetic.

| Random frames | Lags summed directly, 0c5dad3 | 46b3316 |
|---|---|---|
| 40,000 in the app's shapes | 0.318% | 0.090% |
| 30,000 at 8 to 96 kHz, 256 to 8192 samples | 0.877% | 0.251% |

A separate audit checked the bound. Here u is 2^-53 and L is log2(N/2) for a
transform of length N.

| Audit item | Figure |
|---|---|
| Rigorous FFT error total | About (66L + 75)u times the window's energy |
| Allowance in the code | About (128.6L + 275)u times the energy, roughly a 2x margin |
| Per-stage error the allowance survives | Up to about 24u |
| Largest error on adversarial frames | 0.6% of the bound |
| Matched exactly in the audit | 6,390 frames, 3.9 million lags |
| Assumption | `Math.sin` and `Math.cos` accurate to about 1 ulp. V8 and SpiderMonkey use fdlibm, which meets it; ECMAScript does not require it. |

**Exact-zero runs.** Digital silence around a click, a gap or an onset makes many
lags correlate to exactly zero. The FFT's round-off straddles zero there, so the
guard could not settle those lags and fell back to direct sums. Lags where no two
nonzero runs can meet are now stored as +0 straight away.

| Frames with stretches of exact zeros | Before | After |
|---|---|---|
| Lags summed directly, mixed frames | Up to 77% | 0.6% |
| Worst frame found | 4.2 ms | 1.5 ms |

**No contract change.** Nothing under `contracts/` changed. `pitch.engine` keeps
`method: "nsdf"` and every value, so the version stays 9. The FFT changes how the
numerator is computed, not what is scored.

**Helpers stay in `pitch.ts`.** The FFT plan, transform, autocorrelation and
error bound could have had their own module. `contracts/suede-vocal.ts` names
`lib/audio/pitch.ts` as the module to port, so the whole detector stays in that
one file.

## Verification

**Parity with the full scan.** A frame counts as exact only when frequency and
clarity are bitwise equal, or both readings are null.

| Corpus | Frames | Read differently |
|---|---|---|
| Synthetic voice corpus, the app's shapes | 15,000 | 0 |
| Soprano corpus (near-pure high notes) | 3,000 | 0 |
| The repo's piano samples, LibreOffice sound effects and synthetic phrases, frames | 24,064 | 0 |
| Random frames that caught the coarse search, the app's shapes | 20,000 | 0 |
| More random frames, the app's shapes | 40,000 | 0 |
| Random frames, 8 to 96 kHz, 256 to 8192 samples | 30,000 | 0 |
| Regression fixtures (inside the 20,000 above) | 37 | 0 |
| Real singing, openly licensed (CC BY): three Vocadito solo singers (one at two levels), a Dagstuhl ChoirSet quartet, a song's mix and separated vocal | 30,451 | 0 |

All runs used the final commit, 46b3316: 162,515 frames, none read differently.
The LibreOffice sound effects and the real singing were used for testing only and
are not in the repo. On the real singing the superseded coarse search read 6
frames differently with clarity 0.75 or more (two are one Vocadito frame at two
levels), including a 767 Hz note read at 253 Hz. The guard summed about 0.1% of
lags directly in the app's shapes.

**Cost per frame.** Node, the three detectors interleaved, fastest of 25 rounds.

| Frame | Full scan | Two-stage (superseded) |
|---|---|---|
| A3, 4096 at 48 kHz | 5.83 ms | 0.414 ms |
| E2 at 10 dB SNR, 4096 at 48 kHz | 5.74 ms | 0.487 ms |
| C6, 4096 at 44.1 kHz | 4.96 ms | 0.357 ms |
| A5, 4096 at 48 kHz | 5.46 ms | 0.366 ms |
| Noise, 4096 at 48 kHz | 5.71 ms | 4.61 ms |
| Breath path A3, 2048 at 24 kHz | 1.38 ms | 0.294 ms |
| Noise, 4096 at 8 kHz | 0.98 ms | 2.14 ms |
| Noise, 4096 at 16 kHz | 1.93 ms | 4.09 ms |
| A3, 4096 at 8 kHz | 1.04 ms | 0.80 ms |
| A3, 4096 at 16 kHz | 2.07 ms | 1.53 ms |

The shipped FFT path took 0.29 to 0.36 ms on the 4096-sample frames at 44.1 and
48 kHz, depending on machine load: 16 to 20 times less than the full scan. Its
cost follows the frame length, not the signal, so room noise costs what a vowel
does. A short click over a faint but nonzero floor can fall back to about the old
cost, because the guard's direct sums dominate there. The two-stage search was
slower than the full scan on noise at 8 and 16 kHz. Nothing was timed on a phone.

**Repo checks on 46b3316:** lint, types, unit tests, build and the browser suites.

| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run lint` | Clean |
| `npm test` | 3,166 passed, 5 skipped, across 225 files (224 passed, 1 skipped) |
| `npm run build` | OK, with the empty keys CI builds with |
| `e2e/pitch-precision.mjs` | 14 of 14 within their ceilings |
| `e2e/breath-gate.mjs` | 4 of 4 |
| `e2e/vibrato-drill.mjs` | 2 of 2 |
| `e2e/song-loop-scoring.mjs` | Pass (loops scored 100, 98, 100, 100%) |
| `scripts/audit-warmup-timing.mjs` | All checks pass |
| `e2e/ear-mic-interruption.mjs` | Pass, all three games |

Browser suites ran against a production build in headless Chromium on Linux. One pitch-precision case, E2, logged a max of 13.27 c over 175 readings; its bias (0.36 c) and p95 (0.07 c) stayed within the ceilings.

**Frame rate in the studio.** Headless Chromium on Linux under CPU
throttling, the old full scan (`main`, ee6569c) against 46b3316, median of three
6 s runs per cell. Throttling stands in for a slower phone; nothing was measured
on a phone.

| Case | Throttle | fps, old to new | Frames over 33 ms, old to new | Long-task time in 6 s, old to new |
|---|---|---|---|---|
| A3 | 4x | 26.7 to 53.5 | 43% to 2% | 53 to 0 ms |
| E2 at 10 dB SNR | 4x | 23.8 to 50.0 | 77% to 3% | 107 to 0 ms |
| A5 | 4x | 30.5 to 52.3 | 19% to 2% | 0 to 0 ms |
| Room noise only | 4x | 30.3 to 52.7 | 18% to 2% | 69 to 0 ms |
| A3 | 8x | 8.3 to 25.5 | 100% to 25% | 3065 to 403 ms |
| E2 at 10 dB SNR | 8x | 7.5 to 19.2 | 100% to 47% | 2999 to 122 ms |
| A5 | 8x | 9.7 to 32.0 | 100% to 10% | 2884 to 289 ms |
| Room noise only | 8x | 9.7 to 30.0 | 100% to 15% | 2679 to 188 ms |

Unthrottled, both builds ran at 59.8 to 60 fps in every case. Bias stayed within 0.04 c and the room
noise read 0% voiced on both builds in every cell. At 8x the new build still
hitches (p95 frame interval 155 to 191 ms), most on low notes.

## Open, in priority order

1. **Merge PR `JasonColapietro/sing#240` once CI is green.** Every check above
   passed in the cloud container. CI's audio suite runs on the PR. The owner's
   call.
2. **Run Suede Voice's Swift suite.** The iOS port (Suede-AI/suede-voice) reads
   the same contract values, and `NSDFPitchDetectorTests` compares its readings
   with `detectPitch` frame for frame. Readings are unchanged on every frame
   tested here, so it should pass. It was not run. Porting the FFT to Swift for
   its CPU saving is optional and the owner's call.
Items 3 to 6 are weaknesses of the detector itself, measured on synthetic sweeps
and unrelated to the AMDF. Fixing any of them changes readings. That makes each
a contract and iOS-port decision, and the owner's call.

3. **A guide tone under the voice.** Sing-along mode plays a guide, which can
   leak into the microphone through a speaker. A `PEAK_TOLERANCE` of 0.8 removed every
   octave error at -10 dB in the bench. It was not checked against the repo's
   precision ceilings.
4. **The hum check rejects creaky low notes.** When alternate glottal cycles
   differ in level, the NSDF at twice the period beats the one at the period by
   more than the 0.02 margin.
5. **No high-pass.** A 30 Hz rumble at the voice's level loses the bottom of the
   range.
6. **Breathy noise.** At 5 dB SNR, a quarter of frames are missed.

Each sweep is 294 frames: C2 to C6 a semitone at a time, both browser rates,
three seeds.

| Item | Condition | Effect | Frames |
|---|---|---|---|
| 3 | Guide a fifth or an octave below, -10 dB | C3 to C6 read an octave down; E2 to B2 rejected by the hum check | 222 octave down, 48 missed |
| 3 | Guide a major third below, -10 dB | Octave errors from C4 up | 102 octave down, 96 missed |
| 3 | Guide a fifth below, -6 dB | C3 to C6 read an octave down; C2 to B2 missed | 222 octave down, 72 missed |
| 4 | Alternate cycles at 0.8 and 1.0 (about 2 dB) | E2 to B3 return null | 96 missed |
| 5 | 30 Hz rumble at 0 dB | C2 to F3 missed; p95 error 8.3 c | 105 missed |
| 5 | 30 Hz rumble at -10 dB | Close to normal | 6 missed |
| 6 | Breathy noise (white, low-passed at 1.5 kHz), 5 dB | Misses across the range | 75 missed; 99 at 2048 samples |
| 6 | Breathy noise, 0 dB | Every frame unvoiced | 294 missed |

## Environment notes

- The work ran in a cloud container. Its network policy blocks the live site, so
  nothing here was checked against production.
- The development bench, the random-frame generator and the audit scripts are
  not in the repo. `pitch-fft.test.ts` and `pitch-regressions.test.ts` are the
  checked-in subset. That is why the regression frames are stored as raw
  samples.
- All timings are Node on a Linux server. In the cloud container, run the
  browser suites with `--executable=/opt/pw-browsers/chromium`.
