import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EarTrainingClient from "./ear-training-client";

describe("the ear room on a deep link's first load", () => {
  // The server HTML, and every render until the room has read its address:
  // the front page behind the deep-link marker, then the screen-tall block
  // that takes its place when the pre-paint script found a workout the room
  // will open (/ear-training?routine=quick, a program row's link), so the
  // workout opens over a page that never painted the front page
  // (components/prepaint.tsx), as on /breath.
  it("keeps the heading, holds the whole front page behind the marker, and ends on the slot", () => {
    const html = renderToStaticMarkup(<EarTrainingClient />);
    const marker = html.indexOf('<div data-prepaint-deeplink="ear">');
    expect(marker).toBeGreaterThan(html.indexOf("Ear training for singers</h1>"));
    for (const part of [
      'id="free-cap"',
      "Free guided practice today",
      "Today&#x27;s ear routine",
      "Ear training routines",
      "Three stars on every game",
      "need a microphone",
    ]) {
      expect(html.indexOf(part), part).toBeGreaterThan(marker);
    }
    expect(html).toMatch(
      /listen\.<\/p><\/div><div aria-hidden="true" class="min-h-screen" data-prepaint-slot="deeplink-ear"><\/div><\/main>$/,
    );
  });
});
