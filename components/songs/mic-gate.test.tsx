/**
 * Songs hub prerender guard.
 *
 * SongsClient calls useSearchParams, which client-side renders the tree up to
 * the nearest Suspense boundary. With `fallback={null}` that left the hub's
 * static HTML opening on nothing, and hydration then inserted 494px of mic gate
 * above ~4,100px of prerendered songbook and pushed all of it down: CLS 0.3615
 * on production on 2026-08-21, in Google's "poor" band.
 *
 * The fix is that the boundary's fallback is the gate itself, so the box is the
 * right size from the first paint. Two ways that regresses, both guarded here:
 * the fallback going back to null, and the gate being re-inlined into
 * SongsClient so the fallback and the real thing can drift apart in height — a
 * fallback a few pixels off is a fallback that still shifts.
 *
 * Mirrors components/discover/room-rail.test.tsx: assertions run against the
 * HTML string from renderToStaticMarkup, because what matters is what the
 * server pass emits, not what the component could render given a browser.
 */
import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SongsPage from "@/app/songs/page";
import { SongsMicGate } from "./mic-gate";

/** The `fallback` of the first Suspense boundary found in a rendered tree. */
function findFallback(node: ReactNode): unknown {
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findFallback(child);
      if (hit !== undefined) return hit;
    }
    return undefined;
  }
  if (!isValidElement(node)) return undefined;
  const props = (node as ReactElement<{ fallback?: unknown; children?: ReactNode }>)
    .props;
  if (props.fallback !== undefined) return props.fallback;
  return findFallback(props.children);
}

describe("songs mic gate", () => {
  it("is what the Suspense boundary falls back to, not null", () => {
    const fallback = findFallback(SongsPage());
    expect(isValidElement(fallback)).toBe(true);
    expect((fallback as ReactElement).type).toBe(SongsMicGate);
  });

  it("prerenders the whole gate, so the box is the right size before hydration", () => {
    const html = renderToStaticMarkup(<SongsMicGate />);
    expect(html).toContain("Enable microphone");
    expect(html).toContain("Continue without a mic");
    expect(html).toContain("Enable your microphone to get scored");
  });

  it("carries the hub's <h1>, which its static HTML previously had nowhere", () => {
    expect(renderToStaticMarkup(<SongsMicGate />)).toMatch(/<h1[^>]*>Song practice<\/h1>/);
  });

  it("lets a deep link name the song without changing the shape of the gate", () => {
    const html = renderToStaticMarkup(
      <SongsMicGate heading="Enable your microphone to sing “Ode to Joy”" />,
    );
    expect(html).toContain("Ode to Joy");
    expect(html).toContain("Continue without a mic");
  });
});
