"use client";

import { useEffect, useRef } from "react";
import type { Judgment } from "./lib";

/**
 * One judged note, written by the player the instant a note's window closes.
 *
 * `seq` is what the readout watches: two identical judgments in a row are
 * different events, and comparing labels could not tell them apart.
 */
export interface JudgmentEvent {
  judgment: Judgment;
  /** The combo *after* this note, so flash and counter never disagree. */
  combo: number;
  /** Monotonic within a session. */
  seq: number;
}

const LABELS: Record<Judgment, string> = {
  perfect: "Perfect",
  great: "Great",
  good: "Good",
  miss: "Miss",
};

const TONES: Record<Judgment, string> = {
  perfect: "text-ok-ink",
  great: "text-ok-ink",
  good: "text-violet-ink",
  miss: "text-rec",
};

/** How long a judgment holds before it fades. Roughly one beat at 90bpm. */
const HOLD_MS = 700;

const FLASH_BASE = {
  md: "text-lg font-bold tracking-tight",
  lg: "text-2xl font-bold tracking-tight sm:text-3xl",
} as const;

const COMBO_BASE = {
  md: "tabular font-mono text-sm text-mut",
  lg: "tabular font-mono text-lg text-mut",
} as const;

/**
 * Per-note judgment flash plus a live combo counter.
 *
 * Both are driven by a rAF that writes text and classes straight to the DOM.
 * Judgments arrive a few times a second, so React state would work — but it
 * would re-render the whole player on every note, and the player is also the
 * thing scheduling audio. Reading refs keeps that path completely quiet.
 *
 * Marked aria-hidden on purpose: a note-by-note announcement would talk over
 * the singer continuously. The running score, the lyric line and the end-of-
 * session summary carry this information for screen readers instead.
 */
export function JudgmentReadout({
  eventRef,
  comboRef,
  size = "md",
  className,
}: {
  /** Latest judged note, or null when a session has not judged anything yet. */
  eventRef: React.RefObject<JudgmentEvent | null>;
  /** Current unbroken run of non-miss notes. */
  comboRef: React.RefObject<number>;
  size?: keyof typeof FLASH_BASE;
  className?: string;
}) {
  const flashRef = useRef<HTMLSpanElement | null>(null);
  const comboElRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const base = FLASH_BASE[size];
    let raf = 0;
    let lastSeq = -1;
    let lastCombo = -1;
    let shownAt = 0;
    let faded = true;
    let tone = "";

    const tick = () => {
      raf = requestAnimationFrame(tick);

      const flash = flashRef.current;
      const event = eventRef.current;
      if (flash) {
        if (event === null) {
          if (lastSeq !== -1) {
            lastSeq = -1;
            flash.textContent = "";
            flash.className = base;
          }
        } else if (event.seq !== lastSeq) {
          lastSeq = event.seq;
          shownAt = performance.now();
          faded = false;
          tone = TONES[event.judgment];
          flash.textContent = LABELS[event.judgment];
          // Drop the animation class and force a reflow, otherwise re-adding it
          // for a repeat judgment does not restart the animation.
          flash.className = base;
          void flash.offsetWidth;
          flash.className = `${base} ${tone} animate-fadeup`;
        } else if (!faded && performance.now() - shownAt > HOLD_MS) {
          faded = true;
          // Removing the animation hands opacity back to CSS, which is what
          // lets the transition run from the animated value down to zero.
          flash.className = `${base} ${tone} opacity-0 transition-opacity duration-500`;
        }
      }

      const combo = comboRef.current ?? 0;
      if (combo !== lastCombo) {
        lastCombo = combo;
        const el = comboElRef.current;
        // A combo of one is just "a note went in" — not worth saying.
        if (el) el.textContent = combo >= 2 ? `${combo}× combo` : "";
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [eventRef, comboRef, size]);

  return (
    <div
      aria-hidden="true"
      className={`flex min-h-[1.9em] items-baseline gap-3 ${className ?? ""}`}
    >
      <span ref={flashRef} className={FLASH_BASE[size]} />
      <span ref={comboElRef} className={COMBO_BASE[size]} />
    </div>
  );
}
