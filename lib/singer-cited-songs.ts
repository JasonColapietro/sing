/**
 * The songs most often cited for a singer's top and bottom notes, for pages
 * whose catalog record ties no song to either endpoint. Each note is the one
 * the cited song reaches, which can differ from the catalog's reported span,
 * so the page labels these "most cited" rather than reading them as the
 * catalog endpoints. Every note must sit inside the catalog's reported span,
 * or the page would contradict itself (lib/singer-endpoint-songs.test.ts).
 * Checked 2026-11-04 against Singing Carrots' per-song ranges (the highest-
 * and lowest-pitched songs in its database for each artist), plus a second
 * source where one agreed.
 */

export interface CitedSong {
  song: string;
  /** The note the cited song reaches, in the page's sharp spelling. */
  note: string;
}

export interface CitedEndpointSongs {
  high?: CitedSong;
  low?: CitedSong;
  /** Where the song-to-note pairs come from. */
  source: string;
}

const SINGING_CARROTS = "Singing Carrots’ song database (checked November 4, 2026)";

export const CITED_ENDPOINT_SONGS: Readonly<Record<string, CitedEndpointSongs>> = {
  "bruno-mars": {
    high: { song: "Gorilla", note: "A5" },
    low: { song: "Liquor Store Blues", note: "G#2" },
    source: SINGING_CARROTS,
  },
  "taylor-swift": {
    // No high song: the database's top pick (E6, a duet) sits above the catalog's A#5 ceiling.
    // Becomesingers names the same song for her A2.
    low: { song: "Cruel Summer", note: "A2" },
    source: SINGING_CARROTS,
  },
  "michael-jackson": {
    high: { song: "Smooth Criminal", note: "C6" },
    low: { song: "Burn This Disco Out", note: "E2" },
    source: SINGING_CARROTS,
  },
  "olivia-rodrigo": {
    high: { song: "traitor", note: "G#5" },
    low: { song: "ballad of a homeschooled girl", note: "D#3" },
    source: SINGING_CARROTS,
  },
  "stevie-wonder": {
    high: { song: "For Your Love", note: "D6" },
    low: { song: "I Wish", note: "D#2" },
    source: SINGING_CARROTS,
  },
};
