import { afterEach, describe, expect, it, vi } from "vitest";
import { restoreSessionFocus } from "./session-shell";

afterEach(() => vi.unstubAllGlobals());

/** The policy test controls DOM lifetimes; navigation.mjs covers real focus. */
function focusScene() {
  const callbacks: FrameRequestCallback[] = [];
  const document = { body: {}, documentElement: {}, activeElement: null as unknown, querySelector: () => null as unknown };
  const node = (connected = true, visible = true) => {
    const attributes = new Map<string, string>();
    const element = {
      isConnected: connected,
      getClientRects: () => visible ? [{}] : [],
      matches: () => false,
      closest: () => null,
      hasAttribute: (key: string) => attributes.has(key),
      setAttribute: (key: string, value: string) => attributes.set(key, value),
      getAttribute: (key: string) => attributes.get(key),
      focus: () => { if (element.isConnected && visible) document.activeElement = element; },
    };
    return element;
  };
  document.activeElement = document.body;
  vi.stubGlobal("document", document);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callbacks.push(callback); return callbacks.length; });
  return { document, node, paint: () => callbacks.splice(0).forEach((callback) => callback(0)) };
}

describe("session focus return", () => {
  it("returns to a visible starter that is still connected", () => {
    const scene = focusScene();
    const starter = scene.node();
    restoreSessionFocus(starter as unknown as HTMLElement);
    scene.paint();
    expect(scene.document.activeElement).toBe(starter);
  });

  it("waits for the room to remount and uses its heading when the starter was removed", () => {
    const scene = focusScene();
    const starter = scene.node(false);
    restoreSessionFocus(starter as unknown as HTMLElement);
    const heading = scene.node();
    scene.document.querySelector = () => heading;
    scene.paint();
    expect(scene.document.activeElement).toBe(heading);
    expect(heading.getAttribute("tabindex")).toBe("-1");
  });

  it("does not steal focus already claimed by a successor dialog or new page", () => {
    const scene = focusScene();
    restoreSessionFocus(scene.node(false) as unknown as HTMLElement);
    const successor = scene.node();
    scene.document.activeElement = successor;
    scene.document.querySelector = () => scene.node();
    scene.paint();
    expect(scene.document.activeElement).toBe(successor);
  });

  it("leaves focus and scroll to the new page when a link in the shell left the room", () => {
    // The cap slide's "Go Pro" to /pro#buy: focusing /pro's heading here
    // scrolled the page back to the top after the jump to the buy card.
    const scene = focusScene();
    const location = { pathname: "/warmups" };
    vi.stubGlobal("window", { location });
    const heading = scene.node();
    scene.document.querySelector = () => heading;
    restoreSessionFocus(scene.node(false) as unknown as HTMLElement, "/warmups");
    location.pathname = "/pro";
    scene.paint();
    expect(scene.document.activeElement).toBe(scene.document.body);
    expect(heading.getAttribute("tabindex")).toBeUndefined();
  });

  it("still restores when the shell closes on the page it opened on", () => {
    const scene = focusScene();
    vi.stubGlobal("window", { location: { pathname: "/warmups" } });
    const heading = scene.node();
    scene.document.querySelector = () => heading;
    restoreSessionFocus(scene.node(false) as unknown as HTMLElement, "/warmups");
    scene.paint();
    expect(scene.document.activeElement).toBe(heading);
  });

  it("does not return focus to a starter hidden by the new view", () => {
    const scene = focusScene();
    const hiddenStarter = scene.node(true, false);
    const heading = scene.node();
    scene.document.querySelector = () => heading;
    restoreSessionFocus(hiddenStarter as unknown as HTMLElement);
    scene.paint();
    expect(scene.document.activeElement).toBe(heading);
  });
});
