import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * components/pro/sync.tsx (ProSync) is mounted once, in the root layout, and
 * a checkout, a restored key or a redeemed pass all make the page Pro without
 * remounting it. These pin that ProSync starts cloud sync again when a Pro
 * key arrives, and not on every other Pro change.
 */

const pro = vi.hoisted(() => ({
  state: { active: false, proKey: null as string | null },
  listeners: new Set<() => void>(),
}));

vi.mock("@/lib/pro", () => ({
  getProState: () => pro.state,
  revalidatePro: vi.fn(async () => {}),
  subscribePro: (cb: () => void) => {
    pro.listeners.add(cb);
    return () => pro.listeners.delete(cb);
  },
}));

const startAutoSync = vi.hoisted(() => vi.fn());
vi.mock("@/lib/sync", () => ({ startAutoSync }));

// Run the mount effect where the component is called; node has no DOM to
// mount into, and the effect is the whole of this component.
const cleanups = vi.hoisted(() => [] as (() => void)[]);
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void | (() => void)) => {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  },
}));

import ProSync from "@/components/pro/sync";

function fire() {
  for (const cb of [...pro.listeners]) cb();
}

afterEach(() => {
  for (const c of cleanups.splice(0)) c();
  pro.state = { active: false, proKey: null };
  startAutoSync.mockClear();
});

describe("ProSync", () => {
  it("starts sync again when Pro arrives on a page that loaded without it", () => {
    ProSync();
    expect(startAutoSync).toHaveBeenCalledTimes(1);
    pro.state = { active: true, proKey: "new-key" };
    fire();
    expect(startAutoSync).toHaveBeenCalledTimes(2);
  });

  it("does not restart for a Pro change that brings no new key", () => {
    pro.state = { active: true, proKey: "key" };
    ProSync();
    fire();
    expect(startAutoSync).toHaveBeenCalledTimes(1);
    // Lapsing and coming back with the same key is a new arrival.
    pro.state = { active: false, proKey: "key" };
    fire();
    expect(startAutoSync).toHaveBeenCalledTimes(1);
    pro.state = { active: true, proKey: "key" };
    fire();
    expect(startAutoSync).toHaveBeenCalledTimes(2);
  });

  it("stops listening when it unmounts", () => {
    ProSync();
    for (const c of cleanups.splice(0)) c();
    expect(pro.listeners.size).toBe(0);
  });
});
