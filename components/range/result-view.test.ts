import { describe, expect, it } from "vitest";

import { comparisonSingerFromSlug } from "./result-view";

describe("range result singer return path", () => {
  it("resolves a valid singer from the comparison query", () => {
    expect(comparisonSingerFromSlug("bruno-mars")).toMatchObject({
      slug: "bruno-mars",
      name: "Bruno Mars",
    });
  });

  it("ignores absent and unknown comparison targets", () => {
    expect(comparisonSingerFromSlug(null)).toBeNull();
    expect(comparisonSingerFromSlug("not-a-real-singer")).toBeNull();
  });
});
