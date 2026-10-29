import type { Metadata } from "next";
import { describe, expect, it } from "vitest";
import { metadata as analyzeMetadata } from "@/app/analyze/page";
import { metadata as atlasMetadata } from "@/app/atlas/page";
import { generateMetadata as atlasChapterMetadata } from "@/app/atlas/[slug]/page";
import { metadata as bookMetadata } from "@/app/book/page";
import { generateMetadata as bookChapterMetadata } from "@/app/book/[slug]/page";
import { metadata as breathMetadata } from "@/app/breath/page";
import { metadata as earTrainingMetadata } from "@/app/ear-training/page";
import { metadata as glossaryMetadata } from "@/app/glossary/page";
import { metadata as proMetadata } from "@/app/pro/page";
import { metadata as progressMetadata } from "@/app/progress/page";
import { metadata as recorderMetadata } from "@/app/recorder/page";
import { generateMetadata as genreMetadata } from "@/app/singers/genre/[genre]/page";
import { metadata as recordsMetadata } from "@/app/singers/records/page";
import { generateMetadata as voiceTypeMetadata } from "@/app/singers/voice-type/[type]/page";
import { metadata as songsMetadata } from "@/app/songs/page";
import { generateMetadata as songMetadata } from "@/app/songs/[slug]/page";
import { metadata as studioMetadata } from "@/app/studio/page";
import { metadata as toolsMetadata } from "@/app/tools/page";
import { metadata as warmupsMetadata } from "@/app/warmups/page";

function canonicalValue(metadata: Metadata): string | URL | null | undefined {
  const canonical = metadata.alternates?.canonical;
  return typeof canonical === "object" && canonical && "url" in canonical
    ? canonical.url
    : canonical;
}

function expectCanonicalOpenGraphUrl(metadata: Metadata): void {
  expect(metadata.openGraph?.url).toBe(canonicalValue(metadata));
}

describe("canonical Open Graph URLs", () => {
  it.each([
    ["analyze", analyzeMetadata],
    ["atlas", atlasMetadata],
    ["book", bookMetadata],
    ["breath", breathMetadata],
    ["ear training", earTrainingMetadata],
    ["glossary", glossaryMetadata],
    ["pro", proMetadata],
    ["progress", progressMetadata],
    ["recorder", recorderMetadata],
    ["singer records", recordsMetadata],
    ["songs", songsMetadata],
    ["studio", studioMetadata],
    ["tools", toolsMetadata],
    ["warmups", warmupsMetadata],
  ] as const)("keeps the %s page's og:url equal to its canonical", (_name, metadata) => {
    expectCanonicalOpenGraphUrl(metadata);
  });

  it.each([
    ["genre hub", () => genreMetadata({ params: Promise.resolve({ genre: "grunge" }) })],
    ["voice-type hub", () => voiceTypeMetadata({ params: Promise.resolve({ type: "soprano" }) })],
    ["song detail", () => songMetadata({ params: Promise.resolve({ slug: "amazing-grace" }) })],
    ["Atlas chapter", () => atlasChapterMetadata({ params: Promise.resolve({ slug: "how-to-read-an-entry" }) })],
    ["book chapter", () => bookChapterMetadata({ params: Promise.resolve({ slug: "reading-the-range-test" }) })],
  ] as const)("keeps the %s template's og:url equal to its canonical", async (_name, generate) => {
    const metadata = await generate();
    expectCanonicalOpenGraphUrl(metadata);
  });
});
