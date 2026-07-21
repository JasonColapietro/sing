import type { ComponentProps } from "react";

type GlyphProps = ComponentProps<"svg">;

function base(props: GlyphProps): GlyphProps {
  return {
    viewBox: "0 0 20 20",
    width: 20,
    height: 20,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

/** Waveform bars — pitch studio. */
export function StudioGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 10h1.5M5 6.5v7M8 3.5v13M11 6v8M14 4.5v11M17 8v4" />
    </svg>
  );
}

/** Rising siren arc — warmups. */
export function WarmupGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 15c3 0 3-6 6-6s3 4 6 4 3-8 4-9" />
      <circle cx="2" cy="15" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Up-down arrows between staff lines — range test. */
export function RangeGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 3h14M3 17h14M10 6v8M7.5 8.5 10 6l2.5 2.5M7.5 11.5 10 14l2.5-2.5" />
    </svg>
  );
}

/** Sound arcs into an ear-like curve — ear training. */
export function EarGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 16.5a3 3 0 0 1-3-3c0-4 2-9 6-9s6 3.5 6 6.5" />
      <path d="M10 8a2.5 2.5 0 0 1 2.5 2.5c0 2-2 2-2 4" />
    </svg>
  );
}

/** Expanding breath rings — breath control. */
export function BreathGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 3.5a6.5 6.5 0 0 1 6.5 6.5M10 16.5A6.5 6.5 0 0 1 3.5 10" />
    </svg>
  );
}

/** Eighth note — song practice. */
export function SongGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 15.5V4.5l7-1.5v10" />
      <circle cx="6" cy="15.5" r="2" />
      <circle cx="13" cy="13" r="2" />
    </svg>
  );
}

/** Mic capsule — recorder. */
export function RecorderGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" />
      <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5" />
    </svg>
  );
}

/** Metronome — tools. */
export function ToolsGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M7.5 3h5l2.5 14h-10L7.5 3Z" />
      <path d="M10 13 14 6" />
      <circle cx="14" cy="6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Rising chart line — progress. */
export function ProgressGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 3v14h14" />
      <path d="M6 13l3.5-4 2.5 2 4-5.5" />
    </svg>
  );
}
