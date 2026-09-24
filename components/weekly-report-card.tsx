"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fmtDur, parseDay } from "@/components/progress/format";
import { getState as getProgressState } from "@/lib/progress";
import {
  shouldShowWeekInReview,
  weekInReview,
  type WeekInReview,
  type WeeklySuggestion,
} from "@/lib/weekly-report";

/**
 * ISO Monday (YYYY-MM-DD) of the last week this device was shown. Device-local
 * by design: there is no email or push channel, so this card *is* the Monday
 * summary, and a second device showing it again is a feature, not a leak.
 */
export const WEEKLY_REPORT_SEEN_KEY = "suede-sing:weekly-report-seen:v1";

/**
 * "Your week": the Monday summary, delivered in-app.
 *
 * On the first page load in a new Monday-based week, a singer who practised
 * at least once in the week that just ended gets the report for that week at
 * the top of the page content, on whichever room they opened. The seen key is
 * written as soon as the card opens, so a reload does not bring it back; it
 * stays up across client navigations until closed, because the layout does
 * not remount.
 *
 * Placement is deliberate. It is an inline card in the flow, not a dialog and
 * not a fixed toast: ProMoments already owns the one full-screen moment and
 * the body scroll lock, a fixed panel would cover the transport controls on a
 * 375px phone, and the v2 banner sits above the nav rather than under it. So
 * nothing here can stack over either of them or block a practice control; at
 * worst the Pro modal's backdrop sits over this card, which is correct. Focus
 * is not moved on open for the same reason — a summary is not an interruption.
 * Escape closes it while focus is inside it, and closing hands focus to the
 * page content rather than dropping it on <body>.
 *
 * The cost is a one-time layout shift the Monday it appears: the decision
 * reads localStorage, so it can only be made after hydration.
 */
export default function WeeklyReportCard() {
  const pathname = usePathname();
  const [report, setReport] = useState<WeekInReview | null>(null);
  const ref = useRef<HTMLElement>(null);
  const headingId = useId();
  // Auth forms are the one place a card above the content is in the way.
  // Read from the router rather than window.location: the card lives in the
  // root layout and never remounts, so a one-time check on the first URL
  // missed every client navigation to or from sign-in and sign-up.
  const onAuthRoute = /^\/sign-(in|up)(\/|$)/.test(pathname ?? "");

  useEffect(() => {
    // Off the auth forms only. An open report is kept (just not rendered)
    // while the singer is on one, and a report not yet evaluated gets its
    // first look as soon as they leave; the seen key stops a second showing.
    if (onAuthRoute) return;
    // Inside a closure, same as ProMoments' gate(): a bare setState in an
    // effect body trips react-hooks/set-state-in-effect.
    const gate = () => {
      try {
        const next = weekInReview(getProgressState().sessions, new Date());
        const seen = window.localStorage.getItem(WEEKLY_REPORT_SEEN_KEY);
        if (!shouldShowWeekInReview(next, seen)) return;
        window.localStorage.setItem(WEEKLY_REPORT_SEEN_KEY, next.weekStart);
        setReport(next);
      } catch {
        // storage unavailable — never show rather than show on every load
      }
    };
    gate();
  }, [onAuthRoute]);

  if (!report || onAuthRoute) return null;

  const close = () => {
    const hadFocus = ref.current?.contains(document.activeElement);
    setReport(null);
    if (!hadFocus) return;
    // Hand focus to the page rather than letting it fall to <body>.
    const target =
      document.querySelector<HTMLElement>("#content main") ??
      document.getElementById("content");
    if (!target) return;
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  const scored = report.bestScore !== null && report.averageScore !== null;
  const stats: Array<[string, string]> = [
    ["Practice time", fmtDur(report.durationSec)],
    ["Sessions", String(report.sessions)],
    ["Days practised", `${report.daysPractised} of 7`],
    ["Longest streak", plural(report.bestRun, "day")],
    ["Best score", scored ? `${report.bestScore}%` : "—"],
    ["Average score", scored ? `${report.averageScore}%` : "—"],
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
      <section
        ref={ref}
        aria-labelledby={headingId}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            close();
          }
        }}
        className="animate-fadeup relative rounded-2xl border border-line bg-panel p-5 pr-12 sm:p-6 sm:pr-14"
      >
        <span className="font-mono text-label uppercase tracking-[0.1em] text-dim">
          {weekRange(report.weekStart, report.weekEnd)}
        </span>
        <h2 id={headingId} className="mt-1 text-2xl">
          Your week
        </h2>
        <p className="mt-1 text-sm text-mut">{changeLine(report)}</p>

        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-meta text-mut">{label}</dt>
              <dd className="mt-1 font-mono text-lg">{value}</dd>
            </div>
          ))}
        </dl>

        <Suggestion suggestion={report.suggestion} />

        {pathname !== "/progress" && (
          <Link
            href="/progress"
            className="mt-4 inline-flex rounded-full border border-line2 px-3 py-1.5 text-sm text-ink transition-colors hover:border-violet hover:text-violet-ink"
          >
            See full progress
          </Link>
        )}

        {/* The drawer-close pattern from v2-banner.tsx: a 44px hit region. Not
            named a bare "Dismiss" — e2e's dismissOverlays force-clicks that
            name, expecting it to be a modal backdrop. */}
        <button
          type="button"
          onClick={close}
          aria-label="Close your weekly report"
          className="absolute right-1 top-1 flex size-11 items-center justify-center rounded-full text-mut transition-colors hover:bg-panel2 hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M3.5 3.5l7 7m0-7l-7 7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </section>
    </div>
  );
}

function Suggestion({ suggestion: s }: { suggestion: WeeklySuggestion }) {
  let text: string;
  let link: { href: string; label: string } | null = null;
  switch (s.kind) {
    case "neglected":
      text = `You didn't open ${s.label} last week, after ${plural(s.before, "session")} there in the three weeks before.`;
      link = { href: s.href, label: `Open ${s.label}` };
      break;
    case "weakest":
      text = `${s.label} averaged ${s.average}% against ${s.overall}% across your week, the widest gap of any room.`;
      link = { href: s.href, label: `Practise ${s.label}` };
      break;
    case "more-days":
      text = `You practised on ${plural(s.days, "day")}. Aim for one more this week; a short session counts.`;
      break;
    case "keep-going":
      text = `${plural(s.days, "practice day")} last week. Match that this week to keep the habit.`;
      break;
  }
  return (
    <p className="mt-4 text-sm text-ink">
      <span className="font-medium">Next: </span>
      {text}
      {link && (
        <>
          {" "}
          <Link href={link.href} className="font-medium text-violet-ink underline underline-offset-2">
            {link.label}
          </Link>
        </>
      )}
    </p>
  );
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** "Sep 14 – 20" or "Sep 28 – Oct 4". */
function weekRange(start: string, end: string): string {
  const a = parseDay(start);
  const b = parseDay(end);
  const month = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });
  const tail = a.getMonth() === b.getMonth() ? `${b.getDate()}` : `${month(b)} ${b.getDate()}`;
  return `${month(a)} ${a.getDate()} – ${tail}`;
}

function changeLine(r: WeekInReview): string {
  if (!r.previous) return "Your first week on the record.";
  if (r.previous.sessions === 0) return "Back after a week off.";
  const delta = r.durationSec - r.previous.durationSec;
  const sessions = r.sessions - r.previous.sessions;
  const time =
    Math.abs(delta) < 60
      ? "About the same practice time as the week before"
      : `${fmtDur(Math.abs(delta))} ${delta > 0 ? "more" : "less"} practice than the week before`;
  const count =
    sessions === 0
      ? "same number of sessions"
      : `${Math.abs(sessions)} ${sessions > 0 ? "more" : "fewer"} session${Math.abs(sessions) === 1 ? "" : "s"}`;
  return `${time}, ${count}.`;
}
