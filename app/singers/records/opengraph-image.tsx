import { ImageResponse } from "next/og";
import { hubCardVersion, recordsCardProps } from "@/lib/og-cards";
import { HubOgCard } from "@/components/singers/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Reported catalog vocal range extremes, ranked";

/**
 * One card at a URL versioned by what it draws
 * (/singers/records/opengraph-image/<version>), as the singer cards are: a
 * catalog correction that moves the widest five or the extremes moves the URL.
 */
export function generateImageMetadata() {
  return [{ id: hubCardVersion(recordsCardProps()), alt, size, contentType }];
}

export default function Image() {
  return new ImageResponse(<HubOgCard {...recordsCardProps()} />, size);
}
