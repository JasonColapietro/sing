import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Execute each real game's hooks and effects without a browser or a microphone.
// Unlike the server-markup checks, this drives its actual animation loop.
const hooks = await vi.hoisted(async () => (await import("@/tests/hooks-harness")).createHooks());
vi.mock("react", async (original) => hooks.mockReact(await original<typeof import("react")>()));

const fixture = vi.hoisted(() => ({
  record: vi.fn(),
  restartClock: vi.fn(),
  playTone: vi.fn(() => 0),
  playSequence: vi.fn(() => 0),
  progress: { range: {} },
  pitch: {
    listening: true,
    error: null as string | null,
    latest: { current: { freq: null, t: 0 } },
    start: vi.fn(async () => true),
    stop: vi.fn(),
  },
}));
vi.mock("@/lib/audio/use-pitch", () => ({ usePitch: () => fixture.pitch }));
vi.mock("@/lib/audio/devices", () => ({ useAudioPrefs: () => ({ monitoring: "headphones" }) }));
vi.mock("@/lib/audio/synth", () => ({ playTone: fixture.playTone, playSequence: fixture.playSequence }));
vi.mock("@/lib/progress", () => ({ useProgress: () => fixture.progress }));
vi.mock("./session", () => {
  const session = { results: [], done: false, record: fixture.record, round: 1, score: 0, streak: 0 };
  return {
    useEarSession: () => session,
    useActiveStart: () => [0, fixture.restartClock],
    GameShell: "game-shell", ShellButton: "shell-button",
    ShellBar: "shell-bar", RoundFeedback: "feedback", StepDone: "step-done",
  };
});
vi.mock("@/components/ui", () => ({ MicGate: "mic-gate" }));

import { PitchMatchGame } from "./pitch-match-game";
import { MelodyEchoGame } from "./melody-echo-game";
import { NoteCatcherGame } from "./note-catcher-game";
import { NoteCatcherCanvas } from "./note-catcher-canvas";
import type { CatcherView } from "./note-catcher-canvas";

let now = 0;
let nextFrame = 1;
let frames = new Map<number, FrameRequestCallback>();
const noop = () => {};

function find(
  node: ReactNode,
  type: unknown,
  matches: (props: Record<string, unknown>) => boolean = () => true,
): ReactElement<Record<string, unknown>> | undefined {
  if (!node || typeof node !== "object" || !("props" in node)) return;
  const element = node as ReactElement<{ children?: ReactNode }>;
  if (element.type === type && matches(element.props)) return element as ReactElement<Record<string, unknown>>;
  const children = element.props.children;
  for (const child of Array.isArray(children) ? children.flat(Infinity) : [children]) {
    const found = find(child, type, matches);
    if (found) return found;
  }
}

function runFor(ms: number, render: () => ReactElement) {
  for (let passed = 0; passed < ms; passed += 16) {
    now += 16;
    vi.advanceTimersByTime(16);
    const due = frames;
    frames = new Map();
    due.forEach((callback) => callback(now));
    render();
  }
}

beforeEach(() => {
  hooks.reset(); vi.clearAllMocks(); vi.useFakeTimers();
  fixture.pitch.listening = true; fixture.pitch.error = null;
  now = 0; nextFrame = 1; frames = new Map();
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("window", Object.assign(new EventTarget(), { setTimeout, clearTimeout }));
  vi.stubGlobal("document", Object.assign(new EventTarget(), { visibilityState: "visible" }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrame++; frames.set(id, callback); return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("a microphone disconnected during an ear game", () => {
  it.each([
    ["Pitch match", PitchMatchGame],
    ["Melody echo", MelodyEchoGame],
    ["Note catcher", NoteCatcherGame],
  ] as const)("%s cannot score or finish behind the retry gate", (_name, Game) => {
    // Call the component itself so its hooks, rather than JSX creation, run.
    const draw = () => hooks.render(() => Game({ difficulty: "easy", pitch: fixture.pitch as never, onExit: noop, onComplete: noop }));
    draw();
    runFor(500, draw);
    fixture.pitch.listening = false;
    fixture.pitch.error = "The microphone stopped.";
    expect(find(draw(), "mic-gate")).toBeDefined();
    runFor(90_000, draw);
    expect(fixture.record).not.toHaveBeenCalled();
    expect(find(draw(), "mic-gate")).toBeDefined();
  });

  it.each([
    ["Pitch match", PitchMatchGame],
    ["Melody echo", MelodyEchoGame],
  ] as const)("%s gives the replayed round a fresh answer window on reconnect", (_name, Game) => {
    const draw = () => hooks.render(() => Game({ difficulty: "easy", pitch: fixture.pitch as never, onExit: noop, onComplete: noop }));
    draw(); runFor(500, draw);
    fixture.pitch.listening = false; draw(); runFor(10_000, draw);
    fixture.pitch.listening = true;
    expect(find(draw(), "mic-gate")).toBeUndefined();
    runFor(500, draw);
    expect(fixture.record).not.toHaveBeenCalled();
    // A reconnected microphone still uses the normal answer deadline.
    runFor(10_000, draw);
    expect(fixture.record).toHaveBeenCalledExactlyOnceWith(false);
  });

  it.each([
    ["Pitch match", PitchMatchGame],
    ["Melody echo", MelodyEchoGame],
  ] as const)("%s ignores answer/replay shortcuts while the retry gate owns the keyboard", (_name, Game) => {
    const draw = () => hooks.render(() => Game({ difficulty: "easy", pitch: fixture.pitch as never, onExit: noop, onComplete: noop }));
    draw(); runFor(500, draw);
    fixture.pitch.listening = false; draw();
    const soundsBefore = fixture.playTone.mock.calls.length + fixture.playSequence.mock.calls.length;
    for (const key of ["Enter", "r", "R"]) {
      window.dispatchEvent(Object.assign(new Event("keydown"), { key }));
      draw();
    }
    expect(fixture.record).not.toHaveBeenCalled();
    expect(fixture.playTone.mock.calls.length + fixture.playSequence.mock.calls.length).toBe(soundsBefore);
  });

  it("reconnects Note catcher without dealing over the existing run", async () => {
    const draw = () => hooks.render(() => NoteCatcherGame({ difficulty: "easy", pitch: fixture.pitch as never, onExit: noop, onComplete: noop }));
    const view = () => find(draw(), NoteCatcherCanvas)!.props.viewRef as { current: CatcherView };
    draw(); runFor(500, draw);
    const before = view().current;
    fixture.pitch.listening = false;
    const gate = find(draw(), "mic-gate")!;
    runFor(10_000, draw);
    (gate.props.onEnable as () => void)();
    await Promise.resolve();
    fixture.pitch.listening = true;
    const reconnected = draw();
    expect(view().current.targets).toBe(before.targets);
    expect(view().current.state.elapsed).toBe(before.state.elapsed);
    const control = find(reconnected, "shell-button", (props) => props.children === "Resume")!;
    (control.props.onClick as () => void)(); draw(); runFor(100, draw);
    expect(view().current.state.elapsed).toBeGreaterThan(before.state.elapsed);
    expect(view().current.state.elapsed).toBeLessThan(before.state.elapsed + 200);
    expect(fixture.record).not.toHaveBeenCalled();
  });
});
