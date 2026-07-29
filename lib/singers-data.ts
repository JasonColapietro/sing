/**
 * GENERATED FILE — edit scripts/compile-singers.mjs + its source batches, not
 * this file directly (hand-fixes are fine for individual corrections).
 *
 * Commonly cited (approximate) vocal ranges of well-known singers. These are
 * the figures fans and journalists circulate — not lab measurements — and the
 * UI says so wherever they appear.
 */

export type VoiceKind =
  | "Soprano"
  | "Mezzo-soprano"
  | "Contralto"
  | "Countertenor"
  | "Tenor"
  | "Baritone"
  | "Bass-baritone"
  | "Bass";

export interface Singer {
  slug: string;
  name: string;
  voiceType: VoiceKind;
  genres: string[];
  country: string;
  /** Year they became prominent. */
  activeFrom: number;
  lowMidi: number;
  highMidi: number;
  /** Highest full/belted note when meaningfully below highMidi. */
  beltMidi: number | null;
  whistle: boolean;
  signatureSong: string;
  lowSource: string | null;
  highSource: string | null;
  blurb: string;
}

export const SINGERS: Singer[] = [
  {
    "slug": "aaron-neville",
    "name": "Aaron Neville",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1966,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Tell It Like It Is",
    "lowSource": null,
    "highSource": null,
    "blurb": "High tenor with a wide, warbling vibrato and gospel turns on nearly every held note."
  },
  {
    "slug": "aaron-tveit",
    "name": "Aaron Tveit",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 2008,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Come What May",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rock-leaning tenor with a compressed high mix; pushes volume instead of switching registers."
  },
  {
    "slug": "adam-lambert",
    "name": "Adam Lambert",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2009,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Whataya Want from Me",
    "lowSource": null,
    "highSource": null,
    "blurb": "Theatrical tenor with a metallic mixed belt, fast vibrato, and rock rasp layered on top."
  },
  {
    "slug": "adam-levine",
    "name": "Adam Levine",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 2002,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "She Will Be Loved",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thin tenor built on falsetto and a nasal mix; adds compressed rasp rather than volume."
  },
  {
    "slug": "adele",
    "name": "Adele",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Soul"
    ],
    "country": "UK",
    "activeFrom": 2008,
    "lowMidi": 48,
    "highMidi": 82,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Rolling in the Deep",
    "lowSource": null,
    "highSource": null,
    "blurb": "Chesty mezzo with wide vibrato and audible glottal onsets; works a narrow, heavily supported belt band."
  },
  {
    "slug": "ado",
    "name": "Ado",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "J-Pop",
      "Rock",
      "Pop"
    ],
    "country": "Japan",
    "activeFrom": 2020,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "New Genesis",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gritty mezzo alternating growled low verses with a hard forward belt and abrupt clean high notes."
  },
  {
    "slug": "ailee",
    "name": "Ailee",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "K-Pop",
      "R&B",
      "Pop"
    ],
    "country": "South Korea",
    "activeFrom": 2012,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "I Will Show You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thick gospel-schooled mezzo with a wide chest belt and audible grit at the top of the register."
  },
  {
    "slug": "al-green",
    "name": "Al Green",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B",
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 1967,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Let's Stay Together",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light tenor that keeps breaking into a soft, moaning falsetto over laid-back phrasing."
  },
  {
    "slug": "al-jarreau",
    "name": "Al Jarreau",
    "voiceType": "Tenor",
    "genres": [
      "Jazz",
      "R&B",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1975,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "We're in This Love Together",
    "lowSource": null,
    "highSource": null,
    "blurb": "Mouth-percussion textures under a light tenor that flips to falsetto without a seam."
  },
  {
    "slug": "alanis-morissette",
    "name": "Alanis Morissette",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Alternative",
      "Rock",
      "Pop"
    ],
    "country": "Canada",
    "activeFrom": 1995,
    "lowMidi": 47,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "You Oughta Know",
    "lowSource": null,
    "highSource": null,
    "blurb": "Mezzo with hard consonants, sudden yelps into head voice, and heavy pitch bending on long notes."
  },
  {
    "slug": "alicia-keys",
    "name": "Alicia Keys",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2001,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": 75,
    "whistle": false,
    "signatureSong": "Fallin'",
    "lowSource": null,
    "highSource": null,
    "blurb": "Smoky mezzo with a slight nasal edge; belts from the chest and clips notes short for rhythm."
  },
  {
    "slug": "alison-krauss",
    "name": "Alison Krauss",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Folk"
    ],
    "country": "USA",
    "activeFrom": 1987,
    "lowMidi": 55,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "When You Say Nothing at All",
    "lowSource": null,
    "highSource": null,
    "blurb": "Straight-tone soprano, nearly breathless, exact intonation and very little ornament."
  },
  {
    "slug": "amy-grant",
    "name": "Amy Grant",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Gospel",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1982,
    "lowMidi": 53,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Baby Baby",
    "lowSource": null,
    "highSource": null,
    "blurb": "Conversational mezzo close to speech range; slight rasp, little ornament, breath-driven phrasing."
  },
  {
    "slug": "amy-lee",
    "name": "Amy Lee",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Alternative",
      "Rock",
      "Metal"
    ],
    "country": "USA",
    "activeFrom": 2003,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Bring Me to Life",
    "lowSource": null,
    "highSource": null,
    "blurb": "Trained mezzo with classical vowel shaping; steady belt and a clear, unhurried vibrato."
  },
  {
    "slug": "amy-winehouse",
    "name": "Amy Winehouse",
    "voiceType": "Contralto",
    "genres": [
      "Soul",
      "Jazz",
      "R&B"
    ],
    "country": "UK",
    "activeFrom": 2003,
    "lowMidi": 48,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Rehab",
    "lowSource": null,
    "highSource": null,
    "blurb": "Contralto with jazz-era diction, heavy vibrato, and a cracked, smoky bottom register."
  },
  {
    "slug": "andrea-bocelli",
    "name": "Andrea Bocelli",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical",
      "Pop"
    ],
    "country": "Italy",
    "activeFrom": 1994,
    "lowMidi": 48,
    "highMidi": 71,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Con te partirò",
    "lowSource": null,
    "highSource": "Nessun dorma",
    "blurb": "Light lyric tenor recorded close to the mic; softer, more crooned attack than stage projection."
  },
  {
    "slug": "angelique-kidjo",
    "name": "Angélique Kidjo",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Afrobeats",
      "Funk"
    ],
    "country": "Benin",
    "activeFrom": 1981,
    "lowMidi": 52,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Agolo",
    "lowSource": null,
    "highSource": null,
    "blurb": "Brassy forward mezzo with heavy chest projection; percussive diction, long loud held notes."
  },
  {
    "slug": "anita-baker",
    "name": "Anita Baker",
    "voiceType": "Contralto",
    "genres": [
      "Soul",
      "R&B",
      "Jazz"
    ],
    "country": "USA",
    "activeFrom": 1983,
    "lowMidi": 49,
    "highMidi": 85,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Sweet Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Velvety contralto with jazz phrasing; sits low, scoops into notes, seldom pushes volume."
  },
  {
    "slug": "ann-wilson",
    "name": "Ann Wilson",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "country": "USA",
    "activeFrom": 1975,
    "lowMidi": 43,
    "highMidi": 88,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "Barracuda",
    "lowSource": null,
    "highSource": null,
    "blurb": "Operatic power belt with a hard edge; holds high chest notes without letting them thin out."
  },
  {
    "slug": "anna-netrebko",
    "name": "Anna Netrebko",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical"
    ],
    "country": "Russia",
    "activeFrom": 1994,
    "lowMidi": 55,
    "highMidi": 86,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Sempre libera",
    "lowSource": null,
    "highSource": null,
    "blurb": "Started lyric and darkened toward dramatic roles; thick middle register under a bright, cutting top."
  },
  {
    "slug": "annie-lennox",
    "name": "Annie Lennox",
    "voiceType": "Contralto",
    "genres": [
      "Pop",
      "Synth-Pop",
      "Soul"
    ],
    "country": "UK",
    "activeFrom": 1983,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 75,
    "whistle": false,
    "signatureSong": "Sweet Dreams (Are Made of This)",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark chesty low notes under a hard-edged mid belt; tall vowels, vibrato held back until late."
  },
  {
    "slug": "anohni",
    "name": "ANOHNI",
    "voiceType": "Countertenor",
    "genres": [
      "Alternative",
      "Electronic",
      "Singer-Songwriter"
    ],
    "country": "UK",
    "activeFrom": 2000,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Hope There's Someone",
    "lowSource": null,
    "highSource": null,
    "blurb": "Countertenor with slow, wide vibrato and hollow, flute-like sustain, mostly sung above the staff."
  },
  {
    "slug": "anthony-kiedis",
    "name": "Anthony Kiedis",
    "voiceType": "Baritone",
    "genres": [
      "Funk",
      "Alternative",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1984,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Under the Bridge",
    "lowSource": null,
    "highSource": null,
    "blurb": "Narrow baritone built for rhythmic talk-singing; thin falsetto used as color on choruses."
  },
  {
    "slug": "aretha-franklin",
    "name": "Aretha Franklin",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Soul",
      "Gospel",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1961,
    "lowMidi": 43,
    "highMidi": 88,
    "beltMidi": 82,
    "whistle": false,
    "signatureSong": "Respect",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gospel-schooled mezzo: hard chest register, melismatic runs, sudden shifts from growl to soft head voice."
  },
  {
    "slug": "ariana-grande",
    "name": "Ariana Grande",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 2013,
    "lowMidi": 50,
    "highMidi": 100,
    "beltMidi": 76,
    "whistle": true,
    "signatureSong": "thank u, next",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light lyric soprano; moves from breathy mix into whistle register with almost no audible gear change."
  },
  {
    "slug": "arijit-singh",
    "name": "Arijit Singh",
    "voiceType": "Tenor",
    "genres": [
      "Pop"
    ],
    "country": "India",
    "activeFrom": 2013,
    "lowMidi": 48,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Tum Hi Ho",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light nasal tenor, breath-forward; slips into head voice at the top rather than pushing chest."
  },
  {
    "slug": "audra-mcdonald",
    "name": "Audra McDonald",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre",
      "Jazz",
      "Classical"
    ],
    "country": "USA",
    "activeFrom": 1994,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Summertime",
    "lowSource": null,
    "highSource": null,
    "blurb": "Classically placed lyric soprano with fast vibrato; drops to plain speech-tone for storytelling."
  },
  {
    "slug": "aulii-cravalho",
    "name": "Auli'i Cravalho",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2016,
    "lowMidi": 53,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "How Far I'll Go",
    "lowSource": null,
    "highSource": "How Far I'll Go",
    "blurb": "Bright youthful mezzo; unforced belt into the fifth octave, steady pitch, very little vibrato."
  },
  {
    "slug": "avi-kaplan",
    "name": "Avi Kaplan",
    "voiceType": "Bass",
    "genres": [
      "Pop",
      "Folk"
    ],
    "country": "USA",
    "activeFrom": 2011,
    "lowMidi": 27,
    "highMidi": 73,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Little Drummer Boy",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bass who drops into fry and subharmonics for pedal tones well under the written staff."
  },
  {
    "slug": "avril-lavigne",
    "name": "Avril Lavigne",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Punk",
      "Rock"
    ],
    "country": "Canada",
    "activeFrom": 2002,
    "lowMidi": 53,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Complicated",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal mezzo with flat, speech-like phrasing and a hard chest belt she rarely lifts to head voice."
  },
  {
    "slug": "axl-rose",
    "name": "Axl Rose",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1987,
    "lowMidi": 29,
    "highMidi": 94,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Sweet Child o' Mine",
    "lowSource": "There Was a Time",
    "highSource": null,
    "blurb": "Two voices in one: a low growl underneath, a thin cutting rasp on top, screams above that."
  },
  {
    "slug": "ayumi-hamasaki",
    "name": "Ayumi Hamasaki",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "J-Pop",
      "Pop"
    ],
    "country": "Japan",
    "activeFrom": 1998,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "M",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thin nasal mezzo with fast vibrato; drive comes from consonant attack more than chest volume."
  },
  {
    "slug": "bad-bunny",
    "name": "Bad Bunny",
    "voiceType": "Baritone",
    "genres": [
      "Latin",
      "Hip-Hop",
      "Reggae"
    ],
    "country": "Puerto Rico",
    "activeFrom": 2017,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": 64,
    "whistle": false,
    "signatureSong": "Titi Me Pregunto",
    "lowSource": null,
    "highSource": null,
    "blurb": "Low conversational baritone working a narrow band; rhythm and processing carry the melody."
  },
  {
    "slug": "baekhyun",
    "name": "Baekhyun",
    "voiceType": "Tenor",
    "genres": [
      "K-Pop",
      "Pop",
      "R&B"
    ],
    "country": "South Korea",
    "activeFrom": 2012,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "UN Village",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm tenor with soft-edged attack and quick runs; the mix thickens rather than thins as it climbs."
  },
  {
    "slug": "barbra-streisand",
    "name": "Barbra Streisand",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Musical Theatre"
    ],
    "country": "USA",
    "activeFrom": 1963,
    "lowMidi": 46,
    "highMidi": 84,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "The Way We Were",
    "lowSource": null,
    "highSource": null,
    "blurb": "Long legato lines with exact vowel placement; climaxes come from breath control, not volume."
  },
  {
    "slug": "barry-gibb",
    "name": "Barry Gibb",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Disco"
    ],
    "country": "UK",
    "activeFrom": 1967,
    "lowMidi": 41,
    "highMidi": 86,
    "beltMidi": 67,
    "whistle": false,
    "signatureSong": "Stayin' Alive",
    "lowSource": null,
    "highSource": null,
    "blurb": "Natural voice sits low and reedy; the disco records ride an insistent, vibrato-heavy falsetto."
  },
  {
    "slug": "barry-white",
    "name": "Barry White",
    "voiceType": "Bass",
    "genres": [
      "Soul",
      "Disco",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1973,
    "lowMidi": 38,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Can't Get Enough of Your Love, Babe",
    "lowSource": null,
    "highSource": null,
    "blurb": "Deep bass built for spoken-sung delivery: narrow working range, enormous resonance."
  },
  {
    "slug": "bebe-winans",
    "name": "BeBe Winans",
    "voiceType": "Tenor",
    "genres": [
      "Gospel",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1987,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Addictive Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm mid-weight tenor that slips into a soft-edged falsetto with no audible gear change."
  },
  {
    "slug": "ben-platt",
    "name": "Ben Platt",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2015,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Waving Through a Window",
    "lowSource": null,
    "highSource": null,
    "blurb": "Tight cry-heavy high mix with audible glottal breaks used as expression rather than fault."
  },
  {
    "slug": "benson-boone",
    "name": "Benson Boone",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock",
      "Singer-Songwriter"
    ],
    "country": "USA",
    "activeFrom": 2021,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Beautiful Things",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright tenor that jumps octaves fast, favoring an open-throated high belt and clean falsetto."
  },
  {
    "slug": "bernadette-peters",
    "name": "Bernadette Peters",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre"
    ],
    "country": "USA",
    "activeFrom": 1968,
    "lowMidi": 55,
    "highMidi": 81,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Children Will Listen",
    "lowSource": null,
    "highSource": null,
    "blurb": "Small breathy soprano with a fluttering vibrato; thins the top on purpose for a childlike color."
  },
  {
    "slug": "beyonce",
    "name": "Beyonce",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1997,
    "lowMidi": 47,
    "highMidi": 87,
    "beltMidi": 75,
    "whistle": false,
    "signatureSong": "Crazy in Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dense mezzo chest voice with rapid-fire runs; stacks a belted mix near Eb5 without thinning out."
  },
  {
    "slug": "bill-withers",
    "name": "Bill Withers",
    "voiceType": "Baritone",
    "genres": [
      "Soul",
      "R&B",
      "Folk"
    ],
    "country": "USA",
    "activeFrom": 1971,
    "lowMidi": 41,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Ain't No Sunshine",
    "lowSource": null,
    "highSource": null,
    "blurb": "Plain-spoken baritone, narrow range, conversational timing and almost no ornament."
  },
  {
    "slug": "billie-eilish",
    "name": "Billie Eilish",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Alternative",
      "Electronic"
    ],
    "country": "USA",
    "activeFrom": 2016,
    "lowMidi": 45,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "bad guy",
    "lowSource": null,
    "highSource": null,
    "blurb": "Close-mic whisper singing low in the chest register, with controlled fry and layered falsetto stacks."
  },
  {
    "slug": "billie-holiday",
    "name": "Billie Holiday",
    "voiceType": "Contralto",
    "genres": [
      "Jazz",
      "Blues"
    ],
    "country": "USA",
    "activeFrom": 1933,
    "lowMidi": 53,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Strange Fruit",
    "lowSource": null,
    "highSource": null,
    "blurb": "Narrow compass, heavy inflection: bent pitches, behind-the-beat placement, thin reedy top."
  },
  {
    "slug": "billie-joe-armstrong",
    "name": "Billie Joe Armstrong",
    "voiceType": "Tenor",
    "genres": [
      "Punk",
      "Rock",
      "Alternative"
    ],
    "country": "USA",
    "activeFrom": 1994,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Basket Case",
    "lowSource": null,
    "highSource": null,
    "blurb": "Snarling nasal tenor with a put-on accent; a narrow band worked hard, almost entirely in chest."
  },
  {
    "slug": "billy-corgan",
    "name": "Billy Corgan",
    "voiceType": "Tenor",
    "genres": [
      "Alternative",
      "Grunge",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1991,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "1979",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal, reedy tenor with a whining edge; cuts through dense guitars by placement, not volume."
  },
  {
    "slug": "billy-joel",
    "name": "Billy Joel",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock",
      "Singer-Songwriter"
    ],
    "country": "USA",
    "activeFrom": 1973,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Piano Man",
    "lowSource": null,
    "highSource": "An Innocent Man",
    "blurb": "Nasal tenor with hard consonants; belts to the ceiling of chest, then flips to thin falsetto."
  },
  {
    "slug": "bing-crosby",
    "name": "Bing Crosby",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1926,
    "lowMidi": 41,
    "highMidi": 65,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "White Christmas",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bass-leaning baritone sung close to the mic, warm and level, with small ornamental turns."
  },
  {
    "slug": "bjork",
    "name": "Björk",
    "voiceType": "Soprano",
    "genres": [
      "Alternative",
      "Electronic",
      "Pop"
    ],
    "country": "Iceland",
    "activeFrom": 1993,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "It's Oh So Quiet",
    "lowSource": null,
    "highSource": null,
    "blurb": "Swings from whisper to full-throat shout in a bar; open vowels and glottal attacks drive phrasing."
  },
  {
    "slug": "bob-dylan",
    "name": "Bob Dylan",
    "voiceType": "Tenor",
    "genres": [
      "Folk",
      "Singer-Songwriter",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1962,
    "lowMidi": 40,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Like a Rolling Stone",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal, talk-sung phrasing; pitch bends and rhythmic pushback carry more than sustained tone."
  },
  {
    "slug": "bob-marley",
    "name": "Bob Marley",
    "voiceType": "Tenor",
    "genres": [
      "Reggae",
      "Soul"
    ],
    "country": "Jamaica",
    "activeFrom": 1963,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "No Woman, No Cry",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light nasal-forward tenor; clipped offbeat phrasing, thin bright top, easy slides into head voice."
  },
  {
    "slug": "bobby-mcferrin",
    "name": "Bobby McFerrin",
    "voiceType": "Baritone",
    "genres": [
      "Jazz"
    ],
    "country": "USA",
    "activeFrom": 1982,
    "lowMidi": 40,
    "highMidi": 88,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Don't Worry, Be Happy",
    "lowSource": null,
    "highSource": null,
    "blurb": "Alternates chest bass and high falsetto mid-phrase, chest-slapping his own rhythm track."
  },
  {
    "slug": "bono",
    "name": "Bono",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Alternative"
    ],
    "country": "Ireland",
    "activeFrom": 1980,
    "lowMidi": 39,
    "highMidi": 73,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "With or Without You",
    "lowSource": null,
    "highSource": "Lemon",
    "blurb": "Chesty tenor with a pleading attack that scoops into pitch, plus a light falsetto he flips to."
  },
  {
    "slug": "brandon-boyd",
    "name": "Brandon Boyd",
    "voiceType": "Tenor",
    "genres": [
      "Alternative",
      "Rock",
      "Funk"
    ],
    "country": "USA",
    "activeFrom": 1997,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Drive",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm tenor with a loose, breathy falsetto and scooped phrasing; light attack on consonants."
  },
  {
    "slug": "brandy",
    "name": "Brandy",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1994,
    "lowMidi": 43,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "The Boy Is Mine",
    "lowSource": null,
    "highSource": null,
    "blurb": "Husky mid-weight mezzo built for stacked harmony; fast, light runs kept low in the mix."
  },
  {
    "slug": "brendon-urie",
    "name": "Brendon Urie",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock",
      "Alternative"
    ],
    "country": "USA",
    "activeFrom": 2005,
    "lowMidi": 40,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "I Write Sins Not Tragedies",
    "lowSource": null,
    "highSource": null,
    "blurb": "Theatrical tenor with a forward mix; belts high without thinning, then slips into clean falsetto."
  },
  {
    "slug": "brian-johnson",
    "name": "Brian Johnson",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Rock"
    ],
    "country": "UK",
    "activeFrom": 1980,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Back in Black",
    "lowSource": null,
    "highSource": null,
    "blurb": "Sits almost entirely in a strained, distorted upper register; little clean tone, high notes are shrieks."
  },
  {
    "slug": "brian-mcknight",
    "name": "Brian McKnight",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Soul",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1992,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Back at One",
    "lowSource": null,
    "highSource": null,
    "blurb": "Trained tenor with clean legato and a falsetto he steps into without an audible seam."
  },
  {
    "slug": "bruce-dickinson",
    "name": "Bruce Dickinson",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Hard Rock"
    ],
    "country": "UK",
    "activeFrom": 1979,
    "lowMidi": 40,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "The Number of the Beast",
    "lowSource": null,
    "highSource": "The Number of the Beast",
    "blurb": "Air-raid-siren tenor: forward placement, wide vibrato, holds high belts without thinning out."
  },
  {
    "slug": "bruce-springsteen",
    "name": "Bruce Springsteen",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Singer-Songwriter",
      "Folk"
    ],
    "country": "USA",
    "activeFrom": 1975,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Born to Run",
    "lowSource": null,
    "highSource": "Born to Run",
    "blurb": "Grainy baritone that works the low-middle and gets height by shouting through a raspy chest mix."
  },
  {
    "slug": "bruno-mars",
    "name": "Bruno Mars",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Funk",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 2010,
    "lowMidi": 43,
    "highMidi": 86,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Just the Way You Are",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright, forward tenor; snaps into a hard mix on choruses with clean falsetto stacked above."
  },
  {
    "slug": "bryn-terfel",
    "name": "Bryn Terfel",
    "voiceType": "Bass-baritone",
    "genres": [
      "Opera",
      "Classical",
      "Musical Theatre"
    ],
    "country": "UK",
    "activeFrom": 1989,
    "lowMidi": 41,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Votre toast (Toreador Song)",
    "lowSource": null,
    "highSource": null,
    "blurb": "Big, grainy bass-baritone with hard consonants; moves between Wagner, Mozart and stage musicals."
  },
  {
    "slug": "buju-banton",
    "name": "Buju Banton",
    "voiceType": "Bass-baritone",
    "genres": [
      "Reggae"
    ],
    "country": "Jamaica",
    "activeFrom": 1992,
    "lowMidi": 40,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Untold Stories",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gravel-heavy bass-baritone; sandpaper texture, chanted rhythm, shouts the top rather than lifting."
  },
  {
    "slug": "burna-boy",
    "name": "Burna Boy",
    "voiceType": "Baritone",
    "genres": [
      "Afrobeats",
      "R&B"
    ],
    "country": "Nigeria",
    "activeFrom": 2012,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Last Last",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm baritone with a smoky edge; drags behind the beat, then drops to soft airy falsetto."
  },
  {
    "slug": "caetano-veloso",
    "name": "Caetano Veloso",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Folk",
      "Singer-Songwriter"
    ],
    "country": "Brazil",
    "activeFrom": 1967,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": 67,
    "whistle": false,
    "signatureSong": "Alegria, Alegria",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light breathy tenor pitched close to speech; soft onsets, almost no vibrato."
  },
  {
    "slug": "camilo-sesto",
    "name": "Camilo Sesto",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop",
      "Musical Theatre"
    ],
    "country": "Spain",
    "activeFrom": 1972,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Vivir Asi Es Morir de Amor",
    "lowSource": null,
    "highSource": "Getsemani",
    "blurb": "High cutting tenor with a rock edge; loud upper sustains carried on heavy vibrato."
  },
  {
    "slug": "carrie-underwood",
    "name": "Carrie Underwood",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2005,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Before He Cheats",
    "lowSource": null,
    "highSource": null,
    "blurb": "Supported belt that hands off to a clean head voice; rasp on peaks without losing center."
  },
  {
    "slug": "cece-winans",
    "name": "CeCe Winans",
    "voiceType": "Soprano",
    "genres": [
      "Gospel",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1987,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Alabaster Box",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light lyric soprano, very even across the break; sparse ornament and a narrow, steady vibrato."
  },
  {
    "slug": "cecile-mclorin-salvant",
    "name": "Cécile McLorin Salvant",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Jazz",
      "Blues"
    ],
    "country": "USA",
    "activeFrom": 2010,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Wives and Lovers",
    "lowSource": null,
    "highSource": null,
    "blurb": "Conservatory control over a wide compass; crisp diction, abrupt shifts to a thin girlish top."
  },
  {
    "slug": "cecilia-bartoli",
    "name": "Cecilia Bartoli",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Opera",
      "Classical"
    ],
    "country": "Italy",
    "activeFrom": 1988,
    "lowMidi": 53,
    "highMidi": 86,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Agitata da due venti",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rapid-fire coloratura driven by audible diaphragm pulses; small, tightly focused mezzo core."
  },
  {
    "slug": "celia-cruz",
    "name": "Celia Cruz",
    "voiceType": "Contralto",
    "genres": [
      "Latin",
      "Jazz"
    ],
    "country": "Cuba",
    "activeFrom": 1950,
    "lowMidi": 52,
    "highMidi": 79,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "La Vida Es Un Carnaval",
    "lowSource": null,
    "highSource": null,
    "blurb": "Brassy forward chest tone built to cut through horn sections; percussive improvised soneos."
  },
  {
    "slug": "celine-dion",
    "name": "Celine Dion",
    "voiceType": "Soprano",
    "genres": [
      "Pop"
    ],
    "country": "Canada",
    "activeFrom": 1990,
    "lowMidi": 46,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "My Heart Will Go On",
    "lowSource": null,
    "highSource": null,
    "blurb": "Narrow vowels and a nasal-forward mix let her hold long belted phrases at steady pressure."
  },
  {
    "slug": "cesaria-evora",
    "name": "Cesária Évora",
    "voiceType": "Contralto",
    "genres": [
      "Folk",
      "Jazz"
    ],
    "country": "Cape Verde",
    "activeFrom": 1988,
    "lowMidi": 50,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Sodade",
    "lowSource": null,
    "highSource": null,
    "blurb": "Smoky low contralto sung softly close to the mic; conversational, unhurried, vibrato minimal."
  },
  {
    "slug": "chaka-khan",
    "name": "Chaka Khan",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Funk",
      "R&B",
      "Soul"
    ],
    "country": "USA",
    "activeFrom": 1974,
    "lowMidi": 41,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Ain't Nobody",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gritty low register into a bright, cutting upper mix; improvises like a horn player over the groove."
  },
  {
    "slug": "chappell-roan",
    "name": "Chappell Roan",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Synth-Pop",
      "Indie"
    ],
    "country": "USA",
    "activeFrom": 2020,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Good Luck, Babe!",
    "lowSource": null,
    "highSource": "Good Luck, Babe!",
    "blurb": "Theatre-sized soprano belt with hard consonants, then a sudden thin head voice up top."
  },
  {
    "slug": "charlie-puth",
    "name": "Charlie Puth",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 2015,
    "lowMidi": 43,
    "highMidi": 84,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Attention",
    "lowSource": null,
    "highSource": null,
    "blurb": "Clean, pitch-exact tenor; frequent falsetto flips and tightly stacked self-harmony."
  },
  {
    "slug": "chen",
    "name": "Chen",
    "voiceType": "Tenor",
    "genres": [
      "K-Pop",
      "Pop"
    ],
    "country": "South Korea",
    "activeFrom": 2012,
    "lowMidi": 43,
    "highMidi": 77,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Beautiful Goodbye",
    "lowSource": null,
    "highSource": null,
    "blurb": "Forward, chest-heavy tenor; belted lines land with a slight cry instead of a shout."
  },
  {
    "slug": "cher",
    "name": "Cher",
    "voiceType": "Contralto",
    "genres": [
      "Pop",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1965,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Believe",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thick low-set chest voice with wide vibrato; hard consonants, phrasing that sits behind the beat."
  },
  {
    "slug": "chester-bennington",
    "name": "Chester Bennington",
    "voiceType": "Tenor",
    "genres": [
      "Alternative",
      "Metal",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 2000,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "In the End",
    "lowSource": null,
    "highSource": "Given Up",
    "blurb": "Clean tenor with a rasp layer and screamed extension; abrupt switch between sung and torn tone."
  },
  {
    "slug": "chino-moreno",
    "name": "Chino Moreno",
    "voiceType": "Tenor",
    "genres": [
      "Alternative",
      "Metal",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1995,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Change (In the House of Flies)",
    "lowSource": null,
    "highSource": null,
    "blurb": "Tenor split between a soft, breathy falsetto and a raw shout, often layered in one phrase."
  },
  {
    "slug": "chris-cornell",
    "name": "Chris Cornell",
    "voiceType": "Tenor",
    "genres": [
      "Grunge",
      "Hard Rock",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1988,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": 78,
    "whistle": false,
    "signatureSong": "Black Hole Sun",
    "lowSource": null,
    "highSource": "Beyond the Wheel",
    "blurb": "Grit-heavy tenor that stays connected into a high sustained scream; wide vibrato on held notes."
  },
  {
    "slug": "chris-stapleton",
    "name": "Chris Stapleton",
    "voiceType": "Baritone",
    "genres": [
      "Country",
      "Blues",
      "Soul"
    ],
    "country": "USA",
    "activeFrom": 2015,
    "lowMidi": 41,
    "highMidi": 71,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Tennessee Whiskey",
    "lowSource": null,
    "highSource": "Tennessee Whiskey",
    "blurb": "Gravel-heavy baritone with gospel-blues runs; carries high lines in full voice, not falsetto."
  },
  {
    "slug": "chris-tomlin",
    "name": "Chris Tomlin",
    "voiceType": "Tenor",
    "genres": [
      "Gospel",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2002,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "How Great Is Our God",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light, airy tenor with modest chest weight; writes in keys that park him in his upper mix."
  },
  {
    "slug": "christina-aguilera",
    "name": "Christina Aguilera",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1999,
    "lowMidi": 48,
    "highMidi": 96,
    "beltMidi": 79,
    "whistle": true,
    "signatureSong": "Beautiful",
    "lowSource": null,
    "highSource": null,
    "blurb": "Heavy melisma over a thick, forward belt; adds whistle notes well above the staff when she wants them."
  },
  {
    "slug": "colm-wilkinson",
    "name": "Colm Wilkinson",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre"
    ],
    "country": "Ireland",
    "activeFrom": 1985,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Bring Him Home",
    "lowSource": null,
    "highSource": null,
    "blurb": "Reedy tenor with pronounced vibrato and a plaintive edge on long sustained high phrases."
  },
  {
    "slug": "corey-taylor",
    "name": "Corey Taylor",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
      "Hard Rock",
      "Alternative"
    ],
    "country": "USA",
    "activeFrom": 1999,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Duality",
    "lowSource": null,
    "highSource": null,
    "blurb": "Baritone that alternates clean melodic lines with a distorted false-cord scream."
  },
  {
    "slug": "curtis-mayfield",
    "name": "Curtis Mayfield",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "Funk",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1958,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Move On Up",
    "lowSource": null,
    "highSource": null,
    "blurb": "High, thin tenor sung mostly in a floated falsetto with very little vibrato."
  },
  {
    "slug": "cyndi-lauper",
    "name": "Cyndi Lauper",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "New Wave"
    ],
    "country": "USA",
    "activeFrom": 1983,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Time After Time",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright edgy chest notes that flip abruptly into a thin, wide-vibrato upper register."
  },
  {
    "slug": "cynthia-erivo",
    "name": "Cynthia Erivo",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre",
      "Soul",
      "Pop"
    ],
    "country": "UK",
    "activeFrom": 2015,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "I'm Here",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gospel-rooted belt with fast melisma and controlled rasp, releasing into clean head voice."
  },
  {
    "slug": "dangelo",
    "name": "D'Angelo",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Soul",
      "Funk"
    ],
    "country": "USA",
    "activeFrom": 1995,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Untitled (How Does It Feel)",
    "lowSource": null,
    "highSource": null,
    "blurb": "Slurred phrasing that drags behind the beat, with falsetto harmonies stacked in blocks."
  },
  {
    "slug": "david-bowie",
    "name": "David Bowie",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Pop",
      "New Wave"
    ],
    "country": "UK",
    "activeFrom": 1969,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Space Oddity",
    "lowSource": null,
    "highSource": null,
    "blurb": "Baritone with a wide color palette: theatrical vibrato low, thin brightness up top, heavy diction."
  },
  {
    "slug": "dean-martin",
    "name": "Dean Martin",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1946,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "That's Amore",
    "lowSource": null,
    "highSource": null,
    "blurb": "Low-set relaxed baritone, slid entrances, phrases deliberately lagging the beat."
  },
  {
    "slug": "debbie-harry",
    "name": "Debbie Harry",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Rock",
      "New Wave",
      "Punk"
    ],
    "country": "USA",
    "activeFrom": 1976,
    "lowMidi": 53,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Heart of Glass",
    "lowSource": null,
    "highSource": "Heart of Glass",
    "blurb": "Cool deadpan delivery that flips to a thin bright top; light onsets, very little vibrato."
  },
  {
    "slug": "demi-lovato",
    "name": "Demi Lovato",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2008,
    "lowMidi": 49,
    "highMidi": 86,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "Heart Attack",
    "lowSource": null,
    "highSource": null,
    "blurb": "Big-lunged belter with heavy vibrato; drives chest voice high, then unspools R&B runs coming down."
  },
  {
    "slug": "dennis-brown",
    "name": "Dennis Brown",
    "voiceType": "Tenor",
    "genres": [
      "Reggae",
      "Soul"
    ],
    "country": "Jamaica",
    "activeFrom": 1969,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Money in My Pocket",
    "lowSource": null,
    "highSource": null,
    "blurb": "Round warm tenor with a smooth chest-to-head handoff mid-phrase and quick falsetto flips."
  },
  {
    "slug": "devin-townsend",
    "name": "Devin Townsend",
    "voiceType": "Tenor",
    "genres": [
      "Metal"
    ],
    "country": "Canada",
    "activeFrom": 1993,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "Kingdom",
    "lowSource": null,
    "highSource": "Kingdom",
    "blurb": "Stacked wall-of-voice belt plus harsh screams; swings from near-whisper to full-throated push."
  },
  {
    "slug": "diana-krall",
    "name": "Diana Krall",
    "voiceType": "Contralto",
    "genres": [
      "Jazz"
    ],
    "country": "Canada",
    "activeFrom": 1993,
    "lowMidi": 52,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "The Look of Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Low, husky and unforced; lines sit close to speech pitch and rarely climb."
  },
  {
    "slug": "diana-ross",
    "name": "Diana Ross",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Soul",
      "Disco"
    ],
    "country": "USA",
    "activeFrom": 1964,
    "lowMidi": 51,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Ain't No Mountain High Enough",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thin-edged bright tone with breathy onsets; phrasing stays conversational across the groove."
  },
  {
    "slug": "dmitri-hvorostovsky",
    "name": "Dmitri Hvorostovsky",
    "voiceType": "Baritone",
    "genres": [
      "Opera",
      "Classical",
      "Folk"
    ],
    "country": "Russia",
    "activeFrom": 1989,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Dark Eyes (Ochi Chornye)",
    "lowSource": null,
    "highSource": null,
    "blurb": "Smooth Verdi baritone with a metallic edge and long, unbroken legato on a single breath."
  },
  {
    "slug": "dolly-parton",
    "name": "Dolly Parton",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1967,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Jolene",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright soprano, fast narrow vibrato, thin forward tone that cuts through banjo and fiddle."
  },
  {
    "slug": "dolores-oriordan",
    "name": "Dolores O'Riordan",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Alternative",
      "Rock",
      "Pop"
    ],
    "country": "Ireland",
    "activeFrom": 1993,
    "lowMidi": 53,
    "highMidi": 83,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Zombie",
    "lowSource": null,
    "highSource": null,
    "blurb": "Mezzo with a Limerick lilt, yodel-like register flips, and a keening upper chest tone."
  },
  {
    "slug": "donnie-mcclurkin",
    "name": "Donnie McClurkin",
    "voiceType": "Tenor",
    "genres": [
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 1996,
    "lowMidi": 47,
    "highMidi": 76,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "We Fall Down",
    "lowSource": null,
    "highSource": null,
    "blurb": "Reedy, high-placed tenor with quick access to falsetto and a narrow, fluttering vibrato."
  },
  {
    "slug": "donny-hathaway",
    "name": "Donny Hathaway",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B",
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 1970,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "A Song for You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Church-rooted tenor with a hard-edged mid range and a wide, urgent vibrato."
  },
  {
    "slug": "dua-lipa",
    "name": "Dua Lipa",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Disco",
      "Electronic"
    ],
    "country": "UK",
    "activeFrom": 2017,
    "lowMidi": 47,
    "highMidi": 79,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Don't Start Now",
    "lowSource": null,
    "highSource": null,
    "blurb": "Husky low-mid with cool, flat phrasing; sits in a narrow band and rarely reaches for head voice."
  },
  {
    "slug": "dusty-springfield",
    "name": "Dusty Springfield",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Soul"
    ],
    "country": "UK",
    "activeFrom": 1963,
    "lowMidi": 48,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Son of a Preacher Man",
    "lowSource": null,
    "highSource": null,
    "blurb": "Breathy, smoke-toned mezzo; heavy vibrato and chest-driven phrasing borrowed from soul records."
  },
  {
    "slug": "ed-sheeran",
    "name": "Ed Sheeran",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Singer-Songwriter",
      "Folk"
    ],
    "country": "UK",
    "activeFrom": 2011,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Shape of You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Speech-level tenor, breathy tone; leans on rhythmic delivery and light head voice up top."
  },
  {
    "slug": "eddie-vedder",
    "name": "Eddie Vedder",
    "voiceType": "Baritone",
    "genres": [
      "Grunge",
      "Rock",
      "Alternative"
    ],
    "country": "USA",
    "activeFrom": 1991,
    "lowMidi": 38,
    "highMidi": 76,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Alive",
    "lowSource": null,
    "highSource": null,
    "blurb": "Deep, rounded baritone with heavy vibrato and swallowed diction; sits low and pushes rather than lifts."
  },
  {
    "slug": "elis-regina",
    "name": "Elis Regina",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Latin",
      "Jazz",
      "Pop"
    ],
    "country": "Brazil",
    "activeFrom": 1965,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Como Nossos Pais",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright forward mezzo with abrupt dynamic swings and hard consonant attacks."
  },
  {
    "slug": "ella-fitzgerald",
    "name": "Ella Fitzgerald",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1935,
    "lowMidi": 50,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "A-Tisket, A-Tasket",
    "lowSource": null,
    "highSource": "How High the Moon",
    "blurb": "Flute-clear tone, exact intonation, scat lines phrased like a horn solo."
  },
  {
    "slug": "elton-john",
    "name": "Elton John",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock",
      "Singer-Songwriter"
    ],
    "country": "UK",
    "activeFrom": 1970,
    "lowMidi": 41,
    "highMidi": 77,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Rocket Man",
    "lowSource": null,
    "highSource": null,
    "blurb": "Full-throated tenor early on; after 1987 throat surgery the top went and the tone thickened."
  },
  {
    "slug": "elvis-presley",
    "name": "Elvis Presley",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Country",
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 1956,
    "lowMidi": 43,
    "highMidi": 73,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Can't Help Falling in Love",
    "lowSource": "Peace in the Valley",
    "highSource": null,
    "blurb": "Baritone with a thick chest register, wide vibrato, and a gospel-trained bottom he drops into freely."
  },
  {
    "slug": "emmylou-harris",
    "name": "Emmylou Harris",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Folk",
      "Singer-Songwriter"
    ],
    "country": "USA",
    "activeFrom": 1975,
    "lowMidi": 55,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Boulder to Birmingham",
    "lowSource": null,
    "highSource": null,
    "blurb": "Silvery soprano with a fragile edge on sustained notes; built to sit above a lead vocal."
  },
  {
    "slug": "enrico-caruso",
    "name": "Enrico Caruso",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "country": "Italy",
    "activeFrom": 1902,
    "lowMidi": 47,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Vesti la giubba",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark, baritonal tenor timbre on acoustic discs; transposed music down rather than reach past Bb4."
  },
  {
    "slug": "erykah-badu",
    "name": "Erykah Badu",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Soul",
      "R&B",
      "Jazz"
    ],
    "country": "USA",
    "activeFrom": 1997,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "On & On",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thin, nasal jazz-inflected tone with bent pitches and phrasing dragged behind the beat."
  },
  {
    "slug": "ethel-merman",
    "name": "Ethel Merman",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre"
    ],
    "country": "USA",
    "activeFrom": 1930,
    "lowMidi": 53,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "There's No Business Like Show Business",
    "lowSource": null,
    "highSource": null,
    "blurb": "Unamplified chest belt with a trumpet-like edge, no audible register shift, pitch dead center."
  },
  {
    "slug": "etta-james",
    "name": "Etta James",
    "voiceType": "Contralto",
    "genres": [
      "Soul",
      "Blues",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1955,
    "lowMidi": 44,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "At Last",
    "lowSource": null,
    "highSource": null,
    "blurb": "Blues-weighted contralto: thick chest tone, growled note entries, wide and slow vibrato."
  },
  {
    "slug": "fela-kuti",
    "name": "Fela Kuti",
    "voiceType": "Baritone",
    "genres": [
      "Afrobeats",
      "Funk",
      "Jazz"
    ],
    "country": "Nigeria",
    "activeFrom": 1961,
    "lowMidi": 41,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Zombie",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rough mid-weight baritone built for call-and-response chant; talks pitch, shouts line endings."
  },
  {
    "slug": "fiona-apple",
    "name": "Fiona Apple",
    "voiceType": "Contralto",
    "genres": [
      "Alternative",
      "Singer-Songwriter",
      "Jazz"
    ],
    "country": "USA",
    "activeFrom": 1996,
    "lowMidi": 48,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Criminal",
    "lowSource": null,
    "highSource": null,
    "blurb": "Contralto anchored in a husky low register; conversational timing with sudden gravel on peaks."
  },
  {
    "slug": "floor-jansen",
    "name": "Floor Jansen",
    "voiceType": "Soprano",
    "genres": [
      "Metal",
      "Opera"
    ],
    "country": "Netherlands",
    "activeFrom": 2000,
    "lowMidi": 52,
    "highMidi": 88,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "Ghost Love Score",
    "lowSource": null,
    "highSource": "Ghost Love Score",
    "blurb": "Trades operatic head voice for heavy chest belt mid-phrase with the tone matched across both."
  },
  {
    "slug": "florence-welch",
    "name": "Florence Welch",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Indie",
      "Alternative",
      "Rock"
    ],
    "country": "UK",
    "activeFrom": 2008,
    "lowMidi": 53,
    "highMidi": 83,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Dog Days Are Over",
    "lowSource": null,
    "highSource": null,
    "blurb": "Open-throated mezzo belt with a wide vibrato, usually stacked into choral upper harmonies."
  },
  {
    "slug": "frank-sinatra",
    "name": "Frank Sinatra",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1940,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "My Way",
    "lowSource": null,
    "highSource": null,
    "blurb": "Conversational baritone, long legato lines, breath control that carries a phrase past the bar."
  },
  {
    "slug": "frankie-valli",
    "name": "Frankie Valli",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1962,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 65,
    "whistle": false,
    "signatureSong": "Can't Take My Eyes Off You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Plain mid-range traded for a hard, ringing falsetto that carries the whole lead line."
  },
  {
    "slug": "fred-hammond",
    "name": "Fred Hammond",
    "voiceType": "Bass-baritone",
    "genres": [
      "Gospel",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1985,
    "lowMidi": 40,
    "highMidi": 70,
    "beltMidi": 67,
    "whistle": false,
    "signatureSong": "No Weapon",
    "lowSource": null,
    "highSource": null,
    "blurb": "Deep bass-baritone with thick low resonance; half-speaks phrases over funk and quartet grooves."
  },
  {
    "slug": "freddie-mercury",
    "name": "Freddie Mercury",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Hard Rock",
      "Pop"
    ],
    "country": "UK",
    "activeFrom": 1973,
    "lowMidi": 41,
    "highMidi": 89,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Bohemian Rhapsody",
    "lowSource": null,
    "highSource": "Get Down, Make Love",
    "blurb": "Baritone core sung as a tenor: fast vibrato, hard consonants, and a sudden switch into piercing falsetto."
  },
  {
    "slug": "garth-brooks",
    "name": "Garth Brooks",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "country": "USA",
    "activeFrom": 1989,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Friends in Low Places",
    "lowSource": null,
    "highSource": null,
    "blurb": "Sturdy baritone that takes its grit from breath pressure; stage-shout delivery up high."
  },
  {
    "slug": "geddy-lee",
    "name": "Geddy Lee",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "country": "Canada",
    "activeFrom": 1974,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Tom Sawyer",
    "lowSource": null,
    "highSource": null,
    "blurb": "Piercing, narrow-toned high tenor; early records sit near the top of his range with a nasal edge."
  },
  {
    "slug": "geoff-tate",
    "name": "Geoff Tate",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Hard Rock"
    ],
    "country": "USA",
    "activeFrom": 1983,
    "lowMidi": 40,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "Silent Lucidity",
    "lowSource": null,
    "highSource": "Queen of the Reich",
    "blurb": "Trained-sounding tenor: even legato, ringing sustain, more classical vowel shaping than most."
  },
  {
    "slug": "george-michael",
    "name": "George Michael",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Soul"
    ],
    "country": "UK",
    "activeFrom": 1982,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Careless Whisper",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm baritone with a smoky bottom; slides into a controlled, airy falsetto on hooks."
  },
  {
    "slug": "george-strait",
    "name": "George Strait",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "country": "USA",
    "activeFrom": 1981,
    "lowMidi": 45,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Amarillo by Morning",
    "lowSource": null,
    "highSource": null,
    "blurb": "Unhurried baritone, almost no vibrato, phrasing shaped for two-step and Western swing."
  },
  {
    "slug": "gladys-knight",
    "name": "Gladys Knight",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Soul",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1961,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Midnight Train to Georgia",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm, slightly husky mezzo that stays in chest voice and leans on phrasing over altitude."
  },
  {
    "slug": "gloria-estefan",
    "name": "Gloria Estefan",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Latin",
      "Pop"
    ],
    "country": "Cuba",
    "activeFrom": 1985,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Conga",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rounded mezzo with even vibrato; ballad lines stay inside a comfortable mid-belt."
  },
  {
    "slug": "grace-jones",
    "name": "Grace Jones",
    "voiceType": "Contralto",
    "genres": [
      "New Wave",
      "Disco",
      "Reggae"
    ],
    "country": "Jamaica",
    "activeFrom": 1977,
    "lowMidi": 50,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Pull Up to the Bumper",
    "lowSource": null,
    "highSource": null,
    "blurb": "Flat-toned contralto pitched near speech; hard consonants, dry chest resonance, vibrato withheld."
  },
  {
    "slug": "grace-slick",
    "name": "Grace Slick",
    "voiceType": "Contralto",
    "genres": [
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1966,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "White Rabbit",
    "lowSource": null,
    "highSource": "Somebody to Love",
    "blurb": "Flat declamatory chest tone with little vibrato; builds by adding volume, not by climbing."
  },
  {
    "slug": "gregory-porter",
    "name": "Gregory Porter",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Soul",
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 2010,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Liquid Spirit",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thick baritone with a gospel-shout attack on top and a resonant, grounded bottom octave."
  },
  {
    "slug": "gwen-stefani",
    "name": "Gwen Stefani",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Rock",
      "Punk",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1995,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Don't Speak",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright cartoon-clear tone with wide vibrato, parked in a punchy mid belt and rarely soft."
  },
  {
    "slug": "hank-williams",
    "name": "Hank Williams",
    "voiceType": "Tenor",
    "genres": [
      "Country",
      "Blues"
    ],
    "country": "USA",
    "activeFrom": 1947,
    "lowMidi": 45,
    "highMidi": 69,
    "beltMidi": 65,
    "whistle": false,
    "signatureSong": "Your Cheatin' Heart",
    "lowSource": null,
    "highSource": "Lovesick Blues",
    "blurb": "Thin keening tenor that flips into yodel breaks; hard nasal placement, cries on the vowel."
  },
  {
    "slug": "harry-styles",
    "name": "Harry Styles",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Rock"
    ],
    "country": "UK",
    "activeFrom": 2010,
    "lowMidi": 40,
    "highMidi": 77,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Sign of the Times",
    "lowSource": null,
    "highSource": null,
    "blurb": "Raspy baritone with a grainy upper mix; keeps the edge in the belt instead of smoothing it."
  },
  {
    "slug": "hayley-williams",
    "name": "Hayley Williams",
    "voiceType": "Soprano",
    "genres": [
      "Alternative",
      "Rock",
      "Punk"
    ],
    "country": "USA",
    "activeFrom": 2005,
    "lowMidi": 53,
    "highMidi": 86,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "Misery Business",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright forward mix that stays punchy at speed; climbs into a belt instead of a shout."
  },
  {
    "slug": "hikaru-utada",
    "name": "Hikaru Utada",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "J-Pop",
      "R&B",
      "Pop"
    ],
    "country": "Japan",
    "activeFrom": 1998,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "First Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Low-set husky mezzo, conversational phrasing, R&B melisma kept small and slightly behind the beat."
  },
  {
    "slug": "hozier",
    "name": "Hozier",
    "voiceType": "Baritone",
    "genres": [
      "Soul",
      "Blues",
      "Rock"
    ],
    "country": "Ireland",
    "activeFrom": 2013,
    "lowMidi": 40,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Take Me to Church",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gritty baritone that stacks a gospel-inflected rasp under a clean, sustained falsetto."
  },
  {
    "slug": "hugh-jackman",
    "name": "Hugh Jackman",
    "voiceType": "Baritone",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "country": "Australia",
    "activeFrom": 1998,
    "lowMidi": 45,
    "highMidi": 71,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "The Greatest Show",
    "lowSource": null,
    "highSource": null,
    "blurb": "Baritone with a bright forward belt; speech-driven phrasing, short sustains, restrained vibrato."
  },
  {
    "slug": "ian-gillan",
    "name": "Ian Gillan",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Rock",
      "Metal"
    ],
    "country": "UK",
    "activeFrom": 1969,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Smoke on the Water",
    "lowSource": null,
    "highSource": "Child in Time",
    "blurb": "High tenor that trades melody for siren-like screams; belts stay bright and forward with little weight."
  },
  {
    "slug": "idina-menzel",
    "name": "Idina Menzel",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1996,
    "lowMidi": 43,
    "highMidi": 86,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Let It Go",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal-forward mix and a hard-edged chest belt that stays loud without thinning near the top."
  },
  {
    "slug": "iu",
    "name": "IU",
    "voiceType": "Soprano",
    "genres": [
      "K-Pop",
      "Pop",
      "Singer-Songwriter"
    ],
    "country": "South Korea",
    "activeFrom": 2008,
    "lowMidi": 50,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Good Day",
    "lowSource": null,
    "highSource": null,
    "blurb": "Small bell-clear soprano tone, exact pitch placement, and a light mix she keeps deliberately unforced."
  },
  {
    "slug": "ivan-rebroff",
    "name": "Ivan Rebroff",
    "voiceType": "Bass",
    "genres": [
      "Classical",
      "Folk",
      "Musical Theatre"
    ],
    "country": "Germany",
    "activeFrom": 1966,
    "lowMidi": 29,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Kalinka",
    "lowSource": null,
    "highSource": null,
    "blurb": "Billed at four octaves: deep Russian bass below, thin falsetto soprano well above the staff."
  },
  {
    "slug": "jacob-collier",
    "name": "Jacob Collier",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop",
      "Funk"
    ],
    "country": "UK",
    "activeFrom": 2016,
    "lowMidi": 38,
    "highMidi": 86,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Moon River",
    "lowSource": null,
    "highSource": null,
    "blurb": "Wide range used compositionally: low chest notes, stacked falsetto, and deliberate microtonal slides."
  },
  {
    "slug": "james-blake",
    "name": "James Blake",
    "voiceType": "Tenor",
    "genres": [
      "Electronic",
      "R&B",
      "Alternative"
    ],
    "country": "UK",
    "activeFrom": 2011,
    "lowMidi": 41,
    "highMidi": 77,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Retrograde",
    "lowSource": null,
    "highSource": null,
    "blurb": "Falsetto-first and close-miked, breathy at low volume, then thickened with pitch-shifted layers."
  },
  {
    "slug": "james-brown",
    "name": "James Brown",
    "voiceType": "Baritone",
    "genres": [
      "Funk",
      "Soul",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1956,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "I Got You (I Feel Good)",
    "lowSource": null,
    "highSource": null,
    "blurb": "Shouted baritone used as percussion; screams and grunts placed on the beat."
  },
  {
    "slug": "james-hetfield",
    "name": "James Hetfield",
    "voiceType": "Baritone",
    "genres": [
      "Metal"
    ],
    "country": "USA",
    "activeFrom": 1983,
    "lowMidi": 40,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Enter Sandman",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rhythmic consonant-driven baritone, raspy edge, phrasing clipped tight to the riff."
  },
  {
    "slug": "james-taylor",
    "name": "James Taylor",
    "voiceType": "Baritone",
    "genres": [
      "Folk",
      "Singer-Songwriter",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1970,
    "lowMidi": 41,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Fire and Rain",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm, breath-controlled baritone with soft attacks and vibrato held back until a phrase ends."
  },
  {
    "slug": "janis-joplin",
    "name": "Janis Joplin",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Rock",
      "Blues",
      "Soul"
    ],
    "country": "USA",
    "activeFrom": 1967,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Piece of My Heart",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rasp-forward blues phrasing, heavy distortion and grit, pushed high in raw chest voice."
  },
  {
    "slug": "jason-mraz",
    "name": "Jason Mraz",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Singer-Songwriter",
      "Folk"
    ],
    "country": "USA",
    "activeFrom": 2002,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "I'm Yours",
    "lowSource": null,
    "highSource": null,
    "blurb": "Loose, jazz-leaning tenor; scat phrasing and quick trades between mix and light falsetto."
  },
  {
    "slug": "jazmine-sullivan",
    "name": "Jazmine Sullivan",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul"
    ],
    "country": "USA",
    "activeFrom": 2008,
    "lowMidi": 45,
    "highMidi": 85,
    "beltMidi": 80,
    "whistle": false,
    "signatureSong": "Bust Your Windows",
    "lowSource": null,
    "highSource": null,
    "blurb": "Flips between growled chest notes and airy, agile upper runs; rasp used as an effect, not a default."
  },
  {
    "slug": "jeff-buckley",
    "name": "Jeff Buckley",
    "voiceType": "Tenor",
    "genres": [
      "Alternative",
      "Rock",
      "Singer-Songwriter"
    ],
    "country": "USA",
    "activeFrom": 1994,
    "lowMidi": 40,
    "highMidi": 86,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Hallelujah",
    "lowSource": null,
    "highSource": "Grace",
    "blurb": "Very wide tenor with seamless falsetto shifts, long melisma, and near-whispered dynamic drops."
  },
  {
    "slug": "jennifer-hudson",
    "name": "Jennifer Hudson",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Soul",
      "R&B",
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 2004,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "And I Am Telling You I'm Not Going",
    "lowSource": null,
    "highSource": null,
    "blurb": "Heavy chest weight carried into the fifth octave; belts stay full instead of thinning to falsetto."
  },
  {
    "slug": "jeremy-jordan",
    "name": "Jeremy Jordan",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2012,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Santa Fe",
    "lowSource": null,
    "highSource": null,
    "blurb": "High tenor belt with a metallic ring; adds grit up top and flips to falsetto past the break."
  },
  {
    "slug": "jessie-j",
    "name": "Jessie J",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "country": "UK",
    "activeFrom": 2011,
    "lowMidi": 49,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "Price Tag",
    "lowSource": null,
    "highSource": null,
    "blurb": "Loud, pitch-precise belter with R&B melisma; keeps tone compressed and bright at the top of chest."
  },
  {
    "slug": "jessye-norman",
    "name": "Jessye Norman",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical",
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 1969,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Dich, teure Halle",
    "lowSource": null,
    "highSource": null,
    "blurb": "Broad, dark-hued dramatic soprano with contralto-like lows and unusually even breath control."
  },
  {
    "slug": "jill-scott",
    "name": "Jill Scott",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Soul",
      "R&B",
      "Jazz"
    ],
    "country": "USA",
    "activeFrom": 2000,
    "lowMidi": 48,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "A Long Walk",
    "lowSource": null,
    "highSource": null,
    "blurb": "Round, full-bodied mezzo that slides between spoken delivery and open, jazz-toned sustains."
  },
  {
    "slug": "jim-morrison",
    "name": "Jim Morrison",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Blues"
    ],
    "country": "USA",
    "activeFrom": 1967,
    "lowMidi": 40,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Light My Fire",
    "lowSource": null,
    "highSource": "When the Music's Over",
    "blurb": "Dark, resonant baritone with crooner control below and unpitched howls when he pushes past the staff."
  },
  {
    "slug": "jimin",
    "name": "Jimin",
    "voiceType": "Tenor",
    "genres": [
      "K-Pop",
      "Pop"
    ],
    "country": "South Korea",
    "activeFrom": 2013,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Serendipity",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light, narrow tenor tone; favors soft head voice and fast vibrato over chest projection."
  },
  {
    "slug": "jimmy-cliff",
    "name": "Jimmy Cliff",
    "voiceType": "Tenor",
    "genres": [
      "Reggae",
      "Soul"
    ],
    "country": "Jamaica",
    "activeFrom": 1962,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Many Rivers to Cross",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright gospel-leaning tenor; open vowels, long sustained upper notes, wide vibrato at phrase ends."
  },
  {
    "slug": "joan-baez",
    "name": "Joan Baez",
    "voiceType": "Soprano",
    "genres": [
      "Folk",
      "Singer-Songwriter"
    ],
    "country": "USA",
    "activeFrom": 1960,
    "lowMidi": 53,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Diamonds & Rust",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright soprano with a fast, narrow vibrato and clean vowels; little rasp and almost no chest push."
  },
  {
    "slug": "joan-jett",
    "name": "Joan Jett",
    "voiceType": "Contralto",
    "genres": [
      "Rock",
      "Punk",
      "Hard Rock"
    ],
    "country": "USA",
    "activeFrom": 1976,
    "lowMidi": 52,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "I Love Rock 'n' Roll",
    "lowSource": null,
    "highSource": null,
    "blurb": "Speech-level snarl in a narrow chest band; drive comes from consonants and timing, not pitch."
  },
  {
    "slug": "joan-sutherland",
    "name": "Joan Sutherland",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical"
    ],
    "country": "Australia",
    "activeFrom": 1959,
    "lowMidi": 55,
    "highMidi": 89,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Il dolce suono (Lucia's Mad Scene)",
    "lowSource": null,
    "highSource": "Il dolce suono",
    "blurb": "Round, high-volume coloratura with easy staccato and trills; diction blurred in the upper extension."
  },
  {
    "slug": "john-legend",
    "name": "John Legend",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Soul",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2004,
    "lowMidi": 40,
    "highMidi": 82,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "All of Me",
    "lowSource": null,
    "highSource": null,
    "blurb": "Church-trained tenor; clean chest tone, light rasp on push, and an easy step up to falsetto."
  },
  {
    "slug": "john-lennon",
    "name": "John Lennon",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "country": "UK",
    "activeFrom": 1963,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Come Together",
    "lowSource": null,
    "highSource": "Twist and Shout",
    "blurb": "Nasal, slightly flat-toned tenor; pushes into a torn-edged shout at the top instead of smoothing it out."
  },
  {
    "slug": "johnny-cash",
    "name": "Johnny Cash",
    "voiceType": "Bass-baritone",
    "genres": [
      "Country",
      "Folk"
    ],
    "country": "USA",
    "activeFrom": 1955,
    "lowMidi": 40,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Ring of Fire",
    "lowSource": null,
    "highSource": null,
    "blurb": "Narrow bass-baritone with a flat, spoken attack; adds volume rather than pitch at the top."
  },
  {
    "slug": "johnny-mathis",
    "name": "Johnny Mathis",
    "voiceType": "Tenor",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1956,
    "lowMidi": 47,
    "highMidi": 79,
    "beltMidi": 67,
    "whistle": false,
    "signatureSong": "Chances Are",
    "lowSource": null,
    "highSource": null,
    "blurb": "High, feathery tenor; vibrato stays fast and narrow even at whisper volume."
  },
  {
    "slug": "jon-bon-jovi",
    "name": "Jon Bon Jovi",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "country": "USA",
    "activeFrom": 1984,
    "lowMidi": 40,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Livin' on a Prayer",
    "lowSource": null,
    "highSource": "Livin' on a Prayer",
    "blurb": "Bright nasal tenor that drives choruses in a hard chest mix and roughens at the top end."
  },
  {
    "slug": "jonas-kaufmann",
    "name": "Jonas Kaufmann",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "country": "Germany",
    "activeFrom": 1994,
    "lowMidi": 47,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Pourquoi me réveiller",
    "lowSource": null,
    "highSource": null,
    "blurb": "Unusually dark, covered tenor sound with baritone-like lows and a tightly held, muscular top."
  },
  {
    "slug": "jonathan-groff",
    "name": "Jonathan Groff",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre"
    ],
    "country": "USA",
    "activeFrom": 2006,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "You'll Be Back",
    "lowSource": null,
    "highSource": null,
    "blurb": "Round warm tenor with clean onsets; steady sustain and almost no scooping into pitches."
  },
  {
    "slug": "jonghyun",
    "name": "Jonghyun",
    "voiceType": "Tenor",
    "genres": [
      "K-Pop",
      "R&B",
      "Pop"
    ],
    "country": "South Korea",
    "activeFrom": 2008,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Lonely",
    "lowSource": null,
    "highSource": null,
    "blurb": "Sharp ringing tenor with steady breath support; often ends phrases in controlled falsetto."
  },
  {
    "slug": "joni-mitchell",
    "name": "Joni Mitchell",
    "voiceType": "Soprano",
    "genres": [
      "Folk",
      "Singer-Songwriter",
      "Jazz"
    ],
    "country": "Canada",
    "activeFrom": 1968,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Both Sides Now",
    "lowSource": null,
    "highSource": null,
    "blurb": "Early records float in light head voice with wide leaps; her later voice settled lower and huskier."
  },
  {
    "slug": "jose-carreras",
    "name": "José Carreras",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical",
      "Pop"
    ],
    "country": "Spain",
    "activeFrom": 1971,
    "lowMidi": 48,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Amigos Para Siempre",
    "lowSource": null,
    "highSource": null,
    "blurb": "Lyric tenor with a plaintive, slightly grainy tone; leaned on phrasing rather than sheer volume."
  },
  {
    "slug": "jose-jose",
    "name": "Jose Jose",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "country": "Mexico",
    "activeFrom": 1970,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "El Triste",
    "lowSource": null,
    "highSource": "El Triste",
    "blurb": "Clean lyric tenor; accurate on stepwise ballad climbs, near-seamless chest-to-mix handoff."
  },
  {
    "slug": "josh-groban",
    "name": "Josh Groban",
    "voiceType": "Baritone",
    "genres": [
      "Classical",
      "Pop",
      "Musical Theatre"
    ],
    "country": "USA",
    "activeFrom": 2001,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "You Raise Me Up",
    "lowSource": null,
    "highSource": null,
    "blurb": "Pop-classical baritone recorded warm and close; opens into a full ring across the top fourth."
  },
  {
    "slug": "juan-gabriel",
    "name": "Juan Gabriel",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "country": "Mexico",
    "activeFrom": 1971,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Amor Eterno",
    "lowSource": null,
    "highSource": null,
    "blurb": "Reedy ranchera tenor that slips into falsetto mid-phrase, with loose conversational timing."
  },
  {
    "slug": "judy-garland",
    "name": "Judy Garland",
    "voiceType": "Contralto",
    "genres": [
      "Musical Theatre",
      "Jazz",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1939,
    "lowMidi": 53,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Over the Rainbow",
    "lowSource": null,
    "highSource": "The Man That Got Away",
    "blurb": "Contralto with a tremulous forward vibrato, thick chest resonance, and an audible catch on held notes."
  },
  {
    "slug": "julie-andrews",
    "name": "Julie Andrews",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre"
    ],
    "country": "UK",
    "activeFrom": 1956,
    "lowMidi": 55,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "The Sound of Music",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bell-clear soprano with exact intonation and light vibrato; very little chest-voice pressure."
  },
  {
    "slug": "jungkook",
    "name": "Jungkook",
    "voiceType": "Tenor",
    "genres": [
      "K-Pop",
      "Pop",
      "R&B"
    ],
    "country": "South Korea",
    "activeFrom": 2013,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Euphoria",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright tenor, breathy on low lines, then a thin but unstrained mix that slides into falsetto."
  },
  {
    "slug": "justin-bieber",
    "name": "Justin Bieber",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "country": "Canada",
    "activeFrom": 2009,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Sorry",
    "lowSource": null,
    "highSource": null,
    "blurb": "Breathy tenor with a light mix; moved from a boyish head voice to a closer, quieter delivery."
  },
  {
    "slug": "justin-timberlake",
    "name": "Justin Timberlake",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1996,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Cry Me a River",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light tenor living in falsetto and mix; rhythm-first phrasing with very little vibrato."
  },
  {
    "slug": "justin-vernon",
    "name": "Justin Vernon",
    "voiceType": "Tenor",
    "genres": [
      "Indie",
      "Folk",
      "Alternative"
    ],
    "country": "USA",
    "activeFrom": 2008,
    "lowMidi": 41,
    "highMidi": 77,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Skinny Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bon Iver's layered falsetto in tight harmony stacks; the chest voice stays quiet and slightly strained."
  },
  {
    "slug": "kacey-musgraves",
    "name": "Kacey Musgraves",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country",
      "Pop",
      "Singer-Songwriter"
    ],
    "country": "USA",
    "activeFrom": 2013,
    "lowMidi": 55,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Rainbow",
    "lowSource": null,
    "highSource": null,
    "blurb": "Soft-edged mezzo close to the mic, breath left in the tone, melody kept conversational."
  },
  {
    "slug": "karen-carpenter",
    "name": "Karen Carpenter",
    "voiceType": "Contralto",
    "genres": [
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1969,
    "lowMidi": 50,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Close to You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm low-middle register sung close to the mic, minimal vibrato, very even air pressure."
  },
  {
    "slug": "karen-clark-sheard",
    "name": "Karen Clark Sheard",
    "voiceType": "Soprano",
    "genres": [
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 1981,
    "lowMidi": 53,
    "highMidi": 87,
    "beltMidi": 82,
    "whistle": true,
    "signatureSong": "The Safest Place",
    "lowSource": null,
    "highSource": null,
    "blurb": "Wide chest belt plus a usable whistle register; stacks fast melisma over sustained cadences."
  },
  {
    "slug": "karol-g",
    "name": "Karol G",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Latin",
      "Pop",
      "Hip-Hop"
    ],
    "country": "Colombia",
    "activeFrom": 2017,
    "lowMidi": 52,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Provenza",
    "lowSource": null,
    "highSource": null,
    "blurb": "Slightly raspy mezzo with breathy onsets, parked in a narrow mid-belt for reggaeton hooks."
  },
  {
    "slug": "kate-bush",
    "name": "Kate Bush",
    "voiceType": "Soprano",
    "genres": [
      "Alternative",
      "Rock",
      "Pop"
    ],
    "country": "UK",
    "activeFrom": 1978,
    "lowMidi": 48,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Wuthering Heights",
    "lowSource": null,
    "highSource": null,
    "blurb": "Fluttering vibrato and character placement; jumps from breathy speech to a piercing head voice."
  },
  {
    "slug": "katy-perry",
    "name": "Katy Perry",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2008,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Firework",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright, forward belt with a hard nasal edge; head voice thins quickly above her chorus range."
  },
  {
    "slug": "kelly-clarkson",
    "name": "Kelly Clarkson",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 2002,
    "lowMidi": 50,
    "highMidi": 87,
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Since U Been Gone",
    "lowSource": null,
    "highSource": null,
    "blurb": "Open-throated, largely unornamented belt; sustains high chest notes with even vibrato and no scoop."
  },
  {
    "slug": "kenshi-yonezu",
    "name": "Kenshi Yonezu",
    "voiceType": "Baritone",
    "genres": [
      "J-Pop",
      "Pop"
    ],
    "country": "Japan",
    "activeFrom": 2012,
    "lowMidi": 41,
    "highMidi": 74,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Lemon",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal baritone with a flat deadpan low register that tightens into a strained, plaintive high belt."
  },
  {
    "slug": "kesha",
    "name": "Kesha",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Electronic"
    ],
    "country": "USA",
    "activeFrom": 2009,
    "lowMidi": 50,
    "highMidi": 88,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "TiK ToK",
    "lowSource": null,
    "highSource": "Praying",
    "blurb": "Talk-sung, processed verses give way to an open belt and thin, exposed notes at the very top."
  },
  {
    "slug": "kim-burrell",
    "name": "Kim Burrell",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Gospel",
      "Jazz"
    ],
    "country": "USA",
    "activeFrom": 1995,
    "lowMidi": 52,
    "highMidi": 86,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "I See a Victory",
    "lowSource": null,
    "highSource": null,
    "blurb": "Jazz harmonic sense in a gospel frame; chromatic runs, then sudden drops to a spoken chest tone."
  },
  {
    "slug": "king-diamond",
    "name": "King Diamond",
    "voiceType": "Countertenor",
    "genres": [
      "Metal"
    ],
    "country": "Denmark",
    "activeFrom": 1981,
    "lowMidi": 41,
    "highMidi": 86,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Welcome Home",
    "lowSource": null,
    "highSource": null,
    "blurb": "Two voices in one part: clipped mid-range narration against thin, wailing falsetto shrieks."
  },
  {
    "slug": "kirstin-maldonado",
    "name": "Kirstin Maldonado",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Musical Theatre"
    ],
    "country": "USA",
    "activeFrom": 2011,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Can't Sleep Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Theatre-trained mezzo with a firm chest belt, tight vowel shapes and controlled vibrato."
  },
  {
    "slug": "kristin-chenoweth",
    "name": "Kristin Chenoweth",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre",
      "Classical"
    ],
    "country": "USA",
    "activeFrom": 1999,
    "lowMidi": 55,
    "highMidi": 89,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Popular",
    "lowSource": null,
    "highSource": "Glitter and Be Gay",
    "blurb": "Coloratura top with easy staccato leaps, plus a separate brassy belt she switches into abruptly."
  },
  {
    "slug": "kurt-cobain",
    "name": "Kurt Cobain",
    "voiceType": "Baritone",
    "genres": [
      "Grunge",
      "Punk",
      "Alternative"
    ],
    "country": "USA",
    "activeFrom": 1989,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Smells Like Teen Spirit",
    "lowSource": null,
    "highSource": "Aneurysm",
    "blurb": "Rasped baritone that shifts from muttered verses to a torn, throat-forward shout at the chorus."
  },
  {
    "slug": "lady-gaga",
    "name": "Lady Gaga",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Synth-Pop"
    ],
    "country": "USA",
    "activeFrom": 2008,
    "lowMidi": 43,
    "highMidi": 84,
    "beltMidi": 82,
    "whistle": false,
    "signatureSong": "Bad Romance",
    "lowSource": null,
    "highSource": null,
    "blurb": "Trained mix with fast vibrato; jazz phrasing sits low, then she opens into a squared-off, brassy belt."
  },
  {
    "slug": "lana-del-rey",
    "name": "Lana Del Rey",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Alternative",
      "Singer-Songwriter"
    ],
    "country": "USA",
    "activeFrom": 2011,
    "lowMidi": 48,
    "highMidi": 86,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Summertime Sadness",
    "lowSource": null,
    "highSource": null,
    "blurb": "Two voices: a heavy low chest croon and a thin, girlish head register she slips into mid-phrase."
  },
  {
    "slug": "lata-mangeshkar",
    "name": "Lata Mangeshkar",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Classical"
    ],
    "country": "India",
    "activeFrom": 1949,
    "lowMidi": 55,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Lag Ja Gale",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thin, light soprano; pinpoint intonation above the staff with straight tone and slim vibrato."
  },
  {
    "slug": "lauren-daigle",
    "name": "Lauren Daigle",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Gospel",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2015,
    "lowMidi": 52,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "You Say",
    "lowSource": null,
    "highSource": null,
    "blurb": "Husky, grainy mezzo pitched low in her range; heavy rasp on consonants, slow wide vibrato."
  },
  {
    "slug": "lauryn-hill",
    "name": "Lauryn Hill",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul",
      "Hip-Hop"
    ],
    "country": "USA",
    "activeFrom": 1996,
    "lowMidi": 46,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Doo Wop (That Thing)",
    "lowSource": null,
    "highSource": null,
    "blurb": "Forward, nasal placement and rap-adjacent timing; belts inside a narrow, tightly held band."
  },
  {
    "slug": "layne-staley",
    "name": "Layne Staley",
    "voiceType": "Baritone",
    "genres": [
      "Grunge",
      "Alternative",
      "Hard Rock"
    ],
    "country": "USA",
    "activeFrom": 1990,
    "lowMidi": 40,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Man in the Box",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal-edged baritone with a heavy chest push; his stacked harmonies with Cantrell define the sound."
  },
  {
    "slug": "lea-michele",
    "name": "Lea Michele",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2006,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Don't Rain on My Parade",
    "lowSource": null,
    "highSource": null,
    "blurb": "Broad nasal belt with heavy vibrato; pop riffing layered over legit theatre technique."
  },
  {
    "slug": "lea-salonga",
    "name": "Lea Salonga",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "country": "Philippines",
    "activeFrom": 1989,
    "lowMidi": 53,
    "highMidi": 86,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "On My Own",
    "lowSource": null,
    "highSource": null,
    "blurb": "Clear, vibrato-light soprano with precise legato; shifts to a bright chest belt for pop lines."
  },
  {
    "slug": "leann-rimes",
    "name": "LeAnn Rimes",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1996,
    "lowMidi": 53,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Blue",
    "lowSource": null,
    "highSource": "Blue",
    "blurb": "Fast, wide vibrato and a clean yodel flip between chest and head voice, trained from childhood."
  },
  {
    "slug": "leonard-cohen",
    "name": "Leonard Cohen",
    "voiceType": "Bass-baritone",
    "genres": [
      "Folk",
      "Singer-Songwriter"
    ],
    "country": "Canada",
    "activeFrom": 1967,
    "lowMidi": 38,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Hallelujah",
    "lowSource": "You Want It Darker",
    "highSource": null,
    "blurb": "Speech-level bass-baritone, gravelly and unhurried, dropping to near-spoken low notes late in life."
  },
  {
    "slug": "leontyne-price",
    "name": "Leontyne Price",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical"
    ],
    "country": "USA",
    "activeFrom": 1955,
    "lowMidi": 55,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Pace, pace mio Dio",
    "lowSource": null,
    "highSource": "O patria mia",
    "blurb": "Creamy Verdi soprano with a wide, steady spin; floated high Cs over full orchestra without pushing."
  },
  {
    "slug": "lewis-capaldi",
    "name": "Lewis Capaldi",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Singer-Songwriter",
      "Soul"
    ],
    "country": "UK",
    "activeFrom": 2017,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Someone You Loved",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thick baritone with constant rasp; pushes into a strained high mix and lets the tone break."
  },
  {
    "slug": "linda-ronstadt",
    "name": "Linda Ronstadt",
    "voiceType": "Soprano",
    "genres": [
      "Rock",
      "Country",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1967,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Blue Bayou",
    "lowSource": null,
    "highSource": null,
    "blurb": "Full-bodied chest voice with clean intonation; carries weight high before easing into head voice."
  },
  {
    "slug": "lionel-richie",
    "name": "Lionel Richie",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1974,
    "lowMidi": 41,
    "highMidi": 79,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Hello",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm, unhurried tenor that leans on breathy tone over volume and steps up to a light falsetto."
  },
  {
    "slug": "lisa",
    "name": "LiSA",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "J-Pop",
      "Rock"
    ],
    "country": "Japan",
    "activeFrom": 2010,
    "lowMidi": 53,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Gurenge",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rock mezzo who takes anime choruses in a bright, strident chest mix and rarely drops to falsetto."
  },
  {
    "slug": "little-richard",
    "name": "Little Richard",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "R&B",
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 1955,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Tutti Frutti",
    "lowSource": null,
    "highSource": "Long Tall Sally",
    "blurb": "Gospel shouter's tenor: hard chest attack, heavy rasp, falsetto whoops flipped in mid-phrase."
  },
  {
    "slug": "lizzo",
    "name": "Lizzo",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B",
      "Hip-Hop"
    ],
    "country": "USA",
    "activeFrom": 2016,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 75,
    "whistle": false,
    "signatureSong": "Truth Hurts",
    "lowSource": null,
    "highSource": null,
    "blurb": "Full chest belt with gospel weight; switches into rap cadence and back without losing tone."
  },
  {
    "slug": "lorde",
    "name": "Lorde",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Alternative",
      "Pop",
      "Electronic"
    ],
    "country": "New Zealand",
    "activeFrom": 2013,
    "lowMidi": 50,
    "highMidi": 81,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Royals",
    "lowSource": null,
    "highSource": null,
    "blurb": "Low-sitting mezzo with a dry, spoken quality; layers her own voice instead of belting high."
  },
  {
    "slug": "loretta-lynn",
    "name": "Loretta Lynn",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country"
    ],
    "country": "USA",
    "activeFrom": 1960,
    "lowMidi": 55,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Coal Miner's Daughter",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal Appalachian mezzo, hard consonants, a bent and talking approach to the melody line."
  },
  {
    "slug": "louis-armstrong",
    "name": "Louis Armstrong",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Blues"
    ],
    "country": "USA",
    "activeFrom": 1925,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "What a Wonderful World",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gravel-and-air rasp, trumpet-shaped phrasing, scat treated as a second horn chorus."
  },
  {
    "slug": "luciano-pavarotti",
    "name": "Luciano Pavarotti",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "country": "Italy",
    "activeFrom": 1961,
    "lowMidi": 48,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Nessun dorma",
    "lowSource": null,
    "highSource": "Ah! mes amis, quel jour de fête!",
    "blurb": "Bright, forward Italian tenor with squillo that cuts; sang nine consecutive high Cs in full voice."
  },
  {
    "slug": "luis-miguel",
    "name": "Luis Miguel",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "country": "Mexico",
    "activeFrom": 1982,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "La Incondicional",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm bolero tenor; open vowels, unbroken legato, gradual crescendo into sustained notes."
  },
  {
    "slug": "luther-vandross",
    "name": "Luther Vandross",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Soul",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1981,
    "lowMidi": 47,
    "highMidi": 81,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Never Too Much",
    "lowSource": null,
    "highSource": null,
    "blurb": "Round, cushioned tenor with precise runs and falsetto used as ornament, not escape."
  },
  {
    "slug": "lzzy-hale",
    "name": "Lzzy Hale",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Hard Rock",
      "Metal"
    ],
    "country": "USA",
    "activeFrom": 2009,
    "lowMidi": 55,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "I Miss the Misery",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thick chest-mix belt with bluesy grit; climbs high without dropping into a lighter head tone."
  },
  {
    "slug": "madonna",
    "name": "Madonna",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Synth-Pop"
    ],
    "country": "USA",
    "activeFrom": 1983,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Like a Prayer",
    "lowSource": null,
    "highSource": null,
    "blurb": "Early records sit at speech-level chest tone; later work adds a rounder, trained middle register."
  },
  {
    "slug": "mahalia-jackson",
    "name": "Mahalia Jackson",
    "voiceType": "Contralto",
    "genres": [
      "Gospel",
      "Blues"
    ],
    "country": "USA",
    "activeFrom": 1947,
    "lowMidi": 52,
    "highMidi": 77,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Take My Hand, Precious Lord",
    "lowSource": null,
    "highSource": null,
    "blurb": "Chest-heavy contralto; slides into pitches and stretches syllables instead of landing them squarely."
  },
  {
    "slug": "marc-anthony",
    "name": "Marc Anthony",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1993,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": 73,
    "whistle": false,
    "signatureSong": "Vivir Mi Vida",
    "lowSource": null,
    "highSource": null,
    "blurb": "Cutting salsa tenor; nasal placement and tight vibrato on high sustained calls over horns."
  },
  {
    "slug": "maria-callas",
    "name": "Maria Callas",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical"
    ],
    "country": "Greece",
    "activeFrom": 1947,
    "lowMidi": 54,
    "highMidi": 87,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Casta Diva",
    "lowSource": null,
    "highSource": "Sempre libera",
    "blurb": "Uneven but instantly identifiable across three registers; used chest weight and portamento as drama."
  },
  {
    "slug": "mariah-carey",
    "name": "Mariah Carey",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "R&B",
      "Soul"
    ],
    "country": "USA",
    "activeFrom": 1990,
    "lowMidi": 41,
    "highMidi": 103,
    "beltMidi": 79,
    "whistle": true,
    "signatureSong": "Vision of Love",
    "lowSource": "Bye Bye",
    "highSource": "Emotions",
    "blurb": "Breathy low register, dense upper mix, and a whistle top used as melody rather than decoration."
  },
  {
    "slug": "mario-lanza",
    "name": "Mario Lanza",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "country": "USA",
    "activeFrom": 1947,
    "lowMidi": 48,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Be My Love",
    "lowSource": null,
    "highSource": "Be My Love",
    "blurb": "Operatic tenor with dense squillo; carries full chest weight to a sustained high C, no falsetto."
  },
  {
    "slug": "martina-mcbride",
    "name": "Martina McBride",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1992,
    "lowMidi": 53,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Independence Day",
    "lowSource": null,
    "highSource": null,
    "blurb": "Country soprano who belts from a braced chest mix; clean vowels, no scoop into the high notes."
  },
  {
    "slug": "marvin-gaye",
    "name": "Marvin Gaye",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1962,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "What's Going On",
    "lowSource": null,
    "highSource": null,
    "blurb": "Three voices in one: growl at the bottom, smooth mid, airy falsetto layered over the top."
  },
  {
    "slug": "marvin-winans",
    "name": "Marvin Winans",
    "voiceType": "Tenor",
    "genres": [
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 1981,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Tomorrow",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal, tightly focused tenor with wide vibrato; held notes thin out into falsetto at the top."
  },
  {
    "slug": "mary-j-blige",
    "name": "Mary J. Blige",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul",
      "Hip-Hop"
    ],
    "country": "USA",
    "activeFrom": 1992,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Family Affair",
    "lowSource": null,
    "highSource": null,
    "blurb": "Raw chest-dominant mezzo with a nasal edge and clipped, conversational phrasing."
  },
  {
    "slug": "matt-bellamy",
    "name": "Matt Bellamy",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Alternative"
    ],
    "country": "UK",
    "activeFrom": 1999,
    "lowMidi": 40,
    "highMidi": 86,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Uprising",
    "lowSource": null,
    "highSource": "Micro Cuts",
    "blurb": "Thin, vibrato-heavy tenor that trades chest weight for a piercing falsetto with an operatic wobble."
  },
  {
    "slug": "maxwell",
    "name": "Maxwell",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Soul"
    ],
    "country": "USA",
    "activeFrom": 1996,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Ascension (Don't Ever Wonder)",
    "lowSource": null,
    "highSource": "This Woman's Work",
    "blurb": "Sings long stretches in falsetto with a narrow, flute-like tone and slow vibrato."
  },
  {
    "slug": "maynard-james-keenan",
    "name": "Maynard James Keenan",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
      "Alternative",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1993,
    "lowMidi": 41,
    "highMidi": 78,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Schism",
    "lowSource": null,
    "highSource": null,
    "blurb": "Baritone with a controlled, narrow-vibrato line; moves to a piercing head voice without breaking tone."
  },
  {
    "slug": "mel-torme",
    "name": "Mel Tormé",
    "voiceType": "Tenor",
    "genres": [
      "Jazz"
    ],
    "country": "USA",
    "activeFrom": 1943,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Comin' Home Baby",
    "lowSource": null,
    "highSource": null,
    "blurb": "Soft-focus tone with almost no edge, paired with fast and accurate bebop scat lines."
  },
  {
    "slug": "mercedes-sosa",
    "name": "Mercedes Sosa",
    "voiceType": "Contralto",
    "genres": [
      "Folk",
      "Latin"
    ],
    "country": "Argentina",
    "activeFrom": 1965,
    "lowMidi": 52,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Gracias a la Vida",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark chest-dominant contralto; little vibrato, plain declamation, weight on the vowel."
  },
  {
    "slug": "merle-haggard",
    "name": "Merle Haggard",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "country": "USA",
    "activeFrom": 1965,
    "lowMidi": 41,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Okie from Muskogee",
    "lowSource": null,
    "highSource": null,
    "blurb": "Relaxed baritone with jazz-tinged timing; bends up into notes and stays behind the beat."
  },
  {
    "slug": "michael-buble",
    "name": "Michael Bublé",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "country": "Canada",
    "activeFrom": 2003,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Home",
    "lowSource": null,
    "highSource": null,
    "blurb": "Crooner baritone with a pop-sized top; well-supported, lightly swung, very even tone."
  },
  {
    "slug": "michael-crawford",
    "name": "Michael Crawford",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre"
    ],
    "country": "UK",
    "activeFrom": 1973,
    "lowMidi": 45,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "The Music of the Night",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light breath-heavy tenor with narrow vibrato; favors head voice over chest pressure."
  },
  {
    "slug": "michael-jackson",
    "name": "Michael Jackson",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B",
      "Funk"
    ],
    "country": "USA",
    "activeFrom": 1969,
    "lowMidi": 39,
    "highMidi": 89,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Billie Jean",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light, percussive tenor; hiccups and breath grunts used as rhythm, plus a thin high falsetto."
  },
  {
    "slug": "michael-kiske",
    "name": "Michael Kiske",
    "voiceType": "Tenor",
    "genres": [
      "Metal"
    ],
    "country": "Germany",
    "activeFrom": 1987,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "I Want Out",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright, boyish high tenor that stays connected and vibrato-light through fifth-octave lines."
  },
  {
    "slug": "michael-w-smith",
    "name": "Michael W. Smith",
    "voiceType": "Tenor",
    "genres": [
      "Gospel",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1983,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Friends",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thin, bright tenor built for high keys; reaches for head voice instead of pushing chest upward."
  },
  {
    "slug": "mick-jagger",
    "name": "Mick Jagger",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Blues"
    ],
    "country": "UK",
    "activeFrom": 1963,
    "lowMidi": 41,
    "highMidi": 77,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "(I Can't Get No) Satisfaction",
    "lowSource": null,
    "highSource": "Emotional Rescue",
    "blurb": "Thin, drawled tenor with heavy blues phrasing; the high stuff comes out in a light, airy falsetto."
  },
  {
    "slug": "mike-patton",
    "name": "Mike Patton",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
      "Alternative"
    ],
    "country": "USA",
    "activeFrom": 1989,
    "lowMidi": 27,
    "highMidi": 99,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Epic",
    "lowSource": null,
    "highSource": null,
    "blurb": "Six cited octaves of extended technique: growls, croons, falsetto squeals, throat-noise texture."
  },
  {
    "slug": "miley-cyrus",
    "name": "Miley Cyrus",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Rock",
      "Country"
    ],
    "country": "USA",
    "activeFrom": 2006,
    "lowMidi": 43,
    "highMidi": 88,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Wrecking Ball",
    "lowSource": null,
    "highSource": null,
    "blurb": "Sandpaper rasp anchored in chest voice; belts with a hard buzz and drops into a smoky low range."
  },
  {
    "slug": "milton-nascimento",
    "name": "Milton Nascimento",
    "voiceType": "Tenor",
    "genres": [
      "Jazz",
      "Folk",
      "Latin"
    ],
    "country": "Brazil",
    "activeFrom": 1967,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Travessia",
    "lowSource": null,
    "highSource": null,
    "blurb": "Full chest register under a floating falsetto he treats as a second, instrument-like voice."
  },
  {
    "slug": "minnie-riperton",
    "name": "Minnie Riperton",
    "voiceType": "Soprano",
    "genres": [
      "Soul",
      "R&B",
      "Funk"
    ],
    "country": "USA",
    "activeFrom": 1974,
    "lowMidi": 50,
    "highMidi": 102,
    "beltMidi": null,
    "whistle": true,
    "signatureSong": "Lovin' You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light, agile soprano who moves up into clean whistle tones with no audible register break."
  },
  {
    "slug": "miriam-makeba",
    "name": "Miriam Makeba",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Jazz",
      "Folk"
    ],
    "country": "South Africa",
    "activeFrom": 1954,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Pata Pata",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rich forward mezzo; crisp multilingual diction, click consonants, bell-clear controlled top."
  },
  {
    "slug": "misia",
    "name": "Misia",
    "voiceType": "Soprano",
    "genres": [
      "J-Pop",
      "R&B",
      "Soul"
    ],
    "country": "Japan",
    "activeFrom": 1998,
    "lowMidi": 53,
    "highMidi": 89,
    "beltMidi": 77,
    "whistle": true,
    "signatureSong": "Everything",
    "lowSource": null,
    "highSource": null,
    "blurb": "Full-bodied soprano who moves from breathy low verses to whistle notes held long and on pitch."
  },
  {
    "slug": "mitch-grassi",
    "name": "Mitch Grassi",
    "voiceType": "Countertenor",
    "genres": [
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2011,
    "lowMidi": 41,
    "highMidi": 96,
    "beltMidi": 72,
    "whistle": true,
    "signatureSong": "Hallelujah",
    "lowSource": null,
    "highSource": null,
    "blurb": "Countertenor who lives above the staff: light chest, agile head voice, whistle notes on top."
  },
  {
    "slug": "montserrat-caballe",
    "name": "Montserrat Caballé",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical",
      "Pop"
    ],
    "country": "Spain",
    "activeFrom": 1956,
    "lowMidi": 55,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Barcelona",
    "lowSource": null,
    "highSource": null,
    "blurb": "Known for pianissimo high notes spun on almost no air, then sudden shifts to full dramatic weight."
  },
  {
    "slug": "morten-harket",
    "name": "Morten Harket",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Synth-Pop",
      "New Wave"
    ],
    "country": "Norway",
    "activeFrom": 1985,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Take On Me",
    "lowSource": null,
    "highSource": "Take On Me",
    "blurb": "Bright tenor that climbs into a ringing head voice; clean onsets, no rasp anywhere."
  },
  {
    "slug": "nat-king-cole",
    "name": "Nat King Cole",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1939,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Unforgettable",
    "lowSource": null,
    "highSource": null,
    "blurb": "Soft-grained baritone, unusually clean diction, vibrato held back until a phrase ends."
  },
  {
    "slug": "natalia-lafourcade",
    "name": "Natalia Lafourcade",
    "voiceType": "Soprano",
    "genres": [
      "Latin",
      "Folk",
      "Singer-Songwriter"
    ],
    "country": "Mexico",
    "activeFrom": 2002,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Hasta la Raiz",
    "lowSource": null,
    "highSource": null,
    "blurb": "Small airy soprano, head-voice dominant, folk-style straight tone with gentle vibrato."
  },
  {
    "slug": "neil-young",
    "name": "Neil Young",
    "voiceType": "Tenor",
    "genres": [
      "Folk",
      "Rock",
      "Singer-Songwriter"
    ],
    "country": "Canada",
    "activeFrom": 1966,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Heart of Gold",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thin, nasal high tenor with heavy vibrato; sits near the top of his range for most of a song."
  },
  {
    "slug": "nina-simone",
    "name": "Nina Simone",
    "voiceType": "Contralto",
    "genres": [
      "Jazz",
      "Soul",
      "Blues"
    ],
    "country": "USA",
    "activeFrom": 1958,
    "lowMidi": 43,
    "highMidi": 77,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Feeling Good",
    "lowSource": null,
    "highSource": null,
    "blurb": "Contralto with an unusually deep floor; speech-into-song delivery, pianist's sense of time."
  },
  {
    "slug": "norah-jones",
    "name": "Norah Jones",
    "voiceType": "Contralto",
    "genres": [
      "Jazz",
      "Pop",
      "Singer-Songwriter"
    ],
    "country": "USA",
    "activeFrom": 2002,
    "lowMidi": 53,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Don't Know Why",
    "lowSource": null,
    "highSource": null,
    "blurb": "Breathy alto that stays mid-range: soft onsets, little vibrato, country-tinged slides."
  },
  {
    "slug": "olivia-newton-john",
    "name": "Olivia Newton-John",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Country"
    ],
    "country": "Australia",
    "activeFrom": 1971,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Hopelessly Devoted to You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Clear light tone with soft onsets and almost no rasp; relies on pitch accuracy over power."
  },
  {
    "slug": "olivia-rodrigo",
    "name": "Olivia Rodrigo",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Rock",
      "Alternative"
    ],
    "country": "USA",
    "activeFrom": 2021,
    "lowMidi": 47,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "drivers license",
    "lowSource": null,
    "highSource": null,
    "blurb": "Conversational verses that snap into a deliberately strained, edge-heavy belt on the choruses."
  },
  {
    "slug": "otis-redding",
    "name": "Otis Redding",
    "voiceType": "Baritone",
    "genres": [
      "Soul",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1962,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "(Sittin' On) The Dock of the Bay",
    "lowSource": null,
    "highSource": null,
    "blurb": "Raspy, pushed baritone that stammers and repeats phrases to build pressure."
  },
  {
    "slug": "ozzy-osbourne",
    "name": "Ozzy Osbourne",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Hard Rock"
    ],
    "country": "UK",
    "activeFrom": 1970,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Crazy Train",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thin nasal tenor with a pleading edge; narrow span, but the timbre cuts through dense guitars."
  },
  {
    "slug": "park-hyo-shin",
    "name": "Park Hyo Shin",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Musical Theatre"
    ],
    "country": "South Korea",
    "activeFrom": 1999,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Wild Flower",
    "lowSource": null,
    "highSource": null,
    "blurb": "Grainy tenor with stage-trained support; opens from near-whisper into a wide, ringing high belt."
  },
  {
    "slug": "pat-benatar",
    "name": "Pat Benatar",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Rock",
      "Hard Rock",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1979,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Love Is a Battlefield",
    "lowSource": null,
    "highSource": null,
    "blurb": "Trained placement applied to hard rock; clean cutting mid belt with a fast, narrow vibrato."
  },
  {
    "slug": "patsy-cline",
    "name": "Patsy Cline",
    "voiceType": "Contralto",
    "genres": [
      "Country",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1957,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Crazy",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm contralto with a controlled sob on held notes and heavy, deliberate slides between them."
  },
  {
    "slug": "patti-labelle",
    "name": "Patti LaBelle",
    "voiceType": "Soprano",
    "genres": [
      "Soul",
      "R&B",
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 1962,
    "lowMidi": 46,
    "highMidi": 88,
    "beltMidi": 82,
    "whistle": false,
    "signatureSong": "Lady Marmalade",
    "lowSource": null,
    "highSource": null,
    "blurb": "Church-powered soprano with a piercing belt, abrupt octave leaps, and long sustained upper notes."
  },
  {
    "slug": "patti-lupone",
    "name": "Patti LuPone",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre"
    ],
    "country": "USA",
    "activeFrom": 1979,
    "lowMidi": 52,
    "highMidi": 79,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Don't Cry for Me Argentina",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark chest-dominant belt, wide vibrato, and a consonant-heavy attack that lands every syllable."
  },
  {
    "slug": "paul-mccartney",
    "name": "Paul McCartney",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "country": "UK",
    "activeFrom": 1963,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Hey Jude",
    "lowSource": null,
    "highSource": "Long Tall Sally",
    "blurb": "Flexible tenor that shifts from soft crooning to a hoarse rock shout inside the same song."
  },
  {
    "slug": "paul-simon",
    "name": "Paul Simon",
    "voiceType": "Tenor",
    "genres": [
      "Folk",
      "Singer-Songwriter",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1964,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "The Sound of Silence",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light, even tenor that stays conversational and slips into thin falsetto rather than pushing chest."
  },
  {
    "slug": "peter-tosh",
    "name": "Peter Tosh",
    "voiceType": "Baritone",
    "genres": [
      "Reggae"
    ],
    "country": "Jamaica",
    "activeFrom": 1963,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Legalize It",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark chesty baritone, flat and declamatory; sits near speech pitch with almost no vibrato."
  },
  {
    "slug": "phil-collins",
    "name": "Phil Collins",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "country": "UK",
    "activeFrom": 1976,
    "lowMidi": 41,
    "highMidi": 73,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "In the Air Tonight",
    "lowSource": null,
    "highSource": "Against All Odds",
    "blurb": "Grainy tenor that stays conversational down low, then shoves into a shouted chest top."
  },
  {
    "slug": "philip-bailey",
    "name": "Philip Bailey",
    "voiceType": "Countertenor",
    "genres": [
      "Funk",
      "Soul",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1972,
    "lowMidi": 43,
    "highMidi": 86,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Easy Lover",
    "lowSource": null,
    "highSource": "Reasons",
    "blurb": "Baritone speaking range under a penetrating falsetto that carries entire lead vocals."
  },
  {
    "slug": "pink",
    "name": "Pink",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 2000,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "So What",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gritty mezzo with rock distortion; belts from a low placement instead of lifting into a lighter mix."
  },
  {
    "slug": "placido-domingo",
    "name": "Plácido Domingo",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "country": "Spain",
    "activeFrom": 1961,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Granada",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm spinto weight and long phrases; later took baritone roles, extending his usable low register."
  },
  {
    "slug": "prince",
    "name": "Prince",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Funk",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1978,
    "lowMidi": 40,
    "highMidi": 84,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Purple Rain",
    "lowSource": null,
    "highSource": null,
    "blurb": "Moves between gritty chest shouts and a piercing falsetto, often inside a single phrase."
  },
  {
    "slug": "ramin-karimloo",
    "name": "Ramin Karimloo",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre",
      "Rock"
    ],
    "country": "Canada",
    "activeFrom": 2009,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Til I Hear You Sing",
    "lowSource": null,
    "highSource": null,
    "blurb": "Baritone-weighted tenor with rock grit; carries chest colour higher than most legit theatre tenors."
  },
  {
    "slug": "randy-travis",
    "name": "Randy Travis",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "country": "USA",
    "activeFrom": 1986,
    "lowMidi": 41,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Forever and Ever, Amen",
    "lowSource": null,
    "highSource": null,
    "blurb": "Round, resonant baritone with long downward slides and a heavy drawl on line endings."
  },
  {
    "slug": "ray-charles",
    "name": "Ray Charles",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B",
      "Blues"
    ],
    "country": "USA",
    "activeFrom": 1954,
    "lowMidi": 36,
    "highMidi": 82,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Georgia on My Mind",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gospel-schooled tenor with a rough edge, bending pitch and dragging behind the beat on purpose."
  },
  {
    "slug": "reba-mcentire",
    "name": "Reba McEntire",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country"
    ],
    "country": "USA",
    "activeFrom": 1977,
    "lowMidi": 52,
    "highMidi": 77,
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Fancy",
    "lowSource": null,
    "highSource": null,
    "blurb": "Oklahoma twang over a strong chest belt; breaks into a deliberate cry at the top of phrases."
  },
  {
    "slug": "regina-spektor",
    "name": "Regina Spektor",
    "voiceType": "Soprano",
    "genres": [
      "Indie",
      "Pop",
      "Singer-Songwriter"
    ],
    "country": "USA",
    "activeFrom": 2004,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Fidelity",
    "lowSource": null,
    "highSource": null,
    "blurb": "Elastic delivery that switches between clipped staccato, trills, and thin squeaks at the very top."
  },
  {
    "slug": "renee-fleming",
    "name": "Renée Fleming",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical",
      "Jazz"
    ],
    "country": "USA",
    "activeFrom": 1991,
    "lowMidi": 55,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Song to the Moon",
    "lowSource": null,
    "highSource": null,
    "blurb": "Silvery lyric soprano with a soft-edged onset and heavy use of floated, breath-mixed high notes."
  },
  {
    "slug": "rick-astley",
    "name": "Rick Astley",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Synth-Pop"
    ],
    "country": "UK",
    "activeFrom": 1987,
    "lowMidi": 41,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Never Gonna Give You Up",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark, resonant baritone with steady vibrato; the tone reads far older than the records."
  },
  {
    "slug": "ricky-martin",
    "name": "Ricky Martin",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "country": "Puerto Rico",
    "activeFrom": 1991,
    "lowMidi": 47,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Livin' la Vida Loca",
    "lowSource": null,
    "highSource": null,
    "blurb": "Grainy pop tenor with a short usable top; leans on rhythm, shouts and falsetto flips."
  },
  {
    "slug": "rihanna",
    "name": "Rihanna",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "country": "Barbados",
    "activeFrom": 2005,
    "lowMidi": 47,
    "highMidi": 83,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Umbrella",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal-forward mezzo with clipped consonants; strongest in a smoky lower-mid rather than up high."
  },
  {
    "slug": "rob-halford",
    "name": "Rob Halford",
    "voiceType": "Tenor",
    "genres": [
      "Metal"
    ],
    "country": "UK",
    "activeFrom": 1974,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "Breaking the Law",
    "lowSource": null,
    "highSource": "Painkiller",
    "blurb": "Moves from gritted chest snarl into piercing falsetto shrieks with almost no audible seam."
  },
  {
    "slug": "robert-plant",
    "name": "Robert Plant",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock",
      "Blues"
    ],
    "country": "UK",
    "activeFrom": 1968,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Whole Lotta Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bluesy tenor with a bright, nasal-forward top and heavy vibrato; leans on falsetto wails above the belt."
  },
  {
    "slug": "rod-stewart",
    "name": "Rod Stewart",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop",
      "Blues"
    ],
    "country": "UK",
    "activeFrom": 1969,
    "lowMidi": 40,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Maggie May",
    "lowSource": null,
    "highSource": null,
    "blurb": "Sandpaper rasp from a breathy onset; sits mid-range and pushes volume rather than height."
  },
  {
    "slug": "roger-daltrey",
    "name": "Roger Daltrey",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "country": "UK",
    "activeFrom": 1965,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Won't Get Fooled Again",
    "lowSource": null,
    "highSource": "Love, Reign o'er Me",
    "blurb": "Chest-dominant tenor: thick midrange, gravel on the push, screams sung on the belt rather than falsetto."
  },
  {
    "slug": "ronnie-james-dio",
    "name": "Ronnie James Dio",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Hard Rock"
    ],
    "country": "USA",
    "activeFrom": 1975,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Holy Diver",
    "lowSource": null,
    "highSource": null,
    "blurb": "Chest-dominant power, fast narrow vibrato, vowels stay focused even at full volume."
  },
  {
    "slug": "rosalia",
    "name": "Rosalia",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Latin",
      "Pop",
      "Electronic"
    ],
    "country": "Spain",
    "activeFrom": 2017,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 78,
    "whistle": false,
    "signatureSong": "Malamente",
    "lowSource": null,
    "highSource": null,
    "blurb": "Flamenco-trained melisma: glottal attacks, microtonal bends, light and agile up top."
  },
  {
    "slug": "rose",
    "name": "Rosé",
    "voiceType": "Soprano",
    "genres": [
      "K-Pop",
      "Pop"
    ],
    "country": "New Zealand",
    "activeFrom": 2016,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "On the Ground",
    "lowSource": null,
    "highSource": null,
    "blurb": "Reedy, slightly nasal soprano with wavering vibrato; prefers an airy top to full-chest volume."
  },
  {
    "slug": "roy-orbison",
    "name": "Roy Orbison",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop",
      "Country"
    ],
    "country": "USA",
    "activeFrom": 1956,
    "lowMidi": 40,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Oh, Pretty Woman",
    "lowSource": null,
    "highSource": "Running Scared",
    "blurb": "Operatic tenor that swells from a soft low murmur to full-voice high notes with no audible break."
  },
  {
    "slug": "rufus-wainwright",
    "name": "Rufus Wainwright",
    "voiceType": "Tenor",
    "genres": [
      "Singer-Songwriter",
      "Pop",
      "Opera"
    ],
    "country": "Canada",
    "activeFrom": 1998,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Cigarettes and Chocolate Milk",
    "lowSource": null,
    "highSource": null,
    "blurb": "Operatic-leaning tenor with wide vibrato and long legato lines; a nasal ring through the upper mix."
  },
  {
    "slug": "sabrina-carpenter",
    "name": "Sabrina Carpenter",
    "voiceType": "Soprano",
    "genres": [
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2015,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Espresso",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright, compact soprano with breathy onsets and a light belt she rarely pushes to full volume."
  },
  {
    "slug": "sade-adu",
    "name": "Sade Adu",
    "voiceType": "Contralto",
    "genres": [
      "Soul",
      "Jazz"
    ],
    "country": "UK",
    "activeFrom": 1984,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Smooth Operator",
    "lowSource": null,
    "highSource": null,
    "blurb": "Restrained contralto: narrow range, level dynamics, straight tone with vibrato barely used."
  },
  {
    "slug": "salif-keita",
    "name": "Salif Keita",
    "voiceType": "Tenor",
    "genres": [
      "Folk",
      "Afrobeats"
    ],
    "country": "Mali",
    "activeFrom": 1970,
    "lowMidi": 47,
    "highMidi": 74,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Madan",
    "lowSource": null,
    "highSource": null,
    "blurb": "Reedy high tenor with a nasal cutting edge; melismatic lines and sustained calls near the top."
  },
  {
    "slug": "sam-cooke",
    "name": "Sam Cooke",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "Gospel",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1957,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "A Change Is Gonna Come",
    "lowSource": null,
    "highSource": null,
    "blurb": "Clean gospel-trained tenor; yodel-like turns and easy legato instead of grit."
  },
  {
    "slug": "sam-smith",
    "name": "Sam Smith",
    "voiceType": "Countertenor",
    "genres": [
      "Pop",
      "Soul",
      "R&B"
    ],
    "country": "UK",
    "activeFrom": 2012,
    "lowMidi": 43,
    "highMidi": 84,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Stay with Me",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light, vibrato-rich voice that lives in a high tenor mix and floats up in pure falsetto."
  },
  {
    "slug": "sandi-patty",
    "name": "Sandi Patty",
    "voiceType": "Soprano",
    "genres": [
      "Gospel",
      "Classical"
    ],
    "country": "USA",
    "activeFrom": 1982,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "We Shall Behold Him",
    "lowSource": null,
    "highSource": null,
    "blurb": "Classically schooled soprano with a bright forward top and clean sustained highs at full volume."
  },
  {
    "slug": "sarah-brightman",
    "name": "Sarah Brightman",
    "voiceType": "Soprano",
    "genres": [
      "Classical",
      "Pop",
      "Musical Theatre"
    ],
    "country": "UK",
    "activeFrom": 1981,
    "lowMidi": 55,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Time to Say Goodbye",
    "lowSource": null,
    "highSource": "The Phantom of the Opera",
    "blurb": "Thin, breathy classical-pop tone; stays in head voice up top rather than carrying chest weight."
  },
  {
    "slug": "sarah-mclachlan",
    "name": "Sarah McLachlan",
    "voiceType": "Soprano",
    "genres": [
      "Folk",
      "Pop",
      "Singer-Songwriter"
    ],
    "country": "Canada",
    "activeFrom": 1993,
    "lowMidi": 53,
    "highMidi": 83,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Angel",
    "lowSource": null,
    "highSource": null,
    "blurb": "Clear soprano with an airy top and long, steady sustains; shapes lines rather than adding runs."
  },
  {
    "slug": "sarah-vaughan",
    "name": "Sarah Vaughan",
    "voiceType": "Contralto",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1943,
    "lowMidi": 51,
    "highMidi": 84,
    "beltMidi": 75,
    "whistle": false,
    "signatureSong": "Misty",
    "lowSource": null,
    "highSource": null,
    "blurb": "Operatic weight low down, controlled vibrato, a top she floats onto instead of pushing."
  },
  {
    "slug": "scott-hoying",
    "name": "Scott Hoying",
    "voiceType": "Baritone",
    "genres": [
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2011,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Sing",
    "lowSource": null,
    "highSource": null,
    "blurb": "Baritone bottom with a bright high mix; percussive consonants anchor a cappella arrangements."
  },
  {
    "slug": "scott-weiland",
    "name": "Scott Weiland",
    "voiceType": "Baritone",
    "genres": [
      "Grunge",
      "Alternative",
      "Hard Rock"
    ],
    "country": "USA",
    "activeFrom": 1992,
    "lowMidi": 40,
    "highMidi": 73,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Interstate Love Song",
    "lowSource": null,
    "highSource": null,
    "blurb": "Croon-to-snarl baritone, often filtered through a megaphone; leans on slides into the note."
  },
  {
    "slug": "sebastian-bach",
    "name": "Sebastian Bach",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Metal"
    ],
    "country": "Canada",
    "activeFrom": 1989,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "18 and Life",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rasp-heavy high tenor that sustains fifth-octave belts, then slips up into scream falsetto."
  },
  {
    "slug": "selena",
    "name": "Selena",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Latin",
      "Pop",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1989,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Como La Flor",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright mezzo with a thick lower-middle and plain, unornamented cumbia phrasing."
  },
  {
    "slug": "serj-tankian",
    "name": "Serj Tankian",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
      "Alternative",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1998,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Chop Suey!",
    "lowSource": null,
    "highSource": null,
    "blurb": "Operatic-leaning baritone with fast register jumps, trills, and pinched nasal placement."
  },
  {
    "slug": "shaggy",
    "name": "Shaggy",
    "voiceType": "Bass-baritone",
    "genres": [
      "Reggae",
      "Pop"
    ],
    "country": "Jamaica",
    "activeFrom": 1993,
    "lowMidi": 40,
    "highMidi": 65,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "It Wasn't Me",
    "lowSource": null,
    "highSource": null,
    "blurb": "Very deep gravel bass-baritone used percussively; half-spoken toasting, few sustained pitches."
  },
  {
    "slug": "shakira",
    "name": "Shakira",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Latin",
      "Pop",
      "Rock"
    ],
    "country": "Colombia",
    "activeFrom": 1995,
    "lowMidi": 52,
    "highMidi": 86,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Hips Don't Lie",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal-edged chest voice with a fast natural vibrato and Arabic-inflected melisma."
  },
  {
    "slug": "shania-twain",
    "name": "Shania Twain",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "country": "Canada",
    "activeFrom": 1995,
    "lowMidi": 52,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "You're Still the One",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright mezzo with a clipped percussive attack, slipping into a thin upper register on hooks."
  },
  {
    "slug": "sharon-den-adel",
    "name": "Sharon den Adel",
    "voiceType": "Soprano",
    "genres": [
      "Metal",
      "Rock"
    ],
    "country": "Netherlands",
    "activeFrom": 1997,
    "lowMidi": 55,
    "highMidi": 86,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Ice Queen",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light airy soprano with straight-toned sustains; keeps weight out of the upper register."
  },
  {
    "slug": "shawn-mendes",
    "name": "Shawn Mendes",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Singer-Songwriter"
    ],
    "country": "Canada",
    "activeFrom": 2014,
    "lowMidi": 43,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Stitches",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal tenor with a tight, compressed mix; rasp creeps in on sustained upper notes."
  },
  {
    "slug": "shirley-manson",
    "name": "Shirley Manson",
    "voiceType": "Contralto",
    "genres": [
      "Alternative",
      "Rock",
      "Electronic"
    ],
    "country": "UK",
    "activeFrom": 1995,
    "lowMidi": 53,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Only Happy When It Rains",
    "lowSource": null,
    "highSource": null,
    "blurb": "Smoky low contralto, half-spoken in the verses, opening into a flat, cool-toned belt."
  },
  {
    "slug": "sia",
    "name": "Sia",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Electronic"
    ],
    "country": "Australia",
    "activeFrom": 2011,
    "lowMidi": 48,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Chandelier",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rasp-heavy belt that frays by design; wide vowels and long notes held high in full voice."
  },
  {
    "slug": "sierra-boggess",
    "name": "Sierra Boggess",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre",
      "Classical"
    ],
    "country": "USA",
    "activeFrom": 2008,
    "lowMidi": 55,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "The Phantom of the Opera",
    "lowSource": null,
    "highSource": "The Phantom of the Opera",
    "blurb": "Lyric soprano with a floated top and easy pianissimo; even vibrato through the passage."
  },
  {
    "slug": "sinead-oconnor",
    "name": "Sinéad O'Connor",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Alternative",
      "Pop",
      "Folk"
    ],
    "country": "Ireland",
    "activeFrom": 1987,
    "lowMidi": 53,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Nothing Compares 2 U",
    "lowSource": null,
    "highSource": null,
    "blurb": "Whisper-to-cry dynamics inside a few bars; a clear tone that breaks into hard rasp at full volume."
  },
  {
    "slug": "smokey-robinson",
    "name": "Smokey Robinson",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1960,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "The Tracks of My Tears",
    "lowSource": null,
    "highSource": null,
    "blurb": "Feathery high tenor; falsetto entries so smooth the register change is hard to hear."
  },
  {
    "slug": "sohyang",
    "name": "Sohyang",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Gospel"
    ],
    "country": "South Korea",
    "activeFrom": 2011,
    "lowMidi": 52,
    "highMidi": 96,
    "beltMidi": 84,
    "whistle": true,
    "signatureSong": "Arirang Alone",
    "lowSource": null,
    "highSource": null,
    "blurb": "Trained soprano who stacks a supported high belt under a whistle register used as melody, not effect."
  },
  {
    "slug": "steve-perry",
    "name": "Steve Perry",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1977,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Don't Stop Believin'",
    "lowSource": null,
    "highSource": null,
    "blurb": "Smooth tenor with an R&B bend to the phrasing; the mix stays connected right through the top of the belt."
  },
  {
    "slug": "steven-tyler",
    "name": "Steven Tyler",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Rock",
      "Blues"
    ],
    "country": "USA",
    "activeFrom": 1973,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Dream On",
    "lowSource": null,
    "highSource": null,
    "blurb": "Raspy high tenor built on screams and blues bends; top notes arrive as distorted cries, not clean tone."
  },
  {
    "slug": "stevie-nicks",
    "name": "Stevie Nicks",
    "voiceType": "Contralto",
    "genres": [
      "Rock",
      "Folk",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1975,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Dreams",
    "lowSource": null,
    "highSource": null,
    "blurb": "Husky breath-driven alto in a narrow working band; wide vibrato, almost entirely chest voice."
  },
  {
    "slug": "stevie-wonder",
    "name": "Stevie Wonder",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B",
      "Funk"
    ],
    "country": "USA",
    "activeFrom": 1963,
    "lowMidi": 36,
    "highMidi": 88,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Superstition",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal-forward tenor with gospel melisma; slides from chest into a bright, controlled falsetto."
  },
  {
    "slug": "sting",
    "name": "Sting",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "New Wave",
      "Pop"
    ],
    "country": "UK",
    "activeFrom": 1978,
    "lowMidi": 39,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Every Breath You Take",
    "lowSource": null,
    "highSource": "Roxanne",
    "blurb": "Reedy, narrow tenor with clipped phrasing; takes upper notes in a strained mix, not a full belt."
  },
  {
    "slug": "sutton-foster",
    "name": "Sutton Foster",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre"
    ],
    "country": "USA",
    "activeFrom": 2002,
    "lowMidi": 53,
    "highMidi": 81,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Gimme Gimme",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright mixed belt with comic timing built into the phrasing; sustains high notes without hardening."
  },
  {
    "slug": "sza",
    "name": "SZA",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Alternative",
      "Soul"
    ],
    "country": "USA",
    "activeFrom": 2017,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Kill Bill",
    "lowSource": null,
    "highSource": null,
    "blurb": "Breathy, conversational tone that slips between speech, soft belt, and thin airy top notes."
  },
  {
    "slug": "taeyang",
    "name": "Taeyang",
    "voiceType": "Tenor",
    "genres": [
      "K-Pop",
      "R&B"
    ],
    "country": "South Korea",
    "activeFrom": 2006,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Eyes, Nose, Lips",
    "lowSource": null,
    "highSource": null,
    "blurb": "Raspy R&B tenor built on melisma, tight vibrato and a falsetto he flips into mid-phrase."
  },
  {
    "slug": "taeyeon",
    "name": "Taeyeon",
    "voiceType": "Soprano",
    "genres": [
      "K-Pop",
      "Pop"
    ],
    "country": "South Korea",
    "activeFrom": 2007,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "I",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal-bright soprano with compact vibrato; her belt stays thin yet cuts through dense mixes."
  },
  {
    "slug": "tammy-wynette",
    "name": "Tammy Wynette",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country"
    ],
    "country": "USA",
    "activeFrom": 1966,
    "lowMidi": 55,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Stand by Your Man",
    "lowSource": null,
    "highSource": "Stand by Your Man",
    "blurb": "Mezzo who uses her own register break as a teardrop catch at the ends of lines."
  },
  {
    "slug": "tarja-turunen",
    "name": "Tarja Turunen",
    "voiceType": "Soprano",
    "genres": [
      "Metal",
      "Opera"
    ],
    "country": "Finland",
    "activeFrom": 1996,
    "lowMidi": 53,
    "highMidi": 88,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "Nemo",
    "lowSource": null,
    "highSource": null,
    "blurb": "Classically placed soprano over distorted guitar: covered vowels, vibrato-rich head voice."
  },
  {
    "slug": "tasha-cobbs-leonard",
    "name": "Tasha Cobbs Leonard",
    "voiceType": "Contralto",
    "genres": [
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 2013,
    "lowMidi": 50,
    "highMidi": 81,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Break Every Chain",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark, thick contralto that stays in chest; builds by adding weight rather than climbing higher."
  },
  {
    "slug": "taylor-swift",
    "name": "Taylor Swift",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Country",
      "Singer-Songwriter"
    ],
    "country": "USA",
    "activeFrom": 2006,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Love Story",
    "lowSource": null,
    "highSource": null,
    "blurb": "Speech-level mezzo with light breath onsets; later albums lean on a firmer, better supported mix."
  },
  {
    "slug": "teddy-pendergrass",
    "name": "Teddy Pendergrass",
    "voiceType": "Baritone",
    "genres": [
      "Soul",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1972,
    "lowMidi": 40,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Close the Door",
    "lowSource": null,
    "highSource": null,
    "blurb": "Heavy baritone with a gravel edge; moves from near-whisper to full-throated shouting."
  },
  {
    "slug": "teddy-swims",
    "name": "Teddy Swims",
    "voiceType": "Baritone",
    "genres": [
      "Soul",
      "R&B",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 2020,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Lose Control",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gravel-heavy baritone that climbs into rasped high belts, with gospel runs on the way down."
  },
  {
    "slug": "tems",
    "name": "Tems",
    "voiceType": "Contralto",
    "genres": [
      "Afrobeats",
      "R&B"
    ],
    "country": "Nigeria",
    "activeFrom": 2018,
    "lowMidi": 50,
    "highMidi": 74,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Free Mind",
    "lowSource": null,
    "highSource": null,
    "blurb": "Husky contralto sitting far lower than most pop voices; hoarse-edged tone, lazy pitch slides."
  },
  {
    "slug": "thalia",
    "name": "Thalia",
    "voiceType": "Soprano",
    "genres": [
      "Latin",
      "Pop"
    ],
    "country": "Mexico",
    "activeFrom": 1990,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Amor a la Mexicana",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light bright soprano; thin low notes, girlish forward mix carrying the upper hooks."
  },
  {
    "slug": "the-weeknd",
    "name": "The Weeknd",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Pop",
      "Synth-Pop"
    ],
    "country": "Canada",
    "activeFrom": 2011,
    "lowMidi": 43,
    "highMidi": 83,
    "beltMidi": 70,
    "whistle": false,
    "signatureSong": "Blinding Lights",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light tenor with a floating falsetto and heavy melisma; keeps chest weight off the top."
  },
  {
    "slug": "thom-yorke",
    "name": "Thom Yorke",
    "voiceType": "Tenor",
    "genres": [
      "Alternative",
      "Rock",
      "Electronic"
    ],
    "country": "UK",
    "activeFrom": 1992,
    "lowMidi": 41,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Creep",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light tenor that flips early into a thin, airy falsetto; small vibrato, softened consonants."
  },
  {
    "slug": "tina-turner",
    "name": "Tina Turner",
    "voiceType": "Contralto",
    "genres": [
      "Rock",
      "Soul",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1960,
    "lowMidi": 43,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Proud Mary",
    "lowSource": null,
    "highSource": "River Deep - Mountain High",
    "blurb": "Gravel-edged contralto that stays in chest voice and gets power from a hard, forward rasp."
  },
  {
    "slug": "tom-jones",
    "name": "Tom Jones",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Soul"
    ],
    "country": "UK",
    "activeFrom": 1965,
    "lowMidi": 43,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "It's Not Unusual",
    "lowSource": null,
    "highSource": "Delilah",
    "blurb": "Grainy baritone with wide vibrato and a full-throated belt; volume rather than finesse up top."
  },
  {
    "slug": "toni-braxton",
    "name": "Toni Braxton",
    "voiceType": "Contralto",
    "genres": [
      "R&B",
      "Soul",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1992,
    "lowMidi": 46,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Un-Break My Heart",
    "lowSource": null,
    "highSource": null,
    "blurb": "Unusually low contralto; dark, breathy bottom end and tight vibrato even when pushing."
  },
  {
    "slug": "tony-bennett",
    "name": "Tony Bennett",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1951,
    "lowMidi": 45,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "I Left My Heart in San Francisco",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright forward baritone that widens as it gets louder rather than thinning at the top."
  },
  {
    "slug": "toots-hibbert",
    "name": "Toots Hibbert",
    "voiceType": "Tenor",
    "genres": [
      "Reggae",
      "Soul"
    ],
    "country": "Jamaica",
    "activeFrom": 1962,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Pressure Drop",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rasping soul-shouter tenor; grit on every held note, pushes chest voice up until it frays."
  },
  {
    "slug": "tori-amos",
    "name": "Tori Amos",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Singer-Songwriter",
      "Alternative",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1992,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Cornflake Girl",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright mezzo that scoops into notes and flips to airy head voice, with frequent glottal breaks."
  },
  {
    "slug": "tracy-chapman",
    "name": "Tracy Chapman",
    "voiceType": "Contralto",
    "genres": [
      "Folk",
      "Singer-Songwriter",
      "Blues"
    ],
    "country": "USA",
    "activeFrom": 1988,
    "lowMidi": 50,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Fast Car",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark contralto with a tight, buzzy edge; pushes intensity through consonants instead of vibrato."
  },
  {
    "slug": "usher",
    "name": "Usher",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Pop"
    ],
    "country": "USA",
    "activeFrom": 1994,
    "lowMidi": 46,
    "highMidi": 81,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Yeah!",
    "lowSource": null,
    "highSource": null,
    "blurb": "Agile pop-R&B tenor; clipped rhythmic phrasing and a light, breathy upper register."
  },
  {
    "slug": "v",
    "name": "V",
    "voiceType": "Baritone",
    "genres": [
      "K-Pop",
      "Pop",
      "R&B"
    ],
    "country": "South Korea",
    "activeFrom": 2013,
    "lowMidi": 38,
    "highMidi": 74,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Singularity",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark, husky baritone that sits speech-close and thins to airy falsetto instead of pushing chest."
  },
  {
    "slug": "van-morrison",
    "name": "Van Morrison",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "Blues",
      "Folk"
    ],
    "country": "Northern Ireland",
    "activeFrom": 1967,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Brown Eyed Girl",
    "lowSource": null,
    "highSource": null,
    "blurb": "Raspy tenor that repeats and stretches syllables, sliding between blues shouts and scat phrasing."
  },
  {
    "slug": "vicente-fernandez",
    "name": "Vicente Fernandez",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Folk"
    ],
    "country": "Mexico",
    "activeFrom": 1966,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "El Rey",
    "lowSource": null,
    "highSource": "El Rey",
    "blurb": "Open-throated ranchera tenor; full-voice top notes held long past the band."
  },
  {
    "slug": "vince-gill",
    "name": "Vince Gill",
    "voiceType": "Tenor",
    "genres": [
      "Country"
    ],
    "country": "USA",
    "activeFrom": 1984,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false,
    "signatureSong": "Go Rest High on That Mountain",
    "lowSource": null,
    "highSource": null,
    "blurb": "High sweet tenor thinning into clean falsetto; harmony-trained blend, steady even vibrato."
  },
  {
    "slug": "waylon-jennings",
    "name": "Waylon Jennings",
    "voiceType": "Bass-baritone",
    "genres": [
      "Country",
      "Rock"
    ],
    "country": "USA",
    "activeFrom": 1965,
    "lowMidi": 40,
    "highMidi": 62,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Good Hearted Woman",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark chesty bass-baritone pushed against a hard backbeat; almost no head-voice extension."
  },
  {
    "slug": "whitney-houston",
    "name": "Whitney Houston",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B",
      "Gospel"
    ],
    "country": "USA",
    "activeFrom": 1985,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "I Will Always Love You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gospel-trained mix with a bright forward tone; runs stay in chest weight instead of thinning out."
  },
  {
    "slug": "willie-nelson",
    "name": "Willie Nelson",
    "voiceType": "Tenor",
    "genres": [
      "Country",
      "Folk"
    ],
    "country": "USA",
    "activeFrom": 1962,
    "lowMidi": 43,
    "highMidi": 65,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "On the Road Again",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light nasal tenor that lags behind the beat and slides into notes instead of landing on them."
  },
  {
    "slug": "wizkid",
    "name": "Wizkid",
    "voiceType": "Tenor",
    "genres": [
      "Afrobeats",
      "R&B"
    ],
    "country": "Nigeria",
    "activeFrom": 2010,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": 67,
    "whistle": false,
    "signatureSong": "Essence",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light breathy tenor kept in a narrow band; low projection, sighing falsetto tails on line ends."
  },
  {
    "slug": "yma-sumac",
    "name": "Yma Sumac",
    "voiceType": "Soprano",
    "genres": [
      "Latin",
      "Folk",
      "Classical"
    ],
    "country": "Peru",
    "activeFrom": 1950,
    "lowMidi": 47,
    "highMidi": 97,
    "beltMidi": null,
    "whistle": true,
    "signatureSong": "Gopher Mambo",
    "lowSource": null,
    "highSource": "Chuncho (The Forest Creatures)",
    "blurb": "Switched between growled low chest and piercing whistle-register tones inside single phrases."
  },
  {
    "slug": "yolanda-adams",
    "name": "Yolanda Adams",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Gospel",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1987,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Open My Heart",
    "lowSource": null,
    "highSource": null,
    "blurb": "Smoky bottom under a bright top; breathy onsets and clipped, jazz-leaning phrase endings."
  },
  {
    "slug": "youssou-ndour",
    "name": "Youssou N'Dour",
    "voiceType": "Tenor",
    "genres": [
      "Afrobeats",
      "Folk"
    ],
    "country": "Senegal",
    "activeFrom": 1979,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "7 Seconds",
    "lowSource": null,
    "highSource": null,
    "blurb": "High keening tenor shaped by chant ornament; rapid microtonal turns and a piercing bright top."
  }
];
