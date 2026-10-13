import { ImageResponse } from "next/og";
import { genreFromSlug } from "@/lib/singers";
import { genreCardProps, hubCardVersion } from "@/lib/og-cards";
import { HubOgCard } from "@/components/singers/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Famous singers' vocal ranges by genre";

/**
 * One card per genre hub, at a URL versioned by what it draws
 * (/singers/genre/<slug>/opengraph-image/<version>), as the singer cards are.
 * Next's own ?hash only follows this file's source, so round 3's Opera
 * correction shipped at the URL share scrapers had cached the old card under.
 */
export function generateImageMetadata({ params }: { params?: { genre?: string } }) {
  // As on the singer cards: `next build` asks once with no genre, and an
  // unknown genre has no card, so both get none (and a 404 at the URL).
  const g = params?.genre ? genreFromSlug(params.genre) : undefined;
  const card = g ? genreCardProps(g) : undefined;
  return card ? [{ id: hubCardVersion(card), alt, size, contentType }] : [];
}

export default async function Image({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await params;
  const g = genreFromSlug(genre);
  const card = g ? genreCardProps(g) : undefined;
  if (!card) return new Response("Not found", { status: 404 });

  return new ImageResponse(<HubOgCard {...card} />, size);
}
