import { describe, expect, it } from "vitest";
import { SINGERS } from "@/lib/singers";
import { endpointSongHook, endpointSongs, endpointSongsLead, listenUrl } from "@/lib/singer-endpoint-songs";

const bySlug = (slug: string) => SINGERS.find((s) => s.slug === slug)!;

describe("singer endpoint songs", () => {
  it("lists the high song first, with the page's note label", () => {
    const songs = endpointSongs(bySlug("peter-steele"));
    expect(songs.map((x) => [x.end, x.note, x.song])).toEqual([
      ["high", "G5", "Xero Tolerance"],
      ["low", "F1", "Cinnamon Girl"],
    ]);
  });

  it("says so when one song carries both ends", () => {
    expect(endpointSongsLead(bySlug("mac-miller"))).toContain("Both ends of Mac Miller’s reported range come from one song: “Good News.”");
  });

  it("handles a singer with only a high song", () => {
    const s = bySlug("jeff-buckley");
    expect(endpointSongs(s)).toHaveLength(1);
    expect(endpointSongHook(s)).toBe("Hear the D6 in “Grace”");
    expect(endpointSongsLead(s)).toBe("The song below is where Jeff Buckley’s reported highest note, D6, comes from. Play it and listen for it.");
  });

  it("returns nothing when the catalog ties no song to either end", () => {
    const s = bySlug("bruno-mars");
    expect(endpointSongs(s)).toEqual([]);
    expect(endpointSongsLead(s)).toBeNull();
    expect(endpointSongHook(s)).toBeNull();
  });

  it("links a plain YouTube search, URL-encoded", () => {
    expect(listenUrl("Beyoncé", "Love On Top")).toBe("https://www.youtube.com/results?search_query=Beyonc%C3%A9%20Love%20On%20Top");
  });

  it("never prints an em dash", () => {
    for (const s of SINGERS) {
      expect(endpointSongsLead(s) ?? "").not.toContain("—");
      expect(endpointSongHook(s) ?? "").not.toContain("—");
    }
  });
});
