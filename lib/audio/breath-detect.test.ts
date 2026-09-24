import { describe, expect, it } from "vitest";
import {
  BREATH_RULES,
  InhaleDetector,
  breathFeatures,
  detectInhales,
  type InhaleEvent,
} from "./breath-detect";
import { bandNoise, concat, fan, hum, inhale, mixAt, silence } from "./breath-fixture";
import { midiToHz, synthVoice } from "./voice-fixture";

/**
 * Whether the inhale classifier hears a breath, and — the half that matters
 * more to a drill that waits on it — whether it hears one that is not there.
 *
 * Every signal is synthetic and deterministic, and each is run the way a live
 * room runs it: a 4096-sample window ending every 1/60 s, at both sample rates
 * browsers use. An "inhale" is 1–8 kHz noise with raised-cosine ramps, which
 * is the acoustic shape of an open-mouth breath but not a recording of one, so
 * these are rates against a model. The e2e (`e2e/breath-gate.mjs`) plays the
 * same fixtures through a real browser's capture path.
 *
 * Measured (seeds 1–3, 44.1 and 48 kHz; the same at 30 and 60 fps unless shown):
 *   inhale, quiet room, 0.4–2.2 s, RMS 0.003–0.03 ... 72 of 72 heard
 *   inhale over a fan at +20 / +10 / +6 dB ........... 24 of 24 heard at each
 *   inhale over a fan at +3 dB ....................... 8 of 24 (30 fps), 14 of 24 (60 fps)
 *   inhale over a fan at  0 dB ....................... 0 of 24 — no rise, by design
 *   duration vs the breath as synthesised ............ 0.05–0.17 s short, never long
 *   inhale then a sung vowel ......................... 12 of 12
 *   false inhales in 389 s of non-breath ............. 0
 *     (fans at three levels and two spectra, 50/60 Hz hum, digital silence,
 *      dither, vowels C3–E5 loud, quiet and at 10 dB SNR, a hum below the
 *      pitch detector's silence floor, a fan switching on, a fan already
 *      running as the mic opens and then a note, a 4 s hiss)
 *   false inhales in 672 s of vowels A2–A5, RMS 0.004–0.3,
 *     with vibrato and jitter (a one-off sweep, not run here) ... 0
 *
 * The known miss in the other direction: a short hiss of about a second is the
 * same sound as a breath and is heard as one (6 of 6). A drill that gates on an
 * inhale therefore opens for a singer who hisses briefly first; it never opens
 * for a note, which is what would count a hold nobody breathed for. Likewise a
 * fan or vent switched on less than 2.5 s before a note is heard as a breath:
 * the note ends the rise before the floor has caught up with it.
 */

const RATES = [44100, 48000] as const;
const SEEDS = [1, 2, 3] as const;
/**
 * The sweeps hop at 30 fps, which a busy phone does drop to, to keep this file
 * inside the suite's time. Every rule is in milliseconds, and the 60 fps cases
 * at the end check the same scenes at the rate a desktop runs.
 */
const SWEEP = { hopSec: 1 / 30 };
/** A sweep is thousands of frames; each takes seconds, not the default five. */
const SWEEP_TIMEOUT_MS = 60_000;

/** A quiet room: white noise at about -66 dBFS, the self-noise of a decent mic. */
function room(sampleRate: number, sec: number, seed = 3, level = 0.0005): Float32Array {
  return bandNoise({
    sampleRate,
    length: Math.round(sec * sampleRate),
    loHz: 0,
    hiHz: sampleRate / 2,
    level,
    seed,
  });
}

/** `sig` laid over a background of the same length. */
function over(sig: Float32Array, background: Float32Array): Float32Array {
  return mixAt(background, sig);
}

function breathScene(opts: {
  sampleRate: number;
  durationSec: number;
  level: number;
  seed: number;
  background?: (sec: number) => Float32Array;
  lead?: number;
  tail?: number;
}): { signal: Float32Array; startSec: number } {
  const lead = opts.lead ?? 1;
  const tail = opts.tail ?? 1;
  const sig = concat(
    silence(opts.sampleRate, lead),
    inhale({
      sampleRate: opts.sampleRate,
      durationSec: opts.durationSec,
      level: opts.level,
      seed: opts.seed * 17,
    }),
    silence(opts.sampleRate, tail),
  );
  const bg = (opts.background ?? ((s) => room(opts.sampleRate, s, opts.seed)))(
    sig.length / opts.sampleRate,
  );
  return { signal: over(sig, bg.subarray(0, sig.length)), startSec: lead };
}

describe("hears an inhale", () => {
  it("in a quiet room, across lengths and levels", () => {
    let heard = 0;
    let total = 0;
    let worstError = 0;
    for (const sampleRate of RATES) {
      for (const seed of SEEDS) {
        for (const durationSec of [0.4, 0.8, 1.5, 2.2]) {
          for (const level of [0.003, 0.01, 0.03]) {
            total++;
            const { signal, startSec } = breathScene({ sampleRate, durationSec, level, seed });
            const { events } = detectInhales(signal, sampleRate, SWEEP);
            if (events.length !== 1) continue;
            heard++;
            const e = events[0];
            worstError = Math.max(worstError, Math.abs(e.durationSec - durationSec));
            // Starts inside the breath, not before it.
            expect(e.startMs / 1000).toBeGreaterThanOrEqual(startSec);
            expect(e.startMs / 1000).toBeLessThan(startSec + 0.3);
            expect(e.endedByVoice).toBe(false);
          }
        }
      }
    }
    expect(heard).toBe(total);
    // Always reported a little short: the ramps sit under the start line.
    expect(worstError).toBeLessThan(0.2);
  }, SWEEP_TIMEOUT_MS);

  it("over a fan, down to 6 dB above it", () => {
    const rates: Record<number, number> = {};
    for (const snrDb of [20, 10, 6, 0]) {
      let heard = 0;
      for (const sampleRate of RATES) {
        for (const seed of SEEDS) {
          for (const durationSec of [0.6, 1.4]) {
            for (const fanLevel of [0.002, 0.01]) {
              const level = fanLevel * Math.pow(10, snrDb / 20);
              const { signal } = breathScene({
                sampleRate,
                durationSec,
                level,
                seed,
                background: (sec) =>
                  fan({ sampleRate, length: Math.round(sec * sampleRate), level: fanLevel, seed }),
              });
              if (detectInhales(signal, sampleRate, SWEEP).events.length === 1) heard++;
            }
          }
        }
      }
      rates[snrDb] = heard;
    }
    // 24 cases per SNR.
    expect(rates[20]).toBe(24);
    expect(rates[10]).toBe(24);
    expect(rates[6]).toBe(24);
    // A breath no louder than the fan is not a rise out of the room. Missing it
    // is the price of never mistaking the fan for one.
    expect(rates[0]).toBe(0);
  }, SWEEP_TIMEOUT_MS);

  it("ends the breath when the sung note begins — the real pattern", () => {
    let heard = 0;
    for (const sampleRate of RATES) {
      for (const seed of SEEDS) {
        for (const gapSec of [0, 0.1]) {
          const vowel = synthVoice({
            freq: midiToHz(57),
            sampleRate,
            length: sampleRate * 3,
            level: 0.25,
            seed,
          });
          const sig = concat(
            silence(sampleRate, 1),
            inhale({ sampleRate, durationSec: 0.9, level: 0.012, seed: seed * 17 }),
            silence(sampleRate, gapSec),
            vowel,
            silence(sampleRate, 1),
          );
          const { events } = detectInhales(over(sig, room(sampleRate, sig.length / sampleRate, seed)), sampleRate, SWEEP);
          expect(events.length).toBeLessThanOrEqual(1);
          if (events.length !== 1) continue;
          heard++;
          // With no gap the voice cuts it off; with a gap it has already faded.
          if (gapSec === 0) expect(events[0].endedByVoice).toBe(true);
          expect(events[0].durationSec).toBeGreaterThan(0.6);
          expect(events[0].durationSec).toBeLessThan(1.1);
        }
      }
    }
    expect(heard).toBe(12);
  }, SWEEP_TIMEOUT_MS);
});

describe("hears nothing that is not a breath", () => {
  /** Every non-breath scene, with its length, so the total is reported honestly. */
  function scenes(sampleRate: number, seed: number): Array<[string, Float32Array]> {
    const len = (sec: number) => Math.round(sec * sampleRate);
    const out: Array<[string, Float32Array]> = [];
    for (const level of [0.002, 0.01, 0.04]) {
      out.push([`fan ${level}`, fan({ sampleRate, length: len(4), level, seed })]);
    }
    out.push([
      "full-band fan",
      bandNoise({ sampleRate, length: len(4), loHz: 0, hiHz: sampleRate / 2, level: 0.01, seed }),
    ]);
    for (const hz of [50, 60] as const) {
      out.push([`hum ${hz}`, over(hum({ sampleRate, length: len(3), level: 0.01, hz }), room(sampleRate, 3, seed))]);
    }
    out.push(["digital silence", silence(sampleRate, 3)]);
    out.push(["dither", room(sampleRate, 3, seed, 0.00003)]);
    for (const midi of [48, 57, 69, 76]) {
      for (const level of [0.25, 0.02]) {
        const v = synthVoice({ freq: midiToHz(midi), sampleRate, length: len(2), level, seed });
        out.push([
          `vowel ${midi} @${level}`,
          over(concat(silence(sampleRate, 1), v, silence(sampleRate, 1)), room(sampleRate, 4, seed)),
        ]);
      }
      const noisy = synthVoice({ freq: midiToHz(midi), sampleRate, length: len(2), level: 0.1, snrDb: 10, seed });
      out.push([
        `vowel ${midi} 10 dB SNR`,
        over(concat(silence(sampleRate, 1), noisy, silence(sampleRate, 1)), room(sampleRate, 4, seed)),
      ]);
    }
    // A hum under 0.01 RMS, where the pitch detector reports nothing at all.
    const quiet = synthVoice({ freq: midiToHz(50), sampleRate, length: len(2), level: 0.006, seed });
    out.push([
      "quiet hum",
      over(concat(silence(sampleRate, 1), quiet, silence(sampleRate, 1)), room(sampleRate, 4, seed)),
    ]);
    // A fan already running when the mic opens, then a note. The stream's
    // first frames are zeros filling with fan; the e2e found this one.
    out.push([
      "fan as the mic opens, then a note",
      concat(
        silence(sampleRate, 0.2),
        mixAt(
          fan({ sampleRate, length: len(5), level: 0.01, seed }),
          concat(silence(sampleRate, 1.8), synthVoice({ freq: midiToHz(57), sampleRate, length: len(2), level: 0.25, seed })),
        ),
      ),
    ]);
    // A fan switched on mid-take: a rise, but one that never falls.
    out.push([
      "fan switching on",
      over(
        concat(silence(sampleRate, 1), fan({ sampleRate, length: len(5), level: 0.01, seed })),
        room(sampleRate, 6, seed),
      ),
    ]);
    // A long hiss, the other way to do the sustain test.
    out.push([
      "4 s hiss",
      over(
        concat(
          silence(sampleRate, 1),
          inhale({ sampleRate, durationSec: 4, level: 0.03, loHz: 3000, hiHz: 9000, seed }),
          silence(sampleRate, 1),
        ),
        room(sampleRate, 6, seed),
      ),
    ]);
    return out;
  }

  it("reports no inhale in any non-breath scene", () => {
    const offenders: string[] = [];
    let seconds = 0;
    for (const sampleRate of RATES) {
      for (const seed of [1, 2]) {
        for (const [name, signal] of scenes(sampleRate, seed)) {
          seconds += signal.length / sampleRate;
          const { events } = detectInhales(signal, sampleRate, SWEEP);
          if (events.length) offenders.push(`${name} @${sampleRate}/${seed}: ${events.length}`);
        }
      }
    }
    expect(offenders).toEqual([]);
    expect(seconds).toBeCloseTo(388.8, 0);
  }, SWEEP_TIMEOUT_MS);

  it("never lights the live indicator on a voiced frame", () => {
    for (const sampleRate of RATES) {
      const v = synthVoice({ freq: midiToHz(57), sampleRate, length: sampleRate * 2, level: 0.2 });
      const sig = over(concat(silence(sampleRate, 1), v), room(sampleRate, 3));
      expect(detectInhales(sig, sampleRate).inhalingFrames).toBe(0);
    }
  });
});

describe("at 60 fps", () => {
  it("hears the breath before a note, and not a fan or the note itself", () => {
    for (const sampleRate of RATES) {
      const vowel = synthVoice({ freq: midiToHz(52), sampleRate, length: sampleRate * 2, level: 0.2 });
      const take = concat(
        silence(sampleRate, 1),
        inhale({ sampleRate, durationSec: 0.7, level: 0.008 }),
        vowel,
        silence(sampleRate, 0.5),
      );
      const withBreath = detectInhales(over(take, room(sampleRate, take.length / sampleRate)), sampleRate);
      expect(withBreath.events).toHaveLength(1);
      expect(withBreath.events[0].endedByVoice).toBe(true);

      const fanned = concat(silence(sampleRate, 1.7), vowel, silence(sampleRate, 0.5));
      const noBreath = detectInhales(
        over(fanned, fan({ sampleRate, length: fanned.length, level: 0.01 })),
        sampleRate,
      );
      expect(noBreath.events).toEqual([]);
    }
  }, SWEEP_TIMEOUT_MS);
});

describe("InhaleDetector rules", () => {
  /** Feeds a synthetic feature stream at 60 fps. */
  function feed(
    frames: Array<{ ms: number; hi: number; lo?: number; clarity?: number }>,
  ): InhaleEvent[] {
    const det = new InhaleDetector();
    const out: InhaleEvent[] = [];
    for (const f of frames) {
      const u = det.push(
        { rms: 0.005, lowPower: f.lo ?? 0.01, highPower: f.hi, flatness: 0.5, clarity: f.clarity ?? 0.1 },
        f.ms,
      );
      if (u.inhale) out.push(u.inhale);
    }
    return out;
  }
  const at = (fromMs: number, toMs: number, frame: { hi: number; lo?: number; clarity?: number }) =>
    Array.from({ length: Math.round(((toMs - fromMs) * 60) / 1000) }, (_, i) => ({
      ms: fromMs + (i * 1000) / 60,
      ...frame,
    }));

  it("needs a quarter second and refuses more than two and a half", () => {
    const quiet = { hi: 0.05 };
    const loud = { hi: 5 };
    expect(feed([...at(0, 1000, quiet), ...at(1000, 1150, loud), ...at(1150, 2000, quiet)])).toEqual([]);
    expect(feed([...at(0, 1000, quiet), ...at(1000, 1600, loud), ...at(1600, 2500, quiet)])).toHaveLength(1);
    expect(
      feed([...at(0, 1000, quiet), ...at(1000, 1000 + BREATH_RULES.maxInhaleMs + 300, loud), ...at(3800, 5000, quiet)]),
    ).toEqual([]);
  });

  it("lets a breath fade into a note's first, not-yet-voiced frames", () => {
    // The browser's order of events: breath, a gap, then a vowel onset that is
    // loud but below the voiced line for a frame or two.
    const events = feed([
      ...at(0, 1000, { hi: 0.05 }),
      ...at(1000, 1800, { hi: 5 }),
      ...at(1800, 1900, { hi: 0.05 }),
      ...at(1900, 2150, { hi: 3, lo: 80, clarity: 0.5 }),
      ...at(2150, 3000, { hi: 3, lo: 80, clarity: 0.95 }),
    ]);
    expect(events).toHaveLength(1);
  });

  it("closes on the first voiced frame, and a voice never opens one", () => {
    const events = feed([
      ...at(0, 1000, { hi: 0.05 }),
      ...at(1000, 1700, { hi: 5 }),
      ...at(1700, 3000, { hi: 5, lo: 50, clarity: 0.95 }),
    ]);
    expect(events).toHaveLength(1);
    expect(events[0].endedByVoice).toBe(true);
    expect(feed([...at(0, 1000, { hi: 0.05 }), ...at(1000, 3000, { hi: 5, clarity: 0.9 })])).toEqual([]);
  });

  it("learns the room from the first frame with signal in it, not the stream's zeros", () => {
    const det = new InhaleDetector();
    const zeros = { rms: 0, lowPower: 0, highPower: 0, flatness: 0, clarity: 0 };
    const fanFrame = { rms: 0.01, lowPower: 1, highPower: 5, flatness: 0.5, clarity: 0.1 };
    for (let ms = 0; ms < 500; ms += 16) det.push(zeros, ms);
    let events = 0;
    let lit = 0;
    for (let ms = 500; ms < 4000; ms += 16) {
      const u = det.push(fanFrame, ms);
      if (u.inhale) events++;
      if (u.inhaling) lit++;
    }
    expect(events).toBe(0);
    expect(lit).toBe(0);
  });

  it("ignores a rise during the warm-up, before the room is known", () => {
    expect(feed([...at(0, 100, { hi: 0.05 }), ...at(100, 250, { hi: 5 }), ...at(250, 2000, { hi: 0.05 })])).toEqual([]);
  });
});

describe("breathFeatures", () => {
  it("measures a hum too quiet for the pitch detector as periodic", () => {
    const sampleRate = 48000;
    const v = synthVoice({ freq: midiToHz(50), sampleRate, length: 4096, level: 0.005 });
    const f = breathFeatures(v, sampleRate);
    // Deferred, because most quiet frames are the room and never need it.
    expect(f.clarity).toBeNaN();
    expect(f.measureClarity?.()).toBeGreaterThan(BREATH_RULES.voicedClarity);
  });

  it("reads breath noise as flat and a vowel as not", () => {
    const sampleRate = 44100;
    const b = inhale({ sampleRate, durationSec: 0.2, level: 0.01, rampSec: 0.001 });
    const v = synthVoice({ freq: midiToHz(69), sampleRate, length: 4096, level: 0.2 });
    expect(breathFeatures(b.subarray(0, 4096), sampleRate).flatness).toBeGreaterThan(0.4);
    expect(breathFeatures(v, sampleRate).flatness).toBeLessThan(0.05);
  });
});
