import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FamousVoices } from "@/components/landing/famous-voices";
import { isSingerReviewed } from "@/lib/singer-evidence";

describe("homepage famous voices", () => {
  it.each([
    ["Olivia Rodrigo", "olivia-rodrigo"],
    ["Reba McEntire", "reba-mcentire"],
    ["Alex Warren", "alex-warren"],
    ["Sam Smith", "sam-smith"],
    ["Arijit Singh", "arijit-singh"],
  ])("links the %s opportunity page from descriptive homepage context", (name, slug) => {
    const html = renderToStaticMarkup(<FamousVoices />);

    expect(html).toContain(`href="/singers/${slug}"`);
    expect(html).toContain(`>${name}<`);
  });

  it.each([
    [
      "olivia-rodrigo",
      "Mezzo-soprano",
      "Olivia Rodrigo's voice type is disputed in the reviewed sources; this review does not establish a definitive classical classification.",
      "B2–A#5",
    ],
    [
      "reba-mcentire",
      "Mezzo-soprano",
      "Reba McEntire's own lesson describes a peak-career span of about three octaves, wider than this catalog's listed span, but gives no endpoints; the reviewed sources do not establish a definitive classical voice type.",
      "E3–F5",
    ],
    [
      "alex-warren",
      "Baritone",
      "Published evidence supports written compasses for specific Alex Warren songs, not a definitive baritone classification or full-career endpoints.",
      "G2–A4",
    ],
    [
      "sam-smith",
      "Countertenor",
      "Sam Smith's long-time coach describes baritone-to-tenor territory; the reviewed sources do not establish a definitive countertenor classification.",
      "G2–C6",
    ],
    [
      "arijit-singh",
      "Tenor",
      "A public artist biography describes Arijit Singh as a rich baritone; the reviewed sources dispute a definitive tenor label.",
      "C3–C5",
    ],
  ])("uses reviewed copy, not the raw catalog type, for %s", (slug, catalogType, evidenceCopy, range) => {
    const html = renderToStaticMarkup(<FamousVoices />);
    const card = html
      .match(new RegExp(`href="/singers/${slug}">([\\s\\S]*?)</a>`))?.[1]
      .replaceAll("&#x27;", "'");

    expect(card).toContain(evidenceCopy);
    expect(card).toContain(`Reported reference span: ${range}`);
    expect(card).not.toContain(`>${catalogType}<`);
  });

  it("labels an unreviewed voice type as the catalog's, as its profile does", () => {
    const html = renderToStaticMarkup(<FamousVoices />);
    const card = (slug: string) =>
      html.match(new RegExp(`href="/singers/${slug}"[^>]*>([\\s\\S]*?)</a>`))?.[1] ?? "";

    // Pending review: the profile calls this field "Catalog label".
    expect(isSingerReviewed("freddie-mercury")).toBe(false);
    expect(card("freddie-mercury")).toContain(">Catalog label: Baritone<");
    // Reviewed with no evidence sentence on the card: the label stands bare.
    expect(isSingerReviewed("adele")).toBe(true);
    expect(card("adele")).toContain(">Mezzo-soprano<");
    expect(card("adele")).not.toContain("Catalog label");
    // The section says most of what it shows is still awaiting review.
    expect(html).toContain("still await individual evidence review");
  });

  it("stacks reviewed rows so the evidence sentence gets the card's full width", () => {
    const html = renderToStaticMarkup(<FamousVoices />);
    const anchor = (slug: string) =>
      html.match(new RegExp(`<a[^>]*href="/singers/${slug}"[^>]*>`))?.[0] ?? "";

    expect(anchor("sam-smith")).toContain("flex-col");
    expect(anchor("freddie-mercury")).not.toContain("flex-col");
    expect(anchor("freddie-mercury")).toContain("justify-between");
  });

  /** Each card's singer slug and the name line it shows, in grid order. */
  function cards() {
    const html = renderToStaticMarkup(<FamousVoices />);
    return [
      ...html.matchAll(
        /href="\/singers\/([a-z0-9-]+)"[^>]*>\s*<span class="min-w-0"><span[^>]*>([^<]*)<\/span>/g,
      ),
    ].map((m) => ({ slug: m[1], name: m[2].replaceAll("&#x27;", "'") }));
  }

  it("leads with the reviewed profiles, the ones search can index", () => {
    const reviewed = cards().map(({ slug }) => isSingerReviewed(slug));

    expect(reviewed.length).toBeGreaterThan(20);
    expect(reviewed[0]).toBe(true);
    // Every reviewed card before every pending one, however many of each.
    expect(reviewed).toEqual([...reviewed].sort((a, b) => Number(b) - Number(a)));
  });

  it("names each card by the singer alone, with no keyword anchor on any", () => {
    for (const { slug, name } of cards()) {
      expect(name, slug).not.toMatch(/vocal range/i);
    }
    expect(cards().find((c) => c.slug === "damiano-david")?.name).toBe("Damiano David");
  });
});
