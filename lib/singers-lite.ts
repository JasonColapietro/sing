/**
 * GENERATED FILE — edit scripts/compile-singers.mjs + its source batches, not
 * this file directly.
 *
 * Prose-free projection of SINGERS for client components. Import this (plus
 * helpers from lib/singers-core) in "use client" files; importing from
 * lib/singers there ships every blurb and technique paragraph to the browser.
 */

import type { VoiceKind } from "@/lib/singers-data";

export interface SingerLite {
  slug: string;
  name: string;
  voiceType: VoiceKind;
  genres: string[];
  /** Year they became prominent. */
  activeFrom: number;
  lowMidi: number;
  highMidi: number;
  /** Highest full/belted note when meaningfully below highMidi. */
  beltMidi: number | null;
  whistle: boolean;
}

export const SINGERS_LITE: SingerLite[] = [
  {
    "slug": "aaliyah",
    "name": "Aaliyah",
    "voiceType": "Soprano",
    "genres": [
      "R&B",
      "Pop"
    ],
    "activeFrom": 1994,
    "lowMidi": 49,
    "highMidi": 81,
    "beltMidi": 80,
    "whistle": false
  },
  {
    "slug": "aaron-neville",
    "name": "Aaron Neville",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B"
    ],
    "activeFrom": 1966,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "aaron-tveit",
    "name": "Aaron Tveit",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre",
      "Rock"
    ],
    "activeFrom": 2008,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "adam-lambert",
    "name": "Adam Lambert",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "activeFrom": 2009,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "adam-levine",
    "name": "Adam Levine",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock"
    ],
    "activeFrom": 2002,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "adele",
    "name": "Adele",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Soul"
    ],
    "activeFrom": 2008,
    "lowMidi": 48,
    "highMidi": 82,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 2020,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false
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
    "activeFrom": 2012,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "akon",
    "name": "Akon",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Hip-Hop",
      "Pop"
    ],
    "activeFrom": 2004,
    "lowMidi": 48,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1967,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1975,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "alan-jackson",
    "name": "Alan Jackson",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 1990,
    "lowMidi": 40,
    "highMidi": 71,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1995,
    "lowMidi": 47,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "alejandro-fernandez",
    "name": "Alejandro Fernández",
    "voiceType": "Baritone",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1992,
    "lowMidi": 42,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "alex-turner",
    "name": "Alex Turner",
    "voiceType": "Tenor",
    "genres": [
      "Indie",
      "Rock"
    ],
    "activeFrom": 2006,
    "lowMidi": 40,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "alex-warren",
    "name": "Alex Warren",
    "voiceType": "Baritone",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2024,
    "lowMidi": 45,
    "highMidi": 66,
    "beltMidi": 64,
    "whistle": false
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
    "activeFrom": 2001,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": 75,
    "whistle": false
  },
  {
    "slug": "alison-krauss",
    "name": "Alison Krauss",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Folk"
    ],
    "activeFrom": 1987,
    "lowMidi": 55,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "amy-grant",
    "name": "Amy Grant",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Gospel",
      "Pop"
    ],
    "activeFrom": 1982,
    "lowMidi": 53,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "amy-lee",
    "name": "Amy Lee",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Rock",
      "Metal",
      "Alternative"
    ],
    "activeFrom": 2003,
    "lowMidi": 52,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2003,
    "lowMidi": 48,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "anderson-paak",
    "name": "Anderson .Paak",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Funk",
      "Hip-Hop"
    ],
    "activeFrom": 2016,
    "lowMidi": 48,
    "highMidi": 77,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "andra-day",
    "name": "Andra Day",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Soul",
      "R&B",
      "Jazz"
    ],
    "activeFrom": 2015,
    "lowMidi": 52,
    "highMidi": 78,
    "beltMidi": 73,
    "whistle": false
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
    "activeFrom": 1994,
    "lowMidi": 48,
    "highMidi": 71,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "andy-biersack",
    "name": "Andy Biersack",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Metal"
    ],
    "activeFrom": 2010,
    "lowMidi": 38,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "angela-aguilar",
    "name": "Ángela Aguilar",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Latin"
    ],
    "activeFrom": 2018,
    "lowMidi": 51,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "angelique-kidjo",
    "name": "Angélique Kidjo",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Afrobeats",
      "Funk"
    ],
    "activeFrom": 1981,
    "lowMidi": 52,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false
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
    "activeFrom": 1983,
    "lowMidi": 49,
    "highMidi": 85,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ann-wilson",
    "name": "Ann Wilson",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "activeFrom": 1975,
    "lowMidi": 43,
    "highMidi": 88,
    "beltMidi": 81,
    "whistle": false
  },
  {
    "slug": "anna-netrebko",
    "name": "Anna Netrebko",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1994,
    "lowMidi": 55,
    "highMidi": 86,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1983,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 75,
    "whistle": false
  },
  {
    "slug": "anohni",
    "name": "ANOHNI",
    "voiceType": "Contralto",
    "genres": [
      "Alternative",
      "Electronic",
      "Singer-Songwriter"
    ],
    "activeFrom": 2000,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1984,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 69,
    "whistle": false
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
    "activeFrom": 1961,
    "lowMidi": 43,
    "highMidi": 88,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "ari-lennox",
    "name": "Ari Lennox",
    "voiceType": "Soprano",
    "genres": [
      "R&B",
      "Soul"
    ],
    "activeFrom": 2019,
    "lowMidi": 46,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ariana-grande",
    "name": "Ariana Grande",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2013,
    "lowMidi": 50,
    "highMidi": 100,
    "beltMidi": 76,
    "whistle": true
  },
  {
    "slug": "arijit-singh",
    "name": "Arijit Singh",
    "voiceType": "Tenor",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2013,
    "lowMidi": 48,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "ashanti",
    "name": "Ashanti",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Hip-Hop",
      "Pop"
    ],
    "activeFrom": 2002,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1994,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "aulii-cravalho",
    "name": "Auli'i Cravalho",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "activeFrom": 2016,
    "lowMidi": 53,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "aurora",
    "name": "Aurora",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Electronic",
      "Folk"
    ],
    "activeFrom": 2015,
    "lowMidi": 51,
    "highMidi": 88,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "ava-max",
    "name": "Ava Max",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Synth-Pop"
    ],
    "activeFrom": 2018,
    "lowMidi": 52,
    "highMidi": 85,
    "beltMidi": 78,
    "whistle": false
  },
  {
    "slug": "avi-kaplan",
    "name": "Avi Kaplan",
    "voiceType": "Bass",
    "genres": [
      "Pop",
      "Folk"
    ],
    "activeFrom": 2011,
    "lowMidi": 27,
    "highMidi": 73,
    "beltMidi": 64,
    "whistle": false
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
    "activeFrom": 2002,
    "lowMidi": 53,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "axl-rose",
    "name": "Axl Rose",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Rock"
    ],
    "activeFrom": 1987,
    "lowMidi": 29,
    "highMidi": 94,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "ayra-starr",
    "name": "Ayra Starr",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Afrobeats",
      "R&B"
    ],
    "activeFrom": 2021,
    "lowMidi": 52,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "ayumi-hamasaki",
    "name": "Ayumi Hamasaki",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "J-Pop",
      "Pop"
    ],
    "activeFrom": 1998,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 74,
    "whistle": false
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
    "activeFrom": 2017,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": 64,
    "whistle": false
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
    "activeFrom": 2012,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "barbra-streisand",
    "name": "Barbra Streisand",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Musical Theatre"
    ],
    "activeFrom": 1963,
    "lowMidi": 46,
    "highMidi": 84,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "barry-gibb",
    "name": "Barry Gibb",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Disco"
    ],
    "activeFrom": 1967,
    "lowMidi": 41,
    "highMidi": 86,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "barry-manilow",
    "name": "Barry Manilow",
    "voiceType": "Tenor",
    "genres": [
      "Pop"
    ],
    "activeFrom": 1974,
    "lowMidi": 38,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1973,
    "lowMidi": 38,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "bebe-rexha",
    "name": "Bebe Rexha",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Electronic"
    ],
    "activeFrom": 2015,
    "lowMidi": 50,
    "highMidi": 83,
    "beltMidi": 78,
    "whistle": false
  },
  {
    "slug": "bebe-winans",
    "name": "BeBe Winans",
    "voiceType": "Tenor",
    "genres": [
      "Gospel",
      "R&B"
    ],
    "activeFrom": 1987,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "ben-platt",
    "name": "Ben Platt",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "activeFrom": 2015,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": 74,
    "whistle": false
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
    "activeFrom": 2021,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "bernadette-peters",
    "name": "Bernadette Peters",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre"
    ],
    "activeFrom": 1968,
    "lowMidi": 55,
    "highMidi": 81,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "beyonce",
    "name": "Beyoncé",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 1997,
    "lowMidi": 47,
    "highMidi": 87,
    "beltMidi": 79,
    "whistle": false
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
    "activeFrom": 1971,
    "lowMidi": 41,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2016,
    "lowMidi": 45,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "billie-holiday",
    "name": "Billie Holiday",
    "voiceType": "Contralto",
    "genres": [
      "Jazz",
      "Blues"
    ],
    "activeFrom": 1933,
    "lowMidi": 53,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1994,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1991,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false
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
    "activeFrom": 1973,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 70,
    "whistle": false
  },
  {
    "slug": "bing-crosby",
    "name": "Bing Crosby",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "activeFrom": 1926,
    "lowMidi": 41,
    "highMidi": 65,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1993,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "blake-shelton",
    "name": "Blake Shelton",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 2001,
    "lowMidi": 38,
    "highMidi": 73,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1962,
    "lowMidi": 40,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "bob-marley",
    "name": "Bob Marley",
    "voiceType": "Tenor",
    "genres": [
      "Reggae",
      "Soul"
    ],
    "activeFrom": 1963,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "bobby-hatfield",
    "name": "Bobby Hatfield",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "Pop"
    ],
    "activeFrom": 1963,
    "lowMidi": 47,
    "highMidi": 87,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "bobby-mcferrin",
    "name": "Bobby McFerrin",
    "voiceType": "Baritone",
    "genres": [
      "Jazz"
    ],
    "activeFrom": 1982,
    "lowMidi": 40,
    "highMidi": 88,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "bonnie-tyler",
    "name": "Bonnie Tyler",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Rock",
      "Pop"
    ],
    "activeFrom": 1977,
    "lowMidi": 50,
    "highMidi": 79,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "bono",
    "name": "Bono",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Alternative"
    ],
    "activeFrom": 1980,
    "lowMidi": 39,
    "highMidi": 73,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "boy-george",
    "name": "Boy George",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "New Wave",
      "Soul"
    ],
    "activeFrom": 1982,
    "lowMidi": 38,
    "highMidi": 81,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "brad-delp",
    "name": "Brad Delp",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "activeFrom": 1976,
    "lowMidi": 44,
    "highMidi": 86,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 1997,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "brandon-flowers",
    "name": "Brandon Flowers",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Synth-Pop",
      "New Wave"
    ],
    "activeFrom": 2004,
    "lowMidi": 42,
    "highMidi": 80,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "brandy",
    "name": "Brandy",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Pop"
    ],
    "activeFrom": 1994,
    "lowMidi": 43,
    "highMidi": 88,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 2005,
    "lowMidi": 40,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "brian-johnson",
    "name": "Brian Johnson",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Rock"
    ],
    "activeFrom": 1980,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1992,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "brian-wilson",
    "name": "Brian Wilson",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock"
    ],
    "activeFrom": 1962,
    "lowMidi": 36,
    "highMidi": 82,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "britney-spears",
    "name": "Britney Spears",
    "voiceType": "Soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 1998,
    "lowMidi": 47,
    "highMidi": 78,
    "beltMidi": 73,
    "whistle": false
  },
  {
    "slug": "bruce-dickinson",
    "name": "Bruce Dickinson",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Hard Rock"
    ],
    "activeFrom": 1979,
    "lowMidi": 40,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
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
    "activeFrom": 1975,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2010,
    "lowMidi": 43,
    "highMidi": 86,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "bryan-adams",
    "name": "Bryan Adams",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "activeFrom": 1983,
    "lowMidi": 39,
    "highMidi": 88,
    "beltMidi": 74,
    "whistle": false
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
    "activeFrom": 1989,
    "lowMidi": 41,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "bryson-tiller",
    "name": "Bryson Tiller",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Hip-Hop"
    ],
    "activeFrom": 2015,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "buju-banton",
    "name": "Buju Banton",
    "voiceType": "Bass-baritone",
    "genres": [
      "Reggae"
    ],
    "activeFrom": 1992,
    "lowMidi": 40,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "burna-boy",
    "name": "Burna Boy",
    "voiceType": "Baritone",
    "genres": [
      "Afrobeats",
      "R&B"
    ],
    "activeFrom": 2012,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1967,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "caleb-followill",
    "name": "Caleb Followill",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Indie",
      "Alternative"
    ],
    "activeFrom": 2003,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "camila-cabello",
    "name": "Camila Cabello",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Latin"
    ],
    "activeFrom": 2013,
    "lowMidi": 50,
    "highMidi": 79,
    "beltMidi": 74,
    "whistle": false
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
    "activeFrom": 1972,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "carin-leon",
    "name": "Carín León",
    "voiceType": "Baritone",
    "genres": [
      "Latin",
      "Country"
    ],
    "activeFrom": 2019,
    "lowMidi": 42,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "caroline-polachek",
    "name": "Caroline Polachek",
    "voiceType": "Soprano",
    "genres": [
      "Alternative",
      "Synth-Pop",
      "Pop"
    ],
    "activeFrom": 2019,
    "lowMidi": 44,
    "highMidi": 89,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "carrie-underwood",
    "name": "Carrie Underwood",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "activeFrom": 2005,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "cece-winans",
    "name": "CeCe Winans",
    "voiceType": "Soprano",
    "genres": [
      "Gospel",
      "R&B"
    ],
    "activeFrom": 1987,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "cecile-mclorin-salvant",
    "name": "Cécile McLorin Salvant",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Jazz",
      "Blues"
    ],
    "activeFrom": 2010,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "cecilia-bartoli",
    "name": "Cecilia Bartoli",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1988,
    "lowMidi": 53,
    "highMidi": 86,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ceelo-green",
    "name": "CeeLo Green",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B",
      "Hip-Hop"
    ],
    "activeFrom": 1995,
    "lowMidi": 34,
    "highMidi": 84,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "celia-cruz",
    "name": "Celia Cruz",
    "voiceType": "Contralto",
    "genres": [
      "Latin",
      "Jazz"
    ],
    "activeFrom": 1950,
    "lowMidi": 52,
    "highMidi": 79,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "celine-dion",
    "name": "Celine Dion",
    "voiceType": "Soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 1990,
    "lowMidi": 46,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "cesaria-evora",
    "name": "Cesária Évora",
    "voiceType": "Contralto",
    "genres": [
      "Folk",
      "Jazz"
    ],
    "activeFrom": 1988,
    "lowMidi": 50,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "chad-kroeger",
    "name": "Chad Kroeger",
    "voiceType": "Baritone",
    "genres": [
      "Hard Rock",
      "Rock"
    ],
    "activeFrom": 2001,
    "lowMidi": 33,
    "highMidi": 76,
    "beltMidi": 74,
    "whistle": false
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
    "activeFrom": 1974,
    "lowMidi": 41,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2020,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "charles-aznavour",
    "name": "Charles Aznavour",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Singer-Songwriter"
    ],
    "activeFrom": 1956,
    "lowMidi": 50,
    "highMidi": 71,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "charli-xcx",
    "name": "Charli XCX",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Electronic"
    ],
    "activeFrom": 2013,
    "lowMidi": 53,
    "highMidi": 77,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "charlie-puth",
    "name": "Charlie Puth",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2015,
    "lowMidi": 43,
    "highMidi": 84,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "chen",
    "name": "Chen",
    "voiceType": "Tenor",
    "genres": [
      "K-Pop",
      "Pop"
    ],
    "activeFrom": 2012,
    "lowMidi": 43,
    "highMidi": 77,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "cher",
    "name": "Cher",
    "voiceType": "Contralto",
    "genres": [
      "Pop",
      "Rock"
    ],
    "activeFrom": 1965,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 74,
    "whistle": false
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
    "activeFrom": 2000,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "childish-gambino",
    "name": "Childish Gambino",
    "voiceType": "Tenor",
    "genres": [
      "Hip-Hop",
      "Funk",
      "Soul"
    ],
    "activeFrom": 2011,
    "lowMidi": 34,
    "highMidi": 84,
    "beltMidi": 82,
    "whistle": false
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
    "activeFrom": 1995,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "chloe-bailey",
    "name": "Chlöe Bailey",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Pop"
    ],
    "activeFrom": 2018,
    "lowMidi": 47,
    "highMidi": 86,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "chris-brown",
    "name": "Chris Brown",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Pop"
    ],
    "activeFrom": 2005,
    "lowMidi": 48,
    "highMidi": 80,
    "beltMidi": 67,
    "whistle": false
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
    "activeFrom": 1988,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": 78,
    "whistle": false
  },
  {
    "slug": "chris-martin",
    "name": "Chris Martin",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop",
      "Alternative"
    ],
    "activeFrom": 2000,
    "lowMidi": 38,
    "highMidi": 84,
    "beltMidi": 75,
    "whistle": false
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
    "activeFrom": 2015,
    "lowMidi": 41,
    "highMidi": 71,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "chris-tomlin",
    "name": "Chris Tomlin",
    "voiceType": "Tenor",
    "genres": [
      "Gospel",
      "Pop"
    ],
    "activeFrom": 2002,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "christian-nodal",
    "name": "Christian Nodal",
    "voiceType": "Baritone",
    "genres": [
      "Latin"
    ],
    "activeFrom": 2017,
    "lowMidi": 45,
    "highMidi": 67,
    "beltMidi": 65,
    "whistle": false
  },
  {
    "slug": "christina-aguilera",
    "name": "Christina Aguilera",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 1999,
    "lowMidi": 48,
    "highMidi": 96,
    "beltMidi": 79,
    "whistle": true
  },
  {
    "slug": "christopher-cross",
    "name": "Christopher Cross",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock",
      "Singer-Songwriter"
    ],
    "activeFrom": 1980,
    "lowMidi": 50,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ciara",
    "name": "Ciara",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Pop",
      "Hip-Hop"
    ],
    "activeFrom": 2004,
    "lowMidi": 46,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "coco-jones",
    "name": "Coco Jones",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Pop"
    ],
    "activeFrom": 2012,
    "lowMidi": 47,
    "highMidi": 85,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "cody-johnson",
    "name": "Cody Johnson",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 2019,
    "lowMidi": 42,
    "highMidi": 68,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "colm-wilkinson",
    "name": "Colm Wilkinson",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre"
    ],
    "activeFrom": 1985,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "conan-gray",
    "name": "Conan Gray",
    "voiceType": "Tenor",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2018,
    "lowMidi": 48,
    "highMidi": 79,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "corey-taylor",
    "name": "Corey Taylor",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
      "Alternative"
    ],
    "activeFrom": 1999,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "cristian-castro",
    "name": "Cristian Castro",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1992,
    "lowMidi": 43,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1958,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "cyndi-lauper",
    "name": "Cyndi Lauper",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "New Wave"
    ],
    "activeFrom": 1983,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2015,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false
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
    "activeFrom": 1995,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "damiano-david",
    "name": "Damiano David",
    "voiceType": "Baritone",
    "genres": [
      "Rock"
    ],
    "activeFrom": 2021,
    "lowMidi": 45,
    "highMidi": 71,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "dan-reynolds",
    "name": "Dan Reynolds",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Rock",
      "Alternative"
    ],
    "activeFrom": 2012,
    "lowMidi": 43,
    "highMidi": 80,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "daniel-caesar",
    "name": "Daniel Caesar",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Soul",
      "Gospel"
    ],
    "activeFrom": 2017,
    "lowMidi": 49,
    "highMidi": 78,
    "beltMidi": 68,
    "whistle": false
  },
  {
    "slug": "daryl-hall",
    "name": "Daryl Hall",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B",
      "Soul"
    ],
    "activeFrom": 1976,
    "lowMidi": 40,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "dave-gahan",
    "name": "Dave Gahan",
    "voiceType": "Baritone",
    "genres": [
      "Synth-Pop",
      "New Wave",
      "Electronic"
    ],
    "activeFrom": 1981,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": 64,
    "whistle": false
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
    "activeFrom": 1969,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "david-coverdale",
    "name": "David Coverdale",
    "voiceType": "Baritone",
    "genres": [
      "Hard Rock",
      "Blues",
      "Rock"
    ],
    "activeFrom": 1974,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "david-draiman",
    "name": "David Draiman",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
      "Hard Rock"
    ],
    "activeFrom": 2000,
    "lowMidi": 34,
    "highMidi": 80,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "david-lee-roth",
    "name": "David Lee Roth",
    "voiceType": "Baritone",
    "genres": [
      "Hard Rock",
      "Rock"
    ],
    "activeFrom": 1978,
    "lowMidi": 28,
    "highMidi": 86,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "david-ruffin",
    "name": "David Ruffin",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B"
    ],
    "activeFrom": 1964,
    "lowMidi": 45,
    "highMidi": 88,
    "beltMidi": 82,
    "whistle": false
  },
  {
    "slug": "dean-martin",
    "name": "Dean Martin",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "activeFrom": 1946,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1976,
    "lowMidi": 53,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "demi-lovato",
    "name": "Demi Lovato",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2008,
    "lowMidi": 49,
    "highMidi": 86,
    "beltMidi": 81,
    "whistle": false
  },
  {
    "slug": "dennis-brown",
    "name": "Dennis Brown",
    "voiceType": "Tenor",
    "genres": [
      "Reggae",
      "Soul"
    ],
    "activeFrom": 1969,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": 70,
    "whistle": false
  },
  {
    "slug": "dennis-deyoung",
    "name": "Dennis DeYoung",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "activeFrom": 1975,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "devin-townsend",
    "name": "Devin Townsend",
    "voiceType": "Tenor",
    "genres": [
      "Metal"
    ],
    "activeFrom": 1993,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "diana-krall",
    "name": "Diana Krall",
    "voiceType": "Contralto",
    "genres": [
      "Jazz"
    ],
    "activeFrom": 1993,
    "lowMidi": 52,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1964,
    "lowMidi": 51,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "dimash-kudaibergen",
    "name": "Dimash Kudaibergen",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Classical"
    ],
    "activeFrom": 2017,
    "lowMidi": 36,
    "highMidi": 108,
    "beltMidi": 77,
    "whistle": true
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
    "activeFrom": 1989,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "doja-cat",
    "name": "Doja Cat",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "R&B",
      "Hip-Hop"
    ],
    "activeFrom": 2019,
    "lowMidi": 48,
    "highMidi": 83,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "dolly-parton",
    "name": "Dolly Parton",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "activeFrom": 1967,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "dolores-oriordan",
    "name": "Dolores O'Riordan",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Alternative",
      "Rock"
    ],
    "activeFrom": 1990,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "don-henley",
    "name": "Don Henley",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Country",
      "Pop"
    ],
    "activeFrom": 1972,
    "lowMidi": 42,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "donnie-mcclurkin",
    "name": "Donnie McClurkin",
    "voiceType": "Tenor",
    "genres": [
      "Gospel"
    ],
    "activeFrom": 1996,
    "lowMidi": 47,
    "highMidi": 76,
    "beltMidi": 69,
    "whistle": false
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
    "activeFrom": 1970,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "drake",
    "name": "Drake",
    "voiceType": "Baritone",
    "genres": [
      "Hip-Hop",
      "R&B"
    ],
    "activeFrom": 2009,
    "lowMidi": 38,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2017,
    "lowMidi": 47,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "dusty-springfield",
    "name": "Dusty Springfield",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Soul"
    ],
    "activeFrom": 1963,
    "lowMidi": 48,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2011,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 71,
    "whistle": false
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
    "activeFrom": 1991,
    "lowMidi": 38,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "edith-piaf",
    "name": "Édith Piaf",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Folk"
    ],
    "activeFrom": 1936,
    "lowMidi": 47,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1965,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "elize-ryd",
    "name": "Elize Ryd",
    "voiceType": "Soprano",
    "genres": [
      "Metal",
      "Pop"
    ],
    "activeFrom": 2011,
    "lowMidi": 52,
    "highMidi": 90,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ella-fitzgerald",
    "name": "Ella Fitzgerald",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "activeFrom": 1935,
    "lowMidi": 50,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ella-mai",
    "name": "Ella Mai",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul"
    ],
    "activeFrom": 2018,
    "lowMidi": 48,
    "highMidi": 80,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ellie-goulding",
    "name": "Ellie Goulding",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Electronic"
    ],
    "activeFrom": 2010,
    "lowMidi": 50,
    "highMidi": 81,
    "beltMidi": 73,
    "whistle": false
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
    "activeFrom": 1970,
    "lowMidi": 41,
    "highMidi": 77,
    "beltMidi": 70,
    "whistle": false
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
    "activeFrom": 1956,
    "lowMidi": 43,
    "highMidi": 73,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "emeli-sande",
    "name": "Emeli Sandé",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Soul",
      "R&B"
    ],
    "activeFrom": 2011,
    "lowMidi": 50,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1975,
    "lowMidi": 55,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "enrico-caruso",
    "name": "Enrico Caruso",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1902,
    "lowMidi": 47,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "enrique-iglesias",
    "name": "Enrique Iglesias",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1996,
    "lowMidi": 49,
    "highMidi": 68,
    "beltMidi": 66,
    "whistle": false
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
    "activeFrom": 1997,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ethel-merman",
    "name": "Ethel Merman",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre"
    ],
    "activeFrom": 1930,
    "lowMidi": 53,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1955,
    "lowMidi": 44,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "faith-evans",
    "name": "Faith Evans",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul",
      "Hip-Hop"
    ],
    "activeFrom": 1995,
    "lowMidi": 49,
    "highMidi": 85,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "faith-hill",
    "name": "Faith Hill",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "activeFrom": 1993,
    "lowMidi": 48,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "fantasia",
    "name": "Fantasia",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul",
      "Gospel"
    ],
    "activeFrom": 2004,
    "lowMidi": 48,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "faouzia",
    "name": "Faouzia",
    "voiceType": "Soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2019,
    "lowMidi": 49,
    "highMidi": 91,
    "beltMidi": 77,
    "whistle": true
  },
  {
    "slug": "faye-wong",
    "name": "Faye Wong",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Alternative"
    ],
    "activeFrom": 1992,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1961,
    "lowMidi": 41,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1996,
    "lowMidi": 48,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "fka-twigs",
    "name": "FKA twigs",
    "voiceType": "Soprano",
    "genres": [
      "Electronic",
      "R&B",
      "Alternative"
    ],
    "activeFrom": 2014,
    "lowMidi": 52,
    "highMidi": 89,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "floor-jansen",
    "name": "Floor Jansen",
    "voiceType": "Soprano",
    "genres": [
      "Metal",
      "Rock",
      "Classical"
    ],
    "activeFrom": 2000,
    "lowMidi": 52,
    "highMidi": 88,
    "beltMidi": 81,
    "whistle": false
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
    "activeFrom": 2008,
    "lowMidi": 53,
    "highMidi": 83,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "frank-ocean",
    "name": "Frank Ocean",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Hip-Hop"
    ],
    "activeFrom": 2011,
    "lowMidi": 37,
    "highMidi": 79,
    "beltMidi": 66,
    "whistle": false
  },
  {
    "slug": "frank-sinatra",
    "name": "Frank Sinatra",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "activeFrom": 1940,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "frankie-valli",
    "name": "Frankie Valli",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 1962,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 65,
    "whistle": false
  },
  {
    "slug": "fred-hammond",
    "name": "Fred Hammond",
    "voiceType": "Bass-baritone",
    "genres": [
      "Gospel",
      "R&B"
    ],
    "activeFrom": 1985,
    "lowMidi": 40,
    "highMidi": 70,
    "beltMidi": 67,
    "whistle": false
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
    "activeFrom": 1973,
    "lowMidi": 41,
    "highMidi": 89,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "fujii-kaze",
    "name": "Fujii Kaze",
    "voiceType": "Baritone",
    "genres": [
      "J-Pop",
      "R&B",
      "Pop"
    ],
    "activeFrom": 2020,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": 64,
    "whistle": false
  },
  {
    "slug": "gem",
    "name": "G.E.M.",
    "voiceType": "Soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2008,
    "lowMidi": 50,
    "highMidi": 89,
    "beltMidi": 80,
    "whistle": true
  },
  {
    "slug": "garth-brooks",
    "name": "Garth Brooks",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 1989,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "geddy-lee",
    "name": "Geddy Lee",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "activeFrom": 1974,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "geoff-tate",
    "name": "Geoff Tate",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Hard Rock"
    ],
    "activeFrom": 1983,
    "lowMidi": 40,
    "highMidi": 84,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "george-jones",
    "name": "George Jones",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 1955,
    "lowMidi": 35,
    "highMidi": 71,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "george-michael",
    "name": "George Michael",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Soul"
    ],
    "activeFrom": 1982,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "george-strait",
    "name": "George Strait",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 1981,
    "lowMidi": 45,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "gerard-way",
    "name": "Gerard Way",
    "voiceType": "Tenor",
    "genres": [
      "Punk",
      "Rock",
      "Alternative"
    ],
    "activeFrom": 2004,
    "lowMidi": 42,
    "highMidi": 78,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "gigi-perez",
    "name": "Gigi Perez",
    "voiceType": "Contralto",
    "genres": [
      "Indie",
      "Singer-Songwriter"
    ],
    "activeFrom": 2024,
    "lowMidi": 52,
    "highMidi": 73,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "giveon",
    "name": "Giveon",
    "voiceType": "Baritone",
    "genres": [
      "R&B",
      "Soul"
    ],
    "activeFrom": 2020,
    "lowMidi": 42,
    "highMidi": 66,
    "beltMidi": 64,
    "whistle": false
  },
  {
    "slug": "gladys-knight",
    "name": "Gladys Knight",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Soul",
      "R&B"
    ],
    "activeFrom": 1961,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "glen-campbell",
    "name": "Glen Campbell",
    "voiceType": "Tenor",
    "genres": [
      "Country",
      "Pop"
    ],
    "activeFrom": 1967,
    "lowMidi": 41,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "glenn-danzig",
    "name": "Glenn Danzig",
    "voiceType": "Baritone",
    "genres": [
      "Punk",
      "Metal",
      "Rock"
    ],
    "activeFrom": 1977,
    "lowMidi": 37,
    "highMidi": 75,
    "beltMidi": 73,
    "whistle": false
  },
  {
    "slug": "glenn-hughes",
    "name": "Glenn Hughes",
    "voiceType": "Baritone",
    "genres": [
      "Hard Rock",
      "Funk",
      "Soul"
    ],
    "activeFrom": 1973,
    "lowMidi": 38,
    "highMidi": 86,
    "beltMidi": 81,
    "whistle": false
  },
  {
    "slug": "gloria-estefan",
    "name": "Gloria Estefan",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1985,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false
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
    "activeFrom": 1977,
    "lowMidi": 50,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "grace-slick",
    "name": "Grace Slick",
    "voiceType": "Contralto",
    "genres": [
      "Rock"
    ],
    "activeFrom": 1966,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "gracie-abrams",
    "name": "Gracie Abrams",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Singer-Songwriter"
    ],
    "activeFrom": 2020,
    "lowMidi": 53,
    "highMidi": 76,
    "beltMidi": 69,
    "whistle": false
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
    "activeFrom": 2010,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "grimes",
    "name": "Grimes",
    "voiceType": "Soprano",
    "genres": [
      "Electronic",
      "Synth-Pop",
      "Alternative"
    ],
    "activeFrom": 2012,
    "lowMidi": 50,
    "highMidi": 91,
    "beltMidi": 82,
    "whistle": true
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
    "activeFrom": 1995,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "her",
    "name": "H.E.R.",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul"
    ],
    "activeFrom": 2016,
    "lowMidi": 48,
    "highMidi": 78,
    "beltMidi": 73,
    "whistle": false
  },
  {
    "slug": "halle-bailey",
    "name": "Halle Bailey",
    "voiceType": "Soprano",
    "genres": [
      "R&B",
      "Pop"
    ],
    "activeFrom": 2018,
    "lowMidi": 48,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "halsey",
    "name": "Halsey",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Alternative"
    ],
    "activeFrom": 2015,
    "lowMidi": 48,
    "highMidi": 79,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "hank-williams",
    "name": "Hank Williams",
    "voiceType": "Tenor",
    "genres": [
      "Country",
      "Blues"
    ],
    "activeFrom": 1947,
    "lowMidi": 45,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "harry-styles",
    "name": "Harry Styles",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Rock"
    ],
    "activeFrom": 2010,
    "lowMidi": 40,
    "highMidi": 77,
    "beltMidi": 72,
    "whistle": false
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
    "activeFrom": 2005,
    "lowMidi": 53,
    "highMidi": 86,
    "beltMidi": 79,
    "whistle": false
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
    "activeFrom": 1998,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 74,
    "whistle": false
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
    "activeFrom": 2013,
    "lowMidi": 40,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "hua-chenyu",
    "name": "Hua Chenyu",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock"
    ],
    "activeFrom": 2013,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "hugh-jackman",
    "name": "Hugh Jackman",
    "voiceType": "Baritone",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "activeFrom": 1998,
    "lowMidi": 45,
    "highMidi": 71,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ian-curtis",
    "name": "Ian Curtis",
    "voiceType": "Baritone",
    "genres": [
      "Punk",
      "New Wave"
    ],
    "activeFrom": 1979,
    "lowMidi": 43,
    "highMidi": 64,
    "beltMidi": 62,
    "whistle": false
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
    "activeFrom": 1969,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "idina-menzel",
    "name": "Idina Menzel",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "activeFrom": 1996,
    "lowMidi": 43,
    "highMidi": 86,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "indiaarie",
    "name": "India.Arie",
    "voiceType": "Contralto",
    "genres": [
      "R&B",
      "Soul",
      "Singer-Songwriter"
    ],
    "activeFrom": 2001,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2008,
    "lowMidi": 50,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 1966,
    "lowMidi": 29,
    "highMidi": 77,
    "beltMidi": 65,
    "whistle": false
  },
  {
    "slug": "jack-white",
    "name": "Jack White",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Blues",
      "Punk"
    ],
    "activeFrom": 2001,
    "lowMidi": 40,
    "highMidi": 93,
    "beltMidi": 76,
    "whistle": true
  },
  {
    "slug": "jackie-wilson",
    "name": "Jackie Wilson",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B"
    ],
    "activeFrom": 1957,
    "lowMidi": 45,
    "highMidi": 85,
    "beltMidi": 82,
    "whistle": false
  },
  {
    "slug": "jacky-cheung",
    "name": "Jacky Cheung",
    "voiceType": "Baritone",
    "genres": [
      "Pop"
    ],
    "activeFrom": 1985,
    "lowMidi": 52,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2016,
    "lowMidi": 38,
    "highMidi": 86,
    "beltMidi": 79,
    "whistle": false
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
    "activeFrom": 2011,
    "lowMidi": 41,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1956,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "james-hetfield",
    "name": "James Hetfield",
    "voiceType": "Baritone",
    "genres": [
      "Metal"
    ],
    "activeFrom": 1983,
    "lowMidi": 40,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1970,
    "lowMidi": 41,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "janelle-monae",
    "name": "Janelle Monáe",
    "voiceType": "Soprano",
    "genres": [
      "R&B",
      "Funk",
      "Pop"
    ],
    "activeFrom": 2010,
    "lowMidi": 49,
    "highMidi": 87,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "janet-jackson",
    "name": "Janet Jackson",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "R&B",
      "Funk"
    ],
    "activeFrom": 1986,
    "lowMidi": 48,
    "highMidi": 86,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1967,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "jason-derulo",
    "name": "Jason Derulo",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2009,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false
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
    "activeFrom": 2002,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jay-chou",
    "name": "Jay Chou",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2000,
    "lowMidi": 45,
    "highMidi": 71,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "jazmine-sullivan",
    "name": "Jazmine Sullivan",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul"
    ],
    "activeFrom": 2008,
    "lowMidi": 45,
    "highMidi": 85,
    "beltMidi": 80,
    "whistle": false
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
    "activeFrom": 1994,
    "lowMidi": 40,
    "highMidi": 86,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "jelly-roll",
    "name": "Jelly Roll",
    "voiceType": "Baritone",
    "genres": [
      "Country",
      "Rock",
      "Hip-Hop"
    ],
    "activeFrom": 2021,
    "lowMidi": 43,
    "highMidi": 67,
    "beltMidi": 65,
    "whistle": false
  },
  {
    "slug": "jenni-rivera",
    "name": "Jenni Rivera",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Latin"
    ],
    "activeFrom": 2005,
    "lowMidi": 48,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2004,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false
  },
  {
    "slug": "jeremy-jordan",
    "name": "Jeremy Jordan",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "activeFrom": 2012,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "jessie-j",
    "name": "Jessie J",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2011,
    "lowMidi": 49,
    "highMidi": 84,
    "beltMidi": 81,
    "whistle": false
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
    "activeFrom": 1969,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jewel",
    "name": "Jewel",
    "voiceType": "Soprano",
    "genres": [
      "Folk",
      "Singer-Songwriter",
      "Pop"
    ],
    "activeFrom": 1995,
    "lowMidi": 52,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jhene-aiko",
    "name": "Jhené Aiko",
    "voiceType": "Soprano",
    "genres": [
      "R&B",
      "Hip-Hop",
      "Soul"
    ],
    "activeFrom": 2013,
    "lowMidi": 47,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2000,
    "lowMidi": 48,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jim-morrison",
    "name": "Jim Morrison",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Blues"
    ],
    "activeFrom": 1967,
    "lowMidi": 40,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jimin",
    "name": "Jimin",
    "voiceType": "Tenor",
    "genres": [
      "K-Pop",
      "Pop"
    ],
    "activeFrom": 2013,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": 70,
    "whistle": false
  },
  {
    "slug": "jimmy-cliff",
    "name": "Jimmy Cliff",
    "voiceType": "Tenor",
    "genres": [
      "Reggae",
      "Soul"
    ],
    "activeFrom": 1962,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jj-lin",
    "name": "JJ Lin",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2003,
    "lowMidi": 43,
    "highMidi": 79,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "joan-baez",
    "name": "Joan Baez",
    "voiceType": "Soprano",
    "genres": [
      "Folk",
      "Singer-Songwriter"
    ],
    "activeFrom": 1960,
    "lowMidi": 53,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1976,
    "lowMidi": 52,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "joan-sutherland",
    "name": "Joan Sutherland",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1959,
    "lowMidi": 55,
    "highMidi": 89,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "joe-cocker",
    "name": "Joe Cocker",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Soul",
      "Blues"
    ],
    "activeFrom": 1968,
    "lowMidi": 43,
    "highMidi": 70,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "joe-elliott",
    "name": "Joe Elliott",
    "voiceType": "Baritone",
    "genres": [
      "Hard Rock",
      "Rock"
    ],
    "activeFrom": 1983,
    "lowMidi": 38,
    "highMidi": 80,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "john-denver",
    "name": "John Denver",
    "voiceType": "Tenor",
    "genres": [
      "Country",
      "Folk",
      "Singer-Songwriter"
    ],
    "activeFrom": 1971,
    "lowMidi": 43,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2004,
    "lowMidi": 40,
    "highMidi": 82,
    "beltMidi": 70,
    "whistle": false
  },
  {
    "slug": "john-lennon",
    "name": "John Lennon",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "activeFrom": 1963,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "johnny-cash",
    "name": "Johnny Cash",
    "voiceType": "Bass-baritone",
    "genres": [
      "Country",
      "Folk"
    ],
    "activeFrom": 1955,
    "lowMidi": 40,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "johnny-mathis",
    "name": "Johnny Mathis",
    "voiceType": "Tenor",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "activeFrom": 1956,
    "lowMidi": 47,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jojo",
    "name": "JoJo",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2004,
    "lowMidi": 45,
    "highMidi": 94,
    "beltMidi": 79,
    "whistle": true
  },
  {
    "slug": "jon-anderson",
    "name": "Jon Anderson",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "activeFrom": 1971,
    "lowMidi": 49,
    "highMidi": 78,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jon-bon-jovi",
    "name": "Jon Bon Jovi",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "activeFrom": 1984,
    "lowMidi": 40,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jonas-kaufmann",
    "name": "Jonas Kaufmann",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1994,
    "lowMidi": 47,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jonathan-davis",
    "name": "Jonathan Davis",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
      "Alternative"
    ],
    "activeFrom": 1994,
    "lowMidi": 33,
    "highMidi": 78,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "jonathan-groff",
    "name": "Jonathan Groff",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre"
    ],
    "activeFrom": 2006,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2008,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false
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
    "activeFrom": 1968,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1971,
    "lowMidi": 48,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "jose-jose",
    "name": "José José",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1970,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false
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
    "activeFrom": 2001,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "josh-kiszka",
    "name": "Josh Kiszka",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock",
      "Blues"
    ],
    "activeFrom": 2017,
    "lowMidi": 48,
    "highMidi": 85,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "josh-turner",
    "name": "Josh Turner",
    "voiceType": "Bass-baritone",
    "genres": [
      "Country",
      "Gospel"
    ],
    "activeFrom": 2003,
    "lowMidi": 32,
    "highMidi": 73,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "joss-stone",
    "name": "Joss Stone",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Soul",
      "R&B"
    ],
    "activeFrom": 2003,
    "lowMidi": 48,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "juan-diego-florez",
    "name": "Juan Diego Flórez",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1996,
    "lowMidi": 48,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "juan-gabriel",
    "name": "Juan Gabriel",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1971,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false
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
    "activeFrom": 1939,
    "lowMidi": 53,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "juice-wrld",
    "name": "Juice WRLD",
    "voiceType": "Baritone",
    "genres": [
      "Hip-Hop",
      "Alternative"
    ],
    "activeFrom": 2018,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "julian-casablancas",
    "name": "Julian Casablancas",
    "voiceType": "Baritone",
    "genres": [
      "Indie",
      "Rock",
      "New Wave"
    ],
    "activeFrom": 2001,
    "lowMidi": 36,
    "highMidi": 78,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "julie-andrews",
    "name": "Julie Andrews",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre"
    ],
    "activeFrom": 1956,
    "lowMidi": 55,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "julio-iglesias",
    "name": "Julio Iglesias",
    "voiceType": "Baritone",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1968,
    "lowMidi": 47,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2013,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "justin-bieber",
    "name": "Justin Bieber",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2009,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "justin-timberlake",
    "name": "Justin Timberlake",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 1996,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 71,
    "whistle": false
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
    "activeFrom": 2008,
    "lowMidi": 41,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2013,
    "lowMidi": 55,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "kali-uchis",
    "name": "Kali Uchis",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Latin",
      "Pop"
    ],
    "activeFrom": 2018,
    "lowMidi": 48,
    "highMidi": 77,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "kane-brown",
    "name": "Kane Brown",
    "voiceType": "Baritone",
    "genres": [
      "Country",
      "Pop",
      "R&B"
    ],
    "activeFrom": 2016,
    "lowMidi": 40,
    "highMidi": 65,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "karen-carpenter",
    "name": "Karen Carpenter",
    "voiceType": "Contralto",
    "genres": [
      "Pop"
    ],
    "activeFrom": 1969,
    "lowMidi": 50,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "karen-clark-sheard",
    "name": "Karen Clark Sheard",
    "voiceType": "Soprano",
    "genres": [
      "Gospel"
    ],
    "activeFrom": 1981,
    "lowMidi": 53,
    "highMidi": 87,
    "beltMidi": 82,
    "whistle": true
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
    "activeFrom": 2017,
    "lowMidi": 52,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 1978,
    "lowMidi": 48,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "katy-perry",
    "name": "Katy Perry",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2008,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "kehlani",
    "name": "Kehlani",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Pop"
    ],
    "activeFrom": 2015,
    "lowMidi": 50,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "keith-urban",
    "name": "Keith Urban",
    "voiceType": "Tenor",
    "genres": [
      "Country",
      "Rock"
    ],
    "activeFrom": 2000,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "kellin-quinn",
    "name": "Kellin Quinn",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Alternative"
    ],
    "activeFrom": 2010,
    "lowMidi": 47,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "kelly-clarkson",
    "name": "Kelly Clarkson",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Rock"
    ],
    "activeFrom": 2002,
    "lowMidi": 50,
    "highMidi": 87,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "kelly-rowland",
    "name": "Kelly Rowland",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Pop",
      "Electronic"
    ],
    "activeFrom": 1998,
    "lowMidi": 48,
    "highMidi": 87,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "kenny-chesney",
    "name": "Kenny Chesney",
    "voiceType": "Tenor",
    "genres": [
      "Country"
    ],
    "activeFrom": 1997,
    "lowMidi": 39,
    "highMidi": 66,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "kenny-loggins",
    "name": "Kenny Loggins",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop",
      "Folk"
    ],
    "activeFrom": 1972,
    "lowMidi": 38,
    "highMidi": 85,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "kenny-rogers",
    "name": "Kenny Rogers",
    "voiceType": "Baritone",
    "genres": [
      "Country",
      "Pop"
    ],
    "activeFrom": 1968,
    "lowMidi": 38,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "kenshi-yonezu",
    "name": "Kenshi Yonezu",
    "voiceType": "Baritone",
    "genres": [
      "J-Pop",
      "Pop"
    ],
    "activeFrom": 2012,
    "lowMidi": 41,
    "highMidi": 74,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "kesha",
    "name": "Kesha",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Electronic"
    ],
    "activeFrom": 2009,
    "lowMidi": 50,
    "highMidi": 88,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "kevin-cronin",
    "name": "Kevin Cronin",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "activeFrom": 1978,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "keyshia-cole",
    "name": "Keyshia Cole",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul",
      "Hip-Hop"
    ],
    "activeFrom": 2005,
    "lowMidi": 48,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "kid-cudi",
    "name": "Kid Cudi",
    "voiceType": "Baritone",
    "genres": [
      "Hip-Hop",
      "Alternative"
    ],
    "activeFrom": 2008,
    "lowMidi": 33,
    "highMidi": 77,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "kim-burrell",
    "name": "Kim Burrell",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Gospel",
      "Jazz"
    ],
    "activeFrom": 1995,
    "lowMidi": 52,
    "highMidi": 86,
    "beltMidi": 81,
    "whistle": false
  },
  {
    "slug": "kim-petras",
    "name": "Kim Petras",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Synth-Pop",
      "Electronic"
    ],
    "activeFrom": 2017,
    "lowMidi": 50,
    "highMidi": 94,
    "beltMidi": 80,
    "whistle": true
  },
  {
    "slug": "king-diamond",
    "name": "King Diamond",
    "voiceType": "Countertenor",
    "genres": [
      "Metal"
    ],
    "activeFrom": 1981,
    "lowMidi": 41,
    "highMidi": 86,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "kirstin-maldonado",
    "name": "Kirstin Maldonado",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Musical Theatre"
    ],
    "activeFrom": 2011,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "klaus-meine",
    "name": "Klaus Meine",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Metal"
    ],
    "activeFrom": 1979,
    "lowMidi": 43,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "kristin-chenoweth",
    "name": "Kristin Chenoweth",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre",
      "Classical"
    ],
    "activeFrom": 1999,
    "lowMidi": 55,
    "highMidi": 89,
    "beltMidi": 77,
    "whistle": false
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
    "activeFrom": 1989,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "lady-gaga",
    "name": "Lady Gaga",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Synth-Pop"
    ],
    "activeFrom": 2008,
    "lowMidi": 43,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "lainey-wilson",
    "name": "Lainey Wilson",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country"
    ],
    "activeFrom": 2021,
    "lowMidi": 57,
    "highMidi": 73,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2011,
    "lowMidi": 48,
    "highMidi": 86,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "lara-fabian",
    "name": "Lara Fabian",
    "voiceType": "Soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 1997,
    "lowMidi": 51,
    "highMidi": 86,
    "beltMidi": 81,
    "whistle": false
  },
  {
    "slug": "lata-mangeshkar",
    "name": "Lata Mangeshkar",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Classical"
    ],
    "activeFrom": 1949,
    "lowMidi": 55,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "laufey",
    "name": "Laufey",
    "voiceType": "Contralto",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "activeFrom": 2023,
    "lowMidi": 53,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "laura-pausini",
    "name": "Laura Pausini",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Latin"
    ],
    "activeFrom": 1993,
    "lowMidi": 47,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "lauren-daigle",
    "name": "Lauren Daigle",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Gospel",
      "Pop"
    ],
    "activeFrom": 2015,
    "lowMidi": 52,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 1996,
    "lowMidi": 46,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1990,
    "lowMidi": 40,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "lea-michele",
    "name": "Lea Michele",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "activeFrom": 2006,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "lea-salonga",
    "name": "Lea Salonga",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "activeFrom": 1989,
    "lowMidi": 53,
    "highMidi": 86,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "leann-rimes",
    "name": "LeAnn Rimes",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "activeFrom": 1996,
    "lowMidi": 53,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "lenny-kravitz",
    "name": "Lenny Kravitz",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Funk",
      "Soul"
    ],
    "activeFrom": 1989,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "leon-bridges",
    "name": "Leon Bridges",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B"
    ],
    "activeFrom": 2015,
    "lowMidi": 47,
    "highMidi": 67,
    "beltMidi": 65,
    "whistle": false
  },
  {
    "slug": "leona-lewis",
    "name": "Leona Lewis",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "R&B",
      "Soul"
    ],
    "activeFrom": 2006,
    "lowMidi": 48,
    "highMidi": 90,
    "beltMidi": 81,
    "whistle": true
  },
  {
    "slug": "leonard-cohen",
    "name": "Leonard Cohen",
    "voiceType": "Bass-baritone",
    "genres": [
      "Folk",
      "Singer-Songwriter"
    ],
    "activeFrom": 1967,
    "lowMidi": 38,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "leontyne-price",
    "name": "Leontyne Price",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1955,
    "lowMidi": 55,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2017,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 70,
    "whistle": false
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
    "activeFrom": 1967,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1974,
    "lowMidi": 41,
    "highMidi": 79,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "lisa",
    "name": "LiSA",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "J-Pop",
      "Rock"
    ],
    "activeFrom": 2010,
    "lowMidi": 53,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1955,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": 72,
    "whistle": false
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
    "activeFrom": 2016,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 75,
    "whistle": false
  },
  {
    "slug": "lola-young",
    "name": "Lola Young",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Soul",
      "Alternative"
    ],
    "activeFrom": 2024,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 71,
    "whistle": false
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
    "activeFrom": 2013,
    "lowMidi": 50,
    "highMidi": 81,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "loreen",
    "name": "Loreen",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Electronic"
    ],
    "activeFrom": 2012,
    "lowMidi": 47,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "loren-allred",
    "name": "Loren Allred",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Musical Theatre"
    ],
    "activeFrom": 2017,
    "lowMidi": 52,
    "highMidi": 78,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "loretta-lynn",
    "name": "Loretta Lynn",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country"
    ],
    "activeFrom": 1960,
    "lowMidi": 55,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "lou-gramm",
    "name": "Lou Gramm",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "activeFrom": 1977,
    "lowMidi": 35,
    "highMidi": 81,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "louis-armstrong",
    "name": "Louis Armstrong",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Blues"
    ],
    "activeFrom": 1925,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "luciano-pavarotti",
    "name": "Luciano Pavarotti",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1961,
    "lowMidi": 48,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "luis-fonsi",
    "name": "Luis Fonsi",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1998,
    "lowMidi": 52,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "luis-miguel",
    "name": "Luis Miguel",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1982,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "luke-combs",
    "name": "Luke Combs",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 2017,
    "lowMidi": 45,
    "highMidi": 69,
    "beltMidi": 67,
    "whistle": false
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
    "activeFrom": 1981,
    "lowMidi": 47,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "lzzy-hale",
    "name": "Lzzy Hale",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Hard Rock",
      "Metal",
      "Rock"
    ],
    "activeFrom": 2009,
    "lowMidi": 43,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "m-shadows",
    "name": "M. Shadows",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
      "Hard Rock"
    ],
    "activeFrom": 2003,
    "lowMidi": 38,
    "highMidi": 81,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "mac-miller",
    "name": "Mac Miller",
    "voiceType": "Baritone",
    "genres": [
      "Hip-Hop",
      "R&B"
    ],
    "activeFrom": 2010,
    "lowMidi": 37,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "macy-gray",
    "name": "Macy Gray",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Soul",
      "R&B",
      "Funk"
    ],
    "activeFrom": 1999,
    "lowMidi": 45,
    "highMidi": 86,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "madison-beer",
    "name": "Madison Beer",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2018,
    "lowMidi": 48,
    "highMidi": 84,
    "beltMidi": 82,
    "whistle": false
  },
  {
    "slug": "madonna",
    "name": "Madonna",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Synth-Pop"
    ],
    "activeFrom": 1983,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "mahalia-jackson",
    "name": "Mahalia Jackson",
    "voiceType": "Contralto",
    "genres": [
      "Gospel",
      "Blues"
    ],
    "activeFrom": 1947,
    "lowMidi": 52,
    "highMidi": 77,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "maluma",
    "name": "Maluma",
    "voiceType": "Baritone",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 2015,
    "lowMidi": 50,
    "highMidi": 65,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "marc-anthony",
    "name": "Marc Anthony",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1993,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": 73,
    "whistle": false
  },
  {
    "slug": "maria-callas",
    "name": "Maria Callas",
    "voiceType": "Soprano",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1947,
    "lowMidi": 54,
    "highMidi": 87,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1990,
    "lowMidi": 41,
    "highMidi": 103,
    "beltMidi": 79,
    "whistle": true
  },
  {
    "slug": "marina",
    "name": "MARINA",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Synth-Pop",
      "Indie"
    ],
    "activeFrom": 2010,
    "lowMidi": 46,
    "highMidi": 85,
    "beltMidi": 83,
    "whistle": false
  },
  {
    "slug": "mario-lanza",
    "name": "Mario Lanza",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1947,
    "lowMidi": 48,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "martina-mcbride",
    "name": "Martina McBride",
    "voiceType": "Soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "activeFrom": 1992,
    "lowMidi": 53,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "marvin-gaye",
    "name": "Marvin Gaye",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B"
    ],
    "activeFrom": 1962,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "marvin-winans",
    "name": "Marvin Winans",
    "voiceType": "Tenor",
    "genres": [
      "Gospel"
    ],
    "activeFrom": 1981,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": 70,
    "whistle": false
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
    "activeFrom": 1992,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "matt-bellamy",
    "name": "Matt Bellamy",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Alternative"
    ],
    "activeFrom": 1999,
    "lowMidi": 40,
    "highMidi": 86,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "matty-healy",
    "name": "Matty Healy",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Indie",
      "Synth-Pop"
    ],
    "activeFrom": 2013,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "maxwell",
    "name": "Maxwell",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Soul"
    ],
    "activeFrom": 1996,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "maynard-james-keenan",
    "name": "Maynard James Keenan",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Alternative"
    ],
    "activeFrom": 1993,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "meat-loaf",
    "name": "Meat Loaf",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "activeFrom": 1977,
    "lowMidi": 41,
    "highMidi": 87,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "meghan-trainor",
    "name": "Meghan Trainor",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2014,
    "lowMidi": 51,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "mel-torme",
    "name": "Mel Tormé",
    "voiceType": "Tenor",
    "genres": [
      "Jazz"
    ],
    "activeFrom": 1943,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "melanie-martinez",
    "name": "Melanie Martinez",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Alternative",
      "Electronic"
    ],
    "activeFrom": 2014,
    "lowMidi": 53,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "mercedes-sosa",
    "name": "Mercedes Sosa",
    "voiceType": "Contralto",
    "genres": [
      "Folk",
      "Latin"
    ],
    "activeFrom": 1965,
    "lowMidi": 52,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "merle-haggard",
    "name": "Merle Haggard",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 1965,
    "lowMidi": 41,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "michael-buble",
    "name": "Michael Bublé",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "activeFrom": 2003,
    "lowMidi": 43,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "michael-crawford",
    "name": "Michael Crawford",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre"
    ],
    "activeFrom": 1973,
    "lowMidi": 45,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "michael-hutchence",
    "name": "Michael Hutchence",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "New Wave",
      "Funk"
    ],
    "activeFrom": 1985,
    "lowMidi": 35,
    "highMidi": 78,
    "beltMidi": 72,
    "whistle": false
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
    "activeFrom": 1969,
    "lowMidi": 39,
    "highMidi": 89,
    "beltMidi": 75,
    "whistle": false
  },
  {
    "slug": "michael-kiske",
    "name": "Michael Kiske",
    "voiceType": "Tenor",
    "genres": [
      "Metal"
    ],
    "activeFrom": 1987,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "michael-mcdonald",
    "name": "Michael McDonald",
    "voiceType": "Baritone",
    "genres": [
      "Soul",
      "R&B",
      "Rock"
    ],
    "activeFrom": 1976,
    "lowMidi": 44,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "michael-w-smith",
    "name": "Michael W. Smith",
    "voiceType": "Tenor",
    "genres": [
      "Gospel",
      "Pop"
    ],
    "activeFrom": 1983,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "mick-jagger",
    "name": "Mick Jagger",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Blues"
    ],
    "activeFrom": 1963,
    "lowMidi": 41,
    "highMidi": 77,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "miguel",
    "name": "Miguel",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Funk",
      "Rock"
    ],
    "activeFrom": 2010,
    "lowMidi": 48,
    "highMidi": 82,
    "beltMidi": 68,
    "whistle": false
  },
  {
    "slug": "mika",
    "name": "Mika",
    "voiceType": "Tenor",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2007,
    "lowMidi": 42,
    "highMidi": 80,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "mike-patton",
    "name": "Mike Patton",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
      "Alternative"
    ],
    "activeFrom": 1989,
    "lowMidi": 27,
    "highMidi": 99,
    "beltMidi": 72,
    "whistle": false
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
    "activeFrom": 2006,
    "lowMidi": 43,
    "highMidi": 88,
    "beltMidi": 77,
    "whistle": false
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
    "activeFrom": 1967,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": 69,
    "whistle": false
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
    "activeFrom": 1974,
    "lowMidi": 50,
    "highMidi": 102,
    "beltMidi": 77,
    "whistle": true
  },
  {
    "slug": "miranda-lambert",
    "name": "Miranda Lambert",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country"
    ],
    "activeFrom": 2005,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "miriam-makeba",
    "name": "Miriam Makeba",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Jazz",
      "Folk"
    ],
    "activeFrom": 1954,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1998,
    "lowMidi": 53,
    "highMidi": 89,
    "beltMidi": 77,
    "whistle": true
  },
  {
    "slug": "mitch-grassi",
    "name": "Mitch Grassi",
    "voiceType": "Countertenor",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2011,
    "lowMidi": 41,
    "highMidi": 96,
    "beltMidi": 72,
    "whistle": true
  },
  {
    "slug": "mitski",
    "name": "Mitski",
    "voiceType": "Soprano",
    "genres": [
      "Indie",
      "Alternative",
      "Rock"
    ],
    "activeFrom": 2016,
    "lowMidi": 52,
    "highMidi": 78,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "monica",
    "name": "Monica",
    "voiceType": "Contralto",
    "genres": [
      "R&B",
      "Soul"
    ],
    "activeFrom": 1995,
    "lowMidi": 47,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1956,
    "lowMidi": 55,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "morgan-wallen",
    "name": "Morgan Wallen",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 2018,
    "lowMidi": 45,
    "highMidi": 67,
    "beltMidi": 65,
    "whistle": false
  },
  {
    "slug": "morrissey",
    "name": "Morrissey",
    "voiceType": "Baritone",
    "genres": [
      "Alternative",
      "Indie"
    ],
    "activeFrom": 1984,
    "lowMidi": 42,
    "highMidi": 71,
    "beltMidi": 67,
    "whistle": false
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
    "activeFrom": 1985,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "musiq-soulchild",
    "name": "Musiq Soulchild",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Soul"
    ],
    "activeFrom": 2000,
    "lowMidi": 48,
    "highMidi": 78,
    "beltMidi": 68,
    "whistle": false
  },
  {
    "slug": "myles-kennedy",
    "name": "Myles Kennedy",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Metal"
    ],
    "activeFrom": 2004,
    "lowMidi": 34,
    "highMidi": 86,
    "beltMidi": 78,
    "whistle": false
  },
  {
    "slug": "myles-smith",
    "name": "Myles Smith",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Folk"
    ],
    "activeFrom": 2023,
    "lowMidi": 47,
    "highMidi": 67,
    "beltMidi": 66,
    "whistle": false
  },
  {
    "slug": "nat-king-cole",
    "name": "Nat King Cole",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "activeFrom": 1939,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2002,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "nate-ruess",
    "name": "Nate Ruess",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock",
      "Indie"
    ],
    "activeFrom": 2012,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "ne-yo",
    "name": "Ne-Yo",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Pop"
    ],
    "activeFrom": 2006,
    "lowMidi": 39,
    "highMidi": 81,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "neil-diamond",
    "name": "Neil Diamond",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Rock",
      "Singer-Songwriter"
    ],
    "activeFrom": 1966,
    "lowMidi": 38,
    "highMidi": 68,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1966,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "nick-cave",
    "name": "Nick Cave",
    "voiceType": "Baritone",
    "genres": [
      "Alternative",
      "Rock",
      "Singer-Songwriter"
    ],
    "activeFrom": 1980,
    "lowMidi": 38,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "nicole-scherzinger",
    "name": "Nicole Scherzinger",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "R&B",
      "Musical Theatre"
    ],
    "activeFrom": 2005,
    "lowMidi": 50,
    "highMidi": 92,
    "beltMidi": null,
    "whistle": true
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
    "activeFrom": 1958,
    "lowMidi": 43,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "noah-kahan",
    "name": "Noah Kahan",
    "voiceType": "Tenor",
    "genres": [
      "Folk",
      "Pop",
      "Singer-Songwriter"
    ],
    "activeFrom": 2022,
    "lowMidi": 47,
    "highMidi": 68,
    "beltMidi": 66,
    "whistle": false
  },
  {
    "slug": "noah-sebastian",
    "name": "Noah Sebastian",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
      "Rock"
    ],
    "activeFrom": 2016,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2002,
    "lowMidi": 53,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "normani",
    "name": "Normani",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Pop"
    ],
    "activeFrom": 2013,
    "lowMidi": 49,
    "highMidi": 99,
    "beltMidi": 79,
    "whistle": true
  },
  {
    "slug": "oli-sykes",
    "name": "Oli Sykes",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Rock",
      "Electronic"
    ],
    "activeFrom": 2006,
    "lowMidi": 39,
    "highMidi": 80,
    "beltMidi": 70,
    "whistle": false
  },
  {
    "slug": "olivia-newton-john",
    "name": "Olivia Newton-John",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Country"
    ],
    "activeFrom": 1971,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2021,
    "lowMidi": 47,
    "highMidi": 82,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "omar-apollo",
    "name": "Omar Apollo",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Latin",
      "Indie"
    ],
    "activeFrom": 2019,
    "lowMidi": 48,
    "highMidi": 78,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "orville-peck",
    "name": "Orville Peck",
    "voiceType": "Baritone",
    "genres": [
      "Country",
      "Indie"
    ],
    "activeFrom": 2019,
    "lowMidi": 40,
    "highMidi": 78,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "otis-redding",
    "name": "Otis Redding",
    "voiceType": "Baritone",
    "genres": [
      "Soul",
      "R&B"
    ],
    "activeFrom": 1962,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ozuna",
    "name": "Ozuna",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 2016,
    "lowMidi": 42,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ozzy-osbourne",
    "name": "Ozzy Osbourne",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Hard Rock"
    ],
    "activeFrom": 1970,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "park-hyo-shin",
    "name": "Park Hyo Shin",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Musical Theatre"
    ],
    "activeFrom": 1999,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false
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
    "activeFrom": 1979,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "patrick-stump",
    "name": "Patrick Stump",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Punk",
      "Pop"
    ],
    "activeFrom": 2005,
    "lowMidi": 48,
    "highMidi": 83,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "patsy-cline",
    "name": "Patsy Cline",
    "voiceType": "Contralto",
    "genres": [
      "Country",
      "Pop"
    ],
    "activeFrom": 1957,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1962,
    "lowMidi": 46,
    "highMidi": 88,
    "beltMidi": 82,
    "whistle": false
  },
  {
    "slug": "patti-lupone",
    "name": "Patti LuPone",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre"
    ],
    "activeFrom": 1979,
    "lowMidi": 52,
    "highMidi": 79,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "paul-mccartney",
    "name": "Paul McCartney",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "activeFrom": 1963,
    "lowMidi": 41,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "paul-rodgers",
    "name": "Paul Rodgers",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Blues",
      "Hard Rock"
    ],
    "activeFrom": 1970,
    "lowMidi": 40,
    "highMidi": 80,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1964,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "peso-pluma",
    "name": "Peso Pluma",
    "voiceType": "Tenor",
    "genres": [
      "Latin"
    ],
    "activeFrom": 2022,
    "lowMidi": 47,
    "highMidi": 66,
    "beltMidi": 64,
    "whistle": false
  },
  {
    "slug": "peter-gabriel",
    "name": "Peter Gabriel",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "New Wave"
    ],
    "activeFrom": 1971,
    "lowMidi": 42,
    "highMidi": 69,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "peter-steele",
    "name": "Peter Steele",
    "voiceType": "Bass-baritone",
    "genres": [
      "Metal",
      "Rock"
    ],
    "activeFrom": 1991,
    "lowMidi": 29,
    "highMidi": 79,
    "beltMidi": 68,
    "whistle": false
  },
  {
    "slug": "peter-tosh",
    "name": "Peter Tosh",
    "voiceType": "Baritone",
    "genres": [
      "Reggae"
    ],
    "activeFrom": 1963,
    "lowMidi": 41,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "pharrell-williams",
    "name": "Pharrell Williams",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B",
      "Funk"
    ],
    "activeFrom": 2001,
    "lowMidi": 39,
    "highMidi": 82,
    "beltMidi": 81,
    "whistle": false
  },
  {
    "slug": "phil-collins",
    "name": "Phil Collins",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "activeFrom": 1976,
    "lowMidi": 41,
    "highMidi": 73,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1972,
    "lowMidi": 43,
    "highMidi": 86,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "phoebe-bridgers",
    "name": "Phoebe Bridgers",
    "voiceType": "Soprano",
    "genres": [
      "Indie",
      "Folk",
      "Singer-Songwriter"
    ],
    "activeFrom": 2017,
    "lowMidi": 49,
    "highMidi": 76,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "pink",
    "name": "Pink",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Rock"
    ],
    "activeFrom": 2000,
    "lowMidi": 43,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "placido-domingo",
    "name": "Plácido Domingo",
    "voiceType": "Tenor",
    "genres": [
      "Opera",
      "Classical"
    ],
    "activeFrom": 1961,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "post-malone",
    "name": "Post Malone",
    "voiceType": "Baritone",
    "genres": [
      "Hip-Hop",
      "Pop",
      "Country"
    ],
    "activeFrom": 2015,
    "lowMidi": 40,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "prince",
    "name": "Prince",
    "voiceType": "Tenor",
    "genres": [
      "Funk",
      "R&B",
      "Rock"
    ],
    "activeFrom": 1978,
    "lowMidi": 40,
    "highMidi": 83,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "rachel-zegler",
    "name": "Rachel Zegler",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre",
      "Pop"
    ],
    "activeFrom": 2021,
    "lowMidi": 49,
    "highMidi": 88,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "ramin-karimloo",
    "name": "Ramin Karimloo",
    "voiceType": "Tenor",
    "genres": [
      "Musical Theatre",
      "Rock"
    ],
    "activeFrom": 2009,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": 70,
    "whistle": false
  },
  {
    "slug": "randy-travis",
    "name": "Randy Travis",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 1986,
    "lowMidi": 41,
    "highMidi": 64,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "rauw-alejandro",
    "name": "Rauw Alejandro",
    "voiceType": "Baritone",
    "genres": [
      "Latin",
      "R&B"
    ],
    "activeFrom": 2020,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ravyn-lenae",
    "name": "Ravyn Lenae",
    "voiceType": "Soprano",
    "genres": [
      "R&B",
      "Soul",
      "Alternative"
    ],
    "activeFrom": 2018,
    "lowMidi": 49,
    "highMidi": 85,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1954,
    "lowMidi": 36,
    "highMidi": 82,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "raye",
    "name": "RAYE",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B",
      "Soul"
    ],
    "activeFrom": 2016,
    "lowMidi": 49,
    "highMidi": 86,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "reba-mcentire",
    "name": "Reba McEntire",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country"
    ],
    "activeFrom": 1977,
    "lowMidi": 52,
    "highMidi": 77,
    "beltMidi": 74,
    "whistle": false
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
    "activeFrom": 2004,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "rema",
    "name": "Rema",
    "voiceType": "Tenor",
    "genres": [
      "Afrobeats"
    ],
    "activeFrom": 2019,
    "lowMidi": 49,
    "highMidi": 76,
    "beltMidi": 66,
    "whistle": false
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
    "activeFrom": 1991,
    "lowMidi": 55,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "renee-rapp",
    "name": "Reneé Rapp",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Musical Theatre"
    ],
    "activeFrom": 2021,
    "lowMidi": 52,
    "highMidi": 80,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "rick-astley",
    "name": "Rick Astley",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Synth-Pop"
    ],
    "activeFrom": 1987,
    "lowMidi": 41,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ricky-martin",
    "name": "Ricky Martin",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1991,
    "lowMidi": 47,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "rihanna",
    "name": "Rihanna",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2005,
    "lowMidi": 47,
    "highMidi": 83,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "rivers-cuomo",
    "name": "Rivers Cuomo",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Alternative",
      "Pop"
    ],
    "activeFrom": 1994,
    "lowMidi": 39,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "rob-halford",
    "name": "Rob Halford",
    "voiceType": "Tenor",
    "genres": [
      "Metal"
    ],
    "activeFrom": 1974,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "robbie-williams",
    "name": "Robbie Williams",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock",
      "Jazz"
    ],
    "activeFrom": 1992,
    "lowMidi": 41,
    "highMidi": 83,
    "beltMidi": 79,
    "whistle": false
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
    "activeFrom": 1968,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "robert-smith",
    "name": "Robert Smith",
    "voiceType": "Tenor",
    "genres": [
      "Alternative",
      "New Wave"
    ],
    "activeFrom": 1982,
    "lowMidi": 49,
    "highMidi": 72,
    "beltMidi": 68,
    "whistle": false
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
    "activeFrom": 1969,
    "lowMidi": 40,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "roger-daltrey",
    "name": "Roger Daltrey",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Hard Rock"
    ],
    "activeFrom": 1965,
    "lowMidi": 41,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ronnie-james-dio",
    "name": "Ronnie James Dio",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Hard Rock"
    ],
    "activeFrom": 1975,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "ronnie-radke",
    "name": "Ronnie Radke",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Metal"
    ],
    "activeFrom": 2006,
    "lowMidi": 38,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "rosalia",
    "name": "Rosalía",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Latin",
      "Pop",
      "Electronic"
    ],
    "activeFrom": 2017,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 78,
    "whistle": false
  },
  {
    "slug": "rose",
    "name": "Rosé",
    "voiceType": "Soprano",
    "genres": [
      "K-Pop",
      "Pop"
    ],
    "activeFrom": 2016,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 1956,
    "lowMidi": 40,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1998,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "sabrina-carpenter",
    "name": "Sabrina Carpenter",
    "voiceType": "Soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2015,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "sade-adu",
    "name": "Sade Adu",
    "voiceType": "Contralto",
    "genres": [
      "Soul",
      "Jazz"
    ],
    "activeFrom": 1984,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "salif-keita",
    "name": "Salif Keita",
    "voiceType": "Tenor",
    "genres": [
      "Folk",
      "Afrobeats"
    ],
    "activeFrom": 1970,
    "lowMidi": 47,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1957,
    "lowMidi": 45,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "sam-fender",
    "name": "Sam Fender",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Indie",
      "Singer-Songwriter"
    ],
    "activeFrom": 2019,
    "lowMidi": 42,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "sam-ryder",
    "name": "Sam Ryder",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Rock"
    ],
    "activeFrom": 2022,
    "lowMidi": 60,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2012,
    "lowMidi": 43,
    "highMidi": 84,
    "beltMidi": 70,
    "whistle": false
  },
  {
    "slug": "samara-joy",
    "name": "Samara Joy",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Jazz"
    ],
    "activeFrom": 2022,
    "lowMidi": 47,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "sammy-hagar",
    "name": "Sammy Hagar",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Rock"
    ],
    "activeFrom": 1973,
    "lowMidi": 38,
    "highMidi": 83,
    "beltMidi": 81,
    "whistle": false
  },
  {
    "slug": "sandi-patty",
    "name": "Sandi Patty",
    "voiceType": "Soprano",
    "genres": [
      "Gospel",
      "Classical"
    ],
    "activeFrom": 1982,
    "lowMidi": 53,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "sara-bareilles",
    "name": "Sara Bareilles",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Singer-Songwriter",
      "Musical Theatre"
    ],
    "activeFrom": 2007,
    "lowMidi": 47,
    "highMidi": 88,
    "beltMidi": 79,
    "whistle": false
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
    "activeFrom": 1981,
    "lowMidi": 55,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1993,
    "lowMidi": 53,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "sarah-vaughan",
    "name": "Sarah Vaughan",
    "voiceType": "Contralto",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "activeFrom": 1943,
    "lowMidi": 51,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "scott-hoying",
    "name": "Scott Hoying",
    "voiceType": "Baritone",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2011,
    "lowMidi": 41,
    "highMidi": 82,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "scott-stapp",
    "name": "Scott Stapp",
    "voiceType": "Baritone",
    "genres": [
      "Hard Rock",
      "Rock"
    ],
    "activeFrom": 1997,
    "lowMidi": 38,
    "highMidi": 74,
    "beltMidi": 72,
    "whistle": false
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
    "activeFrom": 1992,
    "lowMidi": 40,
    "highMidi": 73,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "seal",
    "name": "Seal",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Soul",
      "R&B"
    ],
    "activeFrom": 1990,
    "lowMidi": 39,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "sebastian-bach",
    "name": "Sebastian Bach",
    "voiceType": "Tenor",
    "genres": [
      "Hard Rock",
      "Metal"
    ],
    "activeFrom": 1989,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 72,
    "whistle": false
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
    "activeFrom": 1989,
    "lowMidi": 52,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "selena-gomez",
    "name": "Selena Gomez",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2009,
    "lowMidi": 48,
    "highMidi": 77,
    "beltMidi": 70,
    "whistle": false
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
    "activeFrom": 1998,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "shaggy",
    "name": "Shaggy",
    "voiceType": "Bass-baritone",
    "genres": [
      "Reggae",
      "Pop"
    ],
    "activeFrom": 1993,
    "lowMidi": 40,
    "highMidi": 65,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1995,
    "lowMidi": 52,
    "highMidi": 86,
    "beltMidi": 76,
    "whistle": false
  },
  {
    "slug": "shania-twain",
    "name": "Shania Twain",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country",
      "Pop"
    ],
    "activeFrom": 1995,
    "lowMidi": 52,
    "highMidi": 76,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "sharon-den-adel",
    "name": "Sharon den Adel",
    "voiceType": "Soprano",
    "genres": [
      "Metal",
      "Rock"
    ],
    "activeFrom": 1997,
    "lowMidi": 55,
    "highMidi": 86,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "shawn-mendes",
    "name": "Shawn Mendes",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Singer-Songwriter"
    ],
    "activeFrom": 2014,
    "lowMidi": 43,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false
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
    "activeFrom": 1995,
    "lowMidi": 53,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "sia",
    "name": "Sia",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "Electronic"
    ],
    "activeFrom": 2011,
    "lowMidi": 48,
    "highMidi": 84,
    "beltMidi": 80,
    "whistle": false
  },
  {
    "slug": "sierra-boggess",
    "name": "Sierra Boggess",
    "voiceType": "Soprano",
    "genres": [
      "Musical Theatre",
      "Classical"
    ],
    "activeFrom": 2008,
    "lowMidi": 55,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "simone-simons",
    "name": "Simone Simons",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Metal"
    ],
    "activeFrom": 2003,
    "lowMidi": 55,
    "highMidi": 85,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1987,
    "lowMidi": 53,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1960,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "sohyang",
    "name": "Sohyang",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Gospel"
    ],
    "activeFrom": 2011,
    "lowMidi": 52,
    "highMidi": 96,
    "beltMidi": 84,
    "whistle": true
  },
  {
    "slug": "solange",
    "name": "Solange",
    "voiceType": "Soprano",
    "genres": [
      "R&B",
      "Soul",
      "Pop"
    ],
    "activeFrom": 2008,
    "lowMidi": 48,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "sombr",
    "name": "Sombr",
    "voiceType": "Baritone",
    "genres": [
      "Alternative",
      "Indie",
      "Pop"
    ],
    "activeFrom": 2025,
    "lowMidi": 45,
    "highMidi": 66,
    "beltMidi": 64,
    "whistle": false
  },
  {
    "slug": "steve-lacy",
    "name": "Steve Lacy",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Indie",
      "Funk"
    ],
    "activeFrom": 2017,
    "lowMidi": 49,
    "highMidi": 76,
    "beltMidi": 68,
    "whistle": false
  },
  {
    "slug": "steve-perry",
    "name": "Steve Perry",
    "voiceType": "Tenor",
    "genres": [
      "Rock",
      "Pop"
    ],
    "activeFrom": 1977,
    "lowMidi": 43,
    "highMidi": 81,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 1973,
    "lowMidi": 41,
    "highMidi": 84,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 1975,
    "lowMidi": 52,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1963,
    "lowMidi": 36,
    "highMidi": 88,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 1978,
    "lowMidi": 39,
    "highMidi": 76,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "stromae",
    "name": "Stromae",
    "voiceType": "Baritone",
    "genres": [
      "Electronic",
      "Pop",
      "Hip-Hop"
    ],
    "activeFrom": 2010,
    "lowMidi": 43,
    "highMidi": 67,
    "beltMidi": 65,
    "whistle": false
  },
  {
    "slug": "sturgill-simpson",
    "name": "Sturgill Simpson",
    "voiceType": "Baritone",
    "genres": [
      "Country",
      "Rock"
    ],
    "activeFrom": 2014,
    "lowMidi": 39,
    "highMidi": 85,
    "beltMidi": 83,
    "whistle": false
  },
  {
    "slug": "summer-walker",
    "name": "Summer Walker",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B"
    ],
    "activeFrom": 2019,
    "lowMidi": 50,
    "highMidi": 76,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "sutton-foster",
    "name": "Sutton Foster",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Musical Theatre"
    ],
    "activeFrom": 2002,
    "lowMidi": 53,
    "highMidi": 81,
    "beltMidi": 77,
    "whistle": false
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
    "activeFrom": 2017,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 72,
    "whistle": false
  },
  {
    "slug": "t-pain",
    "name": "T-Pain",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Hip-Hop"
    ],
    "activeFrom": 2005,
    "lowMidi": 47,
    "highMidi": 77,
    "beltMidi": 70,
    "whistle": false
  },
  {
    "slug": "taeyang",
    "name": "Taeyang",
    "voiceType": "Tenor",
    "genres": [
      "K-Pop",
      "R&B"
    ],
    "activeFrom": 2006,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "taeyeon",
    "name": "Taeyeon",
    "voiceType": "Soprano",
    "genres": [
      "K-Pop",
      "Pop"
    ],
    "activeFrom": 2007,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "tamia",
    "name": "Tamia",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Soul"
    ],
    "activeFrom": 1995,
    "lowMidi": 51,
    "highMidi": 86,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "tammy-wynette",
    "name": "Tammy Wynette",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country"
    ],
    "activeFrom": 1966,
    "lowMidi": 55,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "tarja-turunen",
    "name": "Tarja Turunen",
    "voiceType": "Soprano",
    "genres": [
      "Metal",
      "Opera"
    ],
    "activeFrom": 1996,
    "lowMidi": 53,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "tasha-cobbs-leonard",
    "name": "Tasha Cobbs Leonard",
    "voiceType": "Contralto",
    "genres": [
      "Gospel"
    ],
    "activeFrom": 2013,
    "lowMidi": 50,
    "highMidi": 81,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "tate-mcrae",
    "name": "Tate McRae",
    "voiceType": "Soprano",
    "genres": [
      "Pop"
    ],
    "activeFrom": 2020,
    "lowMidi": 52,
    "highMidi": 77,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "tatiana-shmayluk",
    "name": "Tatiana Shmayluk",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Metal"
    ],
    "activeFrom": 2016,
    "lowMidi": 45,
    "highMidi": 79,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2006,
    "lowMidi": 45,
    "highMidi": 82,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "teddy-pendergrass",
    "name": "Teddy Pendergrass",
    "voiceType": "Baritone",
    "genres": [
      "Soul",
      "R&B"
    ],
    "activeFrom": 1972,
    "lowMidi": 40,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2020,
    "lowMidi": 40,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "tems",
    "name": "Tems",
    "voiceType": "Contralto",
    "genres": [
      "Afrobeats",
      "R&B"
    ],
    "activeFrom": 2018,
    "lowMidi": 50,
    "highMidi": 74,
    "beltMidi": 70,
    "whistle": false
  },
  {
    "slug": "teresa-teng",
    "name": "Teresa Teng",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Folk"
    ],
    "activeFrom": 1970,
    "lowMidi": 51,
    "highMidi": 83,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "thalia",
    "name": "Thalía",
    "voiceType": "Soprano",
    "genres": [
      "Latin",
      "Pop"
    ],
    "activeFrom": 1990,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 77,
    "whistle": false
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
    "activeFrom": 2011,
    "lowMidi": 43,
    "highMidi": 83,
    "beltMidi": 70,
    "whistle": false
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
    "activeFrom": 1992,
    "lowMidi": 41,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "till-lindemann",
    "name": "Till Lindemann",
    "voiceType": "Bass-baritone",
    "genres": [
      "Metal"
    ],
    "activeFrom": 1995,
    "lowMidi": 40,
    "highMidi": 65,
    "beltMidi": 62,
    "whistle": false
  },
  {
    "slug": "tim-mcgraw",
    "name": "Tim McGraw",
    "voiceType": "Baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 1994,
    "lowMidi": 41,
    "highMidi": 71,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1960,
    "lowMidi": 43,
    "highMidi": 75,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "tinashe",
    "name": "Tinashe",
    "voiceType": "Soprano",
    "genres": [
      "R&B",
      "Pop",
      "Electronic"
    ],
    "activeFrom": 2014,
    "lowMidi": 47,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "tobias-forge",
    "name": "Tobias Forge",
    "voiceType": "Baritone",
    "genres": [
      "Hard Rock",
      "Metal"
    ],
    "activeFrom": 2010,
    "lowMidi": 38,
    "highMidi": 80,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "tom-jones",
    "name": "Tom Jones",
    "voiceType": "Baritone",
    "genres": [
      "Pop",
      "Soul"
    ],
    "activeFrom": 1965,
    "lowMidi": 43,
    "highMidi": 70,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "tom-petty",
    "name": "Tom Petty",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Singer-Songwriter"
    ],
    "activeFrom": 1976,
    "lowMidi": 36,
    "highMidi": 82,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "tom-waits",
    "name": "Tom Waits",
    "voiceType": "Bass-baritone",
    "genres": [
      "Singer-Songwriter",
      "Blues",
      "Jazz"
    ],
    "activeFrom": 1973,
    "lowMidi": 33,
    "highMidi": 79,
    "beltMidi": 67,
    "whistle": false
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
    "activeFrom": 1992,
    "lowMidi": 46,
    "highMidi": 82,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "tony-bennett",
    "name": "Tony Bennett",
    "voiceType": "Baritone",
    "genres": [
      "Jazz",
      "Pop"
    ],
    "activeFrom": 1951,
    "lowMidi": 45,
    "highMidi": 69,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "toots-hibbert",
    "name": "Toots Hibbert",
    "voiceType": "Tenor",
    "genres": [
      "Reggae",
      "Soul"
    ],
    "activeFrom": 1962,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1992,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "tori-kelly",
    "name": "Tori Kelly",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "R&B",
      "Gospel"
    ],
    "activeFrom": 2013,
    "lowMidi": 47,
    "highMidi": 88,
    "beltMidi": 76,
    "whistle": true
  },
  {
    "slug": "trace-adkins",
    "name": "Trace Adkins",
    "voiceType": "Bass-baritone",
    "genres": [
      "Country"
    ],
    "activeFrom": 1996,
    "lowMidi": 38,
    "highMidi": 67,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1988,
    "lowMidi": 50,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "trey-songz",
    "name": "Trey Songz",
    "voiceType": "Tenor",
    "genres": [
      "R&B"
    ],
    "activeFrom": 2005,
    "lowMidi": 41,
    "highMidi": 79,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "trisha-yearwood",
    "name": "Trisha Yearwood",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Country"
    ],
    "activeFrom": 1991,
    "lowMidi": 50,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "troye-sivan",
    "name": "Troye Sivan",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Electronic"
    ],
    "activeFrom": 2014,
    "lowMidi": 48,
    "highMidi": 77,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "tyla",
    "name": "Tyla",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Afrobeats",
      "R&B",
      "Pop"
    ],
    "activeFrom": 2023,
    "lowMidi": 50,
    "highMidi": 74,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "tyler-childers",
    "name": "Tyler Childers",
    "voiceType": "Tenor",
    "genres": [
      "Country",
      "Folk"
    ],
    "activeFrom": 2017,
    "lowMidi": 40,
    "highMidi": 84,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "tyler-joseph",
    "name": "Tyler Joseph",
    "voiceType": "Tenor",
    "genres": [
      "Alternative",
      "Pop",
      "Hip-Hop"
    ],
    "activeFrom": 2013,
    "lowMidi": 45,
    "highMidi": 89,
    "beltMidi": 74,
    "whistle": false
  },
  {
    "slug": "tyler-the-creator",
    "name": "Tyler, the Creator",
    "voiceType": "Baritone",
    "genres": [
      "Hip-Hop",
      "R&B"
    ],
    "activeFrom": 2011,
    "lowMidi": 35,
    "highMidi": 83,
    "beltMidi": 81,
    "whistle": false
  },
  {
    "slug": "usher",
    "name": "Usher",
    "voiceType": "Tenor",
    "genres": [
      "R&B",
      "Pop"
    ],
    "activeFrom": 1994,
    "lowMidi": 46,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 2013,
    "lowMidi": 38,
    "highMidi": 74,
    "beltMidi": 69,
    "whistle": false
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
    "activeFrom": 1967,
    "lowMidi": 43,
    "highMidi": 74,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "vicente-fernandez",
    "name": "Vicente Fernández",
    "voiceType": "Tenor",
    "genres": [
      "Latin",
      "Folk"
    ],
    "activeFrom": 1966,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "victoria-monet",
    "name": "Victoria Monét",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "R&B",
      "Funk",
      "Pop"
    ],
    "activeFrom": 2020,
    "lowMidi": 47,
    "highMidi": 81,
    "beltMidi": 73,
    "whistle": false
  },
  {
    "slug": "ville-valo",
    "name": "Ville Valo",
    "voiceType": "Baritone",
    "genres": [
      "Rock",
      "Metal"
    ],
    "activeFrom": 1997,
    "lowMidi": 30,
    "highMidi": 83,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "vince-gill",
    "name": "Vince Gill",
    "voiceType": "Tenor",
    "genres": [
      "Country"
    ],
    "activeFrom": 1984,
    "lowMidi": 45,
    "highMidi": 72,
    "beltMidi": 69,
    "whistle": false
  },
  {
    "slug": "vitas",
    "name": "Vitas",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "Electronic",
      "Opera"
    ],
    "activeFrom": 2000,
    "lowMidi": 38,
    "highMidi": 87,
    "beltMidi": 70,
    "whistle": false
  },
  {
    "slug": "waylon-jennings",
    "name": "Waylon Jennings",
    "voiceType": "Bass-baritone",
    "genres": [
      "Country",
      "Rock"
    ],
    "activeFrom": 1965,
    "lowMidi": 40,
    "highMidi": 62,
    "beltMidi": null,
    "whistle": false
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
    "activeFrom": 1985,
    "lowMidi": 45,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false
  },
  {
    "slug": "willie-nelson",
    "name": "Willie Nelson",
    "voiceType": "Tenor",
    "genres": [
      "Country",
      "Folk"
    ],
    "activeFrom": 1962,
    "lowMidi": 43,
    "highMidi": 65,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "wilson-pickett",
    "name": "Wilson Pickett",
    "voiceType": "Tenor",
    "genres": [
      "Soul",
      "R&B",
      "Funk"
    ],
    "activeFrom": 1965,
    "lowMidi": 46,
    "highMidi": 88,
    "beltMidi": 86,
    "whistle": false
  },
  {
    "slug": "wizkid",
    "name": "Wizkid",
    "voiceType": "Tenor",
    "genres": [
      "Afrobeats",
      "R&B"
    ],
    "activeFrom": 2010,
    "lowMidi": 43,
    "highMidi": 72,
    "beltMidi": 67,
    "whistle": false
  },
  {
    "slug": "wynonna-judd",
    "name": "Wynonna Judd",
    "voiceType": "Contralto",
    "genres": [
      "Country",
      "Blues"
    ],
    "activeFrom": 1984,
    "lowMidi": 52,
    "highMidi": 76,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "xxxtentacion",
    "name": "XXXTentacion",
    "voiceType": "Baritone",
    "genres": [
      "Hip-Hop",
      "Alternative"
    ],
    "activeFrom": 2017,
    "lowMidi": 48,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false
  },
  {
    "slug": "yebba",
    "name": "Yebba",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Soul",
      "R&B"
    ],
    "activeFrom": 2017,
    "lowMidi": 50,
    "highMidi": 79,
    "beltMidi": 76,
    "whistle": false
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
    "activeFrom": 1950,
    "lowMidi": 47,
    "highMidi": 97,
    "beltMidi": 81,
    "whistle": true
  },
  {
    "slug": "yolanda-adams",
    "name": "Yolanda Adams",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Gospel",
      "R&B"
    ],
    "activeFrom": 1987,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": 77,
    "whistle": false
  },
  {
    "slug": "youssou-ndour",
    "name": "Youssou N'Dour",
    "voiceType": "Tenor",
    "genres": [
      "Afrobeats",
      "Folk"
    ],
    "activeFrom": 1979,
    "lowMidi": 45,
    "highMidi": 74,
    "beltMidi": 71,
    "whistle": false
  },
  {
    "slug": "zach-bryan",
    "name": "Zach Bryan",
    "voiceType": "Baritone",
    "genres": [
      "Country",
      "Folk"
    ],
    "activeFrom": 2022,
    "lowMidi": 43,
    "highMidi": 66,
    "beltMidi": 64,
    "whistle": false
  },
  {
    "slug": "zara-larsson",
    "name": "Zara Larsson",
    "voiceType": "Soprano",
    "genres": [
      "Pop",
      "Electronic"
    ],
    "activeFrom": 2013,
    "lowMidi": 50,
    "highMidi": 85,
    "beltMidi": 83,
    "whistle": false
  },
  {
    "slug": "zayn",
    "name": "Zayn",
    "voiceType": "Tenor",
    "genres": [
      "Pop",
      "R&B"
    ],
    "activeFrom": 2012,
    "lowMidi": 50,
    "highMidi": 83,
    "beltMidi": 68,
    "whistle": false
  }
];
