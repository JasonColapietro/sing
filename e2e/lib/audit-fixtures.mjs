/** One representative for every generated template the audit promises. */
export const TEMPLATE_PATHS = [
  "/singers/adele",
  "/singers/genre/pop",
  "/singers/voice-type/soprano",
  "/songs/silent-night",
  "/can-you-sing/espresso",
  "/book/getting-started",
  "/atlas/tessitura",
  "/learn/voice/foundations",
  "/learn/voice/foundations/your-voice",
  "/learn/voice/foundations/your-voice/first-note",
];

export const TEMPLATE_SITEMAP = TEMPLATE_PATHS
  .map((path) => `<loc>https://sing.suedeai.ai${path}</loc>`).join("");
