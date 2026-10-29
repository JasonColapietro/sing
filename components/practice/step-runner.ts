"use client";

import { useCallback, useState } from "react";
import { denseStepResults, withStepResult } from "./step-results";

/** Where a routine runner is: reading the slide for `step`, running it, or done. */
export type StepPhase =
  | { kind: "intro"; step: number }
  | { kind: "play"; step: number }
  | { kind: "done" };

/** The phase after step `step` closes, however it closed. */
export function afterStep(step: number, stepCount: number): StepPhase {
  return step + 1 < stepCount ? { kind: "intro", step: step + 1 } : { kind: "done" };
}

/**
 * The phase machine every routine runner shares: per-step results, the step
 * the cap slide stood in for, quit and again. Steps advance themselves (the
 * slide starts on a timer, each step reports when it is over), so a routine
 * runs to the end without the singer touching anything.
 */
export function useStepRunner<T>(
  stepCount: number,
  { capped = false, startStep = 0 }: { capped?: boolean; startStep?: number } = {},
) {
  const [run, setRun] = useState(0);
  // The step this run opened on (a `?step=` link); "again" runs from the top.
  const [firstStep, setFirstStep] = useState(() => Math.min(Math.max(0, startStep), stepCount - 1));
  const [phase, setPhase] = useState<StepPhase>({ kind: "intro", step: firstStep });
  const [results, setResults] = useState<(T | null)[]>([]);
  const [capStoppedAt, setCapStoppedAt] = useState<number | null>(null);

  /** Step `i` reported; the dense results are returned for whoever ends the run. */
  const record = useCallback(
    (i: number, result: T | null) => {
      const next = withStepResult(results, i, result, stepCount);
      setResults(next);
      return next;
    },
    [results, stepCount],
  );
  const closeStep = useCallback(
    (i: number, result: T | null) => {
      const next = record(i, result);
      setPhase(afterStep(i, stepCount));
      return next;
    },
    [record, stepCount],
  );
  const play = useCallback((step: number) => setPhase({ kind: "play", step }), []);

  /**
   * Leave without throwing away work: with anything reported the run ends
   * on its results (returned, dense) and `capAt` names the step whose intro
   * the cap slide replaced; with nothing reported there is nothing to
   * summarise, and null says so.
   */
  const quit = useCallback(
    (capAt?: number): (T | null)[] | null => {
      if (!results.some((r) => r != null)) return null;
      const dense = denseStepResults(results, stepCount);
      setResults(dense);
      setCapStoppedAt(capAt ?? null);
      setPhase({ kind: "done" });
      return dense;
    },
    [results, stepCount],
  );

  const again = useCallback(() => {
    setResults([]);
    setFirstStep(0);
    setCapStoppedAt(null);
    setPhase({ kind: "intro", step: 0 });
    setRun((n) => n + 1);
  }, []);

  // Checked between steps, never mid-step: the step under way finishes and logs.
  const atCapSlide = capped && phase.kind === "intro";
  const stepKey = phase.kind === "done" ? `${run}-done` : `${run}-${phase.step}`;

  return {
    phase,
    results,
    capStoppedAt,
    firstStep,
    /** Keys a step's slide and screen so "again" remounts them clean. */
    stepKey,
    atCapSlide,
    record,
    closeStep,
    play,
    goTo: setPhase,
    quit,
    again,
  };
}
