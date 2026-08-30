"use client";

import Link from "next/link";
import type { ProgressState } from "@/lib/progress";
import { useIsPro } from "@/lib/pro";
import { Card } from "@/components/ui";
import { ProInlineNudge } from "@/components/pro/gate";
import { LockGlyph } from "@/components/pro/ui";
import { midiToLabel } from "@/lib/audio/notes";
import { aggregateNotes, overallAccuracy, weakNotes } from "@/lib/analytics";
import { EXERCISES } from "@/components/warmups/exercises";
import { TYPE_META, addDays, localDayStr } from "./format";

interface PlanItem {
  title: string;
  href: string;
  minutes: number;
  reason: string;
  /**
   * Warmup exercise to open on arrival, as `/warmups?exercise=<id>`. Free-tier
   * ids only: the warmups page drops pack ids for a singer without Pro, and
   * this is the item a free singer actually sees.
   */
  id?: string;
}

/**
 * Measured span, in semitones, before the octave siren is worth recommending.
 * computeRootLadder runs that exercise's ladder from `lowMidi + 4` up to
 * `highMidi - 5 - 12` — the octave it glides, plus five semitones of headroom
 * under the measured ceiling — so 21 (4 + 12 + 5) is exactly the span at which
 * that top finally reaches the start. At 21 the band is a single root whose
 * glide lands on `highMidi - 5`, headroom intact; wider spans widen the band a
 * semitone at a time. Below 21 the `Math.max(start, …)` floor fabricates that
 * lone root anyway, and its glide to `lowMidi + 16` eats into the headroom the
 * ladder reserves — clearing the measured ceiling outright under 16 semitones.
 * (The MIDI-30 start floor only bites below lowMidi 26, so this holds for any
 * real voice.)
 */
const OCTAVE_SIREN_MIN_SEMIS = 21;

function buildPlan(state: ProgressState, now: Date): {
  banner: string | null;
  items: PlanItem[];
} {
  const todayKey = localDayStr(now);
  const yesterdayKey = localDayStr(addDays(now, -1));
  const cutoff = localDayStr(addDays(now, -13));

  const practicedToday = state.sessions.some((s) => s.day === todayKey);
  const banner =
    !practicedToday &&
    now.getHours() >= 12 &&
    state.streak.current > 0 &&
    state.streak.lastDay === yesterdayKey
      ? `Keep your ${state.streak.current}-day streak alive — one short session today keeps the tape rolling.`
      : null;

  /* ---- signals, all from the singer's own numbers ---- */

  const recent = state.sessions.filter((s) => s.day >= cutoff);
  const tallies = aggregateNotes(state.sessions, { sinceDay: cutoff });
  const weak = weakNotes(tallies, { limit: 2 });
  const accuracy = overallAccuracy(tallies);

  // Weakest scored area over the last 14 days, with a 2-session minimum so a
  // single bad round doesn't get to define an "average".
  const buckets = new Map<"ear" | "song" | "warmup", { sum: number; n: number }>();
  for (const s of recent) {
    if (s.score === undefined) continue;
    if (s.type !== "ear" && s.type !== "song" && s.type !== "warmup") continue;
    const b = buckets.get(s.type) ?? { sum: 0, n: 0 };
    b.sum += s.score;
    b.n += 1;
    buckets.set(s.type, b);
  }
  let weakestArea: { type: "ear" | "song" | "warmup"; avg: number } | null = null;
  for (const [type, b] of buckets) {
    if (b.n < 2) continue;
    const avg = b.sum / b.n;
    if (!weakestArea || avg < weakestArea.avg) weakestArea = { type, avg };
  }

  // A recovery day: yesterday was unusually heavy relative to the recent norm.
  const daySec = new Map<string, number>();
  for (const s of recent) {
    daySec.set(s.day, (daySec.get(s.day) ?? 0) + s.durationSec);
  }
  const yesterdaySec = daySec.get(yesterdayKey) ?? 0;
  const activeDays = [...daySec.entries()].filter(([day]) => day !== todayKey);
  const meanDaySec =
    activeDays.length > 0
      ? activeDays.reduce((a, [, sec]) => a + sec, 0) / activeDays.length
      : 0;
  const heavyYesterday =
    yesterdaySec >= 25 * 60 && yesterdaySec > meanDaySec * 1.6;

  // Range staleness: growth charts need fresh measurements.
  const testedAt = state.range.testedAt ? Date.parse(state.range.testedAt) : NaN;
  const rangeAgeDays = Number.isNaN(testedAt)
    ? null
    : Math.floor((now.getTime() - testedAt) / 86_400_000);
  const hasRange = state.range.lowMidi !== undefined;

  /* ---- assemble, most important first ---- */

  const items: PlanItem[] = [];

  // Whether a range prompt already claimed the lead. A missing or stale
  // measurement is the more foundational gap — every other exercise ladders
  // off it — so nothing below is allowed to promote past it.
  let rangeFirst = false;

  if (!hasRange) {
    rangeFirst = true;
    items.push({
      title: "Vocal range test",
      href: "/range",
      minutes: 3,
      reason:
        "You haven't measured your range yet — it anchors every other exercise to your voice.",
    });
  } else if (rangeAgeDays !== null && rangeAgeDays >= 21) {
    rangeFirst = true;
    items.push({
      title: "Retake the range test",
      href: "/range",
      minutes: 3,
      reason: `Your range was last measured ${rangeAgeDays} days ago — a fresh test keeps the growth chart honest.`,
    });
  }

  items.push({
    title: "Breathing",
    href: "/breath",
    minutes: heavyYesterday ? 4 : 2,
    reason: heavyYesterday
      ? `Yesterday was a heavy one (${Math.round(yesterdaySec / 60)} min) — start slow and give the voice time to settle.`
      : "Every session starts here — low, steady breaths set up the rest.",
  });

  // The core of the plan: measured weak notes drive the warmup choice.
  if (weak.length > 0) {
    const worst = weak[0];
    const names = weak.map((n) => midiToLabel(n.midi)).join(" and ");
    // A weak note at the top of the range wants the full-octave glide that
    // carries the voice through the break; anything lower wants the smaller,
    // slower siren that sits on the weak spot. The octave is only offered to a
    // singer whose measured span can hold it — below OCTAVE_SIREN_MIN_SEMIS the
    // ladder collapses to one root whose glide pushes into the headroom kept
    // under their ceiling, so those singers get the fifth instead.
    const wantsOctave =
      state.range.lowMidi !== undefined && state.range.highMidi !== undefined
        ? worst.midi >= state.range.highMidi - 5 &&
          state.range.highMidi - state.range.lowMidi >= OCTAVE_SIREN_MIN_SEMIS
        : worst.midi >= 67;
    // Titled from the catalog so the link and the label can never name
    // different exercises.
    const target = EXERCISES.find(
      (e) => e.id === (wantsOctave ? "octave-siren" : "ng-siren-fifth"),
    );
    const item: PlanItem = {
      title: target?.title ?? "Slow sirens through your weak spot",
      href: "/warmups",
      id: target?.id,
      minutes: 6,
      reason: `${names} ${weak.length > 1 ? "are" : "is"} your weakest ${
        weak.length > 1 ? "notes" : "note"
      } right now — ${midiToLabel(worst.midi)} lands in tune just ${worst.accuracy}% of the time${
        worst.cents !== null ? `, off by ~${Math.round(worst.cents)} cents` : ""
      }. Ladder through it slowly.`,
    };
    // A free singer only ever sees item 0 (CoachCard locks the rest), so the
    // one item built from their own scored notes has to be it — otherwise the
    // whole plan reads as the same generic breathing line for everyone. A
    // range prompt still outranks it.
    if (rangeFirst) items.push(item);
    else items.unshift(item);
  } else {
    items.push({
      title: "Warmups",
      href: "/warmups",
      minutes: 5,
      reason:
        accuracy === null
          ? "Sing one scored warmup with the mic on and tomorrow's plan starts reading your actual notes."
          : "No stand-out weak note in the last two weeks — a general ladder keeps the whole range honest.",
    });
  }

  if (weakestArea) {
    const avg = Math.round(weakestArea.avg);
    if (weakestArea.type === "ear") {
      items.push({
        title: "Ear training",
        href: TYPE_META.ear.href,
        minutes: 5,
        reason: `Your ear scores averaged ${avg} over the last two weeks — the lowest of your scored areas.`,
      });
    } else if (weakestArea.type === "song") {
      items.push({
        title: "Song practice",
        href: TYPE_META.song.href,
        minutes: 5,
        reason: `Your song scores averaged ${avg} recently — a focused pass will lift them.`,
      });
    } else {
      items.push({
        title: "Pitch practice",
        href: "/studio",
        minutes: 5,
        reason: `Your warmup scores averaged ${avg} — slow pitch work in the studio tightens accuracy.`,
      });
    }
  } else {
    items.push({
      title: "Ear training",
      href: TYPE_META.ear.href,
      minutes: 5,
      reason: "Not enough recent scores to compare areas — a scored round sets your baseline.",
    });
  }

  if (hasRange) {
    items.push({
      title: "Sing a song",
      href: "/songs",
      minutes: 3,
      reason:
        accuracy !== null
          ? `Finish on real music — you're in tune ${accuracy}% of the scored time lately, and songs are where that shows.`
          : "Finish by putting the work into real music.",
    });
  }

  return { banner, items };
}

export function CoachCard({ state }: { state: ProgressState }) {
  const isPro = useIsPro();
  const { banner, items } = buildPlan(state, new Date());
  // One step is not a plan, it is a screenshot of one. A singer who can see two
  // steps has watched the coach make a decision — this after that, and why —
  // which is the thing Pro actually sells; a singer who sees one has been shown
  // a locked door. buildPlan always produces at least three items, so this
  // never empties the card.
  const shown = isPro ? items.length : Math.min(2, items.length);

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg">Today&apos;s session</h2>
        <span className="tabular font-mono text-xs text-dim">
          {items.slice(0, shown).reduce((a, i) => a + i.minutes, 0)} min planned
        </span>
      </div>
      {banner && (
        <p className="mt-3 rounded-xl border border-rec/40 bg-rec/10 px-3 py-2 text-sm text-rec">
          {banner}
        </p>
      )}
      <ol className="mt-4 space-y-3">
        {items.map((item, i) =>
          i < shown ? (
            <li key={item.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line2 font-mono text-[11px] text-mut"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    href={item.id ? `${item.href}?exercise=${item.id}` : item.href}
                    className="font-medium text-ink underline-offset-4 hover:text-violet-ink hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="tabular font-mono text-xs text-dim">
                    {item.minutes} min
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-mut">{item.reason}</p>
              </div>
            </li>
          ) : (
            <li key={item.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet/40 font-mono text-[11px] text-violet-ink"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-mut">{item.title}</span>
                  <span className="text-violet-ink">
                    <LockGlyph size={11} />
                  </span>
                </div>
              </div>
            </li>
          )
        )}
      </ol>
      <p className="mt-4 text-xs text-dim">
        Built from your scored notes, range tests, and recent practice — no AI,
        just the numbers.
      </p>
      <div className="mt-3">
        <ProInlineNudge>
          Pro unlocks the full daily plan
        </ProInlineNudge>
      </div>
    </Card>
  );
}
