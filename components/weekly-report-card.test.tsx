/**
 * The "Your week" card's next step, rendered. A suggestion carries the
 * session table's pill label ("Song", "Pitch"), and the card used to drop it
 * into the sentence and the link: "You didn't open Song last week … Open
 * Song". The card now names each room the way a sentence does, and the
 * free-minutes note shows only for rooms on the free plan's daily allowance.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Suggestion } from "@/components/weekly-report-card";
import { TYPE_META } from "@/components/progress/format";
import { CAPPED_TYPES } from "@/lib/free-cap";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import type { ActivityType } from "@/lib/progress-shape";
import type { WeeklySuggestion } from "@/lib/weekly-report";

const ALL_TYPES = Object.keys(TYPE_META) as ActivityType[];

/** A suggestion as weekInReview builds it: label and href from TYPE_META. */
function neglected(type: ActivityType, before = 3): WeeklySuggestion {
  return { kind: "neglected", type, label: TYPE_META[type].label, href: TYPE_META[type].href, before };
}

function weakest(type: ActivityType, average = 40, overall = 63): WeeklySuggestion {
  return { kind: "weakest", type, label: TYPE_META[type].label, href: TYPE_META[type].href, average, overall };
}

function render(suggestion: WeeklySuggestion, isPro = false): string {
  return renderToStaticMarkup(<Suggestion suggestion={suggestion} isPro={isPro} onFollow={() => {}} />);
}

/** Visible text, tags stripped and React's escapes undone. */
function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"');
}

/** The one link's href and label. */
function link(html: string): { href: string; label: string } {
  const m = /<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/.exec(html);
  expect(m, html).not.toBeNull();
  return { href: m![1], label: text(m![2]) };
}

describe("the weekly report card's next step", () => {
  it("names a dropped song habit as song practice, not 'Open Song'", () => {
    const html = render(neglected("song", 7));
    expect(text(html)).toContain(
      "You didn't open song practice last week, after 7 sessions there in the three weeks before.",
    );
    expect(link(html)).toEqual({ href: "/songs", label: "Open song practice" });
    expect(text(html)).not.toMatch(/\bopen Song\b|Open Song\b/);
  });

  it("names a dropped pitch habit by both rooms that log it, and links the studio", () => {
    const html = render(neglected("pitch"));
    expect(text(html)).toContain("You didn't open the pitch meter or pitch studio last week");
    expect(link(html)).toEqual({ href: "/studio", label: "Open the pitch studio" });
  });

  it("credits pitch scores to the studio, the only room that scores them", () => {
    const html = render(weakest("pitch", 40, 63));
    expect(text(html)).toContain(
      "Scores in the pitch studio averaged 40% against 63% across your week, the widest gap of any room.",
    );
    expect(text(html)).not.toContain("pitch meter");
    expect(link(html)).toEqual({ href: "/studio", label: "Practice in the pitch studio" });
  });

  it("never puts a pill label in the sentence or the link, for any room", () => {
    for (const type of ALL_TYPES) {
      const pill = TYPE_META[type].label;
      for (const s of [neglected(type), weakest(type)]) {
        const html = render(s);
        const body = text(html);
        // "You didn't open Song", "Song averaged", "Open Song", "Practice Ear".
        expect(body, `${type} ${s.kind}`).not.toMatch(new RegExp(`\\bopen ${pill}\\b|^Next: ${pill} averaged`));
        const { href, label } = link(html);
        expect(href, type).toBe(TYPE_META[type].href);
        expect(label, type).not.toBe(`Open ${pill}`);
        expect(label, type).not.toBe(`Practice ${pill}`);
        expect(label, type).toMatch(/^(?:Open|Practice|Record) [a-z]/);
      }
    }
  });

  it("tells a free singer about the daily minutes only for rooms on the allowance", () => {
    const note = `share ${FREE_DAILY_MINUTES} guided minutes a day`;
    for (const type of ALL_TYPES) {
      const body = text(render(neglected(type)));
      if (CAPPED_TYPES.has(type)) expect(body, type).toContain(note);
      else expect(body, type).not.toContain(note);
    }
    // The pitch studio, range test, recorder and tools have no clock.
    for (const type of ["pitch", "range", "recording", "tools"] as const) {
      expect(text(render(weakest(type))), type).not.toContain(note);
    }
    // Pro never sees the note.
    expect(text(render(neglected("song"), true))).not.toContain(note);
  });

  it("sends the habit steps to a warmup, with the free-minutes note", () => {
    const more = render({ kind: "more-days", days: 1 });
    expect(text(more)).toContain("You practiced on 1 day. Aim for one more this week; a short session counts.");
    expect(link(more)).toEqual({ href: "/warmups", label: "Start a warmup" });
    expect(text(more)).toContain(`share ${FREE_DAILY_MINUTES} guided minutes a day`);
    const keep = render({ kind: "keep-going", days: 4 }, true);
    expect(text(keep)).toContain("4 practice days last week. Match that this week to keep the habit.");
    expect(link(keep)).toEqual({ href: "/warmups", label: "Start a warmup" });
    expect(text(keep)).not.toContain("guided minutes");
  });
});

describe("the free-plan line's way past the limit", () => {
  it("links to the buy card, except in a guided room that has its own allowance line", () => {
    const withLink = render(neglected("warmup"));
    expect(withLink).toMatch(/<a[^>]*href="\/pro#buy"[^>]*>Pro has no daily limit<\/a>/);
    const inRoom = renderToStaticMarkup(
      <Suggestion suggestion={neglected("warmup")} isPro={false} onFollow={() => {}} proLink={false} />,
    );
    expect(inRoom).not.toContain("/pro#buy");
    expect(render(neglected("warmup"), true)).not.toContain("/pro#buy");
  });
});
