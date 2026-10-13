import { describe, expect, it } from "vitest";
import { trackHiddenTime, type VisibilitySource } from "./hidden-time";

/** A document stand-in whose visibility the test flips. */
function fakeDoc(initial: DocumentVisibilityState = "visible") {
  const target = new EventTarget();
  const doc = {
    visibilityState: initial,
    addEventListener: (type: "visibilitychange", fn: () => void) => target.addEventListener(type, fn),
    removeEventListener: (type: "visibilitychange", fn: () => void) =>
      target.removeEventListener(type, fn),
    set(state: DocumentVisibilityState) {
      doc.visibilityState = state;
      target.dispatchEvent(new Event("visibilitychange"));
    },
  };
  return doc satisfies VisibilitySource;
}

describe("time a tab spends hidden", () => {
  it("is reported when the tab comes back, so the caller can move its start past it", () => {
    const doc = fakeDoc();
    let now = 1_000;
    const reports: number[] = [];
    trackHiddenTime(doc, () => now, (ms) => reports.push(ms));
    now = 5_000;
    doc.set("hidden");
    now = 5_000 + 6 * 60_000;
    doc.set("visible");
    expect(reports).toEqual([6 * 60_000]);
  });

  it("counts a tab already hidden when tracking starts from that moment", () => {
    const doc = fakeDoc("hidden");
    let now = 2_000;
    const reports: number[] = [];
    trackHiddenTime(doc, () => now, (ms) => reports.push(ms));
    now = 9_000;
    doc.set("visible");
    expect(reports).toEqual([7_000]);
  });

  it("stops listening once unsubscribed", () => {
    const doc = fakeDoc();
    let now = 0;
    const reports: number[] = [];
    const stop = trackHiddenTime(doc, () => now, (ms) => reports.push(ms));
    stop();
    doc.set("hidden");
    now = 60_000;
    doc.set("visible");
    expect(reports).toEqual([]);
  });
});
