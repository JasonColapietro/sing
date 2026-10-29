import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SONGS } from "./data";
import { SongLinkList } from "./song-page";

describe("the 'Sing next' song links", () => {
  it("let a long title wrap on a phone instead of cutting it off", () => {
    const html = renderToStaticMarkup(<SongLinkList songs={SONGS} />);
    const titles = [...html.matchAll(/<span class="([^"]*)">[^<]*<\/span><span class="block font-mono/g)].map((m) => m[1]);
    expect(titles).toHaveLength(SONGS.length);
    for (const cls of titles) {
      expect(cls).toContain("text-sm");
      expect(cls).not.toContain("truncate");
    }
  });
});
