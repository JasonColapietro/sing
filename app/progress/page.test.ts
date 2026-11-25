import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  ACHIEVEMENTS,
  MAX_LEVEL,
  XP_MAX_PER_SESSION,
  XP_MIN_PER_SESSION,
  XP_PER_ACHIEVEMENT,
  XP_PER_MINUTE,
  XP_SCORE_BONUSES,
} from "@/lib/progress";
import { PROGRESS_FAQ } from "./page";

/**
 * The /progress FAQ states the tracker's earn rate in plain numbers, because
 * the server page cannot import lib/progress.ts (a "use client" module). This
 * keeps those numbers equal to the ones the tracker actually runs on.
 */
describe("/progress FAQ matches the tracker", () => {
  const xp = PROGRESS_FAQ.find((f) => f.q === "How do I earn XP?")!.a;
  const [top, mid, low] = XP_SCORE_BONUSES;

  it("states the per-minute rate and the per-session floor and cap", () => {
    expect(xp).toContain(`earns ${XP_PER_MINUTE} XP a minute`);
    expect(xp).toContain(`at least ${XP_MIN_PER_SESSION} and at most ${XP_MAX_PER_SESSION} XP`);
  });

  it("states the score bonuses", () => {
    expect(xp).toContain(`${low.xp} XP for a score of ${low.minScore} or more`);
    expect(xp).toContain(`${mid.xp} for ${mid.minScore}`);
    expect(xp).toContain(`${top.xp} for ${top.minScore}`);
  });

  it("states the achievement count, bonus and level cap", () => {
    expect(xp).toContain(`Each of the ${ACHIEVEMENTS.length} achievements adds ${XP_PER_ACHIEVEMENT} XP`);
    expect(xp).toContain(`from 1 to ${MAX_LEVEL}`);
  });

  it("names streak achievements that exist", () => {
    const streak = PROGRESS_FAQ.find((f) => f.q === "How does the practice streak work?")!.a;
    const ids = ACHIEVEMENTS.map((a) => a.id);
    for (const days of [3, 7, 30]) expect(ids).toContain(`streak-${days}`);
    expect(streak).toContain("3, 7 and 30 days");
  });
});
