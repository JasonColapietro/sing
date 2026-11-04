import { midiToLabel } from "@/lib/audio/notes";
import { CITED_ENDPOINT_SONGS } from "@/lib/singer-cited-songs";
import type { Singer } from "@/lib/singers-data";

/**
 * The songs to press play on for a singer's top and bottom notes.
 *
 * - Catalog songs (`highSource` / `lowSource`) are where the catalog cites
 *   each reported endpoint, so they carry the endpoint note.
 * - Where the catalog has none, lib/singer-cited-songs.ts supplies the songs
 *   most often cited for the singer's top and bottom notes, with the note the
 *   song itself reaches. Those are labeled "most cited" because the note can
 *   differ from the catalog span.
 *
 * Neither verifies an endpoint; copy built from these keeps the page's
 * "reported" framing.
 */

type EndpointFields = Pick<Singer, "slug" | "name" | "lowMidi" | "highMidi" | "lowSource" | "highSource">;

export interface EndpointSong {
  end: "high" | "low";
  /** Note label as the page prints it, e.g. "D6". */
  note: string;
  song: string;
  /** "catalog": the catalog's cited recording for its endpoint; "cited": the most cited song for that end. */
  origin: "catalog" | "cited";
  /** A YouTube search for the artist and song: no embed, no API, no tracking. */
  listenUrl: string;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function listenUrl(name: string, song: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} ${song}`)}`;
}

function pick(s: EndpointFields, end: "high" | "low"): EndpointSong | null {
  const catalogSong = clean(end === "high" ? s.highSource : s.lowSource);
  if (catalogSong) {
    return {
      end,
      note: midiToLabel(end === "high" ? s.highMidi : s.lowMidi),
      song: catalogSong,
      origin: "catalog",
      listenUrl: listenUrl(s.name, catalogSong),
    };
  }
  const cited = CITED_ENDPOINT_SONGS[s.slug]?.[end];
  if (!cited) return null;
  return { end, note: cited.note, song: cited.song, origin: "cited", listenUrl: listenUrl(s.name, cited.song) };
}

/** Highest first: the top note is what most searchers came to hear. */
export function endpointSongs(s: EndpointFields): EndpointSong[] {
  return [pick(s, "high"), pick(s, "low")].filter((x): x is EndpointSong => x !== null);
}

/** Where a page's "most cited" songs come from, or null when it shows none. */
export function citedSongsSource(s: EndpointFields): string | null {
  return endpointSongs(s).some((x) => x.origin === "cited") ? CITED_ENDPOINT_SONGS[s.slug].source : null;
}

/** Card heading: names only the ends the page has a song for. */
export function endpointSongsHeading(s: EndpointFields): string {
  const ends = endpointSongs(s).map((x) => x.end);
  if (ends.length === 2) return `Hear ${s.name}’s highest and lowest notes`;
  return `Hear ${s.name}’s ${ends[0] === "high" ? "highest" : "lowest"} note`;
}

/** Card label for one song. */
export function endpointSongLabel(item: EndpointSong): string {
  if (item.origin === "cited") return item.end === "high" ? "Most cited high note" : "Most cited low note";
  return item.end === "high" ? "Highest reported note" : "Lowest reported note";
}

/** The lead line above the songs: why the reader should press play. */
export function endpointSongsLead(s: EndpointFields): string | null {
  const songs = endpointSongs(s);
  if (songs.length === 0) return null;
  const high = songs.find((x) => x.end === "high");
  const low = songs.find((x) => x.end === "low");
  const cited = songs.some((x) => x.origin === "cited");

  if (high && low && high.song === low.song) {
    return `Both ends of ${s.name}’s ${cited ? "most cited range" : "reported range"} come from one song: “${high.song}.” Play it and listen for the ${low.note} at the bottom and the ${high.note} at the top.`;
  }
  if (cited && high && low) {
    return `These are the songs most often cited for ${s.name}’s top and bottom notes: the ${high.note} in “${high.song}” and the ${low.note} in “${low.song}.” Press play and listen for them.`;
  }
  if (high && low) {
    return `The songs below are where ${s.name}’s reported highest and lowest notes come from. Play them and listen for the ${high.note} at the top and the ${low.note} at the bottom.`;
  }
  const only = (high ?? low)!;
  const which = only.end === "high" ? "highest" : "lowest";
  return only.origin === "cited"
    ? `The song below is the one most often cited for ${s.name}’s ${which} note, ${only.note}. Play it and listen for it.`
    : `The song below is where ${s.name}’s reported ${which} note, ${only.note}, comes from. Play it and listen for it.`;
}

/** FAQ clause naming the song for one end, or "" when there is none. */
export function endpointSongFaqClause(s: EndpointFields, end: "high" | "low"): string {
  const item = endpointSongs(s).find((x) => x.end === end);
  if (!item) return "";
  if (item.origin === "catalog") return ` Listen for it in “${item.song}.”`;
  return ` The song most often cited for the ${end === "high" ? "top" : "bottom"} of ${s.name}’s range is “${item.song},” at ${item.note}.`;
}

/**
 * The search-snippet hook: "Hear the D6 in “Grace”". The top note wins
 * when both are known. Null when no song is tied to either end.
 */
export function endpointSongHook(s: EndpointFields): string | null {
  const [first] = endpointSongs(s);
  if (!first) return null;
  return first.end === "high"
    ? `Hear the ${first.note} in “${first.song}”`
    : `Hear the low ${first.note} in “${first.song}”`;
}
