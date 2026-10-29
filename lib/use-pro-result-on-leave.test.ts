import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The hook is two React calls around a timer. Rendering it would need a DOM
// this suite does not install, so React is stood in for: each call hands
// back its effect, and the test runs it and its cleanup the way React would.
const effects: (() => void | (() => void))[] = [];
const ref: { current: number | null } = { current: null };
vi.mock("react", () => ({
  useRef: () => ref,
  useEffect: (fn: () => void | (() => void)) => {
    effects.push(fn);
  },
}));

const emit = vi.fn();
vi.mock("./pro-signal", () => ({ emitProResult: () => emit() }));

import { useProResultOnLeave } from "./use-pro-result-on-leave";

const body = { style: { overflow: "" } };

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("document", { body });
  effects.length = 0;
  ref.current = null;
  body.style.overflow = "";
  emit.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/**
 * Mounts the hook and returns its cleanup (what React runs on the way out).
 * Named as a hook because it calls one, which is what the lint rule checks.
 */
function useMount(active: boolean): (() => void) | undefined {
  useProResultOnLeave(active);
  const cleanup = effects[effects.length - 1]();
  return typeof cleanup === "function" ? cleanup : undefined;
}

describe("a page-style result tells the Pro moment when the singer leaves it", () => {
  it("sends nothing while the result is on screen, and one signal after it goes", () => {
    const leave = useMount(true);
    vi.runAllTimers();
    expect(emit).not.toHaveBeenCalled();
    leave?.();
    // A tick later, so a route change has moved the address first.
    expect(emit).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("sends nothing for a result that offers nothing", () => {
    expect(useMount(false)).toBeUndefined();
    vi.runAllTimers();
    expect(emit).not.toHaveBeenCalled();
  });

  it("sends nothing when the way out was straight into another session", () => {
    const leave = useMount(true);
    leave?.();
    // The next session's shell takes the scroll lock in the same commit.
    body.style.overflow = "hidden";
    vi.runAllTimers();
    expect(emit).not.toHaveBeenCalled();
  });

  it("sends nothing for React's development-only rehearsal unmount", () => {
    const rehearsal = useMount(true);
    rehearsal?.();
    // React runs the effect again at once; that run cancels the rehearsal's.
    useMount(true);
    vi.runAllTimers();
    expect(emit).not.toHaveBeenCalled();
  });
});

describe("where the page-style results use it", () => {
  const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

  it("replaces the signal each of them sent as the result appeared", () => {
    for (const [file, call] of [
      ["components/warmups/session-summary.tsx", "useProResultOnLeave(true);"],
      ["components/songs/session-summary.tsx", "useProResultOnLeave(!listenMode && !silent);"],
      [
        "components/range/range-test.tsx",
        'useProResultOnLeave(stage === "result" && result?.offerPro === true);',
      ],
    ]) {
      const src = read(file);
      expect(src, file).toContain(call);
      expect(src, file).not.toMatch(/emitProResult\(/);
    }
  });
});
