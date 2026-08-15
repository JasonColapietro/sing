"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PRICING, useIsPro, useProReady } from "@/lib/pro";
import { useProgress } from "@/lib/progress";
import { ProChip, UpgradeCard } from "./ui";

/**
 * Renders children only for free users. Wrap every conversion surface
 * (UpgradeCard, LockedPanel, teaser cards) in this so Pro members never
 * see their own upsell.
 *
 * Nothing renders until entitlement is known. Every one of these primitives is
 * prerendered as "not Pro" — there is no server-side entitlement to prerender
 * with — so without the readiness gate the static HTML sells Pro to the person
 * who already bought it, then yanks it away on hydration.
 */
export function FreeOnly({ children }: { children: ReactNode }) {
  const isPro = useIsPro();
  const ready = useProReady();
  if (!ready || isPro) return null;
  return <>{children}</>;
}

/**
 * The quietest unit of the funnel: a single dim mono line for first-run
 * and trust screens (mic gates), where anything louder would compete with
 * the more important conversion — the mic permission. Self-hides for Pro.
 */
export function ProWhisper({ className = "" }: { className?: string }) {
  const isPro = useIsPro();
  const ready = useProReady();
  if (!ready || isPro) return null;
  return (
    <p
      className={`font-mono text-[11px] uppercase tracking-[0.14em] text-dim ${className}`}
    >
      Free ·{" "}
      <Link
        href="/pro#plans"
        className="text-amber-ink underline decoration-amber/50 underline-offset-4 hover:decoration-amber"
      >
        Pro
      </Link>{" "}
      adds the coach
    </p>
  );
}

/**
 * Recurring conversion offer for end-of-session summaries. The first result
 * gets the one-time modal; after that, even-numbered sessions get the full
 * priced card and odd-numbered sessions keep the compact nudge. Self-hides for
 * Pro members.
 */
export function ProCrescendoNudge({
  line,
  title,
  body,
  context,
}: {
  line: string;
  title: string;
  body: string;
  context: string;
}) {
  const isPro = useIsPro();
  const ready = useProReady();
  const sessionCount = useProgress().sessions.length;
  if (!ready || isPro) return null;
  if (sessionCount === 0 || sessionCount % 2 === 1) {
    return <ProInlineNudge>{line}</ProInlineNudge>;
  }
  return (
    <UpgradeCard
      title={title}
      body={body}
      cta={`Go Pro — $${PRICING.monthly.perMonth.toFixed(2)}/month`}
      context={context}
    />
  );
}

/**
 * One-line nudge for moments of value: a gold chip, one short sentence,
 * and a quiet link. Self-hides for Pro users. The smallest unit of the
 * funnel — use where a card or panel would be too loud.
 */
export function ProInlineNudge({ children }: { children: string }) {
  const isPro = useIsPro();
  const ready = useProReady();
  if (!ready || isPro) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
      <ProChip />
      <span>{children}</span>
      <Link
        href="/pro#plans"
        className="text-amber-ink underline decoration-amber/50 underline-offset-4 hover:decoration-amber"
      >
        Go Pro
      </Link>
    </p>
  );
}
