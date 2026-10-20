"use client";

import { useEffect } from "react";
import { jumpInPage } from "@/components/ui";

type JumpClick = Pick<MouseEvent, "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey"> & {
  target: EventTarget | null;
};

/**
 * True for a click the browser itself will follow as a jump within this
 * document: a plain primary click on an `<a href="#…">` that opens in this
 * tab. A modified click opens a tab or a window, and a download or another
 * target leaves this document alone, so those are left to the browser.
 */
export function isInPageJumpClick(event: JumpClick): boolean {
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const target = event.target as Partial<Element> | null;
  if (typeof target?.closest !== "function") return false;
  const anchor = target.closest("a[href]");
  if (!anchor) return false;
  if (!anchor.getAttribute("href")?.startsWith("#")) return false;
  if (anchor.hasAttribute("download")) return false;
  const opensIn = anchor.getAttribute("target");
  return !opensIn || opensIn === "_self";
}

/**
 * Keeps Back and Forward working after any plain in-page link, site-wide.
 *
 * The browser's own fragment jump writes a history entry with no state, and
 * Next's app router ignores a Back or Forward onto such an entry. The skip
 * link (app/layout.tsx) showed it: skip to content, follow a link to another
 * room, press Back, and the address changed while the other room stayed on
 * screen. The same held for every other plain `<a href="#…">`: the singer
 * page's evidence link, the glossary contents, the songs gate's songbook
 * link and /progress's "Your data" link. One capture-phase listener hands
 * each of those clicks `jumpInPage`, which puts the router's state back on
 * the new entry. It is idempotent, so a link that already calls jumpInPage
 * itself (the /pro buy and restore links, the singer and song pages' range
 * jumps) is unaffected, and on a next/link click the router writes its own
 * state, which the repair leaves alone.
 */
export function InPageJumps() {
  useEffect(() => listenForInPageJumps(document), []);
  return null;
}

/**
 * The listener InPageJumps mounts: capture phase, so a handler that stops the
 * click's propagation further down cannot hide it. Returns the cleanup.
 */
export function listenForInPageJumps(
  doc: Pick<Document, "addEventListener" | "removeEventListener">,
  jump: () => void = jumpInPage,
): () => void {
  const onClick = (event: MouseEvent) => {
    if (isInPageJumpClick(event)) jump();
  };
  doc.addEventListener("click", onClick, true);
  return () => doc.removeEventListener("click", onClick, true);
}
