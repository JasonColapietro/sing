/**
 * What the backup route refuses, and with which status.
 *
 * The shape rules moved to lib/progress-shape.ts so the browser store and this
 * route share one definition of a session. That is only an improvement if the
 * route still refuses exactly what it refused before, so these cases pin the
 * boundary itself rather than the predicates behind it — those are covered in
 * lib/progress.test.ts.
 *
 * Redis is stubbed to a store that records what it was asked to save, so a
 * payload that gets through can be told apart from one that was rejected.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_USER = "user_routeValidation";

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: TEST_USER }),
}));

const saved = new Map<string, unknown>();
vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    get: async (k: string) => saved.get(k) ?? null,
    set: async (k: string, v: unknown) => void saved.set(k, v),
  }),
}));
// Rate limiting is a separate concern with its own tests; let every call past.
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => null }));

const { PUT } = await import("./route");

function healthy() {
  return {
    xp: 95,
    sessions: [
      {
        id: "a1",
        type: "warmup",
        date: "2026-08-20T09:00:00.000Z",
        day: "2026-08-20",
        durationSec: 300,
        score: 91,
        detail: "Lip trills",
        xp: 55,
      },
    ],
    streak: { current: 1, best: 3, lastDay: "2026-08-20" },
    range: { lowMidi: 48, highMidi: 72, voiceTypeLabel: "Baritone", testedAt: "t" },
    rangeHistory: [{ lowMidi: 48, highMidi: 72, testedAt: "t" }],
    achievements: ["first-note"],
  };
}

function put(state: unknown) {
  return PUT(
    new Request("https://sing.suedeai.ai/api/account/progress", {
      method: "PUT",
      body: JSON.stringify({ state, updatedAt: "2026-08-20T09:00:00.000Z" }),
    }),
  );
}

async function statusAndError(state: unknown) {
  const res = await put(state);
  const body = (await res.json()) as { error?: string };
  return { status: res.status, error: body.error };
}

beforeEach(() => saved.clear());

describe("PUT /api/account/progress", () => {
  it("stores a well-formed record", async () => {
    const res = await put(healthy());
    expect(res.status).toBe(200);
    expect(saved.size).toBe(1);
  });

  it("refuses a malformed session with 400 and stores nothing", async () => {
    // The shape that crashed /progress — field names this app never wrote.
    const { status, error } = await statusAndError({
      ...healthy(),
      sessions: [{ id: "s0", kind: "warmup", day: "2026-08-21", sec: 300 }],
    });
    expect(status).toBe(400);
    expect(error).toBe("A session in the payload is malformed.");
    expect(saved.size).toBe(0);
  });

  it("refuses an activity type it has never heard of", async () => {
    const [session] = healthy().sessions;
    const { status, error } = await statusAndError({
      ...healthy(),
      sessions: [{ ...session, type: "interpretive-dance" }],
    });
    expect(status).toBe(400);
    expect(error).toBe("A session in the payload is malformed.");
  });

  it("refuses a range carrying note names instead of MIDI numbers", async () => {
    const { status, error } = await statusAndError({
      ...healthy(),
      range: { lowMidi: "C3", highMidi: "A4" },
    });
    expect(status).toBe(400);
    expect(error).toBe("Progress payload has a malformed range.");
  });

  it("separates too-much from malformed: over-cap is 413, not 400", async () => {
    const [session] = healthy().sessions;
    const overCap = await statusAndError({
      ...healthy(),
      sessions: Array.from({ length: 501 }, (_, i) => ({
        ...session,
        id: `s${i}`,
      })),
    });
    expect(overCap.status).toBe(413);
    expect(overCap.error).toBe("Too many sessions to back up.");

    const rangeCap = await statusAndError({
      ...healthy(),
      rangeHistory: Array.from({ length: 61 }, (_, i) => ({
        lowMidi: 48,
        highMidi: 72,
        testedAt: `t${i}`,
      })),
    });
    expect(rangeCap.status).toBe(413);
    expect(rangeCap.error).toBe("Too many range tests to back up.");
  });

  it("still refuses a payload too large in bytes, which shape alone cannot catch", async () => {
    // 500 legal sessions, each with a maxed-out note tally: passes every shape
    // check and still serializes far past what Redis should ever see.
    const notes = Object.fromEntries(
      Array.from({ length: 128 }, (_, n) => [
        String(n),
        { sec: 1.5, hitSec: 1.2, cents: 12.5, frames: 90 },
      ]),
    );
    const [session] = healthy().sessions;
    const { status, error } = await statusAndError({
      ...healthy(),
      sessions: Array.from({ length: 500 }, (_, i) => ({
        ...session,
        id: `s${i}`,
        notes,
      })),
    });
    expect(status).toBe(413);
    expect(error).toBe("That practice record is too large to back up.");
    expect(saved.size).toBe(0);
  });

  it("accepts an untitled take — an empty label is not a malformed payload", async () => {
    const [session] = healthy().sessions;
    const res = await put({
      ...healthy(),
      sessions: [{ ...session, detail: "" }],
    });
    expect(res.status).toBe(200);
  });

  it("rejects a body that is not JSON at all", async () => {
    const res = await PUT(
      new Request("https://sing.suedeai.ai/api/account/progress", {
        method: "PUT",
        body: "{{{",
      }),
    );
    expect(res.status).toBe(400);
    expect(saved.size).toBe(0);
  });
});
