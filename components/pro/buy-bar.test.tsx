/**
 * The buy bar that follows a free visitor down /pro, driven as the real
 * component: its state and effects run in tests/hooks-harness.ts against a
 * stub document and a stub IntersectionObserver, and the assertions read the
 * element it returns. What the page allows it, and which elements the page
 * marks for it, are in buy-bar-page.test.tsx.
 */
import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hooks = await vi.hoisted(async () => (await import("@/tests/hooks-harness")).createHooks());
vi.mock("react", async (original) => hooks.mockReact(await original<typeof import("react")>()));

import { BuyBar, stuckHeaderBottom } from "./buy-bar";

type El = ReactElement<Record<string, unknown>>;
type Entry = { target: object; isIntersecting: boolean };

/** A stub element: `field` says whether it matches the form-field selector. */
const el = (name: string, field = false) => ({ name, matches: () => field });

const page = {
  anchors: [] as object[],
  selector: "",
  observed: [] as object[],
  report: (() => {}) as (entries: Entry[]) => void,
  rootMargin: "",
  disconnected: 0,
  listeners: new Map<string, (event: unknown) => void>(),
  body: { paddingBottom: "" },
  root: { scrollPaddingBottom: "" },
};

const onBuy = vi.fn();
let props = { enabled: true, label: "Get lifetime Pro: $79 once", busy: false, error: null as string | null, onBuy };
let tree: El | null;
const render = () => {
  tree = hooks.render(() => BuyBar(props)) as El | null;
  return tree;
};

function nodes(node: ReactNode): El[] {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as El;
  return [element, ...nodes(element.props.children as ReactNode)];
}
const words = (node: ReactNode): string =>
  Array.isArray(node)
    ? node.map(words).join("")
    : typeof node === "string"
      ? node
      : node && typeof node === "object" && "props" in node
        ? words((node as El).props.children as ReactNode)
        : "";
const button = () => nodes(tree).find((n) => typeof n.props.onClick === "function")!;
/** On screen and usable, as opposed to mounted but put away. */
const showing = () => tree !== null && tree.props.inert === false && !String(tree.props.className).includes("invisible");
/** The observer reports these elements as on screen and the rest as off. */
const see = (...onScreen: object[]) => {
  page.report(page.anchors.map((target) => ({ target, isIntersecting: onScreen.includes(target) })));
  return render();
};
const focusMoves = (kind: "focusin" | "focusout", event: object) => {
  page.listeners.get(kind)!(event);
  return render();
};

const hero = el("hero button");
const card = el("buy card");
const end = el("final button");
const restoreForm = el("restore form");

beforeEach(() => {
  hooks.reset();
  onBuy.mockClear();
  props = { enabled: true, label: "Get lifetime Pro: $79 once", busy: false, error: null, onBuy };
  Object.assign(page, {
    anchors: [hero, card, end, restoreForm],
    selector: "",
    observed: [],
    disconnected: 0,
    body: { paddingBottom: "12px" },
    root: { scrollPaddingBottom: "" },
  });
  page.listeners.clear();
  vi.stubGlobal("document", {
    querySelectorAll: (selector: string) => {
      page.selector = selector;
      return page.anchors;
    },
    addEventListener: (kind: string, fn: (event: unknown) => void) => page.listeners.set(kind, fn),
    removeEventListener: (kind: string) => page.listeners.delete(kind),
    body: { style: page.body },
    documentElement: { style: page.root },
  });
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(report: (entries: Entry[]) => void, options?: { rootMargin?: string }) {
        page.report = report;
        page.rootMargin = options?.rootMargin ?? "";
      }
      observe(target: object) {
        page.observed.push(target);
      }
      disconnect() {
        page.disconnected++;
      }
    },
  );
});
afterEach(() => {
  hooks.unmount();
  vi.unstubAllGlobals();
});

describe("when the buy bar shows", () => {
  it("renders nothing until the observer has reported, and nothing without an observer", () => {
    expect(render()).toBeNull();
    hooks.unmount();
    vi.stubGlobal("IntersectionObserver", undefined);
    expect(render()).toBeNull();
  });

  it("appears only when every buy button and every form it yields to is off screen", () => {
    render();
    expect(page.selector).toBe("[data-buy-anchor], [data-bar-yield]");
    expect(page.observed).toEqual(page.anchors);
    see(hero);
    expect(showing()).toBe(false);
    see();
    expect(showing()).toBe(true);
    see(end);
    expect(showing()).toBe(false);
    // The restore and redeem forms count: the bar covered their buttons on a phone.
    see();
    see(restoreForm);
    expect(showing()).toBe(false);
  });

  it("counts a buy button behind the sticky header as off screen", () => {
    // A phone had a button wholly under the 57px header and no bar, about every 900px of /pro.
    render();
    expect(page.rootMargin).toBe("-0px 0px 0px 0px");
    hooks.unmount();
    const header = { getBoundingClientRect: () => ({ bottom: 56.4 }) };
    let position = "sticky";
    vi.stubGlobal("document", { ...document, querySelector: (sel: string) => (sel === "header" ? header : null) });
    vi.stubGlobal("getComputedStyle", () => ({ position }));
    expect(stuckHeaderBottom()).toBe(57);
    render();
    expect(page.rootMargin).toBe("-57px 0px 0px 0px");
    // A header that scrolls away hides nothing.
    position = "static";
    expect(stuckHeaderBottom()).toBe(0);
  });

  it("hides by going inert and invisible, never by leaving the document", () => {
    // Unmounting it on scroll was the keyboard audit's major on /pro.
    render();
    see();
    const shown = tree!;
    see(card);
    expect(tree).not.toBeNull();
    expect(tree!.props.inert).toBe(true);
    expect(String(tree!.props.className)).toContain("invisible");
    expect(tree!.type).toBe(shown.type);
    expect(tree!.props.role).toBe("region");
  });

  it("stays while focus is inside it, until that focus leaves", () => {
    render();
    see();
    (tree!.props.onFocus as () => void)();
    render();
    see(end);
    expect(showing()).toBe(true);
    // Focus moving within the bar keeps it; leaving it lets it go.
    const blur = tree!.props.onBlur as (event: object) => void;
    blur({ currentTarget: { contains: () => true }, relatedTarget: {} });
    render();
    expect(showing()).toBe(true);
    blur({ currentTarget: { contains: () => false }, relatedTarget: null });
    render();
    expect(showing()).toBe(false);
  });

  it("gets out of the way while focus is in a form field anywhere on the page", () => {
    render();
    see();
    focusMoves("focusin", { target: el("Pro key input", true) });
    expect(showing()).toBe(false);
    // Tabbing from the field to the form's own button brings it back only if
    // the form has left the screen; here nothing is on screen.
    focusMoves("focusout", { relatedTarget: null });
    expect(showing()).toBe(true);
    focusMoves("focusin", { target: el("a link") });
    expect(showing()).toBe(true);
    // From one field straight to the next: still hidden.
    focusMoves("focusin", { target: el("code input", true) });
    focusMoves("focusout", { relatedTarget: el("key input", true) });
    expect(showing()).toBe(false);
  });
});

describe("the buy bar and the Tab order", () => {
  it("adds no Tab stop that comes and goes: its button is reached by pointer, not by Tab", () => {
    // e2e/audits/50-keyboard.mjs numbers the page's Tab stops afresh on every
    // press. A stop that appeared and vanished ahead of the footer shifted
    // those numbers, the walk read a footer link as already visited, and 36
    // links were reported as never focused.
    render();
    see();
    expect(button().props.tabIndex).toBe(-1);
    const stops = nodes(tree).filter(
      (n) => (typeof n.type === "string" && ["a", "button", "input"].includes(n.type)) || "tabIndex" in n.props,
    );
    for (const stop of stops) expect(stop.props.tabIndex).toBe(-1);
  });
});

describe("what the buy bar does to the page", () => {
  it("pads the page's end and its scroll area for as long as it is enabled, then puts both back", () => {
    render();
    // Before the bar has ever shown: the page's length must not change with it.
    expect(page.body.paddingBottom).toMatch(/^calc\(.*env\(safe-area-inset-bottom/);
    expect(page.root.scrollPaddingBottom).toBe(page.body.paddingBottom);
    see();
    see(hero);
    expect(page.body.paddingBottom).toMatch(/^calc\(/);
    props = { ...props, enabled: false };
    expect(render()).toBeNull();
    expect(page.body.paddingBottom).toBe("12px");
    expect(page.root.scrollPaddingBottom).toBe("");
    expect(page.disconnected).toBe(1);
    expect(page.listeners.size).toBe(0);
  });

  it("pads by the bar's measured height, so a checkout error under its button covers nothing, and puts it back", () => {
    // With an error line the bar was about 89px tall over a 65px pad.
    let resized: () => void = () => {};
    const observed: object[] = [];
    let disconnected = 0;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(report: () => void) {
          resized = report;
        }
        observe(target: object) {
          observed.push(target);
        }
        disconnect() {
          disconnected++;
        }
      },
    );
    render();
    see();
    let barHeight = 65;
    const barEl = { getBoundingClientRect: () => ({ height: barHeight }) };
    (tree!.props.ref as (node: object | null) => void)(barEl);
    render();
    expect(observed).toEqual([barEl]);
    expect(page.body.paddingBottom).toBe("65px");
    expect(page.root.scrollPaddingBottom).toBe("65px");
    props = { ...props, error: "Stripe did not open." };
    barHeight = 88.6;
    resized();
    render();
    expect(page.body.paddingBottom).toBe("89px");
    expect(page.root.scrollPaddingBottom).toBe("89px");
    // The error cleared: back to the bar's own height.
    props = { ...props, error: null };
    barHeight = 65;
    resized();
    render();
    expect(page.body.paddingBottom).toBe("65px");
    // The bar goes away: the page's own padding comes back.
    props = { ...props, enabled: false };
    expect(render()).toBeNull();
    expect(page.body.paddingBottom).toBe("12px");
    expect(page.root.scrollPaddingBottom).toBe("");
    expect(disconnected).toBe(1);
  });

  it("is the priced button alone: no name beside it to sit under the window's corner switch", () => {
    render();
    see();
    expect(words(tree)).toBe("Get lifetime Pro: $79 once");
    expect(nodes(tree).filter((n) => n.type === "span")).toHaveLength(0);
    expect(String(tree!.props.className)).toMatch(/fixed inset-x-0 bottom-0 z-40/);
    expect(String(tree!.props.className)).toContain("pb-[env(safe-area-inset-bottom)]");
    // An entrance only where motion is welcome.
    expect(String(tree!.props.className)).toContain("motion-safe:animate-fadeup");
    expect(String(tree!.props.className)).not.toMatch(/(^|\s)animate-fadeup/);
  });

  it("buys on a press, stays pressable-looking while busy, and says a failure aloud", () => {
    render();
    see();
    (button().props.onClick as () => void)();
    expect(onBuy).toHaveBeenCalledTimes(1);
    props = { ...props, busy: true, error: "Stripe did not open." };
    render();
    expect(words(button())).toBe("Opening Stripe…");
    expect(button().props["aria-disabled"]).toBe(true);
    expect(button().props.disabled).toBeUndefined();
    const alert = nodes(tree).find((n) => n.props.role === "alert")!;
    expect(words(alert)).toBe("Stripe did not open.");
  });
});
