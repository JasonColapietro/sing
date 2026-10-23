import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  DEFAULT_INTAKE_URL,
  forwardToIntake,
  intakePerson,
  intakeSummary,
} = await import("./intake-forward");
type IntakeEvent = Parameters<typeof forwardToIntake>[0];

const SECRET = "s".repeat(48);
const ENV = { SUEDE_INTAKE_SOURCE: "sing", SUEDE_INTAKE_SECRET: SECRET };

const EVENT: IntakeEvent = {
  id: "clerk:user_2abc",
  kind: "signup",
  property: "sing.suedeai.ai",
  occurredAt: "2026-10-23T09:14:00.000Z",
  summary: "New Suede Sing account",
  person: { email: "singer@example.com" },
};

function reply(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Runs the forward to completion, fast-forwarding through its backoff. */
async function forward(
  fetcher: typeof fetch,
  env: Record<string, string | undefined> = ENV,
) {
  const pending = forwardToIntake(EVENT, env, fetcher);
  await vi.runAllTimersAsync();
  return pending;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-23T09:14:05.000Z"));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("forwardToIntake", () => {
  it("signs `${timestamp}.${body}` with the source secret", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => reply(202, { accepted: true, duplicate: false }));
    await forward(fetcher);

    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(DEFAULT_INTAKE_URL);
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    const body = init.body as string;
    expect(JSON.parse(body)).toEqual(EVENT);
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["x-suede-intake-source"]).toBe("sing");
    expect(headers["x-suede-intake-timestamp"]).toBe(String(Date.parse("2026-10-23T09:14:05.000Z") / 1000));
    const expected = createHmac("sha256", SECRET)
      .update(`${headers["x-suede-intake-timestamp"]}.${body}`, "utf8")
      .digest("hex");
    expect(headers["x-suede-intake-signature"]).toBe(`v1=${expected}`);
  });

  it("posts to SUEDE_INTAKE_URL when it is set", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => reply(202, { accepted: true }));
    await forward(fetcher, { ...ENV, SUEDE_INTAKE_URL: " https://hub.test/in " });
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://hub.test/in");
  });

  it("stops on 202 and reports a fresh event", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => reply(202, { accepted: true, duplicate: false }));
    expect(await forward(fetcher)).toEqual({ ok: true, duplicate: false });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("stops on 202 and reports a duplicate", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => reply(202, { accepted: true, duplicate: true }));
    expect(await forward(fetcher)).toEqual({ ok: true, duplicate: true });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it.each([400, 401, 413])("does not retry a %i", async (status) => {
    const fetcher = vi.fn<typeof fetch>(async () => reply(status, { error: "no" }));
    expect(await forward(fetcher)).toEqual({ ok: false, reason: "rejected" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("retries a 5xx and succeeds on a later attempt", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(reply(503))
      .mockResolvedValueOnce(reply(500))
      .mockResolvedValueOnce(reply(202, { accepted: true, duplicate: false }));
    expect(await forward(fetcher)).toEqual({ ok: true, duplicate: false });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("retries a 429", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(reply(429))
      .mockResolvedValueOnce(reply(202, { accepted: true }));
    expect(await forward(fetcher)).toEqual({ ok: true, duplicate: false });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("retries network errors and gives up after three attempts", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));
    expect(await forward(fetcher)).toEqual({ ok: false, reason: "unreachable" });
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("waits 400 ms then 1,200 ms between attempts", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("fetch failed"));
    const pending = forwardToIntake(EVENT, ENV, fetcher);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(399);
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1_199);
    expect(fetcher).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetcher).toHaveBeenCalledTimes(3);
    await pending;
  });

  it.each([
    ["no source", { SUEDE_INTAKE_SECRET: SECRET }],
    ["no secret", { SUEDE_INTAKE_SOURCE: "sing" }],
    ["a secret under 32 bytes", { SUEDE_INTAKE_SOURCE: "sing", SUEDE_INTAKE_SECRET: "short" }],
  ])("reports not-configured with %s and sends nothing", async (_label, env) => {
    const fetcher = vi.fn<typeof fetch>();
    expect(await forward(fetcher, env)).toEqual({ ok: false, reason: "not-configured" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("intake helpers", () => {
  it("keeps only the non-empty person fields", () => {
    expect(intakePerson({ email: " a@b.co ", name: "", phone: null })).toEqual({ email: "a@b.co" });
    expect(intakePerson({ email: null, name: "  " })).toBeUndefined();
  });

  it("keeps a summary on one line inside 200 characters", () => {
    expect(intakeSummary("a\n b")).toBe("a b");
    const long = intakeSummary("x".repeat(300));
    expect(long).toHaveLength(200);
    expect(long.endsWith("…")).toBe(true);
  });
});
