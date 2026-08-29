import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getSingerEvidence,
  getSingerLastModified,
  getSingerReviewStatus,
  groupEvidenceSources,
  isSingerReviewed,
  validateSingerEvidence,
  voiceTypeEvidenceCopy,
} from "@/lib/singer-evidence";

const REVIEWED_SLUGS = [
  ["olivia-rodrigo", "disputed"],
  ["reba-mcentire", "reviewed"],
  ["alex-warren", "disputed"],
  ["sam-smith", "disputed"],
  ["arijit-singh", "disputed"],
  ["adele", "reviewed"],
] as const;

const APPROVED_SOURCE_URLS = {
  "olivia-rodrigo": [
    "https://www.musicnotes.com/collections/olivia-rodrigo/collection-olivia-rodrigo-guts/CL0010978",
    "https://hummatch.me/artist/olivia-rodrigo",
  ],
  "reba-mcentire": [
    "https://www.masterclass.com/classes/reba-mcentire-teaches-country-music/chapters/singing-3213510a-2f6e-446e-bbf2-d86675aea8cb",
    "https://singingcarrots.com/song?song=reba-mcentire-fancy",
    "https://www.musicnotes.com/sheetmusic/reba-mcentire/fancy/MN0108062_U3",
  ],
  "alex-warren": [
    "https://www.musicnotes.com/sheetmusic/alex-warren/ordinary/MN0299873",
    "https://www.musicnotes.com/sheetmusic/alex-warren/before-you-leave-me/MN0302282",
    "https://www.musicnotes.com/sheetmusic/alex-warren/carry-you-home/MN0294485",
    "https://www.musicnotes.com/sheetmusic/alex-warren/eternity/MN0302267",
    "https://www.musicnotes.com/sheetmusic/alex-warren/burning-down/MN0302281",
  ],
  "sam-smith": [
    "https://www.vh1.com/news/np30pw/sam-smith-vocal-coach-joanna-eden-team-celeb",
    "https://www.musicnotes.com/sheetmusic/sam-smith/lay-me-down/MN0129167",
    "https://hummatch.me/artist/sam-smith",
  ],
  "arijit-singh": [
    "https://www.ticketmaster.com/arijit-singh-tickets/artist/2006598",
    "https://www.musicnotes.com/sheetmusic/arijit-singh/tum-hi-ho/MN0126344_U1",
    "https://singingcarrots.com/artist-range?artist=Arijit+Singh",
  ],
  adele: [
    "https://www.abc.net.au/news/2021-11-28/adele-30-album-voice-power-true-artistry-fragile-self-authentic/100654136",
    "https://profiles.sydney.edu.au/narelle.yeo",
    "https://www.classicfm.com/discover-music/music-theory/has-adele-got-a-good-voice/",
    "https://www.musicnotes.com/sheetmusic/adele/rolling-in-the-deep/MN0089577",
  ],
} as const;

describe("singer evidence", () => {
  it.each(REVIEWED_SLUGS)(
    "records the reviewed status for %s",
    (slug, status) => {
      expect(getSingerReviewStatus(slug)).toBe(status);
      expect(isSingerReviewed(slug)).toBe(true);
      expect(getSingerLastModified(slug)).toBe("2026-08-29");
    },
  );

  it("keeps unreviewed catalog artists explicitly pending", () => {
    expect(getSingerEvidence("aaliyah")).toEqual({
      status: "pending",
      sources: [],
    });
    expect(getSingerReviewStatus("aaliyah")).toBe("pending");
    expect(isSingerReviewed("aaliyah")).toBe(false);
    expect(getSingerLastModified("aaliyah")).toBeUndefined();
  });

  it("uses reviewed and pending voice-type language without overstating a catalog label", () => {
    expect(
      voiceTypeEvidenceCopy({
        slug: "olivia-rodrigo",
        name: "Olivia Rodrigo",
        voiceType: "Mezzo-soprano",
      }),
    ).toBe(
      "Olivia Rodrigo's voice type is disputed in the reviewed sources; this review does not establish a definitive classical classification.",
    );
    expect(
      voiceTypeEvidenceCopy({
        slug: "adele",
        name: "Adele",
        voiceType: "Mezzo-soprano",
      }),
    ).toBe(
      "Reviewed expert analysis describes Adele as a mezzo-soprano, with chest mix to E5.",
    );
    expect(
      voiceTypeEvidenceCopy({
        slug: "aaliyah",
        name: "Aaliyah",
        voiceType: "Soprano",
      }),
    ).toBe(
      "The catalog lists Aaliyah as a soprano; individual evidence review is pending.",
    );
  });

  it("keeps song evidence grouped separately from general sources", () => {
    const groups = groupEvidenceSources(getSingerEvidence("reba-mcentire").sources);

    expect(groups.map(({ label, sources }) => [label, sources.length])).toEqual([
      ["General source evidence", 1],
      ["Song evidence: Fancy", 2],
    ]);
    expect(groups[1].sources.map((source) => source.publisher)).toEqual([
      "Singing Carrots",
      "Musicnotes",
    ]);
  });

  it("pins the approved source URLs and their narrow scopes", () => {
    for (const [slug, urls] of Object.entries(APPROVED_SOURCE_URLS)) {
      expect(getSingerEvidence(slug).sources.map((source) => source.url)).toEqual(urls);
    }
    const rollingInTheDeep = getSingerEvidence("adele").sources.at(-1);
    expect(rollingInTheDeep?.scope).toContain("does not establish a full-career range");
  });

  it("rejects invalid or overbroad evidence records before they can be displayed", () => {
    const reviewedRecord = {
      adele: {
        status: "reviewed",
        reviewedBy: "Jason Colapietro",
        reviewedAt: "2026-08-29",
        voiceTypeCopy:
          "Reviewed expert analysis describes Adele as a mezzo-soprano, with chest mix to E5.",
        sources: [
          {
            title: "Rolling in the Deep",
            publisher: "Musicnotes",
            url: "https://www.musicnotes.com/sheetmusic/adele/rolling-in-the-deep/MN0089577",
            accessedAt: "2026-08-29",
            supportedClaim: "The published score shows a written compass for this arrangement.",
            scope:
              "Written compass for this song arrangement only; does not establish a full-career range.",
            confidence: "moderate",
            kind: "licensed-score",
            song: "Rolling in the Deep",
          },
        ],
      },
    };

    expect(() => validateSingerEvidence({ unknown: reviewedRecord.adele })).toThrow(
      'unknown singer slug "unknown"',
    );
    expect(() =>
      validateSingerEvidence({
        adele: { ...reviewedRecord.adele, reviewedAt: "2026-02-30" },
      }),
    ).toThrow("invalid date");
    expect(() =>
      validateSingerEvidence({
        adele: {
          ...reviewedRecord.adele,
          sources: [{ ...reviewedRecord.adele.sources[0], url: "ftp://example.com" }],
        },
      }),
    ).toThrow('must use an HTTP(S) URL');
    expect(() =>
      validateSingerEvidence({
        adele: {
          ...reviewedRecord.adele,
          sources: [{ ...reviewedRecord.adele.sources[0], scope: "" }],
        },
      }),
    ).toThrow('missing scope');
    expect(() =>
      validateSingerEvidence({
        adele: { ...reviewedRecord.adele, reviewedBy: undefined },
      }),
    ).toThrow('requires a reviewer and review date');
    expect(() =>
      validateSingerEvidence({
        adele: {
          ...reviewedRecord.adele,
          sources: [
            {
              ...reviewedRecord.adele.sources[0],
              supportedClaim:
                "This licensed score proves Adele's full-career vocal range.",
            },
          ],
        },
      }),
    ).toThrow('cannot prove a full-career range');
  });
});
