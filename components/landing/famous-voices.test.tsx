import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FamousVoices } from "@/components/landing/famous-voices";
import { hasDocumentedSourceReview } from "@/lib/singer-evidence";

const html = renderToStaticMarkup(<FamousVoices />);

/** Each card's singer slug and the name it shows, in grid order. */
function cards() {
  return [
    ...html.matchAll(
      /<a[^>]*href="\/singers\/([a-z0-9-]+)"[^>]*>\s*<span[^>]*><span[^>]*>([^<]*)<\/span>/g,
    ),
  ].map((m) => ({ slug: m[1], name: m[2].replaceAll("&#x27;", "'") }));
}

describe("homepage famous voices", () => {
  it.each([
    ["Olivia Rodrigo", "olivia-rodrigo"],
    ["Reba McEntire", "reba-mcentire"],
    ["Alex Warren", "alex-warren"],
    ["Sam Smith", "sam-smith"],
    ["Arijit Singh", "arijit-singh"],
  ])("links the %s opportunity page from the homepage", (name, slug) => {
    expect(html).toContain(`href="/singers/${slug}"`);
    expect(html).toContain(`>${name}<`);
  });

  it("shows six to eight cards at every width, each a name, a span and a bar", () => {
    const all = cards();
    expect(all.length).toBeGreaterThanOrEqual(6);
    expect(all.length).toBeLessThanOrEqual(8);
    expect(html).not.toContain("max-sm:hidden");
    // One range bar per card (RangeMini is aria-hidden; the words carry the notes).
    expect(html.match(/bg-cool\/30/g)).toHaveLength(all.length);
    expect(html).toContain("B2–A#5");
  });

  it("keeps the evidence status on the profile, not the card", () => {
    // No voice type at all on the homepage: a catalog label was a hedge on
    // a card too small to explain it, and a reviewed sentence ran fourteen
    // lines on a phone. Both stay on /singers/[slug].
    expect(html).not.toContain("Catalog label");
    expect(html).not.toContain("Reported reference span");
    expect(html).not.toContain("available source evidence");
    expect(html).not.toMatch(/>(?:Soprano|Mezzo-soprano|Contralto|Countertenor|Tenor|Baritone|Bass)</);
    expect(html).toContain("Open any singer to see their range on a keyboard");
    // No hub chips: the footer carries those anchors on every page.
    expect(html).not.toContain('href="/singers/voice-type/contralto"');
    expect(html).not.toContain('href="/atlas/vocal-range-by-voice-type"');
  });

  it("leads with profiles that have documented source reviews", () => {
    const reviewed = cards().map(({ slug }) => hasDocumentedSourceReview(slug));
    expect(reviewed[0]).toBe(true);
    expect(reviewed).toEqual([...reviewed].sort((a, b) => Number(b) - Number(a)));
  });

  it("names each card by the singer alone, with no keyword anchor on any", () => {
    for (const { slug, name } of cards()) {
      expect(name, slug).not.toMatch(/vocal range/i);
    }
    expect(cards().find((c) => c.slug === "freddie-mercury")?.name).toBe("Freddie Mercury");
  });

  it("keeps every card's profile indexable and reachable", () => {
    expect(html).not.toContain("noindex");
    expect(html).toContain('href="/singers"');
  });
});
