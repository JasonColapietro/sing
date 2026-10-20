import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { MIC_ENDED_MESSAGE, watchMicEnd } from "./mic";
import { focusIfDropped } from "./mic-focus";

function microphone(readyState: MediaStreamTrackState = "live") {
  // A track is an EventTarget: an unplugged mic fires "ended" on it.
  const track = Object.assign(new EventTarget(), { kind: "audio", readyState });
  const stream = { getAudioTracks: () => [track] } as unknown as MediaStream;
  return { track, stream };
}

describe("a microphone that stops mid-session", () => {
  it("reports the track ending, once", () => {
    const mic = microphone();
    const onEnded = vi.fn();
    watchMicEnd(mic.stream, onEnded);
    mic.track.dispatchEvent(new Event("ended"));
    mic.track.dispatchEvent(new Event("ended"));
    expect(onEnded).toHaveBeenCalledOnce();
  });

  it("stays quiet once the room has let the stream go itself", () => {
    const mic = microphone();
    const onEnded = vi.fn();
    const unwatch = watchMicEnd(mic.stream, onEnded);
    unwatch();
    mic.track.dispatchEvent(new Event("ended"));
    expect(onEnded).not.toHaveBeenCalled();
  });

  it("reports a device that vanished before the room started listening, after setup", async () => {
    const mic = microphone("ended");
    const onEnded = vi.fn();
    watchMicEnd(mic.stream, onEnded);
    // Not during the call: the room is still storing the stream it got.
    expect(onEnded).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(onEnded).toHaveBeenCalledOnce();
  });

  it("names the microphone, not the singer's volume, as the cause", () => {
    // The range test used to say "too quietly to measure" to a dead mic.
    expect(MIC_ENDED_MESSAGE).toMatch(/^The microphone stopped\./);
    expect(MIC_ENDED_MESSAGE).toContain("connected");
    expect(MIC_ENDED_MESSAGE).not.toMatch(/quiet|louder|closer/);
  });

  it("stops every listening room and says so, through both mic hooks", () => {
    for (const file of ["use-pitch.ts", "use-analyser.ts"]) {
      const src = readFileSync(join(__dirname, file), "utf8");
      const watch = src.slice(src.indexOf("watchMicEnd(stream, () => {"));
      expect(watch.length, file).toBeGreaterThan(0);
      expect(watch, file).toMatch(
        /^watchMicEnd\(stream, \(\) => \{\s*if \(streamRef\.current !== stream\) return;\s*stop\(\);\s*setError\(MIC_ENDED_MESSAGE\);/,
      );
      // Only the mic going away reaches the room's onMicEnded, after the
      // hook has stopped; a device change's own stop() never does.
      if (file === "use-pitch.ts") {
        expect(watch).toMatch(/^[^}]*setError\(MIC_ENDED_MESSAGE\);\s*onMicEndedRef\.current\?\.\(\);/);
        const reopen = src.slice(src.indexOf("Reopens the stream when the singer picks"));
        expect(reopen).not.toContain("onMicEnded");
      }
      // The room's own Stop lets go of the watch before it stops the tracks.
      const stop = src.slice(src.indexOf("const stop = useCallback"), src.indexOf("const start = useCallback"));
      expect(stop.indexOf("unwatchRef.current();"), file).toBeGreaterThan(-1);
      expect(stop.indexOf("unwatchRef.current();"), file).toBeLessThan(stop.indexOf(".stop())"));
    }
  });
});

describe("focus once the microphone is on", () => {
  const control = (isConnected = true) =>
    ({ isConnected, focus: vi.fn() }) as unknown as HTMLElement & { focus: ReturnType<typeof vi.fn> };
  const body = { isConnected: true } as unknown as HTMLElement;

  it("moves focus to the live control when the pressed button went with the gate", () => {
    const stop = control();
    expect(focusIfDropped(stop, { activeElement: body, body })).toBe(true);
    expect(stop.focus).toHaveBeenCalledWith({ preventScroll: true });
    // A removed element can still be reported as active for a moment.
    const again = control();
    expect(focusIfDropped(again, { activeElement: control(false), body })).toBe(true);
    expect(focusIfDropped(control(), { activeElement: null, body })).toBe(true);
  });

  it("leaves focus where the singer already put it", () => {
    const stop = control();
    expect(focusIfDropped(stop, { activeElement: control(), body })).toBe(false);
    expect(stop.focus).not.toHaveBeenCalled();
  });

  it("does nothing without a control on the page", () => {
    expect(focusIfDropped(null, { activeElement: body, body })).toBe(false);
    expect(focusIfDropped(control(false), { activeElement: body, body })).toBe(false);
  });
});

describe("the rooms that gate the mic", () => {
  const read = (file: string) => readFileSync(join(__dirname, "../..", file), "utf8");

  it("hand focus to their live control once the gate's button is gone", () => {
    // Keyboard focus fell to <body> in each of these as the mic started.
    expect(read("components/studio/studio-client.tsx")).toMatch(
      /if \(listening\) focusIfDropped\(stopRef\.current\?\.querySelector\("button"\)\);/,
    );
    expect(read("components/recorder/recorder-page.tsx")).toMatch(
      /if \(micState === "ready"\) focusIfDropped\(deckRef\.current\?\.querySelector\("button"\)\);/,
    );
    const meter = read("components/range/pitch-meter.tsx");
    expect(meter).toMatch(/if \(listening\) focusIfDropped\(liveRef\.current\);/);
    expect(meter).toMatch(/ref=\{liveRef\}\s*tabIndex=\{-1\}\s*role="group"\s*aria-label="Live pitch meter"/);
    expect(read("components/range/range-test.tsx")).toContain("focusIfDropped(stageHeadingRef.current);");
  });

  it("close the session when the mic stops without their Stop button", () => {
    // The studio clock kept counting dead-mic time as practice.
    const studio = read("components/studio/studio-client.tsx");
    expect(studio).toContain("usePitch({ onMicEnded: closeSession })");
    const close = studio.slice(studio.indexOf("const closeSession = useCallback"));
    expect(close).toMatch(/^const closeSession = useCallback\(\(\) => \{\s*const result = finishSession\(\);/);
    // Not on every drop of `listening`: a device change reopens the stream
    // through a brief stop, and that must not cut the session in two.
    expect(studio).not.toMatch(/\}, \[listening, practiceClock, finishSession\]\);/);
    expect(read("components/analyze/analyze-client.tsx")).toMatch(
      /useEffect\(\(\) => \{\s*if \(listening \|\| !error\) return;\s*flush\(\);\s*\}, \[listening, error, flush\]\);/,
    );
    // The recorder leaves REC for the gate's Try again, keeping any take.
    const recorder = read("components/recorder/recorder-page.tsx");
    expect(recorder).toContain("createRecorderMic(openMic, getAudioContext, { onEnded: onMicEnded })");
    const ended = recorder.slice(recorder.indexOf("const onMicEnded = useCallback"), recorder.indexOf("const enableMic = useCallback"));
    expect(ended).toContain("rec.stop();");
    expect(ended).toContain('setMicState("blocked");');
    expect(ended).toContain("MIC_ENDED_MESSAGE");
    // A take whose recorder the browser already stopped with its last track
    // is still mid-save until finalizeTake runs, and is told it was kept.
    expect(ended).toContain("const wasRecording = rec !== null;");
    // A device gone between the prompt and setup leaves the gate up, not REC
    // on the released stream's analyser.
    const enable = recorder.slice(recorder.indexOf("const enableMic = useCallback"));
    expect(enable.indexOf("if (session.getStream() === null) return;")).toBeGreaterThan(-1);
    expect(enable.indexOf("if (session.getStream() === null) return;")).toBeLessThan(enable.indexOf('setMicState("ready");'));
  });
});

