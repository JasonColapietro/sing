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

type EndpointFields = Pick<Singer, "slug" | "name" | "lowMidi" | "highMidi" | "lowSource" | "highSource" | "signatureSong">;

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

/** Card heading: names only the ends the page has a song for. */
export function endpointSongsHeading(s: EndpointFields): string {
  const ends = endpointSongs(s).map((x) => x.end);
  if (ends.length === 2) return `Hear ${s.name}’s highest and lowest notes`;
  return `Hear ${s.name}’s ${ends[0] === "high" ? "highest" : "lowest"} note`;
}

/** Card label for one song. */
export function endpointSongLabel(item: EndpointSong): string {
  if (item.origin === "cited") return item.end === "high" ? "High note" : "Low note";
  return item.end === "high" ? "Highest note" : "Lowest note";
}

/** The lead line above the songs: why the reader should press play. */
export function endpointSongsLead(s: EndpointFields): string | null {
  const songs = endpointSongs(s);
  if (songs.length === 0) return null;
  const high = songs.find((x) => x.end === "high");
  const low = songs.find((x) => x.end === "low");
  const cited = songs.some((x) => x.origin === "cited");

  if (high && low && high.song === low.song) {
    return `Both ends of ${s.name}’s range come from one song: “${high.song}.” Play it and listen for the ${low.note} at the bottom and the ${high.note} at the top.`;
  }
  if (cited && high && low) {
    return `These songs show the top and bottom of ${s.name}’s range: the ${high.note} in “${high.song}” and the ${low.note} in “${low.song}.” Press play and listen for them.`;
  }
  if (high && low) {
    return `The songs below hold ${s.name}’s highest and lowest notes. Play them and listen for the ${high.note} at the top and the ${low.note} at the bottom.`;
  }
  const only = (high ?? low)!;
  const which = only.end === "high" ? "highest" : "lowest";
  return only.origin === "cited"
    ? `The song below shows the ${only.end === "high" ? "top" : "bottom"} of ${s.name}’s range: the ${only.note} in “${only.song}.” Play it and listen for it.`
    : `The song below holds ${s.name}’s ${which} note, ${only.note}. Play it and listen for it.`;
}

/** FAQ clause naming the song for one end, or "" when there is none. */
export function endpointSongFaqClause(s: EndpointFields, end: "high" | "low"): string {
  const item = endpointSongs(s).find((x) => x.end === end);
  if (!item) return "";
  if (item.origin === "catalog") return ` Listen for it in “${item.song}.”`;
  return ` For the ${end === "high" ? "top" : "bottom"} of ${s.name}’s range, listen to “${item.song},” at ${item.note}.`;
}

/**
 * The search-snippet hook: "Hear the D6 in “Grace”". The top note wins
 * when both are known. Null when no song is tied to either end.
 */
export function endpointSongHook(s: EndpointFields): string | null {
  const [first] = endpointSongs(s);
  if (!first) {
    const sig = clean(s.signatureSong);
    return sig ? `Hear “${sig}”` : null;
  }
  return first.end === "high"
    ? `Hear the ${first.note} in “${first.song}”`
    : `Hear the low ${first.note} in “${first.song}”`;
}

/**
 * For a page with no song tied to either end: the singer's signature song, so
 * every page still has something to press play on. It names no note.
 */
export function signatureListen(s: EndpointFields): { song: string; listenUrl: string } | null {
  if (endpointSongs(s).length > 0) return null;
  const song = clean(s.signatureSong);
  return song ? { song, listenUrl: listenUrl(s.name, song) } : null;
}
