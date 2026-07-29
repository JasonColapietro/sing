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

/** Clipboard with a plotted plan — adaptive coach. */
export function CoachGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="3" width="12" height="14" rx="2" />
      <path d="M8 3.5V2.5h4v1M7 8h6M7 11h4M7 14h5" />
    </svg>
  );
}

/** Bars with a rising trend line — deep analytics. */
export function AnalyticsGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 16.5v-4M8 16.5v-7M12.5 16.5v-5M17 16.5v-9" />
      <path d="M3 9c3-1 5-4.5 8-4.5 2 0 3.5 1 6-1.5" opacity="0.7" />
    </svg>
  );
}

/** Tape reels — take analysis + backup. */
export function TakesGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <circle cx="6" cy="8" r="3.5" />
      <circle cx="14" cy="8" r="3.5" />
      <circle cx="6" cy="8" r="1" />
      <circle cx="14" cy="8" r="1" />
      <path d="M4 16.5h12M6 11.5c1 2 7 2 8 0" />
    </svg>
  );
}

/** Stacked songbook with a note — full library. */
export function SongbookGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 4.5h9v13h-9z" />
      <path d="M12.5 6h2.5v11.5h-9" />
      <path d="M9.5 12.5V8l2-0.6" />
      <circle cx="8.3" cy="12.7" r="1.2" />
    </svg>
  );
}

/** Layered rising arcs — pro warmup packs. */
export function PacksGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M2.5 15c3 0 3-5 6-5s3 3 6 3 2.5-6 3-7" />
      <path d="M2.5 18c4 0 4.5-3.5 7.5-3.5s3.5 2 7.5 1" opacity="0.6" />
    </svg>
  );
}

/** Cloud with sync arrows — cloud sync. */
export function SyncGlyph(props: GlyphProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 14.5a3.5 3.5 0 0 1-.3-7A4.6 4.6 0 0 1 14.6 9 3 3 0 0 1 14 14.5H6z" />
      <path d="M8.5 17.5 10 19l1.5-1.5" opacity="0.7" />
      <path d="M10 15v4" opacity="0.7" />
    </svg>
  );
}
