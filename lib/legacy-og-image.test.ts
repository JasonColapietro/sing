import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { GET } from "@/app/legacy-share-card/[...path]/route";

afterEach(() => vi.unstubAllEnvs());

describe("legacy share-card render revision", () => {
  const request = new Request("https://sing.suedeai.ai/singers/adele/opengraph-image?render=untrusted&url=https://example.com");
  const context = { params: Promise.resolve({ path: ["singers", "adele"] }) };

  it("changes the target across builds even when the card data ID stays fixed", async () => {
    vi.stubEnv("SING_OG_RENDER_REVISION", "build-a");
    const first = await GET(request, context);
    const repeat = await GET(request, context);
    vi.stubEnv("SING_OG_RENDER_REVISION", "build-b");
    const second = await GET(request, context);
    const firstTarget = new URL(first.headers.get("location")!, request.url);
    const secondTarget = new URL(second.headers.get("location")!, request.url);

    expect(first.status).toBe(307);
    expect(first.headers.get("cache-control")).toBe("no-store");
    expect(repeat.headers.get("location")).toBe(first.headers.get("location"));
    expect(firstTarget.pathname).toBe(secondTarget.pathname);
    expect(firstTarget.search).toBe("?render=build-a");
    expect(secondTarget.search).toBe("?render=build-b");
    expect(firstTarget.href).not.toBe(secondTarget.href);
    expect(first.headers.get("location")).toMatch(/^\/singers\/adele\/opengraph-image\//);
  });

  it("fails clearly if the build did not inline its revision", async () => {
    vi.stubEnv("SING_OG_RENDER_REVISION", undefined);
    await expect(GET(request, context)).rejects.toThrow("Share-card render revision missing");
  });
});

describe("legacy share-card route boundaries", () => {
  it.each([
    ["singers", "adele/../../example.com"],
    ["singers", "adele", "extra"],
    ["singers", "genre", "opera", "extra"],
    ["songs", "scarborough-fair", "extra"],
    ["unknown", "adele"],
    ["https:", "example.com"],
  ])("does not invent an image for %j", async (...path) => {
    const response = await GET(new Request("https://sing.suedeai.ai/legacy-share-card/unused"), {
      params: Promise.resolve({ path }),
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
  });
});
