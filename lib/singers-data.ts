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
  /** Editorial paragraph on how the voice actually works. Null when unwritten. */
  technique: string | null;
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
    "blurb": "High tenor with a wide, warbling vibrato and gospel turns on nearly every held note.",
    "technique": "Vibrato is the signature: wide, quick, and present almost from the moment a note begins, giving the tone a warble that most singers spend years trying to remove. Onsets are gentle and slightly breathy, and nearly every held note gets decorated with a gospel turn or a small quaver upward. The range sits high and light. Imitating this by wobbling the pitch from the throat sounds unsteady; the oscillation has to stay even and come from the breath."
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
    "blurb": "Rock-leaning tenor with a compressed high mix; pushes volume instead of switching registers.",
    "technique": "Everything here runs on compression. The tone stays narrow and pressed, and volume rather than a register change does the work as the line climbs to the B4 belt and past it. There is no flip to falsetto; the top thins but holds its chest colour. Vibrato is fast, small, and mostly saved for the release. Attacks come straight on, with a light rasp on loud consonants. Loudness without that narrow setup becomes pushed air instead of raised intensity."
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
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Whataya Want from Me",
    "lowSource": null,
    "highSource": null,
    "blurb": "Theatrical tenor with a metallic mixed belt, fast vibrato, and rock rasp layered on top.",
    "technique": "Metal in the tone: a bright, ringing mix that holds its edge up to the C5 belt and can take rasp on top without losing pitch. Vibrato is fast and even, switched on deliberately at the end of a sustained note. Dragging chest weight upward for size is the common mistake, since the climb comes from narrowing the vowel instead. Sirens are a favorite move, one connected slide from low chest up through the mix with no audible gear change, dynamics swinging wide inside the phrase."
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
    "blurb": "Thin tenor built on falsetto and a nasal mix; adds compressed rasp rather than volume.",
    "technique": "Most of the sound lives above the A4 belt, in a thin nasal mix and a wiry falsetto that stretches to C6. Loudness is not the tool; compression and a thin edge of rasp are. Phrases begin breathy, the vibrato quick and narrow, and phrase ends often lift into falsetto mid-word. Pushing chest to chase the high notes is the wrong instinct here, since the placement needs to get narrower rather than bigger."
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
    "blurb": "Chesty mezzo with wide vibrato and audible glottal onsets; works a narrow, heavily supported belt band.",
    "technique": "Listen to the onset: many phrases begin with a small glottal click, then open into a broad, chesty tone with slow, wide vibrato. The belt band is narrow, right around E5, so impact comes from support and vowel depth rather than from climbing higher. Phrases lean slightly behind the beat and often finish with a downward bend. The common error is muscling volume in the throat to match that weight instead of letting the ribs and breath carry it."
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
    "blurb": "Gritty mezzo alternating growled low verses with a hard forward belt and abrupt clean high notes.",
    "technique": "Texture change is the structure. Low verses come out growled, with a rough distorted edge over the tone, then the belt lands hard around F5, forward and wide and unornamented, and above it the distortion drops away for an abrupt clean high note. Vibrato is minimal; straight tone is the default. Imitating the growl with real throat friction is unsustainable and takes the clean belt down with it."
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
    "blurb": "Thick gospel-schooled mezzo with a wide chest belt and audible grit at the top of the register.",
    "technique": "Weight is the whole game. The chest register is thick and gospel-shaped, onsets are firm and closer to glottal than breathy, and the belt keeps chest quality all the way to F5 with a wide vibrato that opens as the note holds. Grit shows up at peaks as an edge riding on a supported tone. Chasing the volume without breath pressure underneath turns that edge into throat scraping."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Let's Stay Together",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light tenor that keeps breaking into a soft, moaning falsetto over laid-back phrasing.",
    "technique": "Weight stays light on purpose. Instead of pressing at the top of the chest register, the voice flips into a soft moaning falsetto mid-word, then drops back down, so the break becomes an ornament rather than a problem to hide. Phrasing hangs behind the groove, with little sighs and hums filling the gaps. To imitate this, learn to release where you want to push; a student who belts the same lines loses the whole effect."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "We're in This Love Together",
    "lowSource": null,
    "highSource": null,
    "blurb": "Mouth-percussion textures under a light tenor that flips to falsetto without a seam.",
    "technique": "Percussion is part of the singing here rather than a separate layer: clicks, pops and breath sounds get placed inside the melodic line, so rhythm and tune come out of one mechanism. The tenor itself is light and forward, and the move into falsetto is deliberately seamless — no break, no drop in volume, which is how the compass reaches A5. Bends and slides are constant. The usual trap is copying the effects until the melody stops being legible."
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
    "blurb": "Mezzo with hard consonants, sudden yelps into head voice, and heavy pitch bending on long notes.",
    "technique": "Consonants land hard and early, words crowd ahead of the beat, and long notes get bent well off center before resolving. Sudden yelps jump into a bright head voice, sometimes an octave above where the phrase was sitting. Those bends work only because they start and finish on pitch; students slide vaguely and land nowhere, then copy the nasal edge by squeezing rather than placing it forward."
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
    "blurb": "Smoky mezzo with a slight nasal edge; belts from the chest and clips notes short for rhythm.",
    "technique": "Compression, not air. Notes begin with a firm glottal edge and a slightly nasal placement, and that is where the huskiness lives; breathing the tone out to sound smoky works against it. She clips syllables short and lets the rests carry the groove, landing a fraction behind the beat. The Eb5 belt keeps chest weight instead of thinning into a mix, with only a shimmer of narrow vibrato on the release."
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
    "blurb": "Straight-tone soprano, nearly breathless, exact intonation and very little ornament.",
    "technique": "Very little happens on purpose here, which is what makes it hard. Tone stays straight with only a trace of vibrato late in a long note, dynamics stay quiet, and pitch is placed dead center with no scoop in. Onsets are soft, almost breath-first. Ornament is nearly absent, so every vowel is exposed. Sing this with normal vibrato habits and you find out how much of your tuning the vibrato was hiding."
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
    "blurb": "Conversational mezzo close to speech range; slight rasp, little ornament, breath-driven phrasing.",
    "technique": "Speech is the reference point. Most lines sit between F3 and the C5 belt, close to talking pitch, with a light dryness in the tone and a trace of rasp underneath. Ornament is nearly absent, and phrases are shaped by where the breath falls rather than by riffs. The E5 top comes lightly. Over-singing flattens the whole effect, because the intimacy depends on staying at conversational volume."
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
    "country": "USA",
    "activeFrom": 2003,
    "lowMidi": 52,
    "highMidi": 88,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Bring Me to Life",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark rounded lower register joined to a classical-leaning head voice by a smooth mix.",
    "technique": "The registers are joined with no audible seam. A dark, rounded lower voice meets a classical-leaning head voice through a smooth mix, so climbing the range reads as one colour getting brighter rather than a gear change. Onsets are soft on quiet lines, and the vibrato is slow, even, and does not appear until well into a sustain. Pressing the larynx down to chase that darkness only makes the tone heavy instead of round."
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
    "blurb": "Contralto with jazz-era diction, heavy vibrato, and a cracked, smoky bottom register.",
    "technique": "Consonants come clipped and the vowels sit narrower than modern pop asks for. That, plus a low and slightly smoky placement near C3, is most of the character, and copying the accent without the breath support underneath it gets nowhere near the sound. Notes are slid into and slid out of. A wide, slow vibrato lands on nearly every sustain, and the timing lags the beat by a fraction all the way through."
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
    "blurb": "Light lyric tenor recorded close to the mic; softer, more crooned attack than stage projection.",
    "technique": "Recorded close, this is a light lyric sound with a crooner's attack: breath leaks in ahead of the tone, and the resonance sits forward and a little nasal. Vibrato is quick and shallow. Notes near the B4 ceiling are thinned and mixed rather than fully opened, so they read intimate instead of projected. Reach for operatic size by adding chest weight and the softness that defines the sound disappears."
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
    "blurb": "Brassy forward mezzo with heavy chest projection; percussive diction, long loud held notes.",
    "technique": "Forward placement and a brassy core carry this mezzo, with real chest projection and a percussive attack on every consonant. Held notes stay loud and steady, driven from the breath rather than squeezed in the throat, and the belt carries to about C5 before the tone lightens on its way to E5. Rhythm is exact, usually locked to the drums. Undersinging it does not work — that volume needs full support to stay in tune."
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
    "blurb": "Velvety contralto with jazz phrasing; sits low, scoops into notes, seldom pushes volume.",
    "technique": "Low and quiet, fully supported, with the microphone doing the amplifying instead of the singer. The tone stays dark and rounded at close to conversational volume. Notes get approached from underneath on a slow scoop, and the vibrato that follows is wide and unhurried. Higher up the sound lightens into an airy head tone rather than belting. Power is not the difficulty at all; holding that dark colour quietly is, without sliding into breathiness or settling under the pitch."
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
    "blurb": "Operatic power belt with a hard edge; holds high chest notes without letting them thin out.",
    "technique": "Chest weight rides up past the top of the staff, with a hard, precise onset and a bright ring that cuts over loud guitars. The vibrato is even and moderately fast, starting almost the instant the note does. Above the A5 belt the tone thins into a clean upper register instead of a shout. Copy the volume without building the breath support underneath it and the sound turns throaty by the second chorus."
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
    "blurb": "Started lyric and darkened toward dramatic roles; thick middle register under a bright, cutting top.",
    "technique": "A thick, meaty middle sits beneath a top that brightens and cuts, and the contrast between the two is the sound. Onsets are decisive, with a touch of glottal edge for attack, and vibrato is moderate and steady. The extension toward D6 comes from a lighter mechanism, not from middle-register weight. That is precisely what students get wrong, hauling the thickness upward until the passaggio jams."
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
    "blurb": "Dark chesty low notes under a hard-edged mid belt; tall vowels, vibrato held back until late.",
    "technique": "Two clear gears: a dark, fully chested bottom that stays resonant near G2, and a hard-edged mid belt topping out around Eb5 that gets its bite from tall, slightly covered vowels rather than from shouting. Vibrato is withheld — long notes sit straight and only open up in the final moment. Onsets are firm and precise, with no scooping, and phrases are cut off cleanly. Above the belt the tone thins into head voice. That edge is built in the vowel, never in the throat."
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
    "country": "UK",
    "activeFrom": 2000,
    "lowMidi": 45,
    "highMidi": 77,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Hope There's Someone",
    "lowSource": null,
    "highSource": null,
    "blurb": "Countertenor with slow, wide vibrato and hollow, flute-like sustain, mostly sung above the staff.",
    "technique": null
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
    "blurb": "Narrow baritone built for rhythmic talk-singing; thin falsetto used as color on choruses.",
    "technique": "Range is not the point. Most lines live inside a fifth, and the interest is rhythmic — talk-singing locked to sixteenth-note subdivisions with consonants used percussively, verses holding a flat pitch center on purpose. Choruses lift into a thin falsetto used as color rather than weight, with the full sound topping out around A4. Adding melodic ornament is exactly the wrong instinct; tighten the subdivision instead."
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
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Respect",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gospel-schooled mezzo: hard chest register, melismatic runs, sudden shifts from growl to soft head voice.",
    "technique": "Listen for the way weight shifts: chest tone driven hard up to a belt around G5, then a sudden drop into a soft, breathy head voice with almost no seam. Runs are gospel-shaped, pentatonic, aimed at a target note rather than sprinkled for decoration. Vibrato arrives late and narrow at the end of a sustain. Students copy the runs and miss the point, which is that the phrasing sits behind the beat and the consonants stay crisp."
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
    "blurb": "Light lyric soprano; moves from breathy mix into whistle register with almost no audible gear change.",
    "technique": "Placement sits high and forward, with a light, slightly nasal mix that never carries much chest weight. Notice that the belt is marked at E5 while the ceiling runs to E7, which tells you most of the upper range is head voice and whistle, not chest. Onsets are soft and aspirate, and the passaggio is hidden by staying quiet through it. Forcing air pressure into the whistle instead of releasing it shuts the tone off entirely."
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
    "blurb": "Light nasal tenor, breath-forward; slips into head voice at the top rather than pushing chest.",
    "technique": "Breath leads the tone: light, slightly nasal in placement, conversational even as the dynamic rises. The distance between the A4 belt and the C5 ceiling tells you how the instrument is wired, because above that belt he thins into head voice rather than driving chest, so the highest notes arrive quieter and softer-edged. Attacks are gentle, vibrato slight and late, ornaments kept small. Pushed for volume, the fourth-octave phrases lose the intimacy the phrasing is built on."
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
    "blurb": "Classically placed lyric soprano with fast vibrato; drops to plain speech-tone for storytelling.",
    "technique": "Classical placement shows in the vowels: tall, rounded, spinning on a fast narrow vibrato that stays consistent from the bottom of the staff to the top. The interesting move is what she sets against it, dropping mid-phrase into a plain, nearly spoken tone with the vibrato switched off, then letting it return. There is no belt in play; the upper range is supported head voice. The contrast is the point, and the spoken passages are what make the sung ones land."
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
    "blurb": "Bright youthful mezzo; unforced belt into the fifth octave, steady pitch, very little vibrato.",
    "technique": "Bright and forward from the first syllable, with a thin, focused tone and almost no vibrato, so long notes read as very straight and very young. Each note starts dead on pitch, never scooped up into. Across the top of the staff the belt stays in a bright mix rather than gaining chest weight, opening toward E5 with more space instead of more push. The pressure comes off at exactly the point where a louder singer would add it, and resonance does the carrying."
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
    "beltMidi": 64,
    "whistle": false,
    "signatureSong": "Little Drummer Boy",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bass who drops into fry and subharmonics for pedal tones well under the written staff.",
    "technique": "Below the staff is where the character is. Pedal tones near the bottom come from vocal fry and subharmonic reinforcement rather than ordinary phonation, which is why they read like an octave doubler under the chord. Higher up the tone turns soft and folk-leaning, with light breath and simple ornament toward the E4 belt. Pressing down to reach those low notes is the classic error; they need a loose setup and very little air."
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
    "blurb": "Nasal mezzo with flat, speech-like phrasing and a hard chest belt she rarely lifts to head voice.",
    "technique": "Flat and speech-like by design: phrasing tracks how a sentence would be spoken, vowels stay nasal and forward, vibrato is nearly absent. Notes get approached with a slur or scoop from below, then held dead straight. Chest weight dominates the climb and she rarely lifts into head voice, which keeps the sound blunt and young. Placement is forward rather than clamped, so the nasality is where the tone sits, not a squeezed throat."
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
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Sweet Child o' Mine",
    "lowSource": "There Was a Time",
    "highSource": null,
    "blurb": "Two voices in one: a low growl underneath, a thin cutting rasp on top, screams above that.",
    "technique": "Two mechanisms do the work. Underneath sits a heavy, distorted low voice trailing into fry at the bottom; above the D5 belt the tone thins into a narrow, nasal rasp that cuts rather than fills, and the screams past that are almost pure edge with no weight behind them. Phrasing drags behind the beat, then snaps forward. The common mistake is squeezing the throat to find the rasp — compression makes that noise, not force."
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
    "blurb": "Thin nasal mezzo with fast vibrato; drive comes from consonant attack more than chest volume.",
    "technique": "The push in a chorus comes from consonants, not from chest volume. The tone is thin and forward with clear nasal resonance, vibrato fast and tight, and every syllable takes a hard attack that shoves the line on to the next one. The D5 belt stays narrow and bright rather than opening out. Add weight to compete with the arrangement and both the speed of the vibrato and the rhythmic bite go with it."
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
    "blurb": "Low conversational baritone working a narrow band; rhythm and processing carry the melody.",
    "technique": "The pitch range is deliberately small, most of the delivery sitting between F2 and the E4 belt, close to speech, with melody implied more than sung out. Onsets are soft, vowels dark and slack, and there is no vibrato to speak of. Interest comes from placement instead: syllables land just off the grid, dragging or pushing against the dembow. Over-projecting and over-tuning it strips out the conversational flatness the style runs on."
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
    "blurb": "Warm tenor with soft-edged attack and quick runs; the mix thickens rather than thins as it climbs.",
    "technique": "Unusually, the tone gets rounder as it rises. Onsets are soft-edged, close to sighed, and runs stay quick and light with no grit. The mix around C5 keeps its warmth instead of narrowing to a point, and vibrato is moderate and steady. Ornaments are small and rhythmically tight. Treating those runs as fast scales is the common error; they are placed against the beat, and rushing them flattens the phrase."
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
    "blurb": "Long legato lines with exact vowel placement; climaxes come from breath control, not volume.",
    "technique": "Everything hangs on legato: notes connect with no gap, no scoop, and no restart of air, so a phrase can run long past where most singers would take a breath. The belt tops out around D5 and the range above it is sung as a lightened head tone, so climaxes come from lengthening and swelling a line rather than adding volume. Tall, exact vowels carry a slow and often delayed vibrato, while consonants land late, right on the beat — and that timing is what keeps a slow ballad from drifting."
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
    "blurb": "Natural voice sits low and reedy; the disco records ride an insistent, vibrato-heavy falsetto.",
    "technique": "Two voices are really in play. The natural one sits low and reedy with a conversational delivery; the other is a bright falsetto held high above the G4 belt and driven with an insistent, wide vibrato on nearly every note. Onsets in that falsetto are firm, not breathy, and the rhythm lands right on top of the beat. Stayin' Alive is the clearest example of the falsetto carrying an entire lead line."
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
    "blurb": "Deep bass built for spoken-sung delivery: narrow working range, enormous resonance.",
    "technique": "Delivery sits between speech and song, mostly inside a narrow band low in the bass range, with long sustained resonance and very little melodic movement. Pace is unhurried, consonants are relaxed, and the tone stays smooth rather than pressed. Since the range tops out around E4, everything rests on resonance instead of reach. Forcing the larynx down to fake the depth produces a muffled, breathy sound; real weight comes from an open, relaxed throat and slow air."
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
    "blurb": "Warm mid-weight tenor that slips into a soft-edged falsetto with no audible gear change.",
    "technique": "Onsets are soft and aspirate rather than hard and glottal, and the body of the tone sits mid-weight and warm. The distance between the A4 belt and the E5 top tells you what happens up there: instead of pushing chest, the tone thins and slides into a rounded falsetto, and the handoff is hard to hear. Vibrato is gentle and late. Work that connection quietly at first, because forcing it makes the seam obvious immediately."
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
    "blurb": "Tight cry-heavy high mix with audible glottal breaks used as expression rather than fault.",
    "technique": "The core sound is a narrow cry, thin and forward, and that is what carries the mix to D5 without full chest weight. Onsets frequently begin with a small glottal catch, and the voice is allowed to crack or break at the end of a phrase; those breaks are placed, not accidents. Consonants get clipped and the rhythm often runs slightly ahead of the beat. The usual mistake is faking the crack by cutting off the breath, which destabilises the whole line."
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
    "blurb": "Bright tenor that jumps octaves fast, favoring an open-throated high belt and clean falsetto.",
    "technique": "Wide leaps shape the lines: a low, quiet phrase, then a jump of an octave or more into an open, bright belt around D5. Those high notes stay vowel-forward, throat open rather than volume shoved, and the vowel has to be set before the leap; taken cold it comes out as a shout. Past the belt he flips cleanly to falsetto instead of hunting for more chest, with a quick vibrato that switches on late."
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
    "blurb": "Small breathy soprano with a fluttering vibrato; thins the top on purpose for a childlike color.",
    "technique": "Breath is left in the tone deliberately: you can hear air travelling alongside the pitch, and the vibrato flutters fast and shallow rather than swinging wide. Volume stays small, so the C5 belt reads as an emotional break instead of a display. Above it she thins into a narrow, childlike head tone rather than filling it out. Phrasing sits well behind the beat, with real silence inside a line. The trap is copying the breathiness without support, which lets pitch sag."
  },
  {
    "slug": "beyonce",
    "name": "Beyoncé",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Pop",
      "R&B"
    ],
    "country": "USA",
    "activeFrom": 1997,
    "lowMidi": 47,
    "highMidi": 87,
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Crazy in Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dense mezzo chest voice with rapid-fire runs; stacks a belted mix near Eb5 without thinning out.",
    "technique": "Weight is the first thing you hear: a thick, chest-dominant tone that stays chest-dominant as she climbs toward that G5 belt. Onsets are percussive and consonant-driven, and the vibrato is fast and narrow, arriving only at the end of a held note. Runs work as rhythm rather than decoration, so count them in sixteenths. Students copy the riffs and skip the breath support underneath, and the top turns shouty."
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
    "blurb": "Plain-spoken baritone, narrow range, conversational timing and almost no ornament.",
    "technique": "Everything sits close to speech. A narrow range topping out around A4, almost no vibrato, plain onsets, and timing that follows how a sentence would actually be spoken rather than where the bar line falls. Ornament is nearly absent, so word stress and pauses carry the meaning. This is the hardest style to fake, because a student's instinct is to add runs and swells, and each addition makes the delivery sound less honest."
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
    "blurb": "Close-mic whisper singing low in the chest register, with controlled fry and layered falsetto stacks.",
    "technique": "Everything is built at whisper volume and very close to the microphone: audible breath, light fry on low sustained notes, consonants quiet enough that you hear the mouth working. There is no belt in this voice, and height is reached instead with a thin, airy head tone, often doubled in stacks. Phrase ends slide downward by design. The trap is assuming quiet singing needs no support, which makes the fry squeezed and the pitch sag."
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
    "blurb": "Narrow compass, heavy inflection: bent pitches, behind-the-beat placement, thin reedy top.",
    "technique": "Two things carry this style, and neither is range: placement behind the beat and constant pitch inflection. Notes are approached from underneath, bent up into tune, then left before they settle. The top of a narrow F3 to C5 compass turns reedy and thin rather than opening out, and vibrato shows up late as a small flutter. Students copy the breathiness and the scoops, then sing them squarely on the beat, which loses the whole effect."
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
    "blurb": "Snarling nasal tenor with a put-on accent; a narrow band worked hard, almost entirely in chest.",
    "technique": "A narrow band worked hard — nearly all of it chest, from F2 up to around C5 — with a nasal snarl and a stylized vowel shift that bends words away from his speaking accent. Tone is straight, with almost no vibrato, and onsets clip tight to the guitar's eighth notes. Copying this means committing to the sneer; sung prettily, the notes survive and the entire character disappears."
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
    "blurb": "Nasal, reedy tenor with a whining edge; cuts through dense guitars by placement, not volume.",
    "technique": "Placement is high, forward and frankly nasal, with a reedy whine that cuts through loud guitars by frequency rather than volume. Tone stays straight, vibrato barely appears, and breaks in the line are left in rather than smoothed over. Rounding the sound to make it prettier removes the one quality that lets it be heard, and pushing air at the C5 belt turns that edge into strain."
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
    "blurb": "Nasal tenor with hard consonants; belts to the ceiling of chest, then flips to thin falsetto.",
    "technique": "Hard consonants and a nasal, forward placement give the lines their bite, and onsets are struck rather than eased into. Chest runs right to its ceiling around Bb4 and stays there, bright and tense, before flipping into a thin falsetto for anything above. Vibrato is quick and slightly uneven. Phrasing follows conversational stress, so accents rarely land where the meter would suggest."
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
    "blurb": "Bass-leaning baritone sung close to the mic, warm and level, with small ornamental turns.",
    "technique": "Sung as though the microphone were doing half the work: low placement, level dynamics, and no audible effort anywhere between F2 and F4. Small ornamental turns decorate the ends of phrases, and vibrato stays narrow and slow. White Christmas keeps the voice inside a comfortable middle where the bass-leaning warmth carries everything. To imitate it, take volume out rather than adding weight."
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
    "blurb": "Swings from whisper to full-throat shout in a bar; open vowels and glottal attacks drive phrasing.",
    "technique": "Dynamics move in jumps, not ramps: a near-whisper can become a wide-open shout inside a bar, which is exactly the device \"It's Oh So Quiet\" is built on. Attacks are frequently glottal, vowels stay open and unrounded, and consonants get rolled or trilled for rhythm. The upper range is bright and edgy rather than rounded, and there is a rasp available on demand at full volume. Vibrato appears irregularly, as an expressive choice. The shout has to be supported low; copying it from the throat gets tiring fast."
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
    "blurb": "Nasal, talk-sung phrasing; pitch bends and rhythmic pushback carry more than sustained tone.",
    "technique": "Hear how much of the sound is placement rather than tone: the resonance rides high and forward in the nose, vowels stay narrow, and there is almost no vibrato to lean on. Consonants do the work, and notes are approached from below or slid off at the end of a line. Words crowd ahead of the beat, then hang back. Students copy the nasal color and miss the real skill, which is the rhythmic pushback of the phrasing on something like Like a Rolling Stone."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "No Woman, No Cry",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light nasal-forward tenor; clipped offbeat phrasing, thin bright top, easy slides into head voice.",
    "technique": "Tone sits high in the nose and front of the mouth, light for a tenor reaching C5 — placement carries it, not pressure. Onsets are soft, often slightly breathy, and consonants get clipped so syllables land in the gaps left by the drum and bass. Vibrato stays narrow and arrives late. Above the staff he thins into head voice rather than belting. Students copy the vowels and miss the offbeat, which is where this voice actually lives."
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
    "beltMidi": 67,
    "whistle": false,
    "signatureSong": "Don't Worry, Be Happy",
    "lowSource": null,
    "highSource": null,
    "blurb": "Alternates chest bass and high falsetto mid-phrase, chest-slapping his own rhythm track.",
    "technique": "Alternating registers mid-phrase is the whole trick. Low chest notes are attacked with a glottal stop for a plucked, bass-like sound; above the G4 belt ceiling the voice releases into a light, well-supported falsetto that climbs a long way. Rhythm comes from body percussion and from breath sounds placed between the pitches. The demand is not range but instant switching — slur the transition and the illusion of two separate instruments collapses."
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
    "blurb": "Chesty tenor with a pleading attack that scoops into pitch, plus a light falsetto he flips to.",
    "technique": "Pleading is a technical choice here. Onsets scoop up from under the note, vowels stay wide and open, and vibrato shows up late in a phrase if at all. Chest carries to about B4; past that he either lets the tone thin and fray on purpose or flips into a light, airy falsetto rather than forcing. Rhythm is elastic and stretches across bar lines. Imitators over-scoop until nothing actually lands in tune."
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
    "blurb": "Warm tenor with a loose, breathy falsetto and scooped phrasing; light attack on consonants.",
    "technique": "Warmth comes from a relaxed jaw and aspirate onsets: notes are breathed into rather than struck, often scooped up from just below. Above D5 he lets go into a loose, unpressed falsetto with obvious air in it, and rhythm sits slightly behind the beat, close to conversation. The common error is hitting consonants hard, then squeezing the falsetto to match chest volume; it should get lighter, not louder."
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
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "The Boy Is Mine",
    "lowSource": null,
    "highSource": null,
    "blurb": "Husky mid-weight mezzo built for stacked harmony; fast, light runs kept low in the mix.",
    "technique": "Breathy mid-weight tone, and yet the runs come out fully articulated, every note separated instead of smeared into a slide. They are metered rather than free, which is why rushing them is where most attempts fall apart. The belt around E5 stays in mix and never opens into a shout, and riffs sit tucked underneath the lead line, dropped into the gaps between phrases so they read as arrangement rather than display."
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
    "blurb": "Theatrical tenor with a forward mix; belts high without thinning, then slips into clean falsetto.",
    "technique": "Theatrical placement: forward and bright, with clean vowels and crisply finished consonants. The mix is strong enough to hold a belt up to F5 without much thinning, and the falsetto above it is clear rather than breathy, so the changeover is easy to miss. Runs move fast and stay precisely articulated instead of smearing together, and the belt keeps its vowel shape at the top rather than spreading out into a shout."
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
    "blurb": "Sits almost entirely in a strained, distorted upper register; little clean tone, high notes are shrieks.",
    "technique": "Almost everything sits in a narrow band near the top of the range with a constant distorted edge, and the clean tone barely appears, so there is no soft setting for contrast. Rhythm is blunt and right on the beat, consonants clipped, phrases short. Vibrato is essentially absent. Distortion this dense has to come from loose tissue vibrating above a supported note; substitute raw pressure for that and you get one take out of it."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Back at One",
    "lowSource": null,
    "highSource": null,
    "blurb": "Trained tenor with clean legato and a falsetto he steps into without an audible seam.",
    "technique": "The control is in the details: exact pitch on entry with no scoop, smooth legato, and a step into the light upper register that leaves no audible seam. Runs are melodic and unhurried rather than crowded, and vibrato stays even and controlled at the end of long notes. Volume changes come from breath support, not squeeze. Sliding into every note from below undoes the clean, connected line that gives the style its polish."
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
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "The Number of the Beast",
    "lowSource": null,
    "highSource": "The Number of the Beast",
    "blurb": "Air-raid-siren tenor: forward placement, wide vibrato, holds high belts without thinning out.",
    "technique": "Listen for the brass in the tone: a narrow, forward placement that stays bright rather than dark, with vibrato that often arrives late and then widens. Chest connection holds all the way up to the G5 belt, and the C6 wails sit above that as a thinner, siren-like extension. Students imitating him squeeze the throat for volume. The sound comes from a supported cry and a tall, narrow vowel instead."
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
    "blurb": "Grainy baritone that works the low-middle and gets height by shouting through a raspy chest mix.",
    "technique": "Most of the singing happens in the low-middle, close to speech, with grain in the tone even at conversational volume. Height comes from shouting through a raspy chest mix rather than lightening, so C5 sounds like effort and is meant to. Onsets are breathy or half-spoken and vibrato is nearly absent. Phrases stretch long and push toward the top of a line. Take the rasp without the breath behind it and you get hoarseness, not intensity."
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
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Just the Way You Are",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright, forward tenor; snaps into a hard mix on choruses with clean falsetto stacked above.",
    "technique": "Everything is placed forward and narrow, a bright almost twangy ring that lets the E5 belt keep its chest flavour without shouting. Attacks land firm and often glottal, the vibrato underneath quick and slightly wide, phrase ends decorated with short retro-soul turns instead of long runs. Above the belt, falsetto comes in clean and stacked. The usual mistake is adding volume rather than twang, which closes the throat by the second chorus."
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
    "blurb": "Big, grainy bass-baritone with hard consonants; moves between Wagner, Mozart and stage musicals.",
    "technique": "Consonants do the rhythmic work here, percussive on the attack and bitten rather than smoothed, carried on a big and grainy instrument. The vibrato is broad and unhurried next to a lyric baritone's, and the low end toward F2 keeps its body instead of thinning out. Operatic legato and a more speech-driven delivery sit side by side depending on the material. The error is manufacturing the grain as throat rasp; it is resonance and consonant energy."
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
    "blurb": "Gravel-heavy bass-baritone; sandpaper texture, chanted rhythm, shouts the top rather than lifting.",
    "technique": "Sandpaper texture rides on top of a genuinely low, heavy instrument, and the rasp is constant rather than an effect switched on for emphasis. Delivery is chanted and rhythmic, closer to declamation than to melody, with pitches often approached from below and left without vibrato. Near A4 the sound is shouted, not lifted into a lighter register. The low anchor underneath is what keeps that grain from collapsing into plain strain."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Last Last",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm baritone with a smoky edge; drags behind the beat, then drops to soft airy falsetto.",
    "technique": "A baritone with smoke through the middle and a relaxed, unforced onset. Phrases sit behind the beat, syllables stretched lazily across the groove, and lines often finish by dropping into a soft, airy falsetto instead of climbing in chest. Vibrato is barely present. That rhythmic drag is the hard part to copy — sing right on the beat and the whole thing tightens up and loses its slouch."
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
    "blurb": "Light breathy tenor pitched close to speech; soft onsets, almost no vibrato.",
    "technique": "The delivery sits close to speech and barely rises above it, built from soft aspirate onsets, a light breathy tone and almost no vibrato, which leaves the pitch center fully exposed. Phrases stay short and conversational, often sitting behind the guitar rather than on top of it. Around G4 he keeps a gentle mix instead of opening out. Singing this quietly takes more breath control, not less, or the pitch sags."
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
    "blurb": "High cutting tenor with a rock edge; loud upper sustains carried on heavy vibrato.",
    "technique": "This is a tenor that lives at the top of the staff, bright and edged on the consonants, where the C5 belt is a working note rather than a stunt and E5 is within reach. Sustains come out loud, carried on a wide vibrato that starts fast and stays wide. Phrases climb instead of sitting still. Grabbing at the throat is the usual mistake, when the top needs a narrow vowel and steady breath."
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
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Before He Cheats",
    "lowSource": null,
    "highSource": null,
    "blurb": "Supported belt that hands off to a clean head voice; rasp on peaks without losing center.",
    "technique": "Mix carries a lot of chest weight up to about G5 and the transition is smoothed rather than broken, so you rarely hear the gear change. Past the belt the voice releases into a clean head register reaching toward C6 without thickening. Rasp gets added on peak notes as surface texture while the core pitch stays centered. The common error is yelling the belt on a wide vowel instead of narrowing it and keeping air moving."
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
    "blurb": "Light lyric soprano, very even across the break; sparse ornament and a narrow, steady vibrato.",
    "technique": "Listen for how little changes between F3 and the G5 belt: the same vowel shape, the same narrow vibrato, no seam where the register should shift. Ornament is sparse and placed, usually one small turn at the end of a line rather than a cascade. Anyone working on this should strip the runs out first, hold the tone identical through the transition, and let the top float instead of driving it."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Wives and Lovers",
    "lowSource": null,
    "highSource": null,
    "blurb": "Conservatory control over a wide compass; crisp diction, abrupt shifts to a thin girlish top.",
    "technique": "Trained control shows up in the choices, not just the notes: straight tone opens a phrase, vibrato is then added as an effect, and the vowel gets reshaped mid-note for colour. Diction is crisp to the point of theatrical. Above the staff the voice thins abruptly into a small, girlish register, and that sudden change of character is deliberate. Smoothing that transition out removes the point of it."
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
    "blurb": "Rapid-fire coloratura driven by audible diaphragm pulses; small, tightly focused mezzo core.",
    "technique": "Every note in a run is re-articulated by a small pulse from the body, and you can hear it: the coloratura sounds beaded rather than smeared. The core tone is compact and tightly focused instead of large, onsets are crisp, vibrato quick. Students go wrong in two directions, either slurring the runs into one smooth stream or producing the pulses with the throat rather than the breath."
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
    "blurb": "Brassy forward chest tone built to cut through horn sections; percussive improvised soneos.",
    "technique": "The tone is forward and chest-dominant, with hard consonants and almost no breath in it, sitting closer to a brass section than to a crooner. Improvised soneos come out percussive and speech-rhythmic, trading with the band rather than floating over it, and the belt around E5 stays bright instead of covered. Rhythm is the hard part. Those calls are placed precisely against the montuno, and singing them loosely turns declamation into noise."
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
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "My Heart Will Go On",
    "lowSource": null,
    "highSource": null,
    "blurb": "Narrow vowels and a nasal-forward mix let her hold long belted phrases at steady pressure.",
    "technique": "Verses often begin almost spoken and quiet, with soft aspirate onsets, then build in one long ramp toward a sustained belt near G5. The vowels narrow as pitch rises, which keeps the resonance nasal-forward and lets the note hold at even pressure rather than blowing out. Consonants are crisp and slightly over-articulated. A fast, narrow vibrato usually switches on partway through a long note instead of at its start. The architecture is the point: the ending only reads as a climax because the opening was held so far back."
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
    "blurb": "Smoky low contralto sung softly close to the mic; conversational, unhurried, vibrato minimal.",
    "technique": "Sung inches from the microphone at low volume, this contralto trades projection for detail — you hear the breath, the consonants, the smoke in the lower middle. Onsets are soft, the tempo unhurried, and phrases float a little behind the accompaniment. Vibrato is minimal and vowels stay dark and loose. Push it any louder and the intimacy that makes those low notes work is gone."
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
    "blurb": "Gritty low register into a bright, cutting upper mix; improvises like a horn player over the groove.",
    "technique": "Grit sits on the onset rather than running through the whole note: a short scratch at the front, then clean tone behind it. Up high the sound thins into a bright, forward mix that cuts through a dense band instead of adding weight to it. Phrases start off the downbeat and land in the drummer's gaps, often trading a written line for a rhythmic scat figure. Pushing volume for that brightness is the usual error; it comes from placement and a fast, narrow vibrato."
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
    "blurb": "Theatre-sized soprano belt with hard consonants, then a sudden thin head voice up top.",
    "technique": "Stage projection is the baseline. Consonants get hit hard, vowels stay bright and narrow, and the belt runs up to F5 with a steady ring rather than a shout. The characteristic move is a drop into thin, quiet head voice right after a big line, letting the contrast carry the feeling; belt the whole song and half the effect is gone. Long notes finish with a wide vibrato that only surfaces at the very end."
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
    "blurb": "Clean, pitch-exact tenor; frequent falsetto flips and tightly stacked self-harmony.",
    "technique": "Notes are hit dead centre with almost no scoop, and the tone stays clean with very little rasp, so intonation itself ends up being the signature. The A4 belt is modest, so the reach to C6 happens through an audible, deliberate flip into falsetto used as a hook in itself. Vibrato is light and even. Lines are often stacked in close self-harmony, so the melody alone can feel surprisingly thin."
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
    "blurb": "Forward, chest-heavy tenor; belted lines land with a slight cry instead of a shout.",
    "technique": "Forward and chest-dominant from the bottom up. There is no scoop into notes; he arrives on pitch with a firm onset and a narrow pharyngeal cry that makes the C5 belt sound urgent rather than loud. Vibrato is steady, medium in width, and held through the ends of phrases. Above the belt he thins instead of pushing. Answering that urgency with volume raises the larynx and the cry becomes strain."
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
    "blurb": "Thick low-set chest voice with wide vibrato; hard consonants, phrasing that sits behind the beat.",
    "technique": "Weight comes from a chest register set low and thick, with a dark, almost brassy edge that carries down toward F2 without going hollow. Vibrato is wide and slow — closer to a swell than a flutter — and it tends to open up on the last beat of a held word. Consonants hit hard, and phrases sit a hair behind the beat, which reads as weight. Above the D5 belt the tone releases into something lighter. Dropping the larynx to fake that depth just produces a hooty, unfocused sound."
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
    "blurb": "Clean tenor with a rasp layer and screamed extension; abrupt switch between sung and torn tone.",
    "technique": "Two tones operate here and they work as separate systems. Underneath is a bright, cleanly supported tenor with precise onsets and nearly straight tone up to that E5 belt; over it sits a distorted scream that reaches higher without the clean voice going with it. Manufacturing the rasp in the throat itself muddies both — the clean line has to stay intact underneath the distortion."
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
    "blurb": "Tenor split between a soft, breathy falsetto and a raw shout, often layered in one phrase.",
    "technique": "Contrast is the technique: a soft, airy head tone at low volume in one bar, a raw open shout in the next, sometimes stacked across the same phrase. The quiet side needs steady airflow and no pressing at all. Full voice stops around D5, and what sits higher is distorted rather than sung. Students switch the shout on first and never build the soft half that gives it meaning."
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
    "blurb": "Grit-heavy tenor that stays connected into a high sustained scream; wide vibrato on held notes.",
    "technique": "Grit sits on top of a fully connected chest tone rather than replacing it, so the rasp never costs him pitch. Onsets are firm, almost glottal, and vibrato arrives late and wide once a note has been held a while. Above the staff he keeps that F#5 belt in a narrowed vowel with a lot of twang instead of opening the throat. Reach for it as a shout and the squeeze takes the ring away."
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
    "blurb": "Gravel-heavy baritone with gospel-blues runs; carries high lines in full voice, not falsetto.",
    "technique": "Distortion sits on top of a well-supported baritone tone, so the grain never swallows the pitch. Phrasing comes out of gospel and blues: melisma around the flatted third and seventh, notes bent into from underneath, vibrato withheld until a sustain is nearly over. High lines toward B4 stay in full voice rather than flipping. Made with the throat itself, that rasp goes hoarse inside a set; it belongs on the airflow above a steady tone."
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
    "blurb": "Light, airy tenor with modest chest weight; writes in keys that park him in his upper mix.",
    "technique": "Airy and unforced, with modest chest weight and a slightly breathy edge on the low notes. Keys are chosen to park the voice in upper mix around B4, which is why the melodies feel high but rarely strained. Rhythm stays square, sung close to the beat so a room can follow it on first hearing. Adding power is the mistake; the thinness is exactly what makes these lines singable by a crowd."
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
    "blurb": "Heavy melisma over a thick, forward belt; adds whistle notes well above the staff when she wants them.",
    "technique": "She ornaments almost everything: long melismatic chains, turns and slides on nearly every held syllable, all sitting on a thick, forward belt that keeps chest weight up near G5. Vibrato is fast and wide, usually started immediately rather than saved for the end. Above the belt she flips to whistle, which is a separate mechanism and not an extension of chest. Ornaments added before the support exists go sharp, and the throat grips to hold them."
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
    "blurb": "Reedy tenor with pronounced vibrato and a plaintive edge on long sustained high phrases.",
    "technique": "Reediness comes from a narrow, slightly nasal resonance rather than a wide open throat, and it gives the upper range a thin pleading edge instead of a heroic ring. Vibrato is prominent and fairly wide, present from the instant the note starts. Long high phrases are sung quietly and held, thinning toward the end of the breath instead of being reinforced. Copying the vibrato without the reedy placement produces a wobble; that narrowness is what keeps it in focus."
  },
  {
    "slug": "corey-taylor",
    "name": "Corey Taylor",
    "voiceType": "Baritone",
    "genres": [
      "Metal",
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
    "blurb": "Grit-heavy mid baritone that flips to shredded screams and back to clean nasal-forward melody.",
    "technique": "Grit sits on top of a genuine mid-baritone core, and the two modes trade off inside a single line: shredded scream on the aggressive phrase, then a clean, nasal-forward melodic tone with almost no rasp on the hook. Onsets are hard and consonant-led. The clean half is harder to copy than it sounds, since going straight for the distortion drops the support underneath it and the result reads as strain rather than weight."
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
    "blurb": "High, thin tenor sung mostly in a floated falsetto with very little vibrato.",
    "technique": "Almost everything stays in the light register: thin, sweet, gentle breathy onsets, and a tone left nearly straight. Absence of vibrato is a choice, not a limitation; it keeps the vocal sitting calmly on top of busy rhythm sections. Lines stay high in the staff and stay quiet, relying on the microphone for size. Two habits ruin an imitation: adding chest weight to feel more powerful, and adding vibrato to feel more expressive."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Time After Time",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright edgy chest notes that flip abruptly into a thin, wide-vibrato upper register.",
    "technique": "The register change is the signature: bright, nasal-edged chest notes flip suddenly into a thin upper voice with a wide, loose vibrato, and the flip is left audible rather than smoothed over. It reads almost like a yodel on wide leaps. Lower singing is conversational and often gentle, as in \"Time After Time\"; the edge only appears when she pushes forward into the nose and mask. Students hear the flip as a crack and try to eliminate it, which removes the whole effect — practice it deliberately at low volume."
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
    "blurb": "Gospel-rooted belt with fast melisma and controlled rasp, releasing into clean head voice.",
    "technique": "Gospel-style ornament sits on top of theatre discipline: fast melisma with every note of the run separately articulated, bends into pitches from below, and a rasp added to the front of a word then removed within the same phrase. The belt drives to F5 on real chest weight, and rather than force past it she releases into a clean, unpressed head voice for the notes above. That release is the hard part; most singers either stay in the belt and push or lose the tone entirely in the switch."
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
    "blurb": "Slurred phrasing that drags behind the beat, with falsetto harmonies stacked in blocks.",
    "technique": "Consonants get softened and slurred so words blur into each other, and lines sit noticeably behind the beat while the band stays put, which creates the drag that defines the feel. Falsetto lines are stacked in dense harmony blocks, each one small and breathy. Pitches often bend into place rather than starting there. Singing this cleanly on the beat, with crisp diction, produces something technically correct and completely wrong stylistically."
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
    "blurb": "Baritone with a wide color palette: theatrical vibrato low, thin brightness up top, heavy diction.",
    "technique": "Color changes from song to song, but the mechanics repeat: a plummy, vibrato-heavy low register with theatrical vowel shaping, and a thinner brighter sound above the B4 belt that he lets stay light rather than reinforcing. Diction is deliberate, consonants placed, vowels chosen for character. Vibrato often arrives late in a held note and then widens. Imitators go straight for the accent and skip the vowel discipline that makes the character readable."
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
    "blurb": "Low-set relaxed baritone, slid entrances, phrases deliberately lagging the beat.",
    "technique": "Everything sits low and loose. Entrances are scooped from below, phrases lag behind the band and catch up by the end of the line, and the whole thing is delivered at conversational volume close to the microphone. Vibrato is slow and shallow. Rhythm is the hardest part to steal — match the tone but sing on top of the beat, and the ease disappears immediately."
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
    "blurb": "Cool deadpan delivery that flips to a thin bright top; light onsets, very little vibrato.",
    "technique": "The detachment is the performance: light onsets, almost no vibrato, short clipped vowels, and a delivery that sits exactly on the beat without pushing. When the line rises the tone thins into a bright, narrow upper register instead of belting, which keeps the deadpan intact. Over-emote, or add weight up top, and the flat unbothered quality that is the actual style disappears."
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
    "blurb": "Big-lunged belter with heavy vibrato; drives chest voice high, then unspools R&B runs coming down.",
    "technique": "There is no slow build. The belt lands wide and heavily vibrated, carrying real thickness all the way to A5, which is high for that much weight. Onsets are frequently glottal, and the biggest notes get hit straight on rather than approached from below. Runs mostly happen on the way back down, after the peak. Jamming the larynx upward to reach that top is the usual mistake, when the height should come from breath pressure and a narrowed vowel."
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
    "blurb": "Round warm tenor with a smooth chest-to-head handoff mid-phrase and quick falsetto flips.",
    "technique": "Two numbers explain this voice: a belt topping out near Bb4 and a range that keeps going to D5. Everything above the belt is head voice or a quick falsetto flip, and the handoff happens mid-phrase with no audible seam. Tone is round and warm, onsets gentle, vibrato even and moderate. Ornaments stay small — a turn, a scoop into a sustained note — and the highest notes arrive light rather than muscled up in chest."
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
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Kingdom",
    "lowSource": null,
    "highSource": "Kingdom",
    "blurb": "Stacked wall-of-voice belt plus harsh screams; swings from near-whisper to full-throated push.",
    "technique": "Near-whispered breathy phrases open out into a wall of stacked belted layers, and harsh screaming stays a separate texture rather than a colour applied to the belt. Layering does much of the work on record, so one voice trying to match that size pushes far too hard. Full weight tops out around C5, the C6 material is carried lighter and thinner above it, and vowels stay wide through the big sustains."
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
    "blurb": "Low, husky and unforced; lines sit close to speech pitch and rarely climb.",
    "technique": "Low and unhurried, with a dry huskiness that comes from slightly loose closure rather than from pushing. Lines sit near speech pitch and rarely climb, so tone colour and timing carry the interest. Onsets are soft, vibrato is minimal, and phrases land late and resolve quietly. Anyone imitating this tends to add volume; the style depends on holding it back."
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
    "blurb": "Thin-edged bright tone with breathy onsets; phrasing stays conversational across the groove.",
    "technique": "Thin cord closure gives a bright, narrow edge that cuts through a dense track without much volume behind it. Onsets are breathy, words are delivered conversationally on top of the groove, and the top of the range is reached as a light head tone rather than belted. What vibrato there is stays small, and it often disappears entirely. Ornament is sparse — a bend or a single turn, not a run. Restraint and forward placement are the whole appeal, and added soul weight or heavy melisma pulls against them."
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
    "blurb": "Smooth Verdi baritone with a metallic edge and long, unbroken legato on a single breath.",
    "technique": "Legato is the whole method: long lines joined without a seam, often stretched further than most singers would attempt, with the vowel shape barely shifting from note to note. There is a metallic edge inside an otherwise smooth tone, and the vibrato stays even at every dynamic. The climb to A4 is fully covered. Squeeze the throat chasing that metal and you lose it, because it comes from steady airflow and a consistent vowel."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Jolene",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright soprano, fast narrow vibrato, thin forward tone that cuts through banjo and fiddle.",
    "technique": "Placement is high and forward, close to the nose, which is what lets a light soprano cut through banjo and fiddle without volume. Vibrato is fast and narrow and starts almost as soon as a note does. Notes are often begun with a small breathy onset and decorated with quick grace-note flips. Climbing toward Bb5 the tone thins into head voice rather than thickening. Imitators add weight and lose the sparkle."
  },
  {
    "slug": "dolores-oriordan",
    "name": "Dolores O'Riordan",
    "voiceType": "Mezzo-soprano",
    "genres": [
      "Alternative",
      "Rock"
    ],
    "country": "Ireland",
    "activeFrom": 1990,
    "lowMidi": 52,
    "highMidi": 84,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Zombie",
    "lowSource": null,
    "highSource": null,
    "blurb": "Keening Irish lilt with a deliberate yodel across the register break; nasal-forward, direct.",
    "technique": "That flip across the register break is deliberate. Chest snaps up into a light, keening upper voice like a yodel, and it lands at the same point in the phrase every time. The tone is nasal-forward and direct, ornaments come as quick grace notes and turns, and sustains start straight before the vibrato widens in. Smooth that break away in the name of polish and the whole character goes with it."
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
    "blurb": "Reedy, high-placed tenor with quick access to falsetto and a narrow, fluttering vibrato.",
    "technique": "Reedy and high-placed, with a narrow fluttering vibrato sitting right on top of the tone. Falsetto is a step away at any moment, so lines slip in and out of it mid-phrase without ceremony. Long notes get thinner as they go rather than louder. Full voice tops out around the A4 belt, and the E5 belongs to a lighter mechanism. Copying this with a heavy chest sound loses the reediness completely."
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
    "blurb": "Church-rooted tenor with a hard-edged mid range and a wide, urgent vibrato.",
    "technique": "Most of the singing happens in a hard-edged middle register carried in chest weight up toward C5, with a wide urgent vibrato that widens further as a phrase intensifies. Onsets can be firm or scooped depending on emphasis, and phrases stretch and compress freely against a steady rhythm section. The ornaments are gospel-shaped rather than pop-shaped, landing on the vowel and resolving downward. Substituting loudness for that urgency just presses the tone flat."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Don't Start Now",
    "lowSource": null,
    "highSource": null,
    "blurb": "Husky low-mid with cool, flat phrasing; sits in a narrow band and rarely reaches for head voice.",
    "technique": "She uses less range than she has. Melodies live in a husky low-mid, and the G5 ceiling is barely tested, so the interest has to come from elsewhere. Tone is cool and level, close to straight, with only a light vibrato at phrase ends, and dynamics stay flat so the groove supplies the lift. Timing is the real technique: syllables land just behind the kick. Add emotive swells and you break the detachment the style runs on."
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
    "blurb": "Breathy, smoke-toned mezzo; heavy vibrato and chest-driven phrasing borrowed from soul records.",
    "technique": "Air moves through nearly every note, so the tone keeps a soft edge and consonants land late and gentle rather than struck. Vibrato is wide and slow, usually arriving on the tail of a long note instead of under it. Phrases sit slightly behind the beat, chest-weighted through the middle of the staff and thinning as they climb toward Eb5. Students copying the breathiness let support collapse with it; the airflow has to stay pressurized underneath or the pitch sags."
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
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Shape of You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Speech-level tenor, breathy tone; leans on rhythmic delivery and light head voice up top.",
    "technique": "Think of speech pitched onto notes. Every entry is eased in rather than struck, soft and aspirate, vowels stay conversational, and volume barely changes across a verse. Rhythm carries the interest, with syllables crammed tight and rapped against the guitar. Above the B4 belt he lightens into head voice rather than driving. There is barely any vibrato, and often none at all. Push the tone out and the intimacy that makes the phrasing legible goes with it."
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
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Alive",
    "lowSource": null,
    "highSource": null,
    "blurb": "Deep, rounded baritone with heavy vibrato and swallowed diction; sits low and pushes rather than lifts.",
    "technique": "Everything is dark and back-placed, with a low larynx and vowels that close in on themselves, so words blur while the tone stays round. Vibrato is wide and starts almost immediately. The ringing part of the voice lives under that B4 belt; notes above it come out thinner and yelped rather than fuller. Chasing the depth by pressing the tongue down flattens pitch and kills what diction is left."
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
    "blurb": "Bright forward mezzo with abrupt dynamic swings and hard consonant attacks.",
    "technique": "Dynamics move in sudden steps rather than gradual curves, so a phrase can travel from near-whisper to a bright forward belt inside a bar. Consonants are attacked hard, putting a percussive edge on the front of each word, and the belt up at G5 keeps chest color instead of softening. Timing pushes slightly ahead of the beat. Students even out the swings into a smooth line, and the theatrical contrast disappears."
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
    "blurb": "Flute-clear tone, exact intonation, scat lines phrased like a horn solo.",
    "technique": "Onsets are clean and pitch-centred, with almost no slide into the note and a vibrato so narrow it reads as straight tone. Above the staff the voice thins into a light, flute-like head register instead of adding weight, which is how the compass reaches C6 without strain. The scat choruses in How High the Moon move in horn-shaped intervals, and speed without that pitch centre turns the same lines into mush."
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
    "blurb": "Full-throated tenor early on; after 1987 throat surgery the top went and the tone thickened.",
    "technique": "Vowels get darkened and reshaped constantly, a broad rounded diction that turns ordinary syllables into something rhythmically odd but singable. Tone is full-throated and chesty up to the Bb4 belt, carried by a wide vibrato that starts early. Phrasing sits tight against the piano, pushing and pulling inside the bar. Higher than the belt the sound thins toward head voice near F5. Imitate the vowels alone and you miss that the vibrato is doing half the work."
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
    "blurb": "Baritone with a thick chest register, wide vibrato, and a gospel-trained bottom he drops into freely.",
    "technique": "Listen for a dark, thick baritone placed low and forward, carrying a wide, slow vibrato that arrives late in a held note. Onsets are aspirate and scooped — he slides up into pitch rather than landing on it. The bottom near G2 stays relaxed and unpressed rather than ground into a growl. Everything moves unhurried: phrases start under-sung and open out, so the loudest moment usually lands on the last line instead of the first."
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
    "blurb": "Silvery soprano with a fragile edge on sustained notes; built to sit above a lead vocal.",
    "technique": "Tone is silvery and slightly thin, with a fine tremor rather than a wide vibrato on sustained notes, and that thinness is what lets it sit above a lead vocal without fighting it. Onsets are gentle, pitch placed a touch high in the note. Ornament is sparse and vowels are matched carefully, the mark of a harmony singer. Reach for more volume and the tone thickens, and the fragile edge is the first thing lost."
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
    "blurb": "Dark, baritonal tenor timbre on acoustic discs; transposed music down rather than reach past Bb4.",
    "technique": "The color is dark for a tenor, close to a baritone through the middle of the staff, and the weight sits low rather than up in the mask. Attacks land firm and immediate, lines are joined with audible portamento, and the vibrato holds one moderate speed from start to finish. Up top the vowel is covered rather than opened out, and with Bb4 as the ceiling the interest is in how much happens underneath it. Press the larynx down to imitate that darkness and all you get is muffled tone."
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
    "blurb": "Thin, nasal jazz-inflected tone with bent pitches and phrasing dragged behind the beat.",
    "technique": "Pitch here is elastic on purpose. Notes bend up into place, slide off the end, and sometimes settle deliberately between the two nearest pitches, while the tone stays thin and nasal, sung close to the microphone with very little vibrato on it. Phrases drag behind the beat and catch up only at the cadence. None of that is the hard part. The control is, because bending without steady air underneath it just reads as flat."
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
    "blurb": "Unamplified chest belt with a trumpet-like edge, no audible register shift, pitch dead center.",
    "technique": "This is chest voice used like a brass instrument: bright, forward, and remarkably even in volume across the whole range to D5, with no register shift anywhere to hear. Pitch sits dead centre and the note arrives at full size immediately instead of growing into it. Vibrato stays narrow and steady rather than wide. Vowels are open and consonants crisp enough to carry a room without a microphone. That volume is resonance and breath balance at work, not throat force."
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
    "blurb": "Blues-weighted contralto: thick chest tone, growled note entries, wide and slow vibrato.",
    "technique": "The growl lands on the attack and then resolves into thick, steady chest tone a beat later. Growl the whole way through and the effect disappears, because it only reads against clean tone underneath it. Vibrato is slow and wide and arrives late, once the note has been held straight for a while, and the melody moves by blues bends far more than by runs. Notes swell into their full size instead of starting there."
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
    "blurb": "Rough mid-weight baritone built for call-and-response chant; talks pitch, shouts line endings.",
    "technique": "Chant, not melody, organizes this baritone. Pitch is often spoken or half-sung, parked in a rough mid-weight middle, with line endings shouted for emphasis and left open for a group answer. Rhythm rules everything: syllables lock to the groove and repeat, and long sustains are rare. Vibrato is essentially absent. Smoothing the delivery into legato melody works against it, because the whole approach is percussive and conversational."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Criminal",
    "lowSource": null,
    "highSource": null,
    "blurb": "Contralto anchored in a husky low register; conversational timing with sudden gravel on peaks.",
    "technique": "Speech shapes the phrasing — timing stretches and compresses against the beat, and diction stays crisp even at the husky bottom of the range. Weight is chest-heavy with a low, settled larynx, and gravel shows up only at the peaks of a line, then clears. Smoothing it into legato is the error; the lines are meant to arrive unevenly, with abrupt dynamic surges instead of a steady swell."
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
    "country": "Netherlands",
    "activeFrom": 2000,
    "lowMidi": 52,
    "highMidi": 88,
    "beltMidi": 81,
    "whistle": false,
    "signatureSong": "Élan",
    "lowSource": null,
    "highSource": null,
    "blurb": "Trades operatic head voice for full metal belt mid-phrase with no audible gear change.",
    "technique": "Watch for the gear changes, because you will not hear them. Operatic head voice and a full belt up around A5 trade places inside a single phrase, and the extension above stays free rather than pressed. Vibrato is under conscious control and can be switched off for straight-toned lines. That belt without the support and breath management holding up the classical side collapses into a shout."
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
    "blurb": "Open-throated mezzo belt with a wide vibrato, usually stacked into choral upper harmonies.",
    "technique": "Belted notes are produced with an open throat and a wide, slow vibrato, and the stated belt around E5 marks where chest-based power stops. Above it the tone lightens into head voice, which is why the highest pitches read as choral rather than driven. Vowels stay open and vertical, powered by generous breath. Much of the thickness on record is stacked harmony rather than one line, and the belt itself rides on open resonance more than on sheer volume."
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
    "blurb": "Conversational baritone, long legato lines, breath control that carries a phrase past the bar.",
    "technique": "Listen for how little happens at the onset: air and tone start together, no scoop, and the vowel carries almost the whole note before a narrow vibrato arrives at the very end. Lines are built to run past the obvious breath point, so the phrase, not the bar, sets the shape. The top of the range opens out rather than getting louder — an A4 is sung, never belted. The swagger is the easy part to copy; the consonant timing underneath it is the actual work."
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
    "blurb": "Plain mid-range traded for a hard, ringing falsetto that carries the whole lead line.",
    "technique": "Something unusual happens at the register break. The plain, unremarkable chest voice tops out around F4, and the lead line simply moves into a hard, ringing falsetto that carries the rest of the way up. That falsetto is edgy and pressed rather than airy, with a fast tight vibrato, and it cuts straight through the arrangement. Students try to belt those notes in chest and either strain or lose the timbre entirely."
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
    "blurb": "Deep bass-baritone with thick low resonance; half-speaks phrases over funk and quartet grooves.",
    "technique": "Bottom-heavy and unhurried. The E2 region gives a thick chest resonance that stays un-pushed, with lines half-spoken over the groove and the voice only opening toward the G4 belt for a payoff. Attack is relaxed and often just behind the beat, with quartet-style bends on the ends of words. Imitators reach for volume, but the character comes from resonance and rhythmic patience instead of force."
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
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Bohemian Rhapsody",
    "lowSource": null,
    "highSource": "Get Down, Make Love",
    "blurb": "Baritone core sung as a tenor: fast vibrato, hard consonants, and a sudden switch into piercing falsetto.",
    "technique": "Listen for a speaking weight heavier than the tessitura suggests: a baritone body carried up to an F5 belt. The vibrato is quick and narrow and starts almost at the onset. Consonants land like percussion, and phrases end cleanly rather than trailing off. Above the belt he drops the weight and flips outright into falsetto. Shake the jaw to fake that vibrato and it reads as a wobble; the real thing runs on steady breath, not motion."
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
    "blurb": "Sturdy baritone that takes its grit from breath pressure; stage-shout delivery up high.",
    "technique": "Grit here comes from breath pressure against a fairly open throat, not from scraping. Onsets are aspirate, a little air ahead of the tone, and vibrato is wide and shows up at the ends of long notes. Approaching A4 the delivery turns into a stage shout, chest-weighted and open-vowelled. Copy the volume without the air behind it and you get a squeezed, hoarse sound that will not survive a set."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Tom Sawyer",
    "lowSource": null,
    "highSource": null,
    "blurb": "Piercing, narrow-toned high tenor; early records sit near the top of his range with a nasal edge.",
    "technique": "Compact and edged rather than large, this is a tone built to slice through a loud band instead of filling a room. Much of the material sits so high that the bottom of the range barely gets used. Vibrato is fast and shallow where it appears; mostly the sound runs straight. Rhythmic placement is exact, syllables locked tight to the rhythm section. Reaching for that height with more pressure is the usual error; it comes from forward placement instead."
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
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Silent Lucidity",
    "lowSource": null,
    "highSource": "Queen of the Reich",
    "blurb": "Trained-sounding tenor: even legato, ringing sustain, more classical vowel shaping than most.",
    "technique": "Rounded, classically placed vowels sit closer to art song than to shouting, carried on even legato with a long ringing sustain. Full weight stops at the B4 belt; above it the tone thins deliberately into head voice, which is what keeps the fifth- and sixth-octave notes controlled instead of strained. Vibrato is measured and often delayed. Where imitators add pressure, he adds space."
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
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Careless Whisper",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm baritone with a smoky bottom; slides into a controlled, airy falsetto on hooks.",
    "technique": "Down at the bottom the tone is thick and smoky, with breath mixed into the onset so lines begin soft-edged instead of struck. Chest carries comfortably to about that C5 belt; everything higher is a deliberate lift into airy falsetto, which is where the A5 lives. Vibrato is slow and enters late, often only on the last beat of a phrase. Imitators drag chest weight above C5 and lose the smoke."
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
    "blurb": "Unhurried baritone, almost no vibrato, phrasing shaped for two-step and Western swing.",
    "technique": "Restraint is the technique. The tone is even and unbrightened, vibrato nearly absent, onsets clean with no scoop into pitch. Phrasing sits inside the shuffle or swing feel and rarely displaces a note for effect. Melody gets sung close to as written, ornament limited to a small turn at a cadence. Singers imitating this add runs and vibrato to fill the space, which is exactly what the style takes out."
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
    "blurb": "Warm, slightly husky mezzo that stays in chest voice and leans on phrasing over altitude.",
    "technique": "Nothing here is about altitude. The whole story happens between E3 and D5, in chest voice, at close to speaking weight. Notes are entered gently and often a shade behind where the band puts them, then pulled back into time by the end of the line. Huskiness lives in the tone rather than in force. Singers hear soul and start adding runs, when the effect actually comes from restraint and from finishing every consonant."
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
    "blurb": "Rounded mezzo with even vibrato; ballad lines stay inside a comfortable mid-belt.",
    "technique": "Warm vowels and gentle onsets keep the tone round, and a mid-rate vibrato holds the same width whether a phrase is loud or soft. Ballads live in a comfortable middle and step up to the F5 belt without changing color, so nothing sounds strained. Uptempo material trades sustain for crisp rhythmic accents. There is no grit to reach for here, because the appeal is a smooth, unhurried line."
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
    "blurb": "Flat-toned contralto pitched near speech; hard consonants, dry chest resonance, vibrato withheld.",
    "technique": "This contralto sits near speaking pitch and stays there, flat and dry and deliberately unwarmed. Chest resonance is present but never blooms, vibrato is withheld almost entirely, and consonants are struck hard so lines come out clipped and mechanical. Long notes hold straight through with no swell. Anyone imitating it tends to add expression — a vibrato, a crescendo, a lift toward Bb4 — and the coolness that carries the sound evaporates."
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
    "blurb": "Flat declamatory chest tone with little vibrato; builds by adding volume, not by climbing.",
    "technique": "Notes get stated, not sung around. The tone stays flat and straight, vibrato is minimal, and intensity builds by adding volume and hardening the vowel while the pitch stays put. Onsets are firm and unornamented, and lines land squarely on the beat with an almost spoken conviction. A student's instinct is to add vibrato and slides, which immediately softens the menace this approach depends on."
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
    "blurb": "Thick baritone with a gospel-shout attack on top and a resonant, grounded bottom octave.",
    "technique": "Thick, round and low-placed, with a bottom octave that resonates rather than rumbles. The top of the range takes a gospel-shout attack: firm onset, forward vowel, an occasional growl laid over a clear pitch. Melisma is used sparingly and almost always on a strong beat. Liquid Spirit puts the shout and the grounded bottom in the same take. Build the low end first — that shout over a thin bottom just sounds strained."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Don't Speak",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright cartoon-clear tone with wide vibrato, parked in a punchy mid belt and rarely soft.",
    "technique": "Everything is aimed forward and bright. She scoops up into notes, holds a punchy mid-range with a wide and fairly slow vibrato, and rarely drops to anything soft; consonants get clipped short in the punk-derived phrasing. The top of the range comes in lighter rather than heavier. Pushing volume to match the attitude misses the point, because the cut is coming from placement."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Your Cheatin' Heart",
    "lowSource": null,
    "highSource": "Lovesick Blues",
    "blurb": "Thin keening tenor that flips into yodel breaks; hard nasal placement, cries on the vowel.",
    "technique": "Nasal placement is extreme and deliberate, and that is what gives the thin, keening carry over a band. Vowels get a cry on them, an audible pinch that reads as ache, and the register break is thrown wide open into a yodel flip, clearest in Lovesick Blues. Timing pushes slightly ahead of the beat. The break tends to get dodged entirely, or the flip gets attempted on a closed vowel, which will not release."
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
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Sign of the Times",
    "lowSource": null,
    "highSource": null,
    "blurb": "Raspy baritone with a grainy upper mix; keeps the edge in the belt instead of smoothing it.",
    "technique": "A dry, grainy rasp sits on top of a baritone core and stays there through the C5 belt instead of being polished off, so the grit reads as the point rather than a by-product. Notes come in breathy before they engage, phrasing is unhurried and a touch behind the beat, and the vibrato stays loose and irregular. The F5 top arrives thin and strained by design. Faking that rasp with throat squeeze instead of airflow never survives a full set."
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
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Misery Business",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright forward mix that stays punchy at speed; climbs into a belt instead of a shout.",
    "technique": "Speed is the hard part. The tone is bright and placed well forward, consonants are clipped, and phrases push slightly ahead of the beat while staying in tune at tempos where most singers flatten. She climbs into a belt around G5 and lightens above it rather than shouting. Vibrato is sparse and sustains mostly straight. Most people shout from the chest instead and are out of air by the second verse."
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
    "blurb": "Low-set husky mezzo, conversational phrasing, R&B melisma kept small and slightly behind the beat.",
    "technique": "This voice sits low and slightly husky, nearer to speaking than singing, breath audible in the tone and onsets beginning softly. Phrasing lags a fraction behind the beat, and melisma stays small, two or three notes, understated. The D5 belt keeps that conversational weight instead of opening out. Copying the laid-back timing usually just becomes late; the pulse has to stay exact underneath the relaxation."
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
    "blurb": "Gritty baritone that stacks a gospel-inflected rasp under a clean, sustained falsetto.",
    "technique": "Two voices are in play. Down low the baritone runs gritty, with gospel-flavored rasp and blues bends applied to short melodic figures, sometimes growling into the bottom of a phrase. From the stated belt around B4 upward the sound thins toward a lighter, cleaner register instead of driving chest weight any higher. The contrast between those two colors, rather than the size of either one, is what carries a chorus."
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
    "blurb": "Baritone with a bright forward belt; speech-driven phrasing, short sustains, restrained vibrato.",
    "technique": "Delivery is built on speech. The rhythm of the line follows the rhythm of the sentence, so notes are released as soon as the word is finished instead of being held for their own sake. Tone is baritone-thick but placed forward and bright, and the top of the range near B4 is taken with a firm forward mix rather than an open ring. Vibrato barely appears. Imitators over-sing the sustains and lose the conversational drive the phrasing depends on."
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
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Smoke on the Water",
    "lowSource": null,
    "highSource": "Child in Time",
    "blurb": "High tenor that trades melody for siren-like screams; belts stay bright and forward with little weight.",
    "technique": "Brightness is the whole engine: narrow vowels, high placement, very little weight carried upward, which is how the belt reaches G5 and the screams above it stay pitched instead of collapsing. Held notes pick up a fast shimmer of vibrato late. Sirens slide across an octave with no audible seam. Copy this by adding chest weight and you will jam around D5; the trick is subtracting mass, not adding force."
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
    "beltMidi": 77,
    "whistle": false,
    "signatureSong": "Let It Go",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal-forward mix and a hard-edged chest belt that stays loud without thinning near the top.",
    "technique": "Listen for a narrow, bright tone placed high in the nose and pressed against the front teeth; that forward buzz is what keeps the belt loud up to F5 instead of thinning. Quiet lines start breathy and nearly spoken, then the belt arrives with a firm push and no gradual ramp. Vibrato is slow and shows up late, often only as the note releases. Nothing in the sound is round or covered; the whole effect depends on keeping it narrow and in front."
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
    "blurb": "Small bell-clear soprano tone, exact pitch placement, and a light mix she keeps deliberately unforced.",
    "technique": "Almost nothing decorative gets added. Onsets land without scoop, the tone is small, bright and bell-like with very little air in it, and vibrato appears as a flicker at the end of a sustain, if at all. Above the E5 belt she thins into head voice rather than pushing. The climbing high run that closes Good Day stays connected the whole way up. Breathiness and a wider vibrato would cost the precision that defines the sound."
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
    "beltMidi": 65,
    "whistle": false,
    "signatureSong": "Kalinka",
    "lowSource": null,
    "highSource": null,
    "blurb": "Billed at four octaves: deep Russian bass below, thin falsetto soprano well above the staff.",
    "technique": "Two separate mechanisms, stacked, with the seam left plainly audible: a heavy pressed bass down toward F1, full voice topping out around F4, and a thin, unsupported falsetto well above the staff. The vibrato differs between them, slow below and fluttery above. Blending the two into one continuous register erases the whole effect. The switch is the point, not a seam to be smoothed away."
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
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Moon River",
    "lowSource": null,
    "highSource": null,
    "blurb": "Wide range used compositionally: low chest notes, stacked falsetto, and deliberate microtonal slides.",
    "technique": "Range is used as an arrangement tool rather than a display. Low chest notes are sung quietly and precisely, the upper register is stacked in falsetto for harmony, and slides between pitches are deliberate and often land between the usual twelve, so intonation has to be exact. Phrasing borrows jazz timing, hanging behind and then catching up. Trying to reproduce the extremes first is backwards; the tuning and the smoothness of each transition are what make it work."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Retrograde",
    "lowSource": null,
    "highSource": null,
    "blurb": "Falsetto-first and close-miked, breathy at low volume, then thickened with pitch-shifted layers.",
    "technique": "Volume stays low and the microphone stays close, so a breathy falsetto with very little vibrato becomes the default sound. Sustains are straight, almost unmoving, and consonants soften into the vowel rather than cutting it. The register shift is handled by never really committing to chest weight at all. Thickness on record comes from doubled and pitch-shifted layers rather than a bigger voice, so the unprocessed line stays quiet even as the arrangement grows around it."
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
    "blurb": "Shouted baritone used as percussion; screams and grunts placed on the beat.",
    "technique": "Placement carries more of the load than melody. Most of the singing happens inside a narrow band of the baritone range, shouted with a hard glottal attack, and the grunts, yelps and short rasped bursts are struck like drum hits on specific beats. Sustained notes are rare; energy comes from repetition and rhythmic accent. Copy the screams without the timing and the whole thing collapses, and what should stay short and punchy gets oversung."
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
    "blurb": "Rhythmic consonant-driven baritone, raspy edge, phrasing clipped tight to the riff.",
    "technique": "Rhythm is the instrument here. Consonants land on the riff like a picking hand, syllables get clipped short, and the tone is a mid-baritone with a dry rasp rather than a smooth sustain. Notes are often approached from underneath with a quick bend and then cut off. Copying it fails when singers stretch the vowels: the moment the phrasing loosens off the guitar figure, the whole effect disappears."
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
    "blurb": "Warm, breath-controlled baritone with soft attacks and vibrato held back until a phrase ends.",
    "technique": "Notice how little the voice moves and how much the breath does. Onsets are soft, almost released rather than started, the tone stays warm with the resonance low and round, and vibrato is withheld until the last beat of a phrase, then added narrowly. Consonants close gently. Lines sit just behind the guitar. The dynamic stays small and steady from the first line to the last, with the microphone supplying volume the voice never reaches for."
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
    "blurb": "Rasp-forward blues phrasing, heavy distortion and grit, pushed high in raw chest voice.",
    "technique": "Grit is the instrument. Rasp sits on top of the vowel, notes get scooped into from underneath, and phrase ends fray out into a cry. Blues bends and repeated shouted syllables do the ornamenting rather than clean melisma. Full weight stops around F5; higher notes arrive as raw, unpolished pushes. The usual mistake is grinding the throat to fake the rasp instead of keeping the vowel open and letting airflow rough up the tone."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "I'm Yours",
    "lowSource": null,
    "highSource": null,
    "blurb": "Loose, jazz-leaning tenor; scat phrasing and quick trades between mix and light falsetto.",
    "technique": "Syllables tumble out in loose, jazz-inflected bursts, scatted between sung lines and rarely landing squarely on the beat, and that phrasing carries far more of the personality than the timbre does. The tone itself is light and slightly nasal, entries soft, and the climb upward is handled by trading into a small falsetto instead of belting, which is why the top of the range sits well above any comfortable chest note. What vibrato there is comes fast and sparingly."
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
    "blurb": "Flips between growled chest notes and airy, agile upper runs; rasp used as an effect, not a default.",
    "technique": "A growled, gritty chest note gets answered a beat later by an airy, fast run well above it, sometimes inside a single phrase. Rasp switches on for one word and off again, which tells you it is being produced deliberately rather than simply lived in. Belts around G#5 stay connected before releasing into breath. Leave the rasp on continuously and it stops registering altogether, since the contrast against clean tone is the entire effect."
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
    "blurb": "Very wide tenor with seamless falsetto shifts, long melisma, and near-whispered dynamic drops.",
    "technique": "Listen for how little seam there is between mix and falsetto: the shift happens inside a vowel rather than between notes, which is what lets long melismatic runs stay even. Dynamics drop to almost nothing and rebuild, audible throughout his reading of Hallelujah, and vibrato arrives late and narrow. Height comes from releasing pressure, not adding it — students push for the top and the ornaments stiffen into steps."
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
    "blurb": "Heavy chest weight carried into the fifth octave; belts stay full instead of thinning to falsetto.",
    "technique": "Chest weight is carried unusually high, so a belt near A5 keeps the thickness it had an octave lower instead of thinning into mix. Vowels open wide at the top, and the note is held straight before a slow vibrato is allowed in at the end. Attacks land firm and on pitch with little scooping. Attempting this without the breath pressure behind it is how singers strain, since the size comes from support and space rather than from squeezing."
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
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "Santa Fe",
    "lowSource": null,
    "highSource": null,
    "blurb": "High tenor belt with a metallic ring; adds grit up top and flips to falsetto past the break.",
    "technique": "Ring is the giveaway: a hard metallic edge from close fold contact and a narrow resonance space, which pushes the belt to C5 and keeps it cutting through a band. Above that he adds grit on the attack, then flips openly into falsetto instead of dragging chest higher, so you hear the seam and are meant to. Rhythm is aggressive and consonants land early. The grit rides on breath pressure rather than throat squeeze, which is why the metallic edge survives it."
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
    "blurb": "Loud, pitch-precise belter with R&B melisma; keeps tone compressed and bright at the top of chest.",
    "technique": "Precision survives the volume here. Fast melismatic runs land dead center on pitch, and the belt stays compressed and bright right up to A5 rather than spreading wide. Onsets are clean and immediate with little scoop, and vibrato is fast, used mainly as an ending gesture. Dynamics move in steps, not swells. The imitation problem is spread: opening the vowel to get louder costs focus and pitch at the top."
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
    "blurb": "Broad, dark-hued dramatic soprano with contralto-like lows and unusually even breath control.",
    "technique": "A broad, dark instrument with lows that read nearly contralto, and an unhurried approach to every entrance. Consonants land late, vibrato is slow and wide, and crescendos build across whole phrases instead of single notes. Nothing is rushed. Widen the throat to chase that size and the pitch center sags while the vowel blurs; the breadth comes from the length of the breath, not from opening wider."
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
    "blurb": "Round, full-bodied mezzo that slides between spoken delivery and open, jazz-toned sustains.",
    "technique": "Two modes alternate inside a single verse: near-spoken delivery half in time with the band, then an open, round sustain with real jazz tone on it. Vowels stay wide and the placement is warm instead of nasal. Ornaments tend to be short scat figures rather than long melismatic runs. Crossing between the modes is what trips people up, since the sung notes need full breath support the instant they arrive, so the spoken sections have to be supported too."
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
    "blurb": "Dark, resonant baritone with crooner control below and unpitched howls when he pushes past the staff.",
    "technique": "Below the staff the voice is dark and round with a low larynx, closer to a crooner's setup than a rock singer's, and slow wide vibrato on held notes. Phrases often begin nearly spoken and grow into tone. Pushing past Bb4 he trades pitch for open howls, so there is no real mix to study. Students darken by pressing the tongue down and lose the words; that depth comes from an open throat, not a swallowed one."
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
    "blurb": "Light, narrow tenor tone; favors soft head voice and fast vibrato over chest projection.",
    "technique": "The distance between the Bb4 belt and the F5 ceiling never gets belted; he thins through it instead. Tone is narrow and slightly forward, onsets gentle, and the vibrato is fast and shallow, arriving late on held notes. Head voice does the work up top, kept light but connected. Reaching for volume in the upper mix flattens the tone into a shout and the vibrato disappears."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Many Rivers to Cross",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright gospel-leaning tenor; open vowels, long sustained upper notes, wide vibrato at phrase ends.",
    "technique": "Open vowels and a lifted soft palate give this tenor its gospel brightness — forward, ringing, never covered. Attacks are clean and unscooped, phrases climb rather than sit, and long upper notes take a wide, slow vibrato that only switches on once the pitch has settled. Many Rivers to Cross shows that habit plainly. Bring the vibrato in too early and the straight-tone arrival that makes the note land disappears."
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
    "blurb": "Bright soprano with a fast, narrow vibrato and clean vowels; little rasp and almost no chest push.",
    "technique": "The vibrato is the signature: fast, narrow, and present almost from the instant a note begins, rather than blooming at the end. Vowels stay bright and unmodified, onsets are clean with no aspirate breath, and the line moves in smooth legato with small ornamental turns at cadences. Rasp is absent, and chest weight never climbs into the upper range. Speed is what keeps that vibrato sounding folk rather than operatic; widen it and slow it down and the character changes entirely."
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
    "blurb": "Speech-level snarl in a narrow chest band; drive comes from consonants and timing, not pitch.",
    "technique": "Drive comes from the consonants. She sings at speech level in a narrow chest band, snarling the front of each word and clipping the ends, so rhythm rather than pitch carries the energy. Vibrato is nearly absent and the vowel stays bright and tight. Trying to make it pretty, or adding runs, kills the effect — it depends on staying blunt and dead on the groove."
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
    "blurb": "Round, high-volume coloratura with easy staccato and trills; diction blurred in the upper extension.",
    "technique": "Volume with roundness: the pharynx stays wide open, which is why the coloratura sounds cushioned rather than pecked, and why words dissolve above the staff as every vowel drifts toward a neutral schwa. Staccato is fired from the breath, not the throat, and trills stay fast and even. What students miss is that the size comes from space and a light onset, never from pressing."
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
    "blurb": "Church-trained tenor; clean chest tone, light rasp on push, and an easy step up to falsetto.",
    "technique": "Clean, forward chest tone with a little grain that only shows when he leans in. Onsets are precise rather than scooped, and runs stay short: three or four notes placed at the end of a line instead of draped over it, since any more than that buries the straight-line clarity underneath. Bb4 is the ceiling for full weight, and above it the voice releases into falsetto with no audible seam, carrying an even, moderate vibrato."
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
    "blurb": "Nasal, slightly flat-toned tenor; pushes into a torn-edged shout at the top instead of smoothing it out.",
    "technique": "Placement is narrow and nasal with very little vibrato, mostly straight tone, phrases delivered close to how he would speak them. Notes are often approached from just underneath and left sitting there, which is part of the sound rather than a fault. Near D5 the tone tears into a shout instead of smoothing into a mix. The usual imitation error is adding vibrato and polish and losing the conversational delivery."
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
    "blurb": "Narrow bass-baritone with a flat, spoken attack; adds volume rather than pitch at the top.",
    "technique": "Speech is the starting point. The tone sits low and forward with almost no vibrato, and phrases land squarely on the beat next to that clipped, chugging rhythm. Onsets are soft rather than punched. Near the E4 ceiling he adds breath and volume instead of brightness. Students go wrong by pressing the larynx down to manufacture depth, which kills the flat, easy speaking quality the whole sound depends on."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Chances Are",
    "lowSource": null,
    "highSource": null,
    "blurb": "High, feathery tenor; vibrato stays fast and narrow even at whisper volume.",
    "technique": "High and feathery, weighted toward head resonance even in the middle of the range, with an onset so soft the note seems already in progress. Vibrato is fast and narrow and stays that way at whisper volume, which is the fingerprint of the voice. The upper reach is light mix and falsetto, never chest. Chances Are sits in that floated territory. Sing it loudly and the tone vanishes; it only exists at low pressure."
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
    "blurb": "Bright nasal tenor that drives choruses in a hard chest mix and roughens at the top end.",
    "technique": "Bright and noticeably nasal, with the sound pinned high in the mask so it carries over distorted guitars. Choruses ride a hard chest-heavy mix that roughens as it climbs, and the D5 at the top of Livin' on a Prayer is taken with the throat open and a slight bark on the vowel. Attacks land firm and consonant-first, and there is real chest weight sitting under the brightness, which keeps the nasal edge from going thin."
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
    "blurb": "Unusually dark, covered tenor sound with baritone-like lows and a tightly held, muscular top.",
    "technique": "Cover comes on early here, so the sound stays dark and gathered through the middle where most tenors brighten. Onsets are soft, vibrato narrow and slightly delayed. By C5 the tone reads compressed and muscular rather than open and ringing, which is the trade that darkness costs. Copy it with a depressed tongue root, though, and you get a throaty, unfocused note instead of a covered one."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "You'll Be Back",
    "lowSource": null,
    "highSource": null,
    "blurb": "Round warm tenor with clean onsets; steady sustain and almost no scooping into pitches.",
    "technique": "Notice how little decoration there is. Pitches start exactly where they finish, with no slide up into them and no fall off the back, and the tone stays round and warm rather than edgy. Sustains hold at even volume with small, late vibrato. Because the range tops out around C5 and sits in a comfortable legit placement, the whole effect rests on accuracy of the onset. Scoops and swells added on top read immediately as effort, because there is nothing decorative here to hide behind."
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
    "blurb": "Sharp ringing tenor with steady breath support; often ends phrases in controlled falsetto.",
    "technique": "Ring is the defining quality: a bright, focused tone with even breath support, so long lines hold steady in volume and pitch. Onsets are clean, vibrato regular and fairly quick, and R&B turns are placed rather than sprayed. Phrases often finish in a controlled falsetto entered without a seam. The transition is what students miss, grabbing at falsetto instead of easing the weight off note by note."
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
    "blurb": "Early records float in light head voice with wide leaps; her later voice settled lower and huskier.",
    "technique": "Everything sits in a light, unpressed head voice, with the top of the range reached by releasing weight rather than adding it. Leaps of an octave or more land dead center with no scoop, and the tone stays mostly straight, vibrato appearing only as a phrase settles. Later work lives lower, huskier, and closer to speech. Volume never climbs with the pitch: up toward C6 the sound thins instead of thickening, and that thinness is what keeps the intervals accurate."
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
    "blurb": "Lyric tenor with a plaintive, slightly grainy tone; leaned on phrasing rather than sheer volume.",
    "technique": "Grain in the tone and a slightly plaintive vowel color give this voice its ache. The attack is gentle, consonants stay clear, and the expression comes from timing: entries delayed, tempo pulled, dynamics dropped to almost nothing before a line opens out. Vibrato is thin and starts with the note instead of arriving late. The mistake is trying to make any of it bigger. The character lives in restraint, not in size."
  },
  {
    "slug": "jose-jose",
    "name": "José José",
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
    "blurb": "Clean lyric tenor; accurate on stepwise ballad climbs, near-seamless chest-to-mix handoff.",
    "technique": "Onsets land precisely without turning glottal, vibrato stays narrow and steady, and the climb through the passaggio into mix near B4 arrives with no seam and no shift of color. Ballad lines build stepwise, one degree at a time, which leaves intonation exposed the whole way up. Volume is not what makes the top work; the tone stays slim and resonance does the growing."
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
    "blurb": "Pop-classical baritone recorded warm and close; opens into a full ring across the top fourth.",
    "technique": "Close-mic'd and warm, with a low register that sits near speech and almost no vibrato, then a gradual opening as the line climbs until there is full ring by the top fourth toward A4. Vibrato arrives late in sustained notes and widens as it goes. Much of the swell is the vowel opening plus microphone distance rather than added force. Shove at the top notes and the phrase stops growing."
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
    "blurb": "Reedy ranchera tenor that slips into falsetto mid-phrase, with loose conversational timing.",
    "technique": "Phrases lean late, stretch, then scramble to catch up, so a ranchera line ends up sounding spoken as much as sung. The tone underneath is reedy and narrow with a bright edge that carries over horns. Mid-phrase the voice breaks upward into falsetto and drops back again, treating the crack as an expressive move rather than a fault. Smoothing that transition out to sound polished removes the exact thing that makes the delivery his."
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
    "blurb": "Contralto with a tremulous forward vibrato, thick chest resonance, and an audible catch on held notes.",
    "technique": "Listen for the shake: a fast, narrow vibrato placed well forward in the mask, sometimes widening into an audible waver across a sustained note. That waver rides on a pulse in the breath rather than a squeeze in the throat, which is why the tone stays open even while it moves. Chest resonance holds thick well above the middle of the staff, and phrase endings tend to break off with a small catch instead of tapering out. Consonants get attacked firmly, vowels stay wide and speech-like."
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
    "blurb": "Bell-clear soprano with exact intonation and light vibrato; very little chest-voice pressure.",
    "technique": "Clarity comes from clean vowels and very little air in the tone. Pitch centre is exact, onsets are quiet and precise, and the vibrato is light enough that long notes read as nearly straight. Chest register is used sparingly and released early, so the climb toward the top of the range happens in clear head voice with no gear change audible. Diction stays crisp without hardening the vowel. The bottom of the range is where the illusion usually breaks, given a weight this voice never carries."
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
    "blurb": "Bright tenor, breathy on low lines, then a thin but unstrained mix that slides into falsetto.",
    "technique": "Listen for how little weight he carries. Low lines come out on air, with soft aspirate onsets and almost no vibrato, then the tone narrows and brightens as it climbs. The mix around C5 stays slim rather than loud, and above it he releases into falsetto instead of driving. Students add chest weight and volume, which kills the ping and turns the falsetto handoff into an audible break."
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
    "blurb": "Breathy tenor with a light mix; moved from a boyish head voice to a closer, quieter delivery.",
    "technique": "The microphone does the amplifying here, which lets the voice stay breathy and half-spoken, engaging into a light mix around the A4 belt. Runs are small and rhythmic, tucked between words rather than displayed. Lines toward Bb5 go into head voice with the weight taken off. Project the whole thing loudly and the conversational feel the phrasing is built on goes with it."
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
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Cry Me a River",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light tenor living in falsetto and mix; rhythm-first phrasing with very little vibrato.",
    "technique": "Syllables get chopped into sixteenths and placed just behind the beat, with consonants doing the groove work while the pitch content stays deliberately plain. Tone is thin and breathy, vibrato nearly absent, phrases holding a straight tone until they end. The B4 belt is modest for a range topping C6 because most of that height is head voice and falsetto rather than pushed chest. Cry Me a River shows the falsetto sitting inside the mix."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Skinny Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bon Iver's layered falsetto in tight harmony stacks; the chest voice stays quiet and slightly strained.",
    "technique": "Falsetto leads almost everything, sung at modest volume close to the microphone and then stacked into tight harmony so the blend, not the individual note, carries weight. Onsets are breathy, vibrato is barely there, and the chest register stays quiet with an audible edge of strain that is part of the character. The low end of the range is rarely used at full voice. Nothing here trades on power, and the strain in the upper lines works as texture rather than effort."
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
    "blurb": "Soft-edged mezzo close to the mic, breath left in the tone, melody kept conversational.",
    "technique": "Everything stays close to the microphone and close to speech. Air is left in the tone deliberately, onsets are soft, and vibrato is minimal, a small tail at the end of a note rather than through it. The line sits mid-staff where talking is comfortable, consonants relaxed. Sung at full volume the style disappears, so the real work is staying intelligible and in tune at that low a dynamic."
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
    "blurb": "Warm low-middle register sung close to the mic, minimal vibrato, very even air pressure.",
    "technique": "Nearly all of it lives in the low-middle, a region most singers pass through on the way up, and it is sung close to the microphone at a conversational volume. Air pressure barely changes across a phrase, vibrato is minimal, and there is almost no scoop into notes — pitches arrive already centered. Consonants stay soft so the line never breaks. Two things ruin an imitation: transposing it up into a brighter part of the voice, and adding vibrato, which immediately makes the evenness disappear."
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
    "blurb": "Wide chest belt plus a usable whistle register; stacks fast melisma over sustained cadences.",
    "technique": "Two very different instruments answer each other here. Underneath, a wide chest-mix belt up to Bb5 with grit on the attack; above it, a clean whistle register used as punctuation rather than decoration. Melisma comes in fast stacks over a held cadence, often landing on the ninth or the flat seventh. Students chase the whistle first. Build the belt and the run vocabulary, because the top notes only read over that foundation."
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
    "blurb": "Slightly raspy mezzo with breathy onsets, parked in a narrow mid-belt for reggaeton hooks.",
    "technique": "Aspirate onsets let breath into the tone, the edges stay slightly raspy, and the whole delivery lives inside a narrow band around the E5 belt. Phrases lag a fraction behind the beat, which is what makes them feel unhurried. Vibrato barely appears, and notes get cut off rather than sustained. Sung fully supported and squarely on the grid, these hooks come out too tidy for the pocket."
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
    "blurb": "Fluttering vibrato and character placement; jumps from breathy speech to a piercing head voice.",
    "technique": "Character comes first and tone follows it, so the placement shifts line to line: breathy near-speech, a nasal pinched middle, then a thin, piercing head voice reached by leap rather than by climb. Vibrato flutters fast and narrow, sometimes fast enough to read as a trill. Words get stretched, swallowed, or bitten off for effect, and glides between distant notes are audible on purpose. In \"Wuthering Heights\" the high writing stays in head voice throughout. Students squeeze the throat for that thinness instead of letting the cords stay light."
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
    "blurb": "Bright, forward belt with a hard nasal edge; head voice thins quickly above her chorus range.",
    "technique": "Brightness comes from a high, narrow resonance with a real nasal edge, and the belt works a tight window around F5 where the tone is thickest. Above that it thins fast into a light head voice rather than continuing to open. Vibrato is minimal, so sustains stay loud and mostly straight. What goes wrong in imitation is chasing the edge with throat squeeze; the buzz has to come from resonance and firm breath instead."
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
    "blurb": "Open-throated, largely unornamented belt; sustains high chest notes with even vibrato and no scoop.",
    "technique": "Simplicity is the point here. Notes arrive centered with no scoop, hold straight for a beat, then take an even, moderate vibrato. The throat stays open and the vowel tall, which is what keeps a belt around G5 round instead of shrill. Melisma is rare, so the melody carries itself. Most singers reach for this by lifting the chin and pushing volume, and the tone goes bright and brittle rather than full."
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
    "blurb": "Nasal baritone with a flat deadpan low register that tightens into a strained, plaintive high belt.",
    "technique": null
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
    "blurb": "Talk-sung, processed verses give way to an open belt and thin, exposed notes at the very top.",
    "technique": "Verses run close to rhythmic speech, delivered in a flat, wide-vowel drawl that sits low and leans on attitude more than tone. When she opens up, the belt around F5 is plain and unornamented, and anything above it goes thin and exposed rather than reinforced, which is the whole effect of the top notes in Praying. Vibrato stays minimal. Trying to fatten those high notes with weight defeats them; they need air and release."
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
    "blurb": "Jazz harmonic sense in a gospel frame; chromatic runs, then sudden drops to a spoken chest tone.",
    "technique": "Harmony drives the line. Runs move chromatically through altered notes rather than sliding up a pentatonic shape, and phrases get displaced across the bar so the resolution arrives late. A climb toward A5 in full voice can drop without warning into a near-spoken chest tone at conversational volume. Copying the runs note-for-note misses it: the ear has to hear the passing chords first, or the chromatics just sound like mistakes."
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
    "blurb": "Two voices in one part: clipped mid-range narration against thin, wailing falsetto shrieks.",
    "technique": "A dry, clipped mid-range handles the narrative lines, then the same phrase leaps into thin, edgy falsetto for shrieks that climb well above the C5 belt. The flip has to be released rather than pushed, so reaching for it from a pressed throat never quite arrives. That falsetto is deliberately weightless, closer to a whistle edge than to force, and a fast flickering vibrato keeps it moving."
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
    "blurb": "Theatre-trained mezzo with a firm chest belt, tight vowel shapes and controlled vibrato.",
    "technique": "The vowels are the giveaway: narrow, forward, and identical take to take, sitting under a chest-mix belt that keeps its brightness through G5. Onsets are precise rather than scooped, vibrato gets switched on deliberately at the ends of sustains, and diction stays crisp at speed. Above the belt the sound thins into a light head voice. Loosen the vowel shape and the belt immediately loses focus."
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
    "blurb": "Coloratura top with easy staccato leaps, plus a separate brassy belt she switches into abruptly.",
    "technique": "Two voices sit side by side. One is a light coloratura that leaps and detaches cleanly, each staccato note re-articulated from the breath rather than chopped in the throat, and it runs far above the staff. The other is a brassy, nasal-forward belt topping out near F5. She swaps between them mid-phrase with no blending, and the abruptness is part of the comedy. Smoothing the join would remove the effect, and reaching for coloratura pitches from inside the belt is what strains it."
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
    "blurb": "Rasped baritone that shifts from muttered verses to a torn, throat-forward shout at the chorus.",
    "technique": "Verses sit barely above speech, dry and without vibrato, the pitch center allowed to sag. The chorus arrives as a throat-forward shout built from a compressed vowel and hard consonants rather than raw volume, and the phrasing drags a fraction behind the beat. Going straight to full-force screaming sounds nothing like it and falls apart by the second chorus; the tone is loud speech held on a pitch."
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
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Bad Romance",
    "lowSource": null,
    "highSource": null,
    "blurb": "Trained mix with fast vibrato; jazz phrasing sits low, then she opens into a squared-off, brassy belt.",
    "technique": "Two modes sit side by side: a low, conversational croon with jazz-inflected timing, and a brassy, squared-off belt near G5 that keeps a fast, even vibrato. Vowels narrow and brighten as she ascends, which is what lets the mix carry that much ring without spreading. Consonants land hard and right on the beat. Chase that brightness by clenching the jaw and the tone comes out pinched rather than ringing."
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
    "blurb": "Two voices: a heavy low chest croon and a thin, girlish head register she slips into mid-phrase.",
    "technique": "She switches between two registers as if they were two characters: a heavy, breathy croon down around C3, and a thin, deliberately childlike head tone she flips into mid-phrase without smoothing the seam. That audible break is the effect, not a flaw to fix. Lines drawl behind the beat with long slides between notes and hardly any vibrato. The temptation is to blend the two into one polished mix, which removes the exact contrast the style depends on."
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
    "blurb": "Thin, light soprano; pinpoint intonation above the staff with straight tone and slim vibrato.",
    "technique": "Slim, light, and placed high, with very little chest weight anywhere, because a narrow tone is what allows this much speed. The ornaments draw on a classical vocabulary: quick grace notes, tight oscillating turns, and smooth connecting slides that cross between pitches without a seam. Above the staff the vibrato thins out or drops away entirely, leaving a straight tone that sits dead centre in pitch. Weight is traded off on purpose here; adding any would cost the agility outright."
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
    "blurb": "Husky, grainy mezzo pitched low in her range; heavy rasp on consonants, slow wide vibrato.",
    "technique": "A husky, slightly pressed tone with grain riding the consonants, and melodies written low enough that whole verses sit just above the E3 floor before anything lifts. Vibrato is slow and wide and shows up at the end of a held note rather than the beginning. Phrasing drags behind the beat, words chewed rather than pronounced. That grain is a byproduct of the low, relaxed placement, not something to squeeze out on purpose."
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
    "blurb": "Forward, nasal placement and rap-adjacent timing; belts inside a narrow, tightly held band.",
    "technique": "Timing is the instrument. Sung lines get the same rhythmic precision as spoken ones, syllables landing on subdivisions instead of on beats, and the placement stays high, narrow and a little nasal. The band pushed hardest is a narrow one, and approaching A5 the tone thins rather than opening out. Widen the vowels into legato and the character evaporates, so the vowels stay short and the consonants drive the groove."
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
    "blurb": "Nasal-edged baritone with a heavy chest push; his stacked harmonies with Cantrell define the sound.",
    "technique": "Nasal buzz carries the tone forward while the weight underneath stays thick and baritone-heavy, which is why the voice reads as pressed even at moderate volume. He holds long notes nearly straight, letting a slow wide vibrato in at the very end, and doubles himself in close harmony that demands identical vowels take after take. Copying the nasality by pinching the throat is the usual mistake — it belongs in the resonance, not the larynx."
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
    "blurb": "Broad nasal belt with heavy vibrato; pop riffing layered over legit theatre technique.",
    "technique": "Placement is high and nasal, which broadens the belt and keeps it bright all the way to E5. Vibrato is heavy and fast, arriving early in the note and staying for its full length. Underneath sits a legit theatre foundation, full breath and matched vowels and long sustains, with pop riffs and quick turns laid over the top, sometimes inside one phrase. Attacks are firm and scooped slightly from below. Pinching the throat to get the brightness narrows the tone without adding ring."
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
    "blurb": "Clear, vibrato-light soprano with precise legato; shifts to a bright chest belt for pop lines.",
    "technique": "Her sound is unusually tidy. Onsets begin right on the pitch with no scoop, vowels stay narrow and matched from note to note, and vibrato is withheld until the last beat of a long tone. Between the D5 belt and the top of the range she moves into a light head register with almost no seam, so the change reads as a shift of colour rather than a change of gear. Imitations go wrong by adding weight and constant vibrato; the plainness is the technique."
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
    "blurb": "Fast, wide vibrato and a clean yodel flip between chest and head voice, trained from childhood.",
    "technique": "That fast, wide vibrato is the fingerprint, and it sits under nearly the whole length of a held note rather than showing up at the end. The chest register is thick for a soprano, and the register change becomes an ornament in its own right: a deliberate yodel flip up into head voice and straight back down, clean enough to use as rhythm. Notes are often bent into from underneath, with short, precise turns. The flip works by releasing the chest note, not by forcing through it."
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
    "blurb": "Speech-level bass-baritone, gravelly and unhurried, dropping to near-spoken low notes late in life.",
    "technique": "Think speech first, pitch second. The tone is dry, gravelly, and nearly free of vibrato, sustained by steady air rather than resonance, and phrases land behind the accompaniment with unhurried timing. Down near the bottom of the range the sound is more spoken than sung, with the microphone carrying what volume cannot. Nothing is pressed downward to find that depth; the low notes arrive by relaxing into speech, and they stay quiet once they get there."
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
    "blurb": "Creamy Verdi soprano with a wide, steady spin; floated high Cs over full orchestra without pushing.",
    "technique": "The spin is the thing to listen for, a wide and steady vibrato that holds its rate, riding a narrow unwavering stream of air. Onsets arrive already spinning, with no scoop and no shove. High notes are floated and then released with a diminuendo instead of chopped off, and the register transitions are hard to locate. Students attack a high C from below and force it. The note has to be in place before the breath moves."
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
    "blurb": "Thick baritone with constant rasp; pushes into a strained high mix and lets the tone break.",
    "technique": "Rasp is constant here, present even in a quiet verse, with a thick, low-placed tone underneath it. Verses stay close to speech; choruses arrive as one long crescendo into a high mix around Bb4, and the loudest word is often where he lets the tone come apart on purpose. The slow vibrato, when it appears, comes late. Reaching straight for that break produces noise, because the effect depends on how quiet the setup was before it."
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
    "blurb": "Full-bodied chest voice with clean intonation; carries weight high before easing into head voice.",
    "technique": "Full chest weight is carried surprisingly high before the voice releases into a round head tone, and the handoff is done by easing pressure rather than by flipping — the sustained high line late in \"Blue Bayou\" shows the release clearly. Intonation is exact, onsets are firm and unaspirated, and vibrato is even and moderate in width, arriving after the pitch is established. Phrasing sits right on the beat with country-style bends on individual words. The roundness up there survives only because the height is eased into instead of forced."
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
    "blurb": "Warm, unhurried tenor that leans on breathy tone over volume and steps up to a light falsetto.",
    "technique": "Air is part of the tone here, not a fault. Lines start soft, with an aspirate onset, and stay near speech volume even when sustained; a slow, narrow vibrato shows up only at the tail of a long note. Above the A4 belt he moves into a light falsetto rather than driving the chest voice higher, and phrasing sits square on the beat with almost no ornament. The trap is oversinging it, because the warmth comes from steady breath and relaxed vowels at low volume."
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
    "blurb": "Rock mezzo who takes anime choruses in a bright, strident chest mix and rarely drops to falsetto.",
    "technique": "Nearly all of this happens in a bright chest-dominant mix, driven hard and kept connected across the whole F3 to F5 span rather than flipped to falsetto. Onsets are consonant-heavy and percussive, vowels wide and slightly strident, vibrato fast and applied late in a note. Rapid syllabic choruses like Gurenge require the breath be reset in tiny gaps. Most students take the volume without the support and run out of air by the second line."
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
    "blurb": "Gospel shouter's tenor: hard chest attack, heavy rasp, falsetto whoops flipped in mid-phrase.",
    "technique": "Everything begins with a hard glottal attack — notes are punched, never eased into. The chest sound is bright, heavily rasped, and driven to the top of its working range around C5; above that he flips mid-phrase into falsetto whoops that function as exclamation rather than melody. Time sits slightly ahead of the beat and drags the band with it. The attack and that forward timing carry the style, and the rasp falls out of both."
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
    "blurb": "Full chest belt with gospel weight; switches into rap cadence and back without losing tone.",
    "technique": "Full chest weight, forward and bright, with the belt topping out near Eb5 and no thinning on the way up. Diction is percussive. She drops from a sung line into a rapped cadence and back without changing placement, which is the hard part to copy: the same forward tone has to hold through the spoken sections. Ornaments are gospel-shaped, short fast melisma with a growl on the accent, and sustained notes stay mostly straight until the last word of a chorus."
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
    "blurb": "Low-sitting mezzo with a dry, spoken quality; layers her own voice instead of belting high.",
    "technique": "Dark and dry, placed low in the voice, with almost no vibrato and breath left audible at the ends of lines. Consonants supply the percussion, and melodies stay inside a narrow band, repeating instead of climbing. Where another singer would belt, she stacks harmonies and octaves on the same low line, so the D5 ceiling rarely gets tested. Phrasing is speech-timed and often just behind the beat. Sing it big and it stops working."
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
    "blurb": "Nasal Appalachian mezzo, hard consonants, a bent and talking approach to the melody line.",
    "technique": "You hear the nose first: placement is high and forward, vowels flattened toward speech, consonants struck hard enough to become part of the rhythm. Melody gets bent, notes approached from under and pushed up into, sometimes talked more than sung. Chest-weighted tone covers most of the G3-D5 span with no flip into anything lighter. Round the vowels out and the accent goes with them, and the accent is where the feeling actually lives."
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
    "blurb": "Gravel-and-air rasp, trumpet-shaped phrasing, scat treated as a second horn chorus.",
    "technique": null
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
    "blurb": "Bright, forward Italian tenor with squillo that cuts; sang nine consecutive high Cs in full voice.",
    "technique": "Everything is placed forward and narrow: the vowel stays small, the ring sits high in the mask, and the tone cuts without needing extra volume. Onsets are clean, with no scoop into the note. Vibrato is quick and even, present from the first instant. Climbing toward C5 he adds cover while keeping that forward point, so the top sounds open rather than squeezed. Students push air and widen the mouth, which kills the ring."
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
    "blurb": "Warm bolero tenor; open vowels, unbroken legato, gradual crescendo into sustained notes.",
    "technique": "Those long bolero sustains run for bars, so the breath has to sit at steady pressure rather than get shoved out at the start, and that is where most imitations come apart. Vowels stay wide open and the line never breaks: phrases arrive on a soft, aspirate onset and grow by crescendo instead of by attack. Vibrato is even and enters early in the note. Around the B4 belt he blends into a warm mix rather than shouting, which keeps the peak of a phrase round."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Never Too Much",
    "lowSource": null,
    "highSource": null,
    "blurb": "Round, cushioned tenor with precise runs and falsetto used as ornament, not escape.",
    "technique": "Nothing in the tone carries an edge, even at full volume: round, cushioned, warm, with a low larynx color. Runs are fast but fully articulated, each pitch landing rhythmically rather than smearing, and falsetto gets used as a decorative flick at the top of a phrase instead of an escape hatch. Dynamics swell gradually inside single notes. Smeared runs and over-scooped entries kill it; the style depends on clean starts and exact intervals."
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
    "country": "USA",
    "activeFrom": 2009,
    "lowMidi": 43,
    "highMidi": 84,
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "I Miss the Misery",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thick chest-weighted belt with controlled rasp, plus screamed falsetto above the staff.",
    "technique": "Two layers work at once: a thick, chest-weighted belt around G5 and a controlled rasp laid over it, added and removed at will. Down near G2 the tone goes speech-like and grounded. Past the belt the sound moves into a screamed upper register rather than more chest, and that gap up to C6 is where the style shows. Build the clean belt first; reaching for the rasp on day one usually means squeezing the throat to get it."
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
    "blurb": "Early records sit at speech-level chest tone; later work adds a rounder, trained middle register.",
    "technique": "Most of the singing happens in a narrow band at speech level, delivered with a thin, bright chest tone and very little vibrato — the interest lives in rhythm and consonant placement, not in tone color. With the belt around C5 and the ceiling well above it, the upper notes come out as a light, sometimes deliberately girlish head voice rather than a pushed chest note. Later material sits rounder and lower in the throat. The rhythmic snap depends on that lightness; extra weight and vibrato blunt it immediately."
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
    "blurb": "Chest-heavy contralto; slides into pitches and stretches syllables instead of landing them squarely.",
    "technique": "Almost nothing lands squarely on the beat. Notes get approached from below, stretched, then leaned on until the vibrato arrives, slow and wide, at the end of the tone rather than the start. Weight stays in chest up to the D5 belt, with dynamic swells inside a single syllable. Students sing this loud and straight; the shape lives in the scoops, the time-stretching, and the sudden drops to almost nothing."
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
    "blurb": "Cutting salsa tenor; nasal placement and tight vibrato on high sustained calls over horns.",
    "technique": "Placement is high and nasal by design, because that is what cuts through a full horn section. Sustains sit up near the C#5 belt with a fast, tight vibrato that starts almost immediately. Phrases get clipped short and set against the clave instead of sung legato. Beginners chase the loudness and end up shouting under pitch; the intensity here is forward resonance, not air pressure."
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
    "blurb": "Uneven but instantly identifiable across three registers; used chest weight and portamento as drama.",
    "technique": "Three registers, each with its own color, and the seams between them are audible. Chest is heavy and unmixed down toward F#3, the middle veiled, the top bright and sometimes edged. Portamento carries the drama, while accents land on hard glottal onsets. Vibrato widens as pressure rises, and recitative comes out close to speech rhythm. Students copy the chest register with a clenched jaw and end up shouting rather than speaking on pitch."
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
    "blurb": "Breathy low register, dense upper mix, and a whistle top used as melody rather than decoration.",
    "technique": "Three distinct sounds get stacked in one phrase: an airy, half-voiced bottom, a compressed mix that belts to around G5, and a whistle that sits far above it and functions as a written line, not a stunt. Notice how the whistle enters without a scoop or a break — the cords are already set before air moves. Riffs are fast, rhythmically placed off the beat, and articulated with the tongue rather than the throat. The usual mistake is chasing the top of \"Emotions\" before the mix underneath it is stable."
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
    "blurb": "Operatic tenor with dense squillo; carries full chest weight to a sustained high C, no falsetto.",
    "technique": "Everything rests on a ringing, concentrated core, the narrow metallic ping that lets an unamplified tenor sit on top of an orchestra without shouting. Full weight is carried up to C5 with no flip into falsetto: larynx low, palate high, the vowel darkening as it rises while the ring stays pinned in one thin band. Attacks are firm without turning glottal, and the vibrato runs even and moderately fast. The scale of the sound is a resonance effect, not a matter of moving more air."
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
    "blurb": "Country soprano who belts from a braced chest mix; clean vowels, no scoop into the high notes.",
    "technique": "The vowels stay square, and every note begins straight on pitch with no slide up to it. The belt runs on a braced chest mix with the ribs held wide, staying bright and even from mid-staff up toward F5 instead of thickening as it climbs. Vibrato stays narrow and arrives late, often only in the last beat of a held note. Dropping the jaw for extra power swallows the forward ring that carries the belt."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "What's Going On",
    "lowSource": null,
    "highSource": null,
    "blurb": "Three voices in one: growl at the bottom, smooth mid, airy falsetto layered over the top.",
    "technique": "Three distinct colors get used as separate instruments: a gritty low register near F2, a warm smooth middle, and a breathy falsetto floated on top toward Bb5. Onsets are soft and aspirate, almost sighed into place, and phrases lean slightly behind the beat. Vibrato is narrow and arrives late. The common mistake is powering the falsetto; it works because it stays quiet and airy against the fuller mid voice."
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
    "blurb": "Nasal, tightly focused tenor with wide vibrato; held notes thin out into falsetto at the top.",
    "technique": "Placement is high and narrow, forward in the mask, which is what cuts through a full choir. Vibrato is wide and fast, often shaking harder at the end of a long note. Notice the gap between the Bb4 belt and the F5: those top notes thin deliberately into falsetto instead of thickening. Push chest up into that gap and the placement collapses along with the vibrato, which is where most imitations come apart."
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
    "blurb": "Raw chest-dominant mezzo with a nasal edge and clipped, conversational phrasing.",
    "technique": "Everything is placed forward and slightly nasal, which is what gives the sound its edge over a hip-hop drum track. Phrases get clipped short and delivered in chest voice, nearer to talking than to singing, with ad-libs crowding in behind the main line. Small breaks and catches are left in rather than smoothed away. Clean the tone up and the character goes with it; the work is keeping that raw edge while the pitch centre stays exact."
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
    "blurb": "Thin, vibrato-heavy tenor that trades chest weight for a piercing falsetto with an operatic wobble.",
    "technique": "Weight gets traded for ring. Tone is thin and forward with a fast, fairly wide vibrato running almost continuously, and above the D5 belt he moves into a falsetto that keeps that operatic wobble intact all the way up toward D6, which is where the upper writing in Micro Cuts sits. Chest stays comparatively light. The usual error is manufacturing the vibrato with the jaw rather than letting airflow produce it."
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
    "blurb": "Sings long stretches in falsetto with a narrow, flute-like tone and slow vibrato.",
    "technique": "Whole verses live in falsetto, with a narrow flute-like tone that stays quiet and close to the microphone. Vibrato is slow, shallow, and arrives well after the note has settled. Reaching toward C6 works because the sound gets lighter as it climbs rather than louder. Powering the falsetto up there is the wrong instinct; the skill is holding a very small, steady stream of air and trusting the amplification."
  },
  {
    "slug": "maynard-james-keenan",
    "name": "Maynard James Keenan",
    "voiceType": "Tenor",
    "genres": [
      "Metal",
      "Alternative"
    ],
    "country": "USA",
    "activeFrom": 1993,
    "lowMidi": 41,
    "highMidi": 81,
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Sober",
    "lowSource": null,
    "highSource": null,
    "blurb": "Breath-controlled tenor: long even sustains, rasp saved for the peak of a phrase.",
    "technique": "Long sustains hold steady from first moment to last, with very little vibrato until the release, which puts breath management out front as the thing you notice. Rasp is rationed, so the line stays clean and covered until edge arrives right at the peak of a phrase. Phrasing floats loosely across the accompaniment instead of locking to the downbeat. Grit applied everywhere flattens that contrast completely."
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
    "blurb": "Soft-focus tone with almost no edge, paired with fast and accurate bebop scat lines.",
    "technique": "Almost no edge in the tone — the sound is soft-focused, closer to a flugelhorn than a trumpet, with breath and tone blended so evenly that onsets barely register. Then the scat arrives, fast and harmonically exact, articulated at the front of the mouth so the consonants can keep up with the tempo. Above the staff he thins instead of pushing. Chase the smoothness alone and the rhythmic precision that makes it swing goes missing."
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
    "blurb": "Dark chest-dominant contralto; little vibrato, plain declamation, weight on the vowel.",
    "technique": "Weight sits on the vowel. Tone is dark, chest-dominant and nearly straight, vibrato appearing only faintly at the end of long notes, so the effect is declamatory rather than lyrical. Phrases are shaped like speech, pauses used as punctuation, dynamics shifting slowly. Nothing is decorated. Adding vibrato and rubato to sound more expressive flattens the plain, deliberate delivery that gives folk material its weight."
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
    "blurb": "Relaxed baritone with jazz-tinged timing; bends up into notes and stays behind the beat.",
    "technique": "Phrasing leans back the way a jazz singer's does, notes set a hair behind the beat and bent up into from below. Tone is relaxed and mid-weight, never pressed, with light vibrato that only surfaces as a note is ending. The E4 top is reached by opening the vowel rather than adding volume. Students copy the looseness and lose the tuning; behind the beat still has to be precisely behind it."
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
    "blurb": "Crooner baritone with a pop-sized top; well-supported, lightly swung, very even tone.",
    "technique": "Very even from bottom to top: no obvious seam, no thinning at A4, and consistent breath support under every note. Onsets are lightly aspirate, the swing is understated, and vibrato stays regular and unhurried. Ad-libs at the end of a chorus bring a little grit over a clear pitch. Evenness is the difficulty — it demands the same air pressure and the same vowel shape everywhere, which is duller to practise than it is to hear."
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
    "blurb": "Light breath-heavy tenor with narrow vibrato; favors head voice over chest pressure.",
    "technique": "There is very little weight in the instrument by design: a slim, breath-mixed tenor that leans into head resonance instead of pressing chest upward, so the approach to Bb4 gets softer rather than louder. Vibrato is narrow and even, tucked inside the tone instead of decorating it. Onsets are gentle, with air arriving a fraction before the pitch, and consonants are shaped lightly so the legato never breaks. Anyone imitating this adds chest weight for the high phrases, which is exactly the wrong instinct."
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
    "beltMidi": 75,
    "whistle": false,
    "signatureSong": "Billie Jean",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light, percussive tenor; hiccups and breath grunts used as rhythm, plus a thin high falsetto.",
    "technique": "Listen for how much of the rhythm comes out of the mouth rather than the pitch: clipped consonants, inhaled grunts and hiccup syllables all land as percussion. Tone stays bright and forward, faintly nasal, with a narrow fast vibrato that arrives late on held notes. Above the Eb5 belt he thins into a light, reedy falsetto. Students copy the tics and forget the tics only work over dead-accurate time."
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
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "I Want Out",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright, boyish high tenor that stays connected and vibrato-light through fifth-octave lines.",
    "technique": "The high tenor placement stays bright without going thin, connected through the D5 belt and ringing in a boyish way rather than shouting. Vibrato is sparse, so long notes hold nearly straight and only shimmer as they release, and fifth-octave lines arrive on even legato instead of a scream. Chasing the brightness on its own pushes it into the nose, where the low overtones that keep the tone round drop away."
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
    "blurb": "Thin, bright tenor built for high keys; reaches for head voice instead of pushing chest upward.",
    "technique": "The tone stays forward and the chest weight stays deliberately light, which is what keeps it bright and slender rather than big. Melodies sit high for a tenor, and rather than dragging chest past the A4 belt the sound shifts into head voice and holds that slimmer shape up to D5. Onsets are clean, vibrato modest. All of it depends on releasing weight as the line rises, which feels smaller from the inside than it sounds from out front."
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
    "blurb": "Thin, drawled tenor with heavy blues phrasing; the high stuff comes out in a light, airy falsetto.",
    "technique": "Note how low the belt sits at B4 while the range reaches F5: everything above the belt arrives in a light, airy falsetto, often as a whoop rather than a held note. The tone is thin and slightly pinched by design, vowels stretched and drawled, consonants chewed. Rhythm is the real technique here, landing late, dragging syllables across the beat, then snapping back. Sing it cleanly and on time and the character disappears."
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
    "blurb": "Six cited octaves of extended technique: growls, croons, falsetto squeals, throat-noise texture.",
    "technique": "Guttural growls, close-mic crooning, falsetto squeals, throat noise and character voices swap inside the space of a bar, so extended technique is the material rather than a decoration on it. The crooned baritone in the middle is the anchor everything departs from and returns to. Across a cited Eb1 to Eb7, most of that span comes from switching mode instead of stretching chest voice, and the pitch accuracy underneath the noises is the part that gets skipped."
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
    "blurb": "Sandpaper rasp anchored in chest voice; belts with a hard buzz and drops into a smoky low range.",
    "technique": "A dry, sandpaper rasp runs through every phrase, riding a chest-anchored tone that stays thick from a low G2 up to a belt near F5. Twang supplies the cutting buzz, and vibrato is wide and slow when it shows up at all. She likes dropping an octave into a smoky low register mid-phrase for contrast. Chasing the rasp directly is the standard mistake, since it should be a byproduct of a bright, well-supported tone."
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
    "blurb": "Full chest register under a floating falsetto he treats as a second, instrument-like voice.",
    "technique": "There are effectively two instruments at work. The chest register is warm and reaches down toward G2 with a belt around A4; the falsetto floats well above it, often on wordless lines, and functions as a separate voice entirely. The switch between them is audible but unhurried, with no grab at the transition. Falsetto vibrato is slow and narrow, and below the break there is almost none. Belting what he sings in falsetto loses the airy quality the approach depends on."
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
    "beltMidi": 77,
    "whistle": true,
    "signatureSong": "Lovin' You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light, agile soprano who moves up into clean whistle tones with no audible register break.",
    "technique": "Register changes never announce themselves, because the weight never increases on the way up: chest thins into head voice, head voice narrows into whistle, and the vowel keeps its shape through both. Whistle notes are placed rather than screeched, quiet and pitch-centred with barely any vibrato on them. Build this from the top down out of a soft head voice. Forcing chest weight upward is what keeps the whistle from engaging at all."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Pata Pata",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rich forward mezzo; crisp multilingual diction, click consonants, bell-clear controlled top.",
    "technique": "Diction is half of it: crisp consonants, clean vowel changes across languages, and click sounds placed rhythmically inside the melodic line. Tone is rich and forward in the mask, with an even, controlled top that arrives bell-clear rather than pushed. Onsets are precise, vibrato moderate and steady, phrasing dance-driven and exact. Students smear the consonants chasing a smoother legato, and the rhythmic snap that carries the whole thing goes flat."
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
    "blurb": "Full-bodied soprano who moves from breathy low verses to whistle notes held long and on pitch.",
    "technique": "She works the range in layers rather than climbing it in one line. Verses can sit low and breathy with soft onsets; the chest belt then opens around F5 with full body and a wide, even vibrato; above that, whistle notes are entered cleanly and sustained on pitch instead of flicked at. Transitions get smoothed over, not jumped. The whistle is no party trick here, supported from the ribs the same way the belt below it is."
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
    "blurb": "Countertenor who lives above the staff: light chest, agile head voice, whistle notes on top.",
    "technique": "Living above the staff changes the whole setup. Chest stays light, the head voice is agile enough to run sixteenths cleanly, and whistle notes get used as accents near the very top rather than as sustained material. R&B ornament arrives small and bright: quick riffs, bent thirds, tight melisma. None of that altitude comes from pressure underneath. It comes from taking weight off, which is the opposite of what pushing high feels like."
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
    "blurb": "Known for pianissimo high notes spun on almost no air, then sudden shifts to full dramatic weight.",
    "technique": "The signature device is a high note spun at a whisper: fold contact thinned right down, the vowel kept close, the air rationed, then a sudden shift into full dramatic weight with the vowel unchanged. Onsets are almost inaudible, vibrato slow and even. Chase that pianissimo by blowing more air and it collapses. It works the other way around, on less air held longer with the support untouched."
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
    "blurb": "Bright tenor that climbs into a ringing head voice; clean onsets, no rasp anywhere.",
    "technique": "Everything about the sound is clean: precise entries with no scoop and no rasp anywhere, vowels kept tall and bright, vibrato even when it appears at all. Large interval leaps happen without an audible gear change, chest lifting into a ringing head voice that holds its brightness up to E5. Take On Me shows that head-voice top plainly. Grabbing at the leaps instead of placing them lands you under pitch."
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
    "blurb": "Soft-grained baritone, unusually clean diction, vibrato held back until a phrase ends.",
    "technique": "Pressure is the enemy of this sound. Air arrives just ahead of tone, giving a soft, felt-covered attack, and consonants are articulated with the tongue tip rather than the jaw, which keeps the line unbroken. Vibrato is withheld through the body of a note and released only as it decays. To get near it, sing quieter than feels safe and resist the urge to darken the vowel."
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
    "blurb": "Small airy soprano, head-voice dominant, folk-style straight tone with gentle vibrato.",
    "technique": "Head voice dominates even through the middle, small and airy, with a folk-style straight tone that only blooms into gentle vibrato at the ends of phrases. Onsets are soft, consonants light, and the F3 floor is nearly spoken. Her belt at E5 stays slim and forward rather than thickening into chest. Loading weight underneath it to make the sound carry defeats the intimacy, which depends on staying quiet and steady on the air."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Heart of Gold",
    "lowSource": null,
    "highSource": null,
    "blurb": "Thin, nasal high tenor with heavy vibrato; sits near the top of his range for most of a song.",
    "technique": "Most of a song lives in a narrow band near the top of the range, which is why the sound reads as thin and nasal. The larynx stays light, the tone never thickens, and a fast, breath-driven vibrato wobbles through sustained notes. Attacks are gentle and slightly under pitch before settling. The fragility is structural rather than incidental: add chest weight or volume anywhere in that band and the reedy quality the whole style rests on disappears."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Feeling Good",
    "lowSource": null,
    "highSource": null,
    "blurb": "Contralto with an unusually deep floor; speech-into-song delivery, pianist's sense of time.",
    "technique": "Start from speech. Lines begin at conversational pitch and swell into sung tone, often with no vibrato at all until a long note has been held well past comfort. The floor of the range is unusually low for this voice type, and those low notes are placed heavily, almost spoken. Time is elastic: phrases arrive early or late against the accompaniment on purpose. Copying it means committing to the deliberate pace, not to volume."
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
    "blurb": "Breathy alto that stays mid-range: soft onsets, little vibrato, country-tinged slides.",
    "technique": "Air is part of the sound. Onsets are aspirate, the tone stays warm and unpressed through the middle of the range, and vibrato is close to absent. The ornament habit is a short slide up or down into a note rather than a run, and nothing above C5 is asked for. The trap is confusing breathy with unsupported: the breathiness only works over steady airflow and firm ribs."
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
    "blurb": "Clear light tone with soft onsets and almost no rasp; relies on pitch accuracy over power.",
    "technique": "Clarity does the work here. Onsets are soft and slightly breathy, the tone carries no rasp at all, and the transition into head voice is smoothed over so completely that the seam is hard to hear. A light vibrato usually waits for the end of a sustained note. Pitch lands dead center with only small country-style bends into a few words. Nothing is belted. This is a sound built by taking effort away rather than adding it, and too much air is what turns clear into foggy."
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
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "drivers license",
    "lowSource": null,
    "highSource": null,
    "blurb": "Conversational verses that snap into a deliberately strained, edge-heavy belt on the choruses.",
    "technique": "Contrast does the work. Verses sit near speech, with fry on the low notes and almost no vibrato, then choruses snap into a tight, edge-heavy belt around E5 with an audible cry in it. Onsets scoop up from underneath and consonants get chewed for attitude. That strain is shaped, not accidental. Students reproduce the sound by genuinely squeezing, which is a different thing: the cry comes from a narrowed vowel over firm support."
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
    "blurb": "Raspy, pushed baritone that stammers and repeats phrases to build pressure.",
    "technique": "A thick baritone driven hard, with rasp riding on top of the tone rather than replacing it. Onsets are often glottal, words get stammered and repeated to build pressure, and lines push slightly ahead of the beat so the band sounds like it is chasing the singer. The top of the range is shouted, not floated. The grit is not throat scrape; it comes from breath compression and bright forward vowels, and it should never hurt."
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
    "blurb": "Thin nasal tenor with a pleading edge; narrow span, but the timbre cuts through dense guitars.",
    "technique": "Narrow span, unmistakable colour. The placement is thin and nasal with a pleading upward edge, and it cuts through thick guitars precisely because it is not big. Notes get scooped into from below, vibrato is slow and shallow, and sustains stay level in dynamic rather than swelling. With nothing reaching past D5, the character lives entirely in timbre and phrasing. Students overweight it and lose the whine that makes it read."
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
    "blurb": "Grainy tenor with stage-trained support; opens from near-whisper into a wide, ringing high belt.",
    "technique": "He builds a phrase with dynamics rather than with extra notes. Lines begin near a whisper, grainy and slightly compressed, then open gradually into a wide belt that rings around B4, with a slow vibrato arriving only after the note settles. Consonants stay soft so the crescendo carries the feeling. Wild Flower runs that whole climb from near-silence up to full voice. Start at the loud end and there is nowhere left to go."
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
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "Love Is a Battlefield",
    "lowSource": null,
    "highSource": null,
    "blurb": "Trained placement applied to hard rock; clean cutting mid belt with a fast, narrow vibrato.",
    "technique": "Every onset lands exactly on pitch with no scoop, and the vibrato is narrow and quick, closer to a classical rate than a rock shout. Placement stays forward, which is how a belt around G5 cuts through a wall of guitars without extra volume. Above that the tone lightens rather than thickens. The pitch precision is the whole effect; rasp layered over it just blurs the line."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Crazy",
    "lowSource": null,
    "highSource": null,
    "blurb": "Warm contralto with a controlled sob on held notes and heavy, deliberate slides between them.",
    "technique": "Weight sits in the chest register for most of the range, with slow, heavy portamento carrying you between notes rather than clean intervals. Vibrato arrives late on a sustained tone, often preceded by a small catch that reads as a sob. Toward D5 the sound thins gently instead of belting. Overdone, that catch turns into a wobble; it works as one placed break inside an otherwise steady line."
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
    "blurb": "Church-powered soprano with a piercing belt, abrupt octave leaps, and long sustained upper notes.",
    "technique": "Ring carries further than volume here. The belt up toward Bb5 keeps a narrow, bright core even as the vowel spreads wide open, and shouting toward it only sends the pitch sharp and locks the throat. Octave leaps land clean, with the breath set before the jump rather than scooped into from below. Sustains run long, and the vibrato widens the longer the note is held."
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
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Don't Cry for Me Argentina",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark chest-dominant belt, wide vibrato, and a consonant-heavy attack that lands every syllable.",
    "technique": "Everything begins with the consonant. Hard t's, d's and s's set the rhythm before the vowel arrives, and the tone underneath is dark, thick, low-placed chest carried all the way to the D5 belt. Vibrato is wide and slow, more a shudder than a shimmer. Phrases stretch and compress against the accompaniment instead of sitting square on it. The common error is mistaking that weight for volume and simply shouting; the size comes from a low, settled larynx and a very full breath."
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
    "blurb": "Flexible tenor that shifts from soft crooning to a hoarse rock shout inside the same song.",
    "technique": "Two settings live in one voice: a light, nearly vibrato-free croon with soft aspirate onsets, and a hoarse open-throated shout he switches to without warning. The quiet mode is genuinely smooth, pitch-centered, no scooping. The shout brightens and flattens the tone and rides high toward E5. That mode draws all the attention, but the quiet one is the harder skill and the one carrying most of the material."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "The Sound of Silence",
    "lowSource": null,
    "highSource": null,
    "blurb": "Light, even tenor that stays conversational and slips into thin falsetto rather than pushing chest.",
    "technique": "Conversational is the operative word. Onsets are soft and breath-led, the volume barely changes across a verse, and diction stays crisp enough that every consonant reads. Around the upper limit he thins out and releases into a light falsetto instead of driving chest weight up. Vibrato is narrow and arrives late, if at all. Singers imitating this tend to add power at exactly the point where he takes it away, which flattens the intimacy."
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
    "blurb": "Dark chesty baritone, flat and declamatory; sits near speech pitch with almost no vibrato.",
    "technique": "Almost none of this leaves speech territory. The voice is dark and thick-cored, delivered flat and declamatory, with hard glottal onsets and very little vibrato to soften a held note. Lines stay inside a narrow working band and lean on rhythm and consonant weight for emphasis instead of pitch movement. Toward G4 the sound gets tighter and louder rather than lighter, and the phrase usually ends before the note has to bloom."
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
    "blurb": "Grainy tenor that stays conversational down low, then shoves into a shouted chest top.",
    "technique": "Down low the delivery stays conversational, nearly spoken, with breathy onsets and hardly any vibrato. Climbing into the top he stops blending and shoves, and the sound turns grainy and shouted with the vowel spread wide. Dynamics swing hard between those two states. Singers copying this start loud and leave themselves nowhere to go — the quiet, deliberately under-supported verses are what make the top of the chorus land."
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
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Easy Lover",
    "lowSource": null,
    "highSource": "Reasons",
    "blurb": "Baritone speaking range under a penetrating falsetto that carries entire lead vocals.",
    "technique": "Note the gap: a chest belt topping out near B4 under a range extending to D6. Everything high is a pure, penetrating falsetto that carries full lead lines and sustains without wobble, not a chest note. Tone up there is clean and almost boyish, with fast even vibrato on held notes and a genuinely low speaking register underneath. The usual error is trying to belt those pitches in chest, which strains and still sounds nothing like it."
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
    "blurb": "Gritty mezzo with rock distortion; belts from a low placement instead of lifting into a lighter mix.",
    "technique": "You can hear grit in the tone at every volume, made with a low, chesty placement rather than a lifted lighter mix, so the belt around F5 feels pushed up from underneath. Attacks are hard and often slightly scooped, and vibrato arrives late, at the tail of a long note. Because the placement is low, this is the hardest belt to copy: with shallow breath support the whole thing collapses into a shout by the second verse."
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
    "blurb": "Warm spinto weight and long phrases; later took baritone roles, extending his usable low register.",
    "technique": "Weight is the first thing you hear: a thick, warm middle that keeps its size all the way down toward A2. Breath and tone arrive together, so nothing sounds struck. Phrases run long, crossing bar lines with no obvious refill. The vibrato turns over more slowly than a light lyric tenor's, and the approach to C5 stays covered and muscular. Imitators carry all that weight into the top and run out of air before the phrase ends."
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
    "country": "USA",
    "activeFrom": 1978,
    "lowMidi": 40,
    "highMidi": 83,
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Purple Rain",
    "lowSource": null,
    "highSource": null,
    "blurb": "Switches between smoky chest voice, piercing falsetto, and screams well above the staff.",
    "technique": "Registers get swapped like guitar tones: a smoky, half-spoken low voice, a chesty belt up around E5, a piercing thin falsetto, and screams above that reaching toward B5. Consonants are clipped and placed exactly on the sixteenth-note grid, so the vocal doubles as a rhythm part. Vibrato is minimal until a note is held on purpose. Beginners chase the scream first, before the low conversational register and the rhythmic precision that make it land."
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
    "blurb": "Baritone-weighted tenor with rock grit; carries chest colour higher than most legit theatre tenors.",
    "technique": "The instrument sits low and heavy for a tenor: a thick bottom reaching down to G2, and that same dark chest colour carried up through the Bb4 belt rather than lightened into a legit tenor mix. Grit is applied selectively, on the attack of one important word, then dropped again. Vibrato is broad and slow. Phrases build across a long line instead of arriving at full size. Without deep support underneath, carried chest of that weight collapses into plain pushing."
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
    "blurb": "Round, resonant baritone with long downward slides and a heavy drawl on line endings.",
    "technique": "Resonance is low and round, the sound sitting behind the teeth rather than up in the nose. Long downward slides finish most phrases, and diphthongs get drawled so the second vowel becomes its own small note. Vibrato is narrow and arrives late, when it arrives. Take on the drawl and the pitch tends to sag with it; every slide still has to land on a definite note instead of trailing away."
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
    "blurb": "Gospel-schooled tenor with a rough edge, bending pitch and dragging behind the beat on purpose.",
    "technique": "Nasal-forward, grainy tone that keeps a cry in it even at low volume. Notes get approached from underneath, bent through the blues third, then released with a narrow, quick vibrato that only shows up at the end of a phrase. Words sit behind the beat on purpose. Above the A4 belt the sound tightens instead of opening out. Students copy the rasp by squeezing the throat; the grit belongs in the tone, not in the grip."
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
    "blurb": "Oklahoma twang over a strong chest belt; breaks into a deliberate cry at the top of phrases.",
    "technique": "Twang does the work up front: a bright, narrow, forward vowel that keeps the belt from sounding heavy. Chest-weighted mix carries confidently to about D5, and above that toward F5 the sound releases into a thinner cry rather than more push. Consonants are crisp, and line endings often break upward into that cry on purpose. Shouted from the throat, the belt spreads and tires fast; the narrow vowel is what makes it carry."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Fidelity",
    "lowSource": null,
    "highSource": null,
    "blurb": "Elastic delivery that switches between clipped staccato, trills, and thin squeaks at the very top.",
    "technique": "Delivery is elastic and percussive: clipped staccato syllables, sudden trills, rolled and over-pronounced consonants, and thin squeaks right at the top of the range. Glottal stops and small hiccup accents fall on unexpected beats, treating the voice as a rhythm instrument alongside the piano. The tone itself is bright and unforced. The frequent misread is treating these noises as decoration; they are rhythmic events, and imitating them without locking the timing makes the whole thing sound arbitrary."
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
    "blurb": "Silvery lyric soprano with a soft-edged onset and heavy use of floated, breath-mixed high notes.",
    "technique": "Aspirate onsets, notes approached from slightly under, and a fast shallow vibrato that arrives a moment after the tone begins: every edge is softened. Upper notes are mixed with breath and floated rather than driven, which produces the silvery quality. Students hear the breathiness and imitate only that, losing the firm core beneath it. The airiness is a color laid over a supported tone, not a replacement for one."
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
    "blurb": "Dark, resonant baritone with steady vibrato; the tone reads far older than the records.",
    "technique": "What catches people out is the weight: a dark, low-larynx baritone with full chest tone, and a wide, even vibrato running through nearly every sustained note. Lines begin firm and legato with almost no breath in them, and the D5 top stays connected instead of flipping. Nothing is rasped or scooped, so that vibrato carries most of the interpretive work by itself."
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
    "blurb": "Grainy pop tenor with a short usable top; leans on rhythm, shouts and falsetto flips.",
    "technique": "Grain in the tone does a lot of work, because the comfortable belt stops around A4 and C5 is the ceiling. Rather than climbing past that he leans on rhythm: short barked phrases, spoken interjections, and quick flips into falsetto for anything above the break. Vibrato stays minimal. The hooks are written low on purpose, so taking them in full chest only produces strain when the energy is meant to come from attack and groove."
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
    "blurb": "Nasal-forward mezzo with clipped consonants; strongest in a smoky lower-mid rather than up high.",
    "technique": "Most of the character lives from B2 up through the middle of the staff: a smoky, nasal-forward tone with very little vibrato and consonants cut short. Phrasing is percussive, notes clipped and set tight against the drum rather than sustained. Where the line does rise, the tone stays narrow instead of opening out. Singers imitating this usually add vibrato and legato, which erases the flat, spoken quality that makes it land."
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
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Breaking the Law",
    "lowSource": null,
    "highSource": "Painkiller",
    "blurb": "Moves from gritted chest snarl into piercing falsetto shrieks with almost no audible seam.",
    "technique": "The gap between the D5 belt and the C6 top is the whole map of this voice. Below it, gritted chest tone with hard consonant attacks and a snarl layered onto an already supported note. Above it, he releases into a thin, piercing falsetto and rides it, so the shriek carries without weight. Most singers try to muscle that top note in chest, and the line gives out before the verse is over."
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
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Whole Lotta Love",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bluesy tenor with a bright, nasal-forward top and heavy vibrato; leans on falsetto wails above the belt.",
    "technique": "Everything sits forward and high in the mouth, thin at the edges rather than round, with vibrato that comes on fast and wide almost as soon as a note lands. Blues bends and slurred approaches replace clean onsets. Above the E5 belt he releases into a ringing falsetto wail instead of pushing. Students usually try to muscle those cries in chest and end up squeezing the throat shut."
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
    "blurb": "Sandpaper rasp from a breathy onset; sits mid-range and pushes volume rather than height.",
    "technique": "The rasp comes off a breathy onset: air first, tone second, which frays the edge of every word. He works a narrow middle band and finds intensity through volume and grit rather than altitude, topping out around A4 before the C5 goes thin. Phrases sit slightly behind the beat and the ends fall away rather than resolving. Grinding the throat to copy the texture gets you hoarse in a verse; it is aspirate, not squeezed."
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
    "blurb": "Chest-dominant tenor: thick midrange, gravel on the push, screams sung on the belt rather than falsetto.",
    "technique": "Weight stays in the chest as the line climbs, so the tone thickens rather than thinning on the way to C5. Onsets are hard and often shouted, and the grain shows up only when he pushes harder: controlled distortion riding on a supported tone, not a rasp laid over the top. Vibrato is slight. The grit comes last in the learning order; grab it first and the second chorus is gone."
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
    "blurb": "Chest-dominant power, fast narrow vibrato, vowels stay focused even at full volume.",
    "technique": "Chest voice carries nearly everything here, with vowels kept small and focused so the tone stays clear at full volume. Vibrato is fast and narrow, and it starts almost as soon as a note lands rather than blooming late. Attacks are clean instead of scooped, and phrases end deliberately rather than trailing off. Copying it usually goes wrong in the jaw: singers open too wide, the tone spreads, and the pitch centre slides."
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
    "country": "Spain",
    "activeFrom": 2017,
    "lowMidi": 53,
    "highMidi": 82,
    "beltMidi": 78,
    "whistle": false,
    "signatureSong": "Malamente",
    "lowSource": null,
    "highSource": null,
    "blurb": "Flamenco-trained melisma: glottal attacks, microtonal bends, light and agile up top.",
    "technique": "Flamenco training shows in the attacks, which are hard and glottal, and in long melismatic runs that bend between notes instead of stepping cleanly, ornaments sitting a quarter-tone off before they resolve. A slight rasp runs through the middle, while the top near F#5 stays agile and light rather than thickening. Vibrato is often withheld, then added at the very end of a held note. Round those microtonal bends into ordinary scale tones and the idiom vanishes."
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
    "blurb": "Reedy, slightly nasal soprano with wavering vibrato; prefers an airy top to full-chest volume.",
    "technique": "Two things define it: a reedy, slightly nasal core, and a vibrato that wavers wide and a little unevenly, arriving early on sustains. Instead of pushing chest she lets the top go airy and translucent, so the E5 belt reads as intensity rather than volume. Consonants are soft, vowels narrow. That wobble is not a shake made in the throat; it comes from loose, unpressed airflow, and shaking for it produces a different sound entirely."
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
    "blurb": "Operatic tenor that swells from a soft low murmur to full-voice high notes with no audible break.",
    "technique": "Rather than belting, he crescendos. A phrase can start nearly murmured down low and grow through the transition with no audible seam, so the top near E5 arrives as ringing head voice instead of a shout — the long build in Running Scared is the clearest example. Vibrato stays narrow and quick, legato unbroken. The tone tilts lighter as it rises instead of thickening, which is why nothing jams up at the passaggio and the climb reads as one line."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Cigarettes and Chocolate Milk",
    "lowSource": null,
    "highSource": null,
    "blurb": "Operatic-leaning tenor with wide vibrato and long legato lines; a nasal ring through the upper mix.",
    "technique": "Vibrato is wide and slow, closer to a recital voice than a pop one, and it runs through most sustained notes rather than arriving at the end. Vowels stay tall and connected, so phrases move in long legato with audible portamento between pitches, and a nasal ring brightens the upper mix. Sitting toward the top of the range, the tone narrows rather than thickens. That ring is a product of resonance and vowel shape, not volume, so it stays audible in quiet passages too."
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
    "blurb": "Bright, compact soprano with breathy onsets and a light belt she rarely pushes to full volume.",
    "technique": "Small and bright, and kept small on purpose: breathy onsets, a light belt around E5 that rarely opens to full volume, and plenty of near-spoken asides tucked between sung lines. Timing is playful, syllables pulled late or delivered flat and dry for a wink, and what vibrato there is stays decorative. The tone is compact rather than big, so the skills it actually asks for are control at low volume and crisp consonants."
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
    "blurb": "Restrained contralto: narrow range, level dynamics, straight tone with vibrato barely used.",
    "technique": "Restraint is the technique. Dynamics stay level, tone stays straight, and vibrato is applied so lightly you catch it only at the very end of a phrase. Onsets are soft and unaspirated, vowels rounded and cool, and lines stay inside a narrow working band without reaching for a climax. Melisma is rare. Nothing gets added that the line does not ask for, which is why extra volume or decoration reads immediately as wrong."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Madan",
    "lowSource": null,
    "highSource": null,
    "blurb": "Reedy high tenor with a nasal cutting edge; melismatic lines and sustained calls near the top.",
    "technique": "Nasal, reedy placement gives this high tenor its cutting edge; the tone is thin by design, not by weakness. Lines run melismatic, decorated with fast turns and slides, and the upper register rides on that narrow forward placement instead of on chest weight. Sustained notes near the top act as calls, held straight before any vibrato shows up. Warming and covering the vowels loses the edge that lets the voice cut through a band."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "A Change Is Gonna Come",
    "lowSource": null,
    "highSource": null,
    "blurb": "Clean gospel-trained tenor; yodel-like turns and easy legato instead of grit.",
    "technique": "Clarity does the work here: even airflow, clean onsets, and long connected lines with almost no rasp. The signature move is a yodel-like turn that hops briefly into a lighter register and back inside a single syllable, used as punctuation at the end of a phrase. Vibrato is even and modest. Reaching for grit to sound soulful is backwards here; the feeling comes from pitch accuracy, breath control, and where the turn lands."
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
    "blurb": "Light, vibrato-rich voice that lives in a high tenor mix and floats up in pure falsetto.",
    "technique": "Light-weight tone that mostly lives high in a thin mix, so the G2 floor of this range almost never turns up in an actual song. Onsets are soft and aspirate; sustained notes take a quick, narrow vibrato that starts early and keeps going, and pushing weight into that mix to make it bigger flattens the flutter it depends on. Above the Bb4 belt the voice releases into an unmixed falsetto kept deliberately quiet, with melisma slow enough to hear every note in it."
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
    "blurb": "Classically schooled soprano with a bright forward top and clean sustained highs at full volume.",
    "technique": "Everything points to classical placement: steady breath support underneath, a bright forward ring, and sustained notes near C6 taken at full volume without thinning. Vibrato is present from the moment the tone starts, even and narrow. Legato lines get shaped as one long arc instead of word by word. The support has to come first, since high sustains expose breath that was snatched rather than set up."
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
    "blurb": "Thin, breathy classical-pop tone; stays in head voice up top rather than carrying chest weight.",
    "technique": "Thin, airy and head-voice dominant, with no chest weight carried up past the middle. Onsets are aspirate, and vibrato is light, often late, sometimes withheld altogether for a straight tone. Vowels stay bright and compact, which is what lets the top of the range float, as it does through The Phantom of the Opera. Treat this material as belting and the quality goes at once. It depends on staying light exactly where the instinct says push."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Angel",
    "lowSource": null,
    "highSource": null,
    "blurb": "Clear soprano with an airy top and long, steady sustains; shapes lines rather than adding runs.",
    "technique": "Long, even sustains define this, held on steady air with the tone clear and slightly airy in the upper range. The register transition is smoothed rather than featured, so a line can climb without any audible gear change. Vibrato arrives late and stays narrow, and ornaments are almost absent; shape comes from crescendo and vowel color instead. These melodies are built to be carried straight through, and runs laid on top of them only add clutter."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Misty",
    "lowSource": null,
    "highSource": null,
    "blurb": "Operatic weight low down, controlled vibrato, a top she floats onto instead of pushing.",
    "technique": "Weight is the first thing to notice — the bottom of the range is genuinely dark and covered, closer to a trained contralto than a band singer. Vibrato is wide but metered, switched on and off deliberately. Rather than pushing toward C6 she lightens and floats, then drops back into chest inside a single phrase for contrast. The common mistake is manufacturing that darkness by pressing the larynx down; it comes from space, not force."
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
    "blurb": "Baritone bottom with a bright high mix; percussive consonants anchor a cappella arrangements.",
    "technique": "A baritone bottom that anchors a stack, then a bright forward mix up to the C5 belt whenever the lead line comes around. Consonants get cut percussively so rhythm reads in an unaccompanied texture, and vowels are matched tightly to whoever sits next in the harmony. Vibrato stays controlled, mostly held back until the end of a phrase. Sing it with a wide vibrato and the chord blurs."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Interstate Love Song",
    "lowSource": null,
    "highSource": null,
    "blurb": "Croon-to-snarl baritone, often filtered through a megaphone; leans on slides into the note.",
    "technique": "Low phrases are crooned close to the mic, then the same line hardens into a snarl as it climbs toward C#5. Pitches get approached from underneath with an audible slide, and vibrato, when it comes at all, is narrow and quick. Overdone, that scoop makes every note arrive late; the slide should finish before the beat rather than on it, so the target pitch is already there when the syllable lands."
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
    "beltMidi": 72,
    "whistle": false,
    "signatureSong": "18 and Life",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rasp-heavy high tenor that sustains fifth-octave belts, then slips up into scream falsetto.",
    "technique": "Rasp is baked into the tone rather than added at the ends of phrases, sitting on a high tenor that holds a sustained C5 belt and then slips upward into a scream that is really reinforced falsetto. Vibrato is wide and arrives late, after the note has been held straight for a beat or more. Students go for the scream cold. It only works launched from an already connected, well-supported belt."
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
    "blurb": "Bright mezzo with a thick lower-middle and plain, unornamented cumbia phrasing.",
    "technique": "The lower middle carries real weight and stays undecorated, which is why cumbia lines land so squarely on the beat. Onsets are clean; vibrato is light and arrives late in a sustain rather than at the start. Up to the F5 belt the tone stays chesty and forward, and above it she thins into a lighter head voice. Piling runs onto these melodies erases the plainness they were built on."
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
    "beltMidi": 71,
    "whistle": false,
    "signatureSong": "Chop Suey!",
    "lowSource": null,
    "highSource": null,
    "blurb": "Operatic-leaning baritone with fast register jumps, trills, and pinched nasal placement.",
    "technique": "Wide leaps between a heavy chest bottom and a pinched, bright head tone happen fast and land exactly on the beat — the theatrics are metrically strict. Add trills, staccato glottal attacks, exaggerated vowel shapes, and syllables fired at speed. Copy the character and the rhythm is the first thing to go. The full-voice ceiling sits near B4; everything above it is deliberately narrow and forward rather than powered."
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
    "blurb": "Very deep gravel bass-baritone used percussively; half-spoken toasting, few sustained pitches.",
    "technique": "Rhythm and texture do nearly everything here. The voice works as a percussion instrument: half-spoken toasting, very few sustained pitches, and a gravelly bottom that stays close to the microphone instead of projecting. Onsets are dry and consonant-driven, and the top of the stated range barely gets used. The usual mistake is pushing volume to find the depth — the depth comes from a relaxed low placement and a quiet, close delivery."
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
    "blurb": "Nasal-edged chest voice with a fast natural vibrato and Arabic-inflected melisma.",
    "technique": "Nasal placement is the whole sound — the tone stays forward and slightly pinched, which lets a fast, narrow vibrato ride on a chesty middle. Ornaments come from Arabic-style melisma: quick microtonal slides and trills threaded between beats. Above the E5 belt she flips into a light, hooty upper register rather than pushing. Students chase the buzz by squeezing the throat, but that buzz belongs in the mask with the larynx loose."
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
    "blurb": "Bright mezzo with a clipped percussive attack, slipping into a thin upper register on hooks.",
    "technique": "Attack is percussive and clipped, consonants working as rhythm, phrases cut off early rather than held out. Chest mix belts comfortably to about C5, and above that toward E5 the tone deliberately thins on hook notes for contrast. Vibrato is light and used sparingly. Smooth all of it into a legato line and the rhythmic snap the whole delivery is built on drains away."
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
    "blurb": "Light airy soprano with straight-toned sustains; keeps weight out of the upper register.",
    "technique": "Weight stays out of the top. Onsets are breathy, sustains are largely straight-toned with a narrow vibrato easing in near the end, and the upper register floats instead of pushing. Size comes from resonance and the space around the voice, not from chest weight carried upward. Mixing in more chest to make it bigger thickens the tone and loses the light, hovering quality the style is built on."
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
    "blurb": "Nasal tenor with a tight, compressed mix; rasp creeps in on sustained upper notes.",
    "technique": "Placement is high and nasal, with a compressed, narrow mix that keeps the B4 belt sounding tight rather than open. Notes start clean, the vibrato shallow and late, and rasp shows up only after a note has been held a while. Toward E5 the sound thins rather than opening out, and that nasal placement is the only thing keeping it audible at such a small size."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Only Happy When It Rains",
    "lowSource": null,
    "highSource": null,
    "blurb": "Smoky low contralto, half-spoken in the verses, opening into a flat, cool-toned belt.",
    "technique": "Smoke and breath fill the low third of the voice, half-spoken through verses, consonants sneered rather than articulated cleanly. The lift into a chorus adds volume and brightness but keeps the same cool, uninvested affect, and vibrato stays minimal by choice. Warm it up with swell and emotion and the detachment that makes the delivery land goes with it."
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
    "beltMidi": 80,
    "whistle": false,
    "signatureSong": "Chandelier",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rasp-heavy belt that frays by design; wide vowels and long notes held high in full voice.",
    "technique": "Rasp is the signature and it is loudest at the top, where notes around Ab5 are held in a wide, open vowel until the tone frays. Onsets often scoop up from below, and the vibrato is broad and late, sometimes replaced by a deliberate crack. Chandelier shows that held, splintering belt clearly. Producing the grit with throat friction wears a voice out inside one chorus; it has to ride on strong, steady airflow."
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
    "blurb": "Lyric soprano with a floated top and easy pianissimo; even vibrato through the passage.",
    "technique": "Steady, unhurried air does all the work here, and it is what lets the very quiet high notes stay in tune and keep their vibrato. Through the passage between registers the tone does not change weight or colour, so nothing pushes and nothing thins, and the top of the range floats rather than projects. Onsets are soft and exactly on pitch. Singers chasing this hold the breath back to get quiet, which stops the vibrato and lets the note settle flat."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Nothing Compares 2 U",
    "lowSource": null,
    "highSource": null,
    "blurb": "Whisper-to-cry dynamics inside a few bars; a clear tone that breaks into hard rasp at full volume.",
    "technique": "The range of dynamics inside a couple of bars is the technique. A phrase can start as a breathy near-whisper with the tone barely engaged, swell into a clear, straight mezzo, then fracture into hard rasp at the top of the crescendo. Cracks and breaks are placed, not accidental. Vibrato is scarce, arriving only at the end of a held note. Beginners start at full volume and leave themselves nowhere to go, which removes the entire shape."
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
    "blurb": "Feathery high tenor; falsetto entries so smooth the register change is hard to hear.",
    "technique": "The whole line rides on very little air pressure, feathery and placed well forward. The crossing into falsetto is blended so smoothly you hear a change in color rather than a break, which takes a steady breath and a resistance to getting louder as the line rises. Phrases arch long and stay legato, with a small vibrato appearing only at the end. Trying to add volume at the transition is the fastest way to make the seam audible."
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
    "blurb": "Trained soprano who stacks a supported high belt under a whistle register used as melody, not effect.",
    "technique": "A belt sitting as high as C6 only holds because the breath under it is doing the work: larynx steady, vowel open, vibrato even and classical in width, no thinning into a scream. Above that, the whistle register works as a usable part of the instrument rather than a stunt, entered cleanly, held in tune, phrased like melody. The order matters. Whistle is the part people try to copy first, and the part that depends most on everything underneath it."
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
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Don't Stop Believin'",
    "lowSource": null,
    "highSource": null,
    "blurb": "Smooth tenor with an R&B bend to the phrasing; the mix stays connected right through the top of the belt.",
    "technique": "The seam between registers is the thing to study: the mix stays connected right through the E5 belt with no audible gear change. Onsets are clean and pitch-centered, then vibrato arrives a beat or so into the note, even and moderate in width. Phrasing borrows from R&B, with small bends, delayed entries and a cry inside the vowel. Volume is the wrong lever here; the tone comes from narrowing the vowel and holding the larynx steady."
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
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Dream On",
    "lowSource": null,
    "highSource": null,
    "blurb": "Raspy high tenor built on screams and blues bends; top notes arrive as distorted cries, not clean tone.",
    "technique": "Rasp is present at nearly every volume, sitting on top of a bright forward tone rather than replacing it. Phrases slide into pitch from below and often flick upward at the end. Above the E5 belt the sound turns to distorted cry and screamed falsetto instead of clean tone. Blues bends and quick melisma fill the gaps. The grit is layered over real support; produce it in the throat and you get noise."
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
    "blurb": "Husky breath-driven alto in a narrow working band; wide vibrato, almost entirely chest voice.",
    "technique": "Breath is part of the tone, not a flaw in it: air rides through every note and creates the huskiness. Onsets are soft, consonants get swallowed, and phrases lean slightly behind the beat. Vibrato is wide and slow, and it usually arrives late in a sustain. Everything sits in chest voice inside a narrow band, so colour has to come from texture. The instinct is to tighten the throat to manufacture that texture, when the sound depends on staying loose."
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
    "beltMidi": 76,
    "whistle": false,
    "signatureSong": "Superstition",
    "lowSource": null,
    "highSource": null,
    "blurb": "Nasal-forward tenor with gospel melisma; slides from chest into a bright, controlled falsetto.",
    "technique": "Sound sits high and forward, buzzing in the mask, which is why it cuts through a horn section without much volume. Notes are usually approached from underneath with a quick scoop, and vibrato shows up only at the tail of a long note. Chest carries to roughly the belt around E5; everything above that is a thin, deliberate falsetto reaching toward E6. Copying the nasal buzz and the runs without the rhythmic placement misses where the phrasing actually lives."
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
    "blurb": "Reedy, narrow tenor with clipped phrasing; takes upper notes in a strained mix, not a full belt.",
    "technique": "Reedy and narrow, placed forward and slightly nasal, with consonants clipping the ends of phrases short. Rhythm is the real tell: syncopated, pushed off the downbeat, percussive more than legato. Above B4 he moves into a tight, strained mix, so the sustained upper notes in Roxanne read as pressed rather than fully belted. That audible tension belongs to the sound; smoothed out into an even legato, the voice stops being recognizable."
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
    "blurb": "Bright mixed belt with comic timing built into the phrasing; sustains high notes without hardening.",
    "technique": "Comic timing is built into the singing rather than layered on afterwards: words land early or late against the beat, and a line can drop to speech and back inside a single phrase. The belt is a genuine mix instead of pure chest, bright and forward and light enough that sustaining near F5 neither hardens nor spreads. Onsets are clean, vibrato modest and late. Chesting the belt for extra volume locks the top and removes the flexibility the timing needs."
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
    "blurb": "Breathy, conversational tone that slips between speech, soft belt, and thin airy top notes.",
    "technique": "Nearly everything happens at conversation volume, breath left in the tone, phrase ends trailing off into speech or a whisper. Rhythm floats: syllables land late, then hurry to catch up. The soft belt around C5 is as loud as it gets, and above that the sound thins into an airy head voice instead of getting stronger. Small bends and slides do the job vibrato would normally do. Project it and the style disappears."
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
    "blurb": "Raspy R&B tenor built on melisma, tight vibrato and a falsetto he flips into mid-phrase.",
    "technique": "The rasp rides on top of a supported tone; it is surface texture, not a scrape at the cords. Phrases carry short melismatic turns and bends that land a hair behind the beat, and the vibrato is fast and narrow. At the top of the B4 belt he flips into falsetto mid-word, then drops back into chest without resetting the phrase, a move that recurs through Eyes, Nose, Lips. Manufacture the rasp in the throat and pitch center is the first thing to go."
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
    "blurb": "Nasal-bright soprano with compact vibrato; her belt stays thin yet cuts through dense mixes.",
    "technique": "What cuts through an arrangement here is placement, not size. The tone rides forward with a nasal brightness, vibrato compact and quick, attacks clean and unaccented. Her belt around F5 stays narrow, more ring than weight, which is why it sits over a dense mix without shouting; above it she thins to head voice. Meet a loud track with added chest weight and the vowel thickens, burying the brightness that made the line audible."
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
    "blurb": "Mezzo who uses her own register break as a teardrop catch at the ends of lines.",
    "technique": "The register break is not hidden, it is used. Phrases build in chest, then at the end of a line the voice deliberately cracks up into a lighter register for a beat, the teardrop catch. Otherwise the tone is warm and even, with moderate vibrato and slow, weighted slides. Get this wrong and you crack randomly mid-word; the catch has to be placed, in the same spot in the phrase every time."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Nemo",
    "lowSource": null,
    "highSource": null,
    "blurb": "Classically placed soprano over distorted guitar: covered vowels, vibrato-rich head voice.",
    "technique": "Classical habits stay intact over distorted guitar. Vowels are covered, the larynx sits low and settled, and vibrato runs continuously through a whole note instead of appearing at the end of it. The tone stays covered as it climbs rather than opening out bright, and the top of the range is sung in head voice with no shout in it. Diction stays rounded throughout, and pushing chest voice too high is what costs imitators that covered colour."
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
    "blurb": "Dark, thick contralto that stays in chest; builds by adding weight rather than climbing higher.",
    "technique": "Weight, not height, is how the build happens. The voice sits dark and thick through the F5 belt, vowels kept round and back, and intensity grows by adding body and repeating a phrase rather than climbing toward the A5. Onsets are firm without being harsh, and vibrato arrives late on the sustains. The trap is shouting; add depth and breath pressure gradually and keep the larynx settled as the volume rises."
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
    "beltMidi": 74,
    "whistle": false,
    "signatureSong": "Love Story",
    "lowSource": null,
    "highSource": null,
    "blurb": "Speech-level mezzo with light breath onsets; later albums lean on a firmer, better supported mix.",
    "technique": "Delivery stays at speech level: light aspirate onsets, small vibrato that arrives late if at all, and a lot of syllables packed conversationally across the bar. The belt marker at D5 is the honest number, since power comes from consonant clarity and timing rather than height. On louder choruses the mix firms up and takes less air, but the placement never drops back into heavy chest. Copy only the breathiness and you lose pitch center, which is how this turns mumbly."
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
    "blurb": "Heavy baritone with a gravel edge; moves from near-whisper to full-throated shouting.",
    "technique": "Sheer weight is the whole instrument. With a top only around Bb4, nothing depends on high notes; the drama comes from dynamics, moving from a near-whisper to a full-throated shout inside one phrase, with gravel appearing as intensity rises. Onsets are firm and vowels stay wide and dark. Going straight to the shouting skips the quiet end, where the contrast is built, and then the loud passages have nowhere left to go."
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
    "blurb": "Gravel-heavy baritone that climbs into rasped high belts, with gospel runs on the way down.",
    "technique": "Weight first. The tone sits low and thick, closer to a speaking growl than a croon, then opens into a rasped upper range that keeps chest character rather than thinning out. Matching his volume gets nowhere near the sound, because the grit is a texture laid over a steady pitch center. Dynamics swing hard inside a single line, the wide vibrato arriving late, and descending melisma is a habit: he lands the phrase, then unspools four or five notes on the way down."
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
    "blurb": "Husky contralto sitting far lower than most pop voices; hoarse-edged tone, lazy pitch slides.",
    "technique": "Notice how low this sits: a D3 floor and a heavy, hoarse-edged middle in the region where most pop voices are already thinning. Onsets are lazy and frequently slide up into the pitch from underneath. Chest weight carries to about Bb4, above which the tone goes breathy on the way to D5. Vibrato is slow and used sparingly. Brighten the vowels or lift the placement and the huskiness goes with them."
  },
  {
    "slug": "thalia",
    "name": "Thalía",
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
    "blurb": "Light bright soprano; thin low notes, girlish forward mix carrying the upper hooks.",
    "technique": "F3 is a genuine floor and it stays quiet down there, thin rather than supported. The working sound above it is a bright girlish mix that carries hooks to about F5 without much chest weight behind them. Onsets are soft, vibrato fast and shallow, and phrase ends often lift slightly. Adding body low down is the usual miscalculation, since the character depends on staying slender with high placement."
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
    "blurb": "Light tenor with a floating falsetto and heavy melisma; keeps chest weight off the top.",
    "technique": "Chest engages to around Bb4 and stops there; everything above it floats in a soft, airy falsetto that reaches B5 without sounding pushed. The attack is always breathy, ornaments quick and constant, small three- and four-note turns closing almost every phrase. Vibrato runs fast and narrow, decoration rather than a way of sustaining. Belting those high lines is the common error, and it flattens the texture the whole style depends on."
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
    "blurb": "Light tenor that flips early into a thin, airy falsetto; small vibrato, softened consonants.",
    "technique": "Weight stays light and the flip into falsetto happens early, well below where a tenor could still push, and that early flip is the character of the sound. Breath stays in the tone, consonants soften almost to nothing, and vibrato is small and shallow. Trying to keep chest voice alive all the way to that F5 is the usual error — the top is meant to thin out and go quiet, not open up."
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
    "blurb": "Gravel-edged contralto that stays in chest voice and gets power from a hard, forward rasp.",
    "technique": "Power lives in the lower middle here, not up top. The contralto stays in chest with a gravel edge sitting right at the front of the sound, onsets are frequently growled, and phrases push and shove against the beat rather than floating over it. Approaching Eb5 the tone narrows into a hard, rasp-edged cry. That grit rides on breath pressure behind a forward, wide-open vowel, which is how it stays loud without closing the throat down."
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
    "blurb": "Grainy baritone with wide vibrato and a full-throated belt; volume rather than finesse up top.",
    "technique": "Grain and sheer size define this sound: a heavy baritone driven at high pressure, with rasp coming out of the tone itself rather than from bolted-on distortion. The vibrato swings wide and unhurried. Attacks frequently scoop up from below and then get hammered flat onto the vowel. Nearing Bb4 he leans in harder instead of thinning, so the top deliberately sounds effortful. The bulk of it is built from breath and an open pharynx, not a squeezed throat, which is why imitation tires out within a chorus."
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
    "blurb": "Unusually low contralto; dark, breathy bottom end and tight vibrato even when pushing.",
    "technique": "Most of the interest lives in the bottom third of the range, down toward Bb2, where the tone goes dark and slightly breathy without losing its centre. Onsets are aspirate, air first and pitch a moment later, and the vibrato that follows stays tight and fast even under pressure. Lines build by adding intensity rather than pitch. Higher-voiced singers attempting this jam the larynx down to fake depth and end up muffled; the colour comes from a relaxed, low speaking placement."
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
    "blurb": "Bright forward baritone that widens as it gets louder rather than thinning at the top.",
    "technique": "Here is a baritone that grows wider rather than thinner as it climbs. The tone is bright and set forward behind the teeth, the throat stays open, and loud notes gain ring instead of edge. Vibrato is steady, moderate in width, and present through the whole note. Vowels are held long and consonants clipped short. Sung with a raised soft palate this reads as bright; sung with a lowered one it collapses into nasal, which is the usual error."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Pressure Drop",
    "lowSource": null,
    "highSource": null,
    "blurb": "Rasping soul-shouter tenor; grit on every held note, pushes chest voice up until it frays.",
    "technique": "Grit is the point, and it comes from air pressure meeting a firmly closed larynx, not from scraping the throat. Chest weight gets carried high and pushed until the tone frays, which is what gives held notes their rasp. Phrasing is shouted and rhythmic, landing hard on downbeats, with short interjections dropped between lines. Nothing releases into a light head register. The imitation that fails is the one that growls with no breath support underneath."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Cornflake Girl",
    "lowSource": null,
    "highSource": null,
    "blurb": "Bright mezzo that scoops into notes and flips to airy head voice, with frequent glottal breaks.",
    "technique": "Notes are frequently approached from below with an audible scoop, and glottal catches punctuate lines like percussion. The mezzo core is bright and slightly edgy, then releases into an airy head voice up high instead of belting through. Timing floats freely against the piano, stretching and compressing phrases. The scoops are selective rather than constant, and the glottal catches are placed on purpose, which is easy to mishear as a loss of control."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Fast Car",
    "lowSource": null,
    "highSource": null,
    "blurb": "Dark contralto with a tight, buzzy edge; pushes intensity through consonants instead of vibrato.",
    "technique": "Weight sits low and dark, with a tight, buzzy edge that keeps the sound cutting rather than muddy. Intensity is delivered through consonants and through how firmly a vowel is attacked, not through volume or vibrato, which stays minimal. Phrasing locks tightly to the guitar and rarely rushes. Singers reaching for the color often drop the larynx to manufacture darkness; that thickens the tone and kills the buzz that makes the voice legible at low volume."
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Yeah!",
    "lowSource": null,
    "highSource": null,
    "blurb": "Agile pop-R&B tenor; clipped rhythmic phrasing and a light, breathy upper register.",
    "technique": "Consonants get cut short so the vocal snaps against the beat, with placement kept bright and forward. Runs are brief and rhythmic rather than long and showy, often used to fill a half-beat gap. The upper register thins out and turns breathy instead of belting, and ad-libs stack around the lead line. Imitators tend to smooth the phrasing into even legato, which drains the groove, and they hold notes that should be clipped off early."
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
    "blurb": "Dark, husky baritone that sits speech-close and thins to airy falsetto instead of pushing chest.",
    "technique": null
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
    "beltMidi": null,
    "whistle": false,
    "signatureSong": "Brown Eyed Girl",
    "lowSource": null,
    "highSource": null,
    "blurb": "Raspy tenor that repeats and stretches syllables, sliding between blues shouts and scat phrasing.",
    "technique": "Rhythm and repetition matter more than sustained tone here. Syllables get stretched, doubled, and worried at until they turn into rhythmic figures, and lines slide between a blues shout and wordless scat phrasing. The rasp comes from breath pressure against a fairly open throat, not from squeezing, and it thickens as volume rises. Phrases enter late and catch up. Because the grit rides on air instead of a tight throat, the flexibility survives the volume."
  },
  {
    "slug": "vicente-fernandez",
    "name": "Vicente Fernández",
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
    "blurb": "Open-throated ranchera tenor; full-voice top notes held long past the band.",
    "technique": "Big vowels, a settled larynx, no nasal squeeze. The sound is built from openness before anything else, with a wide slow vibrato riding the long notes. Those top notes get held well past the point where the band expects to move on, volume steady rather than tapering, and the grito lands deliberately at phrase ends as a rising shouted cry. Dragging chest weight upward instead of opening the throat first is what turns the imitation stiff and sharp."
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
    "blurb": "High sweet tenor thinning into clean falsetto; harmony-trained blend, steady even vibrato.",
    "technique": "Two registers, joined carefully. Full voice reaches about A4 with a sweet, unheavy tone, and above that the sound thins into clean falsetto toward C5 with no bump at the seam. Vibrato is even in both rate and width, tuning sits exact, and vowels are matched the way a harmony part has to match. The thing to avoid is muscling the top; it wants to get lighter as it climbs, not louder."
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
    "blurb": "Dark chesty bass-baritone pushed against a hard backbeat; almost no head-voice extension.",
    "technique": "Chest register does all the work: dark, thick, and driven straight at a hard backbeat, consonants landing on the accent. There is essentially no lighter extension above the D4 top, so lines stay low and repeat instead of climbing. Onsets are firm, close to glottal, and vibrato is minimal. Copying the darkness by dropping the jaw and swallowing the tone just makes it muddy; this sound is dark but still forward."
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
    "beltMidi": 79,
    "whistle": false,
    "signatureSong": "I Will Always Love You",
    "lowSource": null,
    "highSource": null,
    "blurb": "Gospel-trained mix with a bright forward tone; runs stay in chest weight instead of thinning out.",
    "technique": "Listen for a bright, forward placement with real thickness behind it: the tone sits high in the mask but the cords stay fully together, so a G5 belt lands with the same core as a D4. Onsets are clean and unaspirated, vibrato arrives at the tail of a held note rather than the start, and melisma keeps chest weight instead of lightening. In the final chorus of \"I Will Always Love You\" the size comes from breath speed and narrowed vowels, not from pushed volume or a clenched jaw."
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
    "blurb": "Light nasal tenor that lags behind the beat and slides into notes instead of landing on them.",
    "technique": "Almost everything here is timing. Notes arrive late, behind where the band puts them, then slide up or down into pitch instead of starting there. Tone stays light and nasal, close to speech, with very little vibrato and no push at the F4 ceiling. Copy the drag but resolve early and you land back on the beat too soon; the phrase should only catch up at the very end of the line."
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
    "blurb": "Light breathy tenor kept in a narrow band; low projection, sighing falsetto tails on line ends.",
    "technique": "Keep it small. This tenor works in a narrow band with low projection, a breathy onset, and almost no chest push; the belt tops out around G4 while the range reaches C5, so the notes above that are falsetto sighs which fade rather than land. Phrasing is conversational, landing a fraction late against the groove. The common error is singing it loudly, because volume erases the intimacy that is the entire style."
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
    "beltMidi": 81,
    "whistle": true,
    "signatureSong": "Gopher Mambo",
    "lowSource": null,
    "highSource": "Chuncho (The Forest Creatures)",
    "blurb": "Switched between growled low chest and piercing whistle-register tones inside single phrases.",
    "technique": "The trick is changing mechanism mid-phrase with no warning: a growled, rattling low chest sound, then a bright piercing tone up in whistle register, and nothing gradual in between. Vowels stay wide and open down low and clamp tight up high. Rhythm is percussive, locked to the accompaniment. Attack the whistle notes with force and they will not come, since that register needs very little air and a fully released jaw."
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
    "blurb": "Smoky bottom under a bright top; breathy onsets and clipped, jazz-leaning phrase endings.",
    "technique": "Air comes before tone on almost every onset, consonants get clipped, and phrase endings cut off early the way a horn player would take them. Below the F5 belt the sound is smoky and thick; above it the tone lightens into head voice instead of pushing. Sitting a fraction behind the beat is part of it. Belt the soft passages and it collapses; the quiet, airy delivery is carrying the whole thing."
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
    "blurb": "High keening tenor shaped by chant ornament; rapid microtonal turns and a piercing bright top.",
    "technique": "Ornament drives this voice more than sustain does. The tenor is high, bright and keening, full of rapid microtonal turns between neighboring pitches, and it tends to bend into a note rather than start cleanly on it. Chest carries to around B4; above that the sound stays piercing but narrows toward D5. Phrases finish in long calls. Flatten those turns into plain notes and the line loses everything that identifies it."
  }
];
