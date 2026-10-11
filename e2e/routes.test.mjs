import { afterEach, describe, expect, it, vi } from "vitest";
import { ROUTES, discoverTemplateRoutes } from "./routes.mjs";
import { TEMPLATE_PATHS } from "./lib/audit-fixtures.mjs";

afterEach(() => vi.unstubAllGlobals());

describe("audit route coverage", () => {
  it("includes the mobile app and popular-song menu destinations", () => {
    expect(ROUTES.map((route) => route.path)).toEqual(expect.arrayContaining(["/voice", "/can-you-sing"]));
  });

  it("selects detail pages rather than re-auditing static hubs", async () => {
    const paths = ["/singers/methodology", "/singers/records", "/atlas/vocal-range-by-voice-type", ...TEMPLATE_PATHS];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => paths.map((p) => `<loc>https://sing.suedeai.ai${p}</loc>`).join("") }));
    const routes = await discoverTemplateRoutes("https://sing.suedeai.ai");
    expect(routes.find((r) => r.name === "singer-detail")?.path).toBe("/singers/adele");
    expect(routes.find((r) => r.name === "atlas-chapter")?.path).toBe("/atlas/tessitura");
    expect(routes.find((r) => r.name === "popular-song-detail")?.path).toBe("/can-you-sing/espresso");
    expect(routes).toHaveLength(TEMPLATE_PATHS.length);
  });

  it("rejects an HTTP error instead of trusting an error page as a sitemap", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => "Unavailable" }));
    await expect(discoverTemplateRoutes("https://sing.suedeai.ai")).rejects.toThrow("HTTP 503");
  });

  it("fails when a generated template is missing instead of shrinking coverage", async () => {
    const paths = TEMPLATE_PATHS.filter((path) => !path.startsWith("/book/"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => paths.map((p) => `<loc>https://sing.suedeai.ai${p}</loc>`).join("") }));
    await expect(discoverTemplateRoutes("https://sing.suedeai.ai")).rejects.toThrow("book-chapter");
  });

  it("rejects malformed sitemap content instead of silently auditing static pages only", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => "<html>proxy response</html>" }));
    await expect(discoverTemplateRoutes("https://sing.suedeai.ai")).rejects.toThrow("missing templates");
  });
});
