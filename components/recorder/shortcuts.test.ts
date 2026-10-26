import { describe, expect, it } from "vitest";
import { recorderShortcut } from "./shortcuts";

function key(key: string, target: object | null = null, extra: object = {}) {
  return { key, target, ...extra } as KeyboardEvent;
}

describe("recorder shortcuts", () => {
  it("leaves Space on REC, download and delete buttons to their own activation", () => {
    expect(recorderShortcut(key(" ", { tagName: "BUTTON", closest: () => ({}) }))).toBeNull();
  });
  it("leaves an icon inside a focused control to its control", () => {
    expect(recorderShortcut(key(" ", { tagName: "svg", closest: () => ({}) }))).toBeNull();
  });
  it("does not replace an event another control already handled", () => {
    expect(recorderShortcut(key(" ", null, { defaultPrevented: true }))).toBeNull();
  });
  it("preserves page shortcuts outside interactive controls", () => {
    expect(recorderShortcut(key(" "))).toBe("play");
    expect(recorderShortcut(key("R"))).toBe("record");
    expect(recorderShortcut(key("r", { isContentEditable: true }))).toBeNull();
    expect(recorderShortcut(key("r", null, { ctrlKey: true }))).toBeNull();
  });
});
