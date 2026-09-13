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

/**
 * Which instrument's vocabulary an entry belongs to.
 *
 * Four words mean different things on the two instruments Suede teaches:
 * `register` is a vocal mechanism and a region of the neck, `support` is breath
 * management and holding the guitar, and `tone` and `mix` each carry several
 * senses. So a colliding word gets one entry per domain rather than one entry
 * trying to cover both — a single definition for "support" would have to be
 * vague enough to be useless to either player.
 *
 * `music` is the vocabulary neither instrument owns: a cent is a cent.
 */
export type GlossaryDomain = "music" | "voice" | "guitar";

/** Which site renders an entry and owns its structured data. */
export type GlossaryPublisher = "sing" | "guitarHub";

/**
 * One site per term, deliberately.
 *
 * Two sites emitting `DefinedTerm` markup for one term compete with each other
 * as the definitional source for it, which is self-harm dressed as coverage. So
 * this app publishes the voice and music vocabulary — where the rooms that use
 * those words actually are — and the guitar hub renders the guitar senses with
 * no structured data at all. The guitar hub vendors the whole set either way, so
 * it can link a singer to the definition rather than leaving a word bare.
 */
export function publisherFor(domain: GlossaryDomain): GlossaryPublisher {
  return domain === "guitar" ? "guitarHub" : "sing";
}

export interface GlossaryEntry {
  term: string;
  /** Other names a reader may arrive with. Fed to the DefinedTerm markup. */
  aka?: string[];
  /** One sentence. Definition only. */
  definition: string;
  /** Where the word already appears in the app. */
  where: string;
  /** The room or page that shows it — a path in the publishing site. */
  href: string;
  domain: GlossaryDomain;
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
        domain: "music",
      },
      {
        term: "Semitone",
        aka: ["Half step"],
        definition:
          "The smallest step in Western tuning: one piano key to the next, black keys included.",
        where:
          "Song transposition is counted in semitones, and warmup scores show the semitone where your accuracy starts to drop.",
        href: "/songs",
        domain: "music",
      },
      {
        term: "Cent",
        definition:
          "One hundredth of a semitone, the unit the pitch readout uses for how far off a note landed.",
        where:
          "The studio's gauge shows cents live; under about five is inaudible to most listeners, twenty or more reads clearly as out of tune.",
        href: "/studio",
        domain: "music",
      },
      {
        term: "Sharp and flat",
        aka: ["♯", "♭"],
        definition:
          "Sharp means the note came out above the pitch you were aiming at, flat means below.",
        where:
          "The studio's two pills say which side of the target you are on while you hold a note.",
        href: "/studio",
        domain: "music",
      },
      {
        term: "Octave",
        definition:
          "The distance between a note and the next note with the same letter name — twelve semitones, at double the frequency.",
        where:
          "Your range test reports the span in octaves, and the keyboard on the result marks each one.",
        href: "/range",
        domain: "music",
      },
      {
        term: "Interval",
        definition:
          "The distance between two pitches, named by how many scale steps it covers — a third, a fifth, an octave.",
        where:
          "Ear training plays intervals and asks you to name or sing them back.",
        href: "/ear-training",
        domain: "music",
      },
      {
        term: "Fundamental frequency",
        aka: ["f0"],
        definition:
          "The rate at which your vocal folds repeat their cycle, which is the pitch a listener hears.",
        where:
          "Pitch detection estimates the fundamental from the waveform, then converts it to the nearest note plus a deviation in cents.",
        href: "/studio",
        domain: "music",
      },
      {
        term: "Harmonic",
        aka: ["Overtone", "Partial"],
        definition:
          "One of the whole-number multiples of the fundamental that sound above every sung note and decide its colour.",
        where:
          "The spectrogram draws one sung note as a stack of lines: the fundamental, then its harmonics.",
        href: "/analyze",
        domain: "music",
      },
      {
        term: "A440",
        aka: ["Concert pitch"],
        definition:
          "The tuning standard where the A above middle C is 440 Hz, which is what every tool here uses.",
        where:
          "The drone, the piano and the pitch detector are all referenced to A440, the same as the recordings you sing along to.",
        href: "/tools",
        domain: "music",
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
        domain: "voice",
      },
      {
        term: "Chest voice",
        definition:
          "The thicker, shorter fold setup you speak in, so called because low notes buzz sympathetically in the sternum.",
        where:
          "The range test asks you to stop pushing chest voice upward once the top starts feeling like a wall.",
        href: "/range",
        domain: "voice",
      },
      {
        term: "Head voice",
        definition:
          "The lighter, stretched fold setup above the break, which still rings at volume when the folds close firmly.",
        where:
          "Warmup exercises that climb past your transition are asking for head voice rather than more effort.",
        href: "/warmups",
        domain: "voice",
      },
      {
        term: "Falsetto",
        definition:
          "A stretched fold setup with incomplete closure, which is why it sounds airy and resists being sung loudly.",
        where:
          "The range test counts falsetto as part of your range, and singer pages flag voices whose top is falsetto rather than full.",
        href: "/range",
        domain: "voice",
      },
      {
        term: "Mix",
        aka: ["Mixed voice"],
        definition:
          "The middle ground between chest and head — part fold setup, part vowel and resonance — where the transition can be crossed without a seam.",
        where:
          "Singer technique notes describe voices climbing into mix at a named note instead of belting through it.",
        href: "/singers",
        domain: "voice",
      },
      {
        term: "Whistle register",
        definition:
          "A setup above head voice in which only a short section of the folds vibrates, giving a thin, flute-like tone.",
        where:
          "The records page lists the whistle notes in the library; most voices never have one, and nothing depends on it.",
        href: "/singers/records",
        domain: "voice",
      },
      {
        term: "Vocal fry",
        aka: ["Creak"],
        definition:
          "The rattling, popping sound the folds make below the bottom of a sung range, with no steady pitch to it.",
        where:
          "The range test asks you not to count fry as your low note — the floor is the lowest note you can hold clearly.",
        href: "/range",
        domain: "voice",
      },
      {
        term: "Passaggio",
        aka: ["The break", "Transition zone"],
        definition:
          "The two-to-four-note zone where the voice has to hand over from one fold setup to the next, which is where cracks and sudden thinning happen.",
        where:
          "Slide slowly up through the zone and the pitch trace shows what the voice does at the transition; the same dip turning up at the same semitone every session is a passaggio rather than a limit.",
        href: "/studio",
        domain: "voice",
      },
      {
        term: "Belt",
        aka: ["Belting"],
        definition:
          "Carrying a chest-dominant sound above the point where the voice would normally lighten, brightened rather than pushed.",
        where:
          "Singer pages mark a belt note separately from the ceiling, because the top of a range is often not belted at all.",
        href: "/singers",
        domain: "voice",
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
        domain: "voice",
      },
      {
        term: "Tessitura",
        definition:
          "Where a voice sits comfortably for most of a song, which is a different claim from the range it can reach.",
        where:
          "Song fit is checked against your whole range, so a song can sit inside it and still spend every chorus in a part of the voice you would rather not live in — that is tessitura, and transposing is the fix.",
        href: "/songs",
        domain: "voice",
      },
      {
        term: "Voice type",
        definition:
          "One of the eight conventional labels, soprano through bass, for the band a voice sits in and the weight it carries.",
        where:
          "The range result names the type whose band overlaps your span most closely, and the singer library files every voice by type.",
        href: "/range",
        domain: "voice",
      },
      {
        term: "Transposition",
        aka: ["Transposing"],
        definition:
          "Moving a whole song up or down by a fixed number of semitones, which changes the key without changing the tune.",
        where:
          "Song practice transposes the backing to land the melody where your voice is comfortable.",
        href: "/songs",
        domain: "music",
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
        domain: "voice",
      },
      {
        term: "Vibrato",
        definition:
          "The small, regular pitch oscillation a relaxed sustained note settles into, usually a few times a second.",
        where:
          "On the spectrogram, a steady ripple in the harmonic stack is vibrato; the stack jumping instead is a register change.",
        href: "/analyze",
        domain: "music",
      },
      {
        term: "Resonance",
        aka: ["The vocal tract", "The filter"],
        definition:
          "The throat and mouth shaping the buzz from the folds into a vowel and a colour, without changing the pitch.",
        where:
          "Hold one note and change vowel: the trace stays on the same line while the spectrogram redraws.",
        href: "/analyze",
        domain: "voice",
      },
      {
        term: "Singer's formant",
        definition:
          "A concentration of energy around 3 kHz found in many trained classical voices, and the standard explanation for carrying over an orchestra unamplified.",
        where:
          "The tone panel draws that band as a gold column and reports its share of the plotted energy — a number to compare against your own takes, not a target.",
        href: "/analyze",
        domain: "voice",
      },
      {
        term: "Spectrogram",
        definition:
          "A display of every frequency present in your voice, plotted against time.",
        where:
          "The analyzer draws one, so a bright or dark tone becomes something you can point at instead of describe.",
        href: "/analyze",
        domain: "music",
      },
      {
        term: "Vocal dose",
        aka: ["Cycle dose"],
        definition:
          "A measure of how much work the folds have done, counted in vibration cycles rather than minutes, because a minute sung high costs far more than a minute sung low.",
        where:
          "The vocal-load panel counts cycles while you practice.",
        href: "/analyze",
        domain: "voice",
      },
      {
        term: "Drone",
        definition:
          "A continuously sustained reference pitch you sing against; when your note is slightly off, the two tones beat audibly.",
        where:
          "The drone in Tools is the fastest way to hear intonation errors that a screen would have to tell you about.",
        href: "/tools",
        domain: "music",
      },
      {
        term: "Lip trill",
        aka: ["Lip bubble"],
        definition:
          "Blowing air through loosely closed lips so they flutter while you sing, which makes clear tone cheap for a cold voice.",
        where:
          "Several warmups run on lip trills, and they are hard to blast through — the trill stops if you push.",
        href: "/warmups",
        domain: "voice",
      },
      {
        term: "Siren",
        definition:
          "A slow slide up and down through the voice on one vowel, without stopping at any note.",
        where:
          "Warmup sirens are the standard way to find a register transition and then smooth it.",
        href: "/warmups",
        domain: "voice",
      },
      {
        term: "Twang",
        aka: ["Epilaryngeal narrowing"],
        definition:
          "A bright, carrying resonance made by narrowing the space just above the vocal folds, which adds high-frequency energy rather than volume.",
        where:
          "The warmups that run on nay and gug are twang exercises, and the analyzer shows the change as energy arriving in the upper bands while the pitch trace holds its line.",
        href: "/warmups",
        domain: "voice",
      },
      {
        term: "Pressed phonation",
        aka: ["Pressed voice", "Hyperfunction"],
        definition:
          "Voicing produced with more vocal-fold compression than the note needs, heard as a tight or squeezed tone rather than a louder one.",
        where:
          "Lessons use the word and nothing in Suede measures it: the tone panel's ring share is a self-relative resonance number rather than a strain reading, so no figure here can confirm or rule out pressing.",
        href: "/analyze",
        domain: "voice",
      },
      {
        term: "Onset",
        aka: ["Attack"],
        definition:
          "How a note starts — breath before tone, breath and tone together, or a click as the folds release.",
        where:
          "In the studio the pitch trace arrives a moment late on a breathy onset and starts already on the note on a glottal one.",
        href: "/studio",
        domain: "voice",
      },
      {
        term: "Vowel",
        definition:
          "The shape of the vocal tract that sets which frequencies a note is loudest at, colouring it without changing its pitch.",
        where:
          "Warmups name the vowel each pattern is sung on, because the same scale on ee and on ah asks different things of the tract.",
        href: "/warmups",
        domain: "voice",
      },
    ],
  },
  {
    heading: "Colour, tuning and timing",
    blurb:
      "The musical words neither instrument owns, defined once for both.",
    entries: [
      {
        term: "Tone",
        aka: ["Timbre", "Colour"],
        definition:
          "The colour of a sound — which frequencies it is loudest at — as distinct from how high it is or how loud.",
        where:
          "The spectrogram is a picture of tone: two takes of one note at the same pitch and the same volume draw different stacks.",
        href: "/analyze",
        domain: "music",
      },
      {
        term: "Intonation",
        aka: ["Tuning"],
        definition:
          "How close a note lands to the pitch it is meant to be.",
        where:
          "The studio reports intonation in cents while you hold a note, and ear training scores whether you sang the interval where you heard it.",
        href: "/ear-training",
        domain: "music",
      },
      {
        term: "Dynamics",
        definition:
          "How loud a passage is and how its loudness moves across it.",
        where:
          "The breath room's steadiness score reads loudness rather than pitch, so a deliberate swell and an unsteady note look alike to it.",
        href: "/breath",
        domain: "music",
      },
      {
        term: "Legato",
        definition:
          "Notes joined so that each one ends as the next begins, with no silence between them.",
        where:
          "Sirens and glides are legato by definition, and the studio draws them as one unbroken line instead of a row of steps.",
        href: "/warmups",
        domain: "music",
      },
      {
        term: "Staccato",
        definition:
          "Notes cut short, with audible silence between them.",
        where:
          "Staccato warmup patterns break the pitch trace into separate marks, which is the same picture a lost note makes.",
        href: "/warmups",
        domain: "music",
      },
      {
        term: "Metronome",
        aka: ["Click", "Click track"],
        definition:
          "A steady click at a chosen tempo, counted in beats per minute.",
        where:
          "Song practice runs against the tempo you set, so a phrase that only works when you rush it stops working.",
        href: "/songs",
        domain: "music",
      },
      {
        term: "Count-in",
        aka: ["Count-off"],
        definition:
          "The beats played before a take begins, so the first note arrives in time instead of being guessed at.",
        where:
          "Song practice counts four beats in before the first lyric, which is why a take rarely starts half a beat early.",
        href: "/songs",
        domain: "music",
      },
    ],
  },
  /**
   * Published by the guitar hub, not by this site, which is why the colliding
   * words appear here a second time: `register` is a region of the neck rather
   * than a mechanism, `support` is how the instrument is held, and `tone` is
   * what one instrument and one touch sound like.
   *
   * `mix` is deliberately absent. It collides in principle, but the guitar
   * hub's curriculum never uses the word, and an entry nothing links to is dead
   * data that still has to be kept true. It earns a place the day a lesson says
   * it.
   */
  {
    heading: "Guitar and the fretboard",
    blurb:
      "The guitar hub's vocabulary, vendored here so the set is whole; this page does not render it.",
    entries: [
      {
        term: "Register",
        definition:
          "A region of the neck and of pitch — the low strings, the middle of the board, the high frets — rather than a mechanism that switches.",
        where:
          "Lessons name the register a phrase sits in, and the same shape moved up the neck is the same chord in a higher one.",
        href: "/learn",
        domain: "guitar",
      },
      {
        term: "Support",
        aka: ["Posture", "Holding position"],
        definition:
          "How the instrument is held and balanced, so the fretting hand is free to move instead of holding the guitar up.",
        where:
          "The first lessons set sitting and standing position before any chord, because a guitar held on the wrong leg makes a barre chord feel impossible.",
        href: "/learn",
        domain: "guitar",
      },
      {
        term: "Tone",
        definition:
          "The sound a particular instrument, setting and touch produce, separate from which notes are played.",
        where:
          "The clean-tone guide works through pick attack, hand position and amp settings as the three things that move it.",
        href: "/resources/how-to-practice-clean-guitar-tone",
        domain: "guitar",
      },
      {
        term: "Fret",
        definition:
          "One of the metal strips across the neck, and the space behind it where a finger stops a string.",
        where:
          "Every number in a tab is a fret number, so third fret on the fifth string names one note and nothing else.",
        href: "/learn",
        domain: "guitar",
      },
      {
        term: "Capo",
        aka: ["Capotasto"],
        definition:
          "A clamp across all six strings at one fret, which raises every open string by the same number of semitones.",
        where:
          "A song in a key your voice prefers can often be played with the shapes you already know and a capo moved up the neck.",
        href: "/practice",
        domain: "guitar",
      },
      {
        term: "Barre chord",
        aka: ["Bar chord"],
        definition:
          "A chord whose lowest notes are stopped by one finger laid flat across several strings at once.",
        where:
          "F and B minor are the first barre shapes the chord lessons ask for, and they are where hand position stops being optional.",
        href: "/learn",
        domain: "guitar",
      },
      {
        term: "Power chord",
        aka: ["Fifth chord"],
        definition:
          "A chord of a root and its fifth with no third, which leaves it neither major nor minor.",
        where:
          "The riff lessons are built on power chords, which is why one shape slid along the neck plays a whole song.",
        href: "/learn",
        domain: "guitar",
      },
      {
        term: "Open chord",
        aka: ["Open position chord", "Cowboy chord"],
        definition:
          "A chord played near the nut that leaves one or more strings ringing unstopped.",
        where:
          "The first chord set is all open chords, which is why they sound fuller than anything played further up.",
        href: "/learn",
        domain: "guitar",
      },
      {
        term: "Tab",
        aka: ["Tablature"],
        definition:
          "A six-line notation where each line is a string and each number is the fret to stop it at.",
        where:
          "Practice material is written in tab rather than on a stave, so a shape can be read without reading pitch.",
        href: "/practice",
        domain: "guitar",
      },
      {
        term: "Strum",
        definition:
          "A single movement that sounds several strings across the neck rather than one at a time.",
        where:
          "Strumming patterns are written as a hand that keeps moving in time while some strokes miss the strings on purpose.",
        href: "/practice",
        domain: "guitar",
      },
      {
        term: "Downstroke and upstroke",
        aka: ["Down-up", "Downpicking"],
        definition:
          "A stroke toward the floor and a stroke back toward the ceiling, which sound different because they reach the strings in opposite order.",
        where:
          "Patterns are written as a row of downs and ups, and the metronome guide counts the ups on the off-beats.",
        href: "/practicing-guitar-with-a-metronome",
        domain: "guitar",
      },
      {
        term: "Palm mute",
        aka: ["Palm muting"],
        definition:
          "Resting the picking hand's palm lightly on the strings near the bridge so the notes sound short and damped.",
        where:
          "The riff lessons ask for a palm-muted verse and an open chorus, which is one shape played two ways.",
        href: "/learn",
        domain: "guitar",
      },
      {
        term: "Pull-off",
        aka: ["Hammer-on", "Slur"],
        definition:
          "Sounding a note without a new pick stroke by lifting a fretting finger off a ringing string, or, in the other direction, by tapping a finger down onto it.",
        where:
          "Lead lessons write pull-offs and hammer-ons between two frets, so three notes come out of one pick stroke.",
        href: "/learn",
        domain: "guitar",
      },
      {
        term: "Bend",
        definition:
          "Pushing a fretted string sideways across the neck to raise its pitch, usually by a semitone or a tone.",
        where:
          "A lead line bends into the note a singer would have slid up to, and the tuner shows how far the bend actually went.",
        href: "/tools",
        domain: "guitar",
      },
      {
        term: "Anchor finger",
        aka: ["Pivot finger", "Guide finger"],
        definition:
          "A finger left on the same string and fret while the others move, so two chords share a fixed point.",
        where:
          "The chord-change drills name the anchor finger for each pair of shapes, so the hand pivots instead of resetting.",
        href: "/practice",
        domain: "guitar",
      },
      {
        term: "Riff",
        aka: ["Lick", "Hook"],
        definition:
          "A short repeated figure that identifies a song, usually played rather than sung.",
        where:
          "The riff lessons build a recognisable song out of one figure repeated, which is the fastest route to playing something someone else knows.",
        href: "/learn",
        domain: "guitar",
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

/**
 * Identity for one entry across the whole shared set.
 *
 * `termId` is the anchor within one page and stays that way, but it is no
 * longer unique across the set: `register` and `tone` each exist twice, once
 * per instrument. Anything that keys a map or a lookup on a term — the
 * contract, a consumer's index, a parity check — has to qualify it by domain
 * or it will silently hold one sense and drop the other.
 */
export function glossaryKey(entry: GlossaryEntry): string {
  return `${entry.domain}:${termId(entry.term)}`;
}

/** Flat reading order, for the JSON-LD term list and the count. */
export const GLOSSARY_TERMS: GlossaryEntry[] = GLOSSARY.flatMap(
  (section) => section.entries,
);

/**
 * The sections this site renders, with the other site's entries removed and an
 * empty section dropped entirely rather than rendered as a heading with nothing
 * under it.
 *
 * The filter runs on the publisher rather than on the domain, so the rule lives
 * in `publisherFor` alone and a new domain does not need this line edited too.
 */
export const SING_GLOSSARY: GlossarySection[] = GLOSSARY.map((section) => ({
  ...section,
  entries: section.entries.filter(
    (entry) => publisherFor(entry.domain) === "sing",
  ),
})).filter((section) => section.entries.length > 0);

/** Flat reading order for what this site publishes. Drives the DefinedTermSet. */
export const SING_GLOSSARY_TERMS: GlossaryEntry[] = SING_GLOSSARY.flatMap(
  (section) => section.entries,
);
