"use client";

import { useRef, useState } from "react";
import {
  ACHIEVEMENTS,
  clearProgress,
  exportProgress,
  importProgress,
  levelForXp,
  todayPracticeSec,
  useProgress,
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
import { PracticeCalendar } from "./calendar";
import { MinutesBarChart, PracticeMixChart, ScoreTrendChart } from "./charts";
import { CoachCard } from "./coach";
import { VoiceCard } from "./voice-card";
import { TYPE_META, fmtDur, localDayStr, relDay } from "./format";

/* ------------------------------------------------------------------ */
/* Small inline icons — coral flame for streaks.                      */
/* ------------------------------------------------------------------ */

function FlameIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
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
/* Header stat row                                                     */
/* ------------------------------------------------------------------ */

function HeaderRow({
  xp,
  streakCurrent,
  streakBest,
  todaySec,
  sessionCount,
  totalSec,
}: {
  xp: number;
  streakCurrent: number;
  streakBest: number;
  todaySec: number;
  sessionCount: number;
  totalSec: number;
}) {
  const lvl = levelForXp(xp);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <SectionLabel>Level</SectionLabel>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-3xl text-amber">{lvl.level}</span>
          <span className="text-mut">{lvl.title}</span>
        </div>
        <ProgressBar value={lvl.progress * 100} className="mt-3" />
        <p className="tabular mt-1.5 font-mono text-[11px] text-dim">
          {lvl.intoLevel.toLocaleString()} / {(lvl.intoLevel + lvl.toNext).toLocaleString()} XP
          {" · "}
          {lvl.toNext.toLocaleString()} to next
        </p>
      </Card>

      <Card>
        <SectionLabel>Streak</SectionLabel>
        <div className="mt-3 flex items-center gap-2 text-rec">
          <FlameIcon />
          <span className="tabular font-mono text-2xl">{streakCurrent}</span>
          <span className="text-sm text-mut">
            {streakCurrent === 1 ? "day" : "days"}
          </span>
        </div>
        <p className="tabular mt-1.5 font-mono text-[11px] text-dim">
          Best streak: {streakBest} {streakBest === 1 ? "day" : "days"}
        </p>
      </Card>

      <Card>
        <Stat label="Today" value={fmtDur(todaySec)} sub="practiced so far" />
      </Card>

      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Sessions" value={sessionCount.toLocaleString()} />
          <Stat label="Total time" value={fmtDur(totalSec)} />
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
            <div
              key={a.id}
              className={
                isUnlocked
                  ? "rounded-xl border border-amber/40 bg-panel2 p-3"
                  : "rounded-xl border border-line p-3 opacity-45"
              }
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl leading-none" aria-hidden="true">
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

function SessionLogTable({ sessions }: { sessions: SessionLog[] }) {
  const todayKey = localDayStr(new Date());
  const recent = sessions.slice(0, 20);

  if (recent.length === 0) {
    return (
      <EmptyState
        title="No sessions logged yet"
        hint="Every exercise you finish — a warmup, a range test, an ear-training round — shows up here."
      />
    );
  }

  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
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
                <td className="tabular px-3 py-2.5 text-right font-mono text-xs text-amber">
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

function DataControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotice, setImportNotice] = useState<
    { kind: "ok" | "err"; text: string } | null
  >(null);
  const [confirmText, setConfirmText] = useState("");
  const [erased, setErased] = useState(false);

  function handleExport() {
    const json = exportProgress();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = localDayStr(new Date());
    a.href = url;
    a.download = `suede-sing-progress-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importProgress(String(reader.result ?? ""));
      setImportNotice(
        ok
          ? { kind: "ok", text: "Progress imported. Your dashboard is now up to date." }
          : { kind: "err", text: "That file didn't parse as valid progress data." },
      );
    };
    reader.onerror = () => {
      setImportNotice({ kind: "err", text: "Couldn't read that file." });
    };
    reader.readAsText(file);
  }

  function handleErase() {
    if (confirmText.trim().toLowerCase() !== "erase") return;
    clearProgress();
    setConfirmText("");
    setErased(true);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-lg">Backup &amp; transfer</h2>
        <p className="mt-1.5 text-sm text-mut">
          Progress lives only in this browser. Export a copy to back it up or move
          it to another device, then import it there.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExport}>
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
        {importNotice && (
          <p
            className={
              importNotice.kind === "ok"
                ? "mt-3 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-xs text-ok"
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
          Permanently erase all XP, sessions, streaks, range data, and
          achievements from this browser. This can&apos;t be undone — export a
          backup first if you want one.
        </p>
        {erased ? (
          <p
            className="mt-4 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-xs text-ok"
            role="status"
          >
            Progress erased. Your dashboard has been reset.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <label className="sr-only" htmlFor="erase-confirm">
              Type &quot;erase&quot; to confirm
            </label>
            <input
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
              Erase everything
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main assembly                                                       */
/* ------------------------------------------------------------------ */

export function ProgressClient() {
  const state = useProgress();
  const todaySec = todayPracticeSec(state);
  const totalSec = state.sessions.reduce((a, s) => a + s.durationSec, 0);
  const isFresh = state.sessions.length === 0 && state.xp === 0;

  return (
    <PageShell
      kicker="Practice room 9"
      title="Progress"
      subtitle="XP, streaks, achievements, and a coach that reads your last two weeks of practice."
    >
      <div className="space-y-10">
        <section aria-label="Overview">
          <HeaderRow
            xp={state.xp}
            streakCurrent={state.streak.current}
            streakBest={state.streak.best}
            todaySec={todaySec}
            sessionCount={state.sessions.length}
            totalSec={totalSec}
          />
          {isFresh && (
            <div className="mt-4">
              <EmptyState
                title="Nothing logged yet"
                hint="Finish any exercise — a warmup, a range test, an ear-training round — and it starts filling in your XP, streak, and charts below."
                action={
                  <div className="flex flex-wrap justify-center gap-2.5">
                    <LinkButton href="/studio" variant="rec">
                      Open the studio
                    </LinkButton>
                    <LinkButton href="/range" variant="outline">
                      Find your range
                    </LinkButton>
                    <LinkButton href="/warmups" variant="outline">
                      Try a warmup
                    </LinkButton>
                  </div>
                }
              />
            </div>
          )}
        </section>

        <section aria-label="Practice calendar">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-lg">Practice calendar</h2>
          </div>
          <Card>
            <PracticeCalendar sessions={state.sessions} />
          </Card>
        </section>

        <section aria-label="Practice charts" className="space-y-4">
          <h2 className="text-lg">Trends</h2>
          <Card>
            <SectionLabel>Minutes / day — last 14 days</SectionLabel>
            <div className="mt-4">
              <MinutesBarChart sessions={state.sessions} />
            </div>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionLabel>Score trend — by week</SectionLabel>
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
        </section>

        <section aria-label="Your voice">
          <VoiceCard range={state.range} />
        </section>

        <section aria-label="Achievements">
          <AchievementsGallery unlocked={state.achievements} />
        </section>

        <section aria-label="Today's coached session">
          <CoachCard state={state} />
        </section>

        <section aria-label="Session log">
          <Card pad>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <h2 className="text-lg">Recent sessions</h2>
              <span className="tabular font-mono text-xs text-dim">
                last {Math.min(20, state.sessions.length)}
              </span>
            </div>
            <div className="mt-3">
              <SessionLogTable sessions={state.sessions} />
            </div>
          </Card>
        </section>

        <section aria-label="Data controls">
          <h2 className="mb-3 text-lg">Your data</h2>
          <DataControls />
        </section>
      </div>
    </PageShell>
  );
}
