"use client";

import { useMemo } from "react";
import { ALL_EXERCISES, EXERCISES } from "./exercises";
import { useIsPro } from "@/lib/pro";
import { Button, Card, LinkButton, Pill, ProgressBar, SectionLabel, Stat } from "@/components/ui";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { midiToLabel } from "@/lib/audio/notes";
import { ladderBreak, tallyFromScores, weakNotes } from "@/lib/analytics";
import {
  gradeForScore,
  starGlyphs,
  starRatingLabel,
  type Tone,
} from "@/components/songs/grade";
import { ShareableResult } from "@/components/songs/result-card";
import { TOLERANCE_CENTS } from "./scoring";
import { MODE_LABELS } from "./prefs";
import { sungReps, type SessionSummaryData } from "./lib";

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

export function SessionSummary({
  data,
  onNext,
  onLibrary,
}: {
  data: SessionSummaryData;
  onNext: (id: string) => void;
  onLibrary: () => void;
}) {
  const { ex, results, avgScore, best, xpGained, newAchievements, mode } = data;

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
      weakest: weakNotes(tallies, { limit: 1 })[0] ?? null,
      broke: ladderBreak(results),
      roots: sung.map((r) => r.root),
    };
  }, [results]);

  // No grade for a session where every rep was skipped: there is nothing to
  // grade, and a D would read as a judgment of singing that never happened.
  const grade = diagnosis ? gradeForScore(avgScore) : null;

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
              {starGlyphs(grade.stars)}
            </span>
            <span className="sr-only">{starRatingLabel(grade.stars)}</span>
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
            {mode === "sing-along"
              ? "The guide was sounding while you sang, so this score measures how well you held to a note you could hear."
              : "The guide had stopped before you sang, so this score measures how well you held to a note you were carrying yourself."}
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
              // ladderBreak only finds a *relative* fall, so a session that
              // was under the target on every rep returns null. Saying the
              // ladder held there would contradict the score right above it.
              <>
                No single root came apart — the whole ladder sat under the
                target instead, so this one is worth repeating slower rather
                than chasing one note.
              </>
            )}
            {diagnosis.weakest && (
              <>
                {" "}
                <span className="font-mono">{midiToLabel(diagnosis.weakest.midi)}</span>{" "}
                was the shakiest note in the session: in tune{" "}
                {diagnosis.weakest.accuracy}% of its scored time
                {diagnosis.weakest.cents !== null
                  ? `, off by about ${diagnosis.weakest.cents} cents`
                  : ""}
                .
              </>
            )}
          </p>
          <div className="mt-5">
            <Button variant="outline" size="sm" onClick={() => onNext(ex.id)}>
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
          stats={[
            { label: "Reps sung", value: String(diagnosis.sung.length) },
            ...(best ? [{ label: "Best rep", value: `${best.score}%`, tone: "cool" as const }] : []),
          ]}
        />
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

      <div>
        <ProCrescendoNudge
          line="Pro plans tomorrow's warmup from this score"
          title="Make tomorrow's warmup count"
          body="Pro plans tomorrow's session from this score — weak notes first."
          context="Warmups"
        />
      </div>

      <Card>
        <SectionLabel>Keep going</SectionLabel>
        <h3 className="mt-3 text-lg">
          Next up: <span className="text-violet-ink">{nextEx.title}</span>
        </h3>
        <p className="mt-1.5 max-w-md text-sm text-mut">{nextEx.desc}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="violet" onClick={() => onNext(nextEx.id)}>
            Next exercise
          </Button>
          <Button variant="outline" onClick={onLibrary}>
            Back to library
          </Button>
          <LinkButton href="/analyze" variant="ghost">
            See your tone
          </LinkButton>
        </div>
      </Card>
    </div>
  );
}
