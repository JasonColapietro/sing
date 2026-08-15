/**
 * The vocabulary the app already uses, defined once, for free.
 *
 * Every free surface here leans on words it never stops to explain: the range
 * result names a passaggio, the studio prints cents and a sharp/flat pill, the
 * singer pages hand out "chest-dominant", "whistle register" and "tessitura" as
 * given. The chapters that actually define this vocabulary live in the two
 * books, and a glossary is the cheapest way to stop charging admission for the
 * meaning of the product's own labels.
 *
 * Rules for an entry: one sentence of definition and no advice — the rooms and
 * the books do the teaching. `where` names a surface a reader can go and see
 * the word in use, and `href` is that surface, so no term is a dead end.
 */

export interface GlossaryEntry {
  term: string;
  /** Other names a reader may arrive with. Fed to the DefinedTerm markup. */
  aka?: string[];
  /** One sentence. Definition only. */
  definition: string;
  /** Where the word already appears in the app. */
  where: string;
  /** The room or page that shows it. */
  href: string;
}

export interface GlossarySection {
  heading: string;
  /** One line under the heading, so the group is not just a bucket. */
  blurb: string;
  entries: GlossaryEntry[];
}

export const GLOSSARY: GlossarySection[] = [
  {
    heading: "Pitch and notation",
    blurb: "The units every number in the app is quoted in.",
    entries: [
      {
        term: "Scientific pitch notation",
        aka: ["SPN", "C4 notation"],
        definition:
          "The letter-and-number way of naming one exact pitch, where C4 is middle C and the number ticks over at every C rather than at every A.",
        where:
          "Every range figure in the app is written this way — your own low and high notes, and every singer's cited span.",
        href: "/range",
      },
      {
        term: "Semitone",
        aka: ["Half step"],
        definition:
          "The smallest step in Western tuning: one piano key to the next, black keys included.",
        where:
          "Song transposition is counted in semitones, and warmup scores show the semitone where your accuracy starts to drop.",
        href: "/songs",
      },
      {
        term: "Cent",
        definition:
          "One hundredth of a semitone, the unit the pitch readout uses for how far off a note landed.",
        where:
          "The studio's gauge shows cents live; under about five is inaudible to most listeners, twenty or more reads clearly as out of tune.",
        href: "/studio",
      },
      {
        term: "Sharp and flat",
        aka: ["♯", "♭"],
        definition:
          "Sharp means the note came out above the pitch you were aiming at, flat means below.",
        where:
          "The studio's two pills say which side of the target you are on while you hold a note.",
        href: "/studio",
      },
      {
        term: "Octave",
        definition:
          "The distance between a note and the next note with the same letter name — twelve semitones, at double the frequency.",
        where:
          "Your range test reports the span in octaves, and the keyboard on the result marks each one.",
        href: "/range",
      },
      {
        term: "Interval",
        definition:
          "The distance between two pitches, named by how many scale steps it covers — a third, a fifth, an octave.",
        where:
          "Ear training plays intervals and asks you to name or sing them back.",
        href: "/ear-training",
      },
      {
        term: "Fundamental frequency",
        aka: ["f0"],
        definition:
          "The rate at which your vocal folds repeat their cycle, which is the pitch a listener hears.",
        where:
          "Pitch detection estimates the fundamental from the waveform, then converts it to the nearest note plus a deviation in cents.",
        href: "/studio",
      },
      {
        term: "Harmonic",
        aka: ["Overtone", "Partial"],
        definition:
          "One of the whole-number multiples of the fundamental that sound above every sung note and decide its colour.",
        where:
          "The spectrogram draws one sung note as a stack of lines: the fundamental, then its harmonics.",
        href: "/analyze",
      },
      {
        term: "A440",
        aka: ["Concert pitch"],
        definition:
          "The tuning standard where the A above middle C is 440 Hz, which is what every tool here uses.",
        where:
          "The drone, the piano and the pitch detector are all referenced to A440, the same as the recordings you sing along to.",
        href: "/tools",
      },
    ],
  },
  {
    heading: "Registers and the break",
    blurb:
      "Different ways of setting up the vocal folds, and the seam between them.",
    entries: [
      {
        term: "Register",
        definition:
          "A way of setting up the vocal folds — length, thickness and how firmly they close — that handles one band of pitches well and gives out above it.",
        where:
          "The range test's climb crosses at least one register change, and the singer pages describe voices as chest-dominant or head-dominant.",
        href: "/range",
      },
      {
        term: "Chest voice",
        definition:
          "The thicker, shorter fold setup you speak in, so called because low notes buzz sympathetically in the sternum.",
        where:
          "The range test asks you to stop pushing chest voice upward once the top starts feeling like a wall.",
        href: "/range",
      },
      {
        term: "Head voice",
        definition:
          "The lighter, stretched fold setup above the break, which still rings at volume when the folds close firmly.",
        where:
          "Warmup exercises that climb past your transition are asking for head voice rather than more effort.",
        href: "/warmups",
      },
      {
        term: "Falsetto",
        definition:
          "A stretched fold setup with incomplete closure, which is why it sounds airy and resists being sung loudly.",
        where:
          "The range test counts falsetto as part of your range, and singer pages flag voices whose top is falsetto rather than full.",
        href: "/range",
      },
      {
        term: "Mix",
        aka: ["Mixed voice"],
        definition:
          "The middle ground between chest and head — part fold setup, part vowel and resonance — where the transition can be crossed without a seam.",
        where:
          "Singer technique notes describe voices climbing into mix at a named note instead of belting through it.",
        href: "/singers",
      },
      {
        term: "Whistle register",
        definition:
          "A setup above head voice in which only a short section of the folds vibrates, giving a thin, flute-like tone.",
        where:
          "The records page lists the whistle notes in the library; most voices never have one, and nothing depends on it.",
        href: "/singers/records",
      },
      {
        term: "Vocal fry",
        aka: ["Creak"],
        definition:
          "The rattling, popping sound the folds make below the bottom of a sung range, with no steady pitch to it.",
        where:
          "The range test asks you not to count fry as your low note — the floor is the lowest note you can hold clearly.",
        href: "/range",
      },
      {
        term: "Passaggio",
        aka: ["The break", "Transition zone"],
        definition:
          "The two-to-four-note zone where the voice has to hand over from one fold setup to the next, which is where cracks and sudden thinning happen.",
        where:
          "Slide slowly up through the zone and the pitch trace shows what the voice does at the transition; the same dip turning up at the same semitone every session is a passaggio rather than a limit.",
        href: "/studio",
      },
      {
        term: "Belt",
        aka: ["Belting"],
        definition:
          "Carrying a chest-dominant sound above the point where the voice would normally lighten, brightened rather than pushed.",
        where:
          "Singer pages mark a belt note separately from the ceiling, because the top of a range is often not belted at all.",
        href: "/singers",
      },
    ],
  },
  {
    heading: "Range and voice type",
    blurb: "What a range figure does and does not claim.",
    entries: [
      {
        term: "Vocal range",
        definition:
          "The span between the lowest and highest notes you can sing with a clear, usable tone.",
        where:
          "The range test reports yours as two notes and a span, and every singer page states theirs the same way.",
        href: "/range",
      },
      {
        term: "Tessitura",
        definition:
          "Where a voice sits comfortably for most of a song, which is a different claim from the range it can reach.",
        where:
          "Song fit is checked against your whole range, so a song can sit inside it and still spend every chorus in a part of the voice you would rather not live in — that is tessitura, and transposing is the fix.",
        href: "/songs",
      },
      {
        term: "Voice type",
        definition:
          "One of the eight conventional labels, soprano through bass, for the band a voice sits in and the weight it carries.",
        where:
          "The range result names the type whose band overlaps your span most closely, and the singer library files every voice by type.",
        href: "/range",
      },
      {
        term: "Transposition",
        aka: ["Transposing"],
        definition:
          "Moving a whole song up or down by a fixed number of semitones, which changes the key without changing the tune.",
        where:
          "Song practice transposes the backing to land the melody where your voice is comfortable.",
        href: "/songs",
      },
    ],
  },
  {
    heading: "Breath, tone and measurement",
    blurb: "The words for what the tools are actually watching.",
    entries: [
      {
        term: "Breath support",
        aka: ["Support"],
        definition:
          "Keeping the air pressure under the folds steady while the lungs empty — a management job rather than a strength one.",
        where:
          "The sustain test scores steadiness alongside duration, because a long note that wobbles is not a supported one.",
        href: "/breath",
      },
      {
        term: "Vibrato",
        definition:
          "The small, regular pitch oscillation a relaxed sustained note settles into, usually a few times a second.",
        where:
          "On the spectrogram, a steady ripple in the harmonic stack is vibrato; the stack jumping instead is a register change.",
        href: "/analyze",
      },
      {
        term: "Resonance",
        aka: ["The vocal tract", "The filter"],
        definition:
          "The throat and mouth shaping the buzz from the folds into a vowel and a colour, without changing the pitch.",
        where:
          "Hold one note and change vowel: the trace stays on the same line while the spectrogram redraws.",
        href: "/analyze",
      },
      {
        term: "Singer's formant",
        definition:
          "A concentration of energy around 3 kHz found in many trained classical voices, and the standard explanation for carrying over an orchestra unamplified.",
        where:
          "The tone panel draws that band as a gold column and reports its share of the plotted energy — a number to compare against your own takes, not a target.",
        href: "/analyze",
      },
      {
        term: "Spectrogram",
        definition:
          "A display of every frequency present in your voice, plotted against time.",
        where:
          "The analyzer draws one, so a bright or dark tone becomes something you can point at instead of describe.",
        href: "/analyze",
      },
      {
        term: "Vocal dose",
        aka: ["Cycle dose"],
        definition:
          "A measure of how much work the folds have done, counted in vibration cycles rather than minutes, because a minute sung high costs far more than a minute sung low.",
        where:
          "The vocal-load panel counts cycles while you practice.",
        href: "/analyze",
      },
      {
        term: "Drone",
        definition:
          "A continuously sustained reference pitch you sing against; when your note is slightly off, the two tones beat audibly.",
        where:
          "The drone in Tools is the fastest way to hear intonation errors that a screen would have to tell you about.",
        href: "/tools",
      },
      {
        term: "Lip trill",
        aka: ["Lip bubble"],
        definition:
          "Blowing air through loosely closed lips so they flutter while you sing, which makes clear tone cheap for a cold voice.",
        where:
          "Several warmups run on lip trills, and they are hard to blast through — the trill stops if you push.",
        href: "/warmups",
      },
      {
        term: "Siren",
        definition:
          "A slow slide up and down through the voice on one vowel, without stopping at any note.",
        where:
          "Warmup sirens are the standard way to find a register transition and then smooth it.",
        href: "/warmups",
      },
    ],
  },
];

/**
 * What to call each destination in a sentence. A term's link should read as a
 * room a singer can walk into, not as a raw path.
 */
const ROOM_LABELS: Record<string, string> = {
  "/analyze": "the analyzer",
  "/breath": "breath control",
  "/ear-training": "ear training",
  "/range": "the range test",
  "/singers": "the singer library",
  "/singers/records": "the records page",
  "/songs": "song practice",
  "/studio": "the pitch studio",
  "/tools": "tools",
  "/warmups": "warmups",
};

/** Falls back to the path so a new route is ugly rather than broken. */
export function roomLabel(href: string): string {
  return ROOM_LABELS[href] ?? href;
}

/** Anchor id for one term, used by the page and by the JSON-LD term URLs. */
export function termId(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Dropped rather than hyphenated, so "singer's formant" is not
    // "singer-s-formant".
    .replace(/['\u2019.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Flat reading order, for the JSON-LD term list and the count. */
export const GLOSSARY_TERMS: GlossaryEntry[] = GLOSSARY.flatMap(
  (section) => section.entries,
);
