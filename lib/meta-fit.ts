/**
 * Length guards for search-result metadata.
 *
 * Titles over 60 characters and descriptions over 160 are truncated in the
 * result page, which cuts the claim mid-word. Hand-written copy on the main
 * routes is already inside the limits; these helpers are the net for the
 * templated families (lessons, songs, chapters, hubs) where one template
 * writes hundreds of strings.
 */

/** The root layout appends " · Suede Sing" (13 characters) to every title. */
export const TITLE_SUFFIX = " · Suede Sing";
export const MAX_TITLE = 60;
export const MAX_TITLE_BODY = MAX_TITLE - TITLE_SUFFIX.length;
export const MAX_DESCRIPTION = 155;

const SEPARATORS = [" · ", " | ", " — ", " - ", ": "];

function lastSeparator(text: string): number {
  let at = -1;
  for (const sep of SEPARATORS) {
    const i = text.lastIndexOf(sep);
    if (i > at) at = i;
  }
  return at;
}

const DANGLING =
  /\s+(?:and|or|the|a|an|of|to|in|on|for|with|your|you|is|are|that|from|by)$/i;

function trimToWords(text: string, max: number): string {
  if (text.length <= max) return text;
  let cut = text.slice(0, max + 1);
  cut = cut.slice(0, Math.max(cut.lastIndexOf(" "), 1));
  let prev = "";
  while (prev !== cut) {
    prev = cut;
    cut = cut.replace(/[\s,;:·|—-]+$/, "").replace(DANGLING, "");
  }
  return cut;
}

/**
 * Fit a title (without the layout suffix unless `max` says otherwise) by
 * dropping trailing " · ", ": " or " — " clauses first, then trailing words.
 */
export function fitTitle(title: string, max: number = MAX_TITLE_BODY): string {
  let out = title.trim();
  while (out.length > max) {
    const at = lastSeparator(out);
    if (at < 12) break;
    out = out.slice(0, at).trim();
  }
  return trimToWords(out, max);
}

/**
 * Fit a description by keeping whole sentences, then whole clauses, then
 * whole words. The result always ends in a full stop.
 */
export function fitDescription(
  description: string,
  max: number = MAX_DESCRIPTION,
): string {
  const text = description.trim();
  if (text.length <= max) return text;
  const window = text.slice(0, max);
  // A sentence ends at ./!/? followed by a space or the window's edge, so a
  // decimal such as "2.4 octaves" is never cut in half.
  let sentence = -1;
  for (const m of window.matchAll(/[.!?](?=\s|$)/g)) sentence = m.index ?? -1;
  if (sentence >= 80) return window.slice(0, sentence + 1);
  for (const re of [/[;:—](?=[^;:—]*$)/, /,(?=[^,]*$)/]) {
    const at = window.search(re);
    if (at >= 80) return `${window.slice(0, at).replace(/[\s,;:—-]+$/, "")}.`;
  }
  const words = trimToWords(text, max - 1);
  return `${words.replace(/[.!?]+$/, "")}.`;
}
