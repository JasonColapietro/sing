import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { micJustAnswered, type MicAsk } from "./songs-client";

const ask = (over: Partial<MicAsk> = {}): MicAsk => ({
  gated: true,
  headerAsk: false,
  listening: false,
  listenMode: false,
  ...over,
});
/** The library, with the header's own "Enable microphone" on screen. */
const header = (over: Partial<MicAsk> = {}) => ask({ gated: false, headerAsk: true, ...over });

/**
 * /songs' gate unmounts the moment its "Enable microphone" or "Continue
 * without a mic" is answered, and keyboard focus fell to <body>: the next Tab
 * jumped back up to "PRO HAS NO DAILY LIMIT" above the taste quiz.
 */
describe("focus once /songs' microphone question is answered", () => {
  it("moves when the mic comes on, or the singer goes on without one", () => {
    expect(micJustAnswered(ask(), ask({ gated: false, listening: true }))).toBe(true);
    // Continue without a mic: the gate goes, and the library header asks
    // again, but the button that was pressed went with the gate.
    expect(micJustAnswered(ask(), header({ listenMode: true }))).toBe(true);
    // The library header's button, after continuing without a mic.
    expect(
      micJustAnswered(header({ listenMode: true }), ask({ gated: false, listenMode: true, listening: true })),
    ).toBe(true);
  });

  it("stays put when the question is still up, failed, or went for another reason", () => {
    // The mic was refused: the gate stays, with its error, and keeps focus.
    expect(micJustAnswered(ask(), ask())).toBe(false);
    expect(micJustAnswered(header({ listenMode: true }), header({ listenMode: true }))).toBe(false);
    // A song picked from the library in listen mode takes the header button
    // with it, but nothing was answered.
    expect(micJustAnswered(header({ listenMode: true }), ask({ gated: false, listenMode: true }))).toBe(false);
    // Nothing was asking: the summary, the player, a capped singer.
    expect(
      micJustAnswered(ask({ gated: false }), ask({ gated: false, listening: true })),
    ).toBe(false);
  });

  it("lands on the player's Play on a song link, and on the page title in the library", () => {
    const src = readFileSync(new URL("./songs-client.tsx", import.meta.url), "utf8");
    expect(src).toMatch(
      /focusIfDropped\(\s*view === "practice"\s*\?\s*document\.querySelector<HTMLElement>\("#song-transport button"\)\s*:\s*titleRef\.current,?\s*\)/,
    );
    expect(src).toMatch(/<PageShell\s+kicker="Songs"\s+titleRef=\{titleRef\}/);
    // Play is the transport row's first button.
    const player = readFileSync(new URL("./song-player.tsx", import.meta.url), "utf8");
    expect(player).toMatch(/id="song-transport"[\s\S]{0,200}?<Transport /);
  });
});
