"use client";

import { useId, useMemo } from "react";
import Link from "next/link";
import { ALL_EXERCISES, EXERCISES } from "./exercises";
import { useIsPro } from "@/lib/pro";
import { useProgress } from "@/lib/progress";
import type { DailyPick, DailyThree } from "@/lib/daily-three";
import { liveStreak } from "@/components/account/save-state";
import { Button, Card, LinkButton, Pill, ProgressBar, SectionLabel, Stat } from "@/components/ui";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { midiToLabel } from "@/lib/audio/notes";
import {
  ladderBreak,
  tallyFromScores,
  weakNotes,
  type LadderBreak,
  type LadderRep,
} from "@/lib/analytics";
import {
  gradeForScore,
  starGlyphs,
  starRatingLabel,
  type Tone,
} from "@/components/songs/grade";
import { STAR_THRESHOLDS, starsForScore } from "@/lib/stars";
import { ShareableResult } from "@/components/songs/result-card";
import { SITE_URL } from "@/lib/site";
import { TOLERANCE_CENTS } from "./scoring";
import { MODE_LABELS, useWarmupPrefs } from "./prefs";
import { sungReps, type GuideHeard, type SessionSummaryData } from "./lib";

/**
 * The practice rooms' three-star scale (lib/stars.ts), the one the warmups
 * library, the routine results and /progress all count. The songbook's
 * five-star grade is a different instrument, and showing it here gave one
 * exercise two star counts: on the row under the grade and on the share card.
 */
const PRACTICE_STAR_MAX = STAR_THRESHOLDS.length;

/**
 * ladderBreak measured along the direction the drill travels. ladderBreak
 * treats a root at or below the last as the foot of a new climb, so on a
 * "down" drill every descending rep reset it and a low end that collapsed was
 * reported as a ladder that held. Mirroring the roots makes the descent the
 * climb; the break's root is mirrored back for the message.
 */
export function ladderBreakAlongWalk(
  reps: readonly LadderRep[],
  descending: boolean,
): LadderBreak | null {
  if (!descending) return ladderBreak(reps);
  const b = ladderBreak(reps.map((r) => ({ ...r, root: -r.root })));
  return b && { ...b, root: -b.root };
}

/** Under this a rep didn't hold — the violet floor the whole page reads from. */
const HELD_FLOOR = 50;

/**
 * How many rep rows the per-rep list draws. The walk is endless — it climbs
 * to the top of the range, comes back down and goes again until the singer
 * ends it — so a twenty-minute session arrives here with a hundred reps and
 * an unbounded list would bury the rest of the summary. The rows shown are
 * the most recent ones, the reps still fresh in the singer's ear; everything
 * else on the page still counts the whole session.
 */
const MAX_LISTED_REPS = 12;

function scoreTone(score: number): "ok" | "violet" | "rec" {
  if (score >= 80) return "ok";
  if (score >= HELD_FLOOR) return "violet";
  return "rec";
}

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-ok-ink",
  violet: "text-violet-ink",
  rec: "text-rec",
};

/** Why a start is unavailable, in the room's own words. */
const CAPPED_REASON =
  "Free practice is used for today. It resets at midnight; the free studio is still open.";

/**
 * What the score measured, by what the singer heard. In sing-along the guide
 * plays the pattern once before the first rep at full level, then sounds
 * under the voice at the guide level, so at Off nothing sounds while they
 * sing. In call-and-response the level governs the reference itself
 * (exercise-player.tsx), so at Off no pitch plays at all.
 *
 * `heard` is what the player traced during the scored reps (GuideHeard), not
 * the slider as it stands when the summary shows: a session sung with the
 * guide off and turned up before End used to read "the guide was sounding".
 */
export function scoreMeasuredLine(mode: SessionSummaryData["mode"], heard: GuideHeard): string {
  if (mode === "sing-along") {
    if (heard === "partly") {
      return "The guide was sounding for part of the time you sang and off for the rest, so this score mixes notes you could hear with notes you were carrying yourself.";
    }
    return heard === "on"
      ? "The guide was sounding while you sang, so this score measures how well you held to a note you could hear."
      : "The guide was off while you sang (it played the pattern once at the start), so this score measures how well you held to notes you were carrying yourself.";
  }
  if (heard === "partly") {
    return "The reference was on for part of the session and off for the rest, so this score mixes notes you heard first with notes you found on your own.";
  }
  return heard === "on"
    ? "The guide had stopped before you sang, so this score measures how well you held to a note you were carrying yourself."
    : "The reference was off, so no note played before you sang, and this score measures how well you found and held each note on your own.";
}

export function SessionSummary({
  data,
  onNext,
  onLibrary,
  daily = null,
  capped = false,
  onDaily,
}: {
  data: SessionSummaryData;
  onNext: (id: string) => void;
  onLibrary: () => void;
  /**
   * Today's three and which of them are sung. When the exercise just sung is
   * one of them, "keep going" continues the plan, not the catalogue: the
   * next exercise in catalogue order would walk the singer out of the set
   * they came to finish.
   */
  daily?: { plan: DailyThree; done: boolean[] } | null;
  /** Today's free minutes are used: every start here would do nothing. */
  capped?: boolean;
  /** Start one of today's three at the tempo the plan set for it. */
  onDaily?: (p: DailyPick) => void;
}) {
  const { ex, results, avgScore, best, xpGained, newAchievements, mode } = data;
  // With the guide at Off, sing-along plays the pattern once at the start and
  // then nothing under the voice (exercise-player.tsx), so the score is of
  // notes the singer carried, not notes they could hear. What the player
  // heard during the scored reps decides it; the slider as it stands now is
  // only the fallback for a summary built without that.
  const { guidePct } = useWarmupPrefs();
  const heard: GuideHeard = data.guide ?? (guidePct > 0 ? "on" : "off");
  const cappedId = useId();
  // Read just after the session logged, so it is today's streak — but read
  // live anyway, so a summary never names a streak that has lapsed.
  const streak = liveStreak(useProgress().streak);
  const inPlan = Boolean(daily?.plan.picks.some((p) => p.exercise.id === ex.id));
  const nextDaily =
    inPlan && daily ? daily.plan.picks.find((_, i) => !daily.done[i]) : undefined;
  const dailySung = daily ? daily.done.filter(Boolean).length : 0;
  const dailyTotal = daily ? daily.plan.picks.length : 0;

  const isPro = useIsPro();
  const nextEx = useMemo(() => {
    // Rotate through what this user can actually play.
    const pool = isPro ? ALL_EXERCISES : EXERCISES;
    const idx = pool.findIndex((e) => e.id === ex.id);
    if (idx < 0) return pool[0];
    return pool[(idx + 1) % pool.length];
  }, [ex.id, isPro]);

  // The diagnosis is rebuilt from the reps rather than carried on the summary:
  // every rep already ships the per-note scores the Pro tally is folded from,
  // so nothing new has to be threaded through the player to say which note
  // came apart.
  const diagnosis = useMemo(() => {
    const sung = sungReps(results);
    if (sung.length === 0) return null;
    const tallies = tallyFromScores(sung.flatMap((r) => r.notes ?? []));
    return {
      sung,
      // Null when no single note got enough scored time to judge — a short
      // or heavily skipped session says nothing about any one note.
      // A note held for all of its scored time is not shaky, even if it
      // was the least steady of a clean session.
      weakest: weakNotes(tallies, { limit: 1 }).find((n) => n.accuracy < 100) ?? null,
      broke: ladderBreakAlongWalk(results, ex.ladder === "down"),
      roots: sung.map((r) => r.root),
    };
  }, [results, ex.ladder]);

  // No grade for a session where every rep was skipped: there is nothing to
  // grade, and a D would read as a judgment of singing that never happened.
  const grade = diagnosis ? gradeForScore(avgScore) : null;
  const stars = starsForScore(avgScore);

  // Only the rendered list is bounded. `hidden` doubles as the offset of the
  // first row, so the rep numbers stay the real ones — row 84 of 95, not a
  // second list starting at 1.
  // The average and the grade cover the sung reps only, so the tile counts
  // them the same way — "Reps 5" beside an average of three would read as if
  // the two skipped rungs had been scored.
  const sungCount = sungReps(results).length;
  const skippedCount = results.length - sungCount;

  const { hidden, rows } = useMemo(() => {
    const hidden = Math.max(0, results.length - MAX_LISTED_REPS);
    return { hidden, rows: results.slice(hidden) };
  }, [results]);

  return (
    <div className="space-y-6">
      <Card>
        <SectionLabel>Session complete</SectionLabel>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl">{ex.title}</h2>
          {/* The two modes are different skills scored as different things, so
              every summary says which one this number came from. */}
          <Pill tone="mut">{MODE_LABELS[mode]}</Pill>
        </div>
        <div className="mt-6 flex flex-wrap gap-10">
          <Stat label="Average score" value={`${avgScore}%`} tone={scoreTone(avgScore)} />
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
          <Stat
            label="Best rep"
            value={best ? `${best.score}%` : "—"}
            sub={best ? midiToLabel(best.root) : undefined}
            tone="cool"
          />
          <Stat
            label="Reps sung"
            value={sungCount}
            sub={skippedCount > 0 ? `${skippedCount} skipped` : undefined}
            tone="ink"
          />
        </div>
        {grade && (
          <div className="mt-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="tabular font-mono text-base tracking-wider text-violet-ink"
            >
              {starGlyphs(stars, PRACTICE_STAR_MAX)}
            </span>
            <span className="sr-only">{starRatingLabel(stars, PRACTICE_STAR_MAX)}</span>
          </div>
        )}

        <div className="mt-6 space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Per-rep score
            </div>
            {hidden > 0 && (
              <div className="tabular font-mono text-[11px] text-dim">
                Last {rows.length} of {results.length} reps · {hidden} earlier
                not shown
              </div>
            )}
          </div>
          {rows.map((r, i) => (
            <div key={hidden + i} className="flex items-center gap-3">
              <span className="tabular w-8 shrink-0 font-mono text-xs text-dim">
                {hidden + i + 1}
              </span>
              <span className="tabular w-12 shrink-0 font-mono text-xs text-mut">
                {midiToLabel(r.root)}
              </span>
              <ProgressBar value={r.score} tone={scoreTone(r.score)} className="flex-1" />
              <span className="tabular w-12 shrink-0 text-right font-mono text-xs">
                {r.skipped ? "skip" : `${r.score}%`}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {diagnosis && (
        <Card>
          <SectionLabel>What that means</SectionLabel>
          <p className="mt-3 max-w-xl text-sm text-mut">
            Your score is the share of each phrase you held within{" "}
            {TOLERANCE_CENTS} cents of the target — how close to the note you
            stayed, not how good it sounded.{" "}
            {scoreMeasuredLine(mode, heard)}
          </p>
          <p className="mt-2 max-w-xl text-sm text-ink">
            {diagnosis.broke ? (
              <>
                The ladder held at {diagnosis.broke.heldAt}% until{" "}
                <span className="font-mono">{midiToLabel(diagnosis.broke.root)}</span>
                , then dropped {diagnosis.broke.drop} points.
              </>
            ) : avgScore >= HELD_FLOOR ? (
              <>
                Your reps held together across the whole ladder — no root fell
                apart on you.
              </>
            ) : (
              // ladderBreak only finds a *relative* fall, so a session whose
              // average is under HELD_FLOOR with no relative fall returns null.
              // Saying the ladder held there would contradict the score right
              // above it. The score has no direction (it keeps absolute
              // cents), so this names the average, never "under the note".
              <>
                No single root came apart — your average across the whole
                ladder stayed under {HELD_FLOOR}% instead, so this one is worth
                repeating slower rather than chasing one note.
              </>
            )}
            {diagnosis.weakest && (
              <>
                {" "}
                <span className="font-mono">{midiToLabel(diagnosis.weakest.midi)}</span>{" "}
                was the shakiest note in the session: within{" "}
                {TOLERANCE_CENTS} cents of the target for{" "}
                {diagnosis.weakest.accuracy}% of its scored time
                {diagnosis.weakest.cents !== null
                  ? `, about ${diagnosis.weakest.cents} cents off on average`
                  : ""}
                .
              </>
            )}
          </p>
          <div className="mt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNext(ex.id)}
              disabled={capped}
              aria-describedby={capped ? cappedId : undefined}
            >
              Run this ladder again
            </Button>
          </div>
        </Card>
      )}

      {grade && diagnosis && (
        <ShareableResult
          title={ex.title}
          subtitle={`Warmup ladder · ${midiToLabel(Math.min(...diagnosis.roots))}–${midiToLabel(
            Math.max(...diagnosis.roots),
          )}`}
          score={avgScore}
          grade={grade}
          starScale={{ stars, max: PRACTICE_STAR_MAX }}
          stats={[
            { label: "Reps sung", value: String(diagnosis.sung.length) },
            ...(best ? [{ label: "Best rep", value: `${best.score}%`, tone: "cool" as const }] : []),
          ]}
          // A friend lands on the same exercise. A Pro pack id is ignored for
          // a free visitor (the room's deep link checks canStart), so the
          // link still lands on the warmups room.
          url={`${SITE_URL}/warmups?exercise=${ex.id}`}
        />
      )}

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
        {/* What this score does for tomorrow, on every plan. Today's three
            is planned from the free catalogue, so a pack exercise's score is
            not read; and the line is left out when the today's-three card
            below already says it. */}
        {EXERCISES.some((e) => e.id === ex.id) && !(inPlan && !nextDaily) && (
          <p className="mt-1 text-sm text-mut">
            Tomorrow&apos;s three reads your recent scores, this one included.
          </p>
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

      <div>
        <ProCrescendoNudge
          line="Pro shows the full daily coach plan, not just its first two steps"
          title="See the whole plan"
          body="Tomorrow's three and Today's warmup already read your recent scores on the free plan, this one included. Pro adds the full daily coach plan, a per-note accuracy chart and no daily limit."
          context="Warmups"
        />
      </div>

      <Card>
        {nextDaily ? (
          <>
            <SectionLabel>
              Today&apos;s three · {dailySung} of {dailyTotal} done
            </SectionLabel>
            <h3 className="mt-3 text-lg">
              Next: <span className="text-violet-ink">{nextDaily.exercise.title}</span>
            </h3>
            <p className="mt-1.5 max-w-md text-sm text-mut">{nextDaily.why}</p>
          </>
        ) : inPlan ? (
          <>
            <SectionLabel>
              Today&apos;s three · {dailySung} of {dailyTotal} done
            </SectionLabel>
            <h3 className="mt-3 text-lg">Today&apos;s three: done</h3>
            <p className="mt-1.5 max-w-md text-sm text-mut">
              A new three is picked from your scores tomorrow.
            </p>
          </>
        ) : (
          <>
            <SectionLabel>Keep going</SectionLabel>
            <h3 className="mt-3 text-lg">
              Next up: <span className="text-violet-ink">{nextEx.title}</span>
            </h3>
            <p className="mt-1.5 max-w-md text-sm text-mut">{nextEx.desc}</p>
          </>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          {nextDaily ? (
            <Button
              variant="violet"
              onClick={() => onDaily?.(nextDaily)}
              disabled={capped}
              aria-describedby={capped ? cappedId : undefined}
            >
              {capped ? "Available tomorrow" : "Sing it"}
            </Button>
          ) : inPlan ? null : (
            <Button
              variant="violet"
              onClick={() => onNext(nextEx.id)}
              disabled={capped}
              aria-describedby={capped ? cappedId : undefined}
            >
              {capped ? "Available tomorrow" : "Next exercise"}
            </Button>
          )}
          <Button variant={inPlan && !nextDaily ? "violet" : "outline"} onClick={onLibrary}>
            Back to library
          </Button>
          <LinkButton href="/analyze" variant="ghost">
            See your tone
          </LinkButton>
        </div>
        {capped && (
          <p id={cappedId} className="mt-3 max-w-md text-sm text-mut">
            {CAPPED_REASON}{" "}
            {/* The same way out as every other room's cap note: the offer
                names the limit the singer just reached. */}
            <Link
              href="/pro#buy"
              className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
            >
              Pro has no daily limit
            </Link>
            .
          </p>
        )}
      </Card>
    </div>
  );
}
