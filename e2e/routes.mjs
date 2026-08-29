/**
 * One route per distinct template, not all 726 sitemap URLs.
 *
 * The singer, song, genre, voice-type and atlas pages are generated from data,
 * so a defect in one is a defect in every sibling. Auditing one of each keeps a
 * full pass inside a few minutes; `--all-singers` widens it when a data-shaped
 * bug is suspected.
 */
export const ROUTES = [
  { path: "/", name: "home", kind: "marketing" },
  { path: "/pro", name: "pro", kind: "marketing" },
  { path: "/tools", name: "tools", kind: "marketing" },
  { path: "/extension", name: "extension", kind: "marketing" },
  { path: "/contact", name: "contact", kind: "marketing" },
  { path: "/changelog", name: "changelog", kind: "marketing" },

  { path: "/studio", name: "studio", kind: "room", mic: true },
  { path: "/warmups", name: "warmups", kind: "room", mic: true },
  { path: "/range", name: "range", kind: "room", mic: true },
  { path: "/songs", name: "songs", kind: "room", mic: true },
  { path: "/recorder", name: "recorder", kind: "room", mic: true },
  { path: "/analyze", name: "analyze", kind: "room", mic: true },
  { path: "/breath", name: "breath", kind: "room", mic: true },
  { path: "/ear-training", name: "ear-training", kind: "room", mic: true },

  { path: "/progress", name: "progress", kind: "app" },
  { path: "/glossary", name: "glossary", kind: "reference" },
  { path: "/book", name: "book", kind: "reference" },
  { path: "/atlas", name: "atlas", kind: "reference" },
  { path: "/atlas/vocal-range-by-voice-type", name: "atlas-voice-type", kind: "reference" },

  { path: "/singers", name: "singers-directory", kind: "directory" },
  { path: "/singers/methodology", name: "singers-methodology", kind: "reference" },
  { path: "/singers/records", name: "singers-records", kind: "directory" },

  { path: "/sign-in", name: "sign-in", kind: "auth" },
  { path: "/sign-up", name: "sign-up", kind: "auth" },
];

/** Data-driven templates get one real slug each, discovered from the sitemap. */
export async function discoverTemplateRoutes(baseUrl) {
  const res = await fetch(`${baseUrl}/sitemap.xml`);
  const xml = await res.text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => { try { return new URL(m[1]).pathname; } catch { return null; } })
    .filter(Boolean);

  const firstUnder = (prefix, depth) =>
    paths.find((p) => p.startsWith(prefix) && p.split("/").filter(Boolean).length === depth);

  const picks = [
    { path: firstUnder("/singers/", 2), name: "singer-detail", kind: "detail" },
    { path: firstUnder("/singers/genre/", 3), name: "singer-genre", kind: "directory" },
    { path: firstUnder("/singers/voice-type/", 3), name: "singer-voice-type", kind: "directory" },
    { path: firstUnder("/songs/", 2), name: "song-detail", kind: "detail" },
    { path: firstUnder("/book/", 2), name: "book-chapter", kind: "reference" },
    { path: firstUnder("/atlas/", 2), name: "atlas-chapter", kind: "reference" },
  ].filter((r) => r.path);

  return picks;
}

export const VIEWPORTS = [
  { name: "mobile-320", width: 320, height: 720 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "desktop-1920", width: 1920, height: 1080 },
];
