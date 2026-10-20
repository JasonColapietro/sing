import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SessionLog } from "@/lib/progress";
import { PracticeCalendar } from "./calendar";
import { MinutesBarChart, PracticeMixChart } from "./charts";
import { durationWords, localDayStr } from "./format";

/** One logged session today, `sec` long. */
function today(sec: number, type: SessionLog["type"] = "warmup"): SessionLog {
  return {
    id: `s-${sec}`,
    type,
    date: new Date().toISOString(),
    day: localDayStr(new Date()),
    durationSec: sec,
    detail: "First hum",
    xp: 4,
  };
}

const text = (html: string) => html.replace(/<!-- -->/g, "");

describe("durationWords", () => {
  it.each([
    [0, "0 seconds"],
    [1, "1 second"],
    [16, "16 seconds"],
    [59.4, "59 seconds"],
    [60, "1 minute"],
    [89, "1 minute"],
    [90, "2 minutes"],
    [2520, "42 minutes"],
  ])("%s s reads %s", (sec, words) => {
    expect(durationWords(sec)).toBe(words);
  });
});

/**
 * A first 16-second warmup: the session log said "16s today" and the
 * calendar counted an active day, while every total in whole minutes
 * rounded it to nothing.
 */
describe("a short first session on the progress charts", () => {
  const first = [today(16)];

  it("counts the day in the last 14 days instead of reporting no practice", () => {
    const html = text(renderToStaticMarkup(<MinutesBarChart sessions={first} />));
    expect(html).toContain("16 seconds across 1 of the last 14 days.");
    expect(html).not.toContain("No practice logged");
    expect(html).toContain("16 seconds total across 1 active day.");
    // The tallest bar's label and its tooltip in seconds, not "0m".
    expect(html).toContain(">16s</text>");
    expect(html).not.toContain(">0m<");
  });

  it("leads the practice mix with the seconds sung", () => {
    const html = text(renderToStaticMarkup(<PracticeMixChart sessions={first} />));
    expect(html).toContain("Warmup leads with 16 seconds.");
    expect(html).not.toContain("0 minutes");
    expect(html).toContain(">16s</text>");
  });

  it("totals the calendar in seconds too", () => {
    const html = text(renderToStaticMarkup(<PracticeCalendar sessions={first} />));
    expect(html).toContain("1 active day and 16 seconds in the last 12 weeks.");
    expect(html).not.toContain("0 minutes");
    // The squares are AMBER since the original palette came back (#229); the
    // label a screen reader hears said violet.
    expect(html).toContain("1 active day, 16 seconds total. Darker gold squares mean more minutes that day.");
    expect(html).not.toMatch(/violet/i);
  });

  it("still says nothing was logged when nothing was", () => {
    const html = text(renderToStaticMarkup(<MinutesBarChart sessions={[]} />));
    expect(html).toContain("No practice logged in the last 14 days.");
  });

  it("keeps whole minutes once there are minutes to count", () => {
    const html = text(renderToStaticMarkup(<MinutesBarChart sessions={[today(240), today(2280, "song")]} />));
    expect(html).toContain("42 minutes across 1 of the last 14 days.");
    const mix = text(renderToStaticMarkup(<PracticeMixChart sessions={[today(240), today(2280, "song")]} />));
    expect(mix).toContain("Song leads with 38 minutes.");
  });
});
