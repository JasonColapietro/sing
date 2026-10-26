import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import type { Song, GuidePass } from "./types";
import type { SessionSummaryData } from "./lib";

// Drive the real component's handlers and clock without mounting canvas or a
// microphone. Hook storage survives renders; committed effects publish the
// same refs the audio callbacks consume in the browser.
const h = vi.hoisted(() => ({
  slots: [] as unknown[], cursor: 0, effects: [] as Array<() => void>,
  cleanups: [] as Array<() => void>, now: 0,
  groups: [] as Array<{ node: object; cancel: ReturnType<typeof vi.fn> }>,
  tones: [] as Array<{ midi: number; dur: number; at: number; out?: object; time: number }>,
  clicks: [] as Array<{ at: number; out?: object }>,
  log: vi.fn(() => ({ xpGained: 0, newAchievements: [] })),
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState(initial: unknown) {
    const i = h.cursor++;
    if (!(i in h.slots)) h.slots[i] = typeof initial === "function" ? initial() : initial;
    return [h.slots[i], (value: unknown) => {
      h.slots[i] = typeof value === "function" ? value(h.slots[i]) : value;
    }];
  },
  useRef(initial: unknown) { const i = h.cursor++; return h.slots[i] ??= { current: initial }; },
  useMemo(fn: () => unknown) { h.cursor++; return fn(); },
  useCallback(fn: unknown) { h.cursor++; return fn; },
  useLayoutEffect(fn: () => void) { h.cursor++; h.effects.push(fn); },
  useEffect(fn: () => void | (() => void), deps: unknown[]) {
    const i = h.cursor++;
    if (!(i in h.slots) || deps?.some((d, j) => d !== (h.slots[i] as unknown[])[j])) {
      h.slots[i] = deps;
      h.effects.push(() => { const cleanup = fn(); if (cleanup) h.cleanups.push(cleanup); });
    }
  },
}));
vi.mock("@/lib/audio/context", () => ({ audioNow: () => h.now, getAudioContext: () => ({ sampleRate: 48000 }) }));
vi.mock("@/lib/audio/latency", () => ({ liveLags: () => ({ scoreLag: 0 }) }));
vi.mock("@/lib/audio/synth", () => ({
  createToneGroup() { const group = { node: {}, cancel: vi.fn() }; h.groups.push(group); return group; },
  playTone(midi: number, opts: { dur: number; at: number; out?: object }) { h.tones.push({ midi, ...opts, time: h.now }); },
  clickAt(at: number, _accent: boolean, out?: object) { h.clicks.push({ at, out }); },
}));
vi.mock("@/lib/progress", () => ({ logSession: h.log }));
import { SongPlayer } from "./song-player";

let rafs: Map<number, FrameRequestCallback>, timers: Map<number, () => void>, id: number;
const fixture = {
  id: "test-song", title: "Test song", bpm: 60, beatsPerBar: 4,
  defaultKeyRootMidi: 60, form: "full", defaultLoops: 1,
  notes: Array.from({ length: 4 }, (_, i) => ({ midi: 60, startBeat: i, durBeats: 1, lyric: "la" })),
} as Song;

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const el = node as ReactElement<Record<string, unknown>>;
  return [el, ...elements(el.props.children as ReactNode)];
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (node && typeof node === "object" && "props" in node) return text((node as ReactElement<{ children?: ReactNode }>).props.children);
  return "";
}
function mount(pass: GuidePass = "guided", song = fixture, listening = true) {
  let tree: ReactNode;
  let summary: SessionSummaryData | undefined;
  const pitch = { listening, start: async () => { pitch.listening = true; render(); return true; }, latest: { current: { freq: 261.625565, volume: 1 } }, getStream: () => null } as unknown as UsePitchResult;
  const render = () => {
    h.cursor = 0; h.effects = [];
    tree = SongPlayer({ song, pitch, range: {}, pass, mode: "performance", onPassChange: (next) => { pass = next; }, onModeChange: () => {}, onFinish: (s) => { summary = s; }, onExit: () => {} });
    h.effects.forEach((fn) => fn());
  };
  render();
  const transport = () => elements(tree).find((el) => typeof el.type === "function" && el.type.name === "Transport")!;
  return {
    render,
    toggle() { (transport().props.onToggle as () => void)(); render(); },
    restart() { (transport().props.onRestart as () => void)(); render(); },
    click(label: string) {
      const el = elements(tree).find((el) => el.props.onClick && (el.props["aria-label"] === label || text(el.props.children as ReactNode).trim() === label));
      expect(el, `button ${label}`).toBeDefined();
      const result = (el!.props.onClick as () => void | Promise<void>)(); render(); return result;
    },
    phase: () => transport().props.phase,
    text: () => text(tree),
    summary: () => summary,
    unmount: () => h.cleanups.forEach((fn) => fn()),
  };
}
function advance(target: number) {
  while (h.now < target - 1e-8) {
    h.now = Math.min(target, h.now + 0.01);
    [...timers.values()].forEach((fn) => fn());
    const pending = [...rafs.values()]; rafs.clear(); pending.forEach((fn) => fn(h.now * 1000));
  }
}
beforeEach(() => {
  h.slots = []; h.effects = []; h.cleanups = []; h.cursor = 0; h.now = 0;
  h.groups = []; h.tones = []; h.clicks = []; h.log.mockClear();
  rafs = new Map(); timers = new Map(); id = 0;
  vi.spyOn(performance, "now").mockImplementation(() => h.now * 1000);
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { rafs.set(++id, fn); return id; });
  vi.stubGlobal("cancelAnimationFrame", (key: number) => rafs.delete(key));
  vi.stubGlobal("setInterval", (fn: () => void) => { timers.set(++id, fn); return id; });
  vi.stubGlobal("clearInterval", (key: number) => timers.delete(key));
  vi.stubGlobal("document", { addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal("window", { addEventListener() {}, removeEventListener() {} });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("song pass changes", () => {
  it("restarts a paused Listen pass before scoring, without logging its unheard notes", () => {
    const player = mount("listen"); player.toggle(); advance(6.35); player.toggle();
    expect(player.text()).toMatch(/switching.*listen.*restarts/i);
    player.click("Sing along");
    expect(player.phase()).toBe("running");
    expect(h.log).not.toHaveBeenCalled();
    advance(14.7);
    expect(player.summary()?.score).toBe(100);
    expect(player.summary()?.judgments).toEqual({ perfect: 4, great: 0, good: 0, miss: 0 });
    expect(h.groups.at(-1)?.cancel).toHaveBeenCalled();
  });
  it("starts only one scored run when enabling the microphone from a paused Listen pass", async () => {
    const player = mount("listen", fixture, false); player.toggle(); advance(6.35); player.toggle();
    await player.click("Enable microphone and restart"); player.render();
    expect(h.groups).toHaveLength(2);
    expect(player.phase()).toBe("running"); advance(14.7);
    expect(player.summary()?.pass).toBe("guided");
    expect(player.summary()?.score).toBe(100);
  });
  it("changes the pass before Play without starting audio", () => {
    const player = mount("listen"); player.click("Sing along");
    expect(player.phase()).toBe("idle"); expect(h.groups).toHaveLength(0);
  });
  it("restarts into Listen without retaining scored results", () => {
    const player = mount(); player.toggle(); advance(6.35); player.toggle(); player.click("Listen");
    expect(player.phase()).toBe("running"); advance(14.7);
    expect(player.summary()?.listenMode).toBe(true);
    expect(player.summary()?.score).toBeUndefined();
  });
  it("keeps scored pass changes paused and invalidates mastery even after returning to solo", () => {
    const player = mount("solo"); player.toggle(); advance(6.35); player.toggle();
    player.click("Sing along"); player.click("On your own");
    expect(player.phase()).toBe("paused"); player.toggle(); advance(8.3);
    expect(player.summary()?.score).toBe(100);
    expect(player.summary()?.mastered).toBe(false);
  });
});
describe("song scheduled audio", () => {
  it.each(["pause", "exit", "restart", "unmount"])("cancels count-in audio on %s", (action) => {
    const player = mount(); player.toggle();
    const group = h.groups[0];
    expect(group).toBeDefined();
    expect(h.clicks).toHaveLength(4);
    expect(h.clicks.every((click) => click.out === group.node)).toBe(true);
    expect(h.tones.every((tone) => tone.out === group.node)).toBe(true);
    if (action === "pause") player.toggle();
    if (action === "exit") player.click("Exit practice");
    if (action === "restart") player.restart();
    if (action === "unmount") player.unmount();
    expect(group.cancel).toHaveBeenCalled();
  });
  it("resumes the remainder of a held note, then reschedules the next note", () => {
    const song = { ...fixture, notes: [{ midi: 60, startBeat: 0, durBeats: 4, lyric: "held" }, { midi: 62, startBeat: 4, durBeats: 1, lyric: "next" }] };
    const player = mount("guided", song); player.toggle(); advance(5.15); player.toggle();
    const oldGroup = h.groups[0]; expect(oldGroup).toBeDefined(); expect(oldGroup.cancel).toHaveBeenCalled();
    advance(15.15); const before = h.tones.length; player.toggle();
    const resumed = h.tones.slice(before);
    expect(resumed).toHaveLength(1);
    expect(resumed[0].dur).toBeCloseTo(2.68, 2);
    expect(resumed[0].at).toBeCloseTo(0);
    expect(resumed[0].out).toBe(h.groups[1].node);
    advance(18.2);
    expect(h.tones.filter((t) => t.midi === 62).at(-1)?.out).toBe(h.groups[1].node);
  });
  it("reschedules a future note cancelled inside the lookahead window", () => {
    const player = mount(); player.toggle(); advance(5); player.toggle();
    advance(10); const before = h.tones.length; player.toggle();
    expect(h.tones.slice(before).some((t) => Math.abs(t.at - 0.15) < 0.001 && Math.abs(t.dur - 0.92) < 0.001)).toBe(true);
  });
  it("preserves the remaining count-in on resume", () => {
    const player = mount(); player.toggle(); advance(1.4); player.toggle();
    advance(10); const before = h.clicks.length; player.toggle();
    const clicks = h.clicks.slice(before);
    expect(clicks).toHaveLength(2);
    expect(clicks[0].at).toBeCloseTo(10.75);
    expect(clicks[1].at).toBeCloseTo(11.75);
  });
});
