"use client";

import { useMemo } from "react";
import type { SessionLog } from "@/lib/progress";
import { addDays, localDayStr, mondayOf, secondsByDay } from "./format";

const AMBER = "#f5b03e";
const EMPTY = "#1f1a13";
const DIM = "#6f685a";
const MONO = "var(--font-mono)";

/** 4 amber intensity steps (opacity on the amber hue) + empty. */
const STEPS = [0.25, 0.45, 0.7, 1] as const;

function stepFor(min: number): number {
  // 0 = empty, 1..4 = amber steps
  if (min <= 0) return 0;
  if (min < 5) return 1;
  if (min < 15) return 2;
  if (min < 30) return 3;
  return 4;
}

const CELL = 13;
const GAP = 3;
const STEP = CELL + GAP;
const COLS = 12;
const ROWS = 7;
const LEFT = 30; // day-of-week labels
const TOP = 14; // month labels

/** GitHub-style practice heatmap: last 12 weeks, Monday-first rows. */
export function PracticeCalendar({ sessions }: { sessions: SessionLog[] }) {
  const { cells, monthLabels, totalMin, activeDays } = useMemo(() => {
    const byDay = secondsByDay(sessions);
    const today = new Date();
    const todayKey = localDayStr(today);
    const start = addDays(mondayOf(today), -7 * (COLS - 1));

    const cells: Array<{
      key: string;
      col: number;
      row: number;
      step: number;
      title: string;
      future: boolean;
    }> = [];
    const monthLabels: Array<{ col: number; label: string }> = [];
    let prevMonth = -1;
    let totalMin = 0;
    let activeDays = 0;

    for (let c = 0; c < COLS; c++) {
      const monday = addDays(start, c * 7);
      if (monday.getMonth() !== prevMonth) {
        monthLabels.push({
          col: c,
          label: monday.toLocaleDateString("en-US", { month: "short" }),
        });
        prevMonth = monday.getMonth();
      }
      for (let r = 0; r < ROWS; r++) {
        const d = addDays(monday, r);
        const key = localDayStr(d);
        const future = key > todayKey;
        const min = (byDay.get(key) ?? 0) / 60;
        if (!future && min > 0) {
          totalMin += min;
          activeDays += 1;
        }
        cells.push({
          key,
          col: c,
          row: r,
          step: future ? 0 : stepFor(min),
          future,
          title: future
            ? ""
            : `${d.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })} — ${min > 0 ? `${Math.round(min)} min` : "no practice"}`,
        });
      }
    }
    return { cells, monthLabels, totalMin: Math.round(totalMin), activeDays };
  }, [sessions]);

  const W = LEFT + COLS * STEP - GAP;
  const H = TOP + ROWS * STEP - GAP;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full max-w-xl"
        role="img"
        aria-label={`Practice calendar for the last 12 weeks: ${activeDays} active days, ${totalMin} minutes total. Darker amber squares mean more minutes that day.`}
      >
        {monthLabels.map((m) => (
          <text
            key={`${m.label}-${m.col}`}
            x={LEFT + m.col * STEP}
            y={9}
            fontSize={8}
            fontFamily={MONO}
            fill={DIM}
          >
            {m.label}
          </text>
        ))}
        {(["Mon", "Wed", "Fri"] as const).map((label, i) => (
          <text
            key={label}
            x={LEFT - 6}
            y={TOP + i * 2 * STEP + CELL / 2}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={8}
            fontFamily={MONO}
            fill={DIM}
          >
            {label}
          </text>
        ))}
        {cells.map((c) =>
          c.future ? null : (
            <rect
              key={c.key}
              x={LEFT + c.col * STEP}
              y={TOP + c.row * STEP}
              width={CELL}
              height={CELL}
              rx={3}
              fill={c.step === 0 ? EMPTY : AMBER}
              fillOpacity={c.step === 0 ? 1 : STEPS[c.step - 1]}
            >
              <title>{c.title}</title>
            </rect>
          ),
        )}
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <p className="text-xs text-mut">
          {activeDays > 0
            ? `${activeDays} active ${activeDays === 1 ? "day" : "days"} and ${totalMin} minutes in the last 12 weeks.`
            : "No practice in the last 12 weeks — today is a good day to start."}
        </p>
        <div
          className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-dim"
          aria-hidden="true"
        >
          <span>Less</span>
          <span
            className="inline-block h-3 w-3 rounded-[3px]"
            style={{ background: EMPTY }}
          />
          {STEPS.map((o) => (
            <span
              key={o}
              className="inline-block h-3 w-3 rounded-[3px]"
              style={{ background: AMBER, opacity: o }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
