import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suede Sing — the vocal studio in your browser",
    short_name: "Suede Sing",
    description:
      "Real-time pitch training, vocal range testing, guided warmups, ear training, breath work, a recorder and song practice — free, in the browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f0e7",
    theme_color: "#f7f0e7",
    categories: ["music", "education"],
    orientation: "portrait",
    // Built by scripts/build-icons.mjs. "any" and "maskable" are deliberately
    // separate files: a maskable icon is cropped to the platform's own shape,
    // so the same artwork can't serve both without either clipping the mark or
    // floating it in too much space.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // The two rooms someone installing this app actually opens first.
    shortcuts: [
      {
        name: "Pitch studio",
        short_name: "Studio",
        url: "/studio",
        description: "Live pitch feedback against target notes",
      },
      {
        name: "Vocal range test",
        short_name: "Range",
        url: "/range",
        description: "Find your lowest and highest notes",
      },
    ],
  };
}
