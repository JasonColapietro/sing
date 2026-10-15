import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { GET } from "@/app/legacy-share-card/[...path]/route";

describe("legacy share-card route boundaries", () => {
  it.each([
    ["singers", "adele/../../example.com"],
    ["singers", "adele", "extra"],
    ["singers", "genre", "opera", "extra"],
    ["songs", "scarborough-fair", "extra"],
    ["unknown", "adele"],
    ["https:", "example.com"],
  ])("does not invent an image for %j", async (...path) => {
    const response = await GET(new Request("https://sing.suedeai.ai/legacy-share-card/unused"), {
      params: Promise.resolve({ path }),
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
  });
});
