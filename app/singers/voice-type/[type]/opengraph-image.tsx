import { ImageResponse } from "next/og";
import {
  singersByVoiceType,
  spanOctaves,
  voiceTypeFromSlug,
} from "@/lib/singers";
import { statsFor } from "@/lib/singers-analysis";
import { HubOgCard } from "@/components/singers/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Famous singers' vocal ranges by voice type";

export default async function Image({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const voice = voiceTypeFromSlug(type);
  if (!voice) return new Response("Not found", { status: 404 });

  const list = singersByVoiceType(voice);
  const stats = statsFor(list);
  if (!stats) return new Response("Not found", { status: 404 });

  // Widest spans read best on a card — they show the category's reach.
  const rows = [...list]
    .sort((a, b) => b.highMidi - b.lowMidi - (a.highMidi - a.lowMidi))
    .slice(0, 5);
  const axisLow = Math.floor(stats.lowest.lowMidi / 12) * 12;
  const axisHigh = Math.ceil(stats.highest.highMidi / 12) * 12;

  return new ImageResponse(
    (
      <HubOgCard
        kicker="Voice type"
        title={`Famous ${voice.toLowerCase()}s`}
        stat={`Cited ranges · median ${spanOctaves(stats.medianSpanSemitones)} octaves`}
        rows={rows}
        axisLow={axisLow}
        axisHigh={axisHigh}
      />
    ),
    size,
  );
}
