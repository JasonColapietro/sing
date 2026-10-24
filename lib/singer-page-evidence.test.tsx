import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingerPage from "@/app/singers/[slug]/page";
import rawEvidence from "@/data/singer-evidence.json";
import { labelToMidi } from "@/lib/audio/notes";
import { getSingerEvidence, getSingerPageLastModified } from "@/lib/singer-evidence";
import { singerBySlug } from "@/lib/singers";
import { SITE_URL } from "@/lib/site";

const REVIEWED_SLUGS = [
  "olivia-rodrigo",
  "reba-mcentire",
  "alex-warren",
  "sam-smith",
  "arijit-singh",
  "adele",
] as const;

const DISPUTED_VOICE_TYPE_COPY = [
  ["olivia-rodrigo", "voice type is disputed"],
  ["reba-mcentire", "do not establish a definitive classical voice type"],
  ["alex-warren", "not a definitive baritone classification"],
  ["sam-smith", "baritone-to-tenor territory"],
  ["arijit-singh", "rich baritone"],
] as const;

const VOICE_TYPE_QUESTION_SLUGS = [
  ["olivia-rodrigo", "Olivia Rodrigo"],
  ["reba-mcentire", "Reba McEntire"],
  ["alex-warren", "Alex Warren"],
  ["sam-smith", "Sam Smith"],
] as const;

async function rendered(slug: string) {
  return renderToStaticMarkup(
    await SingerPage({ params: Promise.resolve({ slug }) }),
  ).replaceAll("&#x27;", "'");
}

function graphFrom(html: string) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("page emitted no JSON-LD");
  return JSON.parse(
    match[1]
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">"),
  ) as { "@graph": Array<Record<string, unknown>> };
}

describe("singer-page evidence and provenance", () => {
  it.each(REVIEWED_SLUGS)("renders a reviewed Evidence and review card for %s", async (slug) => {
    const html = await rendered(slug);

    expect(html).toContain("Evidence and review");
    expect(html).toContain("Reviewed 2026-08-29");
    expect(html).toContain("Dataset editor: Jason Colapietro");
    expect(html).toContain("Confidence:");
    expect(html).toContain("Methodology");
    expect(html).toContain("Suggest a correction");
    expect(html).toContain('href="/singers/methodology"');
    expect(html).toContain('href="/contact"');
    expect(html).toContain("Reported reference span");
  });

  it("renders source links, claim scopes, and score-specific details as visible anchors", async () => {
    const html = await rendered("sam-smith");

    expect(html).toContain('href="https://www.vh1.com/news/np30pw/sam-smith-vocal-coach-joanna-eden-team-celeb"');
    expect(html).toContain('href="https://www.musicnotes.com/sheetmusic/sam-smith/lay-me-down/MN0129167"');
    expect(html).toContain("Written compass for this song arrangement only");
    expect(html).toContain("Song evidence: Lay Me Down");
    expect(html).toContain("Scientific pitch notation as published by the score");
  });

  it("shows confirmed prior review without inventing a source review date", async () => {
    const html = await rendered("rihanna");
    const graph = graphFrom(html);
    const page = graph["@graph"].find((node) => node["@type"] === "WebPage")!;

    expect(html).toContain("Catalog review confirmed 2026-10-24");
    expect(html).not.toMatch(/review is pending|review awaiting/i);
    expect(html).toContain("reported reference span, not an independently verified physiological limit");
    expect(html).toContain("Reported reference span");
    expect(page.dateModified).toBe("2026-10-24");
    expect(page).not.toHaveProperty("lastReviewed");
    expect(page).not.toHaveProperty("reviewedBy");
    expect(page).not.toHaveProperty("citation");
    expect(html).toContain("Rihanna Vocal Range: Reported");
    expect(html).not.toContain("Rihanna’s highest note is commonly cited as");
    expect(html).not.toContain("Full voice to");
  });

  it.each([
    ["jeff-buckley", "https://jeffbuckley.com/faq-2/"],
    ["luciano-pavarotti", "https://archives.metopera.org/MetOperaSearch/record.jsp?dockey=0374846"],
    ["jungkook", "https://es.rollingstone.com/jung-kook-entre-el-exito-como-solista-y-su-faceta-como-compositor-de-bts-soy-una-persona-despreocupada-y-sincera/"],
    ["peter-steele", "https://www.metalsucks.net/2011/04/12/metalsucks-exclusive-one-year-later-peter-steeles-people-speak-about-his-life-his-music-and-his-last-days/"],
    ["tom-jones", "https://www.tomjones.com/blog/reviews/las-vegas-review-journal"],
    ["paul-mccartney", "https://www.thebeatles.com/youll-be-mine"],
    ["jimin", "https://magazine.weverse.io/article/view/1170?lang=en"],
  ])("preserves scoped sources for confirmed %s without inventing dated review schema", async (slug, url) => {
    const html = await rendered(slug);
    const page = graphFrom(html)["@graph"].find((node) => node["@type"] === "WebPage")!;

    expect(html).toContain(`href="${url.replaceAll("&", "&amp;")}"`);
    expect(html).toContain("Catalog review confirmed 2026-10-24");
    expect(html).toContain("not an independently verified physiological limit");
    expect(page).not.toHaveProperty("reviewedBy");
    expect(page.dateModified).toBe("2026-10-24");
    expect(page.lastReviewed).toBeUndefined();
    expect(page.citation).toEqual(expect.arrayContaining([expect.objectContaining({ url })]));
  });

  it("shows a source score's octave convention beside its written range", async () => {
    // Beggin' is written in treble clef an octave above Damiano David's sung
    // line; without the note the written F#5 reads as seven semitones above
    // the page's own reported ceiling.
    const html = await rendered("damiano-david");
    expect(html).toContain("Catalog review confirmed 2026-10-24");
    expect(html).toContain("written vocal range of B3–F#5");
    expect(html).toContain("Octave convention:");
    expect(html).toContain("written B3–F#5 sounds B2–F#4");
    expect(await rendered("taylor-swift")).toContain("Octave convention:");
  });

  it("shows Alex Warren's cited scores at their sounding pitch, inside the displayed range", async () => {
    // Five original-key Musicnotes scores, male line in treble clef: written
    // A3–A5 and G3–G5 sound an octave lower. The page once showed A2–F#4,
    // under every one of them at the top.
    const html = await rendered("alex-warren");
    expect(html).toContain("written vocal range of A3–A5");
    expect(html).toContain("written A3–A5 sounds A2–A4");
    expect(html).toContain("written G3–G5 sounds G2–G4");
    expect(html).toContain("G2 to A4");
    expect(html).not.toContain("F#4 is a reported");
    // Still the human review date: re-reading the scores is not a review.
    expect(getSingerEvidence("alex-warren").reviewedAt).toBe("2026-08-29");
  });

  it("never displays a range narrower than the sounding range of a score it cites", () => {
    // Any source whose octave note gives a sounding compass ("sounds X–Y")
    // is evidence the page puts beside its own range; the range has to hold it.
    const sounding = /sounds ([A-G][#b]?\d)\u2013([A-G][#b]?\d)/;
    let checked = 0;
    for (const slug of Object.keys(rawEvidence)) {
      const singer = singerBySlug(slug);
      if (!singer) continue;
      for (const source of getSingerEvidence(slug).sources) {
        const m = source.octaveConvention?.match(sounding);
        if (!m) continue;
        checked++;
        expect(singer.lowMidi, `${slug}: ${source.title}`).toBeLessThanOrEqual(labelToMidi(m[1])!);
        expect(singer.highMidi, `${slug}: ${source.title}`).toBeGreaterThanOrEqual(labelToMidi(m[2])!);
      }
    }
    expect(checked).toBeGreaterThanOrEqual(6);
  });

  it.each([
    ["bruno-mars", "Bruno Mars"],
    ["taylor-swift", "Taylor Swift"],
    ["jeff-buckley", "Jeff Buckley"],
    ["billie-eilish", "Billie Eilish"],
  ])("keeps %s schema aligned with confirmed review and limited evidence", async (slug, name) => {
    const html = await rendered(slug);
    const graph = graphFrom(html)["@graph"];
    const page = graph.find((node) => node["@type"] === "WebPage")!;
    const person = graph.find((node) => node["@type"] === "Person")!;
    const faq = graph.find((node) => node["@type"] === "FAQPage")!;

    expect(page.name).toMatch(/^.+ Vocal Range: Reported /);
    expect(page.description).toContain("reported reference span");
    expect(page.description).not.toMatch(/pending/i);
    expect(page).not.toHaveProperty("reviewedBy");
    expect(page.lastReviewed).toBeUndefined();
    expect(page.dateModified).toBe("2026-10-24");
    const sources = getSingerEvidence(slug).sources;
    if (sources.length) expect(page.citation).toHaveLength(sources.length);
    else expect(page).not.toHaveProperty("citation");
    expect(person.description).toContain(name);
    expect(String(person.description)).not.toMatch(/individual evidence review is pending/i);
    expect(JSON.stringify(faq)).toContain(`What voice type is ${name}?`);
  });

  it("uses one breadcrumb source for visible navigation and JSON-LD", async () => {
    const html = await rendered("adele");
    const graph = graphFrom(html);
    const page = graph["@graph"].find((node) => node["@type"] === "WebPage")!;
    const breadcrumb = page.breadcrumb as {
      itemListElement: Array<{ name: string; item: string }>;
    };

    expect(html).toMatch(/<nav[^>]*aria-label="Breadcrumb"/);
    expect(html).toMatch(/href="\/singers"[^>]*>Famous vocal ranges<\/a>/);
    expect(html).toContain("<span aria-current=\"page\">Adele</span>");
    expect(breadcrumb.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Famous vocal ranges",
        item: `${SITE_URL}/singers`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Adele",
        item: `${SITE_URL}/singers/adele`,
      },
    ]);
  });

  it("adds review schema and citations only to dated evidence records", async () => {
    const html = await rendered("adele");
    const graph = graphFrom(html);
    const page = graph["@graph"].find((node) => node["@type"] === "WebPage")!;

    // The review date is lastReviewed; dateModified matches the sitemap lastmod.
    expect(page.lastReviewed).toBe("2026-08-29");
    expect(page.dateModified).toBe(getSingerPageLastModified("adele"));
    expect(page.reviewedBy).toEqual({ "@type": "Person", name: "Jason Colapietro" });
    expect(page.citation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "CreativeWork",
          name: "Adele's voice: power, fragile self and authentic artistry",
        }),
      ]),
    );
  });

  it.each(REVIEWED_SLUGS)("does not put unsupported additionalProperty on %s Person schema", async (slug) => {
    const graph = graphFrom(await rendered(slug));
    const person = graph["@graph"].find((node) => node["@type"] === "Person");
    expect(person).not.toHaveProperty("additionalProperty");
  });

  it.each(REVIEWED_SLUGS)("keeps %s primary and FAQ answers scoped to reported reference spans", async (slug) => {
    const html = await rendered(slug);
    const visibleHtml = html.replace(/<script[\s\S]*?<\/script>/g, "");
    const graph = graphFrom(html);
    const faq = graph["@graph"].find((node) => node["@type"] === "FAQPage") as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    // Range answers stay scoped to the reported span; the voice-type answer is
    // the reviewed evidence copy and only has to be visible and register-free.
    const voiceType = faq.mainEntity.filter((q) => q.name.startsWith("What voice type is"));
    const answers = faq.mainEntity
      .filter((q) => !q.name.startsWith("What voice type is"))
      .map((question) => question.acceptedAnswer.text);

    expect(voiceType).toHaveLength(1);
    expect(visibleHtml).toContain(voiceType[0].acceptedAnswer.text);
    expect(answers).toHaveLength(5);
    for (const answer of answers) {
      expect(answer).toContain("reported reference span");
      expect(answer.toLowerCase()).not.toMatch(
        /\b(full voice|falsetto|head voice|whistle register)\b/,
      );
      expect(visibleHtml).toContain(answer);
    }
  });

  it.each(VOICE_TYPE_QUESTION_SLUGS)("answers the explicit voice-type question for %s", async (slug, name) => {
    const html = await rendered(slug);
    expect(html).toContain(`What voice type is ${name}?`);
  });

  it.each(DISPUTED_VOICE_TYPE_COPY)("makes attributed or disputed language visible for %s", async (slug, wording) => {
    expect(await rendered(slug)).toContain(wording);
  });
});
