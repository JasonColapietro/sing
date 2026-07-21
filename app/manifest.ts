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
    icons: [
      {
        src: "/suede-logo.png",
        sizes: "132x132",
        type: "image/png",
      },
    ],
  };
}
