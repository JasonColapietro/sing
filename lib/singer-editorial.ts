import "server-only";

/**
 * The catalog-wide caveat that belongs anywhere we describe a singer range.
 * Keep this server-only: it is editorial copy for static pages, not directory
 * client state, and one source prevents the hub, profiles, and methodology
 * from quietly assigning it different meanings.
 */
export const SINGER_RANGE_DISCLAIMER =
  "These are approximate catalog reference spans. Most profiles have not had both endpoints individually verified against named recordings or scores. They are not lab measurements or comfortable everyday ranges; use them for comparison, not as training targets.";
