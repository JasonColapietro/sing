/**
 * A blocked microphone on a phone must not leave its instructions behind the
 * fixed tab bar. `scrollIntoView({ block: "nearest" })` treats the strip under
 * the bar as on screen, so MicAlert measures the overlap itself — and only
 * when the bar is what the singer actually sees there.
 */
import { describe, expect, it } from "vitest";
import { tabBarOverlap } from "./mic-alert";

type Rect = { top: number; bottom: number };

function fakeDoc({
  barTop,
  barOnTop = true,
  withBar = true,
  innerHeight = 667,
}: {
  barTop: number;
  barOnTop?: boolean;
  withBar?: boolean;
  innerHeight?: number;
}) {
  const inside = {};
  const bar = {
    getBoundingClientRect: (): Rect => ({ top: barTop, bottom: barTop + 57 }),
    contains: (node: unknown) => node === bar || node === inside,
  };
  const doc = {
    defaultView: { innerWidth: 375, innerHeight },
    querySelector: (sel: string) => (withBar && sel === 'nav[aria-label="Tabs"]' ? bar : null),
    elementFromPoint: () => (barOnTop ? inside : {}),
  };
  return doc as unknown as Document;
}

const alertAt = (top: number, bottom: number) =>
  ({ getBoundingClientRect: (): Rect => ({ top, bottom }) }) as unknown as Element;

describe("tabBarOverlap", () => {
  it("lifts a message under the phone tab bar clear of it, with a small gap", () => {
    // /studio at 375×667: the alert at 625–665, the bar from 610.
    expect(tabBarOverlap(alertAt(625, 665), fakeDoc({ barTop: 610 }))).toBe(63);
  });

  it("leaves a message that already clears the bar where it is", () => {
    // /range#start: the alert at 517–557.
    expect(tabBarOverlap(alertAt(517, 557), fakeDoc({ barTop: 610 }))).toBe(0);
  });

  it("does nothing on desktop, where the bar is hidden or absent", () => {
    expect(tabBarOverlap(alertAt(625, 665), fakeDoc({ barTop: 610, withBar: false }))).toBe(0);
    // display:none measures as a zero box at the top, with something else there.
    expect(tabBarOverlap(alertAt(625, 665), fakeDoc({ barTop: 0, barOnTop: false }))).toBe(0);
  });

  it("does not scroll the page under a full-screen session that covers the bar", () => {
    expect(tabBarOverlap(alertAt(625, 665), fakeDoc({ barTop: 610, barOnTop: false }))).toBe(0);
  });

  it("ignores a bar laid out below the viewport", () => {
    expect(tabBarOverlap(alertAt(625, 665), fakeDoc({ barTop: 700 }))).toBe(0);
  });
});
