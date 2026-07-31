"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useIsPro } from "@/lib/pro";
import { useProgress } from "@/lib/progress";
import { ProChip, UpgradeCard } from "./ui";

/**
 * Renders children only for free users. Wrap every conversion surface
 * (UpgradeCard, LockedPanel, teaser cards) in this so Pro members never
 * see their own upsell.
 */
export function FreeOnly({ children }: { children: ReactNode }) {
  const isPro = useIsPro();
  if (isPro) return null;
  return <>{children}</>;
}

/**
 * The quietest unit of the funnel: a single dim mono line for first-run
 * and trust screens (mic gates), where anything louder would compete with
 * the more important conversion — the mic permission. Self-hides for Pro.
 */
export function ProWhisper({ className = "" }: { className?: string }) {
  const isPro = useIsPro();
  if (isPro) return null;
  return (
    <p
      className={`font-mono text-[11px] uppercase tracking-[0.14em] text-dim ${className}`}
    >
      Free ·{" "}
      <Link
        href="/pro"
        className="text-amber-ink underline decoration-amber/50 underline-offset-4 hover:decoration-amber"
      >
        Pro
      </Link>{" "}
      adds the coach
    </p>
  );
}

/**
 * Escalating nudge for end-of-session summaries: a one-liner while the
 * habit is forming (five or fewer logged sessions), the full gold
 * UpgradeCard once the user is clearly invested. Self-hides for Pro.
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
  const sessionCount = useProgress().sessions.length;
  if (isPro) return null;
  if (sessionCount <= 5) return <ProInlineNudge>{line}</ProInlineNudge>;
  return <UpgradeCard title={title} body={body} context={context} />;
}

/**
 * One-line nudge for moments of value: a gold chip, one short sentence,
 * and a quiet link. Self-hides for Pro users. The smallest unit of the
 * funnel — use where a card or panel would be too loud.
 */
export function ProInlineNudge({ children }: { children: string }) {
  const isPro = useIsPro();
  if (isPro) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
      <ProChip />
      <span>{children}</span>
      <Link
        href="/pro"
        className="text-amber-ink underline decoration-amber/50 underline-offset-4 hover:decoration-amber"
      >
        See Pro
      </Link>
    </p>
  );
}
