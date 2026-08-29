import "server-only";

/**
 * The catalog-wide caveat that belongs anywhere we describe a singer range.
 * Keep this server-only: it is editorial copy for static pages, not directory
 * client state, and one source prevents the hub, profiles, and methodology
 * from quietly assigning it different meanings.
 */
export const SINGER_RANGE_DISCLAIMER =
  "These are the approximate figures fans and music journalists commonly cite — the widest notes a singer has recorded, not the comfortable range they sing in every night, and not lab measurements. Treat them as a fun reference, not a target.";
