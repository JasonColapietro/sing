/**
 * Holds the programs to the rooms that exist, the links the contract
 * publishes, the measurements sing actually takes, and the session log the
 * rooms actually write. A program is a promise about weeks of practice; each
 * of those is a way the promise could quietly stop being true.
 */
import { describe, expect, it } from "vitest";
import { buildContract } from "@/contracts/suede-vocal";
import { EXERCISES } from "@/components/warmups/exercises";
import { isFreeExercise, routineById, stepExercise } from "@/components/warmups/routines";
import { BREATH_DRILL_IDS } from "@/components/breath/routines";
import { GAME_NAMES } from "@/components/ear/lib";
import type { SessionLog } from "@/lib/progress-shape";
import { parseEnrolment } from "@/lib/program-enrolment";
import {
  EAR_GAME_LABELS,
  PROGRAMS,
  PROGRAM_ROUTINE_IDS,
  programById,
  programProgress,
  taskDone,
  taskHref,
  type Program,
} from "@/lib/programs";

const contract = buildContract();
const allTasks = PROGRAMS.flatMap((p) => p.days.flatMap((d) => d.tasks));

let seq = 0;
function log(day: string, type: SessionLog["type"], detail?: string): SessionLog {
  seq += 1;
  return { id: `s${seq}`, type, date: `${day}T12:00:00.000Z`, day, durationSec: 60, detail, xp: 0 };
}
const exTitle = (id: string) => EXERCISES.find((e) => e.id === id)!.title;

describe("programs", () => {
  it("have unique ids and at least one day each", () => {
    expect(new Set(PROGRAMS.map((p) => p.id)).size).toBe(PROGRAMS.length);
    for (const p of PROGRAMS) {
      expect(p.days.length).toBeGreaterThan(0);
      expect(p.id).toMatch(/^[a-z0-9-]+$/);
      expect(programById(p.id)).toBe(p);
    }
  });

  it("name only free exercises and routines, real drills and real games", () => {
    for (const t of allTasks) {
      if (t.kind === "exercise") expect(isFreeExercise(t.id), t.id).toBe(true);
      if (t.kind === "routine") {
        expect(PROGRAM_ROUTINE_IDS.has(t.id), t.id).toBe(true);
        // Every step of a named routine must be free too, or the routine page
        // would gate part of a free program day.
        for (const s of routineById(t.id)!.steps) expect(isFreeExercise(stepExercise(s).id)).toBe(true);
      }
      if (t.kind === "breath") expect(BREATH_DRILL_IDS).toContain(t.drill);
      if (t.kind === "ear") expect(Object.keys(GAME_NAMES)).toContain(t.game);
    }
  });

  it("restate the ear room's game names exactly as it logs them", () => {
    expect(EAR_GAME_LABELS).toEqual(GAME_NAMES);
  });

  it("compare only what a measurable row supplies", () => {
    const rows = contract.measurement as Record<string, { measurable: string }>;
    for (const p of PROGRAMS) {
      expect(p.measurements.length, p.id).toBeGreaterThan(0);
      for (const m of p.measurements) expect(rows[m]?.measurable, `${p.id}: ${m}`).toBe("yes");
      expect(p.doesNotShow.length, p.id).toBeGreaterThan(40);
    }
  });

  it("promise nothing the contract lists as unmeasured outside doesNotShow", () => {
    // The words a program would have to use to promise a register, vibrato,
    // strain or passaggio outcome. doesNotShow is exempt: naming the limit is
    // the point of it.
    const promise = /strain-free|no strain|vibrato|passaggio|blend|seamless|break (goes|went) away|mix voice|breath support/i;
    for (const p of PROGRAMS) {
      const text = [p.name, p.tagline, p.compare, ...p.days.map((d) => d.focus)].join("\n");
      expect(text, p.id).not.toMatch(promise);
    }
  });

  it("link only to published rooms and params, relatively", () => {
    const rooms = Object.values(contract.deepLinks.rooms);
    for (const t of allTasks) {
      const href = taskHref(t);
      expect(href.startsWith("/"), href).toBe(true);
      const url = new URL(href, "https://x.invalid");
      const room = rooms.find((r) => r.path === url.pathname);
      expect(room, href).toBeDefined();
      for (const key of url.searchParams.keys()) expect(room!.params, href).toContain(key);
    }
  });
});

describe("taskDone reads what the rooms log", () => {
  it("matches an exercise by its title, a drill by its label, a game with or without a variant", () => {
    const day = "2026-10-01";
    expect(taskDone({ kind: "exercise", id: "five-note-scale" }, [log(day, "warmup", exTitle("five-note-scale"))])).toBe(true);
    expect(taskDone({ kind: "exercise", id: "five-note-scale" }, [log(day, "warmup", "Something else")])).toBe(false);
    expect(taskDone({ kind: "breath", drill: "sustain" }, [log(day, "breath", "Sustain test")])).toBe(true);
    expect(taskDone({ kind: "breath", drill: "box" }, [log(day, "breath", "Sustain test")])).toBe(false);
    expect(taskDone({ kind: "ear", game: "interval" }, [log(day, "ear", "Interval ID")])).toBe(true);
    expect(taskDone({ kind: "ear", game: "interval" }, [log(day, "ear", "Interval ID · Easy")])).toBe(true);
    expect(taskDone({ kind: "ear", game: "interval" }, [log(day, "ear", "Interval IDs")])).toBe(false);
    expect(taskDone({ kind: "range" }, [log(day, "range", "Range test")])).toBe(true);
  });

  it("needs every step of a routine", () => {
    const day = "2026-10-01";
    const steps = routineById("quick")!.steps.map((s) => stepExercise(s).title);
    const all = steps.map((t) => log(day, "warmup", t));
    expect(taskDone({ kind: "routine", id: "quick" }, all)).toBe(true);
    expect(taskDone({ kind: "routine", id: "quick" }, all.slice(1))).toBe(false);
  });
});

describe("programProgress", () => {
  const tiny: Program = {
    id: "tiny",
    name: "",
    tagline: "",
    weeks: 1,
    days: [
      { focus: "a", tasks: [{ kind: "range" }] },
      { focus: "b", tasks: [{ kind: "breath", drill: "sustain" }] },
    ],
    compare: "",
    measurements: [],
    doesNotShow: "",
  };

  it("ignores practice before the start day", () => {
    const p = programProgress(tiny, [log("2026-09-30", "range")], "2026-10-01");
    expect(p).toEqual({ doneOn: [null, null], current: 0, countsFrom: "2026-10-01" });
  });

  it("completes at most one program day per calendar day", () => {
    const p = programProgress(
      tiny,
      [log("2026-10-01", "range"), log("2026-10-01", "breath", "Sustain test")],
      "2026-10-01",
    );
    expect(p).toEqual({ doneOn: ["2026-10-01", null], current: 1, countsFrom: "2026-10-02" });
  });

  it("does not skip ahead: day two's tasks done first do not count", () => {
    const p = programProgress(
      tiny,
      [log("2026-10-01", "breath", "Sustain test"), log("2026-10-02", "range")],
      "2026-10-01",
    );
    expect(p).toEqual({ doneOn: ["2026-10-02", null], current: 1, countsFrom: "2026-10-03" });
  });

  it("finishes with current equal to the day count", () => {
    const p = programProgress(
      tiny,
      [log("2026-10-03", "breath", "Sustain test"), log("2026-10-01", "range")],
      "2026-10-01",
    );
    expect(p).toEqual({ doneOn: ["2026-10-01", "2026-10-03"], current: 2, countsFrom: "2026-10-04" });
  });

  it("gathers one program day's tasks across calendar days, as a capped free day needs", () => {
    const two: Program = {
      ...tiny,
      days: [{ focus: "a", tasks: [{ kind: "range" }, { kind: "breath", drill: "sustain" }] }, tiny.days[1]],
    };
    const p = programProgress(
      two,
      [log("2026-10-01", "range"), log("2026-10-03", "breath", "Sustain test")],
      "2026-10-01",
    );
    expect(p).toEqual({ doneOn: ["2026-10-03", null], current: 1, countsFrom: "2026-10-04" });
  });

  it("rolls the day over month ends", () => {
    const p = programProgress(tiny, [log("2026-10-31", "range")], "2026-10-01");
    expect(p.countsFrom).toBe("2026-11-01");
  });
});

describe("parseEnrolment", () => {
  it("accepts a known program with a well-formed day and nothing else", () => {
    expect(parseEnrolment({ programId: "first-two-weeks", startedDay: "2026-10-01" })).toEqual({
      programId: "first-two-weeks",
      startedDay: "2026-10-01",
    });
    expect(parseEnrolment({ programId: "nope", startedDay: "2026-10-01" })).toBeNull();
    expect(parseEnrolment({ programId: "first-two-weeks", startedDay: "yesterday" })).toBeNull();
    expect(parseEnrolment(null)).toBeNull();
    expect(parseEnrolment("first-two-weeks")).toBeNull();
  });
});
