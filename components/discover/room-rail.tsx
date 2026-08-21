import Link from "next/link";
import type { ComponentProps, ReactElement } from "react";
import { SectionLabel } from "@/components/ui";
import {
  AnalyzeGlyph,
  BreathGlyph,
  EarGlyph,
  ProgressGlyph,
  RangeGlyph,
  RecorderGlyph,
  SingersGlyph,
  SongGlyph,
  StudioGlyph,
  ToolsGlyph,
  WarmupGlyph,
} from "@/components/landing/glyphs";

/**
 * What else exists, shown from inside a room.
 *
 * Ten header tabs cannot hold thirteen rooms, so Recorder and Analyze lost
 * theirs and became two grey links at the bottom of Tools. This is the rail
 * that puts them back in front of a singer who is already practicing, and
 * ROOMS is the one array everything reads from so a room can never be listed
 * in two places with two different descriptions.
 */

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export interface Room {
  href: string;
  /** Room name as the rest of the site writes it. Recorder and Analyze have no
   *  header tab, which is the reason this rail exists, so header parity is not
   *  the rule here: matching whatever surface does name the room is. */
  label: string;
  /** One line, under about ninety characters so it fits two lines at 375px. */
  blurb: string;
  Glyph: (props: ComponentProps<"svg">) => ReactElement;
  /** True when the room cannot do anything without microphone permission. */
  mic: boolean;
}

interface RoomRailProps {
  /** Pathname of the room you are already in. It is filtered out. */
  current?: string;
  /** How many rooms to show. Default 4. */
  limit?: number;
  /** Tape label above the rail. Default "More practice rooms". */
  title?: string;
  className?: string;
}

/**
 * Fixed order, not shuffled: a random rail would hydrate differently than it
 * rendered, and the whole reason this exists is that Recorder and Analyze lost
 * their header tabs. They sit third and fourth so they surface on any page that
 * shows four.
 */
export const ROOMS: readonly Room[] = [
  { href: "/studio", label: "Pitch studio", blurb: "Live note, cents, and an eight-second trace.", Glyph: StudioGlyph, mic: true },
  { href: "/warmups", label: "Warmups", blurb: "Guided ladders, scored while you sing them.", Glyph: WarmupGlyph, mic: true },
  { href: "/recorder", label: "Take recorder", blurb: "Cut a take, compare two, keep the good ones.", Glyph: RecorderGlyph, mic: true },
  { href: "/analyze", label: "Spectrogram and tone", blurb: "Your harmonics live, plus today's vocal load.", Glyph: AnalyzeGlyph, mic: true },
  { href: "/range", label: "Range test", blurb: "Your lowest and highest note, and your voice type.", Glyph: RangeGlyph, mic: true },
  { href: "/ear-training", label: "Ear training", blurb: "Interval, pitch-matching, and melody games.", Glyph: EarGlyph, mic: true },
  { href: "/breath", label: "Breath control", blurb: "Timed breathing and sustain for steadier phrases.", Glyph: BreathGlyph, mic: true },
  { href: "/songs", label: "Song practice", blurb: "Melodies transposed into your comfortable range.", Glyph: SongGlyph, mic: true },
  { href: "/singers", label: "Famous ranges", blurb: "Famous voices on one keyboard, with yours overlaid.", Glyph: SingersGlyph, mic: false },
  { href: "/tools", label: "Tools", blurb: "Metronome, keyboard, and a drone for reference.", Glyph: ToolsGlyph, mic: false },
  { href: "/progress", label: "Progress", blurb: "XP, streaks, and a coach that plans the next session.", Glyph: ProgressGlyph, mic: false },
] as const;

export function RoomRail({
  current,
  limit = 4,
  title = "More practice rooms",
  className,
}: RoomRailProps) {
  // Exact match, not startsWith: a nested page like /singers/adele should pass
  // current="/singers" on purpose rather than have a prefix rule guess for it.
  const rooms = ROOMS.filter((r) => r.href !== current).slice(0, limit);

  // A named landmark wrapping an empty list is worse than no landmark: a
  // screen reader still announces the rail and the tape label still prints.
  if (rooms.length === 0) return null;

  return (
    <nav aria-label={title} className={cn(className)}>
      <SectionLabel>{title}</SectionLabel>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {rooms.map(({ href, label, blurb, Glyph, mic }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full flex-col rounded-xl border border-line bg-panel p-3 transition-colors hover:border-amber/50 sm:p-4"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-panel2 text-amber-ink">
                <Glyph width={16} height={16} />
              </span>
              <span className="mt-3 block font-display text-sm text-ink group-hover:text-amber-ink">
                {label}
              </span>
              <span className="mt-1 block text-xs text-mut">{blurb}</span>
              <span className="mt-3 block font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                {mic ? "Needs mic" : "No mic needed"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * The rail as a full-width band, matching the spacing of the guide band it
 * sits above. Rooms render it through this rather than placing RoomRail
 * directly, so the eight practice rooms cannot drift apart on padding.
 */
export function RoomRailBand({ current }: { current: string }) {
  return (
    <section className="border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <RoomRail current={current} />
      </div>
    </section>
  );
}
