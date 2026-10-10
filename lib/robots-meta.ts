import type { Metadata } from "next";

/**
 * The robots <meta> every page ships.
 *
 * The root layout sets INDEXABLE_ROBOTS, so a page that leaves `robots` out
 * inherits the preview allowances. Next merges metadata shallowly, though: a
 * page that sets `robots` at all (even to `undefined`, since the key is still
 * present) replaces the layout's value wholesale. So any page that decides its
 * own indexability goes through pageRobots(), which hands indexable pages the
 * same directives the layout does and keeps the rest noindex.
 *
 * max-image-preview:large lets Google show a full-width image (the route's
 * Open Graph card) in results and Discover; -1 on snippet and video previews
 * means "no limit" rather than leaving the length to Google's default.
 */
type RobotsInfo = Exclude<NonNullable<Metadata["robots"]>, string>;

const PREVIEW_DIRECTIVES = {
  "max-image-preview": "large",
  "max-snippet": -1,
  "max-video-preview": -1,
} as const satisfies RobotsInfo;

export const INDEXABLE_ROBOTS = {
  index: true,
  follow: true,
  ...PREVIEW_DIRECTIVES,
} as const satisfies RobotsInfo;

/** Listed and linked, but kept out of results; links are still followed. */
export const NOINDEX_FOLLOW = { index: false, follow: true } as const satisfies RobotsInfo;

/** Robots for a page that decides its own indexability. */
export function pageRobots(indexable: boolean): RobotsInfo {
  return indexable ? { ...INDEXABLE_ROBOTS } : { ...NOINDEX_FOLLOW };
}
