import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import Page from "@/app/atlas/vocal-range-by-voice-type/page";
import { AUTHOR_ID, AUTHOR_NAME, AUTHOR_NODE } from "@/lib/author";

describe("/atlas/vocal-range-by-voice-type byline", () => {
  const html = renderToStaticMarkup(<Page />);

  it("shows the author its JSON-LD names, as the atlas chapters and the glossary do", () => {
    expect(html).toContain(`"author":{"@id":"${AUTHOR_ID}"}`);
    expect(html).toMatch(
      new RegExp(`<a href="${AUTHOR_NODE.url}" rel="author"[^>]*>${AUTHOR_NAME}</a>`),
    );
    // Above the first answer, not only in the sitewide footer.
    expect(html.indexOf('rel="author"')).toBeLessThan(html.indexOf("The short answer"));
  });
});
