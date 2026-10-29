import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { emptyListenLog, listen, takeChunk, takeTail } from "./listen-log";

const CHUNK = 300;
const MIN = 15;

function frames(seconds: number, f0: number | null, log = emptyListenLog()) {
  for (let i = 0; i < seconds * 10; i++) listen(log, 0.1, f0);
  return log;
}

describe("the voice analyzer's listening log", () => {
  it("drops a silent chunk and a silent tail instead of logging them", () => {
    const log = frames(310, null);
    expect(takeChunk(log, CHUNK)).toBe(false);
    expect(log.sec).toBeCloseTo(10);
    frames(40, null, log);
    expect(takeTail(log, MIN)).toBeNull();
    expect(log.sec).toBe(0);
  });

  it("logs a full chunk of listening, pauses included, once a voice was heard", () => {
    const log = frames(200, null);
    frames(1, 220, log);
    frames(100, null, log);
    expect(takeChunk(log, CHUNK)).toBe(true);
    // The next chunk starts unheard: silence after a logged chunk stays silent.
    frames(300, null, log);
    expect(takeChunk(log, CHUNK)).toBe(false);
  });

  it("logs a heard tail on stop, and keeps a short one for later", () => {
    const short = frames(10, 220);
    expect(takeTail(short, MIN)).toBeNull();
    expect(short.sec).toBeCloseTo(10);
    frames(10, null, short);
    expect(takeTail(short, MIN)).toBe(20);
    expect(takeTail(short, MIN)).toBeNull();
  });

  it("is what the analyzer logs through", () => {
    const src = readFileSync(new URL("./analyze-client.tsx", import.meta.url), "utf8");
    expect(src).toContain("listen(listenRef.current, dtSec, frame.f0);");
    expect(src).toContain("if (takeChunk(listenRef.current, CHUNK_SEC)) {");
    expect(src).toContain("const sec = takeTail(listenRef.current, MIN_FLUSH_SEC);");
    expect(src).not.toContain("listenSecRef");
  });
});
