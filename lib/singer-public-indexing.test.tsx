import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/singers-data", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/singers-data")>();
  return {
    ...original,
    SINGERS: [...original.SINGERS, {
      ...original.SINGERS[0],
      slug: "future-public-singer",
      name: "Future Public Singer",
    }],
  };
});

import { generateMetadata } from "@/app/singers/[slug]/page";
import sitemap from "@/app/sitemap";
import { getSingerEvidence, isSingerReviewed } from "@/lib/singer-evidence";
import { INDEXABLE_ROBOTS } from "@/lib/robots-meta";
import { SITE_URL } from "@/lib/site";

// A new published record must not inherit a past review confirmation, and its
// actual pending status must never silently exclude it from public discovery.
describe("future published singer indexing", () => {
  it("keeps a new pending profile indexable and included in the sitemap", async () => {
    const slug = "future-public-singer";
    expect(getSingerEvidence(slug)).toEqual({ status: "pending", sources: [] });
    expect(isSingerReviewed(slug)).toBe(false);
    const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
    expect(metadata.robots).toEqual(INDEXABLE_ROBOTS);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/singers/${slug}`);
    expect(sitemap().filter((entry) => entry.url === `${SITE_URL}/singers/${slug}`)).toHaveLength(1);
  });
});
