import { describe, expect, it } from "vitest";
import { matchingSessions } from "@/components/learn/practice-count";
import { RETIRED_SONG_TITLES } from "@/components/songs/lib";
import { RETIRED_TITLES } from "@/components/warmups/exercises";
import { MODULE_PRACTICE, practiceMatch } from "@/lib/lesson-practice";
import type { ActivityType, SessionLog } from "@/lib/progress-shape";

let n = 0;
function session(type: ActivityType, detail?: string): SessionLog {
  n++;
  return {
    id: `s${n}`,
    type,
    date: "2026-10-01T09:00:00.000Z",
    day: "2026-10-01",
    durationSec: 120,
    score: 70,
    detail,
    xp: 10,
  };
}

describe("a lesson's practice count", () => {
  it("counts a renamed song's sessions logged under its old title", () => {
    // Stage 4's first module practises the full Amazing Grace arrangement,
    // whose sessions before the round 1 rename were logged as "Verse 1 & 2".
    const match = practiceMatch(MODULE_PRACTICE["v-l4-m1"].companion)!;
    expect(match).toEqual({ type: "song", detail: "Amazing Grace (Opening Lines, Verses 1 & 2)" });
    const old = RETIRED_SONG_TITLES[match.detail!];
    expect(old).toContain("Amazing Grace (Verse 1 & 2)");

    const sessions = [
      session("song", "Amazing Grace (Verse 1 & 2)"),
      session("song", "Amazing Grace (Opening Lines, Verses 1 & 2)"),
      session("song", "Amazing Grace (Opening Lines)"),
      session("warmup", "Amazing Grace (Verse 1 & 2)"),
    ];
    expect(matchingSessions(sessions, match).map((s) => s.id)).toEqual([sessions[0].id, sessions[1].id]);
  });

  it("counts a renamed warm-up's sessions logged under its old title", () => {
    const match = practiceMatch(MODULE_PRACTICE["v-l3-m3"].companion)!;
    expect(match).toEqual({ type: "warmup", detail: "Hung-ee-mm" });
    expect(RETIRED_TITLES["Hung-ee-mm"]).toContain("Hung-ee-mm scale");

    const sessions = [
      session("warmup", "Hung-ee-mm scale"),
      session("warmup", "Hung-ee-mm"),
      session("warmup", "Lip-trill scale"),
      session("song", "Hung-ee-mm"),
      session("warmup"),
    ];
    expect(matchingSessions(sessions, match).map((s) => s.id)).toEqual([sessions[0].id, sessions[1].id]);
  });

  it("still matches other rooms by type, and by exact detail where one is set", () => {
    const sessions = [session("breath", "Sustain test"), session("breath", "Box breathing"), session("range")];
    expect(matchingSessions(sessions, { type: "breath", detail: "Sustain test" })).toEqual([sessions[0]]);
    expect(matchingSessions(sessions, { type: "breath" })).toEqual([sessions[0], sessions[1]]);
    expect(matchingSessions(sessions, { type: "range" })).toEqual([sessions[2]]);
  });
});
