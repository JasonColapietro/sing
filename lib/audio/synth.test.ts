import { describe, expect, it, vi } from "vitest";

/**
 * The drone is what the /tools guide tells singers to tune against "until the
 * wobble disappears". Two detuned copies of the same wave beat on their own
 * (6 cents apart at A3 is 0.76 Hz, and harmonic n at n times that), so a
 * singer could never make the beat go away. The drone must be one voice at
 * the exact pitch.
 */

const created = vi.hoisted(() => ({ oscillators: [] as { frequency: { value: number } }[] }));

function param() {
  return {
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
  };
}

const ctx = vi.hoisted(() => ({}) as Record<string, unknown>);

vi.mock("./context", () => ({
  getAudioContext: () => ctx,
  getOutput: () => ({}),
}));
vi.mock("./piano", () => ({ pianoSampleFor: () => null }));

Object.assign(ctx, {
  currentTime: 0,
  createGain: () => ({ gain: param(), connect: vi.fn() }),
  createBiquadFilter: () => ({ type: "", frequency: param(), connect: vi.fn() }),
  createPeriodicWave: () => ({}),
  createOscillator: () => {
    const o = {
      frequency: param(),
      setPeriodicWave: vi.fn(),
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    created.oscillators.push(o);
    return o;
  },
});

const { startDrone } = await import("./synth");

describe("startDrone", () => {
  it("is one oscillator at the exact pitch, so the drone itself never beats", () => {
    created.oscillators.length = 0;
    const stop = startDrone(57); // A3
    expect(created.oscillators).toHaveLength(1);
    expect(created.oscillators[0].frequency.value).toBeCloseTo(220, 6);
    stop();
  });
});
