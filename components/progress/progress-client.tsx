"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccountAuth } from "@/lib/use-account-auth";
import {
  ACHIEVEMENTS,
  eraseBrowserProgress,
  getState,
  importProgress,
  levelForXp,
  todayPracticeSec,
  useProgress,
  weeklyReport,
  type SessionLog,
} from "@/lib/progress";
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  Pill,
  PageShell,
  ProgressBar,
  SectionLabel,
  Stat,
} from "@/components/ui";
import { AccountSavePrompt } from "@/components/account/save-prompt";
import { downloadProgressBackup } from "@/components/account/download-backup";
import { AccountBackupControls } from "./account-backup-sync";
import { FreeOnly, ProInlineNudge } from "@/components/pro/gate";
import { streakChipState } from "@/components/nav";
import { LockedPanel, ProChip } from "@/components/pro/ui";
import { useDailyGoal, useGoalDoneSec } from "@/components/practice/learn-home";
import { useActiveProgram } from "@/components/programs/use-program";
import { ProgramEntryCard } from "@/components/programs/today-card";
import { programDayNeedsPro, programRangeTest, recoveryWeekOf } from "@/components/practice/program-day";
import { isRestDay } from "@/lib/programs";
import { useIsPro } from "@/lib/pro";
import { accountsReady } from "@/lib/accounts";
import { MAX_SESSIONS } from "@/lib/progress-shape";
import { FREE_DAILY_SEC } from "@/lib/practice-limits";
import { dataControlsCopy } from "./data-copy";
import { aggregateNotes } from "@/lib/analytics";
import { SyncControls } from "./sync-controls";
import { useProgressCloudState } from "@/lib/progress-cloud";
import { NoteAccuracyChart, RangeHistoryChart } from "./pro-charts";
import { PracticeCalendar, calendarStartDay } from "./calendar";
import { MinutesBarChart, PracticeMixChart, ScoreTrendChart } from "./charts";
import { CoachCard } from "./coach";
import { VoiceCard } from "./voice-card";
import { TYPE_META, fmtDur, localDayStr, parseDay, relDay } from "./format";
import { rangeTestHref } from "@/lib/site";
import { useHydrated } from "@/components/prepaint";

/**
 * How many sessions the free tier lists.
 *
 * Nothing is deleted at this boundary — the store keeps up to MAX_SESSIONS
 * either way, and a singer who subscribes later sees the whole record appear.
 * It is a display limit, and the nudge below the table says so rather than
 * implying the older sessions are gone.
 */
const FREE_SESSION_LOG = 20;

/* ------------------------------------------------------------------ */
/* Small inline icons — coral flame for streaks.                      */
/* ------------------------------------------------------------------ */

function FlameIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.6}
      aria-hidden="true"
    >
      <path
        d="M12 2.5c1 3-3 4.5-3 8a3 3 0 0 0 6 0c0-1.2-.6-2-.6-2 1.8.6 3.1 2.6 3.1 4.6a5.5 5.5 0 0 1-11 0c0-4.5 3.5-6 4.2-9.8.1-.5.8-1.2 1.3-.8Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
    >
      <path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
    >
      <path d="M12 15V3m0 0 4 4m-4-4-4 4M4 19h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Loading shell                                                       */
/* ------------------------------------------------------------------ */

/** One inert placeholder block. */
function Bar({ className }: { className: string }) {
  return <div className={`rounded bg-panel2 ${className}`} />;
}

/**
 * What stands in for the dashboard until the client render below replaces it.
 *
 * The dashboard is client-only — see the `mounted` gate — so the server cannot
 * know how tall it will be, and it is tall: 3,600–3,900px at 1280×900, with an
 * empty record rendering *taller* than a full one because the empty states and
 * the locked Pro panels are big. The old shell was a single centred "Loading
 * your progress…" line, 402px of main. Swapping 402px for 3,887px on hydration
 * threw the room rail (which PR #61 deliberately placed inside the first
 * viewport) and the footer clean out of the viewport, and that one shift was
 * this page's entire CLS: 0.40, against a 0.25 "poor" threshold.
 *
 * The reservation is a viewport rather than the dashboard's measured height, on
 * purpose. Layout shift only scores what a visitor can actually see, so putting
 * everything below this block under the fold at first paint is sufficient — and
 * unlike a pixel figure copied off one screen size, `min-h-[100dvh]` stays
 * correct at every screen size and cannot rot as the dashboard grows. It costs
 * nothing in blank space either: the block is replaced a few hundred
 * milliseconds later by a dashboard several times taller, for first-run
 * visitors most of all.
 *
 * Shaped like the real thing — the four-card stat row, then the calendar —
 * rather than an empty reservation, so the first paint reads as the page
 * arriving instead of as a hole. Hidden from assistive tech, which gets the
 * status line instead.
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-[100dvh]">
      <p className="sr-only" role="status">
        Loading your progress…
      </p>
      <div className="space-y-10" aria-hidden="true">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Level", "Streak", "Today", "Sessions"].map((label) => (
            <Card key={label}>
              <SectionLabel>{label}</SectionLabel>
              <Bar className="mt-3 h-8 w-24" />
              <Bar className="mt-3 h-2 w-full" />
              <Bar className="mt-2 h-3 w-32" />
            </Card>
          ))}
        </div>

        <section>
          <h2 className="mb-3 text-lg">Practice calendar</h2>
          <Card>
            <Bar className="h-32 w-full" />
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg">Trends</h2>
          <Card>
            <Bar className="h-40 w-full" />
          </Card>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header stat row                                                     */
/* ------------------------------------------------------------------ */

/**
 * The overview's four cards.
 *
 * The "Today" bar fills against the same goal, counted the same way, as the
 * ring in every practice room (useDailyGoal and useGoalDoneSec): ten minutes
 * of any practice on Pro, and on the free plan the five guided minutes a day
 * the allowance covers. It used to fill against a fixed ten minutes of all
 * practice, so a free singer who had used their five minutes saw a full ring
 * in the room and half a red bar here, for a goal the free plan cannot reach.
 *
 * Exported for its test.
 */
export function HeaderRow({
  xp,
  streakCurrent,
  streakBest,
  streakLastDay,
  todaySec,
  goal,
  sessionCount,
  totalSec,
  restDay = false,
}: {
  xp: number;
  streakCurrent: number;
  streakBest: number;
  streakLastDay: string | null;
  /**
   * Today is a rest day in the singer's running program. A streak still
   * waiting on today's session is then labelled as the rest day rather than
   * "Keep it alive", so the page does not tell the singer to sing on the day
   * their program says to rest.
   */
  restDay?: boolean;
  /** All practice logged today, whatever the room. */
  todaySec: number;
  /** Today's goal and what counts toward it, as the practice rooms measure them. */
  goal: { doneSec: number; goalSec: number; isPro: boolean };
  sessionCount: number;
  totalSec: number;
}) {
  const lvl = levelForXp(xp);
  const streak = streakChipState({ current: streakCurrent, lastDay: streakLastDay });
  // `streak.current` is only recomputed when a session is logged, so a run that
  // died days ago still reads as a live count. Say so rather than colouring a
  // dead number coral.
  const lapsed = streak === "none" && streakCurrent > 0;
  const goalMin = Math.max(1, Math.round(goal.goalSec / 60));
  const goalMet = goal.doneSec >= goal.goalSec;
  const goalPct = goal.goalSec > 0 ? Math.min(100, (goal.doneSec / goal.goalSec) * 100) : 0;
  // On free the goal is the daily allowance. A stored goal below it is the
  // singer's own, and calling that "free guided minutes" would misstate the cap.
  const freeAllowance = !goal.isPro && goal.goalSec >= FREE_DAILY_SEC;
  const goalLine = !freeAllowance
    ? goalMet
      ? `today's ${goalMin}-minute goal met`
      : `of today's ${goalMin}-minute goal`
    : goalMet
      ? `today's ${goalMin} free guided minutes done`
      : `${Math.floor(goal.doneSec / 60)} of today's ${goalMin} free guided minutes`;
  // The store keeps the newest MAX_SESSIONS. Past that the count stops and the
  // total covers only what is kept, so both say so instead of reading as a
  // lifetime figure that can go down.
  const atCap = sessionCount >= MAX_SESSIONS;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <SectionLabel>Level</SectionLabel>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl text-violet-ink">{lvl.level}</span>
          <span className="text-mut">{lvl.title}</span>
        </div>
        <ProgressBar
          value={lvl.progress * 100}
          label={`Progress through level ${lvl.level}`}
          className="mt-3"
        />
        <p className="tabular mt-1.5 font-mono text-[11px] text-dim">
          {lvl.intoLevel.toLocaleString()} / {(lvl.intoLevel + lvl.toNext).toLocaleString()} XP
          {" · "}
          {lvl.toNext.toLocaleString()} to next
        </p>
      </Card>

      <Card>
        <SectionLabel>Streak</SectionLabel>
        <div
          className={`mt-3 flex items-center gap-2 ${lapsed ? "text-dim" : "text-rec"}`}
        >
          <FlameIcon filled={streak === "banked"} />
          <span className="tabular font-mono text-2xl">{streakCurrent}</span>
          <span className="text-sm text-mut">
            {streakCurrent === 1 ? "day" : "days"}
          </span>
        </div>
        {streak !== "none" ? (
          <p
            className={`mt-1.5 font-mono text-[11px] uppercase tracking-[0.14em] ${
              streak === "banked" ? "text-ok-ink" : "text-violet-ink"
            }`}
          >
            {streak === "banked" ? "Banked today" : restDay ? "Program rest day" : "Keep it alive"}
          </p>
        ) : lapsed ? (
          <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Ended. Practice starts a new one
          </p>
        ) : null}
        <p className="tabular mt-1.5 font-mono text-[11px] text-dim">
          Best streak: {streakBest} {streakBest === 1 ? "day" : "days"}
        </p>
      </Card>

      <Card>
        <Stat
          label="Today"
          value={fmtDur(todaySec)}
          sub={goalLine}
          tone={goalMet ? "ok" : "ink"}
        />
        <ProgressBar
          value={goalPct}
          label="Daily practice goal"
          tone={goalMet ? "ok" : "rec"}
          className="mt-3"
        />
      </Card>

      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Sessions"
            value={atCap ? `${MAX_SESSIONS}+` : sessionCount.toLocaleString()}
            sub={atCap ? `latest ${MAX_SESSIONS} kept` : undefined}
          />
          <Stat
            label="Total time"
            value={fmtDur(totalSec)}
            sub={atCap ? `across the latest ${MAX_SESSIONS} sessions` : undefined}
          />
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Achievements gallery                                                */
/* ------------------------------------------------------------------ */

function AchievementsGallery({ unlocked }: { unlocked: string[] }) {
  const unlockedSet = new Set(unlocked);
  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg">Achievements</h2>
        <span className="tabular font-mono text-xs text-dim">
          {unlocked.length} of {ACHIEVEMENTS.length}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlockedSet.has(a.id);
          return (
            // A locked tile keeps its text at full contrast: fading the whole
            // tile put it at 2.06:1. The dashed border, the dimmed icon and
            // the "Locked" label carry the state instead.
            <div
              key={a.id}
              className={
                isUnlocked
                  ? "rounded-xl border border-violet/40 bg-panel2 p-3"
                  : "rounded-xl border border-dashed border-line2 p-3"
              }
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`text-xl leading-none ${isUnlocked ? "" : "opacity-40 grayscale"}`}
                  aria-hidden="true"
                >
                  {a.icon}
                </span>
                <div className="min-w-0">
                  <div
                    className={
                      isUnlocked ? "text-sm font-medium text-ink" : "text-sm font-medium text-mut"
                    }
                  >
                    {a.title}
                  </div>
                  <p className="mt-0.5 text-xs text-mut">{a.desc}</p>
                  {!isUnlocked && (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
                      Locked
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Session log                                                         */
/* ------------------------------------------------------------------ */

/**
 * The session log.
 *
 * `limit` is what makes the pricing table's "Practice history" row true. It ran
 * `slice(0, 20)` for everyone, Pro included, while /pro sold "Full history +
 * trends" — so the one row a subscriber was most likely to check on their first
 * paid session was the one that had never been implemented.
 */
function SessionLogTable({
  sessions,
  limit,
}: {
  sessions: SessionLog[];
  limit: number | null;
}) {
  const todayKey = localDayStr(new Date());
  const recent = limit === null ? sessions : sessions.slice(0, limit);

  if (recent.length === 0) {
    return (
      <EmptyState
        title="No sessions logged yet"
        hint="Every exercise you finish shows up here: a warmup, a range test, an ear-training round."
      />
    );
  }

  return (
    // Focusable and named, so a keyboard can scroll the table sideways on a
    // phone, where it is wider than the screen.
    <div
      tabIndex={0}
      role="region"
      aria-label="Recent sessions"
      className="-mx-5 overflow-x-auto sm:-mx-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-ink"
    >
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="px-5 py-2 font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-dim sm:px-6">
              Type
            </th>
            <th className="px-3 py-2 font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-dim">
              Detail
            </th>
            <th className="px-3 py-2 text-right font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-dim">
              Duration
            </th>
            <th className="px-3 py-2 text-right font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-dim">
              Score
            </th>
            <th className="px-3 py-2 text-right font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-dim">
              XP
            </th>
            <th className="px-5 py-2 text-right font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-dim sm:px-6">
              When
            </th>
          </tr>
        </thead>
        <tbody>
          {recent.map((s) => {
            const meta = TYPE_META[s.type];
            return (
              <tr key={s.id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-2.5 sm:px-6">
                  <Pill tone={meta.tone}>{meta.label}</Pill>
                </td>
                <td className="px-3 py-2.5 text-mut">{s.detail ?? "—"}</td>
                <td className="tabular px-3 py-2.5 text-right font-mono text-xs text-ink">
                  {fmtDur(s.durationSec)}
                </td>
                <td className="tabular px-3 py-2.5 text-right font-mono text-xs text-ink">
                  {s.score !== undefined ? Math.round(s.score) : "—"}
                </td>
                <td className="tabular px-3 py-2.5 text-right font-mono text-xs text-violet-ink">
                  +{s.xp}
                </td>
                <td className="px-5 py-2.5 text-right font-mono text-xs text-dim sm:px-6">
                  {relDay(s.day, todayKey)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Data controls                                                       */
/* ------------------------------------------------------------------ */


export function DataControls({
  fresh = false,
}: {
  /** True for a record with nothing in it yet, when there is nothing to sell sync for. */
  fresh?: boolean;
} = {}) {
  const isPro = useIsPro();
  const { paused } = useProgressCloudState();
  const { isLoaded, isSignedIn } = useAccountAuth();
  // Pro's own sync supersedes the account snapshot, so a Pro member is shown
  // the sync controls and never both. Nothing waits on Clerk: while it is
  // still loading this reads false and the card looks exactly as it did
  // before accounts existed.
  const accountBackup = isLoaded && isSignedIn && !isPro;
  // Worded by what actually holds a copy of the record (data-copy.ts).
  const copy = dataControlsCopy({ paused, isPro, accountBackup });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotice, setImportNotice] = useState<
    { kind: "ok" | "err"; text: string } | null
  >(null);
  const [confirmText, setConfirmText] = useState("");
  // How many erases this card has done: each one moves focus (below).
  const [erasures, setErasures] = useState(0);
  const erased = erasures > 0;
  const erasedNoteRef = useRef<HTMLParagraphElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  // Erasing clears the confirmation, which disables the focused button, and
  // the page above collapses to the empty state, so focus fell to <body> and
  // the next Tab went to the room rail below the dashboard. Land on the note
  // that says what happened, or on the field when no note shows.
  useEffect(() => {
    if (erasures === 0) return;
    (erasedNoteRef.current ?? confirmRef.current)?.focus();
  }, [erasures]);

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const before = getState().sessions.map((s) => s.id);
      const ok = importProgress(String(reader.result ?? ""));
      if (!ok) {
        setImportNotice({ kind: "err", text: "That file didn't parse as valid progress data." });
        return;
      }
      // The import merges, but the store still keeps only the newest
      // MAX_SESSIONS, so a big file can push this browser's oldest sessions
      // out. Say so rather than claim they were all kept.
      const kept = new Set(getState().sessions.map((s) => s.id));
      const dropped = before.some((id) => !kept.has(id));
      setImportNotice({
        kind: "ok",
        text: dropped
          ? `Progress imported. Only the latest ${MAX_SESSIONS} sessions are kept, so the oldest ones on this device were dropped.`
          : "Progress imported. Sessions already on this device were kept.",
      });
    };
    reader.onerror = () => {
      setImportNotice({ kind: "err", text: "Couldn't read that file." });
    };
    reader.readAsText(file);
  }

  function handleErase() {
    if (confirmText.trim().toLowerCase() !== "erase") return;
    // With no Pro and accounts off there is no copy anywhere else, so the
    // erase's sync pause would guard nothing; left behind, it would silently
    // stop Pro sync if this singer bought Pro here later. Pro and account
    // erases keep it, so a remote copy cannot undo the erase.
    eraseBrowserProgress({ remoteCopyPossible: isPro || accountsReady() });
    setConfirmText("");
    setErasures((n) => n + 1);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-lg">Backup &amp; transfer</h2>
        <p className="mt-1.5 text-sm text-mut">
          {copy.backup}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {/* The same file the save prompt offers, from the same helper, so the
              two can never drift into backups the Import button can't read. */}
          <Button variant="outline" size="sm" onClick={downloadProgressBackup}>
            <DownloadIcon />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <UploadIcon />
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        {isPro ? (
          <SyncControls />
        ) : (
          <div className="mt-3 space-y-3">
            {accountBackup && <AccountBackupControls />}
            {/* Still worth saying to a signed-in free user: a snapshot they
                take is not the live mirror Pro pays for. Not on an empty
                record, though: there is nothing to sync yet, and a page with
                no sessions should not open on a row of asks. */}
            {!fresh && (
              <ProInlineNudge>
                Pro syncs progress across devices automatically
              </ProInlineNudge>
            )}
            {/* Pro lives in this browser's storage, so a cleared or second
                browser reads as free here while the record waits in the
                cloud. The nudge above sells Pro; this is the way back. Not
                after an erase here: sync stays paused until the singer
                resumes it, so a restored key would not merge anything. */}
            {!paused && (
              <FreeOnly>
                <p className="text-xs text-mut">
                  Already have Pro?{" "}
                  <Link href="/pro#restore" className="text-violet-ink underline underline-offset-4">
                    Unlock it in this browser
                  </Link>
                  ; your synced record merges into this one.
                </p>
              </FreeOnly>
            )}
          </div>
        )}
        {importNotice && (
          <p
            className={
              importNotice.kind === "ok"
                ? "mt-3 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-xs text-ok-ink"
                : "mt-3 rounded-lg border border-rec/40 bg-rec/10 px-3 py-2 text-xs text-rec"
            }
            role="status"
          >
            {importNotice.text}
          </p>
        )}
      </Card>

      <Card className="border-rec/30">
        <h2 className="text-lg text-rec">Danger zone</h2>
        <p className="mt-1.5 text-sm text-mut">
          {copy.danger}
        </p>
        {/* A free singer's erase lifts its own pause, so the note does not
            wait for one; a Pro or account erase's note says sync is paused,
            and goes once it is resumed. */}
        {erased && (paused || !(isPro || accountBackup)) && (
          <p
            ref={erasedNoteRef}
            tabIndex={-1}
            className="mt-4 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-xs text-ok-ink"
            role="status"
          >
            {copy.erased}
          </p>
        )}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <label className="sr-only" htmlFor="erase-confirm">
              Type &quot;erase&quot; to confirm
            </label>
            <input
              ref={confirmRef}
              id="erase-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "erase" to confirm'
              className="w-48 rounded-full border border-line2 bg-panel2 px-3.5 py-1.5 text-sm text-ink placeholder:text-dim focus-visible:border-rec"
            />
            <Button
              variant="rec"
              size="sm"
              disabled={confirmText.trim().toLowerCase() !== "erase"}
              onClick={handleErase}
            >
              Erase browser progress
            </Button>
          </div>
      </Card>
    </div>
  );
}

/**
 * The first screen of an empty record: a first visit, from search for
 * "singing progress tracker", or a browser that was cleared. The way to start
 * comes first, ahead of a wall of zeros. The free-minutes rule is not repeated
 * here: the coach card's footnote and the server-rendered section on this
 * page already say it, and the extra lines put every start button behind a
 * 375×667 phone's tab bar.
 */
export function FreshStart() {
  const { paused } = useProgressCloudState();
  return (
    <EmptyState
      title="Nothing logged yet"
      hint="Finish any exercise (a warmup, a range test, an ear-training round) and it starts filling in your XP, streak, and charts below."
      action={
        <div>
          <div className="flex flex-wrap justify-center gap-2.5">
            <LinkButton href="/studio" variant="rec">
              Open the studio
            </LinkButton>
            <LinkButton href={rangeTestHref()} variant="outline">
              Find your range
            </LinkButton>
            <LinkButton href="/warmups" variant="outline">
              Try a warmup
            </LinkButton>
          </div>
          {/* A cleared browser lands here too, and the backup card sent
              its singer to this page to restore. Under the start
              buttons, so they keep their place on a phone; the import
              itself is at the foot of the page. */}
          <p className="mt-4 text-center text-sm text-mut">
            Back on a cleared browser with a backup file?{" "}
            <a href="#your-data" className="text-violet-ink underline underline-offset-4">
              Import it under Your data
            </a>
            .
          </p>
          {/* Clearing a browser takes Pro with it, so a Pro owner lands here
              as free with their record safe in the cloud. Restoring the key
              starts sync (components/pro/sync.tsx), which merges it back.
              Not after an erase on this browser, which pauses sync until
              the singer resumes it: nothing would come back by itself. */}
          {!paused && (
            <FreeOnly>
              <p className="mt-2 text-center text-sm text-mut">
                Have Pro?{" "}
                <Link href="/pro#restore" className="text-violet-ink underline underline-offset-4">
                  Unlock it in this browser
                </Link>{" "}
                and your synced sessions, streak and range come back here.
              </p>
            </FreeOnly>
          )}
        </div>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Main assembly                                                       */
/* ------------------------------------------------------------------ */

/** Shared by the pre-mount skeleton and the dashboard, so the first paint and
 *  the hydrated page carry the same intro. */
const PROGRESS_SUBTITLE =
  "Track your singing practice in one place: XP, streaks, achievements, your saved vocal range and today's coached session, kept on this device. Pro adds a per-note accuracy chart and your range over time.";

export function ProgressClient() {
  const state = useProgress();
  const isPro = useIsPro();
  const { goalSec } = useDailyGoal();
  const goalDoneSec = useGoalDoneSec(state);
  // Null before mount and with no program running, so the card below only
  // appears for a singer who has started one.
  const activeProgram = useActiveProgram();
  // The running program's name when today is one of its rest days: a rest day
  // is done as soon as it is reached, so it shows as today's completed day.
  const programRestDay =
    activeProgram &&
    activeProgram.view.status === "done-today" &&
    isRestDay(activeProgram.program.days[activeProgram.view.index])
      ? activeProgram.program.name
      : null;
  // A Pro day a free singer cannot open is not today's plan: it follows the
  // coached session instead of leading the dashboard with a paywall.
  const programPaywalled = activeProgram !== null && programDayNeedsPro(activeProgram, isPro);
  // The range test the running program schedules next: the coach leaves a
  // stale range's retest to it rather than asking for an extra one between
  // the program's own (null when none is left, or when it needs Pro this
  // singer does not have).
  const programRange = activeProgram ? programRangeTest(activeProgram, isPro) : null;
  // Recovery week's name while it runs: a week for a tired voice, so the coach
  // asks for no range test (it would save a tired reading as the range) and
  // no octave siren at the top of the range until the week is over.
  const recovering = activeProgram ? recoveryWeekOf(activeProgram) : null;
  const todaySec = todayPracticeSec(state);
  const weekly = weeklyReport(state.sessions);
  const totalSec = state.sessions.reduce((a, s) => a + s.durationSec, 0);
  const isFresh = state.sessions.length === 0 && state.xp === 0;
  const noteTallies = useMemo(
    () => aggregateNotes(state.sessions),
    [state.sessions],
  );

  // The calendar heatmap and trend charts render "today" and date-range axis
  // labels unconditionally, computed from new Date(). This page is statically
  // prerendered, so the server's "now" is frozen at build time and will
  // always disagree with the client's real "now" on the very first render —
  // a guaranteed hydration mismatch, not a hypothetical one. Deferring the
  // real, date-dependent tree to a client-only render (after the first paint
  // matches the server exactly) is the standard fix for this class of bug.
  //
  // Only while hydrating, though: a client-side arrival (a tab, a link, Back)
  // has no server HTML to match, so the dashboard renders on the first pass.
  // That is what makes Back land where the singer left. The browser restores
  // the old scroll position against the page as it stands, and when that was
  // the viewport-tall skeleton, Chrome's scroll anchoring then carried the
  // page down by the dashboard's extra height as it swapped in: the coach
  // card's 1,507px came back as 7,146px on a phone, at the room rail.
  const mounted = useHydrated();

  // A full page load of /progress#your-data finds no target in the server
  // HTML, so the browser's jump to it stays at the top. Make it once the
  // dashboard is in, on that load only: a reload or a Back restores the
  // singer's own position, and a client-side link scrolls itself.
  const [arrivedByHydration] = useState(() => !mounted);
  useEffect(() => {
    if (!mounted || !arrivedByHydration) return;
    let id = "";
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    if (!id) return;
    const entry = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (entry && entry.type !== "navigate") return;
    document.getElementById(id)?.scrollIntoView();
  }, [mounted, arrivedByHydration]);

  if (!mounted) {
    return (
      <PageShell
        kicker="Progress"
        title="Singing progress tracker"
        subtitle={PROGRESS_SUBTITLE}
      >
        <DashboardSkeleton />
      </PageShell>
    );
  }

  // Past the store's cap the oldest kept session can fall inside the
  // calendar's twelve weeks, and the days before it would read as days off.
  // After the mount gate because it reads today's date.
  const oldestKeptDay =
    state.sessions.length >= MAX_SESSIONS
      ? state.sessions.reduce((min, s) => (s.day < min ? s.day : min), state.sessions[0].day)
      : null;
  const calendarCutoff =
    oldestKeptDay && oldestKeptDay > calendarStartDay()
      ? parseDay(oldestKeptDay).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null;

  return (
    <PageShell
      kicker="Progress"
      title="Singing progress tracker"
      subtitle={PROGRESS_SUBTITLE}
    >
      <div className="space-y-10">
        {isFresh && <FreshStart />}

        {!isFresh && (
          <Card>
            <SectionLabel>This week so far</SectionLabel>
            <p className="mt-2 text-sm text-mut">Since Monday, compared with the full previous week. Up to three stars per scored session.</p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              {([
                ["Stars earned", String(weekly.thisWeek.stars), String(weekly.lastWeek.stars)],
                ["Sessions", String(weekly.thisWeek.sessions), String(weekly.lastWeek.sessions)],
                ["Practice time", fmtDur(weekly.thisWeek.durationSec), fmtDur(weekly.lastWeek.durationSec)],
              ] as const).map(([label, current, previous]) => (
                <div key={label}>
                  <dt className="text-sm text-mut">{label}</dt>
                  <dd className="mt-1 font-mono text-xl">{current}</dd>
                  <dd className="mt-1 text-xs text-dim">{previous} last week</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}

        <section aria-label="Overview">
          <HeaderRow
            xp={state.xp}
            streakCurrent={state.streak.current}
            streakBest={state.streak.best}
            streakLastDay={state.streak.lastDay}
            todaySec={todaySec}
            goal={{ doneSec: goalDoneSec, goalSec, isPro }}
            sessionCount={state.sessions.length}
            totalSec={totalSec}
            restDay={programRestDay !== null}
          />
          {/* Directly under the numbers it is talking about. The stat row above
              is the whole practice record in four cards, so this is where its
              loss is legible. `when` is false on a fresh dashboard, which also
              means this and the empty state above can never both be on
              screen. */}
          <AccountSavePrompt when={!isFresh} className="mt-4" />
        </section>

        {/* Today's plan right after the numbers, not six phone screens down
            under the charts: the running program first, since it is the plan
            the singer chose, then the coached session. */}
        {activeProgram && !programPaywalled && <ProgramEntryCard active={activeProgram} />}

        <section aria-label="Today's coached session">
          <CoachCard
            state={state}
            restDayOf={programRestDay}
            programRange={programRange}
            recovering={recovering}
            hideProNudge={programPaywalled}
          />
        </section>

        {activeProgram && programPaywalled && <ProgramEntryCard active={activeProgram} />}

        <section aria-label="Practice calendar">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-lg">Practice calendar</h2>
          </div>
          <Card>
            <PracticeCalendar sessions={state.sessions} />
            {calendarCutoff && (
              <p className="mt-2 text-xs text-dim">
                Your practice record keeps the latest {MAX_SESSIONS} sessions,
                so the calendar shows no practice before {calendarCutoff}.
              </p>
            )}
          </Card>
        </section>

        <section aria-label="Practice charts" className="space-y-4">
          <h2 className="text-lg">Trends</h2>
          {/* Not on an empty record: a fortnight of bare gridlines says
              nothing the empty state above has not, and it is 350px tall. */}
          {!isFresh && (
            <Card>
              <SectionLabel>Minutes / day · last 14 days</SectionLabel>
              <div className="mt-4">
                <MinutesBarChart sessions={state.sessions} />
              </div>
            </Card>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionLabel>Score trend · by week</SectionLabel>
              <div className="mt-4">
                <ScoreTrendChart sessions={state.sessions} />
              </div>
            </Card>
            <Card>
              <SectionLabel>Practice mix</SectionLabel>
              <div className="mt-4">
                <PracticeMixChart sessions={state.sessions} />
              </div>
            </Card>
          </div>
          {isPro ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel>Accuracy by note</SectionLabel>
                  <ProChip />
                </div>
                <div className="mt-4">
                  <NoteAccuracyChart tallies={noteTallies} />
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel>Range over time</SectionLabel>
                  <ProChip />
                </div>
                <div className="mt-4">
                  <RangeHistoryChart history={state.rangeHistory} />
                </div>
              </Card>
            </div>
          ) : !isFresh ? (
            <LockedPanel label="Accuracy by note" className="mt-4">
              {/* Real chart as the preview: faded and inert under the panel,
                  but it is the singer's own data doing the selling. With no
                  sessions there is none to do it, so the panel waits for the
                  first one. */}
              <div className="p-4 sm:p-5">
                <NoteAccuracyChart tallies={noteTallies} />
              </div>
            </LockedPanel>
          ) : null}
        </section>

        <section aria-label="Your voice">
          <VoiceCard range={state.range} />
        </section>

        {/* Sixteen greyed-out badges are not a start; the gallery waits for
            the first session, when there is something to count toward. */}
        {!isFresh && (
          <section aria-label="Achievements">
            <AchievementsGallery unlocked={state.achievements} />
          </section>
        )}

        <section aria-label="Session log">
          <Card pad>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <h2 className="text-lg">Recent sessions</h2>
              <span className="tabular font-mono text-xs text-dim">
                {isPro
                  ? state.sessions.length >= MAX_SESSIONS
                    ? `latest ${MAX_SESSIONS}`
                    : `all ${state.sessions.length}`
                  : `last ${Math.min(FREE_SESSION_LOG, state.sessions.length)}`}
              </span>
            </div>
            <div className="mt-3">
              <SessionLogTable
                sessions={state.sessions}
                limit={isPro ? null : FREE_SESSION_LOG}
              />
            </div>
            <FreeOnly>
              {state.sessions.length > FREE_SESSION_LOG && (
                <ProInlineNudge>
                  {`${state.sessions.length - FREE_SESSION_LOG} older sessions are stored; Pro shows all of them`}
                </ProInlineNudge>
              )}
            </FreeOnly>
          </Card>
        </section>

        <section id="your-data" aria-label="Data controls" className="scroll-mt-24">
          <h2 className="mb-3 text-lg">Your data</h2>
          <DataControls fresh={isFresh} />
        </section>
      </div>
    </PageShell>
  );
}
