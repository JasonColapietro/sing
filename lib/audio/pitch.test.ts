import { describe, expect, it } from "vitest";
import { detectPitch } from "./pitch";

/** One analyser frame of a sung vowel: fundamental plus the first harmonics. */
function voiceFrame({
  freq = 220,
  level = 0.03,
  noise = 0,
  sampleRate = 44100,
  size = 2048,
  seed = 1,
}: {
  freq?: number;
  level?: number;
  noise?: number;
  sampleRate?: number;
  size?: number;
  seed?: number;
} = {}): Float32Array {
  // Deterministic PRNG: a flaky detector test is worse than none.
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return (s / 4294967296) * 2 - 1;
  };
  const out = new Float32Array(size);
  let phase = 0;
  for (let i = 0; i < size; i++) {
    phase += (2 * Math.PI * freq) / sampleRate;
    const tone =
      Math.sin(phase) + 0.4 * Math.sin(2 * phase) + 0.22 * Math.sin(3 * phase);
    out[i] = tone * level + rand() * noise;
  }
  return out;
}

/** A low, periodic room tone rather than a voice. */
function periodicRoomTone({
  freq = 220,
  amplitude = 0.01,
  sampleRate = 44100,
  size = 4096,
}: {
  freq?: number;
  amplitude?: number;
  sampleRate?: number;
  size?: number;
} = {}): Float32Array {
  return Float32Array.from(
    { length: size },
    (_, index) => amplitude * Math.sin((2 * Math.PI * freq * index) / sampleRate),
  );
}

/** Mains hum with a rectifier harmonic louder than its fundamental. */
function mainsHum(
  fundamentalHz: number,
  {
    amplitude = 0.02,
    noise = 0,
    sampleRate = 44100,
    size = 4096,
    seed = 1,
  } = {},
): Float32Array {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return (state / 4294967296) * 2 - 1;
  };
  return Float32Array.from({ length: size }, (_, index) => {
    const phase = (2 * Math.PI * fundamentalHz * index) / sampleRate;
    return (
      amplitude *
        (0.1 * Math.sin(phase) +
          0.7 * Math.sin(2 * phase) +
          0.25 * Math.sin(4 * phase) +
          0.08 * Math.sin(6 * phase)) +
      noise * random()
    );
  });
}

describe("detectPitch", () => {
  it("rejects low-level periodic room noise", () => {
    expect(detectPitch(periodicRoomTone(), 44100)).toBeNull();
  });

  it.each([50, 60])(
    "rejects %i Hz mains hum instead of reporting its harmonic",
    (fundamentalHz) => {
      expect(detectPitch(mainsHum(fundamentalHz), 44100)).toBeNull();
    },
  );

  it.each([44100, 48000])(
    "rejects noisy mains hum at a %i Hz browser sample rate",
    (sampleRate) => {
      for (const fundamentalHz of [50, 60]) {
        expect(
          detectPitch(
            mainsHum(fundamentalHz, { noise: 0.005, sampleRate }),
            sampleRate,
          ),
        ).toBeNull();
      }
    },
  );

  it.each([44100, 48000])(
    "keeps a noisy E2 voice at a %i Hz browser sample rate",
    (sampleRate) => {
      const r = detectPitch(
        voiceFrame({
          freq: 82.41,
          level: 0.02,
          noise: 0.005,
          sampleRate,
          size: 4096,
        }),
        sampleRate,
      );
      expect(r).not.toBeNull();
      expect(Math.abs(r!.freq - 82.41)).toBeLessThan(3);
      expect(r!.clarity).toBeGreaterThanOrEqual(0.75);
    },
  );

  it("still detects a quiet voice above the room-noise floor", () => {
    const r = detectPitch(voiceFrame({ level: 0.02 }), 44100);
    expect(r).not.toBeNull();
    expect(r!.freq).toBeCloseTo(220, 0);
    expect(r!.clarity).toBeGreaterThanOrEqual(0.75);
  });

  it("reads a clean sung note", () => {
    const r = detectPitch(voiceFrame(), 44100);
    expect(r).not.toBeNull();
    expect(r!.freq).toBeCloseTo(220, 0);
  });

  /**
   * The bug: a singer in a normal room, or any signal that has been through the
   * browser's capture and resampling path, arrives with a noise floor. The
   * autocorrelation then peaks on noise at a very short lag, the resulting
   * frequency lands outside the vocal range, and the whole frame is thrown away
   * as "no pitch" — even though the note is perfectly audible and perfectly on
   * pitch. On /range that reads as the warm hold never filling: the singer holds
   * a note and the app says it hears nothing.
   */
  it("still reads the note when the room is noisy", () => {
    const frame = voiceFrame({ level: 0.03, noise: 0.02 });
    const r = detectPitch(frame, 44100);
    expect(r).not.toBeNull();
    expect(r!.freq).toBeCloseTo(220, -1);
  });

  it("holds up across a run of noisy frames, not just a lucky one", () => {
    let resolved = 0;
    const total = 40;
    for (let seed = 1; seed <= total; seed++) {
      const r = detectPitch(voiceFrame({ level: 0.03, noise: 0.02, seed }), 44100);
      if (r && Math.abs(r.freq - 220) < 25) resolved++;
    }
    // The warm hold resets after 350 ms of unvoiced frames (~21 frames at 60fps),
    // so an occasional miss is survivable but a majority of misses is not.
    expect(resolved).toBeGreaterThan(total * 0.8);
  });

  it("does not invent a pitch for noise alone", () => {
    const noiseOnly = voiceFrame({ level: 0, noise: 0.05 });
    const r = detectPitch(noiseOnly, 44100);
    // Either no reading, or one the caller's confidence gate will reject.
    expect(r === null || r.clarity < 0.75).toBe(true);
  });

  it("rejects a frame below the silence floor", () => {
    expect(detectPitch(voiceFrame({ level: 0.0005 }), 44100)).toBeNull();
  });

  it("reads the low and high ends of the singing range", () => {
    const low = detectPitch(voiceFrame({ freq: 82 }), 44100); // E2
    const high = detectPitch(voiceFrame({ freq: 880 }), 44100); // A5
    expect(low!.freq).toBeCloseTo(82, 0);
    expect(high!.freq).toBeCloseTo(880, -1);
  });
  /**
   * The gate every practice room actually applies is `clarity >= 0.75`
   * (lib/audio/use-pitch.ts), not "did detectPitch return something". Asserting
   * only the frequency is how a detector that could not hear a bass passed its
   * own tests for months: E2 came back at the right pitch with a clarity of
   * 0.714, and every caller threw it away as unvoiced.
   *
   * 2048 samples at 48 kHz is the exact frame every room uses, and the case
   * that used to fail.
   */
  describe("clears the caller's clarity gate across the whole vocal range", () => {
    const CLARITY_GATE = 0.75;
    const notes: Array<[string, number]> = [
      ["C2", 65.41],
      ["E2 (bass floor)", 82.41],
      ["F#2", 92.5],
      ["G2", 98.0],
      ["A2 (baritone floor)", 110.0],
      ["C3", 130.81],
      ["A3", 220.0],
      ["C5", 523.25],
      ["A5", 880.0],
    ];

    for (const [name, freq] of notes) {
      it(`${name} at 48 kHz`, () => {
        const r = detectPitch(
          voiceFrame({ freq, sampleRate: 48000, size: 2048 }),
          48000,
        );
        expect(r).not.toBeNull();
        expect(r!.freq).toBeCloseTo(freq, freq > 400 ? -1 : 0);
        expect(r!.clarity).toBeGreaterThanOrEqual(CLARITY_GATE);
      });
    }
  });

  /**
   * Normalizing the correlation removed the taper that used to suppress
   * sub-octave lags for free, so the octave below now scores about as well as
   * the true period. Without first-peak selection a bass singing E2 reads as
   * E1 and the range test overstates him instead of understating him.
   */
  it("does not drop an octave when the sub-octave lag scores as well", () => {
    for (const freq of [82.41, 110, 146.83, 220]) {
      const r = detectPitch(
        voiceFrame({ freq, sampleRate: 48000, size: 2048 }),
        48000,
      );
      expect(r).not.toBeNull();
      // Half the true frequency would be the classic failure.
      expect(r!.freq).toBeGreaterThan(freq * 0.8);
      expect(r!.freq).toBeLessThan(freq * 1.25);
    }
  });

  /**
   * Two singers with the same voice used to get different range tests
   * depending on their sound card, because the old clarity floor moved with
   * the sample rate (4*sampleRate/size).
   */
  it("reads the same low note at 44.1 kHz and 48 kHz", () => {
    const a = detectPitch(voiceFrame({ freq: 87.31, sampleRate: 44100 }), 44100);
    const b = detectPitch(
      voiceFrame({ freq: 87.31, sampleRate: 48000, size: 2048 }),
      48000,
    );
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a!.clarity).toBeGreaterThanOrEqual(0.75);
    expect(b!.clarity).toBeGreaterThanOrEqual(0.75);
    expect(Math.abs(a!.freq - b!.freq)).toBeLessThan(2);
  });
});

/**
 * Precision cases at the frame the live loop actually opens: PITCH_FFT_SIZE
 * (4096) samples at 48 kHz (lib/audio/use-pitch.ts). Every case runs at three
 * phase offsets so a result cannot hinge on where the frame happened to start.
 * Helpers are local on purpose: lib never imports from e2e.
 */
describe("detectPitch precision at the live 4096-sample frame", () => {
  const SR = 48000;
  const SIZE = 4096;
  const LEVEL = 0.3;
  const PHASES = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];

  /** Same LCG as the helpers above. */
  const lcg = (seed: number) => {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  };

  /** Gaussian samples (Box-Muller) from the seeded LCG. */
  const gaussian = (seed: number) => {
    const rand = lcg(seed);
    return () => {
      const u = Math.max(rand(), 1e-12);
      const v = rand();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
  };

  const cents = (freq: number, ref: number) => 1200 * Math.log2(freq / ref);

  const sine = (freq: number, phase: number) =>
    Float32Array.from(
      { length: SIZE },
      (_, i) => LEVEL * Math.sin((2 * Math.PI * freq * i) / SR + phase),
    );

  /** Harmonics 1-8 at amplitude 1/k, the classic sawtooth-like voice proxy. */
  const harmonic = (freq: number, phase: number) =>
    Float32Array.from({ length: SIZE }, (_, i) => {
      const p = (2 * Math.PI * freq * i) / SR + phase;
      let x = 0;
      for (let k = 1; k <= 8; k++) x += Math.sin(k * p) / k;
      return (LEVEL / 2) * x;
    });

  /** A sine plus white Gaussian noise at the given SNR in dB. */
  const noisySine = (freq: number, snrDb: number, phase: number, seed: number) => {
    const g = gaussian(seed);
    const signalPower = (LEVEL * LEVEL) / 2;
    const sigma = Math.sqrt(signalPower / 10 ** (snrDb / 10));
    return Float32Array.from(
      { length: SIZE },
      (_, i) =>
        LEVEL * Math.sin((2 * Math.PI * freq * i) / SR + phase) + sigma * g(),
    );
  };

  /**
   * An exponential glide from `from` to `to` Hz over `seconds`, sampled as one
   * frame starting `startSample` into it. Returns the frame and the
   * instantaneous frequency at the frame's centre.
   */
  const glide = (
    from: number,
    to: number,
    seconds: number,
    startSample: number,
  ) => {
    const total = seconds * SR;
    const ratio = Math.log(to / from);
    const instHz = (n: number) => from * Math.exp((ratio * n) / total);
    // Phase is the integral of instantaneous frequency.
    const phaseAt = (n: number) =>
      ((2 * Math.PI * from * total) / (SR * ratio)) *
      (Math.exp((ratio * n) / total) - 1);
    const frame = Float32Array.from({ length: SIZE }, (_, i) =>
      LEVEL * Math.sin(phaseAt(startSample + i)),
    );
    return { frame, centreHz: instHz(startSample + SIZE / 2) };
  };

  /** Sinusoidal vibrato around `centre` Hz, depth in cents, rate in Hz. */
  const vibrato = (
    centre: number,
    rateHz: number,
    depthCents: number,
    lfoPhase: number,
  ) => {
    let phase = 0;
    return Float32Array.from({ length: SIZE }, (_, i) => {
      const f =
        centre *
        2 **
          ((depthCents / 1200) *
            Math.sin((2 * Math.PI * rateHz * i) / SR + lfoPhase));
      phase += (2 * Math.PI * f) / SR;
      return LEVEL * Math.sin(phase);
    });
  };

  /** Pink noise via Paul Kellet's refined filter over seeded white noise. */
  const pinkNoise = (seed: number, rms = 0.1) => {
    const rand = lcg(seed);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    const out = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) {
      const w = rand() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
      b6 = w * 0.115926;
    }
    let power = 0;
    for (const x of out) power += x * x;
    const scale = rms / Math.sqrt(power / SIZE);
    for (let i = 0; i < SIZE; i++) out[i] *= scale;
    return out;
  };

  const SINES = [110, 130.81, 164.81, 220, 261.63, 440, 523.25, 659.26, 880];

  for (const freq of SINES) {
    it(`sine ${freq} Hz reads within 10 cents at every phase`, () => {
      for (const phase of PHASES) {
        const r = detectPitch(sine(freq, phase), SR);
        expect(r, `phase ${phase.toFixed(2)}`).not.toBeNull();
        expect(
          Math.abs(cents(r!.freq, freq)),
          `phase ${phase.toFixed(2)}: ${r!.freq.toFixed(3)} Hz`,
        ).toBeLessThanOrEqual(10);
      }
    });
  }

  // fails today: 222.268 Hz (+17.8 c), 221.074 Hz (+8.4 c), 223.221 Hz (+25.1 c) at clarity 0.907/0.907/0.906
  it.fails("220 Hz sine in white noise at 10 dB SNR reads within 10 cents", () => {
    PHASES.forEach((phase, k) => {
      const r = detectPitch(noisySine(220, 10, phase, k + 1), SR);
      expect(r, `phase ${phase.toFixed(2)}`).not.toBeNull();
      expect(
        Math.abs(cents(r!.freq, 220)),
        `phase ${phase.toFixed(2)}: ${r!.freq.toFixed(3)} Hz`,
      ).toBeLessThanOrEqual(10);
    });
  });

  for (const freq of [110, 220, 440]) {
    it(`harmonic tone at ${freq} Hz has no octave error and reads within 10 cents`, () => {
      for (const phase of PHASES) {
        const r = detectPitch(harmonic(freq, phase), SR);
        expect(r, `phase ${phase.toFixed(2)}`).not.toBeNull();
        const off = Math.abs(cents(r!.freq, freq));
        const msg = `phase ${phase.toFixed(2)}: ${r!.freq.toFixed(3)} Hz`;
        expect(off, msg).toBeLessThanOrEqual(600);
        expect(off, msg).toBeLessThanOrEqual(10);
      }
    });
  }

  it("glide 110 to 220 Hz tracks the frame-centre frequency within 25 cents", () => {
    // A one-second octave glide, read at three points along it.
    for (const start of [0.2 * SR, 0.45 * SR, 0.7 * SR]) {
      const { frame, centreHz } = glide(110, 220, 1, start);
      const r = detectPitch(frame, SR);
      expect(r, `start ${start}`).not.toBeNull();
      expect(
        Math.abs(cents(r!.freq, centreHz)),
        `start ${start}: ${r!.freq.toFixed(3)} Hz vs ${centreHz.toFixed(3)} Hz`,
      ).toBeLessThanOrEqual(25);
    }
  });

  it("5.5 Hz vibrato of +/-50 cents around 220 Hz reads within 60 cents of 220", () => {
    for (const phase of PHASES) {
      const r = detectPitch(vibrato(220, 5.5, 50, phase), SR);
      expect(r, `lfo phase ${phase.toFixed(2)}`).not.toBeNull();
      expect(
        Math.abs(cents(r!.freq, 220)),
        `lfo phase ${phase.toFixed(2)}: ${r!.freq.toFixed(3)} Hz`,
      ).toBeLessThanOrEqual(60);
    }
  });

  it("silence returns null", () => {
    expect(detectPitch(new Float32Array(SIZE), SR)).toBeNull();
  });

  it("pink noise returns null or a clarity below the 0.75 gate", () => {
    for (const seed of [1, 2, 3]) {
      const r = detectPitch(pinkNoise(seed), SR);
      expect(
        r === null || r.clarity < 0.75,
        `seed ${seed}: ${r ? `${r.freq.toFixed(3)} Hz @ ${r.clarity.toFixed(3)}` : "null"}`,
      ).toBe(true);
    }
  });
});
