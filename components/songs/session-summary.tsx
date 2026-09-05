"use client";

import { LinkButton } from "@/components/ui";

import { Button, Card, Pill, ProgressBar, SectionLabel, Stat } from "@/components/ui";
import { midiToLabel } from "@/lib/audio/notes";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { useProgress, type SessionLog } from "@/lib/progress";
import { computeGrade, starGlyphs, starRatingLabel, type Tone } from "./grade";
import { ResultCard } from "./result-card";
import { JUDGMENTS, formatTempoPct, type Judgment, type SessionSummaryData } from "./lib";
import type { SessionMode, Song } from "./types";

function scoreTone(score: number): "ok" | "violet" | "rec" {
  if (score >= 80) return "ok";
  if (score >= 50) return "violet";
  return "rec";
}

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-ok-ink",
  violet: "text-violet-ink",
  rec: "text-rec",
};

/** Our own names for the two session modes — the summary never borrows another product's labels. */
const MODE_LABEL: Record<SessionMode, string> = {
  rehearsal: "Rehearsal",
  performance: "Performance",
};

/** Bar tone per judgment band — reuses the same violet/ok/rec/cool palette ProgressBar already speaks. */
const JUDGMENT_TONE: Record<Judgment, "ok" | "cool" | "violet" | "rec"> = {
  perfect: "ok",
  great: "cool",
  good: "violet",
  miss: "rec",
};

type ScoredSongLog = SessionLog & { score: number };

/** Every logged "song" session for this title that carries a score, newest first. */
function songScoreLogs(sessions: SessionLog[], title: string): ScoredSongLog[] {
  return sessions.filter(
    (s): s is ScoredSongLog => s.type === "song" && s.detail === title && s.score !== undefined,
  );
}

/**
 * Personal-best comparison for the run that just finished.
 *
 * By the time this screen renders, `logSession` has already written the
 * just-finished run into the store (song-player.tsx calls it before
 * `onFinish`), and sessions are stored newest-first. That means the current
 * run is always `matches[0]` — comparing against the *unfiltered* best would
 * make every session announce itself as a new personal best purely by
 * matching itself. Dropping that first entry before taking the max is what
 * makes "new personal best" mean "beat a previous attempt," not "exists."
 */
function personalBestInfo(sessions: SessionLog[], song: Song, currentScore: number) {
  const matches = songScoreLogs(sessions, song.title);
  const previous = matches.slice(1);
  const previousBest =
    previous.length > 0 ? Math.max(...previous.map((s) => s.score)) : undefined;
  const isNewBest = previousBest !== undefined && currentScore > previousBest;
  // Oldest -> newest, for a left-to-right sparkline that reads as a timeline.
  const history = previous.map((s) => s.score).reverse();
  return { previousBest, isNewBest, history };
}

/** Small hand-rolled trend line — no chart library, mirrors the SVG approach in components/progress/charts.tsx. */
function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) return null; // one point has no trend to draw
  const W = 160;
  const H = 36;
  const pad = 4;
  const stepX = (W - pad * 2) / (scores.length - 1);
  const y = (v: number) => pad + (H - pad * 2) * (1 - v / 100);
  const points = scores.map((s, i) => [pad + stepX * i, y(s)] as const);
  const path = points.map(([x, yy], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${yy.toFixed(1)}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-9 w-40 text-violet-ink"
      role="img"
      aria-label={`Score history: ${scores.join(", ")}`}
    >
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill="currentColor" />
    </svg>
  );
}

export function SessionSummary({
  data,
  onAgain,
  onLibrary,
  nextInSetlist,
  onNext,
}: {
  data: SessionSummaryData;
  onAgain: () => void;
  onLibrary: () => void;
  /** Title of the next queued song, when a setlist is mid-run. */
  nextInSetlist?: string;
  onNext?: () => void;
}) {
  const {
    song,
    score,
    perLoopScores,
    hardest,
    xpGained,
    newAchievements,
    listenMode,
    mode,
    points,
    topMultiplier,
  } = data;
  const progress = useProgress();

  // No mic, nothing judged, nothing to grade — computeGrade already encodes
  // this (it returns null whenever score is undefined), so listen mode falls
  // out of every grade/star/breakdown block below for free.
  const grade = computeGrade(score, data.maxCombo, data.judgments);
  const scored = !listenMode && score !== undefined;
  const totalJudged = JUDGMENTS.reduce((n, j) => n + data.judgments[j], 0);
  const { previousBest, isNewBest, history } = scored
    ? personalBestInfo(progress.sessions, song, score)
    : { previousBest: undefined, isNewBest: false, history: [] as number[] };

  return (
    <div className="space-y-6">
      <Card>
        <SectionLabel>{MODE_LABEL[mode]} complete</SectionLabel>
        <h2 className="mt-3 text-2xl">{song.title}</h2>
        {/* The rate the song ended on — on Auto the tempo can move mid-session. */}
        <p className="mt-1.5 text-sm text-mut">Finished at {formatTempoPct(data.tempo)} tempo</p>

        {!scored ? (
          <p className="mt-4 max-w-md text-sm text-mut">
            You practiced in listen mode, so there&rsquo;s no pitch score this
            time. Enable your microphone next time to get scored.
          </p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-10">
              <Stat label="Score" value={`${score}/100`} tone={scoreTone(score)} />
              <Stat label="Loops sung" value={perLoopScores.length} tone="cool" />
              {mode === "performance" && (
                <>
                  <Stat label="Points" value={`${points}`} tone="violet" />
                  <Stat label="Top multiplier" value={`${topMultiplier}×`} tone="cool" />
                </>
              )}
              {grade && (
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                    Grade
                  </div>
                  <div className={`mt-1 text-3xl ${TONE_TEXT[grade.tone]}`}>
                    {grade.grade}
                  </div>
                </div>
              )}
            </div>
            {grade && (
              <div className="mt-3 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="tabular font-mono text-base tracking-wider text-violet-ink"
                >
                  {starGlyphs(grade.stars)}
                </span>
                <span className="sr-only">{starRatingLabel(grade.stars)}</span>
              </div>
            )}
          </>
        )}

        {scored && perLoopScores.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Per-loop score
            </div>
            {perLoopScores.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="tabular w-14 shrink-0 font-mono text-xs text-dim">
                  loop {i + 1}
                </span>
                <ProgressBar value={s} tone={scoreTone(s)} className="flex-1" />
                <span className="tabular w-12 shrink-0 text-right font-mono text-xs">{s}%</span>
              </div>
            ))}
          </div>
        )}

        {scored && data.sectionScores.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Section scores
            </div>
            {data.sectionScores.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate font-mono text-xs text-dim">
                  {s.label}
                </span>
                <ProgressBar value={s.score} tone={scoreTone(s.score)} className="flex-1" />
                <span className="tabular w-12 shrink-0 text-right font-mono text-xs">
                  {s.score}%
                </span>
              </div>
            ))}
          </div>
        )}

        {scored && totalJudged > 0 && (
          <div className="mt-6 space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Judgment breakdown
            </div>
            {JUDGMENTS.map((j) => {
              const count = data.judgments[j];
              const pct = (count / totalJudged) * 100;
              return (
                <div key={j} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 font-mono text-xs capitalize text-dim">{j}</span>
                  <ProgressBar value={pct} tone={JUDGMENT_TONE[j]} className="flex-1" />
                  <span className="tabular w-10 shrink-0 text-right font-mono text-xs">{count}</span>
                </div>
              );
            })}
            <div className="pt-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Max combo{" "}
              </span>
              <span className="tabular font-mono text-xs text-cool">{data.maxCombo}</span>
            </div>
          </div>
        )}

        {scored && hardest.length > 0 && (
          <div className="mt-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Trickiest notes
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {hardest.map((n) => (
                <Pill key={n.index} tone="violet">
                  {midiToLabel(n.midi)} · &ldquo;{n.lyric}&rdquo;
                </Pill>
              ))}
            </div>
          </div>
        )}
      </Card>

      {scored && (
        <Card>
          <SectionLabel>Personal best</SectionLabel>
          {previousBest === undefined ? (
            <p className="mt-3 text-sm text-mut">
              First time singing this one — nothing to compare against yet.
            </p>
          ) : isNewBest ? (
            <p className="mt-3 text-sm text-ok-ink">
              New personal best — up from {previousBest}.
            </p>
          ) : (
            <p className="mt-3 text-sm text-mut">
              Personal best is {previousBest}. This run: {score}.
            </p>
          )}
          {history.length > 0 && (
            <div className="mt-4">
              <Sparkline scores={[...history, score as number]} />
              <p className="mt-1.5 text-xs text-dim">
                Last {history.length + 1} scored attempt{history.length + 1 === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </Card>
      )}

      {scored && <ResultCard data={data} />}

      {!listenMode && (
        <div>
          <ProCrescendoNudge
            line="Pro unlocks the full songbook and per-note practice data"
            title="Keep building this score"
            body="Pro unlocks the full songbook and builds per-note history across your scored practices."
            context="Song practice"
          />
        </div>
      )}

      <Card className="border-ok/30">
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone="ok">Saved to your progress</Pill>
          <span className="tabular font-mono text-sm text-ok-ink">+{xpGained} XP</span>
        </div>
        {newAchievements.length > 0 && (
          <ul className="mt-4 space-y-2">
            {newAchievements.map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span aria-hidden="true">{a.icon}</span>
                <span className="font-medium">{a.title}</span>
                <span className="text-mut">{a.desc}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        {/*
          Mid-setlist, moving on is the primary action and gets the violet
          button. The score still gets read first either way: chaining
          straight into the next song would throw away the grade the singer
          just earned.
        */}
        {nextInSetlist && onNext ? (
          <>
            <Button variant="violet" onClick={onNext}>
              Next: {nextInSetlist}
            </Button>
            <Button variant="outline" onClick={onAgain}>
              Sing again
            </Button>
          </>
        ) : (
          <Button variant="violet" onClick={onAgain}>
            Sing again
          </Button>
        )}
        <Button variant="outline" onClick={onLibrary}>
          Back to library
        </Button>
        <LinkButton href="/analyze" variant="ghost">
          See your tone
        </LinkButton>
      </div>
    </div>
  );
}
