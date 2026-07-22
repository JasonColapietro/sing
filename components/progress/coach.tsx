"use client";

import Link from "next/link";
import type { ProgressState } from "@/lib/progress";
import { Card } from "@/components/ui";
import { TYPE_META, addDays, localDayStr } from "./format";

interface PlanItem {
  title: string;
  href: string;
  minutes: number;
  reason: string;
}

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

  // Weakest recent area: lowest average score among ear/song/warmup, last 14 days.
  const buckets = new Map<"ear" | "song" | "warmup", { sum: number; n: number }>();
  for (const s of state.sessions) {
    if (s.day < cutoff || s.score === undefined) continue;
    if (s.type !== "ear" && s.type !== "song" && s.type !== "warmup") continue;
    const b = buckets.get(s.type) ?? { sum: 0, n: 0 };
    b.sum += s.score;
    b.n += 1;
    buckets.set(s.type, b);
  }
  let weakest: { type: "ear" | "song" | "warmup"; avg: number } | null = null;
  for (const [type, b] of buckets) {
    const avg = b.sum / b.n;
    if (!weakest || avg < weakest.avg) weakest = { type, avg };
  }

  const items: PlanItem[] = [];

  if (state.range.lowMidi === undefined) {
    items.push({
      title: "Vocal range test",
      href: "/range",
      minutes: 3,
      reason:
        "You haven't measured your range yet — it anchors every other exercise to your voice.",
    });
  }

  items.push({
    title: "Breathing",
    href: "/breath",
    minutes: 2,
    reason: "Every session starts here — low, steady breaths set up the rest.",
  });

  items.push({
    title: "Warmups",
    href: "/warmups",
    minutes: 5,
    reason: "Gentle sirens and hums wake the voice up before harder work.",
  });

  if (weakest) {
    const avg = Math.round(weakest.avg);
    if (weakest.type === "ear") {
      items.push({
        title: "Ear training",
        href: TYPE_META.ear.href,
        minutes: 5,
        reason: `Your interval scores averaged ${avg} over the last two weeks — the lowest of your scored areas.`,
      });
    } else if (weakest.type === "song") {
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
      reason: "No recent scores to read yet — a scored round sets your baseline.",
    });
  }

  if (state.range.lowMidi !== undefined) {
    items.push({
      title: "Sing a song",
      href: "/songs",
      minutes: 3,
      reason: "Finish by putting the work into real music.",
    });
  }

  return { banner, items };
}

export function CoachCard({ state }: { state: ProgressState }) {
  const { banner, items } = buildPlan(state, new Date());
  const total = items.reduce((a, i) => a + i.minutes, 0);

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg">Today&apos;s session</h2>
        <span className="tabular font-mono text-xs text-dim">
          {total} min planned
        </span>
      </div>
      {banner && (
        <p className="mt-3 rounded-xl border border-rec/40 bg-rec/10 px-3 py-2 text-sm text-rec">
          {banner}
        </p>
      )}
      <ol className="mt-4 space-y-3">
        {items.map((item, i) => (
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
                  href={item.href}
                  className="font-medium text-ink underline-offset-4 hover:text-amber-ink hover:underline"
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
        ))}
      </ol>
      <p className="mt-4 text-xs text-dim">
        Built from your recent practice — no AI, just the numbers.
      </p>
    </Card>
  );
}
