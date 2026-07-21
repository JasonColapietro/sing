import type { ActivityType, SessionLog } from "@/lib/progress";

/** Route + display metadata for each activity type. */
export const TYPE_META: Record<
  ActivityType,
  { label: string; href: string; tone: "mut" | "amber" | "rec" | "ok" | "cool" }
> = {
  warmup: { label: "Warmup", href: "/warmups", tone: "amber" },
  pitch: { label: "Pitch", href: "/studio", tone: "amber" },
  range: { label: "Range", href: "/range", tone: "cool" },
  ear: { label: "Ear", href: "/ear-training", tone: "cool" },
  breath: { label: "Breath", href: "/breath", tone: "ok" },
  song: { label: "Song", href: "/songs", tone: "amber" },
  recording: { label: "Recording", href: "/recorder", tone: "rec" },
  tools: { label: "Tools", href: "/tools", tone: "mut" },
};

/** "45s", "12m", "1h 04m". */
export function fmtDur(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}h ${String(rem).padStart(2, "0")}m`;
}

/** Local calendar day, YYYY-MM-DD (matches lib/progress day keys). */
export function localDayStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD day string as local midnight. */
export function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Monday (local) of the week containing d, at midnight. */
export function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - dow);
  return x;
}

/** "today", "yesterday", "3d ago", or "May 12". */
export function relDay(day: string, todayStr: string): string {
  if (day === todayStr) return "today";
  const diff = Math.round(
    (parseDay(todayStr).getTime() - parseDay(day).getTime()) / 86400000,
  );
  if (diff === 1) return "yesterday";
  if (diff > 1 && diff < 7) return `${diff}d ago`;
  return parseDay(day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Sum of practice seconds per day. */
export function secondsByDay(sessions: SessionLog[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    map.set(s.day, (map.get(s.day) ?? 0) + s.durationSec);
  }
  return map;
}
