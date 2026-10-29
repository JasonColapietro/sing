import { describe, expect, it } from "vitest";
import { escapeRe, openPath, pathRow } from "./warmups.mjs";

describe("warmups path helpers", () => {
  it("anchors a row's name on the exact title", () => {
    let query;
    const page = { getByRole: (role, options) => (query = { role, ...options }) };
    pathRow(page, "Lip trill (5-note)");
    expect(query.role).toBe("button");
    expect(query.name.test("Lip trill (5-note) 3 stars")).toBe(true);
    expect(query.name.test("Minor Lip trill (5-note)")).toBe(false);
    expect(escapeRe("a.b*")).toBe("a\\.b\\*");
  });

  it("opens the fold through the page and never throws", async () => {
    let ran = 0;
    await openPath({ evaluate: async () => void ran++ });
    await openPath({ evaluate: async () => Promise.reject(new Error("closed")) });
    expect(ran).toBe(1);
  });
});
