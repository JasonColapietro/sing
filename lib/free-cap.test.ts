import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type ProgressState, type SessionLog } from "./progress-shape";
import {
  CAPPED_TYPES,
  FREE_DAILY_SEC,
  formatClock,
  freeSecondsLeft,
  guidedSecondsToday,
  isCapped,
  sizeToAllowance,
  subscribePracticeDay,
} from "./free-cap";
import { localDay } from "./progress";

const DAY = "2026-09-03";

function session(type: SessionLog["type"], durationSec: number, day = DAY): SessionLog {
  return {
    id: `${type}-${durationSec}-${day}`,
    type,
    date: `${day}T12:00:00.000Z`,
    day,
    durationSec,
    xp: 4,
  };
}

function state(...sessions: SessionLog[]): ProgressState {
  return { ...DEFAULT_PROGRESS, sessions };
}

describe("free daily cap", () => {
  it("is five minutes, and covers exactly the four guided rooms", () => {
    expect(FREE_DAILY_SEC).toBe(300);
    expect([...CAPPED_TYPES].sort()).toEqual(["breath", "ear", "song", "warmup"]);
  });

  it("counts only guided practice logged today", () => {
    const s = state(
      session("warmup", 60),
      session("ear", 30),
      session("pitch", 500), // the studio is never counted
      session("range", 120), // nor the range test
      session("song", 45, "2026-09-02"), // nor yesterday
    );
    expect(guidedSecondsToday(s, DAY)).toBe(90);
  });

  it("runs the allowance down and stops at zero", () => {
    expect(freeSecondsLeft(state(), false, DAY)).toBe(300);
    expect(freeSecondsLeft(state(session("warmup", 100)), false, DAY)).toBe(200);
    expect(freeSecondsLeft(state(session("warmup", 400)), false, DAY)).toBe(0);
    expect(isCapped(state(session("warmup", 299)), false, DAY)).toBe(false);
    expect(isCapped(state(session("warmup", 300)), false, DAY)).toBe(true);
  });

  it("never caps Pro", () => {
    const heavy = state(session("warmup", 3600), session("song", 3600));
    expect(freeSecondsLeft(heavy, true, DAY)).toBe(Number.POSITIVE_INFINITY);
    expect(isCapped(heavy, true, DAY)).toBe(false);
  });

  it("resets with the calendar day", () => {
    const s = state(session("warmup", 500, "2026-09-02"));
    expect(isCapped(s, false, "2026-09-02")).toBe(true);
    expect(isCapped(s, false, "2026-09-03")).toBe(false);
  });

  it("formats the readout as m:ss", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(130)).toBe("2:10");
    expect(formatClock(180)).toBe("3:00");
  });
});

describe("daily allowance rollover", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function observeAllowance() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 3, 23, 59, 45));
    const visibility = new EventTarget();
    const document = Object.assign(visibility, { visibilityState: "visible" });
    vi.stubGlobal("window", { setTimeout, clearTimeout });
    vi.stubGlobal("document", document);
    const progress = state(session("warmup", FREE_DAILY_SEC, localDay()));
    let capped = isCapped(progress, false);
    const changes: boolean[] = [];
    const unsubscribe = subscribePracticeDay(() => {
      capped = isCapped(progress, false);
      changes.push(capped);
    });
    return { document, unsubscribe, changes, capped: () => capped };
  }

  it("restores the allowance at local midnight without a new session or reload", () => {
    const observed = observeAllowance();
    expect(observed.capped()).toBe(true);
    vi.advanceTimersByTime(14_999);
    expect(observed.capped()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(observed.capped()).toBe(false);
    observed.unsubscribe();
  });

  it("refreshes on return to a tab whose timers were suspended overnight", () => {
    const observed = observeAllowance();
    observed.document.visibilityState = "hidden";
    vi.setSystemTime(new Date(2026, 8, 4, 9));
    observed.document.dispatchEvent(new Event("visibilitychange"));
    expect(observed.capped()).toBe(true);
    observed.document.visibilityState = "visible";
    observed.document.dispatchEvent(new Event("visibilitychange"));
    expect(observed.capped()).toBe(false);
    observed.unsubscribe();
  });

  it("removes its timer and visibility listener when the room closes", () => {
    const observed = observeAllowance();
    observed.unsubscribe();
    vi.advanceTimersByTime(60_000);
    observed.document.dispatchEvent(new Event("visibilitychange"));
    expect(observed.changes).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("sizeToAllowance", () => {
  const sec = (r: { sec: number }) => r.sec;
  const long = { id: "long", sec: 400 };
  const mid = { id: "mid", sec: 250 };
  const short = { id: "short", sec: 100 };

  it("keeps a pick that fits, and on Pro", () => {
    expect(sizeToAllowance(long, [short], sec, 400)).toBe(long);
    expect(sizeToAllowance(long, [short], sec, Number.POSITIVE_INFINITY)).toBe(long);
  });

  it("takes the first fallback that fits, shortest first", () => {
    expect(sizeToAllowance(long, [mid, short], sec, 300)).toBe(mid);
    expect(sizeToAllowance(long, [mid, short], sec, 120)).toBe(short);
    expect(sizeToAllowance(long, [null, short], sec, 120)).toBe(short);
  });

  it("lets the pick stand when nothing shorter would finish either", () => {
    expect(sizeToAllowance(long, [mid, short], sec, 60)).toBe(long);
  });
});
