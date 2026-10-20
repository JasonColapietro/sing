import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProState } from "@/lib/pro";

/*
 * next/link renders the same <a> a plain anchor does, so the client-router
 * links are marked here to tell the two apart in static markup.
 */
vi.mock("next/link", () => ({
  default: ({ href, prefetch, children, ...rest }: ComponentProps<"a"> & { prefetch?: boolean }) => (
    <a data-client-router="" data-prefetch={String(prefetch)} href={String(href)} {...rest}>
      {children}
    </a>
  ),
}));

const proState = vi.hoisted(() => ({ current: null as unknown as ProState }));

vi.mock("@/lib/pro", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/pro")>();
  return { ...actual, useProState: () => proState.current };
});

import { jumpInPage } from "@/components/ui";
import { ProClient } from "./pro-client";

function state(overrides: Partial<ProState> = {}): ProState {
  return {
    active: false,
    plan: null,
    status: null,
    subscriptionId: null,
    paymentIntentId: null,
    customerId: null,
    email: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    proKey: null,
    since: null,
    lastVerified: null,
    ...overrides,
  };
}

/** The opening tag of the anchor whose text is `label`. */
function anchor(html: string, label: string): string {
  const end = html.indexOf(`>${label}</a>`);
  expect(end, label).toBeGreaterThan(-1);
  return html.slice(html.lastIndexOf("<a ", end), end + 1);
}

describe("in-page jumps to the buy card", () => {
  beforeEach(() => {
    proState.current = state();
  });

  it("are plain anchors, so a tap on /pro#buy still jumps and moves the Tab starting point", () => {
    // next/link treats a fragment the address already ends in as no
    // navigation: after any Go Pro link (all land on /pro#buy) the hero's and
    // the final call to action's buttons did nothing.
    const html = renderToStaticMarkup(<ProClient />);
    for (const label of ["Get lifetime Pro: $79 once", "Go Pro"]) {
      const tag = anchor(html, label);
      expect(tag).toContain('href="#buy"');
      expect(tag).not.toContain("data-client-router");
    }
    // Routes still go through the client router.
    expect(anchor(html, "Back to the studio")).toContain("data-client-router");
  });

  it("keeps an owner's jump to their plan a plain anchor too", () => {
    proState.current = state({
      active: true,
      plan: "lifetime",
      status: "active",
      paymentIntentId: "pi_lifetime",
    });
    const tag = anchor(renderToStaticMarkup(<ProClient />), "Your Pro access");
    expect(tag).toContain('href="#plans"');
    expect(tag).not.toContain("data-client-router");
  });

  it("hands every in-page anchor the history repair", () => {
    const src = readFileSync(new URL("./pro-client.tsx", import.meta.url), "utf8");
    expect(src.match(/href="#buy"\s+fullLoad\s+onClick=\{jumpInPage\}/g)).toHaveLength(1);
    expect(src).toMatch(/"#plans" : "#buy"\}\s+fullLoad\s+onClick=\{jumpInPage\}/);
    // The "#restore" note's handler opens the form and repairs the entry.
    expect(src).toMatch(/function openRestore\(\) \{[^}]*jumpInPage\(\);\s*\}/);
    expect(src).toMatch(/href="#restore"\s+onClick=\{openRestore\}/);
  });
});

describe("jumpInPage", () => {
  const NEXT_STATE = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ["pro"] };

  function stubWindow(initial: unknown) {
    const listeners = new Map<string, () => void>();
    const history = {
      state: initial,
      replaceState: vi.fn((next: unknown) => {
        history.state = next;
      }),
    };
    vi.stubGlobal("window", {
      history,
      location: { href: "https://sing.suedeai.ai/pro#buy" },
      addEventListener: (type: string, fn: () => void) => listeners.set(type, fn),
      removeEventListener: (type: string) => listeners.delete(type),
      setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    });
    return { history, listeners };
  }

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("puts the router's state back on the entry the browser's jump wrote", () => {
    // Without it, Back from a page reached after the jump changed the address
    // and left that page on screen: the router ignores a stateless entry.
    vi.useFakeTimers();
    const { history, listeners } = stubWindow(NEXT_STATE);
    jumpInPage();
    history.state = null; // the browser's fragment navigation
    vi.runAllTimers();
    expect(history.replaceState).toHaveBeenCalledWith(NEXT_STATE, "", "https://sing.suedeai.ai/pro#buy");
    expect(history.state).toBe(NEXT_STATE);
    expect(listeners.has("hashchange")).toBe(false);
  });

  it("repairs on hashchange too, and leaves nothing listening after the click", () => {
    vi.useFakeTimers();
    const { history, listeners } = stubWindow(NEXT_STATE);
    jumpInPage();
    history.state = null;
    listeners.get("hashchange")?.();
    expect(history.state).toBe(NEXT_STATE);
    vi.runAllTimers();
    expect(history.replaceState).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);
  });

  it("touches nothing when the jump kept the entry, or there was no router state", () => {
    vi.useFakeTimers();
    // A jump to the fragment the address already holds keeps the entry.
    const kept = stubWindow(NEXT_STATE);
    jumpInPage();
    vi.runAllTimers();
    expect(kept.history.replaceState).not.toHaveBeenCalled();
    const none = stubWindow(null);
    jumpInPage();
    vi.runAllTimers();
    expect(none.history.replaceState).not.toHaveBeenCalled();
    expect(none.listeners.size).toBe(0);
  });
});
