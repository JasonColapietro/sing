"use client";

import Link from "next/link";
import { Card, LinkButton, SectionLabel } from "@/components/ui";
import { FREE_DAILY_SEC, formatClock, type FreeCap } from "@/lib/free-cap";
import { SESSION_FOCUS, SessionButton, SessionShell } from "./session-shell";

const CAP_MIN = Math.round(FREE_DAILY_SEC / 60);

/**
 * The room-home card a free singer sees once today's guided minutes are used.
 * It says what happened, when it resets, what is still open, and the one way
 * to keep going — in that order. Paper palette: it sits in the room, not in a
 * session.
 */
export function CapWall({ cap }: { cap: FreeCap }) {
  return (
    <Card className="border-violet/40">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-xl">
          <SectionLabel>Free practice</SectionLabel>
          <h2 className="mt-3 text-2xl sm:text-3xl">
            That&apos;s your {CAP_MIN} free minutes for today
          </h2>
          <p className="mt-2 text-mut">
            Free accounts get {CAP_MIN} minutes of guided practice a day across
            warmups, ear training, breath and songs. It resets at midnight. The
            pitch studio and the range test stay open any time.
          </p>
          <p className="tabular mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            {formatClock(Math.min(cap.usedSec, cap.capSec))} of {formatClock(cap.capSec)} used
            today
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto">
          <LinkButton href="/pro" variant="violet" size="lg" className="w-full sm:w-auto">
            Go Pro — practice without limits
          </LinkButton>
          <LinkButton href="/studio" variant="outline" className="w-full sm:w-auto">
            Open the free studio
          </LinkButton>
        </div>
      </div>
    </Card>
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
            href="/pro"
            className={`inline-flex h-12 items-center justify-center rounded-full bg-[var(--s-ok)] px-7 text-base font-medium text-[oklch(0.15_0.02_155)] hover:brightness-110 ${SESSION_FOCUS}`}
          >
            Go Pro — practice without limits
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
          What you sang is saved. The allowance resets at midnight; the pitch
          studio and the range test stay open now. Pro practises without a
          clock.
        </p>
      </div>
    </SessionShell>
  );
}
