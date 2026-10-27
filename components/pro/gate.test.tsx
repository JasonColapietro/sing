/**
 * ProWhisper, the one-line "Free · Pro adds the coach" under the mic gates of
 * /recorder, /studio, /warmups and /songs.
 *
 * It used to render nothing until the entitlement cache had been read, so it
 * mounted after hydration and grew the gate around it by about 49px. On
 * /recorder at 1280 that moved the A/B card under the deck for every free
 * visitor (CLS 0.03). It is now in the server HTML behind the pre-paint
 * "not-pro" marker: the inline script hides it before the first paint for a
 * Pro singer, and from hydration on it renders from the real entitlement.
 */
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { paintedFor } from "@/components/prepaint.testing";
import { crescendoCount, NotPro, ProWhisper } from "./gate";
import { MAX_SESSIONS } from "@/lib/progress-shape";

describe("ProWhisper before hydration", () => {
  const html = renderToStaticMarkup(
    <main>
      <ProWhisper className="mt-4" />
    </main>,
  );

  it("is in the server HTML, so a free singer's gate has its full height from the first paint", () => {
    expect(html).toContain("adds the coach");
    expect(html).toContain('href="/pro#buy"');
  });

  it("carries the not-pro marker, so the pre-paint state hides it from a Pro singer", () => {
    expect(html).toMatch(/<p [^>]*data-prepaint-plan="not-pro"/);
    expect(paintedFor(html, { plan: "pro" })).not.toContain("adds the coach");
    expect(paintedFor(html, { plan: "free" })).toContain("adds the coach");
    expect(paintedFor(html, { plan: "capped" })).toContain("adds the coach");
  });

  it("decides from the real entitlement once hydrated, and drops the marker", () => {
    const source = readFileSync(new URL("./gate.tsx", import.meta.url), "utf8");
    const body = source.slice(source.indexOf("export function ProWhisper"), source.indexOf("export function ProCrescendoNudge"));
    expect(body).toContain("if (hydrated && isPro) return null;");
    expect(body).toContain('prepaintMarker(hydrated, { plan: "not-pro" })');
    // Not held back on the entitlement cache: that is what mounted it late.
    expect(body).not.toContain("useProReady");
  });
});

describe("the session nudge's cadence", () => {
  const sessions = (n: number, id = (i: number) => `${1_790_000_000_000 + i}-${i}`) =>
    Array.from({ length: n }, (_, i) => ({ id: id(i) }));

  it("alternates on the session count below the cap", () => {
    for (const n of [0, 1, 2, 7, MAX_SESSIONS - 1]) expect(crescendoCount(sessions(n))).toBe(n);
  });

  it("keeps alternating past the cap instead of showing the full card every time", () => {
    // At the cap the count is stuck at an even MAX_SESSIONS; the newest
    // session's id is read instead, and over many results both parities come up.
    const parities = new Set<number>();
    for (let k = 0; k < 40; k++) {
      const full = sessions(MAX_SESSIONS);
      full[0] = { id: `${1_790_000_000_000 + k * 977}-${(k * 7919) % 1_000_000}` };
      parities.add(crescendoCount(full) % 2);
    }
    expect([...parities].sort()).toEqual([0, 1]);
  });
});

describe("NotPro, the wrapper that keeps shared sales copy from an owner", () => {
  it("is in the server HTML with its copy, behind the not-pro marker", () => {
    const html = renderToStaticMarkup(
      <p>
        Five minutes a day<NotPro>; Pro removes the limit</NotPro>.
      </p>,
    );
    // Crawlers and free visitors get the words from the first paint; the
    // pre-paint rule html[data-sing-plan="pro"] [data-prepaint-plan="not-pro"]
    // hides them for an owner before anything is painted.
    expect(html).toContain('<span data-prepaint-plan="not-pro">; Pro removes the limit</span>');
  });

  it("renders the element it is asked for, with its class", () => {
    const html = renderToStaticMarkup(
      <NotPro as="p" className="mt-5">
        $79 once
      </NotPro>,
    );
    expect(html).toBe('<p class="mt-5" data-prepaint-plan="not-pro">$79 once</p>');
  });
});
