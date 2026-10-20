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
 * Where every cap surface sends the singer: the buy card itself, not the top
 * of a long page. The label keeps the one benefit they came for next to the
 * price, so the first pricing fact they read is not that something sold out.
 */
const PRO_BUY_HREF = "/pro#buy";
const GO_PRO_LABEL = `Go Pro: no daily limit, ${formatPrice(PRICING.lifetime.amount)} once`;

/**
 * Pro unlocks per browser, so an owner who opens the app in a second browser,
 * or after clearing site data, meets this wall before anything else. Offering
 * them only a second purchase invited one; /pro#restore opens the key form
 * (RestorePanel), the same way out the locked book and Atlas chapters give.
 */
const PRO_RESTORE_HREF = "/pro#restore";
const RESTORE_LABEL = "Already have Pro? Unlock it in this browser";

/**
 * The time left before the wall, shown before the wall. Without it the cap
 * arrives as a surprise, and the only meter on screen (the day's goal ring)
 * measured something else.
 *
 * The prerendered page cannot know who is Pro, so it carries the line behind
 * the free-plan marker (components/prepaint.tsx): the pre-paint script shows
 * it only to a browser with no Pro entitlement and the cap not yet reached,
 * and fills in the minutes left, so neither a paying singer nor a capped one
 * ever sees it, and a free singer sees it from the first paint instead of
 * having it push the room down at hydration.
 */
export function FreeAllowance({ cap, className = "" }: { cap: FreeCap; className?: string }) {
  const hydrated = useHydrated();
  if (hydrated && (cap.isPro || cap.capped)) return null;
  return (
    <p
      {...prepaintMarker(hydrated, { plan: "free" })}
      className={`tabular font-mono text-[11px] uppercase tracking-[0.14em] text-dim ${className}`}
    >
      Free guided practice today: <PrepaintText field="freeLeft" value={formatClock(cap.leftSec)} /> left
      of {formatClock(cap.capSec)}
      <span className="mx-2 text-line2">·</span>
      <Link
        href={PRO_BUY_HREF}
        className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
      >
        Pro has no daily limit
      </Link>
    </p>
  );
}

/**
 * The room-home card a free singer sees once today's guided minutes are used.
 * It says what happened, what today earned, when it resets, what is still
 * open, and the one way to keep going — in that order. For a free singer this
 * is how every practice day ends, so it reads as "see you tomorrow", not as a
 * stop sign. Paper palette: it sits in the room, not in a session.
 *
 * The `free-cap` id is the target a capped Start button scrolls to, so a tap
 * below the fold lands on the reason rather than on nothing.
 *
 * Rendered in every room's server HTML behind the capped marker, and shown
 * there only where the pre-paint script found today's cap reached, so a
 * capped singer's room paints with the wall in place rather than growing it at
 * hydration. Once hydrated it renders only for a capped singer. `className`
 * spaces it in the room, on the element the marker hides. Until then its
 * words are attributes the CSS paints (prepaintWords), so the static HTML
 * every visitor and every crawler gets carries the wall's boxes but none of
 * its text: the room's opening is the room, not "your free minutes are used".
 */
export function CapWall({ cap, className = "" }: { cap: FreeCap; className?: string }) {
  const hydrated = useHydrated();
  // Read live, never raw: the stored count outlives a lapsed streak. At the
  // wall it is live anyway (reaching the cap means practice was logged
  // today), but the shared definition costs nothing.
  const streak = liveStreak(useProgress().streak);
  if (hydrated && !cap.capped) return null;
  // At the wall the used time is never under the cap, so before hydration,
  // where the cap reads as the server's empty log, the readout is still exact.
  const usedSec = hydrated ? Math.min(cap.usedSec, cap.capSec) : cap.capSec;
  return (
    <div
      id="free-cap"
      className={`scroll-mt-24 ${className}`}
      {...prepaintMarker(hydrated, { plan: "capped" })}
    >
      <Card className="border-violet/40">
        {/* On a phone the two columns dissolve (`contents`) into one flex
            column and the actions are ordered straight under the heading, as
            ContinueCard does: after the explanation, a 375×667 phone put
            every way forward under the tab bar. DOM order, and so focus and
            reading order, is unchanged, and from sm up the layout is exactly
            as before. */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-6">
          <div className="contents sm:block sm:max-w-xl">
            <div className="order-1">
              <SectionLabel>{prepaintWords(hydrated, "Free practice")}</SectionLabel>
            </div>
            <h2 className="order-1 mt-3 text-2xl sm:text-3xl">
              {prepaintWords(hydrated, `That's your ${CAP_MIN} free minutes for today`)}
            </h2>
            <p className="order-3 mt-5 text-mut sm:mt-2">
              {prepaintWords(
                hydrated,
                `The free plan includes ${CAP_MIN} minutes of guided practice a day across warmups, ear training, breath and songs. Today counts toward your streak`,
              )}
              <PrepaintText field="streakClause" value={streak > 1 ? `, now ${streak} days` : ""} />
              {prepaintWords(
                hydrated,
                `. A fresh ${CAP_MIN} minutes opens at midnight; the pitch studio and the range test stay open now.`,
              )}
            </p>
            <p className="tabular order-3 mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              {prepaintWords(hydrated, `${formatClock(usedSec)} of ${formatClock(cap.capSec)} used today`)}
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
            <LinkButton href="/progress" variant="ghost" className="w-full sm:w-auto">
              {prepaintWords(hydrated, "See your streak")}
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
 * Dark, inside the shell, so a routine ends where it was running rather than
 * dropping the singer back onto a page mid-flow.
 */
export function CapSlide({ cap, onExit }: { cap: FreeCap; onExit: () => void }) {
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
        <div className="tabular mt-4 font-mono text-5xl text-[var(--s-ink)] sm:text-6xl">
          {formatClock(cap.capSec)}
          <span className="text-[var(--s-dim)]"> / {formatClock(cap.capSec)}</span>
        </div>
        <h2 className="mt-5 max-w-md text-2xl text-[var(--s-ink)] sm:text-3xl">
          That&apos;s today&apos;s {CAP_MIN} free minutes of guided practice
        </h2>
        <p className="mt-3 max-w-md text-[var(--s-mut)]">
          What you sang is saved and today counts toward your streak. A fresh{" "}
          {CAP_MIN} minutes opens at midnight; the pitch studio and the range
          test stay open now. Pro practises without a clock.
        </p>
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
 * back: a routine, a workout, a set, a single game or a single drill that the
 * free minutes ran out on. On the paper panel because the results screen is
 * dark.
 *
 * `notReached`: how many steps the run never reached because the cap slide
 * stood in for the first of them. Their rows read "not reached", and this
 * says why, where a run that finished on its last minutes gets the bare
 * "that's today's minutes".
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
        Pro has no daily limit
      </Link>
      .
    </p>
  );
}
