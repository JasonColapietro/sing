/**
 * A program's own view, /programs?program=<id>, is the program from the first
 * paint.
 *
 * A static page cannot read its query, so the deep link (today's card,
 * /progress, the book, GuitarHub's contract) used to prerender the list and
 * swap to the program's calendar after mount. next.config.ts now rewrites
 * each known id onto app/programs/[program], which prerenders that view; this
 * holds the server HTML of both pages to what each one shows.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import ProgramsListPage from "@/app/programs/page";
import ProgramViewPage, { dynamicParams, generateStaticParams } from "@/app/programs/[program]/page";
import { PROGRAMS } from "@/lib/programs";
import { paintedFor } from "@/components/prepaint.testing";
import { programIdAt } from "./programs-client";

async function view(program: string): Promise<string> {
  return renderToStaticMarkup(await ProgramViewPage({ params: Promise.resolve({ program }) }));
}

describe("a program's own view", () => {
  it("is prerendered for every program, and for nothing else", () => {
    expect(generateStaticParams()).toEqual(PROGRAMS.map((p) => ({ program: p.id })));
    expect(dynamicParams).toBe(false);
  });

  it("serves the program's calendar in the deep link's HTML, not the list", async () => {
    for (const p of PROGRAMS) {
      const html = await view(p.id);
      expect(html, p.id).toContain(`<h2 class="mt-3 text-2xl sm:text-3xl">${p.name}</h2>`);
      expect(html, p.id).toContain("← All programs");
      expect(html, p.id).toContain(`aria-label="Day ${p.days.length}: `);
      expect(html, p.id).not.toMatch(/See the \d+-day calendar/);
    }
    const list = renderToStaticMarkup(<ProgramsListPage />);
    for (const p of PROGRAMS) expect(list).toContain(`See the ${p.days.length}-day calendar`);
    expect(list).not.toContain("← All programs");
  });

  it("keeps the page's heading and today's card slot, which the pre-paint state shows only for that program", async () => {
    const html = await view("measured-voice-12w");
    expect(html).toMatch(/<h1[^>]*>Singing practice programs<\/h1>/);
    // The slot is there for a singer running this program (lib/prepaint.ts
    // says no program on another program's view, which hides it).
    expect(html).toContain('data-prepaint-slot="program-today"');
    expect(paintedFor(html, { plan: "free", program: null })).not.toContain('data-prepaint-slot="program-today"');
    expect(paintedFor(html, { plan: "free", program: "todo" })).toContain('data-prepaint-slot="program-today"');
  });

  it("marks the slot as a program's view, whose finished card has no calendar button", async () => {
    // app/globals.css sizes a finished run's slot a button row shorter there on a phone.
    expect(await view("high-notes-6w")).toMatch(/<div[^>]*data-prepaint-slot="program-today"[^>]*data-prepaint-view=""/);
    const list = renderToStaticMarkup(<ProgramsListPage />);
    expect(list).toContain('data-prepaint-slot="program-today"');
    expect(list).not.toContain("data-prepaint-view");
  });
});

describe("free-plan notes a Pro singer never sees", () => {
  it("are hidden from Pro before hydration, on the program's view and the list", async () => {
    // The prerender cannot know who is Pro; without the marker a Pro
    // singer's view lost these lines at hydration and moved up under them.
    const html = await view("measured-voice-12w");
    expect(html).toContain("is free.</span>");
    for (const plan of ["free", "capped"] as const) {
      expect(paintedFor(html, { plan }), plan).toContain("is free.</span>");
    }
    expect(paintedFor(html, { plan: "pro" })).not.toContain("is free.</span>");
    const pace = await view("foundations-2w");
    expect(pace).toContain("On the free plan.</span>");
    expect(paintedFor(pace, { plan: "pro" })).not.toContain("On the free plan.</span>");
    const list = renderToStaticMarkup(<ProgramsListPage />);
    expect(list).toContain("On the free plan&#x27;s five guided minutes a day");
    expect(paintedFor(list, { plan: "pro" })).not.toContain("On the free plan&#x27;s five guided minutes a day");
  });
});

describe("the program an address names", () => {
  it("reads the deep link's parameter, or the path of the page it is served from", () => {
    expect(programIdAt("/programs", "?program=mix-4w")).toBe("mix-4w");
    expect(programIdAt("/programs", "?utm_source=book&program=mix-4w")).toBe("mix-4w");
    expect(programIdAt("/programs", "")).toBeNull();
    expect(programIdAt("/programs/mix-4w", "")).toBe("mix-4w");
    expect(programIdAt("/programs/mix-4w/", "")).toBe("mix-4w");
    expect(programIdAt("/warmups", "")).toBeNull();
  });
});

describe("The Measured Voice's reading list", () => {
  it("sends the singer to chapters 13 and 10 before the weeks that build on them", async () => {
    const html = await view("measured-voice-12w");
    // Chapter 13: the plan's rules and the before-week-1 record week 12
    // reads back. Chapter 10: the transition weeks 5 to 8 work on.
    expect(html).toMatch(/Before day 1, read <a[^>]*href="\/book\/how-the-program-works"[^>]*>How the twelve weeks work<\/a>: /);
    expect(html).toMatch(/Before week 5, read <a[^>]*href="\/book\/finding-your-break"[^>]*>Finding your own break on the chart<\/a>: /);
    // Before the fortnight list, which is unchanged.
    expect(html.indexOf("/book/how-the-program-works")).toBeLessThan(html.indexOf("/book/weeks-1-2-baseline"));
    // Only the program that follows the book has one.
    expect(await view("foundations-2w")).not.toContain("/book/how-the-program-works");
  });
});
