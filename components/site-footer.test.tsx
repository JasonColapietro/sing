import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SiteFooter from "./site-footer";

describe("the footer's hub columns", () => {
  const html = renderToStaticMarkup(<SiteFooter />);

  it("set their headings in the mono label face, not the h2 serif", () => {
    for (const label of ["By voice type", "By genre"]) {
      const at = html.indexOf(`>${label}</h2>`);
      expect(at, label).toBeGreaterThan(-1);
      const tag = html.slice(html.lastIndexOf("<h2", at), at);
      expect(tag).toContain("font-mono");
      expect(tag).toContain("uppercase");
    }
  });

  it("keep the heading visible from sm up instead of hiding the summary once open", () => {
    expect(html).not.toContain("sm:group-open:hidden");
    expect(html.match(/<summary[^>]*sm:pointer-events-none/g)).toHaveLength(2);
  });

  it("keeps the open-source credentials line", () => {
    expect(html).toContain("open-source contributor with 54 pull requests merged across 46");
  });

  // The phone footer's "All genres" lands on the genre list, not the top of a
  // /singers page whose genre section sits under the chart and the directory.
  it("sends All genres to the genre list on /singers", () => {
    expect(html).toMatch(/href="\/singers#genres"[^>]*>\s*All genres/);
    const page = readFileSync(new URL("../app/singers/page.tsx", import.meta.url), "utf8");
    expect(page).toMatch(/<section id="genres"[^>]*scroll-mt-20[^>]*>\s*<h2[^>]*>Browse by genre<\/h2>/);
  });
});
