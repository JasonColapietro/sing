import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import { createPlaybackRecovery } from "./playback-recovery";
import { createPlaybackSeek } from "./playback-seek";

// Execute the real component callbacks with a deterministic audio/timer clock.
// This covers the cancellation boundaries without opening a browser microphone.
const source = ts.createSourceFile("recorder-page.tsx", readFileSync(new URL("./recorder-page.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function callback(name: string, bindings: Record<string, unknown>): (...args: unknown[]) => unknown {
  let expression: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name && node.initializer && ts.isCallExpression(node.initializer)) {
      expression = node.initializer.arguments[0];
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!expression) throw new Error(`Missing callback ${name}`);
  const js = ts.transpileModule(`(${expression.getText(source)})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return vm.runInNewContext(js, bindings);
}

function room() {
  const clicks: Array<{ at: number; out?: { muted: boolean } }> = [];
  const env: Record<string, unknown> = {
    micState: "ready", recPhase: "idle", countIn: true,
    playbackRecovery: createPlaybackRecovery(vi.fn()),
    countTimerRef: { current: 0 }, countGroupRef: { current: null },
    mountedRef: { current: true }, recorderRef: { current: null }, audioRef: { current: null },
    COUNT_IN_BEAT: 0.5, MIC_ENDED_MESSAGE: "Microphone stopped",
    audioNow: () => 0,
    createToneGroup: () => {
      const node = { muted: false };
      return { node, cancel() { node.muted = true; } };
    },
    clickAt: (at: number, _accent: boolean, out?: { muted: boolean }) => clicks.push({ at, out }),
    window: { setInterval: () => 1, clearInterval: vi.fn() },
    setRecPhase: (value: unknown) => { env.recPhase = typeof value === "function" ? value(env.recPhase) : value; },
    setCountBeat: vi.fn(), beginCapture: vi.fn(), setAnalyser: vi.fn(), setMicState: vi.fn(), setMicError: vi.fn(),
  };
  return { env, clicks };
}

describe("recorder count-in cancellation", () => {
  it.each(["cancel", "microphone ended"])("silences scheduled clicks when %s interrupts count-in", (reason) => {
    const { env, clicks } = room();
    const toggle = callback("toggleRecord", env);
    toggle();
    expect(clicks.map((click) => click.at)).toEqual([0.15, 0.65, 1.15, 1.65]);
    if (reason === "cancel") toggle();
    else callback("onMicEnded", env)();
    expect(clicks.every((click) => click.out?.muted === true)).toBe(true);
    expect(env.recPhase).toBe("idle");
  });
});

it("releases scheduled count-in audio and pending seeks when the recorder exits", () => {
  let expression: ts.Expression | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === "useEffect" && node.arguments[0]?.getText(source).includes("mountedRef.current = false")) expression = node.arguments[0];
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!expression) throw new Error("Missing recorder teardown effect");
  const { env, clicks } = room();
  const audio = Object.assign(new EventTarget(), { readyState: 0, currentTime: 0, pause: vi.fn() });
  const seek = createPlaybackSeek();
  Object.assign(env, {
    tickRef: { current: 0 }, micRef: { current: null }, urlRef: { current: null },
    audioRef: { current: audio }, playbackSeek: seek,
  });
  const effect = vm.runInNewContext(ts.transpileModule(`(${expression.getText(source)})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, env);
  const cleanup = effect();
  callback("toggleRecord", env)();
  seek.seek(audio as unknown as HTMLAudioElement, 10);
  cleanup();
  audio.dispatchEvent(new Event("loadedmetadata"));
  expect(audio.currentTime).toBe(0);
  expect(clicks.every((click) => click.out?.muted === true)).toBe(true);
});

class AudioDouble extends EventTarget {
  readyState = 0;
  currentTime = 0;
  paused = true;
  set src(_value: string) { this.currentTime = 0; this.readyState = 0; }
  pause() { this.paused = true; }
  play() { this.paused = false; return Promise.resolve(); }
}

describe("recorder playback callback wiring", () => {
  it.each(["another take", "the same take reloaded"])("does not carry an old seek into %s", (next) => {
    const audio = new AudioDouble();
    const a = { id: "a", durationSec: 20, blob: new Blob(["a"]) };
    const b = { ...a, id: "b" };
    const env: Record<string, unknown> = {
      ensureAudio: () => audio,
      playbackSeek: createPlaybackSeek(),
      playbackRecovery: createPlaybackRecovery(vi.fn()),
      playbackErrorId: null, setPlaybackErrorId: vi.fn(),
      urlRef: { current: null }, loadedIdRef: { current: null }, loadedId: null,
      URL: { createObjectURL: () => "blob:test", revokeObjectURL: vi.fn() },
      setLoadedId: (id: string) => { env.loadedId = id; },
      setPositionSec: vi.fn(), setSelectedId: vi.fn(),
    };
    env.loadTake = callback("loadTake", env);
    env.playTake = callback("playTake", env);
    callback("seekTake", env)(a, 0.5);
    if (next === "another take") callback("togglePlay", env)(b);
    else (env.loadTake as (take: unknown) => void)(a);
    audio.dispatchEvent(new Event("loadedmetadata"));
    expect(audio.currentTime).toBe(0);
    expect(env.setPositionSec).not.toHaveBeenCalledWith(10);
  });
});

it("returns the actual recorder controls to idle on playback failure and reloads on retry", async () => {
  class FailingAudio extends EventTarget {
    paused = true;
    ended = false;
    currentTime = 0;
    readyState = 0;
    error: { code: number } | null = null;
    loads = 0;
    failNext = true;
    set src(_value: string) { this.loads++; this.error = null; }
    pause() { this.paused = true; this.dispatchEvent(new Event("pause")); }
    play() {
      this.paused = false;
      this.dispatchEvent(new Event("play"));
      if (this.failNext) {
        this.failNext = false;
        this.error = { code: 4 };
        this.dispatchEvent(new Event("error"));
        return Promise.reject(new Error("NotSupportedError"));
      }
      return Promise.resolve();
    }
  }
  const env: Record<string, unknown> = {
    Audio: FailingAudio, mountedRef: { current: true }, audioRef: { current: null },
    playbackSeek: createPlaybackSeek(), urlRef: { current: null }, loadedIdRef: { current: null },
    loadedId: null, isPlaying: false, playbackErrorId: null,
    URL: { createObjectURL: () => "blob:test", revokeObjectURL: vi.fn() },
    setLoadedId: (id: string) => { env.loadedId = id; },
    setIsPlaying: (value: boolean) => { env.isPlaying = value; },
    setPlaybackErrorId: (id: string | null) => { env.playbackErrorId = id; },
    setPositionSec: vi.fn(), setSelectedId: vi.fn(),
  };
  env.playbackRecovery = createPlaybackRecovery((id) => { env.isPlaying = false; env.playbackErrorId = id; });
  env.ensureAudio = callback("ensureAudio", env);
  env.loadTake = callback("loadTake", env);
  env.playTake = callback("playTake", env);
  const toggle = callback("togglePlay", env);
  const take = { id: "a", durationSec: 20, blob: new Blob(["a"]) };
  toggle(take);
  await Promise.resolve();
  expect(env.isPlaying).toBe(false);
  expect(env.playbackErrorId).toBe("a");
  toggle(take);
  await Promise.resolve();
  expect(env.isPlaying).toBe(true);
  expect(env.playbackErrorId).toBeNull();
  expect((env.audioRef as { current: FailingAudio }).current.loads).toBe(2);
});
