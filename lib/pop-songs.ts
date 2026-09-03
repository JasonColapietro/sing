import { midiToLabel } from "@/lib/audio/notes";
import { SINGERS } from "@/lib/singers-data";

/**
 * The popular-song range catalog. Facts about well-known songs — original
 * key, the commonly cited lead-vocal range, and what makes each one easy or
 * hard to sing. Same footing as the singer library: these are the figures
 * sheet-music publishers and fans circulate, not lab measurements, and the UI
 * says so. Deliberately no lyrics, no melody data, no audio — titles and
 * musical facts are not copyrightable; the song itself is.
 *
 * Every entry's artist should exist in the singer library (`artistSlugs`) so
 * the pages cross-link both ways. That is checked by lib/pop-songs.test.ts.
 */
export interface PopSong {
  slug: string;
  title: string;
  /** Display credit, e.g. "Lady Gaga & Bruno Mars". */
  artist: string;
  /** Singer-library slugs for the credited vocalists that exist there. */
  artistSlugs: string[];
  year: number;
  genre: string;
  /** Original key as published, e.g. "F minor". */
  key: string;
  lowMidi: number;
  highMidi: number;
  /** Where the cited figures come from (site names, arrangement notes). */
  sourceNote: string;
  /** Public arrangement detail backing the figures, when retained. */
  sourceUrl?: string;
  /** What the voice is actually asked to do. No lyric quotes. */
  blurb: string;
}

/** Parse scientific pitch ("A3", "F#5", "Bb2") to MIDI. C4 = 60. */
export function noteMidi(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name.trim());
  if (!m) throw new Error(`Bad note name: ${name}`);
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0;
  return (parseInt(m[3], 10) + 1) * 12 + base[m[1]] + acc;
}

export type PopDifficulty = "Easy" | "Medium" | "Hard";

/**
 * Difficulty from the two facts every entry carries. The songbook scores
 * melodic leaps too, but this catalog stores no melodies, so the read is
 * span plus altitude: a wide span or a top above F5 is what defeats most
 * untrained singers, regardless of the tune between the extremes.
 */
export function popDifficulty(song: PopSong): PopDifficulty {
  const span = song.highMidi - song.lowMidi;
  if (span >= 22 || song.highMidi >= 81) return "Hard";
  if (span <= 14 && song.highMidi <= 72) return "Easy";
  return "Medium";
}

export interface PopFit {
  verdict: "fits" | "high" | "low" | "wide" | "unknown";
  /** Semitones by which the song escapes the range, on the failing end. */
  offsetSemis: number;
}

/** How the song as written sits against a saved range test. */
export function popFit(
  song: PopSong,
  range: { lowMidi?: number; highMidi?: number },
): PopFit {
  if (
    range.lowMidi === undefined ||
    range.highMidi === undefined ||
    !Number.isInteger(range.lowMidi) ||
    !Number.isInteger(range.highMidi) ||
    range.lowMidi < 0 ||
    range.highMidi > 127 ||
    range.lowMidi > range.highMidi
  ) {
    return { verdict: "unknown", offsetSemis: 0 };
  }
  if (song.highMidi - song.lowMidi > range.highMidi - range.lowMidi) {
    return { verdict: "wide", offsetSemis: 0 };
  }
  if (song.highMidi > range.highMidi) {
    return { verdict: "high", offsetSemis: song.highMidi - range.highMidi };
  }
  if (song.lowMidi < range.lowMidi) {
    return { verdict: "low", offsetSemis: range.lowMidi - song.lowMidi };
  }
  return { verdict: "fits", offsetSemis: 0 };
}

export function popRangeLabel(song: PopSong): string {
  return `${midiToLabel(song.lowMidi)}–${midiToLabel(song.highMidi)}`;
}

export function popSongBySlug(slug: string): PopSong | undefined {
  return POP_SONGS.find((s) => s.slug === slug);
}

export function popSongsByArtistSlug(artistSlug: string): PopSong[] {
  return POP_SONGS.filter((s) => s.artistSlugs.includes(artistSlug));
}

/** Catalog songs nearest in range center, for the "try these next" links. */
export function relatedPopSongs(song: PopSong, count = 4): PopSong[] {
  const center = (song.lowMidi + song.highMidi) / 2;
  return POP_SONGS.filter((s) => s.slug !== song.slug)
    .map((s) => ({ s, d: Math.abs((s.lowMidi + s.highMidi) / 2 - center) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, count)
    .map((x) => x.s);
}

/** Library singers credited on this song, resolved to full records. */
export function popSongSingers(song: PopSong) {
  return song.artistSlugs
    .map((slug) => SINGERS.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => s !== undefined);
}

export const POP_SONGS: PopSong[] = [
  {
    slug: "espresso",
    title: "Espresso",
    artist: "Sabrina Carpenter",
    artistSlugs: ["sabrina-carpenter"],
    year: 2024,
    genre: "Pop",
    key: "A minor",
    lowMidi: noteMidi("G3"),
    highMidi: noteMidi("A4"),
    sourceNote: "Musicnotes original-key arrangement, G3–A4 in A minor",
    blurb:
      "A nine-semitone range makes this one of the most reachable hits of its decade on paper. What the record actually trades on is delivery: a lazy, behind-the-beat vocal fry drawl, quick flips into light head voice for the hook's decorations, and total rhythmic confidence. Sing it accurately but stiffly and it collapses; the notes are the least of it.",
  },
  {
    slug: "birds-of-a-feather",
    title: "BIRDS OF A FEATHER",
    artist: "Billie Eilish",
    artistSlugs: ["billie-eilish"],
    year: 2024,
    genre: "Pop",
    key: "D major",
    lowMidi: noteMidi("A3"),
    highMidi: noteMidi("D5"),
    sourceNote: "Musicnotes original-key arrangement, A3–D5 in D major",
    blurb:
      "Whispered dynamics over a steady pulse, with a late climb to sustained head-voice notes at the top of the staff — the loudest moment of the song is also its highest and most exposed. The challenge is producing a clear, supported tone at very low volume for three minutes, then opening up without the seams showing.",
  },
  {
    slug: "good-luck-babe",
    title: "Good Luck, Babe!",
    artist: "Chappell Roan",
    artistSlugs: ["chappell-roan"],
    year: 2024,
    genre: "Pop",
    key: "D major",
    lowMidi: noteMidi("A3"),
    highMidi: noteMidi("F#5"),
    sourceNote: "Musicnotes original-key arrangement, A3–F#5 in D major",
    blurb:
      "An eighties-styled synth-pop aria that saves its weapon for the bridge: repeated full-voiced climbs to F#5, sung with theatrical vibrato rather than a clean pop belt. The verses are easy; the last minute is a soprano workout that most untrained voices flip out of or push through, and either one is audible.",
  },
  {
    slug: "anti-hero",
    title: "Anti-Hero",
    artist: "Taylor Swift",
    artistSlugs: ["taylor-swift"],
    year: 2022,
    genre: "Pop",
    key: "E major",
    lowMidi: noteMidi("E3"),
    highMidi: noteMidi("C#5"),
    sourceNote: "Musicnotes original-key arrangement, E3–C#5 in E major",
    blurb:
      "Conversational verses in a comfortable mid register, a chorus that leans on sustained C#5s in mix, and a lot of quick, wordy phrasing between them. It sits almost entirely where an average female voice lives, which is much of why it took over — the top requires a settled mix but never a full belt.",
  },
  {
    slug: "flowers",
    title: "Flowers",
    artist: "Miley Cyrus",
    artistSlugs: ["miley-cyrus"],
    year: 2023,
    genre: "Pop",
    key: "A minor",
    lowMidi: noteMidi("E3"),
    highMidi: noteMidi("A4"),
    sourceNote: "Musicnotes original-key arrangement, E3–A4 in A minor",
    blurb:
      "A disco-tinged strut that lives low: the verses sit down near E3 in a smoky chest register most sopranos never use, and the chorus only rises to A4. The rasp and weight of the original are stylistic, not required — but the low tessitura is, and it is exactly where lighter voices lose all their color.",
  },
  {
    slug: "as-it-was",
    title: "As It Was",
    artist: "Harry Styles",
    artistSlugs: ["harry-styles"],
    year: 2022,
    genre: "Pop",
    key: "A major",
    lowMidi: noteMidi("E3"),
    highMidi: noteMidi("A4"),
    sourceNote: "Musicnotes original-key arrangement, written E4–A5, sounding E3–A4 in A major",
    blurb:
      "A bright, running eighth-note melody that barely pauses for breath — the difficulty is the treadmill tempo and the airy, forward tone, not the notes. The chorus taps A4 lightly rather than sitting on it, so the song rewards agility and breath planning over power.",
  },
  {
    slug: "vampire",
    title: "vampire",
    artist: "Olivia Rodrigo",
    artistSlugs: ["olivia-rodrigo"],
    year: 2023,
    genre: "Pop",
    key: "F major",
    lowMidi: noteMidi("F3"),
    highMidi: noteMidi("E5"),
    sourceNote: "Musicnotes original-key arrangement, F3–E5 in F major",
    blurb:
      "A three-act structure that starts as a piano ballad and ends in a driving rock climax, dragging the voice from a murmured F3 up to belted E5s along the way. The two-octave-minus-one span is real and so is the dynamic arc: this is a song that auditions every register a pop voice has, one act at a time.",
  },
  {
    slug: "someone-like-you",
    title: "Someone Like You",
    artist: "Adele",
    artistSlugs: ["adele"],
    year: 2011,
    genre: "Pop",
    key: "A major",
    lowMidi: noteMidi("E3"),
    highMidi: noteMidi("E5"),
    sourceNote: "Musicnotes original-key arrangement, E3–E5 in A major",
    blurb:
      "Two full octaves from a hushed E3 to the chorus's repeated E5 peaks, sung over nothing but piano. The chorus tessitura hangs high and stays there, and the emotional dynamic asks for those top notes in a cry-adjacent mix rather than a hard belt. The most commonly attempted and most commonly transposed karaoke ballad of its era, for exactly these reasons.",
  },
  {
    slug: "shallow",
    title: "Shallow",
    artist: "Lady Gaga & Bradley Cooper",
    artistSlugs: ["lady-gaga"],
    year: 2018,
    genre: "Pop",
    key: "G major",
    lowMidi: noteMidi("G3"),
    highMidi: noteMidi("D5"),
    sourceNote: "Musicnotes original-key duet arrangement, G3–D5 in G major; Gaga adds an E5 head-voice run beyond the written top",
    blurb:
      "A duet in which both singers share the same verse melody at the same octave, before the famous wordless climb hands the top of the song to a wide-open belted D5. That one moment is the whole test: everything before it is folk-simple, and then the bridge asks for the biggest, freest sound a voice can make, cold.",
  },
  {
    slug: "lose-control",
    title: "Lose Control",
    artist: "Teddy Swims",
    artistSlugs: ["teddy-swims"],
    year: 2023,
    genre: "Soul",
    key: "A major",
    lowMidi: noteMidi("E3"),
    highMidi: noteMidi("C#5"),
    sourceNote: "Musicnotes original-key arrangement, written E4–C#6, sounding E3–C#5 in A major",
    blurb:
      "A modern soul feature for a big male voice: gritty low verses, then choruses that park on sustained A4s and push to C#5 in full chest. The rasp is optional; the sheer sustained weight at the top of the tenor range is not, and the song repeats that demand until the last chorus.",
  },
  {
    slug: "beautiful-things",
    title: "Beautiful Things",
    artist: "Benson Boone",
    artistSlugs: ["benson-boone"],
    year: 2024,
    genre: "Pop",
    key: "Bb major",
    lowMidi: noteMidi("F3"),
    highMidi: noteMidi("F5"),
    sourceNote: "Musicnotes original-key arrangement, written F4–F6, sounding F3–F5 in Bb major",
    blurb:
      "A quiet folk-pop opening that detonates into one of the hardest choruses in current pop: two octaves of range topping out at a screamed-belt F5 that even trained tenors treat with respect. The dynamic whiplash is the point — the song is engineered around the jump from a whisper to that note.",
  },
  {
    slug: "i-will-always-love-you",
    title: "I Will Always Love You",
    artist: "Whitney Houston",
    artistSlugs: ["whitney-houston", "dolly-parton"],
    year: 1992,
    genre: "R&B",
    key: "A major",
    lowMidi: noteMidi("F#3"),
    highMidi: noteMidi("G#5"),
    sourceNote: "Musicnotes original-key arrangement, F#3–G#5 in A major",
    blurb:
      "Long a-cappella phrases with nowhere to hide, then a modulation up to B major for the final chorus that plants the famous belted climax near the top of the soprano break. The verses sit low and conversational, so the voice has to cover more than two octaves of dynamic and emotional ground in under five minutes. Written by Dolly Parton, whose original sits far lower and gentler.",
  },
  {
    slug: "take-me-to-church",
    title: "Take Me to Church",
    artist: "Hozier",
    artistSlugs: ["hozier"],
    year: 2013,
    genre: "Indie",
    key: "E minor",
    lowMidi: noteMidi("C3"),
    highMidi: noteMidi("B4"),
    sourceNote:
      "Musicnotes original-key arrangement, sounding C3–B4 in E minor; some range sites cite a low growl near E2",
    blurb:
      "A slow gospel-blues build that lives in the baritone's strongest octave, then leans on a sustained, full-voiced B4 in the choruses — comfortable territory for a high baritone, a strain for anyone who reaches it from below. The difficulty is stamina, not acrobatics: the chorus top repeats over and over at full volume.",
  },
  {
    slug: "someone-you-loved",
    title: "Someone You Loved",
    artist: "Lewis Capaldi",
    artistSlugs: ["lewis-capaldi"],
    year: 2018,
    genre: "Pop",
    key: "Db major",
    lowMidi: noteMidi("Eb3"),
    highMidi: noteMidi("Bb4"),
    sourceNote: "Musicnotes original-key arrangement, sounding Eb3–Bb4 in Db major",
    blurb:
      "A piano ballad whose whole design is the leap from a murmured verse to a chorus that sits on sustained Ab4s and Bb4s in full voice. The span is barely an octave and a half, but the tessitura of the chorus parks a male voice right in the passaggio and keeps it there — the classic reason it feels so much harder than its range suggests.",
  },
  {
    slug: "rolling-in-the-deep",
    title: "Rolling in the Deep",
    artist: "Adele",
    artistSlugs: ["adele"],
    year: 2010,
    genre: "Pop",
    key: "C minor",
    lowMidi: noteMidi("Bb3"),
    highMidi: noteMidi("D5"),
    sourceNote: "Musicnotes original-key arrangement, Bb3–D5 in C minor",
    blurb:
      "A stomping mid-tempo that never asks for extreme notes but asks for relentless chest-voice power. The chorus hammers C5 and D5 in full belt, phrase after phrase, and the backing-vocal stabs tempt singers into pushing. It rewards a settled mixed belt far more than raw volume — the range is modest, the workload is not.",
  },
  {
    slug: "uptown-funk",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    artistSlugs: ["bruno-mars"],
    year: 2014,
    genre: "Funk",
    key: "D minor",
    lowMidi: noteMidi("A3"),
    highMidi: noteMidi("D5"),
    sourceNote: "Commonly cited lead-vocal figure A3–D5 in D minor; the published full arrangement folds in bass and falsetto backing parts",
    blurb:
      "Rhythm first, range second: the lead line is a percussive tenor patter that has to stay light, precise and behind the beat, with quick jumps up to D5 that land as accents rather than held belts. Most of the difficulty is diction and groove at speed — sung heavy, it drags instantly.",
  },
  {
    slug: "creep",
    title: "Creep",
    artist: "Radiohead",
    artistSlugs: ["thom-yorke"],
    year: 1992,
    genre: "Alternative",
    key: "G major",
    lowMidi: noteMidi("B2"),
    highMidi: noteMidi("B4"),
    sourceNote: "Musicnotes original-key arrangement, sounding B2–B4 in G major",
    blurb:
      "Two octaves exactly, from a muttered low B up to the falsetto-or-full B4 wail before the last chorus. The verses ask for almost nothing technically, which is the trap — the dynamic explosion has to arrive out of that stillness, and the top can be taken in falsetto or full voice depending on what the singer has.",
  },
  {
    slug: "hallelujah",
    title: "Hallelujah",
    artist: "Jeff Buckley",
    artistSlugs: ["jeff-buckley", "leonard-cohen"],
    year: 1994,
    genre: "Folk",
    key: "C major",
    lowMidi: noteMidi("C3"),
    highMidi: noteMidi("F4"),
    sourceNote:
      "Musicnotes original-key arrangement of the Buckley version, sounding C3–F4 in C major; some sources cite F#4 at the top",
    blurb:
      "Leonard Cohen's hymn, in the version most people now mean: Buckley keeps the written range barely over an octave and makes the song entirely about breath control, dynamics and sustained quiet head-mix. It is one of the most singable ranges in the catalog and one of the hardest songs to sing well, because there is nothing to hide behind.",
  },
  {
    slug: "tennessee-whiskey",
    title: "Tennessee Whiskey",
    artist: "Chris Stapleton",
    artistSlugs: ["chris-stapleton"],
    year: 2015,
    genre: "Country",
    key: "A major",
    lowMidi: noteMidi("C#3"),
    highMidi: noteMidi("A4"),
    sourceNote: "Musicnotes original-key arrangement, sounding C#3–A4 in A major",
    blurb:
      "A slow 6/8 soul burn that sits squarely in baritone country and saves its ceiling for melisma. The written top is A4, but every chorus invites runs, bends and sustained pushes around it, and the swung phrasing exposes anyone who sings it straight. Range is the easy part; the licks are the audition.",
  },
  {
    slug: "die-with-a-smile",
    title: "Die With A Smile",
    artist: "Lady Gaga & Bruno Mars",
    artistSlugs: ["lady-gaga", "bruno-mars"],
    year: 2024,
    genre: "Pop",
    key: "A major",
    lowMidi: noteMidi("G#3"),
    highMidi: noteMidi("C#6"),
    sourceNote:
      "Musicnotes original-key duet arrangement, combined voice range G#3–C#6 in A major; the notated lead line tops near E5",
    blurb:
      "A retro-soul duet whose combined range looks terrifying on paper — the C#6 ceiling belongs to the harmonized falsetto ad-libs, while the lead melody itself crests around E5. Sung solo it demands both a warm low verse register and a committed belt; sung as written it needs two voices trading and stacking. The span is the widest in this catalog.",
  },
  {
    slug: "stick-season",
    title: "Stick Season",
    artist: "Noah Kahan",
    artistSlugs: ["noah-kahan"],
    year: 2022,
    genre: "Folk",
    key: "A major",
    lowMidi: noteMidi("E3"),
    highMidi: noteMidi("A4"),
    sourceNote: "Musicnotes original-key arrangement, written E4–A5, sounding E3–A4",
    blurb:
      "Strummed folk-pop with a fast, wordy verse and a chorus that sits on A4 at the top of an untrained male range without ever leaving it much room to rest. The song is a stamina-and-diction test: eleven semitones of range, a relentless syllable count, and a top note that recurs just often enough to find out whether it is really there.",
  },
  {
    slug: "drop-dead",
    title: "drop dead",
    artist: "Olivia Rodrigo",
    artistSlugs: ["olivia-rodrigo"],
    year: 2026,
    genre: "Pop",
    key: "Ab major",
    lowMidi: noteMidi("Ab3"),
    highMidi: noteMidi("F5"),
    sourceNote:
      "Musicnotes original-key Singer Pro arrangement MN0309204, Ab3–F5 in Ab major",
    sourceUrl:
      "https://www.musicnotes.com/sheetmusic/olivia-rodrigo/drop-dead/MN0309204",
    blurb:
      "Almost two octaves separate the grounded Ab3 low from the F5 peak, so this is less about one isolated high note than keeping every register available at a brisk pop pace. Start the phrases lighter than the recording suggests, map the two range edges separately, and only join the full song after both ends stay free of strain.",
  },
  {
    slug: "unchained-melody",
    title: "Unchained Melody",
    artist: "The Righteous Brothers",
    artistSlugs: ["bobby-hatfield"],
    year: 1965,
    genre: "Pop",
    key: "Bb major",
    lowMidi: noteMidi("C4"),
    highMidi: noteMidi("A5"),
    sourceNote:
      "Musicnotes original-key Singer Pro arrangement MN0133818, C4–A5 in Bb major",
    sourceUrl:
      "https://www.musicnotes.com/sheetmusic/the-righteous-brothers/unchained-melody/MN0133818",
    blurb:
      "The climb from C4 to A5 makes the ending the obvious headline, but the first job is controlled breath and an even legato line through the quieter opening. Practice the upper section softly and separately; the page's range fit is a boundary check, not permission to push for the recording's full volume or color.",
  },
  {
    slug: "greedy",
    title: "greedy",
    artist: "Tate McRae",
    artistSlugs: ["tate-mcrae"],
    year: 2023,
    genre: "Pop",
    key: "F# minor",
    lowMidi: noteMidi("F#3"),
    highMidi: noteMidi("D5"),
    sourceNote: "Musicnotes original-key arrangement, F#3–D5 in F# minor",
    blurb:
      "A talk-sung dance-pop verse that lives low in the alto register, then flips into a breathy hook with quick touches of D5. Nothing is sustained for long — the challenge is the constant switching between spoken-adjacent delivery, light head voice and short belted accents while keeping the rhythm pocket-tight.",
  },
];
