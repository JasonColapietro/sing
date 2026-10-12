"use client";

/**
 * How much of a module's practice this device has logged, read from the rooms'
 * own session log. There is no lesson record: a lesson counts as practised when
 * its module's room has a matching session, which is the only evidence sing
 * holds. A score shown here is the room's score, never a pass for the lesson.
 */
import { isSessionOfSong } from "@/components/songs/lib";
import { titlesFor } from "@/components/warmups/exercises";
import type { PracticeMatch } from "@/lib/lesson-practice";
import { useProgress } from "@/lib/progress";
import type { SessionLog } from "@/lib/progress-shape";

/**
 * The sessions that count as this module's practice. A song or warm-up that
 * was renamed keeps the sessions logged under its old title, the same way the
 * song page's best score and the warm-up library's history read them.
 */
export function matchingSessions(
  sessions: readonly SessionLog[],
  match: PracticeMatch,
): SessionLog[] {
  const { type, detail } = match;
  if (detail === undefined) return sessions.filter((s) => s.type === type);
  if (type === "song") return sessions.filter((s) => isSessionOfSong(s, detail));
  if (type === "warmup") {
    const titles = titlesFor(detail);
    return sessions.filter((s) => s.type === type && s.detail !== undefined && titles.includes(s.detail));
  }
  return sessions.filter((s) => s.type === type && s.detail === detail);
}

/** One line: how many sessions, the best room score, and the last day. */
export function PracticeCount({
  match,
  room,
}: {
  match: PracticeMatch;
  /** What to call where the sessions were logged, e.g. "the pitch studio". */
  room: string;
}) {
  const { sessions } = useProgress();
  const hits = matchingSessions(sessions, match);
  if (hits.length === 0) {
    return (
      <p className="text-sm text-mut" data-practice-count="0">
        No sessions in {room} on this device yet.
      </p>
    );
  }
  const scored = hits.filter((s) => typeof s.score === "number");
  const best = scored.length ? Math.max(...scored.map((s) => s.score ?? 0)) : undefined;
  const last = hits.reduce((a, s) => (s.day > a ? s.day : a), hits[0].day);
  return (
    <p className="text-sm text-mut" data-practice-count={hits.length}>
      {hits.length} {hits.length === 1 ? "session" : "sessions"} in {room} on this
      device, most recently {last}
      {best !== undefined ? `, best room score ${Math.round(best)}%` : ""}.
    </p>
  );
}

/** A small marker for a module row: practised on this device or not. */
export function PracticedMark({ match }: { match: PracticeMatch }) {
  const { sessions } = useProgress();
  if (matchingSessions(sessions, match).length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ok/40 px-2.5 py-0.5 text-xs text-ok-ink">
      Practised
    </span>
  );
}
