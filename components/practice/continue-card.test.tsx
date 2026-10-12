/**
 * The Lessons rooms' first card on a phone.
 *
 * /warmups, /ear-training and /breath open on ContinueCard, whose start
 * button used to sit under the tagline, chips and goal ring — on a 375×667
 * phone, under the tab bar. Below sm the card is one flex column that orders
 * the button straight under the title; DOM order (focus and reading order)
 * stays as it was, and from sm up the two columns are unchanged.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContinueCard } from "./learn-home";

const noop = () => {};

function classOf(html: string, marker: string): string {
  const at = html.indexOf(marker);
  expect(at, marker).toBeGreaterThan(-1);
  const open = html.lastIndexOf("<", at);
  return /class="([^"]*)"/.exec(html.slice(open, html.indexOf(">", open)))?.[1] ?? "";
}

describe("ContinueCard on a phone", () => {
  const html = renderToStaticMarkup(
    <ContinueCard kicker="Start here" title="First hum" tagline="A short first exercise."
      stepTitles={["Hum", "Slide", "Hold"]} goal={{ doneSec: 0, goalSec: 300 }}
      onStart={noop} micReady={false} error={null} streakDays={0} />,
  );

  it("orders the start button straight after the title, ahead of the tagline, chips and goal", () => {
    expect(classOf(html, ">First hum<")).toMatch(/\border-1\b/);
    expect(classOf(html, "Enable mic and start")).toMatch(/\border-2\b/);
    expect(classOf(html, ">A short first exercise.<")).toMatch(/\border-3\b/);
    expect(classOf(html, 'aria-label="What is inside"')).toMatch(/\border-3\b/);
    // The goal ring's row follows the chips on a phone and sits above the
    // button again from sm up.
    expect(html).toContain('class="order-3 mt-4 flex items-center gap-3 sm:order-none');
    expect(html.indexOf("Today&#x27;s goal")).toBeGreaterThan(html.indexOf('aria-label="What is inside"'));
  });

  it("keeps the order and spacing to phones: from sm up the columns lay out as before", () => {
    expect(classOf(html, "Enable mic and start")).toMatch(/\bsm:order-none\b/);
    expect(html.match(/class="contents sm:/g)).toHaveLength(2);
    // Under the full-width button on a phone the tagline gets a full step of
    // space; under the title from sm up it keeps its old mt-2.
    expect(classOf(html, ">A short first exercise.<")).toMatch(/\bmt-4\b.*\bsm:mt-2\b/);
  });

  it("leaves DOM order alone, so focus and reading order are unchanged", () => {
    expect(html.indexOf("A short first exercise.")).toBeLessThan(html.indexOf("Enable mic and start"));
  });
});
