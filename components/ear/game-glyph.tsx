import type { ReactNode } from "react";
import type { GameId } from "./lib";

/**
 * One 24px stroke glyph per ear game, in `currentColor`, before a game's name
 * on a path row or a routine chip (the ear room's PatternGlyph).
 */
const GLYPHS: Record<GameId, ReactNode> = {
  // Two notes: one up, one down.
  "higher-lower": (
    <>
      <path d="M8 19V5" />
      <path d="M4.5 8.5 8 5l3.5 3.5" />
      <path d="M16 5v14" />
      <path d="m12.5 15.5 3.5 3.5 3.5-3.5" />
    </>
  ),
  // Two notes and the gap between them, bracketed.
  interval: (
    <>
      <circle cx="7" cy="17" r="2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="7" r="2" fill="currentColor" stroke="none" />
      <path d="M4 12V4h4" />
      <path d="M20 12v8h-4" />
    </>
  ),
  // A sung note landing on its target line.
  "pitch-match": (
    <>
      <path d="M3 12h18" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  // A dot riding a trace toward the next note.
  "note-catcher": (
    <>
      <path d="M3 17c3 0 4-6 7-6s4 4 7 4" />
      <circle cx="19" cy="7" r="2" fill="currentColor" stroke="none" />
    </>
  ),
  // A short melody's contour.
  "melody-echo": <path d="M3 16l4.5-5 4 3 4-7 5 4" />,
};

export function GameGlyph({ game, className }: { game: GameId; className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {GLYPHS[game]}
    </svg>
  );
}
