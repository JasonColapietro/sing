import { describe, expect, it } from "vitest";
import { DEFAULT_PROGRESS } from "@/lib/progress-shape";
import type { ProgressState, SessionLog } from "@/lib/progress-shape";
import { starsForScore } from "./results-screen";
import {
  averageStars,
  bestScoreForExercise,
  nextUpId,
  starsForExercise,
  type PathLevel,
} from "./learn-home";

function warmup(detail: string, score: number | undefined, day = "2026-09-01"): SessionLog {
  return {
    id: `${detail}-${score ?? "none"}-${day}`,
    type: "warmup",
    date: `${day}T10:00:00.000Z`,
    day,
    durationSec: 120,
    score,
    detail,
    xp: 10,
  };
}

function stateWith(sessions: SessionLog[]): ProgressState {
  return { ...DEFAULT_PROGRESS, sessions };
}

describe("starsForScore", () => {
  it("bands a score into three stars", () => {
    expect(starsForScore(100)).toBe(3);
    expect(starsForScore(90)).toBe(3);
    expect(starsForScore(89)).toBe(2);
    expect(starsForScore(75)).toBe(2);
    expect(starsForScore(74)).toBe(1);
    expect(starsForScore(50)).toBe(1);
    expect(starsForScore(49)).toBe(0);
    expect(starsForScore(0)).toBe(0);
  });

  it("gives an unscored session no stars — it is not a zero-star take", () => {
    expect(starsForScore(null)).toBe(0);
  });
});

describe("bestScoreForExercise", () => {
  it("returns the best score ever logged under that exercise title", () => {
    const s = stateWith([
      warmup("Lip trill scale", 62),
      warmup("Lip trill scale", 91),
      warmup("Lip trill scale", 44),
    ]);
    expect(bestScoreForExercise(s, "Lip trill scale")).toBe(91);
  });

  it("ignores other exercises, other activities and unscored sessions", () => {
    const s = stateWith([
      warmup("Straw scale", 98),
      { ...warmup("Lip trill scale", undefined), score: undefined },
      { ...warmup("Lip trill scale", 99), type: "song" },
      warmup("Lip trill scale", 55),
    ]);
    expect(bestScoreForExercise(s, "Lip trill scale")).toBe(55);
  });

  it("returns null for an exercise that has never been sung", () => {
    expect(bestScoreForExercise(stateWith([]), "Octave siren")).toBeNull();
  });
});

describe("starsForExercise", () => {
  it("stars the best take, not the last one", () => {
    const s = stateWith([warmup("Hoo four note", 40), warmup("Hoo four note", 92)]);
    expect(starsForExercise(s, "Hoo four note")).toBe(3);
  });

  it("is starless until the exercise has been scored", () => {
    expect(starsForExercise(stateWith([]), "Hoo four note")).toBe(0);
  });
});

describe("averageStars", () => {
  it("floors the mean — untouched steps hold a routine back", () => {
    expect(averageStars([3, 3, 0])).toBe(2);
    expect(averageStars([3, 2, 2])).toBe(2);
    expect(averageStars([1, 0])).toBe(0);
    expect(averageStars([3, 3, 3])).toBe(3);
  });

  it("is zero for an empty set", () => {
    expect(averageStars([])).toBe(0);
  });

  it("aggregates a routine's steps through starsForExercise", () => {
    const s = stateWith([warmup("A", 95), warmup("B", 80), warmup("C", 95)]);
    const stars = ["A", "B", "C"].map((t) => starsForExercise(s, t));
    expect(stars).toEqual([3, 2, 3]);
    expect(averageStars(stars)).toBe(2);
  });
});

describe("nextUpId", () => {
  const level = (title: string, items: PathLevel["items"]): PathLevel => ({ title, items });

  it("picks the first unstarred item in the first level that has one", () => {
    const levels = [
      level("One", [
        { id: "a", title: "A", stars: 3 },
        { id: "b", title: "B", stars: 0 },
        { id: "c", title: "C", stars: 0 },
      ]),
      level("Two", [{ id: "d", title: "D", stars: 0 }]),
    ];
    expect(nextUpId(levels)).toBe("b");
  });

  it("moves to the next level once a level is fully starred", () => {
    const levels = [
      level("One", [{ id: "a", title: "A", stars: 1 }]),
      level("Two", [{ id: "d", title: "D", stars: 0 }]),
    ];
    expect(nextUpId(levels)).toBe("d");
  });

  it("never points at a locked row", () => {
    const levels = [
      level("One", [
        { id: "a", title: "A", stars: 0, locked: true, href: "/pro" },
        { id: "b", title: "B", stars: 0 },
      ]),
    ];
    expect(nextUpId(levels)).toBe("b");
  });

  it("returns null when everything is starred", () => {
    expect(nextUpId([level("One", [{ id: "a", title: "A", stars: 1 }])])).toBeNull();
  });
});
