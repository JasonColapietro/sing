import { ImageResponse } from "next/og";
import { SINGERS, spanOctaves } from "@/lib/singers";
import { HubOgCard } from "@/components/singers/og-card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The widest cited vocal ranges, ranked";

export default function Image() {
  const rows = [...SINGERS]
    .sort((a, b) => b.highMidi - b.lowMidi - (a.highMidi - a.lowMidi))
    .slice(0, 5);
  const axisLow = Math.floor(Math.min(...rows.map((s) => s.lowMidi)) / 12) * 12;
  const axisHigh = Math.ceil(Math.max(...rows.map((s) => s.highMidi)) / 12) * 12;

  return new ImageResponse(
    (
      <HubOgCard
        kicker="Extremes"
        title="The record holders"
        stat={`Widest of ${SINGERS.length} voices — up to ${spanOctaves(rows[0].highMidi - rows[0].lowMidi)} octaves`}
        rows={rows}
        axisLow={axisLow}
        axisHigh={axisHigh}
      />
    ),
    size,
  );
}
