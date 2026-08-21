import { afterEach, describe, expect, it, vi } from "vitest";

const load = async () => (await import("./accounts")).accountsReady;

function withEnv(key: string, nodeEnv: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", key);
  vi.stubEnv("NODE_ENV", nodeEnv);
  return load();
}

describe("accountsReady", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is false for a development instance in production - the bug this exists for", async () => {
    // pk_test_ on sing.suedeai.ai is what returned 401 to every signed-in call.
    expect(await (await withEnv("pk_test_Y3VycmVudA", "production"))()).toBe(false);
  });

  it("is true once real keys land, with no code change", async () => {
    expect(await (await withEnv("pk_live_Y3VycmVudA", "production"))()).toBe(true);
  });

  it("stays usable in local development against test keys", async () => {
    expect(await (await withEnv("pk_test_Y3VycmVudA", "development"))()).toBe(true);
  });

  it("is false when Clerk is not configured at all", async () => {
    expect(await (await withEnv("", "development"))()).toBe(false);
    expect(await (await withEnv("", "production"))()).toBe(false);
  });
});
