import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";
import { EXERCISES } from "./components/warmups/exercises";
import { PROGRAMS } from "./lib/programs";
import { PROGRAM_IDS } from "./lib/program-ids";

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

describe("program deep link", () => {
  it("lists every program's id, for the config that cannot load lib/programs.ts", () => {
    expect([...PROGRAM_IDS]).toEqual(PROGRAMS.map((p) => p.id));
  });

  it("serves /programs?program=<id> from that program's prerendered page, and an unknown id the list", async () => {
    const rewrites = await nextConfig.rewrites?.();
    // Before the filesystem: /programs is a page, and an afterFiles rewrite
    // never reaches a path a page owns (the deep link kept getting the list).
    expect(Array.isArray(rewrites)).toBe(false);
    const rule = (rewrites as Exclude<typeof rewrites, unknown[] | undefined>)?.beforeFiles?.find((r) => r.source === "/programs");
    expect(rule?.destination).toBe("/programs/:program");
    const has = rule?.has?.[0];
    expect(has).toMatchObject({ type: "query", key: "program" });
    // Next anchors a `has` value and hands its named groups to the destination.
    const pattern = new RegExp(`^${has!.value}$`);
    for (const p of PROGRAMS) expect(pattern.exec(p.id)?.groups?.program).toBe(p.id);
    expect(pattern.test("typo")).toBe(false);
    expect(pattern.test("foundations-2w-typo")).toBe(false);
    expect(pattern.test("")).toBe(false);
  });
});
