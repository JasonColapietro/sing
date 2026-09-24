import { describe, expect, it } from "vitest";
import type { F0Frame } from "@/lib/audio/f0-trace";
import { VIBRATO_TARGET_BAND } from "./exercises";
import {
  createF0Recorder,
  readVibrato,
  vibratoDetail,
  vibratoHeadline,
  windowGain,
} from "./vibrato-feedback";

/** A 60 fps f0 trace of one held note with an optional sinusoidal vibrato. */
function trace(opts: { sec?: number; hz?: number; rateHz?: number; halfCents?: number }): F0Frame[] {
  const { sec = 4, hz = 220, rateHz = 0, halfCents = 0 } = opts;
  const frames: F0Frame[] = [];
  for (let i = 0; i < Math.round(sec * 60); i++) {
    const t = i / 60;
    const cents = rateHz > 0 ? halfCents * Math.sin(2 * Math.PI * rateHz * t) : 0;
    frames.push({ t, f0: hz * Math.pow(2, cents / 1200) });
  }
  return frames;
}

describe("readVibrato", () => {
  it("reads a 5.5 Hz, ±50 cent vibrato as in the target band", () => {
    const r = readVibrato(trace({ rateHz: 5.5, halfCents: 50 }), VIBRATO_TARGET_BAND);
    expect(r.kind).toBe("measured");
    if (r.kind !== "measured") return;
    expect(r.rateHz).toBeCloseTo(5.5, 1);
    // Peak to peak: ±50 cents is a 100 cent wobble, less a little for the
    // 60 fps sampling of each cycle's extremes.
    expect(r.extentCents).toBeGreaterThan(90);
    expect(r.extentCents).toBeLessThanOrEqual(101);
    expect(r.inBand).toBe(true);
    expect(vibratoHeadline(r)).toMatch(/^5\.5 Hz · \d+¢ wide$/);
    expect(vibratoDetail(r)).toBe("In the 5–7 Hz target band.");
  });

  it("reads a straight tone as no vibrato, and says so without judging it", () => {
    const r = readVibrato(trace({}), VIBRATO_TARGET_BAND);
    expect(r.kind).toBe("none");
    expect(vibratoHeadline(r)).toBe("No steady vibrato yet");
    expect(vibratoDetail(r)).toMatch(/straight tone is fine/i);
  });

  it("measures a slow vibrato and places it below the band", () => {
    const r = readVibrato(trace({ rateHz: 4, halfCents: 40 }), VIBRATO_TARGET_BAND);
    expect(r.kind).toBe("measured");
    if (r.kind !== "measured") return;
    expect(r.rateHz).toBeCloseTo(4, 1);
    expect(r.inBand).toBe(false);
    expect(vibratoDetail(r)).toBe("Slower than the 5–7 Hz target band.");
  });

  it("asks for a longer hold when there was too little to read", () => {
    const r = readVibrato(trace({ sec: 0.8, rateHz: 5.5, halfCents: 50 }), VIBRATO_TARGET_BAND);
    expect(r.kind).toBe("none");
    expect(vibratoDetail(r)).toMatch(/too short/);
  });

  it("widens the width by what the live analysis frame averaged away, and only the width", () => {
    const frames = trace({ rateHz: 5.5, halfCents: 50 });
    const raw = readVibrato(frames, VIBRATO_TARGET_BAND);
    const windowSec = 4096 / 48000;
    const live = readVibrato(frames, VIBRATO_TARGET_BAND, { windowSec });
    if (raw.kind !== "measured" || live.kind !== "measured") throw new Error("expected readings");
    expect(live.rateHz).toBe(raw.rateHz);
    expect(live.extentCents).toBeCloseTo(raw.extentCents / windowGain(raw.rateHz, windowSec), 6);
    // An 85 ms frame passes about two thirds of a 5.5 Hz swing.
    expect(windowGain(5.5, windowSec)).toBeGreaterThan(0.65);
    expect(windowGain(5.5, windowSec)).toBeLessThan(0.7);
    // A fast vibrato is never divided by less than a half: it under-reads
    // rather than being inflated.
    const fast = readVibrato(trace({ rateHz: 8.5, halfCents: 50 }), VIBRATO_TARGET_BAND, { windowSec });
    const fastRaw = readVibrato(trace({ rateHz: 8.5, halfCents: 50 }), VIBRATO_TARGET_BAND);
    if (fast.kind !== "measured" || fastRaw.kind !== "measured") throw new Error("expected readings");
    expect(fast.extentCents).toBeCloseTo(fastRaw.extentCents * 2, 6);
    expect(fast.inBand).toBe(false);
    expect(vibratoDetail(fast)).toBe("Faster than the 5–7 Hz target band.");
  });

  it("reads nothing from silence", () => {
    const silent: F0Frame[] = Array.from({ length: 240 }, (_, i) => ({ t: i / 60, f0: null }));
    expect(readVibrato(silent, VIBRATO_TARGET_BAND).kind).toBe("none");
  });
});

describe("createF0Recorder", () => {
  it("keeps one frame per timestamp, in seconds, and starts over on reset", () => {
    const rec = createF0Recorder();
    rec.push(1000, 220);
    rec.push(1000, 220);
    rec.push(1016.7, null);
    rec.push(1010, 221);
    expect(rec.frames()).toEqual([
      { t: 1, f0: 220 },
      { t: 1.0167, f0: null },
    ]);
    rec.reset();
    expect(rec.frames()).toEqual([]);
    rec.push(5, 200);
    expect(rec.frames()).toHaveLength(1);
  });
});
