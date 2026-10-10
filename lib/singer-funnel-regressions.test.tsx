/** Regressions from the September 27 adversarial singer-funnel audit. */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const visitor = vi.hoisted(() => ({ range: { lowMidi: 48, highMidi: 72 } as { lowMidi?: number; highMidi?: number } }));

vi.mock("server-only", () => ({}));
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(public element: ReactNode) {}
  },
}));
vi.mock("@/lib/progress", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/progress")>(),
  useProgress: () => visitor,
}));
vi.mock("@/components/pro/gate", () => ({
  ProInlineNudge: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

import SingerPage from "@/app/singers/[slug]/page";
import SingerImage from "@/app/singers/[slug]/opengraph-image";
import LearnPage from "@/app/learn/page";
import { CompareWithMe } from "@/components/singers/singer-actions";
import { singerBySlug } from "@/lib/singers";
import { FREE_DAILY_SEC } from "@/lib/free-cap";
import { RANGE_GUIDE } from "@/lib/guides";

describe("singer evidence and comparison regressions", () => {
  it("keeps the singer-directory breadcrumb easy to tap", async () => {
    const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug: "adele" }) }));
    const breadcrumb = html.match(/<a\b[^>]*>Famous vocal ranges<\/a>/)?.[0];
    expect(breadcrumb).toContain("min-h-11");
  });
  it("does not prescribe pushing past a vocal wall or infer anatomy from range", () => {
    const copy = JSON.stringify(RANGE_GUIDE);
    expect(copy).not.toContain("keep climbing");
    expect(copy).not.toContain("probably holding chest voice");
    expect(copy).not.toContain("voices built like yours");
    expect(copy).not.toContain("Most voices reach further");
    expect(copy).toContain("Stop rather than push past discomfort");
    expect(copy).toContain("not a prediction of your maximum");
  });
  it.each([
    ["sam-smith", "Evidence disputed"],
    ["olivia-rodrigo", "Evidence disputed"],
    ["adele", "Sources reviewed"],
    ["bruno-mars", "Individual review pending"],
  ])("qualifies %s shared images without asserting a voice type", async (slug, status) => {
    const result = await SingerImage({ params: Promise.resolve({ slug }) }) as unknown as { element: ReactNode };
    const html = renderToStaticMarkup(<>{result.element}</>);
    expect(html).not.toContain(singerBySlug(slug)!.voiceType);
    expect(html).toContain("REPORTED VOCAL RANGE");
    expect(html).toContain(status);
  });
  it("discloses the shared guided allowance before the exercise links", () => {
    expect(FREE_DAILY_SEC).toBe(300);
    const learn = renderToStaticMarkup(<LearnPage />).replace(/<!--.*?-->/g, "");
    expect(learn).toContain("An example 20-minute practice plan");
    expect(learn).toContain("5 minutes a day");
    expect(learn.indexOf("5 minutes a day")).toBeLessThan(learn.indexOf("Choose the problem"));
    expect(learn).toContain('href="/pro"');
    expect(learn).not.toContain("Twenty focused minutes beats");
  });

  it("preserves the singer comparison when a returning visitor retakes", () => {
    visitor.range = { lowMidi: 48, highMidi: 72 };
    const html = renderToStaticMarkup(<CompareWithMe s={singerBySlug("olivia-rodrigo")!} />);
    const retake = html.match(/<a\b[^>]*>Retake the range test<\/a>/)?.[0];
    expect(retake).toContain('href="/range?compare=olivia-rodrigo"');
  });

  it("preserves the first-time visitor's direct range-test path", () => {
    visitor.range = {};
    const html = renderToStaticMarkup(<CompareWithMe s={singerBySlug("olivia-rodrigo")!} />);
    expect(html).toContain('href="/range?compare=olivia-rodrigo"');
    expect(html).toContain("reported reference span");
  });

  it("recommends practice based on the visitor, not a celebrity gap", () => {
    visitor.range = { lowMidi: 48, highMidi: 72 };
    const html = renderToStaticMarkup(<CompareWithMe s={singerBySlug("olivia-rodrigo")!} />);
    expect(html).not.toContain("Train toward the gap");
    expect(html).not.toContain("daily plan around this gap");
    expect(html).toContain("Practice in your comfortable range");
    expect(html).toContain("not a training target");
  });

  it("does not derive register claims from Olivia's disputed catalog labels", async () => {
    const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug: "olivia-rodrigo" }) }));
    expect(html).toContain("does not establish a definitive classical classification");
    expect(html).not.toContain("cited full-voice ceiling of E5");
    expect(html).not.toContain("range conventionally starts (A3)");
    expect(html).not.toContain("How Olivia Rodrigo uses that range");
    expect(html).toContain('href="#evidence"');
    expect(html).toContain('id="evidence"');
  });

  it("does not restore Arijit's disputed tenor label in editorial copy", async () => {
    const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug: "arijit-singh" }) }));
    expect(html).toContain("dispute a definitive tenor label");
    expect(html).not.toContain("Light nasal tenor");
  });
});
