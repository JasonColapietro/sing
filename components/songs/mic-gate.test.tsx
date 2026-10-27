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
import { describe, expect, it, vi } from "vitest";
import SongsPage from "@/app/songs/page";
import { paintedFor, staticText, wordsPainted } from "@/components/prepaint.testing";
import { SongsMicGate } from "./mic-gate";

const hydration = vi.hoisted(() => ({ done: false }));
vi.mock("@/components/prepaint", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/components/prepaint")>(),
  useHydrated: () => hydration.done,
}));

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

  it("falls back to the gate with the capped view behind the pre-paint state", () => {
    const fallback = findFallback(SongsPage()) as ReactElement<{ prepaint?: boolean }>;
    expect(fallback.props.prepaint).toBe(true);
    const html = renderToStaticMarkup(fallback);
    // A singer under the cap, or on Pro, paints exactly the gate.
    const ids = (h: string) => h.replace(/_R_[0-9a-z]+_/g, "_ID_");
    // The two wrappers that carry the not-capped marker, and nothing else.
    // The subtitle wrapper holds the sentence phones leave off in its own span.
    const unwrap = (h: string) =>
      h
        .replace(/<span data-prepaint-plan="not-capped">((?:[^<]|<span[^>]*>[^<]*<\/span>)*)<\/span>/, "$1")
        .replace('<div data-prepaint-plan="not-capped">', "")
        .replace(/<\/div><\/main>$/, "</main>");
    // The plain gate is painted for the same plan: its "Free · Pro adds the
    // coach" line (ProWhisper) is in the server HTML behind the not-pro
    // marker, so a Pro singer's first paint has the gate without it.
    for (const plan of ["free", "pro"] as const) {
      expect(ids(unwrap(paintedFor(html, { plan })))).toBe(ids(paintedFor(renderToStaticMarkup(<SongsMicGate />), { plan })));
    }
    expect(paintedFor(html, { plan: "free" })).toContain("adds the coach");
    expect(paintedFor(html, { plan: "pro" })).not.toContain("adds the coach");
    // A capped singer paints what SongsClient will show them: the library's
    // subtitle and the wall, with the songbook held below the fold.
    const capped = wordsPainted(paintedFor(html, { plan: "capped" }));
    expect(capped).not.toContain("Enable microphone");
    expect(capped).toContain("Pick a song to start your practice loop.");
    expect(capped).toContain('id="free-cap"');
    expect(capped).toMatch(/<div aria-hidden="true" data-prepaint-plan="capped" data-prepaint-slot="songs-library"><\/div>/);
    // The capped view's words are attributes until then: the hub's static
    // text, all a script-less crawler reads, is the gate's, with no cap wall
    // and no second subtitle run into the first.
    const text = staticText(html);
    expect(text).toContain("Sing along and see every note you hit");
    expect(text).not.toContain("Pick a song to start your practice loop.");
    expect(text).not.toMatch(/free minutes for today|used today|Go Pro/);
  });

  it("is the plain gate when rendered as a fallback on the client", () => {
    // No inline script marks the page on a client-side navigation.
    hydration.done = true;
    try {
      const ids = (h: string) => h.replace(/_R_[0-9a-z]+_/g, "_ID_");
      expect(ids(renderToStaticMarkup(<SongsMicGate prepaint />))).toBe(ids(renderToStaticMarkup(<SongsMicGate />)));
    } finally {
      hydration.done = false;
    }
  });

  it("prerenders the whole gate, so the box is the right size before hydration", () => {
    const html = renderToStaticMarkup(<SongsMicGate />);
    expect(html).toContain("Enable microphone");
    expect(html).toContain("Continue without a mic");
    expect(html).toContain("Sing along and see every note you hit");
  });

  it("carries the hub's <h1>, which its static HTML previously had nowhere", () => {
    expect(renderToStaticMarkup(<SongsMicGate />)).toMatch(/<h1[^>]*>Public domain songs to sing in your key<\/h1>/);
  });

  it("lets a deep link name the song without changing the shape of the gate", () => {
    const html = renderToStaticMarkup(
      <SongsMicGate heading="Enable your microphone to sing “Ode to Joy”" />,
    );
    expect(html).toContain("Ode to Joy");
    expect(html).toContain("Continue without a mic");
  });

  it("asks for the mic and nothing else before a song is on screen", () => {
    const html = renderToStaticMarkup(<SongsMicGate />);
    // Mode and guide track start at their defaults and switch in the player.
    expect(html).not.toContain("Session mode");
    expect(html).not.toContain("Guide track");
    // A singer who came to pick a song can reach the songbook without the mic.
    expect(html).toContain('href="#songbook"');
  });

  it("shows a mic failure right under the buttons, ahead of the songbook link", () => {
    // At 375px the second button wraps; with the link in between, the alert
    // landed 59px below the fold (e2e/audits/80-states.mjs on mobile-375).
    const html = renderToStaticMarkup(<SongsMicGate error="No microphone found. Plug one in." />);
    const alert = html.indexOf('role="alert"');
    expect(alert).toBeGreaterThan(html.indexOf("Continue without a mic"));
    expect(alert).toBeLessThan(html.indexOf('href="#songbook"'));
  });

  it("puts the buttons straight under the heading, ahead of the explanation", () => {
    // With the paragraph first, "Enable microphone" sat behind the tab bar on
    // a 375×667 phone, on the hub and on every song page's deep link.
    const html = renderToStaticMarkup(<SongsMicGate error="No microphone found. Plug one in." />);
    const button = html.indexOf("Try again");
    expect(button).toBeGreaterThan(html.indexOf("Sing along and see every note you hit"));
    expect(button).toBeLessThan(html.indexOf("Audio never leaves your browser"));
    expect(html.indexOf('role="alert"')).toBeLessThan(html.indexOf("Audio never leaves your browser"));
  });

  it("fits both buttons on a 320×568 first screen", () => {
    // At the lg size "Continue without a mic" wrapped to two lines at 320px and
    // sat across the fold, under a six-line subtitle. Below sm the buttons are
    // the md size and the subtitle's second sentence is left off (it stays in
    // the HTML); from sm up both are as before.
    const html = renderToStaticMarkup(<SongsMicGate />);
    for (const label of ["Enable microphone", "Continue without a mic"]) {
      const button = html.match(new RegExp(`<button class="([^"]*)">(?:(?!</button>).)*${label}</button>`));
      expect(button?.[1], label).toContain("px-5 py-2.5 text-sm sm:px-7 sm:py-3.5 sm:text-base");
    }
    expect(html).toMatch(
      /live pitch scoring\.<span class="hidden sm:inline"> Once you have taken the range test, each song opens fitted to your range\.<\/span>/,
    );
    // A deep link's heading names the song; the longest titles took it to
    // three lines at text-xl and the second button across the fold again.
    const linked = renderToStaticMarkup(
      <SongsMicGate heading="Enable your microphone to sing “She'll Be Coming Round the Mountain”" />,
    );
    expect(linked).toContain('<h2 class="text-lg sm:text-xl">Enable your microphone to sing');
  });

  it("labels the button as a retry once the mic has failed", () => {
    expect(renderToStaticMarkup(<SongsMicGate />)).toContain("Enable microphone");
    const html = renderToStaticMarkup(<SongsMicGate error="Microphone access is blocked." />);
    expect(html).toContain("Try again");
    expect(html).not.toContain("Enable microphone");
  });

  it("states the free allowance before sending anyone into capped practice", () => {
    // Shared with warmups, ear training and breath, so it is not called song time.
    const html = renderToStaticMarkup(<SongsMicGate />);
    expect(html).toContain("5 minutes of guided practice a day");
    // The whisper under the audio setup is the gate's one ask; the sentence
    // states the allowance and no longer carries a second one.
    expect(html).not.toContain("Pro has no daily limit");
    expect(html).toContain("adds the coach");
  });
});
