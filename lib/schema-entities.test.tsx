import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingerPage from "@/app/singers/[slug]/page";
import PopSongPage from "@/app/can-you-sing/[slug]/page";
import HomePage from "@/app/page";
import ProPage from "@/app/pro/page";
import VoicePage from "@/app/voice/page";
import ExtensionPage from "@/app/extension/page";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/app-store";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { buildLlmsTxt } from "@/lib/llms-txt";
import { SITE_URL } from "@/lib/site";

type Node = Record<string, unknown>;

function graph(html: string): Node[] {
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!block) throw new Error("No JSON-LD emitted");
  return JSON.parse(block[1])["@graph"];
}

describe("software application categories", () => {
  it.each([
    ["home", HomePage],
    ["Pro", ProPage],
    ["native apps", VoicePage],
    ["extension", ExtensionPage],
  ])("%s uses Google's supported educational category", (_, Page) => {
    const apps = graph(renderToStaticMarkup(<Page />)).filter((n) =>
      ["SoftwareApplication", "WebApplication", "MobileApplication"].includes(String(n["@type"])),
    );
    expect(apps.length).toBeGreaterThan(0);
    for (const app of apps) expect(app.applicationCategory).toBe("EducationalApplication");
  });
});

describe("singing product identity and visible evidence", () => {
  it("describes the iPhone version and paid features visible on its download page", () => {
    const html = renderToStaticMarkup(<VoicePage />);
    const prose = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const ios = graph(html).find((n) => String(n.operatingSystem).startsWith("iOS"))!;
    expect(ios.softwareVersion).toBe("2.0");
    expect(prose).toContain(`Version ${ios.softwareVersion}`);
    expect(prose).toContain("Free on iPhone");
    expect(prose).toContain("Suede Voice Pro on iPhone");
    expect(prose).toContain("96 scored vocal exercises across 13 techniques");
    expect(prose).toContain("26 public-domain songs that transpose to your range");
    expect(prose).toContain("Suede Pro plan is a separate purchase");
    for (const feature of ios.featureList as string[]) {
      // The privacy sentence has its own natural wording in the page.
      if (feature.startsWith("On-device")) continue;
      expect(prose).toContain(feature.replace(/ with Pro$/, ""));
      expect(buildLlmsTxt()).toContain(feature.replace(/ with Pro$/, ""));
    }
    expect(ios).not.toHaveProperty("aggregateRating");
    expect(ios).not.toHaveProperty("review");
  });

  it("uses real, visible iPhone screenshots and distinct platform icons", () => {
    const html = renderToStaticMarkup(<VoicePage />);
    const nodes = graph(html);
    const ios = nodes.find((n) => String(n.operatingSystem).startsWith("iOS"))!;
    const android = nodes.find((n) => n.operatingSystem === "Android")!;
    expect(ios.image).not.toBe(android.image);
    expect(ios.screenshot).toHaveLength(3);
    expect(android).not.toHaveProperty("screenshot");
    for (const url of [ios.image, android.image, ...ios.screenshot as string[]]) {
      const path = String(url).replace(SITE_URL, "");
      expect(existsSync(join(process.cwd(), "public", path))).toBe(true);
      expect(html).toContain(encodeURIComponent(path));
    }
    expect(html).toContain("iPhone screenshots from the App Store listing");
  });

  it.each([["home", HomePage], ["mobile page", VoicePage]])(
    "%s resolves the website, page and app references in its own graph",
    (_, Page) => {
      const nodes = graph(renderToStaticMarkup(<Page />));
      const website = nodes.find((n) => n["@id"] === `${SITE_URL}/#website`)!;
      expect(website).toMatchObject({ "@type": "WebSite", name: "Suede Sing" });
      const page = nodes.find((n) => n["@type"] === "WebPage")!;
      expect(page.isPartOf).toEqual({ "@id": website["@id"] });
      const refs = Array.isArray(page.mainEntity) ? page.mainEntity : [page.mainEntity];
      for (const ref of refs) expect(nodes.some((n) => n["@id"] === ref["@id"])).toBe(true);
      expect(nodes.find((n) => n["@type"] === "Organization")?.alternateName).toContain("Suede Labs AI");
    },
  );

  it("keeps the web app's identity and screenshots separate from native downloads", () => {
    const nodes = graph(renderToStaticMarkup(<HomePage />));
    const app = nodes.find((n) => n["@type"] === "WebApplication")!;
    expect(app.mainEntityOfPage).toEqual({ "@id": `${SITE_URL}/#webpage` });
    expect(app.sameAs).toContain("https://www.instagram.com/suedesingapp/");
    expect(app.screenshot).toEqual([`${SITE_URL}/room-studio.png`, `${SITE_URL}/room-progress.png`]);
    expect(app).not.toHaveProperty("installUrl");
    expect(app).not.toHaveProperty("aggregateRating");
  });
});

describe("singer schema entity values", () => {
  it.each([
    ["adele", ["UK"]],
    ["camila-cabello", ["Cuba", "USA"]],
    ["faouzia", ["Morocco", "Canada"]],
    ["kali-uchis", ["Colombia", "USA"]],
  ])("%s names each country as a Country entity", async (slug, countries) => {
    const nodes = graph(renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug }) })));
    const person = nodes.find((n) => n["@type"] === "Person")!;
    expect(person.nationality).toEqual((countries as string[]).map((name) => ({ "@type": "Country", name })));
  });

  it("gives cited works Organization publishers with the visible source names", async () => {
    const nodes = graph(renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug: "sam-smith" }) })));
    const page = nodes.find((n) => n["@type"] === "WebPage")!;
    const citations = page.citation as Node[];
    expect(citations.length).toBeGreaterThan(0);
    for (const citation of citations) {
      expect(citation.publisher).toEqual({ "@type": "Organization", name: expect.any(String) });
    }
    expect(citations).toEqual(expect.arrayContaining([
      expect.objectContaining({ publisher: { "@type": "Organization", name: "VH1" } }),
      expect.objectContaining({ publisher: { "@type": "Organization", name: "Musicnotes" } }),
    ]));
  });
});

describe("popular-song recording artists", () => {
  it.each([
    ["espresso", [{ "@type": "Person", name: "Sabrina Carpenter" }]],
    ["creep", [{ "@type": "MusicGroup", name: "Radiohead" }]],
    ["unchained-melody", [{ "@type": "MusicGroup", name: "The Righteous Brothers" }]],
    ["shallow", [{ "@type": "Person", name: "Lady Gaga" }, { "@type": "Person", name: "Bradley Cooper" }]],
    ["uptown-funk", [{ "@type": "Person", name: "Mark Ronson" }, { "@type": "Person", name: "Bruno Mars" }]],
    ["die-with-a-smile", [{ "@type": "Person", name: "Lady Gaga" }, { "@type": "Person", name: "Bruno Mars" }]],
  ])("%s preserves the credited artists and their entity types", async (slug, artists) => {
    const nodes = graph(renderToStaticMarkup(await PopSongPage({ params: Promise.resolve({ slug }) })));
    expect(nodes.find((n) => n["@type"] === "MusicRecording")?.byArtist).toEqual(artists);
  });
});


describe("Android singing app discovery", () => {
  it.each([["home", HomePage], ["download page", VoicePage]])(
    "%s identifies Android independently of the browser and iPhone apps",
    (_, Page) => {
      const html = renderToStaticMarkup(<Page />);
      const nodes = graph(html);
      const android = nodes.find((n) => n.operatingSystem === "Android")!;
      expect(android).toMatchObject({
        "@type": "MobileApplication",
        "@id": "https://sing.suedeai.ai/voice#android",
        name: "Suede Voice: Vocal Range Test",
        identifier: "ai.suedeai.suedevoice",
        installUrl: PLAY_STORE_URL,
        downloadUrl: PLAY_STORE_URL,
        sameAs: [PLAY_STORE_URL],
        offers: { price: "0", priceCurrency: "USD", url: PLAY_STORE_URL },
      });
      expect(android.description).toMatch(/Android singing app/);
      expect(android.featureList).toContain("96 vocal exercises across 13 techniques with Pro");
      expect((android.offers as Node).description).toMatch(/monthly or annual.*Pro subscription/);
      expect(android).not.toHaveProperty("aggregateRating");
      expect(android).not.toHaveProperty("review");
      expect(html).toContain(`href="${PLAY_STORE_URL}"`);
      const ios = nodes.find((n) => String(n.operatingSystem).startsWith("iOS"))!;
      expect(ios.installUrl).toBe(APP_STORE_URL);
      expect(ios).not.toHaveProperty("identifier", "ai.suedeai.suedevoice");
      for (const ref of [android.author, android.publisher] as Node[]) {
        expect(nodes.some((node) => node["@id"] === ref["@id"])).toBe(true);
      }
    },
  );

  it("connects the homepage to the app without calling the web studio an Android download", () => {
    const nodes = graph(renderToStaticMarkup(<HomePage />));
    const page = nodes.find((n) => n["@type"] === "WebPage")!;
    expect(page.mainEntity).toEqual({ "@id": "https://sing.suedeai.ai/#app" });
    expect(page.mentions).toContainEqual({ "@id": "https://sing.suedeai.ai/voice#android" });
    const browser = nodes.find((n) => n["@id"] === "https://sing.suedeai.ai/#app")!;
    expect(browser["@type"]).toBe("WebApplication");
    expect(browser.operatingSystem).toBe("Web Browser");
    expect(browser).not.toHaveProperty("installUrl");
  });

  it("shows the paid practice boundary in the Android page content", () => {
    const prose = renderToStaticMarkup(<VoicePage />)
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    expect(prose).toContain("Singing practice on Android");
    expect(prose).toContain("free vocal range test");
    expect(prose).toContain("Suede Voice Pro adds 96 vocal exercises");
    expect(prose).toContain("optional monthly or annual subscription through Google Play");
    expect(prose).not.toMatch(/no subscription|all vocal exercises are free/i);
  });
});
