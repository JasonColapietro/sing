/**
 * Every program's id, in lib/programs.ts PROGRAMS order. Restated rather than
 * read from PROGRAMS because next.config.ts needs them to route the deep link
 * `/programs?program=<id>`, and lib/programs.ts reaches the warmup, breath and
 * song libraries through "@/" imports the config should not load. A test in
 * next-config.test.ts holds this list to PROGRAMS.
 */
export const PROGRAM_IDS = [
  "recovery-week",
  "foundations-2w",
  "vibrato-3w",
  "high-notes-6w",
  "mix-4w",
  "measured-voice-12w",
] as const;

/**
 * A program's own view: `/programs?program=<id>`, the address today's card,
 * the programs list and the book link to.
 *
 * Every link to it is a plain `<a>`, never next/link. The server answers
 * this address from /programs/<id> (the rewrite in next.config.ts), but the
 * client router cannot see a rewrite that keys on the query: once it has
 * learned /programs (the list, which every page's room links reach), it
 * predicts that /programs?program=<id> is the same page, and a prefetch or
 * client navigation asks the server for the list's segment at an address
 * that serves a program. The server answers 404 (a failed request in the
 * console of every page that shows one of these links, which the runtime
 * audit gates on). A document navigation lets the server pick the page.
 */
export function programViewHref(id: string): string {
  return `/programs?program=${encodeURIComponent(id)}`;
}
