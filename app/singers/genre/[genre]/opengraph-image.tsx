import { ImageResponse } from "next/og";
import { genreFromSlug, singersByGenre, spanOctaves } from "@/lib/singers";
import { statsFor } from "@/lib/singers-analysis";
import { HubOgCard } from "@/components/singers/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Famous singers' vocal ranges by genre";

export default async function Image({
  params,
}: {
  params: Promise<{ genre: string }>;
}) {
  const { genre } = await params;
  const g = genreFromSlug(genre);
  if (!g) return new Response("Not found", { status: 404 });

  const list = singersByGenre(g);
  const stats = statsFor(list);
  if (!stats) return new Response("Not found", { status: 404 });

  const rows = [...list]
    .sort((a, b) => b.highMidi - b.lowMidi - (a.highMidi - a.lowMidi))
    .slice(0, 5);
  const axisLow = Math.floor(stats.lowest.lowMidi / 12) * 12;
  const axisHigh = Math.ceil(stats.highest.highMidi / 12) * 12;

  return new ImageResponse(
    (
      <HubOgCard
        kicker="Genre"
        title={`${g} vocal ranges`}
        stat={`Median span ${spanOctaves(stats.medianSpanSemitones)} octaves`}
        rows={rows}
        axisLow={axisLow}
        axisHigh={axisHigh}
      />
    ),
    size,
  );
}
