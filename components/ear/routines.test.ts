import { describe, expect, it } from "vitest";
import { DIFFICULTIES, GAME_NAMES, type GameId } from "./lib";
import {
  EAR_GAME_SECONDS,
  EAR_ROUTINES,
  EAR_STEP_INTRO_SEC,
  GAME_DESC,
  GAME_MIC,
  GAME_TRAINS,
  earRoutineById,
  earRoutineMinutes,
  earRoutineNeedsMic,
  earRoutineSeconds,
  earStepLabel,
  recommendEarRoutine,
} from "./routines";

const GAME_IDS = Object.keys(GAME_NAMES) as GameId[];
const DIFF_IDS = DIFFICULTIES.map((d) => d.id);

describe("ear routine catalogue", () => {
  it("names only games and difficulties that exist", () => {
    for (const r of EAR_ROUTINES) {
      for (const s of r.steps) {
        expect(GAME_IDS, `${r.id}: ${s.game}`).toContain(s.game);
        expect(DIFF_IDS, `${r.id}: ${s.difficulty}`).toContain(s.difficulty);
      }
    }
  });

  it("has unique ids, a name, a tagline and at least two steps each", () => {
    const ids = EAR_ROUTINES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const r of EAR_ROUTINES) {
      expect(r.name.length, r.id).toBeGreaterThan(2);
      expect(r.tagline.length, r.id).toBeGreaterThan(10);
      expect(r.steps.length, r.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("covers every game somewhere in the catalogue", () => {
    const used = new Set(EAR_ROUTINES.flatMap((r) => r.steps.map((s) => s.game)));
    for (const g of GAME_IDS) expect(used, g).toContain(g);
  });

  it("keeps the quick workout entirely on easy, so a cold ear can finish it", () => {
    const quick = earRoutineById("quick");
    expect(quick).not.toBeNull();
    for (const s of quick!.steps) expect(s.difficulty).toBe("easy");
  });

  it("walks the single-game drills up the difficulties in order", () => {
    for (const id of ["intervals", "pitch"]) {
      const r = earRoutineById(id)!;
      const ranks = r.steps
        .filter((s) => s.game === r.steps[0].game)
        .map((s) => DIFF_IDS.indexOf(s.difficulty));
      expect([...ranks].sort((a, b) => a - b), id).toEqual(ranks);
    }
  });

  it("finds a routine by id and returns null for anything else", () => {
    expect(earRoutineById("daily")?.name).toBe("Daily ear workout");
    expect(earRoutineById("full")?.steps).toHaveLength(6);
    expect(earRoutineById("nope")).toBeNull();
    expect(earRoutineById(null)).toBeNull();
    expect(earRoutineById(undefined)).toBeNull();
  });
});

describe("game metadata", () => {
  it("describes every game exactly once, in each table", () => {
    for (const g of GAME_IDS) {
      expect(GAME_TRAINS[g]?.length, g).toBeGreaterThan(4);
      expect(GAME_DESC[g]?.length, g).toBeGreaterThan(10);
      expect(typeof GAME_MIC[g], g).toBe("boolean");
      expect(EAR_GAME_SECONDS[g], g).toBeGreaterThan(0);
    }
  });

  it("marks the two singing games as the ones needing a microphone", () => {
    expect(GAME_MIC["pitch-match"]).toBe(true);
    expect(GAME_MIC["melody-echo"]).toBe(true);
    expect(GAME_MIC.interval).toBe(false);
    expect(GAME_MIC["higher-lower"]).toBe(false);
  });

  it("labels a step with its game and difficulty", () => {
    expect(earStepLabel({ game: "interval", difficulty: "medium" })).toBe(
      "Interval ID · Medium",
    );
    expect(earStepLabel({ game: "melody-echo", difficulty: "hard" })).toBe(
      "Melody echo · Hard",
    );
  });

  it("says which routines open the microphone", () => {
    expect(earRoutineNeedsMic(earRoutineById("intervals")!)).toBe(false);
    expect(earRoutineNeedsMic(earRoutineById("pitch")!)).toBe(true);
    expect(earRoutineNeedsMic(earRoutineById("daily")!)).toBe(true);
  });
});

describe("ear routine length", () => {
  it("adds the intro hold once per step", () => {
    for (const r of EAR_ROUTINES) {
      const games = r.steps.reduce((a, s) => a + EAR_GAME_SECONDS[s.game], 0);
      expect(earRoutineSeconds(r), r.id).toBe(
        games + EAR_STEP_INTRO_SEC * r.steps.length,
      );
    }
  });

  it("lands every routine between three and twelve minutes", () => {
    for (const r of EAR_ROUTINES) {
      const m = earRoutineMinutes(r);
      expect(m, r.id).toBeGreaterThanOrEqual(3);
      expect(m, r.id).toBeLessThanOrEqual(12);
    }
  });

  it("keeps the quick workout the shortest and the full one the longest", () => {
    const secs = Object.fromEntries(
      EAR_ROUTINES.map((r) => [r.id, earRoutineSeconds(r)]),
    );
    const others = EAR_ROUTINES.filter((r) => r.id !== "quick" && r.id !== "intervals");
    for (const r of others) expect(secs[r.id], r.id).toBeGreaterThan(secs.quick);
    for (const r of EAR_ROUTINES) {
      if (r.id !== "full") expect(secs.full, r.id).toBeGreaterThanOrEqual(secs[r.id]);
    }
  });
});

describe("recommendEarRoutine", () => {
  it("tops up with the quick workout once today already has a session", () => {
    expect(recommendEarRoutine({ practicedToday: true }).id).toBe("quick");
  });

  it("offers the daily workout otherwise", () => {
    expect(recommendEarRoutine({ practicedToday: false }).id).toBe("daily");
  });
});
