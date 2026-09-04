"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * The full-screen practice surface every scored session runs inside.
 *
 * This is the shape of a Yousician exercise: the page goes away, the screen is
 * dark, one bar across the top carries the way out and the progress through
 * the exercise, the instrument fills the middle, and the few controls a
 * player needs sit along the bottom. Nothing else from the site is visible —
 * no nav, no footer, no rail, no article — because a singer mid-phrase has no
 * use for any of it, and their eyes are on the highway.
 *
 * Dark is not the site's theme; it is this room's. The tokens are scoped to
 * the shell so nothing outside inherits them, and they follow the dark-mode
 * laws: surfaces at OKLCH lightness 13–20 tinted toward the brand's warm hue,
 * border-based layering instead of shadows, chroma pulled back on accents.
 *
 * Measured against --s-bg: --s-ink 17.9:1, --s-mut 12.9:1, --s-dim 9.0:1, so
 * the two text tokens clear 7:1 and 4.5:1 with room to spare and the dim token
 * is safe for the mono kickers it carries. session-shell.test.ts holds the
 * arithmetic so a token nudged for looks cannot quietly drop below the law.
 */
export const SESSION_TOKENS: Record<string, string> = {
  "--s-bg": "oklch(0.13 0.012 70)",
  "--s-elev": "oklch(0.17 0.012 70)",
  "--s-over": "oklch(0.21 0.012 70)",
  "--s-line": "oklch(1 0 0 / 0.08)",
  "--s-line2": "oklch(1 0 0 / 0.14)",
  "--s-ink": "oklch(0.96 0.01 80)",
  "--s-mut": "oklch(1 0 0 / 0.62)",
  "--s-dim": "oklch(1 0 0 / 0.42)",
  "--s-ok": "oklch(0.78 0.15 155)",
  "--s-ok-soft": "oklch(0.78 0.15 155 / 0.22)",
  "--s-voice": "oklch(0.82 0.09 195)",
  "--s-rec": "oklch(0.72 0.15 25)",
  "--s-accent": "oklch(0.74 0.13 295)",
  "--s-amber": "oklch(0.8 0.13 80)",
};

/**
 * The focus ring inside the shell. The site's `:focus-visible` rule paints
 * --color-rec, a paper-ground red that all but disappears against this room's
 * warm near-black; amber is the one accent already on screen at all times (the
 * playhead), so the ring reads as part of the same instrument.
 */
export const SESSION_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]";

/** Everything inside the shell a Tab press is allowed to land on. */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function SessionShell({
  title,
  subtitle,
  progress,
  onClose,
  closeLabel = "Exit",
  topRight,
  bottom,
  children,
}: {
  /** What is being practised — the exercise or routine name. */
  title: string;
  /** One short line under the title, e.g. "Step 2 of 5". */
  subtitle?: string;
  /** 0..100 through the whole session. */
  progress: number;
  onClose: () => void;
  closeLabel?: string;
  /** The top bar's right slot — a live figure such as the root note. */
  topRight?: ReactNode;
  /** The control strip along the bottom. */
  bottom?: ReactNode;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // The page under the shell must not scroll, Escape is the way out on a
  // keyboard, and Tab must not wander into the page the shell is covering: a
  // modal that leaks focus to invisible links strands a keyboard user in a
  // document they cannot see.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = rootRef.current;
      if (!root) return;
      // offsetParent is null for anything display:none — the Adjust panel
      // while it is closed — so a collapsed control never becomes a stop.
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      // Focus falls to <body> whenever the control that had it disables or
      // unmounts itself — an answered ear round does exactly that — and from
      // <body> a native Tab lands on the page underneath the shell.
      if (!(active instanceof Node) || !root.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && (active === first || active === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Focus enters the dialog on mount and goes back where it came from on the
  // way out, so ending a session returns a keyboard user to the card they
  // started it from rather than to the top of the page.
  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    rootRef.current?.focus();
    return () => returnTo?.focus?.();
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={rootRef}
      data-session-shell=""
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      style={SESSION_TOKENS as React.CSSProperties}
      // h-[100dvh] rather than inset-0 alone: on a phone the layout viewport
      // includes the browser chrome that slides away, so inset-0 leaves the
      // bottom strip under the URL bar — and this surface never scrolls, so
      // nothing would ever move it out from under there.
      className="fixed inset-0 z-[70] flex h-[100dvh] flex-col overflow-hidden bg-[var(--s-bg)] text-[var(--s-ink)] antialiased outline-none"
    >
      {/* Top bar: the way out, what this is, how far along. */}
      <div className="flex items-center gap-3 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:px-5">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--s-mut)] transition-colors hover:bg-[var(--s-elev)] hover:text-[var(--s-ink)] ${SESSION_FOCUS}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-semibold">{title}</span>
            {subtitle && (
              <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--s-dim)]">
                {subtitle}
              </span>
            )}
          </div>
          <div
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--s-over)]"
            role="progressbar"
            aria-label="Session progress"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--s-ok)] transition-[width] duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
        {topRight && <div className="shrink-0 pl-1">{topRight}</div>}
      </div>

      {/* The instrument. */}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>

      {/* Bottom strip. */}
      {bottom && (
        <div className="border-t border-[var(--s-line)] bg-[var(--s-elev)] px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          {bottom}
        </div>
      )}
    </div>,
    document.body,
  );
}

/** A round icon button for the session's bottom strip. */
export function SessionButton({
  label,
  onClick,
  children,
  tone = "plain",
  disabled,
  pressed,
  expanded,
  controls,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: "plain" | "primary" | "danger";
  disabled?: boolean;
  pressed?: boolean;
  /** Set when the button opens a panel, so it announces as a disclosure. */
  expanded?: boolean;
  /** id of the panel `expanded` refers to. */
  controls?: string;
}) {
  // Both filled tones carry dark ink. Near-white on --s-rec measures 2.5:1,
  // and the control a singer reaches for while out of breath is not the place
  // to spend contrast on the convention that red buttons have white text.
  const tones = {
    plain: "border-[var(--s-line2)] text-[var(--s-mut)] hover:text-[var(--s-ink)] hover:bg-[var(--s-over)]",
    primary: "border-transparent bg-[var(--s-ok)] text-[oklch(0.15_0.02_155)] hover:brightness-110",
    danger: "border-transparent bg-[var(--s-rec)] text-[oklch(0.16_0.03_25)] hover:brightness-110",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      // 44px floor: this strip is the one thing a singer taps mid-rep, often
      // one-handed and without looking at it.
      className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 text-xs transition-colors disabled:opacity-40 ${SESSION_FOCUS} ${tones[tone]} ${
        pressed ? "bg-[var(--s-over)] text-[var(--s-ink)]" : ""
      }`}
    >
      <span className="flex h-6 items-center justify-center">{children}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em]">{label}</span>
    </button>
  );
}
