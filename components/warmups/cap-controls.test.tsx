import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ContinueCard } from "@/components/practice/learn-home";
import { DEFAULT_PROGRESS } from "@/lib/progress-shape";
import { planDailyThree } from "@/lib/daily-three";
import { DailyThreeCard } from "./daily-three-card";
import { PathSection, RoutineGrid, lockedPackLabel } from "./routine-home";
import { PRO_ROUTINES, ROUTINES } from "./routines";
import { PRO_PACKS_ANCHOR, PRO_PACKS_HREF } from "@/lib/pro-inventory";

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
    // Was one "Unlock the pro packs: $79 once" link per locked card: eight
    // identical asks, all of them painted for a Pro owner until hydration.
    // Now the price is one line above the packs and each card is a link.
    expect(html).not.toContain('href="/pro"');
    expect(html.match(/<a[^>]*href="\/pro#buy"[^>]*>Unlock the pro packs: \$79 once<\/a>/g)).toHaveLength(1);
    expect(html.match(/href="\/pro#buy"/g)).toHaveLength(PRO_ROUTINES.length + 1);
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
    // The locked pack rows go to the buy card, not the top of /pro.
    expect(html).toContain('href="/pro#buy"');
    expect(html).not.toContain('href="/pro"');
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

describe("the locked pro packs on /warmups", () => {
  const html = renderToStaticMarkup(
    <RoutineGrid progress={DEFAULT_PROGRESS} onStart={noop} error={null} errorRoutineId={null} />,
  ).replace(/<!-- -->/g, "");
  const anchors = [...html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/g)].map((m) => ({
    attrs: m[1],
    text: m[2].replace(/<[^>]+>/g, ""),
  }));

  it("prices the packs once, in a line the pre-paint hides from a Pro owner", () => {
    // The server HTML is the same for everyone, so anything priced in it has
    // to sit inside the not-pro marker app/globals.css hides for
    // html[data-sing-plan="pro"]. The per-card footers did not.
    const priced = [...html.matchAll(/\$\d+/g)];
    const ask = html.match(/<p[^>]*data-prepaint-plan="not-pro"[^>]*>.*?<\/p>/)?.[0] ?? "";
    expect(ask).toContain(`The ${PRO_ROUTINES.length} packs below open with Pro.`);
    expect(ask).toMatch(/<a[^>]*href="\/pro#buy"[^>]*>Unlock the pro packs: \$79 once<\/a>/);
    const outside = html.replace(ask, "").replace(/aria-label="[^"]*"/g, "");
    expect(priced.length).toBeGreaterThan(0);
    expect(outside).not.toMatch(/\$\d/);
    expect(outside).not.toContain("Unlock the pro packs");
    // Above the packs, after the free routines.
    expect(html.indexOf(ask)).toBeGreaterThan(html.indexOf(`>${ROUTINES[ROUTINES.length - 1].name}<`));
    expect(html.indexOf(ask)).toBeLessThan(html.indexOf(`>${PRO_ROUTINES[0].name}<`));
  });

  it("makes each locked card one link to the buy card, named for the pack, Pro and the price", () => {
    for (const routine of PRO_ROUTINES) {
      const label = lockedPackLabel(routine);
      expect(label).toBe(`${routine.name}: unlocks with Pro, $79 once`);
      const card = anchors.filter((a) => a.attrs.includes(`aria-label="${label}"`));
      expect(card, routine.id).toHaveLength(1);
      expect(card[0].attrs).toContain('href="/pro#buy"');
      // The link wraps the whole card: its heading and its meta line.
      expect(card[0].text).toContain(routine.name);
      expect(card[0].text).toContain(`${routine.steps.length} exercises`);
      // No link inside a link, and no priced words on the card itself.
      expect(card[0].text).not.toMatch(/\$\d|Unlock/);
    }
  });
});

describe("the Pro packs anchor /pro sends buyers to", () => {
  it("sits once, on the first Pro routine card, after every free routine", () => {
    const html = renderToStaticMarkup(
      <RoutineGrid progress={DEFAULT_PROGRESS} onStart={noop} error={null} errorRoutineId={null} />,
    );
    expect(PRO_PACKS_HREF).toBe(`/warmups#${PRO_PACKS_ANCHOR}`);
    const anchor = `id="${PRO_PACKS_ANCHOR}"`;
    expect(html.split(anchor)).toHaveLength(2);
    const anchorAt = html.indexOf(anchor);
    for (const routine of ROUTINES) {
      // Found at all, then above the anchor: a missing name (-1) would
      // otherwise pass the ordering check by accident.
      const at = html.indexOf(`>${routine.name}<`);
      expect(at, routine.id).toBeGreaterThanOrEqual(0);
      expect(at, routine.id).toBeLessThan(anchorAt);
    }
    // The first heading after the anchor is the first Pro pack's.
    const nextHeading = html.slice(anchorAt).match(/<h3[^>]*>([^<]*)<\/h3>/);
    expect(nextHeading?.[1]).toBe(PRO_ROUTINES[0].name);
  });
});
