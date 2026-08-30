"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LyricLine, SongNote } from "./data";
import { lyricLineAtBeat } from "./lib";

/** One syllable, plus the note index that carries its timing. */
interface Syllable {
  noteIndex: number;
  text: string;
}

/**
 * Split a lyric line into words of syllables, using the same `wordEnd` rule as
 * `lyricLines()`. Words are the wrapping unit — "Twin" and "kle" must never be
 * split across two visual lines, but the wipe still has to advance syllable by
 * syllable inside the word.
 */
function wordsOf(line: LyricLine, notes: SongNote[]): Syllable[][] {
  const words: Syllable[][] = [];
  let current: Syllable[] = [];
  for (const noteIndex of line.noteIndices) {
    const note = notes[noteIndex];
    if (!note) continue;
    current.push({ noteIndex, text: note.lyric });
    if (note.wordEnd !== false) {
      words.push(current);
      current = [];
    }
  }
  if (current.length > 0) words.push(current);
  return words;
}

const SIZES = {
  md: {
    current: "text-2xl leading-tight sm:text-3xl",
    next: "text-sm leading-snug sm:text-base",
  },
  lg: {
    current: "text-3xl leading-tight sm:text-5xl",
    next: "text-base leading-snug sm:text-xl",
  },
} as const;

/**
 * Karaoke lyric band: the current line large, the next line previewed under
 * it, and the active syllable wiping violet left-to-right in time with the
 * music.
 *
 * The wipe is a per-syllable overlay whose width is written straight to the DOM
 * from a rAF loop. Two things fall out of that choice. First, nothing here
 * re-renders at frame rate — React only sees a state change when the *line*
 * turns over, a few times a song. Second, clipping each syllable separately
 * (rather than clipping the line as one box) is what keeps the wipe correct
 * when the line wraps at 375px, because each syllable is measured in its own
 * inline box.
 */
export function LyricBand({
  lines,
  notes,
  positionBeatsRef,
  size = "md",
  className,
}: {
  lines: LyricLine[];
  /** The song's notes, same indexing as `line.noteIndices`. */
  notes: SongNote[];
  /** Beats elapsed within the song, or null while idle/count-in. */
  positionBeatsRef: React.RefObject<number | null>;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [lineIndex, setLineIndex] = useState(0);

  const safeIndex = lines.length > 0 ? Math.min(lineIndex, lines.length - 1) : 0;
  const line = lines[safeIndex];
  const words = useMemo(() => (line ? wordsOf(line, notes) : []), [line, notes]);

  // Next line wraps around: on a looping phrase the line after the last one is
  // genuinely the first one again, and previewing it is the point.
  const nextLine =
    lines.length > 1 ? lines[(safeIndex + 1) % lines.length] : undefined;

  const fillsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const writtenRef = useRef<number[]>([]);

  useEffect(() => {
    if (!line) return;
    // Widths are cached per position within the line, so the cache is only
    // valid for as long as this line is the one on screen.
    writtenRef.current = [];
    let raf = 0;

    const tick = () => {
      const pos = positionBeatsRef.current;

      // While idle or counting in there is no position yet: park on the first
      // line with nothing filled, so the singer reads what is coming.
      const target = pos === null ? 0 : lyricLineAtBeat(lines, pos);
      if (target !== safeIndex) {
        setLineIndex(target);
        return; // this effect re-runs for the new line and restarts the loop
      }

      // Read the ref array every frame: a re-render from the player detaches
      // and reattaches these inline callback refs, so a captured array would
      // go stale (and null) underneath us.
      const fills = fillsRef.current;
      const written = writtenRef.current;
      for (let i = 0; i < line.noteIndices.length; i++) {
        const el = fills[i];
        if (!el) continue;
        const note = notes[line.noteIndices[i]];
        let pct: number;
        if (pos === null || note === undefined || pos <= note.startBeat) pct = 0;
        else if (pos >= note.startBeat + note.durBeats) pct = 100;
        else pct = ((pos - note.startBeat) / note.durBeats) * 100;

        // Only touch the DOM when the value actually moves — every syllable
        // except the one being sung is unchanged from frame to frame.
        const rounded = Math.round(pct * 2) / 2;
        if (written[i] !== rounded) {
          written[i] = rounded;
          el.style.width = `${rounded}%`;
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [line, lines, notes, positionBeatsRef, safeIndex]);

  const sizes = SIZES[size];
  let syllableSlot = 0;

  return (
    <div className={className}>
      <div
        aria-hidden="true"
        className={`flex flex-wrap gap-x-[0.28em] gap-y-1 font-bold tracking-tight text-mut ${sizes.current}`}
      >
        {words.map((word, w) => (
          <span key={w} className="whitespace-nowrap">
            {word.map((syllable) => {
              const slot = syllableSlot++;
              return (
                <span key={syllable.noteIndex} className="relative inline-block">
                  {syllable.text}
                  <span
                    ref={(el) => {
                      fillsRef.current[slot] = el;
                    }}
                    className="absolute inset-y-0 left-0 w-0 overflow-hidden whitespace-nowrap text-violet-ink"
                  >
                    {syllable.text}
                  </span>
                </span>
              );
            })}
          </span>
        ))}
      </div>

      {nextLine && (
        <div aria-hidden="true" className={`mt-2 text-dim ${sizes.next}`}>
          {nextLine.text}
        </div>
      )}

      {/* The visual band is a wipe animation, not text a reader can follow, so
          it is hidden and the line is announced once per turnover instead. */}
      <p className="sr-only" aria-live="polite">
        {line?.text ?? ""}
      </p>
    </div>
  );
}
