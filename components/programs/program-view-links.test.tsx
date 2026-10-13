/**
 * Every link to a program's own view, /programs?program=<id>, is a plain
 * anchor, not next/link.
 *
 * The server serves that address from /programs/<id> (next.config.ts), a
 * rewrite keyed on the query that the client router cannot see. Once it had
 * learned /programs (the list), a next/link to a program predicted the list's
 * page at that address, and its prefetch asked the server for the list's
 * segment there: a 404 in the console of the programs list, which failed the
 * runtime audit. lib/program-ids.ts programViewHref has the reasoning.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// next/link, marked, so its anchors can be told from plain ones.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a data-next-link="" href={href} {...rest}>
      {children}
    </a>
  ),
}));

const plan = vi.hoisted(() => ({ pro: false }));
vi.mock("@/lib/pro", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/pro")>()),
  useIsPro: () => plan.pro,
  useProReady: () => true,
}));

import ProgramsListPage from "@/app/programs/page";
import { BookProgramNote } from "@/components/book/program-link";
import { ProgramEntryCard } from "@/components/programs/today-card";
import type { ActiveProgram } from "@/components/programs/use-program";
import { FREE_WEEKS, PROGRAMS, programById } from "@/lib/programs";
import { programViewHref } from "@/lib/program-ids";

function active(id: string, index: number): ActiveProgram {
  const program = programById(id)!;
  return {
    program,
    progress: { programId: id, startedOn: "2026-10-01", done: [] },
    today: "2026-10-12",
    view: { status: "todo", index, completed: index },
    itemsDone: program.days[index].items.map(() => false),
    stepsDone: program.days[index].items.map(() => []),
    stepsWaived: program.days[index].items.map(() => []),
    countsFrom: "2026-10-12",
    readings: [],
  } as unknown as ActiveProgram;
}

/** Every anchor whose href is a program's view, with whether next/link drew it. */
function programAnchors(html: string): { href: string; nextLink: boolean }[] {
  return [...html.matchAll(/<a\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => /href="\/programs\?program=/.test(tag))
    .map((tag) => ({ href: /href="([^"]*)"/.exec(tag)![1].replaceAll("&amp;", "&"), nextLink: tag.includes("data-next-link") }));
}

describe("links to a program's own view", () => {
  it("are plain anchors on the programs list", () => {
    const links = programAnchors(renderToStaticMarkup(<ProgramsListPage />));
    expect(links.map((l) => l.href)).toEqual(PROGRAMS.map((p) => programViewHref(p.id)));
    expect(links.filter((l) => l.nextLink)).toEqual([]);
  });

  it("are plain anchors on today's program card, open or locked", () => {
    plan.pro = false;
    for (const index of [0, FREE_WEEKS * 7]) {
      const links = programAnchors(renderToStaticMarkup(<ProgramEntryCard active={active("mix-4w", index)} />));
      expect(links.map((l) => l.href), String(index)).toEqual([programViewHref("mix-4w")]);
      expect(links.filter((l) => l.nextLink), String(index)).toEqual([]);
    }
  });

  it("are plain anchors in the book", () => {
    const links = programAnchors(renderToStaticMarkup(<BookProgramNote scope="plan" />));
    expect(links.map((l) => l.href)).toEqual([programViewHref("measured-voice-12w")]);
    expect(links.filter((l) => l.nextLink)).toEqual([]);
  });

  it("still uses next/link for the list itself, which the router resolves on its own", () => {
    const html = renderToStaticMarkup(<ProgramEntryCard active={null} />);
    expect(html).toMatch(/<a data-next-link="" href="\/programs"/);
  });
});
