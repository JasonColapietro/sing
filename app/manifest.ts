import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suede Sing — the vocal studio in your browser",
    short_name: "Suede Sing",
    description:
      "Real-time pitch training, vocal range testing, guided warmups, ear training, breath work, a recorder and song practice — free, in the browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e0c09",
    theme_color: "#0e0c09",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
