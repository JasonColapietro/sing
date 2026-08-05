import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui";

/**
 * Shared Pro visual language: gold console-tape labels, one quiet gold
 * moment per page. Everything here links into the /pro funnel.
 */

/** Small gold-filled tape chip. The mark of the Pro tier everywhere. */
export function ProChip({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded bg-amber px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#241a05] ${className}`}
    >
      Pro
    </span>
  );
}

export function LockGlyph({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="6"
        width="9"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}

/**
 * Inline upgrade panel dropped at a moment of value. Quiet gold: thin amber
 * border, tape header, one line of copy, one CTA. Never blocks free content.
 */
export function UpgradeCard({
  title,
  body,
  cta = "See Suede Pro",
  context,
  className = "",
}: {
  title: string;
  body: string;
  /** Default carries no price — this file renders on server surfaces and
      must not pull in the client-only pricing constant. Pass a priced label
      where the caller already imports it. */
  cta?: string;
  /** Mono tape-label context, e.g. "Coach" or "Take 4 of 3". */
  context: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber/50 bg-panel p-5 sm:p-6 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber to-transparent"
      />
      <div className="flex items-center gap-2">
        <ProChip />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          {context}
        </span>
      </div>
      <div className="mt-3 font-display text-xl font-extrabold text-ink">
        {title}
      </div>
      <p className="mt-1.5 max-w-xl text-sm text-mut">{body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <LinkButton href="/pro#plans" variant="amber" size="sm">
          {cta}
        </LinkButton>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Cancel anytime · Review the plan next
        </span>
      </div>
    </div>
  );
}

/**
 * A locked Pro preview: real content shown faded under a gradient, with a
 * lock row pinned at the bottom. Sells by showing, not by hiding.
 */
export function LockedPanel({
  label,
  children,
  cta = "Unlock with Pro",
  className = "",
}: {
  /** Mono tape label naming what's inside, e.g. "Per-note accuracy". */
  label: string;
  children: ReactNode;
  cta?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber/40 bg-panel ${className}`}
    >
      <div className="flex items-center justify-between border-b border-line bg-panel2/60 px-4 py-2.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
          {label}
        </span>
        <ProChip />
      </div>
      <div aria-hidden className="pointer-events-none select-none opacity-60">
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-panel to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 pb-4 sm:px-5">
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-amber-ink">
          <LockGlyph />
          Pro preview
        </span>
        <LinkButton href="/pro#plans" variant="amber" size="sm">
          {cta}
        </LinkButton>
      </div>
    </div>
  );
}

/** Tiny inline lock tag for list items / song cards that are Pro-only. */
export function ProLockTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-ink">
      <LockGlyph size={11} />
      Pro
    </span>
  );
}
