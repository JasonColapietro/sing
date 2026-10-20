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

  // The prerender is a newcomer's kicker and "Start a streak today"; a
  // returning singer hydrates to another kicker and chip. Side by side, the
  // pair fit on one line or not depending on both texts, so the title and
  // start button under them moved at hydration (0.085 at 375 on
  // /ear-training). Stacked on a phone, the row's height cannot depend on
  // either text.
  it("stacks the kicker and streak chip on a phone, so the row is one height whatever they say", () => {
    // The row is the div that opens straight before the kicker's label.
    const rowOpen = html.lastIndexOf("<div", html.indexOf(">Start here<"));
    const rowClass = /class="([^"]*)"/.exec(html.slice(rowOpen, html.indexOf(">", rowOpen)))?.[1] ?? "";
    expect(rowClass).toMatch(/\border-1\b/);
    expect(rowClass).toMatch(/(^|\s)flex-col(\s|$)/);
    expect(rowClass).toMatch(/(^|\s)items-start(\s|$)/);
    expect(rowClass).toMatch(/\bsm:flex-row\b/);
    expect(rowClass).toMatch(/\bsm:flex-wrap\b/);
    // No unprefixed flex-wrap: on a phone the pair must never share a line.
    expect(rowClass.split(/\s+/)).not.toContain("flex-wrap");
    // Both the kicker and the chip sit inside that row.
    const rowEnd = html.indexOf("</h2>", rowOpen);
    expect(html.slice(rowOpen, rowEnd)).toContain("Start a streak today");
  });
});

describe("ContinueCard's star line", () => {
  const card = (stars: 0 | 1 | 3, started?: boolean) =>
    renderToStaticMarkup(
      <ContinueCard kicker="Back for more" title="Quick breath" stars={stars} started={started}
        onStart={noop} micReady error={null} streakDays={1} />,
    );

  it("says So far, not Not started, for a set done on stars that average under one", () => {
    expect(card(0, true)).toContain(">So far<");
    expect(card(0, true)).not.toContain("Not started");
  });

  it("says Not started only when nothing has been done", () => {
    expect(card(0, false)).toContain(">Not started<");
    expect(card(0)).toContain(">Not started<");
    expect(card(1)).toContain(">So far<");
    expect(card(3, true)).toContain(">All three stars<");
  });
});
