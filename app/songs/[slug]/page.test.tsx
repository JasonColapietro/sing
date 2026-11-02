import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import SongPage, { generateStaticParams } from "./page";
import { ALL_SONGS } from "@/components/songs/data";

type Node = Record<string, unknown>;

async function graph(slug: string): Promise<Node[]> {
  const html = renderToStaticMarkup(await SongPage({ params: Promise.resolve({ slug }) }));
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(match, `${slug}: missing JSON-LD`).not.toBeNull();
  return (JSON.parse(match![1]) as { "@graph": Node[] })["@graph"];
}

describe("every song page's structured-data description", () => {
  const slugs = generateStaticParams().map((p) => p.slug);

  it("covers every song", () => {
    expect(slugs.sort()).toEqual(ALL_SONGS.map((s) => s.slug).sort());
  });

  it.each(slugs)("%s reads as one grammatical subject, with no '1-pass'", async (slug) => {
    const nodes = await graph(slug);
    const page = nodes.find((n) => n["@type"] === "WebPage")!;
    const composition = nodes.find((n) => n["@type"] === "MusicComposition")!;
    const description = String(page.description);
    expect(String(composition.description)).toContain(description);
    // A count of one is spelled out; a digit before "-pass" is 2 or more.
    expect(description).not.toMatch(/\b1-pass\b/);
    expect(description).toMatch(/A full (?:one|[2-9]|\d{2,})-pass session takes about/);
    // A plural subject ("The selected lines … are") keeps its plural through
    // the next sentence; a singular one keeps "Its".
    if (/ are transcribed here with their /.test(description)) {
      expect(description).toMatch(/\. Their \d+ notes run /);
      expect(description).not.toMatch(/\. Its \d+ notes run /);
    } else {
      expect(description).toMatch(/ is transcribed here with its /);
      expect(description).toMatch(/\. Its \d+ notes run /);
    }
  });

  it("gives the longer arrangements their plural and their pass count in words", async () => {
    const arrangements = ALL_SONGS.filter((s) => s.arrangementOf !== undefined);
    expect(arrangements.length).toBeGreaterThan(0);
    for (const song of arrangements) {
      const description = String((await graph(song.slug)).find((n) => n["@type"] === "WebPage")!.description);
      expect(description, song.slug).toMatch(/^The selected lines of “.+” are transcribed here with their tonic/);
      expect(description, song.slug).toMatch(/\. Their \d+ notes run /);
    }
  });
});
