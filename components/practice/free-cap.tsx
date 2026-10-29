"use client";

import Link from "next/link";
import { Card, LinkButton, SectionLabel } from "@/components/ui";
import { FREE_DAILY_SEC, formatClock, type FreeCap } from "@/lib/free-cap";
import { formatPrice, PRICING } from "@/lib/pro-shared";
import { PrepaintText, prepaintMarker, prepaintWords, useHydrated } from "@/components/prepaint";
import { useProgress } from "@/lib/progress";
import { liveStreak } from "@/components/account/save-state";
import { SESSION_FOCUS, SessionButton, SessionShell } from "./session-shell";

const CAP_MIN = Math.round(FREE_DAILY_SEC / 60);

/**
 * Where every cap surface sends the singer: the buy card itself, with the one
 * benefit they came for next to the price on the button.
 */
const PRO_BUY_HREF = "/pro#buy";
const GO_PRO_LABEL = `Keep practicing today with Pro: ${formatPrice(PRICING.lifetime.amount)} once`;

/** An owner on a second browser meets this wall too; /pro#restore opens the key form. */
const PRO_RESTORE_HREF = "/pro#restore";
const RESTORE_LABEL = "Already have Pro? Unlock it in this browser";

/**
 * The time left before the wall, shown before the wall. The prerendered page
 * cannot know who is Pro, so it carries the line behind the free-plan marker
 * (components/prepaint.tsx) and the pre-paint script shows it only to a free
 * browser under the cap, with the minutes filled in.
 */
export function FreeAllowance({
  cap,
  className = "",
  proLink = true,
}: {
  cap: FreeCap;
  className?: string;
  /** False on a results view, where the results nudge is that view's one ask. */
  proLink?: boolean;
}) {
  const hydrated = useHydrated();
  if (hydrated && (cap.isPro || cap.capped)) return null;
  return (
    <p
      {...prepaintMarker(hydrated, { plan: "free" })}
      className={`tabular text-sm text-mut ${className}`}
    >
      Free guided practice today: <PrepaintText field="freeLeft" value={formatClock(cap.leftSec)} /> left
      of {formatClock(cap.capSec)}
      {proLink && (
        <>
          <span className="mx-2 text-line2">·</span>
          <Link
            href={PRO_BUY_HREF}
            className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
          >
            Pro has no daily limit
          </Link>
        </>
      )}
    </p>
  );
}

/**
 * The room-home card a free singer sees once today's guided minutes are used:
 * what happened, what today earned, when it resets, what is still open, and
 * the one way to keep going. It reads as "see you tomorrow", not a stop sign.
 *
 * Rendered in every room's server HTML behind the capped marker and shown
 * only where the pre-paint script found today's cap reached; its words are
 * attributes the CSS paints (prepaintWords), so the static HTML carries none
 * of them. The `free-cap` id is where a capped Start button scrolls to.
 */
export function CapWall({ cap, className = "" }: { cap: FreeCap; className?: string }) {
  const hydrated = useHydrated();
  // Read live, never raw: the stored count outlives a lapsed streak.
  const streak = liveStreak(useProgress().streak);
  if (hydrated && !cap.capped) return null;
  return (
    <div
      id="free-cap"
      className={`scroll-mt-24 ${className}`}
      {...prepaintMarker(hydrated, { plan: "capped" })}
    >
      <Card className="border-violet/40">
        {/* On a phone the two columns dissolve (`contents`) into one flex
            column and the actions are ordered straight under the heading;
            DOM order, and so focus and reading order, is unchanged. */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-6">
          <div className="contents sm:block sm:max-w-xl">
            <div className="order-1">
              <SectionLabel>{prepaintWords(hydrated, "Free practice")}</SectionLabel>
            </div>
            <h2 className="order-1 mt-3 text-2xl sm:text-3xl">
              {prepaintWords(hydrated, `That's today's ${CAP_MIN} free minutes`)}
            </h2>
            <p className="order-3 mt-5 text-mut sm:mt-2">
              {prepaintWords(hydrated, "Today counts toward your streak")}
              <PrepaintText field="streakClause" value={streak > 1 ? `, now ${streak} days` : ""} />
              {prepaintWords(
                hydrated,
                ". Guided practice opens again at midnight; the pitch studio and the range test are open now.",
              )}
            </p>
          </div>
          <div className="order-2 mt-5 flex w-full flex-col gap-3 sm:order-none sm:mt-0 sm:w-auto">
            {/* text-center: at 375px the priced label wraps to two lines. */}
            <LinkButton href={PRO_BUY_HREF} variant="violet" size="lg" className="w-full text-center sm:w-auto">
              {prepaintWords(hydrated, GO_PRO_LABEL)}
            </LinkButton>
            <LinkButton href="/studio" variant="outline" className="w-full sm:w-auto">
              {prepaintWords(hydrated, "Open the free studio")}
            </LinkButton>
            <Link
              href={PRO_RESTORE_HREF}
              className="flex min-h-11 items-center justify-center text-center text-sm text-mut underline underline-offset-4 hover:text-ink"
            >
              {prepaintWords(hydrated, RESTORE_LABEL)}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * The same message between steps of a session that has crossed the line.
 * Dark, inside the shell, so a routine ends where it was running.
 */
export function CapSlide({ onExit }: { cap: FreeCap; onExit: () => void }) {
  return (
    <SessionShell
      title="Free practice done for today"
      progress={100}
      onClose={onExit}
      closeLabel="Back"
      bottom={
        <div className="flex items-center justify-center gap-3">
          <Link
            href={PRO_BUY_HREF}
            className={`inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--s-ok)] px-7 py-2 text-center text-base font-medium leading-tight text-[oklch(0.15_0.02_155)] hover:brightness-110 ${SESSION_FOCUS}`}
          >
            {GO_PRO_LABEL}
          </Link>
          <SessionButton label="Back" onClick={onExit}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M19 12H5m7-7-7 7 7 7" />
            </svg>
          </SessionButton>
        </div>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
          Free practice
        </span>
        <h2 className="mt-5 max-w-md text-2xl text-[var(--s-ink)] sm:text-3xl">
          That&apos;s today&apos;s {CAP_MIN} free minutes
        </h2>
        <p className="mt-3 max-w-md text-[var(--s-mut)]">
          What you sang is saved and today counts toward your streak. Guided
          practice opens again at midnight; the pitch studio and the range test
          are open now.
        </p>
        <Link
          href="/studio"
          className={`mt-4 inline-flex min-h-11 items-center text-sm text-[var(--s-ink)] underline underline-offset-4 ${SESSION_FOCUS}`}
        >
          Open the free studio
        </Link>
        <Link
          href={PRO_RESTORE_HREF}
          className={`mt-4 inline-flex min-h-11 items-center text-sm text-[var(--s-mut)] underline underline-offset-4 hover:text-[var(--s-ink)] ${SESSION_FOCUS}`}
        >
          {RESTORE_LABEL}
        </Link>
      </div>
    </SessionShell>
  );
}

/**
 * Why "Play again" is gone from a capped singer's results, and when it comes
 * back. `notReached` is how many steps the cap slide stood in for.
 */
export function CappedAgainNote({ notReached = 0 }: { notReached?: number }) {
  return (
    <p className="mb-3 rounded-2xl bg-panel p-4 text-sm text-mut sm:p-5">
      {notReached > 0
        ? `Today's ${CAP_MIN} free minutes of guided practice ran out before the last ${
            notReached === 1 ? "step" : `${notReached} steps`
          } of this run.`
        : `That's today's ${CAP_MIN} free minutes of guided practice.`}{" "}
      A fresh {CAP_MIN} minutes opens at midnight; the pitch studio and the range
      test stay open now.{" "}
      <Link
        href={PRO_BUY_HREF}
        className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
      >
        {`Keep practicing today with Pro, ${formatPrice(PRICING.lifetime.amount)} once`}
      </Link>
      .
    </p>
  );
}
