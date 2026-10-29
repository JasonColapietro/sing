/**
 * The chip rows scroll sideways inside the browse card. At 375px each row grew
 * to its chips' 699px in the grid's implicit auto track, so it never scrolled:
 * Band "Peak" and five genres sat past the screen edge, cut off by the page's
 * overflow clip, with no tap, swipe or visible focus reaching them.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ALL_SONGS } from "./data";
import { BrowseControls, DEFAULT_BROWSE, browseOptions } from "./browse-controls";

describe("the browse card's chip rows", () => {
  const html = renderToStaticMarkup(
    <BrowseControls
      state={DEFAULT_BROWSE}
      onChange={() => {}}
      options={browseOptions(ALL_SONGS)}
      hasRange={false}
      onSurprise={() => {}}
      resultCount={ALL_SONGS.length}
      totalCount={ALL_SONGS.length}
      favoriteCount={0}
    />,
  );

  it("sit in a grid whose phone track can be narrower than a row's chips", () => {
    // grid-cols-1 is minmax(0, 1fr); an implicit track is auto, sized to content.
    expect(html).toContain('class="grid grid-cols-1 gap-3 sm:grid-cols-2"');
  });

  it("let each row shrink to its track, so the row itself scrolls", () => {
    const rows = [...html.matchAll(/<div( class="[^"]*")?><div class="font-mono[^"]*">[^<]+<\/div><div role="group"/g)];
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for (const row of rows) expect(row[1]).toBe(' class="min-w-0"');
    expect(html).toMatch(/role="group" aria-label="Genre" class="[^"]*overflow-x-auto/);
  });
});

describe("the browse card's chip rows on a first visit", () => {
  const render = (state: typeof DEFAULT_BROWSE) =>
    renderToStaticMarkup(
      <BrowseControls
        state={state}
        onChange={() => {}}
        options={browseOptions(ALL_SONGS)}
        hasRange={false}
        onSurprise={() => {}}
        resultCount={ALL_SONGS.length}
        totalCount={ALL_SONGS.length}
        favoriteCount={0}
      />,
    );

  it("fold under More filters, so the first band of songs is not pushed down by six open rows", () => {
    const html = render(DEFAULT_BROWSE);
    expect(html).toMatch(/<details><summary[^>]*>More filters<\/summary><div class="grid grid-cols-1 gap-3 sm:grid-cols-2">/);
    // Search, sort and the quick chips stay outside it.
    const folded = html.slice(html.indexOf("<details"));
    expect(folded).not.toContain('type="search"');
    expect(folded).not.toContain("Fits my range");
  });

  it("open from the start when a chip is already chosen, and say how many", () => {
    const genre = browseOptions(ALL_SONGS).genre[0];
    const html = render({ ...DEFAULT_BROWSE, genre: [genre] });
    expect(html).toMatch(/<details open=""><summary[^>]*>More filters \(1\)<\/summary>/);
  });
});
