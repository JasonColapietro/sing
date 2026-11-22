"use client";

import { useEffect } from "react";

/**
 * Fits the shared Light / Dark / AI agent switch (suedeai.ai/agent-view.js,
 * loaded at the end of app/layout.tsx) to this site's phone gutter.
 *
 * On phones the switch folds to a tab on the left edge at 62% of the window
 * height. It was 28px wide plus its padding and border, about 31px, over a
 * 16px page gutter: it covered the first letters of body copy on / and /pro
 * and met the landing's buy button. The switch keeps its shadow root open,
 * so this adds one stylesheet there that narrows the folded tab to 14px
 * (inside the gutter) and 44px tall. Nothing else changes: opened, it is the
 * full switch with its labels; focused from the keyboard, the tab grows back
 * to its own width so its focus ring and glyph are plain; the agent view's
 * docked controls and every desktop placement are untouched. The tab keeps
 * the switch's own accessible name and title.
 *
 * If the switch changes its markup the selectors match nothing and it is
 * drawn as it ships, so this can only ever be a no-op, never a breakage.
 */
export const AGENT_VIEW_FIT_CSS =
  "@media (max-width:640px){" +
  ".pill.left:not(.open):not(.docked){padding:0;gap:0}" +
  ".pill:not(.open):not(.docked) .tab{width:13px;height:44px;font-size:10px}" +
  ".pill:not(.open):not(.docked) .tab:focus-visible{width:28px}" +
  "}";

const MARK = "data-sing-fit";

/** Adds the stylesheet once the switch has mounted. True once it is there. */
export function fitAgentView(doc: Pick<Document, "querySelector" | "createElement">): boolean {
  const root = doc.querySelector("suede-agent-view")?.shadowRoot;
  if (!root) return false;
  if (root.querySelector(`style[${MARK}]`)) return true;
  const style = doc.createElement("style");
  style.setAttribute(MARK, "");
  style.textContent = AGENT_VIEW_FIT_CSS;
  root.appendChild(style);
  return true;
}

export function AgentViewFit() {
  useEffect(() => {
    // The switch's script is deferred and remote: it mounts after hydration
    // or before it, so look now and then watch <body> for its host.
    if (fitAgentView(document)) return;
    const observer = new MutationObserver(() => {
      if (fitAgentView(document)) observer.disconnect();
    });
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
