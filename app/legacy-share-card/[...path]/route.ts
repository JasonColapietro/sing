import { generateImageMetadata as singerImage } from "@/app/singers/[slug]/opengraph-image";
import { generateImageMetadata as songImage } from "@/app/songs/[slug]/opengraph-image";
import { generateImageMetadata as genreImage } from "@/app/singers/genre/[genre]/opengraph-image";
import { generateImageMetadata as voiceTypeImage } from "@/app/singers/voice-type/[type]/opengraph-image";
import { generateImageMetadata as recordsImage } from "@/app/singers/records/opengraph-image";
import { generateImageMetadata as singersImage } from "@/app/singers/opengraph-image";

function currentImage(path: string[]) {
  if (path.length === 1 && path[0] === "singers") return singersImage()[0];
  if (path.length === 2 && path[0] === "singers") {
    return path[1] === "records" ? recordsImage()[0] : singerImage({ params: { slug: path[1] } })[0];
  }
  if (path.length === 2 && path[0] === "songs") return songImage({ params: { slug: path[1] } })[0];
  if (path.length === 3 && path[0] === "singers") {
    if (path[1] === "genre") return genreImage({ params: { genre: path[2] } })[0];
    if (path[1] === "voice-type") return voiceTypeImage({ params: { type: path[2] } })[0];
  }
}

/** The six old image paths reach this handler through next.config rewrites. */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const image = currentImage(path);
  if (!image) return new Response("Not found", { status: 404 });

  // The current version can change with the card's content. A permanent or
  // cached redirect would strand a scraper on yesterday's removed version.
  // Build the destination only from validated route segments, never a query.
  return new Response(null, {
    status: 307,
    headers: {
      Location: `/${path.map(encodeURIComponent).join("/")}/opengraph-image/${encodeURIComponent(image.id)}`,
      "Cache-Control": "no-store",
    },
  });
}
