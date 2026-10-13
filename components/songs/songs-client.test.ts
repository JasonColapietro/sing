/**
 * Deep links into the practice room: /songs?song=<slug> from a song page or a
 * lesson. The link answers to the paywall only; the band ladder governs
 * browsing the library, not a song the singer was explicitly sent to. Before
 * this, 23 of the 26 free song pages' "Sing this song" buttons dropped a new
 * visitor in the library with the song they came for marked Locked.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const pro = vi.hoisted(() => ({ active: false }));
vi.mock("@/lib/pro", () => ({
  getProState: () => ({ active: pro.active }),
  useIsPro: () => pro.active,
  useProReady: () => true,
}));

import { SONGS, songBySlug } from "./data";
import { bandForSong, bandOpen } from "./lib";
import { entitled } from "./songs-client";

describe("deep-link entitlement", () => {
  beforeEach(() => {
    pro.active = false;
  });

  it("opens a free song in a band the ladder has not opened", () => {
    const song = songBySlug("amazing-grace")!;
    // Locked in the library for a new visitor…
    expect(bandOpen(bandForSong(song), new Set(), SONGS)).toBe(false);
    // …but a link that names it may open it.
    expect(entitled(song)).toBe(true);
  });

  it("holds for every free song page's button, whatever its band", () => {
    for (const song of SONGS) expect(entitled(song), song.slug).toBe(true);
  });

  it("bypasses the ladder only, never the paywall", () => {
    const outside = { ...SONGS[0], id: "not-in-the-free-book", slug: "not-in-the-free-book" };
    expect(entitled(outside)).toBe(false);
  });
});
