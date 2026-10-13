/**
 * The example coach report on /pro and the homepage is sample data, labelled
 * as such — but it must not show a habit the product advises against or a
 * plan the coach cannot produce.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EXERCISES } from "@/components/warmups/exercises";
import ProVisual from "./pro-visual";

const html = renderToStaticMarkup(<ProVisual />);

describe("the example coach report", () => {
  it("charts range tests weeks apart, never a weekly testing habit", () => {
    expect(html).toContain("RANGE / 3 TESTS · 12 WEEKS");
    expect(html).toContain("three range tests about six weeks apart");
    expect(html).not.toMatch(/8 WEEKS|eight weeks/i);
  });

  it("names a next step the coach plan can emit: a free catalogue exercise of at most 6 minutes", () => {
    const m = /Tomorrow: ([^,<]+), (\d+) min/.exec(html);
    expect(m).not.toBeNull();
    expect(EXERCISES.map((e) => e.title)).toContain(m![1]);
    expect(Number(m![2])).toBeLessThanOrEqual(6);
  });
});
