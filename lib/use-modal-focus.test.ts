/**
 * Songs stage mode replaces the in-page player, so the "Stage mode" button that
 * opened it is unmounted while the stage is up (and focus fell to the body as
 * it opened). Closing the stage handed focus back to that detached button, so
 * it landed on <body>; it now goes to the stage's fallback, the new button.
 */
import { describe, expect, it } from "vitest";
import { focusReturnTarget } from "./use-modal-focus";

const el = (name: string, isConnected = true) => ({ name, isConnected });

describe("where focus goes when a dialog closes", () => {
  const body = el("body");

  it("goes back to the opener while it is still on the page", () => {
    const opener = el("menu button");
    expect(focusReturnTarget(opener, el("fallback"), body)).toBe(opener);
    expect(focusReturnTarget(opener, undefined, body)).toBe(opener);
  });

  it("goes to the fallback when the opener has been unmounted", () => {
    const fallback = el("new Stage mode button");
    expect(focusReturnTarget(el("old Stage mode button", false), fallback, body)).toBe(fallback);
  });

  it("goes to the fallback when focus had already fallen to the body at open", () => {
    const fallback = el("new Stage mode button");
    expect(focusReturnTarget(body, fallback, body)).toBe(fallback);
  });

  it("goes nowhere detached", () => {
    expect(focusReturnTarget(el("old", false), el("gone too", false), body)).toBeNull();
    expect(focusReturnTarget(el("old", false), null, body)).toBeNull();
  });
});
