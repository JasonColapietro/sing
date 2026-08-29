/** Static routes below /singers that generated artist pages may not occupy. */
export const RESERVED_SINGER_SLUGS = new Set([
  "records",
  "genre",
  "voice-type",
  "methodology",
]);

/**
 * Makes static-route collisions a compiler error before a generated catalog
 * can shadow a server page. The deliberately tiny entry shape keeps this
 * seam importable by both the compiler and fixture tests.
 */
export function assertNoReservedSingerSlugs(entries) {
  for (const entry of entries) {
    if (RESERVED_SINGER_SLUGS.has(entry.slug)) {
      throw new Error(`reserved singer slug "${entry.slug}" collides with a static /singers route`);
    }
  }
}
