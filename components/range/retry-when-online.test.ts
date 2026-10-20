import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { retryWhenOnline } from "./retry-when-online";

const chunkError = () =>
  Object.assign(new Error("Failed to load chunk /_next/static/chunks/1tzs7cdw22lok.js"), {
    name: "ChunkLoadError",
  });

/** Lets every pending promise callback run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("an optional chunk that cannot load offline", () => {
  it("resolves straight away when the chunk loads", async () => {
    await expect(retryWhenOnline(async () => "songs", { target: new EventTarget() })).resolves.toBe("songs");
  });

  it("waits for the connection instead of rejecting, then loads", async () => {
    const online = new EventTarget();
    const load = vi.fn().mockRejectedValueOnce(chunkError()).mockResolvedValueOnce("songs");
    const done = vi.fn();
    const failed = vi.fn();
    retryWhenOnline(load, { target: online }).then(done, failed);
    await settle();
    // Offline: neither an answer nor an uncaught ChunkLoadError.
    expect(done).not.toHaveBeenCalled();
    expect(failed).not.toHaveBeenCalled();
    online.dispatchEvent(new Event("online"));
    await settle();
    expect(load).toHaveBeenCalledTimes(2);
    expect(done).toHaveBeenCalledWith("songs");
    expect(failed).not.toHaveBeenCalled();
  });

  it("keeps waiting if the first reconnect still cannot load it", async () => {
    const online = new EventTarget();
    const load = vi
      .fn()
      .mockRejectedValueOnce(chunkError())
      .mockRejectedValueOnce(chunkError())
      .mockResolvedValueOnce("songs");
    const done = vi.fn();
    retryWhenOnline(load, { target: online }).then(done);
    await settle();
    online.dispatchEvent(new Event("online"));
    await settle();
    expect(done).not.toHaveBeenCalled();
    online.dispatchEvent(new Event("online"));
    await settle();
    expect(done).toHaveBeenCalledWith("songs");
  });

  it("stops waiting once the room no longer wants it", async () => {
    const online = new EventTarget();
    const load = vi.fn().mockRejectedValue(chunkError());
    const quit = new AbortController();
    void retryWhenOnline(load, { target: online, signal: quit.signal });
    await settle();
    quit.abort();
    online.dispatchEvent(new Event("online"));
    await settle();
    expect(load).toHaveBeenCalledOnce();
  });

  it("is how the range room loads both its late chunks", () => {
    // ProgramRangeProbe threw in render and took the meter down to
    // app/error.tsx; the result's song count was an uncaught rejection.
    const meter = readFileSync(join(__dirname, "pitch-meter.tsx"), "utf8");
    expect(meter).toMatch(
      /dynamic\(\s*\(\) => retryWhenOnline\(\(\) => import\("@\/components\/practice\/program-range-probe"\)\),\s*\{ loading: \(\) => null \},\s*\)/,
    );
    const result = readFileSync(join(__dirname, "result-view.tsx"), "utf8");
    expect(result).toContain('retryWhenOnline(() => import("@/components/songs/data")');
    // No bare dynamic import of either is left to reject.
    expect(meter.match(/import\("@\/components\/practice\/program-range-probe"\)/g)?.length).toBe(
      meter.match(/retryWhenOnline\(\(\) => import\("@\/components\/practice\/program-range-probe"\)/g)?.length,
    );
    expect(result.match(/import\("@\/components\/songs\/data"\)/g)).toHaveLength(1);
  });
});
