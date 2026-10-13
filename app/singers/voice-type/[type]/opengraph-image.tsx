import { ImageResponse } from "next/og";
import { voiceTypeFromSlug } from "@/lib/singers";
import { hubCardVersion, voiceTypeCardProps } from "@/lib/og-cards";
import { HubOgCard } from "@/components/singers/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Famous singers' vocal ranges by voice type";

/**
 * One card per voice-type hub, at a URL versioned by what it draws
 * (/singers/voice-type/<slug>/opengraph-image/<version>), as the singer cards
 * are. Next's own ?hash only follows this file's source, not the catalog.
 */
export function generateImageMetadata({ params }: { params?: { type?: string } }) {
  // As on the singer cards: `next build` asks once with no type, and an
  // unknown type has no card, so both get none (and a 404 at the URL).
  const voice = params?.type ? voiceTypeFromSlug(params.type) : undefined;
  const card = voice ? voiceTypeCardProps(voice) : undefined;
  return card ? [{ id: hubCardVersion(card), alt, size, contentType }] : [];
}

export default async function Image({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const voice = voiceTypeFromSlug(type);
  const card = voice ? voiceTypeCardProps(voice) : undefined;
  if (!card) return new Response("Not found", { status: 404 });

  return new ImageResponse(<HubOgCard {...card} />, size);
}
