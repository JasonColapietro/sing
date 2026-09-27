import { afterEach, describe, expect, it, vi } from "vitest";
import { ROUTES, discoverTemplateRoutes } from "./routes.mjs";

afterEach(() => vi.unstubAllGlobals());

describe("audit route coverage", () => {
  it("includes the mobile app and popular-song menu destinations", () => {
    expect(ROUTES.map((route) => route.path)).toEqual(expect.arrayContaining(["/voice", "/can-you-sing"]));
  });

  it("selects detail pages rather than re-auditing static hubs", async () => {
    const paths = ["/singers/methodology", "/singers/records", "/singers/adele", "/atlas/vocal-range-by-voice-type", "/atlas/tessitura", "/can-you-sing/espresso"];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => paths.map((p) => `<loc>https://sing.suedeai.ai${p}</loc>`).join("") }));
    const routes = await discoverTemplateRoutes("https://sing.suedeai.ai");
    expect(routes.find((r) => r.name === "singer-detail")?.path).toBe("/singers/adele");
    expect(routes.find((r) => r.name === "atlas-chapter")?.path).toBe("/atlas/tessitura");
    expect(routes.find((r) => r.name === "popular-song-detail")?.path).toBe("/can-you-sing/espresso");
  });
});
