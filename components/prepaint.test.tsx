import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DeepLinkSlot, PrepaintText, deepLinkMarker, prepaintMarker, prepaintWords, type DeepLinkRoom } from "./prepaint";
import { HIDE_RULES, paintedFor } from "./prepaint.testing";
import { PREPAINT_CONFIG } from "@/lib/prepaint-config";
import { programById } from "@/lib/programs";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** The selectors of the one rule in globals.css that hides pre-paint markers. */
function hideSelectors(): string[] {
  // Rules only, comments stripped, so prose that mentions a marker cannot match.
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const hits = [...rules.matchAll(/([^{}]*)\{\s*display:\s*none\s*!important;\s*\}/g)]
    .map((m) => m[1])
    .filter((selectors) => selectors.includes("[data-prepaint-"));
  expect(hits, "one pre-paint display:none rule in globals.css").toHaveLength(1);
  return hits[0].split(",").map((s) => s.trim()).filter(Boolean);
}

/** The rooms that open a deep link, by their token (lib/prepaint-config.ts). */
const ROOMS = Object.values(PREPAINT_CONFIG.deepLinks).map((link) => link.room as DeepLinkRoom);

/** A room's two deep-link rules: its front page hidden on its link's load, its slot shown only then. */
function deepLinkSelectors(room: DeepLinkRoom): string[] {
  return [
    `html[data-sing-deeplink="${room}"] [data-prepaint-deeplink="${room}"]`,
    `html:not([data-sing-deeplink="${room}"]) [data-prepaint-slot="deeplink-${room}"]`,
  ];
}

describe("pre-paint markers", () => {
  it("are on an element only until hydration", () => {
    expect(prepaintMarker(false, { plan: "capped" })).toEqual({ "data-prepaint-plan": "capped" });
    expect(prepaintMarker(false, { slot: "program-today" })).toEqual({ "data-prepaint-slot": "program-today" });
    expect(prepaintMarker(true, { plan: "capped", slot: "program-today" })).toEqual({});
  });

  it("are hidden by exactly the rules the markup tests paint with", () => {
    // Hidden with display:none, so a part another state needs is out of the
    // accessibility tree as well as off the screen. The deep-link rules are
    // also checked with their rooms below.
    expect(hideSelectors().sort()).toEqual(HIDE_RULES.map((r) => r.selector).sort());
  });

  it("hide a marked element's whole subtree and nothing around it", () => {
    const html = '<main><div data-prepaint-plan="capped"><div><p>wall</p></div></div><p data-prepaint-plan="free">left</p><div>room</div></main>';
    expect(paintedFor(html, { plan: "free" })).toBe('<main><p data-prepaint-plan="free">left</p><div>room</div></main>');
    expect(paintedFor(html, { plan: "capped" })).toBe('<main><div data-prepaint-plan="capped"><div><p>wall</p></div></div><div>room</div></main>');
    expect(paintedFor(html, { plan: "pro" })).toBe("<main><div>room</div></main>");
  });

  it("size each program slot for every status token the script can set", () => {
    for (const token of ["todo", "locked", "done", "next-locked", "finished"]) {
      expect(css).toContain(`html[data-sing-program~="${token}"] [data-prepaint-slot="program-today"]`);
    }
    expect(css).toContain('html[data-sing-program~="waits"] [data-prepaint-slot="program-lead"]');
    // The book's finished card, about twice another program's.
    expect(css).toContain('html[data-sing-program~="finished"][data-sing-program~="book"] [data-prepaint-slot="program-today"]');
  });

  it("size a finished run's slot for its own program, at both widths", () => {
    // Every program with check-in rows, or with a finished line of its own
    // (lib/programs.ts Program.finished: Recovery week's referral), has its
    // own size; the plain finished rule is a card with neither (lib/programs.ts
    // programReadings).
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const [phone, wide] = rules.split("@media (min-width: 40rem)");
    for (const [id, [, , , token]] of Object.entries(PREPAINT_CONFIG.programs)) {
      const program = programById(id)!;
      const rows = program.days.filter((d) =>
        d.items.some((it) => it.kind === "range" || (it.kind === "drill" && it.id === "sustain")),
      ).length;
      const own = rows > 0 || program.finished !== undefined;
      const selector = `html[data-sing-program~="finished"][data-sing-program~="${token}"] [data-prepaint-slot="program-today"]`;
      for (const [width, block] of [["375", phone], ["1280", wide]] as const) {
        if (!own) expect(block, `${id} at ${width}`).not.toContain(selector);
        else expect(block, `${id} at ${width}`).toContain(selector);
      }
    }
    // A program's own view drops the list's calendar button.
    expect(rules).toMatch(/\[data-prepaint-slot="program-today"\]\[data-prepaint-view\]\s*\{\s*min-height: calc\(var\(--finished-slot\) - 3\.25rem\);/);
  });
});

describe("pre-paint for a room's deep link", () => {
  it("covers every room the script names, each with its own token", () => {
    expect([...ROOMS].sort()).toEqual(["breath", "ear", "warmups"]);
    const selectors = hideSelectors();
    for (const room of ROOMS) {
      for (const selector of deepLinkSelectors(room)) expect(selectors, room).toContain(selector);
    }
  });

  it("paints a room's front page on any other load, and only its empty block on its own link's", () => {
    for (const room of ROOMS) {
      const html = `<main><h1>Room</h1><div data-prepaint-deeplink="${room}"><p>cards</p></div><div aria-hidden="true" class="min-h-screen" data-prepaint-slot="deeplink-${room}"></div></main>`;
      const front = `<main><h1>Room</h1><div data-prepaint-deeplink="${room}"><p>cards</p></div></main>`;
      const held = `<main><h1>Room</h1><div aria-hidden="true" class="min-h-screen" data-prepaint-slot="deeplink-${room}"></div></main>`;
      expect(paintedFor(html, { plan: "free" }), room).toBe(front);
      expect(paintedFor(html, { plan: "free", deeplink: room }), room).toBe(held);
      // Another room's link never hides this one.
      const other = ROOMS.find((r) => r !== room)!;
      expect(paintedFor(html, { plan: "free", deeplink: other }), room).toBe(front);
    }
  });

  it("marks the front page until the room has read its address, not only until hydration", () => {
    expect(deepLinkMarker(false, "breath")).toEqual({ "data-prepaint-deeplink": "breath" });
    expect(deepLinkMarker(true, "breath")).toEqual({});
  });

  it("holds a screen of empty page on the link's load, and the same block under a session", () => {
    const slot = renderToStaticMarkup(<DeepLinkSlot room="warmups" read={false} />);
    expect(slot).toBe('<div aria-hidden="true" class="min-h-screen" data-prepaint-slot="deeplink-warmups"></div>');
    // Read, it is the plain block a session's page keeps under the session.
    expect(renderToStaticMarkup(<DeepLinkSlot room="breath" read />)).toBe('<div aria-hidden="true" class="min-h-screen"></div>');
  });
});

describe("pre-paint slot for a saved range", () => {
  it("holds a popular song's answer for free and Pro singers, and nothing without a range", () => {
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const rule = (selector: string) =>
      new RegExp(`${selector.replace(/[[\]"=]/g, "\\$&")}\\s*\\{\\s*min-height: ([\\d.]+)rem;`).exec(rules)?.[1];
    const free = rule('html[data-sing-range="saved"] [data-prepaint-slot="song-verdict"]');
    const pro = rule('html[data-sing-range="saved"][data-sing-plan="pro"] [data-prepaint-slot="song-verdict"]');
    expect(free).toBeDefined();
    expect(pro).toBeDefined();
    // Pro's answer has no free-plan lines and no Pro box, so its slot is shorter.
    expect(Number(pro)).toBeLessThan(Number(free));
    // Only a saved range sizes it: a newcomer's card keeps its own height.
    const selectors = [...rules.matchAll(/([^{}]*)\{[^{}]*\}/g)]
      .flatMap((m) => m[1].split(","))
      .map((sel) => sel.trim())
      .filter((sel) => sel.includes('[data-prepaint-slot="song-verdict"]'));
    expect(selectors).toHaveLength(2);
    for (const sel of selectors) expect(sel).toMatch(/^html\[data-sing-range="saved"\]/);
  });
});

describe("pre-paint text", () => {
  it("is corrected by a script straight after it, from the field the pre-paint script left", () => {
    const html = renderToStaticMarkup(<p>left: <PrepaintText field="freeLeft" value="5:00" /></p>);
    const id = /<span id="([^"]+)">5:00<\/span>/.exec(html)?.[1];
    expect(id).toBeTruthy();
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
    const span = { textContent: "5:00" };
    const run = (prepaint: unknown) =>
      new Function("window", "document", script)({ __singPrepaint: prepaint }, {
        getElementById: (wanted: string) => (wanted === id ? span : null),
      });
    run({ freeLeft: "2:10" });
    expect(span.textContent).toBe("2:10");
    // No pre-paint state (the script failed): the server's text stands.
    span.textContent = "5:00";
    run(undefined);
    expect(span.textContent).toBe("5:00");
  });
});

describe("pre-paint words", () => {
  it("are an attribute the CSS paints until hydration, then plain text", () => {
    // Out of the static HTML's text, for readers that run no script and
    // apply no CSS; on screen from the first paint all the same.
    expect(renderToStaticMarkup(<h2>{prepaintWords(false, "That's your 5 free minutes")}</h2>)).toBe(
      '<h2><span data-prepaint-text="That&#x27;s your 5 free minutes"></span></h2>',
    );
    expect(renderToStaticMarkup(<h2>{prepaintWords(true, "That's your 5 free minutes")}</h2>)).toBe(
      "<h2>That&#x27;s your 5 free minutes</h2>",
    );
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rules).toMatch(/\[data-prepaint-text\]::before\s*\{\s*content:\s*attr\(data-prepaint-text\);\s*\}/);
  });
});
