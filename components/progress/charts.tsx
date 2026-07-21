"use client";

import { useMemo } from "react";
import type { ActivityType, SessionLog } from "@/lib/progress";
import {
  TYPE_META,
  addDays,
  localDayStr,
  mondayOf,
  parseDay,
} from "./format";

// Design-token hex values for SVG (mirrors app/globals.css @theme).
const AMBER = "#f5b03e";
const LINE = "#2b2519";
const LINE2 = "#3a3222";
const DIM = "#6f685a";
const MUT = "#a69d8c";
const PANEL = "#17140f";

const MONO = "var(--font-mono)";

/** Bar path: 4px rounded data-end (top), square at the baseline. */
function roundedTopBar(x: number, y: number, w: number, h: number, r = 4): string {
  if (h <= 0 || w <= 0) return "";
  const rr = Math.min(r, h, w / 2);
  return [
    `M${x},${y + h}`,
    `L${x},${y + rr}`,
    `Q${x},${y} ${x + rr},${y}`,
    `L${x + w - rr},${y}`,
    `Q${x + w},${y} ${x + w},${y + rr}`,
    `L${x + w},${y + h}`,
    "Z",
  ].join(" ");
}

/** Horizontal bar path: rounded right data-end, square at the left baseline. */
function roundedRightBar(x: number, y: number, w: number, h: number, r = 4): string {
  if (h <= 0 || w <= 0) return "";
  const rr = Math.min(r, w, h / 2);
  return [
    `M${x},${y}`,
    `L${x + w - rr},${y}`,
    `Q${x + w},${y} ${x + w},${y + rr}`,
    `L${x + w},${y + h - rr}`,
    `Q${x + w},${y + h} ${x + w - rr},${y + h}`,
    `L${x},${y + h}`,
    "Z",
  ].join(" ");
}

/* ------------------------------------------------------------------ */
/* Practice minutes per day — last 14 days                             */
/* ------------------------------------------------------------------ */

export function MinutesBarChart({ sessions }: { sessions: SessionLog[] }) {
  const data = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const s of sessions) byDay.set(s.day, (byDay.get(s.day) ?? 0) + s.durationSec);
    const today = new Date();
    const days: { key: string; label: string; min: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(today, -i);
      const key = localDayStr(d);
      days.push({
        key,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        min: (byDay.get(key) ?? 0) / 60,
      });
    }
    return days;
  }, [sessions]);

  const total = Math.round(data.reduce((a, d) => a + d.min, 0));
  const activeDays = data.filter((d) => d.min > 0).length;
  const maxMin = Math.max(...data.map((d) => d.min));
  const niceMax = Math.max(10, Math.ceil(maxMin / 10) * 10);

  const W = 640;
  const H = 190;
  const padL = 34;
  const padR = 8;
  const padT = 16;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const band = innerW / 14;
  const barW = Math.min(24, band - 8);
  const y = (v: number) => padT + innerH * (1 - v / niceMax);
  const ticks = [0, niceMax / 2, niceMax];
  const maxIdx = maxMin > 0 ? data.findIndex((d) => d.min === maxMin) : -1;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Bar chart of practice minutes per day over the last 14 days. ${total} minutes total across ${activeDays} active days.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              y1={y(t)}
              x2={W - padR}
              y2={y(t)}
              stroke={t === 0 ? LINE2 : LINE}
              strokeWidth={1}
            />
            <text
              x={padL - 6}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={9}
              fontFamily={MONO}
              fill={DIM}
            >
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const bx = padL + band * i + (band - barW) / 2;
          const h = d.min > 0 ? Math.max(2, innerH * (d.min / niceMax)) : 0;
          const by = padT + innerH - h;
          return (
            <g key={d.key}>
              <title>
                {d.min > 0
                  ? `${d.label} — ${Math.round(d.min)} min`
                  : `${d.label} — no practice`}
              </title>
              <rect
                x={padL + band * i}
                y={padT}
                width={band}
                height={innerH}
                fill="transparent"
              />
              {h > 0 && <path d={roundedTopBar(bx, by, barW, h)} fill={AMBER} />}
              {i % 3 === 0 && (
                <text
                  x={padL + band * i + band / 2}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily={MONO}
                  fill={DIM}
                >
                  {d.label}
                </text>
              )}
              {i === maxIdx && (
                <text
                  x={bx + barW / 2}
                  y={by - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily={MONO}
                  fill={MUT}
                >
                  {Math.round(d.min)}m
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-mut">
        {total > 0
          ? `${total} minutes across ${activeDays} of the last 14 days.`
          : "No practice logged in the last 14 days."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Average score trend by week — one line overall                      */
/* ------------------------------------------------------------------ */

export function ScoreTrendChart({ sessions }: { sessions: SessionLog[] }) {
  const weeks = useMemo(() => {
    const monToday = mondayOf(new Date());
    const buckets: { label: string; sum: number; n: number }[] = [];
    const idx = new Map<string, number>();
    for (let i = 7; i >= 0; i--) {
      const m = addDays(monToday, -7 * i);
      idx.set(localDayStr(m), buckets.length);
      buckets.push({
        label: m.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sum: 0,
        n: 0,
      });
    }
    for (const s of sessions) {
      if (s.score === undefined) continue;
      const bi = idx.get(localDayStr(mondayOf(parseDay(s.day))));
      if (bi !== undefined) {
        buckets[bi].sum += s.score;
        buckets[bi].n += 1;
      }
    }
    return buckets.map((b) => ({
      label: b.label,
      avg: b.n > 0 ? b.sum / b.n : null,
      n: b.n,
    }));
  }, [sessions]);

  const scored = weeks.filter(
    (w): w is { label: string; avg: number; n: number } => w.avg !== null,
  );

  if (scored.length < 2) {
    return (
      <p className="rounded-xl border border-dashed border-line2 px-4 py-8 text-center text-sm text-mut">
        Not enough scored practice yet. Finish scored exercises in warmups, ear
        training, or songs over a couple of weeks to see a trend here.
      </p>
    );
  }

  const W = 640;
  const H = 190;
  const padL = 34;
  const padR = 44;
  const padT = 16;
  const padB = 24;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const x = (i: number) => padL + (innerW * i) / 7;
  const y = (v: number) => padT + innerH * (1 - v / 100);
  const ticks = [0, 50, 100];

  // Line segments: break the line across weeks with no scored sessions.
  let path = "";
  let prevHad = false;
  weeks.forEach((w, i) => {
    if (w.avg === null) {
      prevHad = false;
      return;
    }
    path += `${prevHad ? "L" : "M"}${x(i).toFixed(1)},${y(w.avg).toFixed(1)} `;
    prevHad = true;
  });

  const lastIdx = weeks.reduce((acc, w, i) => (w.avg !== null ? i : acc), -1);
  const last = weeks[lastIdx];

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Line chart of average exercise score by week over the last 8 weeks. Latest weekly average is ${Math.round(last.avg ?? 0)} out of 100.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              y1={y(t)}
              x2={W - padR}
              y2={y(t)}
              stroke={t === 0 ? LINE2 : LINE}
              strokeWidth={1}
            />
            <text
              x={padL - 6}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={9}
              fontFamily={MONO}
              fill={DIM}
            >
              {t}
            </text>
          </g>
        ))}
        {[0, 4, 7].map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={9}
            fontFamily={MONO}
            fill={DIM}
          >
            {weeks[i].label}
          </text>
        ))}
        <path d={path.trim()} fill="none" stroke={AMBER} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {weeks.map((w, i) =>
          w.avg === null ? null : (
            <g key={i}>
              <title>{`Week of ${w.label} — avg ${Math.round(w.avg)} across ${w.n} scored ${w.n === 1 ? "session" : "sessions"}`}</title>
              <circle cx={x(i)} cy={y(w.avg)} r={10} fill="transparent" />
              <circle
                cx={x(i)}
                cy={y(w.avg)}
                r={4}
                fill={AMBER}
                stroke={PANEL}
                strokeWidth={2}
              />
            </g>
          ),
        )}
        {last.avg !== null && (
          <text
            x={x(lastIdx) + 9}
            y={y(last.avg)}
            dominantBaseline="middle"
            fontSize={10}
            fontFamily={MONO}
            fill={MUT}
          >
            {Math.round(last.avg)}
          </text>
        )}
      </svg>
      <p className="mt-2 text-xs text-mut">
        Average score across all scored exercises, by week. Latest week:{" "}
        {Math.round(last.avg ?? 0)}/100.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Practice mix — minutes by activity type, horizontal bars            */
/* ------------------------------------------------------------------ */

export function PracticeMixChart({ sessions }: { sessions: SessionLog[] }) {
  const rows = useMemo(() => {
    const byType = new Map<ActivityType, number>();
    for (const s of sessions) {
      byType.set(s.type, (byType.get(s.type) ?? 0) + s.durationSec);
    }
    return [...byType.entries()]
      .map(([type, sec]) => ({ type, min: sec / 60 }))
      .filter((r) => r.min > 0)
      .sort((a, b) => b.min - a.min);
  }, [sessions]);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line2 px-4 py-8 text-center text-sm text-mut">
        Nothing to mix yet — every activity you finish shows up here.
      </p>
    );
  }

  const labelW = 96;
  const valueW = 52;
  const W = 560;
  const rowH = 30;
  const barH = 14;
  const H = rows.length * rowH;
  const barMax = W - labelW - valueW - 12;
  const maxMin = rows[0].min;
  const top = TYPE_META[rows[0].type].label;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Horizontal bar chart of total practice minutes by activity type. ${top} leads with ${Math.round(maxMin)} minutes.`}
      >
        {rows.map((r, i) => {
          const w = Math.max(2, barMax * (r.min / maxMin));
          const yTop = i * rowH + (rowH - barH) / 2;
          return (
            <g key={r.type}>
              <title>{`${TYPE_META[r.type].label} — ${Math.round(r.min)} min total`}</title>
              <rect x={0} y={i * rowH} width={W} height={rowH} fill="transparent" />
              <text
                x={labelW - 8}
                y={i * rowH + rowH / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={11}
                fontFamily={MONO}
                fill={MUT}
              >
                {TYPE_META[r.type].label}
              </text>
              <path d={roundedRightBar(labelW, yTop, w, barH)} fill={AMBER} />
              <text
                x={labelW + w + 7}
                y={i * rowH + rowH / 2}
                dominantBaseline="middle"
                fontSize={10}
                fontFamily={MONO}
                fill={MUT}
              >
                {Math.round(r.min)}m
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-mut">
        Where your total practice time has gone. {top} leads with{" "}
        {Math.round(maxMin)} minutes.
      </p>
    </div>
  );
}
