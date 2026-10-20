import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { isInPageJumpClick, listenForInPageJumps } from "./in-page-jumps";

/** A clicked element whose nearest anchor carries `attrs` (or no anchor). */
function clickOn(attrs: Record<string, string> | null, init: Partial<MouseEvent> = {}) {
  const anchor = attrs && {
    getAttribute: (name: string) => attrs[name] ?? null,
    hasAttribute: (name: string) => name in attrs,
  };
  const target = { closest: (selector: string) => (selector === "a[href]" && anchor ? anchor : null) };
  return {
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    target: target as unknown as EventTarget,
    ...init,
  } as MouseEvent;
}

describe("in-page jumps", () => {
  it("picks out a plain click on a link within the page, such as the skip link", () => {
    expect(isInPageJumpClick(clickOn({ href: "#content" }))).toBe(true);
    expect(isInPageJumpClick(clickOn({ href: "#buy", target: "_self" }))).toBe(true);
    expect(isInPageJumpClick(clickOn({ href: "#" }))).toBe(true);
  });

  it("leaves other links and other clicks to the browser", () => {
    expect(isInPageJumpClick(clickOn({ href: "/studio" }))).toBe(false);
    expect(isInPageJumpClick(clickOn({ href: "/pro#buy" }))).toBe(false);
    expect(isInPageJumpClick(clickOn(null))).toBe(false);
    expect(isInPageJumpClick(clickOn({ href: "#x", target: "_blank" }))).toBe(false);
    expect(isInPageJumpClick(clickOn({ href: "#x", download: "" }))).toBe(false);
    for (const mod of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) {
      expect(isInPageJumpClick(clickOn({ href: "#x" }, { [mod]: true })), mod).toBe(false);
    }
    expect(isInPageJumpClick(clickOn({ href: "#x" }, { button: 1 }))).toBe(false);
    // A click on the document itself, or a text node, has no closest().
    expect(isInPageJumpClick({ ...clickOn(null), target: {} as EventTarget })).toBe(false);
    expect(isInPageJumpClick({ ...clickOn(null), target: null })).toBe(false);
  });

  it("repairs the history entry on each in-page click, from one capture-phase listener", () => {
    const listeners: Array<[string, (e: MouseEvent) => void, unknown]> = [];
    const doc = {
      addEventListener: vi.fn((type: string, fn: (e: MouseEvent) => void, opts: unknown) =>
        listeners.push([type, fn, opts]),
      ),
      removeEventListener: vi.fn(),
    };
    const jump = vi.fn();
    const stop = listenForInPageJumps(doc as unknown as Document, jump);
    expect(listeners).toHaveLength(1);
    const [type, onClick, capture] = listeners[0];
    expect(type).toBe("click");
    expect(capture).toBe(true);
    onClick(clickOn({ href: "#content" }));
    expect(jump).toHaveBeenCalledTimes(1);
    onClick(clickOn({ href: "/studio" }));
    onClick(clickOn({ href: "#content" }, { metaKey: true }));
    expect(jump).toHaveBeenCalledTimes(1);
    stop();
    expect(doc.removeEventListener).toHaveBeenCalledWith("click", onClick, true);
  });

  it("is mounted once for the whole site, beside the skip link it repairs", () => {
    // Skip to content, a link to another room, then Back changed the address
    // and left that room on screen: the router ignores a stateless entry.
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    expect(layout).toMatch(/<a\s+href="#content"/);
    expect(layout.match(/<InPageJumps \/>/g)).toHaveLength(1);
    expect(layout).toContain('import { InPageJumps } from "@/components/in-page-jumps";');
  });
});
