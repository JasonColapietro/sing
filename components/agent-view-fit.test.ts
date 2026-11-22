/**
 * The shared view switch's phone tab sat over the first letters of body copy
 * (31px wide on a 16px gutter). AgentViewFit narrows it from inside the
 * switch's open shadow root; these pin what it adds and that it adds it once.
 */
import { describe, expect, it } from "vitest";
import { AGENT_VIEW_FIT_CSS, fitAgentView } from "./agent-view-fit";

function fakeDoc(withHost: boolean) {
  const children: Array<{ attrs: Record<string, string>; textContent: string }> = [];
  const root = {
    children,
    querySelector: (sel: string) => (sel === "style[data-sing-fit]" ? children.find((c) => "data-sing-fit" in c.attrs) ?? null : null),
    appendChild: (node: (typeof children)[number]) => children.push(node),
  };
  const doc = {
    querySelector: (sel: string) => (withHost && sel === "suede-agent-view" ? { shadowRoot: root } : null),
    createElement: () => {
      const attrs: Record<string, string> = {};
      return { attrs, textContent: "", setAttribute: (k: string, v: string) => (attrs[k] = v) };
    },
  };
  return { doc: doc as unknown as Document, root };
}

describe("fitting the view switch to the phone gutter", () => {
  it("waits for the switch: nothing to fit before its host mounts", () => {
    expect(fitAgentView(fakeDoc(false).doc)).toBe(false);
  });

  it("adds its stylesheet to the switch's shadow root, once", () => {
    const { doc, root } = fakeDoc(true);
    expect(fitAgentView(doc)).toBe(true);
    expect(fitAgentView(doc)).toBe(true);
    expect(root.children).toHaveLength(1);
    expect(root.children[0].textContent).toBe(AGENT_VIEW_FIT_CSS);
  });

  it("narrows only the folded phone tab to inside the 16px gutter, and keeps it 44px tall", () => {
    expect(AGENT_VIEW_FIT_CSS.startsWith("@media (max-width:640px){")).toBe(true);
    const width = Number(/\.tab\{width:(\d+)px;height:44px/.exec(AGENT_VIEW_FIT_CSS)![1]);
    // Plus the pill's 1px right border; its left border is already off at the edge.
    expect(width + 1).toBeLessThan(16);
    // Opened, docked in the agent view, or focused from the keyboard, it is the switch as it ships.
    for (const rule of AGENT_VIEW_FIT_CSS.match(/\.pill[^{]*\{/g)!) expect(rule).toContain(":not(.open):not(.docked)");
    expect(AGENT_VIEW_FIT_CSS).toContain(".tab:focus-visible{width:28px}");
  });
});
