import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it, vi } from "vitest";

// Every room's own rule, run with a mic that heard nothing. The default
// logSession is a spy, so a rule that falls through to the real call fails.
const fixture = vi.hoisted(() => ({ log: vi.fn(() => ({ xpGained: 9, newAchievements: [] })) }));
vi.mock("@/lib/progress", async (original) => ({
  ...(await original<typeof import("@/lib/progress")>()),
  logSession: fixture.log,
}));
vi.mock("@/lib/pro", () => ({ useIsPro: () => false, useProReady: () => true }));

import { createPracticeClock } from "@/lib/practice-clock";
import { finishStudioSession } from "@/components/studio/studio-client";
import { emptyTargetStats } from "@/components/studio/target-practice";
import { finishMeterRun } from "@/components/range/pitch-meter";
import { countedRange } from "@/components/range/range-test";
import { emptyListenLog, listen, takeChunk, takeTail } from "@/components/analyze/listen-log";
import { takeLogSeconds } from "@/components/recorder/runtime";
import { runHearing } from "@/components/songs/lib";
import { unsungRepAction } from "@/components/warmups/exercise-player";
import { sungReps } from "@/components/warmups/lib";
import { earGameCredits } from "@/components/ear/session";
import { GAME_MIC } from "@/components/ear/routines";
import type { GameId } from "@/components/ear/lib";
import { createHeardLatch, creditedSeconds, hearFrame } from "./silent-session";

const ROOT = join(__dirname, "..", "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

/** A practice clock that has run `ms` and is still running. */
function ranFor(ms: number) {
  let t = 0;
  const clock = createPracticeClock(() => t);
  clock.resume();
  t = ms;
  return clock;
}

/**
 * Every file that writes practice to the progress store, and how a session
 * the mic heard nothing of is refused there. `silent` drives the room's real
 * rule with a silent input and returns true when nothing is credited; `test`
 * names the test that plays the real component through silence instead.
 */
type Room =
  | { mic: true; silent?: () => boolean; test?: { file: string; title: string } }
  | { mic: false; why: string };

const ROOMS: Record<string, Room> = {
  "components/studio/studio-client.tsx": {
    mic: true,
    silent: () => {
      const result = finishStudioSession({ clock: ranFor(300_000), stats: { current: emptyTargetStats() }, heardMs: { current: 0 } });
      return result?.log === null && result.silent === true;
    },
  },
  "components/range/pitch-meter.tsx": {
    mic: true,
    silent: () => {
      const result = finishMeterRun(ranFor(300_000), { current: 0 });
      return result?.log === null && result.silent;
    },
  },
  "components/range/range-test.tsx": {
    mic: true,
    // Nothing is saved or logged without a span: no note held, no anchor.
    silent: () => !countedRange(null, null, null).savable,
  },
  "components/analyze/analyze-client.tsx": {
    mic: true,
    silent: () => {
      const log = emptyListenLog();
      for (let i = 0; i < 4000; i++) listen(log, 0.1, null);
      return !takeChunk(log, 300) && takeTail(log, 15) === null;
    },
  },
  "components/recorder/recorder-page.tsx": {
    mic: true,
    silent: () => takeLogSeconds(300, false) === null,
  },
  "components/songs/song-player.tsx": {
    mic: true,
    // Every note's window closed, no voiced frame landed on any of them.
    silent: () =>
      runHearing(Array(24).fill(0), 24) === "silent" &&
      /silent \? null : logSession\(/.test(read("components/songs/song-player.tsx")),
  },
  "components/warmups/exercise-player.tsx": {
    mic: true,
    // However many reps go unsung, a session with none sung leaves unlogged.
    silent: () =>
      [1, 2, 50].every((unsung) => unsungRepAction(unsung, sungReps([]).length) !== "finish"),
  },
  "components/ear/session.tsx": {
    mic: true,
    silent: () =>
      (Object.keys(GAME_MIC) as GameId[]).filter((g) => GAME_MIC[g]).every((g) => !earGameCredits(g, false)),
    test: { file: "components/ear/silent-game.test.tsx", title: "plays out in silence and logs nothing" },
  },
  "components/breath/breath-cue-drill.tsx": {
    mic: true,
    test: {
      file: "components/breath/breath-cue-drill-interruption.test.tsx",
      title: "logs nothing however long it ran, timed breath or detected",
    },
  },
  "components/breath/sustain-test.tsx": {
    mic: true,
    test: {
      file: "components/breath/sustain-interruption.test.tsx",
      title: "logs nothing however long the silence runs, timed breath or detected",
    },
  },
  "components/breath/box-breathing.tsx": { mic: false, why: "No microphone needed." },
  "components/breath/farinelli-drill.tsx": { mic: false, why: "No microphone needed." },
  "components/tools/tools-page.tsx": { mic: false, why: "Metronome, drone and piano only play." },
};

/** Source files (not tests) under components/ and app/ that import logSession. */
function loggingFiles(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        if (name !== "node_modules") walk(path);
      } else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) {
        const src = readFileSync(path, "utf8");
        if (/import\s*\{[^}]*\blogSession\b[^}]*\}\s*from\s*"@\/lib\/progress"/.test(src)) {
          found.push(relative(ROOT, path));
        }
      }
    }
  };
  walk(join(ROOT, "components"));
  walk(join(ROOT, "app"));
  return found.sort();
}

describe("no practice credit for silence, in every room that logs", () => {
  it("knows every room that writes practice", () => {
    // A new room that logs practice lands here first: say whether it listens,
    // and if it does, how it refuses a session that heard nothing.
    expect(loggingFiles()).toEqual(Object.keys(ROOMS).sort());
  });

  it("names a mic room's silent rule in a room that listens, and no mic in one that does not", () => {
    for (const [file, room] of Object.entries(ROOMS)) {
      const src = read(file);
      const listens = /usePitch|useAnalyser|UsePitchResult|getStream|soundHeard|EarSession/.test(src);
      expect(listens, file).toBe(room.mic);
      if (room.mic) expect(room.silent ?? room.test, file).toBeDefined();
    }
  });

  it.each(Object.entries(ROOMS).filter(([, r]) => r.mic && r.silent))("%s refuses a silent session", (_file, room) => {
    fixture.log.mockClear();
    expect((room as { silent: () => boolean }).silent()).toBe(true);
    expect(fixture.log).not.toHaveBeenCalled();
  });

  it.each(Object.entries(ROOMS).filter(([, r]) => r.mic && r.test))("%s plays a silent session through in its own test", (_file, room) => {
    const { file, title } = (room as { test: { file: string; title: string } }).test;
    expect(read(file)).toContain(title);
  });
});

describe("the shared silent-session helpers", () => {
  it("credits time only once something was heard", () => {
    const latch = createHeardLatch();
    hearFrame(latch, false);
    expect(creditedSeconds(600, 10, latch.heard)).toBeNull();
    hearFrame(latch, true);
    hearFrame(latch, false);
    expect(latch.heard).toBe(true);
    expect(creditedSeconds(600, 10, latch.heard)).toBe(600);
    expect(creditedSeconds(9, 10, latch.heard)).toBeNull();
  });
});
