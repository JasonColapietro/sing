/**
 * Deterministic audio fixtures and scoring for the pitch-precision harness.
 *
 * Pure on purpose: no fs, no Date, no Math.random. The runner (run.mjs) writes
 * the WAVs to disk and drives the browser; everything that decides what a
 * fixture sounds like, or whether a surface read it correctly, lives here so
 * fixtures.test.mjs can pin it without a browser.
 *
 * Randomness comes from the same LCG lib/audio/pitch.test.ts uses
 * (s * 1664525 + 1013904223 mod 2^32), so a fixture renders byte-identical
 * every time and a flaky result is the app's, never the fixture's.
 */

export const SAMPLE_RATE = 48000;
export const FIXTURE_DURATION_SEC = 12;

/** Held at each end of the glide so its endpoints are exact, not smeared. */
const GLIDE_HOLD_SEC = 1;
const SINE_AMPLITUDE = 0.5;
const HARMONIC_PEAK = 0.8;
const HARMONIC_COUNT = 8;
const VIBRATO_RATE_HZ = 5.5;
const VIBRATO_DEPTH_CENTS = 50;
const NOISE_PEAK = 0.5;
const SNR_DB = 10;

/** Seeded LCG returning floats in [0, 1). */
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const constant = (hz) => () => hz;

function glideHz(tSec, durationSec) {
  const span = durationSec - 2 * GLIDE_HOLD_SEC;
  if (tSec <= GLIDE_HOLD_SEC) return 110;
  if (tSec >= durationSec - GLIDE_HOLD_SEC) return 220;
  return 110 * Math.pow(2, (tSec - GLIDE_HOLD_SEC) / span);
}

function vibratoHz(tSec) {
  return 220 * Math.pow(2, (VIBRATO_DEPTH_CENTS / 1200) * Math.sin(2 * Math.PI * VIBRATO_RATE_HZ * tSec));
}

const SINE_HZ = [110, 130.81, 164.81, 220, 261.63, 440, 523.25, 659.26, 880];

function fixture(id, kind, hz, expectedHz, extra = {}) {
  return Object.freeze({ id, kind, hz, durationSec: FIXTURE_DURATION_SEC, expectedHz, ...extra });
}

/**
 * Every fixture the harness plays. `expectedHz(tSec)` is the true pitch at
 * fixture time tSec; null means the fixture has no pitch and a surface should
 * report none.
 */
export const FIXTURES = Object.freeze([
  ...SINE_HZ.map((hz) => fixture(`sine-${hz}`, "steady", hz, constant(hz))),
  ...[110, 220, 440].map((hz) => fixture(`harmonic-${hz}`, "harmonic", hz, constant(hz))),
  fixture("glide-110-220", "glide", null, (t) => glideHz(t, FIXTURE_DURATION_SEC)),
  fixture("vibrato-220", "vibrato", 220, vibratoHz),
  fixture("silence", "null", null, null),
  fixture("pink-noise", "null", null, null),
  fixture("snr10-220", "steady", 220, constant(220), { snrDb: SNR_DB }),
]);

export function getFixture(id) {
  const hit = FIXTURES.find((f) => f.id === id);
  if (!hit) throw new Error(`unknown fixture: ${id}`);
  return hit;
}

/* ------------------------------------------------------------- rendering */

function renderSine(hz, frames, sampleRate, amplitude) {
  const out = new Float64Array(frames);
  const w = (2 * Math.PI * hz) / sampleRate;
  for (let n = 0; n < frames; n++) out[n] = amplitude * Math.sin(w * n);
  return out;
}

/** Phase-continuous render of a time-varying frequency. */
function renderSweep(hzAt, frames, sampleRate, amplitude) {
  const out = new Float64Array(frames);
  let phase = 0;
  for (let n = 0; n < frames; n++) {
    out[n] = amplitude * Math.sin(phase);
    phase += (2 * Math.PI * hzAt(n / sampleRate)) / sampleRate;
    if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
  }
  return out;
}

function harmonicAmplitudes(hz, frames, sampleRate) {
  const raw = Array.from({ length: HARMONIC_COUNT }, (_, i) => 1 / (i + 1));
  const out = new Float64Array(frames);
  const w = (2 * Math.PI * hz) / sampleRate;
  let peak = 0;
  for (let n = 0; n < frames; n++) {
    let v = 0;
    for (let k = 1; k <= HARMONIC_COUNT; k++) v += raw[k - 1] * Math.sin(k * w * n);
    out[n] = v;
    if (Math.abs(v) > peak) peak = Math.abs(v);
  }
  const scale = peak > 0 ? HARMONIC_PEAK / peak : 0;
  for (let n = 0; n < frames; n++) out[n] *= scale;
  return { samples: out, amplitudes: raw.map((a) => a * scale) };
}

/** Voss-McCartney pink noise: 16 rows updated at octave-spaced rates plus a white term. */
function renderPink(frames, seed) {
  const rand = lcg(seed);
  const rows = 16;
  const values = Array.from({ length: rows }, () => rand() * 2 - 1);
  let running = values.reduce((a, b) => a + b, 0);
  const out = new Float64Array(frames);
  let peak = 0;
  for (let n = 0; n < frames; n++) {
    if (n > 0) {
      let row = 0;
      let m = n;
      while ((m & 1) === 0 && row < rows - 1) {
        m >>= 1;
        row++;
      }
      const next = rand() * 2 - 1;
      running += next - values[row];
      values[row] = next;
    }
    const v = (running + (rand() * 2 - 1)) / (rows + 1);
    out[n] = v;
    if (Math.abs(v) > peak) peak = Math.abs(v);
  }
  const scale = peak > 0 ? NOISE_PEAK / peak : 0;
  for (let n = 0; n < frames; n++) out[n] *= scale;
  return out;
}

/** Uniform white noise scaled to an exact RMS. */
function renderWhite(frames, seed, targetRms) {
  const rand = lcg(seed);
  const out = new Float64Array(frames);
  let sum = 0;
  for (let n = 0; n < frames; n++) {
    out[n] = rand() * 2 - 1;
    sum += out[n] * out[n];
  }
  const rms = Math.sqrt(sum / frames);
  const scale = rms > 0 ? targetRms / rms : 0;
  for (let n = 0; n < frames; n++) out[n] *= scale;
  return out;
}

function frameCount(opts) {
  const sampleRate = opts?.sampleRate ?? SAMPLE_RATE;
  const durationSec = opts?.durationSec ?? FIXTURE_DURATION_SEC;
  return { sampleRate, durationSec, frames: Math.round(durationSec * sampleRate) };
}

/**
 * Render one fixture as mono float samples in [-1, 1].
 * Returns { samples, meta } where meta carries what a test needs to check the
 * render against theory (amplitudes for sines and harmonics).
 */
export function renderSamples(id, opts = {}) {
  const f = getFixture(id);
  const { sampleRate, durationSec, frames } = frameCount(opts);
  const meta = { id, kind: f.kind, sampleRate, durationSec, frames };

  if (id.startsWith("sine-")) {
    return { samples: renderSine(f.hz, frames, sampleRate, SINE_AMPLITUDE), meta: { ...meta, amplitudes: [SINE_AMPLITUDE] } };
  }
  if (id.startsWith("harmonic-")) {
    const { samples, amplitudes } = harmonicAmplitudes(f.hz, frames, sampleRate);
    return { samples, meta: { ...meta, amplitudes } };
  }
  if (id === "glide-110-220") {
    return { samples: renderSweep((t) => glideHz(t, durationSec), frames, sampleRate, SINE_AMPLITUDE), meta: { ...meta, amplitudes: [SINE_AMPLITUDE] } };
  }
  if (id === "vibrato-220") {
    return { samples: renderSweep(vibratoHz, frames, sampleRate, SINE_AMPLITUDE), meta: { ...meta, amplitudes: [SINE_AMPLITUDE] } };
  }
  if (id === "silence") {
    return { samples: new Float64Array(frames), meta: { ...meta, amplitudes: [] } };
  }
  if (id === "pink-noise") {
    return { samples: renderPink(frames, 0x5eed1), meta: { ...meta, amplitudes: [] } };
  }
  if (id === "snr10-220") {
    // Tone and noise are rendered separately, then summed, so the ratio is
    // exact by construction and a test can recover the noise by subtracting
    // the plain sine-220 render.
    const tone = renderSine(220, frames, sampleRate, SINE_AMPLITUDE);
    const toneRms = SINE_AMPLITUDE / Math.SQRT2;
    const noise = renderWhite(frames, 0x5eed2, toneRms / Math.pow(10, SNR_DB / 20));
    const samples = new Float64Array(frames);
    for (let n = 0; n < frames; n++) samples[n] = tone[n] + noise[n];
    return { samples, meta: { ...meta, amplitudes: [SINE_AMPLITUDE], snrDb: SNR_DB } };
  }
  throw new Error(`no renderer for fixture: ${id}`);
}

/**
 * 16-bit PCM WAV. Mono input is duplicated into every channel. Returns a
 * Uint8Array of 44 + 2 * frames * channels bytes.
 */
export function encodeWav(samples, { sampleRate = SAMPLE_RATE, channels = 1 } = {}) {
  const frames = samples.length;
  const n = frames * channels;
  const bytes = new Uint8Array(44 + 2 * n);
  const view = new DataView(bytes.buffer);
  const ascii = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + 2 * n, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, 2 * n, true);
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    const int = Math.round(v * 32767);
    for (let c = 0; c < channels; c++) {
      view.setInt16(offset, int, true);
      offset += 2;
    }
  }
  return bytes;
}

/** Render and encode. opts: { sampleRate, channels, durationSec }. */
export function buildFixture(id, opts = {}) {
  const channels = opts.channels ?? 1;
  const { samples, meta } = renderSamples(id, opts);
  const wav = encodeWav(samples, { sampleRate: meta.sampleRate, channels });
  return { wav, samples, meta: { ...meta, channels } };
}

/* --------------------------------------------------------------- analysis */

/**
 * Mean frequency from linearly interpolated upward zero crossings. Used by the
 * fixture tests and by the runner's rig probe.
 */
export function zeroCrossingHz(samples, sampleRate) {
  let first = null;
  let last = null;
  let count = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    if (a < 0 && b >= 0) {
      const t = (i - 1 + (-a / (b - a))) / sampleRate;
      if (first === null) first = t;
      last = t;
      count++;
    }
  }
  if (count < 2 || last === first) return null;
  return (count - 1) / (last - first);
}

export function rms(samples) {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/* ---------------------------------------------------------------- scoring */

/** Signed cents from expected to measured; null when either is missing. */
export function centsError(measuredHz, expectedHz) {
  if (!(measuredHz > 0) || !(expectedHz > 0)) return null;
  return 1200 * Math.log2(measuredHz / expectedHz);
}

export function median(values) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Nearest-rank 95th percentile. */
export function p95(values) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil(0.95 * s.length) - 1)];
}

/** Share of readings that carry a pitch. Readings are { t, hz } with hz null for none. */
export function voicedFraction(readings) {
  if (readings.length === 0) return 0;
  return readings.filter((r) => r.hz > 0).length / readings.length;
}

/** Absolute cents errors of voiced readings at a given offset, inside the fixture. */
function errorsAt(fixture, readings, offsetSec) {
  const out = [];
  for (const r of readings) {
    if (!(r.hz > 0)) continue;
    const ft = r.t - offsetSec;
    if (ft < 0 || ft > fixture.durationSec) continue;
    const c = centsError(r.hz, fixture.expectedHz(ft));
    if (c !== null) out.push(Math.abs(c));
  }
  return out;
}

/**
 * The shift (seconds, audio later than t=0 is positive) that best lines the
 * readings up with the fixture, searched from -0.5 to 1.5 s in 10 ms steps.
 * Ties go to the smallest |offset|, so a steady tone reports 0.
 */
export function bestOffset(fixture, readings) {
  if (!fixture.expectedHz) return 0;
  let best = 0;
  let bestScore = Infinity;
  for (let k = -50; k <= 150; k++) {
    const offset = k / 100;
    const errs = errorsAt(fixture, readings, offset);
    if (errs.length === 0) continue;
    const score = median(errs);
    if (score < bestScore - 1e-9 || (Math.abs(score - bestScore) <= 1e-9 && Math.abs(offset) < Math.abs(best))) {
      bestScore = score;
      best = offset;
    }
  }
  return best;
}

export const PASS_RULES = Object.freeze({
  minVoicedReadings: 10,
  steadyMedianCents: 10,
  steadyP95Cents: 50,
  octaveCents: 600,
  harmonicMaxOctaveShare: 0.02,
  movingMedianCents: 25,
  nullMaxVoiced: 0.1,
});

/**
 * Score one fixture on one surface.
 * Returns { n, voicedRate, medianCents, p95Cents, octaveErrors, offset, pass, reason }.
 */
export function scoreFixture(fixture, readings) {
  const n = readings.length;
  const voicedRate = voicedFraction(readings);
  const base = { n, voicedRate, medianCents: null, p95Cents: null, octaveErrors: 0, offset: 0 };

  if (fixture.kind === "null") {
    const pass = voicedRate <= PASS_RULES.nullMaxVoiced;
    return { ...base, pass, reason: pass ? null : `voiced ${(voicedRate * 100).toFixed(0)}% on a pitchless fixture` };
  }

  const voiced = readings.filter((r) => r.hz > 0).length;
  if (voiced < PASS_RULES.minVoicedReadings) {
    return { ...base, pass: false, reason: "no-reading" };
  }

  const offset = bestOffset(fixture, readings);
  const errs = errorsAt(fixture, readings, offset);
  if (errs.length < PASS_RULES.minVoicedReadings) {
    return { ...base, offset, pass: false, reason: "no-reading" };
  }
  const medianCents = median(errs);
  const p95Cents = p95(errs);
  const octaveErrors = errs.filter((c) => c > PASS_RULES.octaveCents).length;
  const scored = { ...base, medianCents, p95Cents, octaveErrors, offset };

  const fails = [];
  if (fixture.kind === "steady" || fixture.kind === "harmonic") {
    if (medianCents > PASS_RULES.steadyMedianCents) fails.push(`median ${medianCents.toFixed(1)}c > ${PASS_RULES.steadyMedianCents}`);
    if (p95Cents > PASS_RULES.steadyP95Cents) fails.push(`p95 ${p95Cents.toFixed(1)}c > ${PASS_RULES.steadyP95Cents}`);
  }
  if (fixture.kind === "harmonic" && octaveErrors / errs.length > PASS_RULES.harmonicMaxOctaveShare) {
    fails.push(`${octaveErrors}/${errs.length} octave errors`);
  }
  if (fixture.kind === "glide" || fixture.kind === "vibrato") {
    if (medianCents > PASS_RULES.movingMedianCents) fails.push(`median ${medianCents.toFixed(1)}c > ${PASS_RULES.movingMedianCents}`);
  }
  return { ...scored, pass: fails.length === 0, reason: fails.length ? fails.join("; ") : null };
}
