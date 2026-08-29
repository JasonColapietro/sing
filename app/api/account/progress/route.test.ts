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
const account = vi.hoisted(() => ({
  accountsReady: vi.fn(),
  auth: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: account.auth,
}));
vi.mock("@/lib/accounts", () => ({ accountsReady: account.accountsReady }));

const saved = new Map<string, unknown>();
vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    get: async (k: string) => saved.get(k) ?? null,
    set: async (k: string, v: unknown) => void saved.set(k, v),
  }),
}));
// Rate limiting is a separate concern with its own tests; let every call past.
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => null }));

const { GET, PUT } = await import("./route");

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

beforeEach(() => {
  saved.clear();
  account.accountsReady.mockReset().mockReturnValue(true);
  account.auth.mockReset().mockResolvedValue({ userId: TEST_USER });
});

describe("GET /api/account/progress", () => {
  it("returns unauthorized before Clerk when accounts are not configured", async () => {
    account.accountsReady.mockReturnValue(false);
    account.auth.mockRejectedValue(new Error("Clerk middleware is unavailable"));

    const response = await GET(
      new Request("https://sing.suedeai.ai/api/account/progress"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Sign in to use your practice backup.",
    });
    expect(account.auth).not.toHaveBeenCalled();
  });
});

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

  it("refuses an xp total over the cap, like the other three caps", async () => {
    // The store declares four caps and used to enforce three. An xp of 1e15
    // passed every check and was written to Redis, where it sat as a number
    // sanitizeProgress clamps away on every read — invisible, self-healing,
    // and still not what this route says it does with over-cap payloads.
    const { status, error } = await statusAndError({ ...healthy(), xp: 1e15 });
    expect(status).toBe(413);
    expect(error).toBe("That XP total is too large to back up.");

    // The cap itself is still acceptable — this is a ceiling, not a fence.
    const atCap = await statusAndError({ ...healthy(), xp: 10_000_000 });
    expect(atCap.status).toBe(200);
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
