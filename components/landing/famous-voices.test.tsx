import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { FamousVoices } from "@/components/landing/famous-voices";

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
      "Reba McEntire's reviewed sources describe a peak-career span of about three octaves but do not establish a definitive classical voice type.",
      "E3–F5",
    ],
    [
      "alex-warren",
      "Baritone",
      "Published evidence supports written compasses for specific Alex Warren songs, not a definitive baritone classification or full-career endpoints.",
      "A2–F#4",
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
});
