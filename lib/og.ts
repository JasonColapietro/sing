import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Shape of the sitewide fallback share card, owned here rather than in
 * app/opengraph-image.tsx so a route can name the card without importing a
 * module that pulls in next/og.
 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export const OG_IMAGE_ALT =
  "Suede Sing — the vocal studio in your browser: live pitch, range test, warmups, ear training";

/**
 * The sitewide card, shaped for a route's own `openGraph.images`.
 *
 * Next resolves metadata one segment at a time and *replaces* `openGraph`
 * wholesale at the deepest segment that declares one — it does not merge the
 * object field by field — while the file-convention image is attached only to
 * the segment holding the file. So a page that declares `openGraph` to carry
 * its own title, with no `opengraph-image.tsx` beside it, silently drops the
 * root card and ships with no share image at all.
 *
 * That is not hypothetical: a production sweep on 2026-08-28 found eight such
 * pages sharing imageless — /range, /songs, /extension, /changelog, /book,
 * /glossary, /atlas and /atlas/vocal-range-by-voice-type — including the two
 * (/range, /extension) that paid and organic social both point at. Spread this
 * into any route that declares `openGraph` and has no card of its own; the
 * test beside this file fails the build if a new one forgets.
 */
export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/opengraph-image`,
  width: OG_IMAGE_SIZE.width,
  height: OG_IMAGE_SIZE.height,
  alt: OG_IMAGE_ALT,
  type: "image/png",
};

/**
 * Keep a route's Open Graph identity on the same absolute URL as its canonical.
 *
 * Next does not derive `og:url` from `alternates.canonical`, and a child route
 * cannot safely inherit the root URL because that would identify every page as
 * the homepage. Route modules therefore pass their existing metadata through
 * this helper once. Data-driven routes cover every generated page from that
 * one template rather than repeating a URL field per output.
 *
 * Routes with their own `openGraph` object retain it, including file-convention
 * images beside the route. Routes that previously relied on the root card need
 * the explicit fallback image because adding an `openGraph` object replaces the
 * parent segment's object instead of merging it field by field.
 */
export function withCanonicalOpenGraph(metadata: Metadata): Metadata {
  const canonical = metadata.alternates?.canonical;
  const url =
    typeof canonical === "object" && canonical && "url" in canonical
      ? canonical.url
      : canonical;

  if (!url) {
    throw new Error("withCanonicalOpenGraph requires alternates.canonical");
  }

  const existing = metadata.openGraph;
  const title = typeof metadata.title === "string" ? metadata.title : undefined;
  const description =
    typeof metadata.description === "string" ? metadata.description : undefined;

  return {
    ...metadata,
    openGraph: {
      title,
      description,
      type: "website",
      ...(existing ? {} : { images: [DEFAULT_OG_IMAGE] }),
      ...existing,
      url,
    } as Metadata["openGraph"],
  };
}
