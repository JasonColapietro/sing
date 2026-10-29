/** Regressions from the September 27 adversarial singer-funnel audit. */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";

const visitor = vi.hoisted(() => ({ range: { lowMidi: 48, highMidi: 72 } as { lowMidi?: number; highMidi?: number } }));
const plan = vi.hoisted(() => ({ pro: false }));

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
vi.mock("@/lib/pro", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/pro")>(),
  useIsPro: () => plan.pro,
}));
vi.mock("@/components/pro/gate", () => ({
  ProInlineNudge: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}));

import SingerPage from "@/app/singers/[slug]/page";
import { ATLAS } from "@/lib/atlas-data";
import SingerImage from "@/app/singers/[slug]/opengraph-image";
import LearnPage from "@/app/learn/page";
import { CompareWithMe, PlayRangeButton } from "@/components/singers/singer-actions";
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
    ["bruno-mars", "Review confirmed"],
  ])("qualifies %s shared images without asserting a voice type", async (slug, status) => {
    const result = await SingerImage({ params: Promise.resolve({ slug }) }) as unknown as { element: ReactNode };
    const html = renderToStaticMarkup(<>{result.element}</>);
    expect(html).not.toContain(singerBySlug(slug)!.voiceType);
    expect(html).toContain("REPORTED VOCAL RANGE");
    expect(html).toContain(status);
  });
  it("states the shared guided allowance once, in the What is free? card", () => {
    expect(FREE_DAILY_SEC).toBe(300);
    const learn = renderToStaticMarkup(<LearnPage />).replace(/<!--.*?-->/g, "");
    expect(learn).toContain("An example 20-minute practice plan");
    expect(learn.split("5 minutes a day").length - 1).toBe(1);
    expect(learn.indexOf("5 minutes a day")).toBeGreaterThan(learn.indexOf("What is free?"));
    expect(learn).toContain('href="/pro"');
    expect(learn).not.toContain("Twenty focused minutes beats");
  });

  it("preserves the singer comparison when a returning visitor retakes", () => {
    visitor.range = { lowMidi: 48, highMidi: 72 };
    const html = renderToStaticMarkup(<CompareWithMe s={singerBySlug("olivia-rodrigo")!} />);
    const retake = html.match(/<a\b[^>]*>Retake the range test<\/a>/)?.[0];
    expect(retake).toContain('href="/range?compare=olivia-rodrigo#start"');
  });

  it("does not send a free singer to a range history the free plan does not show", () => {
    visitor.range = { lowMidi: 48, highMidi: 72 };
    const html = renderToStaticMarkup(<CompareWithMe s={singerBySlug("olivia-rodrigo")!} />);
    expect(html).not.toContain("range history");
    expect(html).toMatch(/<a\b[^>]*href="\/progress"[^>]*>Your saved range<\/a>/);
  });

  it("keeps the range-history label for Pro, where Progress charts it", () => {
    visitor.range = { lowMidi: 48, highMidi: 72 };
    plan.pro = true;
    try {
      const html = renderToStaticMarkup(<CompareWithMe s={singerBySlug("olivia-rodrigo")!} />);
      expect(html).toMatch(/<a\b[^>]*href="\/progress"[^>]*>Your range history<\/a>/);
    } finally {
      plan.pro = false;
    }
  });

  it("names the free guided allowance where the comparison sends singers into practice", () => {
    visitor.range = { lowMidi: 48, highMidi: 72 };
    const html = renderToStaticMarkup(<CompareWithMe s={singerBySlug("olivia-rodrigo")!} />);
    expect(html).toContain('href="/warmups"');
    expect(html).toContain(`${FREE_DAILY_SEC / 60} free minutes a day`);
    // Free already gets the coach's first two steps a day (PLAN_ROWS "Coach
    // plan"); what Pro adds is the full plan, not the coach.
    expect(html).toContain("full coach plan");
    expect(html).not.toContain("coach plans each day");
  });

  it("preserves the first-time visitor's direct range-test path", () => {
    visitor.range = {};
    const html = renderToStaticMarkup(<CompareWithMe s={singerBySlug("olivia-rodrigo")!} />);
    expect(html).toContain('href="/range?compare=olivia-rodrigo#start"');
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
    // The catalog-position section used to bring both claims back in other words.
    expect(html).not.toContain("conventional mezzo-soprano band");
    expect(html).not.toContain("highest full or belted note of E5");
  });

  it("does not measure Sam Smith against the countertenor label the review did not establish", async () => {
    const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug: "sam-smith" }) }));
    expect(html).not.toContain("conventional countertenor band");
    expect(html).not.toContain("catalog countertenors");
    // The label-free catalog facts stay.
    expect(html).toContain("by reported span");
  });

  it("does not restore Arijit's disputed tenor label in editorial copy", async () => {
    const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug: "arijit-singh" }) }));
    expect(html).toContain("dispute a definitive tenor label");
    expect(html).not.toContain("Light nasal tenor");
  });

  it("keeps the reviewed-disputed labels out of the atlas prose", () => {
    // The Pro atlas links each entry to the singer page whose evidence record
    // disputes these labels (data/singer-evidence.json), so its prose may not
    // assert them either. The catalog-label pill stays, as on the free hubs.
    const entry = (slug: string) => ATLAS.flatMap((c) => c.entries).find((x) => x.slug === slug)!;
    const prose = (slug: string) => `${entry(slug).blurb} ${entry(slug).technique}`;
    expect(prose("arijit-singh")).not.toMatch(/tenor/i);
    expect(prose("alex-warren")).not.toMatch(/baritone/i);
  });

  /**
   * Whatever a server page hands a client component is serialized into the
   * page source. The full singer record carries the blurb and technique notes,
   * which are the Pro atlas's entry prose and appear on no free page, so
   * neither may reach the element tree at all: not the client components'
   * props, and not any other element's.
   */
  it.each(["adele", "sam-smith", "olivia-rodrigo"])(
    "keeps %s's paid atlas entry notes out of the page's payload",
    async (slug) => {
      const tree = await SingerPage({ params: Promise.resolve({ slug }) });
      const elements: ReactElement[] = [];
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) node.forEach(walk);
        else if (isValidElement(node)) {
          elements.push(node);
          Object.values(node.props as Record<string, unknown>).forEach(walk);
        }
      };
      walk(tree);

      const record = singerBySlug(slug)!;
      const paid = [record.blurb, record.technique ?? ""];
      for (const text of paid) expect(text.length, `${slug} has entry notes to leak`).toBeGreaterThan(40);

      const clients = elements.filter((el) => el.type === CompareWithMe || el.type === PlayRangeButton);
      expect(clients.map((el) => el.type)).toEqual(expect.arrayContaining([CompareWithMe, PlayRangeButton]));
      for (const el of elements) {
        const own = Object.entries(el.props as Record<string, unknown>).filter(
          ([, value]) => !isValidElement(value) && !Array.isArray(value),
        );
        const json = JSON.stringify(Object.fromEntries(own)) ?? "";
        for (const text of paid) expect(json, `${slug}: ${String(el.type)}`).not.toContain(text);
      }
    },
  );
});
