import { describe, expect, it } from "vitest";
import { SINGERS } from "@/lib/singers";
import { midiToLabel, labelToMidi } from "@/lib/audio/notes";
import { CITED_ENDPOINT_SONGS } from "@/lib/singer-cited-songs";
import {
  endpointSongFaqClause,
  endpointSongHook,
  endpointSongLabel,
  endpointSongs,
  endpointSongsHeading,
  endpointSongsLead,
  listenUrl,
  signatureListen,
} from "@/lib/singer-endpoint-songs";

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
    expect(endpointSongsLead(bySlug("mac-miller"))).toContain("Both ends of Mac Miller’s range come from one song: “Good News.”");
  });

  it("handles a singer with only a high song", () => {
    const s = SINGERS.find((x) => endpointSongs(x).map((e) => e.end).join() === "high")!;
    const [only] = endpointSongs(s);
    expect(endpointSongHook(s)).toBe(`Hear the ${only.note} in “${only.song}”`);
    expect(endpointSongsLead(s)).toMatch(/highest note|top of/);
  });

  it("falls back to the signature song when no song is tied to either end", () => {
    const s = SINGERS.find((x) => endpointSongs(x).length === 0)!;
    expect(endpointSongsLead(s)).toBeNull();
    expect(signatureListen(s)?.song).toBe(s.signatureSong);
    expect(endpointSongHook(s)).toBe(`Hear “${s.signatureSong}”`);
  });

  it("gives every singer page something to play", () => {
    for (const s of SINGERS) expect(endpointSongs(s).length > 0 || signatureListen(s) !== null, s.slug).toBe(true);
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

  it("fills the biggest pages from cited songs, labeled by the note each song reaches", () => {
    const s = bySlug("bruno-mars");
    const songs = endpointSongs(s);
    expect(songs.map((x) => [x.end, x.note, x.song, x.origin])).toEqual([
      ["high", "A5", "Gorilla", "cited"],
      ["low", "G#2", "Liquor Store Blues", "cited"],
    ]);
    expect(songs.map(endpointSongLabel)).toEqual(["High note", "Low note"]);
    expect(endpointSongHook(s)).toBe("Hear the A5 in “Gorilla”");
    expect(endpointSongFaqClause(s, "high")).toBe(" For the top of Bruno Mars’s range, listen to “Gorilla,” at A5.");
  });

  it("names only the ends it has songs for in the heading", () => {
    expect(endpointSongsHeading(bySlug("taylor-swift"))).toBe("Hear Taylor Swift’s lowest note");
    const highOnly = SINGERS.find((x) => endpointSongs(x).map((e) => e.end).join() === "high")!;
    expect(endpointSongsHeading(highOnly)).toBe(`Hear ${highOnly.name}’s highest note`);
    expect(endpointSongsHeading(bySlug("stevie-wonder"))).toBe("Hear Stevie Wonder’s highest and lowest notes");
  });

  it("prefers the catalog's own song over a cited one", () => {
    for (const s of SINGERS) {
      for (const item of endpointSongs(s)) {
        const catalog = item.end === "high" ? s.highSource : s.lowSource;
        if (catalog) expect(item.origin).toBe("catalog");
      }
    }
  });

  it("keeps every cited note inside the page's reported span", () => {
    for (const [slug, entry] of Object.entries(CITED_ENDPOINT_SONGS)) {
      const s = bySlug(slug);
      expect(s, slug).toBeDefined();
      for (const cited of [entry.high, entry.low].filter(Boolean)) {
        const midi = labelToMidi(cited!.note);
        expect(midi, `${slug} ${cited!.note}`).not.toBeNull();
        expect(midiToLabel(midi!), `${slug}: use the page's sharp spelling`).toBe(cited!.note);
        expect(midi!).toBeGreaterThanOrEqual(s.lowMidi);
        expect(midi!).toBeLessThanOrEqual(s.highMidi);
      }
    }
  });
});

import { closestSongs, songsInRange } from "@/lib/singer-range-profile";

describe("song links on every singer page", () => {
  it("lists songs in range, or the closest fits when none fits", () => {
    for (const s of SINGERS) {
      const n = songsInRange(s).length || closestSongs(s).length;
      expect(n, s.slug).toBeGreaterThan(0);
    }
  });
});
