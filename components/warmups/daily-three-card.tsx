"use client";

import Link from "next/link";
import { Card, Pill, SectionLabel } from "@/components/ui";
import { MicAlert } from "@/components/mic-alert";
import { KIND_LABELS, type DailyPick, type DailyThree } from "@/lib/daily-three";

/** The tempo pill's words: the number, and which way it moved from 1x. */
function tempoLabel(p: DailyPick): string {
  const x = `${p.tempo}×`;
  if (p.step === "up") return `${x} · stepped up`;
  if (p.step === "down") return `${x} · slowed down`;
  return x;
}

/**
 * "Today's three": the day's planned exercises, a tick on each one already
 * sung today, and a row per exercise that starts it at its planned tempo.
 *
 * Each row is a real link to `/warmups?exercise=<id>` — the deep link the room
 * already parses, and which applies the same planned tempo when it lands — so
 * it can be opened in a new tab or shared. A plain click is handled in place
 * instead, since a same-page navigation would not re-read the query.
 */
export function DailyThreeCard({
  plan,
  done,
  onStart,
  errorExerciseId,
  error,
}: {
  plan: DailyThree;
  /** Per pick, in plan order: sung today. */
  done: boolean[];
  onStart: (pick: DailyPick) => void;
  errorExerciseId: string | null;
  error: string | null;
}) {
  if (plan.picks.length === 0) return null;
  const count = done.filter(Boolean).length;
  const all = count === plan.picks.length;
  return (
    <Card>
      <section aria-labelledby="daily-three-heading">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="daily-three-heading" className="text-base leading-none">
            <SectionLabel>Today&apos;s three</SectionLabel>
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            {count} of {plan.picks.length} done
          </span>
          {all && <Pill tone="ok">All done today</Pill>}
        </div>
        <p className="mt-2 max-w-xl text-sm text-mut">
          Picked from your recent scores: one you sing well to warm up on, then
          the ones that need you most. Tempo is set from how each went last
          time. The same three all day.
        </p>
        <ol className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
          {plan.picks.map((p, i) => {
            const sung = done[i] ?? false;
            const failed = error !== null && errorExerciseId === p.exercise.id;
            return (
              <li key={p.exercise.id}>
                <Link
                  href={`/warmups?exercise=${encodeURIComponent(p.exercise.id)}`}
                  onClick={(e) => {
                    // Modified clicks keep their browser meaning (new tab, etc.).
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                    e.preventDefault();
                    onStart(p);
                  }}
                  className="flex min-h-[3.5rem] w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-panel2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                      sung ? "border-ok bg-ok/15 text-ok-ink" : "border-line2 text-dim"
                    }`}
                  >
                    {sung ? "✓" : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{p.exercise.title}</span>
                      <span className="sr-only">{sung ? "(done today)" : "(not done yet)"}</span>
                      <Pill tone={p.role === "confidence" ? "ok" : "mut"}>{KIND_LABELS[p.kind]}</Pill>
                      <Pill tone={p.step === "up" ? "violet" : p.step === "down" ? "cool" : "mut"}>
                        <span className="sr-only">Starting tempo </span>
                        {tempoLabel(p)}
                      </Pill>
                    </span>
                    <span className="mt-1 block text-sm text-dim">{p.why}</span>
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-dim"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </Link>
                {failed && error !== null && <MicAlert message={error} className="px-4 pb-3 text-sm text-rec" />}
              </li>
            );
          })}
        </ol>
      </section>
    </Card>
  );
}
