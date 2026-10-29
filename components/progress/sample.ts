import type { ActivityType, SessionLog } from "@/lib/progress-shape";

/** Local calendar day, YYYY-MM-DD, as the store writes it. */
function day(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const KINDS: ActivityType[] = ["warmup", "pitch", "song", "warmup", "ear", "pitch", "warmup", "breath", "song", "warmup", "pitch"];

/**
 * The example record the fresh /progress ghost figures draw: the mix
 * scripts/render-room-shots.mjs seeds, spread over four weeks with scores
 * that rise, so every chart has a shape. Never stored; never the singer's.
 */
export function sampleSessions(now: Date = new Date()): SessionLog[] {
  const sessions: SessionLog[] = [];
  for (let i = 0; i < 18; i++) {
    const type = KINDS[i % KINDS.length];
    const d = new Date(now);
    d.setDate(d.getDate() - (27 - Math.round(i * 1.55)));
    d.setHours(18, 10 + i, 0, 0);
    const scored = type !== "breath";
    sessions.push({
      id: `sample-${i}`,
      type,
      date: d.toISOString(),
      day: day(d),
      durationSec: 150 + (i % 3) * 60,
      ...(scored ? { score: Math.min(95, 58 + i * 2 + ((i * 7) % 9)) } : {}),
      xp: 40 + (i % 4) * 10,
    });
  }
  return sessions;
}
