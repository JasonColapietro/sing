import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { gradeForScore, starGlyphs, starRatingLabel } from "./grade";
import { ShareableResult, shareText } from "./result-card";

/**
 * One end screen, one star count. A practice room's results screen shows the
 * three-star practice scale (lib/stars.ts) at the top; its share card used to
 * show the songbook's five-star rating for the same run, so a 72 read as one
 * star above and "★★★★☆ (4/5)" below.
 */
describe("share card star scale", () => {
  const grade = gradeForScore(72)!;

  it("keeps the songbook's five stars when no scale is passed", () => {
    expect(grade.stars).toBe(4);
    expect(shareText("Danny Boy", undefined, 72, grade, [])).toContain("★★★★☆ (4/5)");
    const html = renderToStaticMarkup(<ShareableResult title="Danny Boy" score={72} grade={grade} />);
    expect(html).toContain("★★★★☆");
    expect(html).toContain("4 of 5 stars");
  });

  it("shows and shares a practice room's own count when it passes one", () => {
    const scale = { stars: 1, max: 3 };
    const text = shareText("Lip trills", undefined, 72, grade, [], scale);
    expect(text).toContain("★☆☆ (1/3)");
    expect(text).not.toContain("/5");
    const html = renderToStaticMarkup(
      <ShareableResult title="Lip trills" score={72} grade={grade} starScale={scale} />,
    );
    expect(html).toContain("★☆☆");
    expect(html).toContain("1 of 3 stars");
    expect(html).not.toContain("of 5 stars");
  });

  it("clamps glyphs to the scale it is given", () => {
    expect(starGlyphs(5, 3)).toBe("★★★");
    expect(starGlyphs(-1, 3)).toBe("☆☆☆");
    expect(starGlyphs(2)).toBe("★★☆☆☆");
    expect(starRatingLabel(2, 3)).toBe("2 of 3 stars");
  });
});
