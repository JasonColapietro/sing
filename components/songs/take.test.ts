import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_TAKE_SEC, releaseTake, songTakeName, startTakeRecorder, type SongTake } from "./take";

/** Just enough MediaRecorder to drive the take lifecycle. */
class FakeRecorder {
  static supported = true;
  static isTypeSupported(type: string) {
    return type === "audio/webm";
  }
  state: "inactive" | "recording" | "paused" = "inactive";
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: ((e: Event) => void) | null = null;
  constructor(_stream: unknown, opts?: { mimeType?: string }) {
    if (!FakeRecorder.supported) throw new Error("NotSupportedError");
    this.mimeType = opts?.mimeType ?? "";
  }
  start() {
    this.state = "recording";
  }
  pause() {
    this.state = "paused";
  }
  resume() {
    this.state = "recording";
  }
  stop() {
    this.ondataavailable?.({ data: new Blob(["voice"], { type: this.mimeType }) });
    this.state = "inactive";
    this.onstop?.(new Event("stop"));
  }
}

const song = { id: "silent-night", title: "Silent Night" };
const stream = {} as MediaStream;
let now = 0;

beforeEach(() => {
  now = 0;
  FakeRecorder.supported = true;
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("song takes", () => {
  it("hands over the take when finished, in the recorder's own format", () => {
    const onTake = vi.fn();
    const rec = startTakeRecorder(stream, song, onTake)!;
    now = 12_300;
    rec.finish();
    const take = onTake.mock.calls[0][0] as SongTake;
    expect(take.songId).toBe("silent-night");
    expect(take.mimeType).toBe("audio/webm");
    expect(take.durationSec).toBe(12.3);
    expect(take.url).toMatch(/^blob:/);
    releaseTake(take);
  });

  it("does not count time spent paused", () => {
    const onTake = vi.fn();
    const rec = startTakeRecorder(stream, song, onTake)!;
    now = 5_000;
    rec.pause();
    now = 65_000; // a minute away from the song
    rec.resume();
    now = 70_000;
    rec.finish();
    expect((onTake.mock.calls[0][0] as SongTake).durationSec).toBe(10);
  });

  it("throws a discarded take away, e.g. on restart", () => {
    const onTake = vi.fn();
    startTakeRecorder(stream, song, onTake)!.discard();
    expect(onTake).toHaveBeenCalledWith(null);
  });

  it("delivers once, however many times it is stopped", () => {
    const onTake = vi.fn();
    const rec = startTakeRecorder(stream, song, onTake)!;
    rec.finish();
    rec.finish();
    rec.discard();
    expect(onTake).toHaveBeenCalledTimes(1);
  });

  it("stops a forgotten rehearsal at the cap", () => {
    const onTake = vi.fn();
    startTakeRecorder(stream, song, onTake);
    now = MAX_TAKE_SEC * 1000;
    vi.advanceTimersByTime(MAX_TAKE_SEC * 1000);
    expect((onTake.mock.calls[0][0] as SongTake).durationSec).toBe(MAX_TAKE_SEC);
  });

  it("does not let a long pause use up the cap", () => {
    const onTake = vi.fn();
    const rec = startTakeRecorder(stream, song, onTake)!;
    now = 60_000;
    vi.advanceTimersByTime(60_000);
    rec.pause();
    // Away far longer than the whole cap.
    now = 60_000 + 2 * MAX_TAKE_SEC * 1000;
    vi.advanceTimersByTime(2 * MAX_TAKE_SEC * 1000);
    expect(onTake).not.toHaveBeenCalled();
    rec.resume();
    // The remaining budget is what the cap now allows.
    now += (MAX_TAKE_SEC - 60) * 1000 - 1;
    vi.advanceTimersByTime((MAX_TAKE_SEC - 60) * 1000 - 1);
    expect(onTake).not.toHaveBeenCalled();
    now += 1;
    vi.advanceTimersByTime(1);
    expect((onTake.mock.calls[0][0] as SongTake).durationSec).toBe(MAX_TAKE_SEC);
  });

  it("lets the song play without a take where recording isn't possible", () => {
    FakeRecorder.supported = false;
    expect(startTakeRecorder(stream, song, vi.fn())).toBeNull();
    vi.stubGlobal("MediaRecorder", undefined);
    expect(startTakeRecorder(stream, song, vi.fn())).toBeNull();
  });

  it("names a saved take after the song and the day", () => {
    expect(songTakeName("Silent Night", new Date(2026, 8, 23))).toBe("Silent Night — Sep 23");
  });
});
