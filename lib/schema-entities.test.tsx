import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingerPage from "@/app/singers/[slug]/page";
import PopSongPage from "@/app/can-you-sing/[slug]/page";

type Node = Record<string, unknown>;

function graph(html: string): Node[] {
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!block) throw new Error("No JSON-LD emitted");
  return JSON.parse(block[1])["@graph"];
}

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
