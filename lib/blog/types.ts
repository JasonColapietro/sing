/**
 * The Singer's Column: long-form articles on the questions singers search for
 * most ("how to sing high notes", "how to sing in tune"), each one ending in a
 * room on this site where the reader can practice what it describes.
 *
 * A post is data, not a page module: app/blog/[slug]/page.tsx renders every
 * post the same way, so the metadata, structured data and sitemap rules hold
 * for each without being repeated per article. lib/blog/blog.test.ts checks
 * every post against this shape.
 */

/** A note name as the rest of the site spells it: "C4", "F#5", "Bb3". */
export type NoteLabel = string;

/** A numbered method: what to do, in order. */
export interface StepsInfographic {
  kind: "steps";
  title: string;
  steps: ReadonlyArray<{ label: string; detail: string }>;
}

/** Horizontal bars on one scale, for figures that compare by size. */
export interface BarsInfographic {
  kind: "bars";
  title: string;
  /** What the numbers measure, printed under the title ("seconds", "minutes a day"). */
  unit: string;
  bars: ReadonlyArray<{ label: string; value: number; note?: string }>;
  /** Where the numbers come from, or how to read them. Required: no bare numbers. */
  source: string;
}

/** Two or three options side by side, compared row by row. */
export interface CompareInfographic {
  kind: "compare";
  title: string;
  columns: readonly string[];
  rows: ReadonlyArray<{ label: string; cells: readonly string[] }>;
}

/** Spans on a keyboard strip: voice types, registers, a song's range. */
export interface RangeInfographic {
  kind: "range";
  title: string;
  spans: ReadonlyArray<{ label: string; low: NoteLabel; high: NoteLabel }>;
  source: string;
}

/** A short checklist of signs: what good feels like, or when to stop. */
export interface ChecklistInfographic {
  kind: "checklist";
  title: string;
  /** "do" items get a check, "avoid" items a cross; text carries the meaning too. */
  items: ReadonlyArray<{ tone: "do" | "avoid"; text: string }>;
}

export type Infographic =
  | StepsInfographic
  | BarsInfographic
  | CompareInfographic
  | RangeInfographic
  | ChecklistInfographic;

/** A YouTube video, verified to exist (oEmbed 200) when the post was written. */
export interface BlogVideo {
  youtubeId: string;
  title: string;
  /** The channel as YouTube names it, so the credit is accurate. */
  channel: string;
  /** One sentence: why this video is worth the reader's time here. */
  why: string;
}

/** A link to a page on this site or a sibling Suede property. */
export interface BlogLink {
  href: string;
  label: string;
  /** One line on what the reader will find there. */
  blurb: string;
}

export interface BlogFaq {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  /** The H1. Carries the primary keyword. */
  title: string;
  /** The <title> body, fitted by the route; 60 chars with the suffix. */
  seoTitle: string;
  /** Meta description, 70–155 characters. */
  description: string;
  /** The one query this post owns on the site; also first in `keywords`. */
  primaryKeyword: string;
  /** 3–9 terms, primary first, lowercase, no punctuation. "suede sing" is appended. */
  keywords: readonly string[];
  /** ISO date first published. */
  published: string;
  /** ISO date last meaningfully changed. */
  updated: string;
  /** Minutes to read, rounded. */
  readMinutes: number;
  /** Column section: groups posts on the index. */
  category: "Technique" | "Pitch" | "Range" | "Health" | "Practice";
  /** Two or three sentences shown first: the direct answer to the query. */
  answer: string;
  /**
   * The article in the site's markdown (lib/markdown.tsx): `##`/`###`
   * headings, paragraphs, `-` lists, `>` quotes, pipe tables, internal
   * `[label](/path)` links. Two extra line directives place media:
   * `::infographic <key>` and `::video <key>`, each on its own line.
   */
  body: string;
  infographics: Readonly<Record<string, Infographic>>;
  videos: Readonly<Record<string, BlogVideo>>;
  faq: readonly BlogFaq[];
  /** The practice rooms and sibling pages this article sends a reader to. */
  related: readonly BlogLink[];
  /** The one room that does what the article teaches; the closing CTA. */
  cta: { href: string; label: string; pitch: string };
}
