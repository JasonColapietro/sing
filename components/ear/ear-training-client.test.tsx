import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EarTrainingClient from "./ear-training-client";
import { GAME_NAMES, type GameId } from "./lib";
import { GAME_MIC } from "./routines";
import { earGameCredits } from "./session";

describe("the ear room on a deep link's first load", () => {
  // The server HTML, and every render until the room has read its address:
  // the front page behind the deep-link marker, then the screen-tall block
  // that takes its place when the pre-paint script found a routine the room
  // will open (/ear-training?routine=quick, a program row's link), so the
  // routine opens over a page that never painted the front page
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

describe("the ear room's song chase level", () => {
  // The server render has no saved range: the phrase sits in C3–E4 then.
  it("says where the phrase sits until the range test is saved", () => {
    const html = renderToStaticMarkup(<EarTrainingClient />);
    expect(html).toContain("moved into your saved range, or into C3–E4 until you take the range test.");
  });
});

describe("the ear room's promise of credit", () => {
  // A finished game in a room that listens logs nothing when the mic heard no
  // note (earGameCredits), so the standing line under the path says so, and
  // names every game it applies to.
  it("states the silent-game rule for every game that listens", () => {
    const html = renderToStaticMarkup(<EarTrainingClient />);
    const games = Object.keys(GAME_MIC) as GameId[];
    for (const game of games) {
      expect(earGameCredits(game, false), game).toBe(!GAME_MIC[game]);
      expect(earGameCredits(game, true), game).toBe(true);
    }
    const line = html.match(/Every finished game[^<]*/)?.[0] ?? "";
    expect(line).toMatch(/once the mic has\s+heard you sing in the games that listen/);
    expect(html).not.toMatch(/Every finished game earns XP and counts toward your streak\./);
    const footer = html.slice(html.indexOf("Every finished game"));
    for (const game of games.filter((g) => GAME_MIC[g])) {
      expect(footer.toLowerCase(), game).toContain(GAME_NAMES[game].toLowerCase());
    }
  });
});

/**
 * The streak and the daily goal are said once, inside the continue card, as
 * on /breath and /warmups: a second chip beside a bare goal ring repeated it
 * a few hundred pixels further down a phone's first screen.
 */
describe("the ear room's streak and goal", () => {
  it("live in the continue card, not in a second row under it", () => {
    const html = renderToStaticMarkup(<EarTrainingClient />);
    expect(html).toContain("Today&#x27;s goal");
    expect(html.match(/Today&#x27;s goal/g)).toHaveLength(1);
  });
});
