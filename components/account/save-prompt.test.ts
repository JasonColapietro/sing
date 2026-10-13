import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState, type SessionLog } from "@/lib/progress-shape";
import { localDay } from "@/lib/progress";
import { stakeSentence } from "./save-prompt";

function state(sessions: number, streak: number, range: boolean): ProgressState {
  const day = localDay();
  const logs: SessionLog[] = Array.from({ length: sessions }, (_, i) => ({
    id: `s${i}`,
    type: "warmup",
    date: `${day}T12:00:00.000Z`,
    day,
    durationSec: 300,
    xp: 10,
  }));
  return {
    ...DEFAULT_PROGRESS,
    sessions: logs,
    streak: { current: streak, best: streak, lastDay: day },
    range: range ? { lowMidi: 48, highMidi: 69 } : {},
  };
}

describe("the backup prompt's stake sentence", () => {
  it("names the streak with 'your', so an 8-, 11- or 18-day streak reads right", () => {
    for (const n of [8, 11, 18, 80]) {
      expect(stakeSentence(state(22, n, true))).toBe(
        `This browser holds the only copy of 22 practice sessions, your ${n}-day streak and your measured range.`,
      );
      expect(stakeSentence(state(22, n, true))).not.toMatch(/\ba \d+-day/);
    }
    expect(stakeSentence(state(3, 2, false))).toBe("This browser holds the only copy of 3 practice sessions and your 2-day streak.");
  });
});
