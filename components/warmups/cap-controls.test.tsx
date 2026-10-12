import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ContinueCard } from "@/components/practice/learn-home";
import { DEFAULT_PROGRESS } from "@/lib/progress-shape";
import { planDailyThree } from "@/lib/daily-three";
import { DailyThreeCard } from "./daily-three-card";
import { PathSection, RoutineGrid } from "./routine-home";

vi.mock("@/lib/pro", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/pro")>(),
  useIsPro: () => false,
}));

const reason = "Free practice is used for today. It resets at midnight.";
const noop = () => {};

describe("warmup starts after the daily allowance", () => {
  it("disables the continue action and explains why beside the button", () => {
    const html = renderToStaticMarkup(
      <ContinueCard kicker="Continue" title="Humming" onStart={noop}
        micReady={false} error={null} streakDays={0} unavailableReason={reason} />,
    );
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>/);
    expect(html).toContain("aria-describedby=");
    expect(html).toContain(reason);
  });

  it("keeps daily picks visible but prevents starting or deep-linking a capped pick", () => {
    const html = renderToStaticMarkup(
      <DailyThreeCard plan={planDailyThree({ sessions: [], day: "2026-09-03" })}
        done={[]} onStart={noop} error={null} errorExerciseId={null} unavailableReason={reason} />,
    );
    expect(html).toContain(reason);
    expect(html).not.toContain('href="/warmups?exercise=');
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(3);
  });

  it("disables free routines while keeping paid-pack navigation available", () => {
    const html = renderToStaticMarkup(
      <RoutineGrid progress={DEFAULT_PROGRESS} onStart={noop} error={null}
        errorRoutineId={null} unavailableReason={reason} />,
    );
    const starts = html.match(/<button[^>]*>/g) ?? [];
    expect(starts.length).toBeGreaterThan(0);
    expect(starts.every((button) => button.includes('disabled=""'))).toBe(true);
    expect(html).toContain(reason);
    expect(html).toContain('href="/pro"');
  });

  it("disables path exercises while preserving the range test and Pro links", () => {
    const html = renderToStaticMarkup(
      <PathSection progress={DEFAULT_PROGRESS} onSelect={noop} micReady={false}
        error={null} errorExerciseId={null} unavailableReason={reason} />,
    );
    const starts = html.match(/<button[^>]*>/g) ?? [];
    expect(starts.length).toBeGreaterThan(0);
    expect(starts.every((button) => button.includes('disabled=""'))).toBe(true);
    expect(html).toContain(reason);
    expect(html).toContain('href="/range?mode=range#start"');
    expect(html).toContain('href="/pro"');
  });

  it("keeps daily exercise links available when the allowance is open", () => {
    const html = renderToStaticMarkup(
      <DailyThreeCard plan={planDailyThree({ sessions: [], day: "2026-09-03" })}
        done={[]} onStart={noop} error={null} errorExerciseId={null} />,
    );
    expect(html.match(/href="\/warmups\?exercise=/g)).toHaveLength(3);
    expect(html).not.toContain('disabled=""');
  });
});
