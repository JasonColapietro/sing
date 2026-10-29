import type { ReactNode } from "react";
import { SourceFilterFigure } from "@/components/book/source-filter-figure";
import {
  PianoRollFigure,
  RangeFigure,
  SpectrogramFigure,
  TraceFigure,
  WaveformFigure,
} from "@/components/figures";
import { ReferenceFigure, type ReferenceFigureKind } from "@/components/learn/reference-figure";
import { ChromaticStrip } from "@/components/singers/chromatic-strip";
import { labelToMidi } from "@/lib/audio/notes";

/**
 * The figures a chapter can place with `::figure <id> [key=value…] | caption`
 * (see lib/markdown.tsx). Every component here is hook-free SVG, so the
 * registry is safe in server pages, in the two "use client" readers, and in
 * the PDF builders, which render it to static markup. It deliberately imports
 * no singer data, so a chapter bundle stays small.
 */
export type FigureArgs = Record<string, string>;

function ref(kind: ReferenceFigureKind) {
  return function ReferenceFigureBlock() {
    return <ReferenceFigure kind={kind} className="mx-auto h-auto w-full max-w-[22rem]" />;
  };
}

export const MARKDOWN_FIGURES: Record<string, (args: FigureArgs) => ReactNode> = {
  "source-filter": () => <SourceFilterFigure className="h-auto w-full" />,
  "range-test": () => <RangeFigure className="h-auto w-full" />,
  "pitch-trace": () => <TraceFigure className="h-auto w-full" />,
  "piano-roll": () => <PianoRollFigure className="h-auto w-full" />,
  waveform: () => <WaveformFigure className="h-auto w-full" />,
  spectrogram: () => <SpectrogramFigure className="h-auto w-full" />,
  semitone: ref("semitone"),
  registers: ref("registers"),
  spans: ref("spans"),
  support: ref("support"),
  harmonics: ref("harmonics"),
  /** `strip low=C3 high=C6 belt=A5`: a keyboard strip with a cited span. */
  strip: (a) => {
    const low = labelToMidi(a.low ?? "");
    const high = labelToMidi(a.high ?? "");
    if (low == null || high == null || high <= low) return null;
    const belt = a.belt ? labelToMidi(a.belt) : null;
    return <ChromaticStrip low={low} high={high} beltMidi={belt} />;
  },
};

/** `::figure id [k=v…] [| caption]`, one line. */
export const FIGURE_LINE = /^::figure\s+([a-z][a-z-]*)((?:\s+[a-z]+=[^\s|]+)*)\s*(?:\|\s*(.+))?$/;

export function parseFigureLine(
  line: string,
): { id: string; args: FigureArgs; caption: string | null } | null {
  const m = FIGURE_LINE.exec(line.trim());
  if (!m) return null;
  const args: FigureArgs = {};
  for (const pair of m[2].trim().split(/\s+/).filter(Boolean)) {
    const at = pair.indexOf("=");
    args[pair.slice(0, at)] = pair.slice(at + 1);
  }
  return { id: m[1], args, caption: m[3]?.trim() || null };
}
