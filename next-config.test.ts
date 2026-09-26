import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";
import { EXERCISES } from "./components/warmups/exercises";

describe("raw Vercel host redirects", () => {
  it("canonicalizes every path before Proxy and Clerk run", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toContainEqual({
      source: "/:path*",
      has: [{ type: "host", value: ".+\\.vercel\\.app" }],
      destination: "https://sing.suedeai.ai/:path*",
      permanent: true,
    });
  });
});

describe("warmup path redirects", () => {
  it("sends /warmups/<exercise id> to the room's ?exercise= deep link", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const rule = redirects.find((r) => r.source.startsWith("/warmups/"));
    expect(rule?.destination).toBe("/warmups?exercise=:exercise");
    expect(rule?.permanent).toBe(false);
    const pattern = new RegExp(`^/warmups/${rule!.source.slice("/warmups/:exercise".length)}$`);
    expect(pattern.test("/warmups/five-note-scale")).toBe(true);
    for (const e of EXERCISES) expect(pattern.test(`/warmups/${e.id}`)).toBe(true);
    expect(pattern.test("/warmups/typo")).toBe(false);
  });
});
