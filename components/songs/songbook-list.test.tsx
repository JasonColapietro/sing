import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SONGS } from "./data";
import { SongbookList } from "./songbook-list";

describe("the /songs songbook rows", () => {
  it("draw each song's opening contour beside its link", () => {
    const html = renderToStaticMarkup(<SongbookList songs={SONGS} />);
    expect(html.match(/<li>/g)).toHaveLength(SONGS.length);
    expect(html.match(/<polyline /g)).toHaveLength(SONGS.length);
  });

  it("lets a long title wrap on a phone instead of cutting it off", () => {
    const html = renderToStaticMarkup(<SongbookList songs={SONGS} />);
    const title = html.match(/<span class="([^"]*)">[^<]*<\/span><span class="block font-mono/)?.[1] ?? "";
    expect(title).toContain("text-sm");
    expect(title).not.toContain("truncate");
  });
});
