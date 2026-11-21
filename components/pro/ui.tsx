import type { ReactNode } from "react";
import { LinkButton } from "@/components/ui";
import { formatPrice, PRICING } from "@/lib/pro-shared";

/**
 * Shared Pro visual language: gold console-tape labels, one quiet gold
 * moment per page. Everything here links into the /pro funnel.
 */

/** Small violet tape chip, the mark of the Pro tier everywhere. Filled with the
 * darker violet-ink so white text clears 4.5:1 at 10 px; the base violet only
 * reaches 4.05:1 with either black or white on it. */
export function ProChip({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded bg-violet-ink px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white ${className}`}
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
 * Inline upgrade panel dropped at a moment of value. Quiet gold: thin violet
 * border, tape header, one line of copy, one CTA. Never blocks free content.
 */
export function UpgradeCard({
  title,
  body,
  cta = `Go Pro: ${formatPrice(PRICING.lifetime.amount)} once`,
  context,
  className = "",
}: {
  title: string;
  body: string;
  /** The price lives on the button, once; the line beside it states the terms. */
  cta?: string;
  /** Mono tape-label context, e.g. "Coach" or "Take 4 of 3". */
  context: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-violet/50 bg-panel p-5 sm:p-6 ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet to-transparent"
      />
      <div className="flex items-center gap-2">
        <ProChip />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          {context}
        </span>
      </div>
      <div className="mt-3 text-xl font-extrabold text-ink">
        {title}
      </div>
      <p className="mt-1.5 max-w-xl text-sm text-mut">{body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <LinkButton href="/pro#buy" variant="violet" size="sm">
          {cta}
        </LinkButton>
        <span className="text-sm text-dim">Lifetime access · Never renews</span>
      </div>
    </div>
  );
}

/** The one priced label every gate's buy link carries. Read from PRICING, never typed. */
export const PRO_PRICE_ONCE = `${formatPrice(PRICING.lifetime.amount)} once`;
/** Where every gate sends a purchase: the buy card on /pro, never Stripe directly. */
export const PRO_BUY_HREF = "/pro#buy";
/** The default call to action of a locked surface. */
export const UNLOCK_WITH_PRO = `Unlock with Pro: ${PRO_PRICE_ONCE}`;

/**
 * A locked Pro preview: real content shown faded under a gradient, then one
 * sentence saying what the panel is and a priced lock row. Sells by showing,
 * not by hiding. The gate grammar is the same on every locked surface: what
 * Pro gives here (`gives`), then one priced link to the buy card.
 */
export function LockedPanel({
  label,
  gives,
  children,
  cta = UNLOCK_WITH_PRO,
  className = "",
}: {
  /** Mono tape label naming what's inside, e.g. "Per-note accuracy". */
  label: string;
  /** One sentence: what this panel is for the singer, at this point. */
  gives: string;
  children: ReactNode;
  /** Must carry the price (PRO_PRICE_ONCE) when overridden. */
  cta?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-violet/40 bg-panel ${className}`}
    >
      <div className="flex items-center justify-between border-b border-line bg-panel2/60 px-4 py-2.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
          {label}
        </span>
        <ProChip />
      </div>
      <div className="relative">
        <div aria-hidden className="pointer-events-none select-none pb-6 opacity-60">
          {children}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-panel to-transparent"
        />
      </div>
      {/* In flow, not pinned over the preview: the sentence and a priced
          button wrap to two rows on a 375px phone, and a pinned row that
          grows would cover the chart it is selling. */}
      <div className="px-4 pb-4 sm:px-5">
        <p className="max-w-xl text-sm text-mut">{gives}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-violet-ink">
            <LockGlyph />
            Pro preview
          </span>
          <LinkButton href={PRO_BUY_HREF} variant="violet" size="sm">
            {cta}
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

/** Tiny inline lock tag for list items / song cards that are Pro-only. */
export function ProLockTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-violet/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-violet-ink">
      <LockGlyph size={11} />
      Pro
    </span>
  );
}
