/**
 * Song page claims, per form.
 *
 * Most entries transcribe a song's opening phrase, and the two longer
 * arrangements (`arrangementOf`) sing selected lines. Neither is the song's
 * lyrics or its key, so no title, heading, snippet or structured data on
 * those pages may sell them as such.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SongPage, { generateMetadata } from "@/app/songs/[slug]/page";
import { ALL_SONGS } from "@/components/songs/data";

const arrangements = ALL_SONGS.filter((s) => s.arrangementOf);

async function render(slug: string): Promise<string> {
  return renderToStaticMarkup(await SongPage({ params: Promise.resolve({ slug }) }));
}

function jsonLd(html: string): { "@graph": Record<string, unknown>[] } {
  const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error("no JSON-LD");
  return JSON.parse(m[1]);
}

describe("longer arrangements are partial transcriptions", () => {
  it("exist, so the checks below run", () => {
    expect(arrangements.length).toBeGreaterThan(0);
  });

  it.each(arrangements.map((s) => s.slug))("%s: no lyrics or vocal-range claim", async (slug) => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug }) });
    const title = (meta.title as { absolute: string }).absolute;
    expect(title.startsWith("Sing ")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title).not.toMatch(/lyrics|vocal range/i);
    expect(String(meta.description)).not.toMatch(/lyrics|vocal range/i);
    expect(String(meta.description).length).toBeLessThanOrEqual(155);

    const html = await render(slug);
    const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)![1];
    expect(h1).toContain("the lines, their key and note range");
    expect(h1).not.toMatch(/lyrics|vocal range/i);

    const composition = jsonLd(html)["@graph"].find((n) => n["@type"] === "MusicComposition")!;
    expect(composition).not.toHaveProperty("lyrics");
    expect(composition).not.toHaveProperty("musicalKey");
    const names = (composition.additionalProperty as { name: string }[]).map((p) => p.name);
    expect(names).toContain("Transcription tonic");
    expect(names).toContain("Lowest note (these lines)");
    expect(names).toContain("Highest note (these lines)");
    expect(names.join(" ")).not.toContain("opening phrase");
  });
});

describe("the tag sentence", () => {
  it("names a tag that describes what the melody asks of a voice, never a genre word", async () => {
    // "christmas" leads Silent Night's tags; its demand tag is "narrow range".
    const html = await render("silent-night");
    expect(html).not.toContain("&ldquo;christmas&rdquo;");
    expect(html).not.toContain("“christmas”");
    expect(html).toMatch(/[“"]narrow range[”"]\s*is what it asks of a voice/);
  });

  it("never names a meter or a scale as what a melody asks of a voice", async () => {
    // Down in the Valley leads with "waltz"; its demand tag is "long tones".
    const valley = await render("down-in-the-valley");
    expect(valley).toMatch(/[“"]long tones[”"]\s*is what it asks of a voice/);
    expect(valley).not.toMatch(/[“"]waltz[”"]\s*is what it asks/);
    // Scarborough Fair's only non-genre tags are "modal" and "dorian", and its
    // transcribed phrase does not even reach the Dorian sixth.
    const scarborough = await render("scarborough-fair");
    expect(scarborough).not.toContain("is what it asks of a voice");
    expect(scarborough).not.toContain("what it drills");
  });

  it("is left out when no tag names a vocal demand", async () => {
    const plain = ALL_SONGS.find((s) =>
      s.tags.every((t) => !["stepwise", "narrow range", "wide range", "leap", "octave leap", "long tones", "legato", "repeated note", "dotted rhythm"].includes(t)),
    );
    expect(plain).toBeDefined();
    const html = await render(plain!.slug);
    expect(html).not.toContain("is what it asks of a voice");
    expect(html).toContain("Genre, era and tags");
  });
});
