"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useIsPro, useProReady } from "@/lib/pro";
import { prepaintMarker, useHydrated } from "@/components/prepaint";
import { proHeadline } from "@/lib/pro-shared";
import { proMomentSeen } from "@/lib/pro-signal";
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
  const hydrated = useHydrated();
  // In the server HTML for everyone, behind the pre-paint "not-pro" marker
  // (components/prepaint.tsx), rather than held back until the entitlement
  // cache is read: mounted after hydration, the line grew the mic gate it
  // closes by about 49px and moved what sits under it (the A/B card on
  // /recorder at 1280: CLS 0.03 for every free visitor). Before the first
  // paint the inline script hides it for a Pro singer; from hydration on it
  // renders from the real entitlement.
  if (hydrated && isPro) return null;
  return (
    <p
      className={`font-mono text-[11px] uppercase tracking-[0.14em] text-dim ${className}`}
      {...prepaintMarker(hydrated, { plan: "not-pro" })}
    >
      Free ·{" "}
      <Link
        href="/pro#buy"
        className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
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
  // Until the one-time modal (components/pro/moments.tsx) has been shown and
  // closed, keep to the quiet line: the modal opens over a result, and a
  // full card under it would make that moment two sales pitches at once.
  if (sessionCount === 0 || sessionCount % 2 === 1 || !proMomentSeen()) {
    return <ProInlineNudge>{line}</ProInlineNudge>;
  }
  return (
    <UpgradeCard
      title={title}
      body={body}
      cta={`Go Pro: ${proHeadline()}`}
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
        href="/pro#buy"
        className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
      >
        Go Pro
      </Link>
    </p>
  );
}
