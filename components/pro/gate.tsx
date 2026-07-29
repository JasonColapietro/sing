"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useIsPro } from "@/lib/pro";
import { ProChip } from "./ui";

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
