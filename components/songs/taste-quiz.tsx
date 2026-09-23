"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button, Card, Pill, SectionLabel } from "@/components/ui";
import {
  TASTE_GOALS,
  TASTE_LEVELS,
  type TasteAnswers,
  type TasteGoal,
  type TasteLevel,
  type TastePick,
} from "@/lib/song-taste";
import type { SongGenre } from "./types";
import { BAND_LABEL, bandForSong } from "./lib";

/**
 * The songs room's onboarding: three short questions, then a "Picked for you"
 * row built from the answers.
 *
 * Inline in the library rather than a modal. The songs room already opens
 * behind a mic gate and can carry a Pro dialog; a third layer on a first
 * visit would be the thing people close without reading. Inline, the quiz is
 * skippable by simply scrolling past it, and the Skip button makes that
 * explicit so it does not come back.
 */

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const STEPS = 3;

/** Shared chrome for a selectable option: the native input stays the control. */
const optionClass = (selected: boolean) =>
  cn(
    "cursor-pointer rounded-xl border px-3 py-2 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-rec",
    selected ? "border-violet/60 bg-violet/10" : "border-line bg-panel hover:border-violet/40",
  );

export function TasteQuiz({
  genres,
  initial,
  onSave,
  onSkip,
  skipLabel,
}: {
  /** Only genres the singer's catalog holds; see `tasteGenreOptions`. */
  genres: readonly SongGenre[];
  initial?: TasteAnswers;
  onSave: (answers: Omit<TasteAnswers, "kind" | "at">) => void;
  onSkip: () => void;
  /** "Skip for now" on a first visit; "Cancel" when changing saved answers. */
  skipLabel: string;
}) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<SongGenre[]>(() => initial?.genres ?? []);
  const [level, setLevel] = useState<TasteLevel | null>(initial?.level ?? null);
  const [goal, setGoal] = useState<TasteGoal | null>(initial?.goal ?? null);
  const legendRef = useRef<HTMLLegendElement>(null);
  const moved = useRef(false);
  const name = useId();

  // Move focus to the new question after Next/Back, so a screen reader hears
  // it and a keyboard user is not left on a button that just changed meaning.
  // Skipped on mount: a first visit must not yank focus into the quiz.
  useEffect(() => {
    if (!moved.current) return;
    legendRef.current?.focus();
  }, [step]);

  function go(next: number) {
    moved.current = true;
    setStep(next);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Radios carry `required`, so the browser has already refused an empty
    // step with its own accessible message before this runs.
    if (step < STEPS - 1) return go(step + 1);
    if (level && goal) onSave({ genres: picked, level, goal });
  }

  const legendClass = "text-lg";

  return (
    <Card className="border-violet/30">
      <form onSubmit={submit} aria-label="Pick my first songs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>Pick my first songs</SectionLabel>
          <span className="tabular font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Step {step + 1} of {STEPS}
          </span>
        </div>

        {step === 0 && (
          <fieldset className="mt-4 min-w-0">
            <legend ref={legendRef} tabIndex={-1} className={legendClass}>
              Which styles do you enjoy?
            </legend>
            <p className="mt-1 text-sm text-mut">
              Pick any. Leave them all blank if you have no favourite.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {genres.map((g) => {
                const on = picked.includes(g);
                return (
                  <label key={g} className={optionClass(on)}>
                    <span className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        name={`${name}-genre`}
                        value={g}
                        checked={on}
                        onChange={() =>
                          setPicked((cur) => (on ? cur.filter((x) => x !== g) : [...cur, g]))
                        }
                        className="accent-[var(--color-violet)]"
                      />
                      {g}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="mt-4 min-w-0">
            <legend ref={legendRef} tabIndex={-1} className={legendClass}>
              How much have you sung before?
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {TASTE_LEVELS.map((o) => (
                <label key={o.value} className={optionClass(level === o.value)}>
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="radio"
                      name={`${name}-level`}
                      value={o.value}
                      checked={level === o.value}
                      onChange={() => setLevel(o.value)}
                      required
                      className="accent-[var(--color-violet)]"
                    />
                    {o.label}
                  </span>
                  <span className="mt-1 block text-xs text-mut">{o.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <fieldset className="mt-4 min-w-0">
            <legend ref={legendRef} tabIndex={-1} className={legendClass}>
              What would you like to practise?
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {TASTE_GOALS.map((o) => (
                <label key={o.value} className={optionClass(goal === o.value)}>
                  <span className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="radio"
                      name={`${name}-goal`}
                      value={o.value}
                      checked={goal === o.value}
                      onChange={() => setGoal(o.value)}
                      required
                      className="accent-[var(--color-violet)]"
                    />
                    {o.label}
                  </span>
                  <span className="mt-1 block text-xs text-mut">{o.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {step > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={() => go(step - 1)}>
              Back
            </Button>
          )}
          <Button type="submit" size="sm">
            {step < STEPS - 1 ? "Next" : "Show my picks"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onSkip} className="ml-auto">
            {skipLabel}
          </Button>
        </div>
        <p className="mt-3 text-xs text-dim">
          Saved on this device only. You can change it any time.
        </p>
      </form>
    </Card>
  );
}

function summarize(answers: TasteAnswers): string {
  const level = TASTE_LEVELS.find((l) => l.value === answers.level)?.label ?? "";
  const goal = TASTE_GOALS.find((g) => g.value === answers.goal)?.label ?? "";
  const genres = answers.genres.length > 0 ? answers.genres.join(", ") : "Any style";
  return [genres, level, goal].filter(Boolean).join(" · ");
}

export function PickedForYou({
  answers,
  picks,
  onStart,
  onChange,
}: {
  answers: TasteAnswers;
  picks: readonly TastePick[];
  onStart: (pick: TastePick) => void;
  onChange: () => void;
}) {
  const anyMatch = picks.some((p) => p.genreMatch);
  return (
    <section aria-labelledby="picked-for-you">
      <Card className="border-violet/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="picked-for-you">
            <SectionLabel>Picked for you</SectionLabel>
          </h2>
          <Button variant="ghost" size="sm" onClick={onChange}>
            Change preferences
          </Button>
        </div>
        <p className="mt-2 text-sm text-mut">{summarize(answers)}</p>
        {answers.genres.length > 0 && !anyMatch && (
          // Said out loud rather than papered over: band locks outrank taste,
          // so a Nursery fan's first picks may all be from other styles.
          <p className="mt-1 text-sm text-mut">
            Nothing in those styles is open yet. These are the easiest songs you
            can sing now; master two to open the next band.
          </p>
        )}
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          {picks.map((pick) => (
            <li
              key={pick.song.id}
              className="flex min-w-0 flex-col gap-2 rounded-xl border border-line bg-panel2/60 p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-ink">{pick.song.title}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Pill tone={pick.genreMatch ? "violet" : "mut"}>{pick.song.genre}</Pill>
                  <Pill>{BAND_LABEL[bandForSong(pick.song)]}</Pill>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <Button size="sm" onClick={() => onStart(pick)} aria-label={`Sing ${pick.song.title}`}>
                  Sing
                </Button>
                <Link
                  href={`/songs/${pick.song.slug}`}
                  className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
                >
                  About<span className="sr-only"> {pick.song.title}</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
