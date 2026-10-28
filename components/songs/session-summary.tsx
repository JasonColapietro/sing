"use client";

import { LinkButton } from "@/components/ui";

import { Button, Card, Pill, ProgressBar, SectionLabel, Stat } from "@/components/ui";
import { midiToLabel } from "@/lib/audio/notes";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { useProResultOnLeave } from "@/lib/use-pro-result-on-leave";
import { MicAlert } from "@/components/mic-alert";
import { AudioSetup } from "@/components/audio/audio-setup";
import { IconMic } from "./icons";
import { useProgress, type SessionLog } from "@/lib/progress";
import { computeGrade, starGlyphs, starRatingLabel, type Tone } from "./grade";
import { ResultCard } from "./result-card";
import { TakeReview } from "./take-review";
import type { TakeState } from "./take";
import { liveStreak } from "@/components/account/save-state";
import {
  JUDGMENTS,
  PASS_LABEL,
  formatTempoPct,
  isSessionOfSong,
  type Judgment,
  type SessionSummaryData,
} from "./lib";
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

/**
 * Every logged "song" session for this title that carries a score, newest
 * first, including sessions logged under a title the song had before a rename.
 */
function songScoreLogs(sessions: SessionLog[], title: string): ScoredSongLog[] {
  return sessions.filter(
    (s): s is ScoredSongLog => isSessionOfSong(s, title) && s.score !== undefined,
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
  take,
  onEnableMic,
  micError,
  listening,
  level,
  onMicOff,
}: {
  data: SessionSummaryData;
  /** The recorded take; undefined when the singer didn't record this run. */
  take?: TakeState;
  onAgain: () => void;
  onLibrary: () => void;
  /** Title of the next queued song, when a setlist is mid-run. */
  nextInSetlist?: string;
  onNext?: () => void;
  /**
   * Turns the microphone on and sings the song again, scored. Passed only
   * while the mic is off, so an unscored run never ends on advice to enable a
   * microphone with no control to do it.
   */
  onEnableMic?: () => void;
  /** Why the microphone failed to start, shown under that control. */
  micError?: string | null;
  /**
   * Whether the microphone is on, and its live input level: for the audio
   * setup a silent run's summary carries, so "is it hearing me" is not a
   * guess.
   */
  listening?: boolean;
  level?: number;
  /**
   * Turns the microphone off. The room holds it open on a silent run's
   * summary for the level meter, as the warmups' "No sound picked up" note
   * does, so that summary carries the control.
   */
  onMicOff?: () => void;
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
    pass,
    mastered,
    points,
    topMultiplier,
  } = data;
  const progress = useProgress();
  // A silent run (the mic heard no note) was not logged and is not graded:
  // every scored block below gives way to what to check instead.
  const silent = !listenMode && data.silent === true;
  // A completed result (the session is logged before this renders): the
  // one-time Pro moment listens for this and decides for itself whether to
  // open. Sent when the singer leaves this summary, so the modal never
  // covers a grade they have not read. A listen-only run is not a result,
  // and neither is a run the mic heard nothing of.
  useProResultOnLeave(!listenMode && !silent);
  // Read just after the session logged, so it is today's streak — but read
  // live anyway, so a summary never names a streak that has lapsed.
  const streak = liveStreak(progress.streak);

  // No mic, nothing judged, nothing to grade — computeGrade already encodes
  // this (it returns null whenever score is undefined), so listen mode falls
  // out of every grade/star/breakdown block below for free.
  const grade = computeGrade(score, data.maxCombo, data.judgments);
  const scored = !listenMode && !silent && score !== undefined;
  const wholeLoops = perLoopScores.length - (data.partialLastLoop ? 1 : 0);
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
        {/* Which pass produced this run: a score only means what it means in
            the context of the pass that was sung. */}
        <p className="mt-1 text-sm text-mut">{PASS_LABEL[pass]} pass</p>
        {mastered && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Pill tone="ok">Mastered</Pill>
            <span className="text-sm text-ok-ink">
              You&rsquo;ve mastered {song.title}.
            </span>
          </div>
        )}

        {silent ? (
          <>
            <h3 className="mt-4 text-xl">No sound picked up</h3>
            <p className="mt-2 max-w-md text-sm text-mut">
              Nothing was scored or logged. If you were singing, the mic didn&apos;t pick up a
              clear note. Sing a little louder or closer to the mic, or check the input below,
              then press Sing again.
            </p>
            <AudioSetup className="mt-4 max-w-md" listening={listening} level={level} />
            {listening && onMicOff && (
              <Button variant="ghost" size="sm" className="mt-3" onClick={onMicOff}>
                Turn off the mic
              </Button>
            )}
          </>
        ) : !scored ? (
          <>
            {/* A Sing along or On your own run in listen mode had the
                microphone off, so it is not called a listen pass. */}
            <p className="mt-4 max-w-md text-sm text-mut">
              {!listenMode || pass === "listen" ? (
                <>
                  This was a listen pass, so there&rsquo;s no pitch score this time.
                  Choose Sing along or On your own with your microphone enabled to get scored.
                </>
              ) : (
                <>
                  Your microphone was off, so there&rsquo;s no pitch score this time.
                  Turn it on and sing again to be scored.
                </>
              )}
            </p>
            {onEnableMic && (
              <>
                <Button variant="rec" className="mt-3" onClick={onEnableMic}>
                  <IconMic /> Enable microphone and sing again
                </Button>
                {micError && (
                  <MicAlert message={micError} className="mt-2 max-w-md text-sm text-rec" />
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-10">
              <Stat label="Score" value={`${score}/100`} tone={scoreTone(score)} />
              {/* Whole passes: a rehearsal stopped part-way lists its last
                  pass below, scored on the part sung, but did not sing it. */}
              <Stat label="Loops sung" value={wholeLoops} tone="cool" />
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
                <ProgressBar value={s} label={`Loop ${i + 1} score`} tone={scoreTone(s)} className="flex-1" />
                <span className="tabular w-12 shrink-0 text-right font-mono text-xs">{s}%</span>
              </div>
            ))}
            {data.partialLastLoop && (
              <p className="text-xs text-dim">
                You stopped part-way through loop {perLoopScores.length}, so it is scored on the
                part you sang.
              </p>
            )}
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
                <ProgressBar
                  value={s.score}
                  label={`${s.label} score`}
                  tone={scoreTone(s.score)}
                  className="flex-1"
                />
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
                  <ProgressBar
                    value={pct}
                    label={`Share of notes judged ${j}`}
                    tone={JUDGMENT_TONE[j]}
                    className="flex-1"
                  />
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
      {take !== undefined && <TakeReview take={take} />}

      {scored && (
        <Card>
          <SectionLabel>Personal best</SectionLabel>
          {previousBest === undefined ? (
            <p className="mt-3 text-sm text-mut">
              First time singing this one, so there&rsquo;s nothing to compare against yet.
            </p>
          ) : isNewBest ? (
            <p className="mt-3 text-sm text-ok-ink">
              New personal best, up from {previousBest}.
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

      {!listenMode && !silent && (
        <div>
          <ProCrescendoNudge
            line="Pro adds this song's notes to your per-note accuracy report"
            title="Keep building this score"
            body="Every song is free to sing, and your personal best and score trend stay free. Pro adds the notes from each scored run to your per-note accuracy report and removes the daily limit."
            context="Song practice"
          />
        </div>
      )}

      {/* Only what was saved: a silent run logged nothing. */}
      {!silent && (
        <Card className="border-ok/30">
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="ok">Saved to your progress</Pill>
            <span className="tabular font-mono text-sm text-ok-ink">+{xpGained} XP</span>
            {streak > 0 && (
              <span className="tabular font-mono text-sm text-rec">
                <span aria-hidden="true">🔥</span> {streak}-day streak
              </span>
            )}
          </div>
          {streak > 0 && (
            <p className="mt-2 text-sm text-mut">Sing tomorrow to make it {streak + 1}.</p>
          )}
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
      )}

      <div className="flex flex-wrap gap-3">
        {/*
          Mid-setlist, moving on is the primary action and gets the violet
          button. The score still gets read first either way: chaining
          straight into the next song would throw away the grade the singer
          just earned.
        */}
        {/* After a silent run the next song would go the same way, so Sing
            again (what the note above asks for) stays first. */}
        {nextInSetlist && onNext && silent ? (
          <>
            <Button variant="violet" onClick={onAgain}>
              Sing again
            </Button>
            <Button variant="outline" onClick={onNext}>
              Next: {nextInSetlist}
            </Button>
          </>
        ) : nextInSetlist && onNext ? (
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
