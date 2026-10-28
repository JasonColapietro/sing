import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  HEARD_MS,
  HINT_AFTER_MS,
  NO_SOUND_HINT,
  TOO_QUIET_HINT,
  UNPITCHED_HINT,
  freshInputHint,
  meterInputHint,
  nextInputHint,
} from "./pitch-meter-hint";
import { PitchMeter } from "./pitch-meter";
import { SILENCE_RMS } from "@/lib/audio/pitch";

const MIN_VOLUME = 0.008;

/** Feed `ms` of one kind of input in 100 ms frames; return the last hint. */
function feed(state: ReturnType<typeof freshInputHint>, ms: number, volume: number, voiced: boolean) {
  let hint: string | null = state.hint;
  for (let t = 0; t < ms; t += 100) hint = nextInputHint(state, { volume }, 100, voiced, MIN_VOLUME);
  return hint;
}

describe("the too-quiet hint the range test and the pitch meter share", () => {
  it("names a singer under the detector's floor after HINT_AFTER_MS, not before", () => {
    const s = freshInputHint();
    expect(feed(s, HINT_AFTER_MS - 100, 0.004, false)).toBeNull();
    expect(feed(s, 100, 0.004, false)).toBe(TOO_QUIET_HINT);
  });

  it("says nothing reaches the mic when nothing rose above the noise floor", () => {
    const s = freshInputHint();
    expect(feed(s, HINT_AFTER_MS, 0.0005, false)).toBe(NO_SOUND_HINT);
  });

  it("asks for a steady note when the input is loud enough but unpitched", () => {
    const s = freshInputHint();
    expect(feed(s, HINT_AFTER_MS, 0.05, false)).toBe(UNPITCHED_HINT);
  });

  it("calls a voice under the detector's silence floor too quiet, whatever floor the room passes", () => {
    // 0.009 clears the range test's and the pitch meter's MIN_VOLUME (0.008),
    // but the detector returns no pitch at all under SILENCE_RMS (0.01), so
    // that voice was never "heard, but with no pitch".
    expect(SILENCE_RMS).toBeGreaterThan(0.009);
    const s = freshInputHint();
    expect(feed(s, 3000, 0.009, false)).toBe(TOO_QUIET_HINT);
  });

  it("clears on the first heard pitch, and keeps a hint while the cause changes", () => {
    const s = freshInputHint();
    feed(s, HINT_AFTER_MS, 0.05, false);
    // Going quiet does not blank the hint for 2.5 s before naming the new cause.
    expect(feed(s, 1000, 0.004, false)).toBe(UNPITCHED_HINT);
    expect(feed(s, HINT_AFTER_MS, 0.004, false)).toBe(TOO_QUIET_HINT);
    expect(feed(s, 100, 0.05, true)).toBeNull();
  });
});

describe("the pitch meter's hint", () => {
  it("explains a run that has heard nothing yet", () => {
    const s = freshInputHint();
    feed(s, HINT_AFTER_MS, 0.004, false);
    expect(meterInputHint(s)).toBe(TOO_QUIET_HINT);
  });

  it("treats a silence after a held note as a rest, not a quiet mic", () => {
    const s = freshInputHint();
    feed(s, HEARD_MS, 0.05, true);
    feed(s, HINT_AFTER_MS * 2, 0.0005, false);
    expect(s.hint).toBe(TOO_QUIET_HINT);
    expect(meterInputHint(s)).toBeNull();
  });

  it("still asks for a steady note after one was heard", () => {
    const s = freshInputHint();
    feed(s, HEARD_MS, 0.05, true);
    feed(s, HINT_AFTER_MS, 0.05, false);
    expect(meterInputHint(s)).toBe(UNPITCHED_HINT);
  });

  it("asks for a note sung out loud, not a hum the mic may not hear", () => {
    const html = renderToStaticMarkup(<PitchMeter />);
    expect(html).toContain("Sing any note out loud, an easy “ah” as if to someone across the room.");
    expect(html).not.toContain("Sing or hum any note");
  });
});
