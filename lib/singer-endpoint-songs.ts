import { midiToLabel } from "@/lib/audio/notes";
import type { Singer } from "@/lib/singers-data";

/**
 * The songs the catalog ties to a singer's reported top and bottom notes
 * (`highSource` / `lowSource`). They tell a reader where to listen for each
 * endpoint; they do not verify the endpoint. Copy built from these keeps the
 * "reported" framing the rest of the page uses.
 */

type EndpointFields = Pick<Singer, "name" | "lowMidi" | "highMidi" | "lowSource" | "highSource">;

export interface EndpointSong {
  end: "high" | "low";
  /** Note label as the page prints it, e.g. "D6". */
  note: string;
  song: string;
  /** A YouTube search for the artist and song: no embed, no API, no tracking. */
  listenUrl: string;
}

function clean(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function listenUrl(name: string, song: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} ${song}`)}`;
}

/** Highest first: the top note is what most searchers came to hear. */
export function endpointSongs(s: EndpointFields): EndpointSong[] {
  const out: EndpointSong[] = [];
  const high = clean(s.highSource);
  const low = clean(s.lowSource);
  if (high) out.push({ end: "high", note: midiToLabel(s.highMidi), song: high, listenUrl: listenUrl(s.name, high) });
  if (low) out.push({ end: "low", note: midiToLabel(s.lowMidi), song: low, listenUrl: listenUrl(s.name, low) });
  return out;
}

/** The lead line above the songs: why the reader should press play. */
export function endpointSongsLead(s: EndpointFields): string | null {
  const songs = endpointSongs(s);
  if (songs.length === 0) return null;
  const high = songs.find((x) => x.end === "high");
  const low = songs.find((x) => x.end === "low");
  if (high && low && high.song === low.song) {
    return `Both ends of ${s.name}’s reported range come from one song: “${high.song}.” Play it and listen for the ${low.note} at the bottom and the ${high.note} at the top.`;
  }
  if (high && low) {
    return `The songs below are where ${s.name}’s reported highest and lowest notes come from. Play them and listen for the ${high.note} at the top and the ${low.note} at the bottom.`;
  }
  const only = (high ?? low)!;
  return `The song below is where ${s.name}’s reported ${only.end === "high" ? "highest" : "lowest"} note, ${only.note}, comes from. Play it and listen for it.`;
}

/**
 * The search-snippet hook: "Hear the D6 in “Grace”". The top note wins
 * when both are known. Null when the catalog ties no song to either end.
 */
export function endpointSongHook(s: EndpointFields): string | null {
  const [first] = endpointSongs(s);
  if (!first) return null;
  return first.end === "high"
    ? `Hear the ${first.note} in “${first.song}”`
    : `Hear the low ${first.note} in “${first.song}”`;
}
