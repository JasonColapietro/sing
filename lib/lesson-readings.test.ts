/**
 * The way back from a songbook page to the free course modules that practise
 * on it. Lessons link /songs/<slug> as practice material; the song page used
 * to link no lesson, so a visitor who found the song first never saw the
 * structured lessons built on it, though book and atlas chapters had that
 * link since round 3.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SongPage from "@/app/songs/[slug]/page";
import { ALL_SONGS } from "@/components/songs/data";
import { MODULE_PRACTICE } from "@/lib/lesson-practice";
import { freeLessonsUsingSong } from "@/lib/lesson-readings";
import { COURSE } from "@/lib/voice-lessons";

async function render(slug: string): Promise<string> {
  return renderToStaticMarkup(await SongPage({ params: Promise.resolve({ slug }) }));
}

const SONG_IDS = new Set(ALL_SONGS.map((s) => s.id));

describe("free lessons that use a song", () => {
  it("finds every songbook song a module lists as a study", () => {
    const cited = new Set(
      Object.values(MODULE_PRACTICE).flatMap((p) => p.studies.filter((id) => SONG_IDS.has(id))),
    );
    expect(cited.size).toBeGreaterThan(0);
    for (const id of cited) expect(freeLessonsUsingSong(id).length, id).toBeGreaterThan(0);
  });

  it("matches by song ID, not slug, where the two differ", () => {
    const song = ALL_SONGS.find((s) => s.id === "old-macdonald");
    expect(song?.slug).toBe("old-macdonald-had-a-farm");
    expect(freeLessonsUsingSong("old-macdonald").map((l) => l.href)).toContain(
      "/learn/voice/pitch-time-words/say-it-clearly",
    );
    expect(freeLessonsUsingSong("old-macdonald-had-a-farm")).toEqual([]);
  });

  it("lists them on the song page, in curriculum order", async () => {
    const html = await render("amazing-grace-full");
    expect(html).toContain("Free lessons that use this song");
    const hrefs = freeLessonsUsingSong("amazing-grace-full").map((l) => l.href);
    expect(hrefs[0]).toBe("/learn/voice/steady-tone/first-song-one-register");
    const courseOrder = COURSE.flatMap((s) => s.modules.map((m) => m.href)).filter(
      (href): href is string => !!href && hrefs.includes(href),
    );
    expect(hrefs).toEqual(courseOrder);
    const at = hrefs.map((href) => html.indexOf(`href="${href}"`));
    expect(at.every((i) => i > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("leaves the section off a song no module practises on", async () => {
    const uncited = ALL_SONGS.find((s) => freeLessonsUsingSong(s.id).length === 0);
    expect(uncited).toBeDefined();
    const html = await render(uncited!.slug);
    expect(html).not.toContain("Free lessons that use this song");
  });
});
