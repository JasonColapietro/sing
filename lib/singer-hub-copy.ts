/**
 * The words that make each genre and voice-type hub a page of its own.
 *
 * Why this file exists. The 2026-10-03 content sweep found 36 pairs of hubs
 * competing with each other: J-Pop against K-Pop against Pop, Rock against
 * Hard Rock, Soul against R&B, Bass against Bass-baritone. Every hub was the
 * same template with the genre or category swapped in, so its title, its
 * description and the prose a visitor lands on said the same thing as its
 * neighbour's. Search engines had nothing to tell them apart with, and nor did
 * a reader.
 *
 * Every hub now carries three things written for it alone:
 *
 * - `intro`: what is specific to the genre or category, in general, well
 *   established music terms. No statistics. Figures on these pages come from
 *   the catalog or from REFERENCE_BANDS / VOICE_TYPE_PASSAGGIO, and the voice
 *   entries reach those through the tokens below rather than restating them.
 * - `contrast`: one sentence naming the neighbouring hub it is most often
 *   confused with and how it differs. `{link}` renders as a link to that hub,
 *   so the split is navigable rather than asserted.
 * - `titleTag` and `summary`: the distinct half of the <title> and the meta
 *   description. The keyword lead ("{genre} singers' vocal ranges",
 *   "{voice} vocal range") stays in front, which keyword-title-alignment needs.
 *
 * Voice entries may use these tokens, all filled from repo data:
 *   {low} {high}       the category's conventional band (REFERENCE_BANDS)
 *   {pLow} {pHigh}     its transition zone (VOICE_TYPE_PASSAGGIO)
 *
 * `lib/singer-hub-copy.test.tsx` fails when a hub has no entry, when two hubs
 * share any of these strings, when a contrast points at a hub that does not
 * exist or at itself, when a cannibal pair from the sweep renders the same
 * title or description, and when new copy carries an em dash.
 */
import type { VoiceKind } from "@/lib/singers-core";

export interface HubCopy {
  /** Two sentences on what is specific to this hub. Rendered, and used as the CollectionPage description. */
  intro: string;
  /** Slug of the neighbouring hub most easily confused with this one. */
  neighbour: string;
  /** One sentence contrasting the two. `{link}` becomes a link to the neighbour. */
  contrast: string;
  /** The distinct half of the page title, after the keyword lead. */
  titleTag: string;
  /** The distinct sentence of the meta description. */
  summary: string;
}

/** Keyed by genre slug, as genreSlug() spells it. */
export const GENRE_HUB_COPY: Record<string, HubCopy> = {
  afrobeats: {
    intro:
      "Afrobeats is the West African pop that rose from Nigeria and Ghana in the 2010s, and it is a different thing from the older Afrobeat of Fela Kuti, whose profile is also listed here. The vocals are melodic and relaxed, riding the rhythm in a comfortable middle range and moving freely between English, Nigerian Pidgin and Yoruba.",
    neighbour: "reggae",
    contrast:
      "{link} shares the laid-back, behind-the-beat delivery but comes from Jamaica and sits over an offbeat guitar rather than a layered percussion groove.",
    titleTag: "Melody on the Groove",
    summary:
      "Relaxed, melodic lines that ride the groove in a comfortable middle range.",
  },
  alternative: {
    intro:
      "Alternative covers the independent and college-radio rock that broke into the mainstream from the 1980s on, so its voices are deliberately varied: whispered, falsetto-led, shouted or conversational. There is no single typical tessitura here. What links these singers is a habit of using tone and character in place of conventional polish.",
    neighbour: "indie",
    contrast:
      "{link} is the quieter, close-mic end of the same family, where falsetto and light head voice are used for colour more often than power.",
    titleTag: "Character Over Polish",
    summary:
      "Whispered, falsetto-led or shouted: voices chosen for character, with no single typical tessitura.",
  },
  blues: {
    intro:
      "Blues singing grew from African American work songs and spirituals, and it lives in chest voice and the speaking register, bending pitches into blue notes between the major and minor third. A blues line is judged on phrasing and timbre far more than on how high it climbs.",
    neighbour: "jazz",
    contrast:
      "{link} took the same blue notes into swing and improvisation, where the voice phrases like a horn rather than staying close to speech.",
    titleTag: "Chest Voice and Blue Notes",
    summary:
      "Chest voice, bent blue notes and speech-close phrasing count for more here than the top note.",
  },
  classical: {
    intro:
      "Classical singing is trained to carry over an orchestra without amplification, through resonance rather than force, and it is where the soprano-to-bass voice categories come from. The profiles here include art song, oratorio and crossover singers as well as opera stars.",
    neighbour: "opera",
    contrast:
      "{link} is the staged, dramatic part of this tradition, where each role is written for a specific voice category.",
    titleTag: "Trained Resonance",
    summary:
      "Voices trained to carry over an orchestra unamplified, across art song, oratorio and crossover.",
  },
  country: {
    intro:
      "Country singing sits close to speech, with a conversational delivery, regional vowels and ornaments such as the vocal break or cry inherited from older folk and yodelling traditions. Many male country singers are baritones whose low notes carry the storytelling.",
    neighbour: "folk",
    contrast:
      "{link} shares the words-first approach but keeps a plainer tone, without country's twang, cry and vocal break.",
    titleTag: "Low-Voiced Storytelling",
    summary:
      "Conversational delivery, regional vowels and the vocal cry, carried by low male voices.",
  },
  electronic: {
    intro:
      "Electronic music often treats the voice as one layer in a produced track: a topline over a dance beat, a chopped sample, or a processed, airy head-voice line. Light, clear tone that sits above the bass and kick drum suits the style better than heavy belting.",
    neighbour: "synth-pop",
    contrast:
      "{link} is the song-shaped, verse-and-chorus branch, where the singer leads the track rather than serving it.",
    titleTag: "Toplines Over the Beat",
    summary:
      "The voice as one layer of a produced track: light, clear toplines and airy head voice.",
  },
  folk: {
    intro:
      "Folk songs were passed on by ear and sung by ordinary voices, so their melodies usually fit a comfortable middle range and put the words first. Plain, unforced tone and clear diction matter more here than power or reach.",
    neighbour: "singer-songwriter",
    contrast:
      "{link} grew out of this tradition, but there the melody is written by the singer to fit one particular voice.",
    titleTag: "Plain Tone, Words First",
    summary:
      "Melodies made for ordinary voices: a comfortable middle range, plain tone and clear words.",
  },
  funk: {
    intro:
      "Funk puts rhythm first, so the voice is used percussively: short shouted phrases, grunts, falsetto hooks and tight call-and-response with the horns. Falsetto lines and shouted low notes often sit in the same song, which stretches the reported spans.",
    neighbour: "randb",
    contrast:
      "{link} keeps the groove but puts the melody back in front, with long runs where funk uses short, rhythmic bursts.",
    titleTag: "Shouts and Falsetto",
    summary:
      "The voice as a rhythm instrument: shouted phrases, grunts and falsetto hooks in one song.",
  },
  gospel: {
    intro:
      "Gospel is church singing first: call-and-response with a choir, long melismatic runs and belts that build over the whole length of a song. Many of the defining soul and R&B voices learned to sing here, so this is the source of much of what those genres borrowed.",
    neighbour: "soul",
    contrast:
      "{link} carried this technique out of church and into secular songs in the late 1950s and 1960s.",
    titleTag: "Melisma and Choir Belts",
    summary:
      "Call-and-response, long melismatic runs and belts that build across a song.",
  },
  grunge: {
    intro:
      "Grunge is the late-1980s and early-1990s Seattle sound, and its singers favoured heavy baritone weight and raw, unpolished tone over clean high notes. Verses often sit low and quiet in the middle of the voice before breaking into a strained, full-throated chorus.",
    neighbour: "alternative",
    contrast:
      "It is one narrow, heavy slice of {link}, which covers the wider movement.",
    titleTag: "Heavy Baritone Weight",
    summary:
      "Low, heavy verses and strained, full-throated choruses from the Seattle sound.",
  },
  "hard-rock": {
    intro:
      "Hard rock takes rock's belted top and pushes it further: the signature sound is a sustained high chest or mixed note, often with deliberate distortion, sitting well above where most rock singing spends a song. It is one of the most demanding styles for the top of a male voice.",
    neighbour: "rock",
    contrast:
      "{link} covers the broader style, where many lines sit lower and closer to speech.",
    titleTag: "Sustained High Belts",
    summary:
      "Sustained high chest and mixed belts, often with deliberate distortion, well above most rock.",
  },
  "hip-hop": {
    intro:
      "Hip-hop is led by rap, which is rhythmic speech rather than sung pitch, so the profiles here are the artists who also sing hooks or blend singing with rapping. A rapped verse usually stays inside the speaking register, so it is the sung parts that stretch a range.",
    neighbour: "randb",
    contrast:
      "{link} is where most of these sung hooks come from, and where singing carries the whole song.",
    titleTag: "Sung Hooks",
    summary:
      "Artists who sing the hooks or blend singing with rap, where the sung parts set the range.",
  },
  indie: {
    intro:
      "Indie singers often favour a close, conversational delivery recorded near the microphone, with falsetto and light head voice used for colour rather than power. The songs are written for character rather than display, so modest ranges are common.",
    neighbour: "alternative",
    contrast:
      "{link} is the louder, older umbrella it grew from, with more room for shouting and grit.",
    titleTag: "Close-Mic Tone and Falsetto",
    summary:
      "Close-mic, conversational singing with falsetto and head voice used for colour.",
  },
  "j-pop": {
    intro:
      "J-pop is Japanese popular music, including the anime theme songs that carry much of it abroad. Its melodies are often fast, wide-leaping and dense with syllables, so agility and clean register shifts matter as much as the top note.",
    neighbour: "k-pop",
    contrast:
      "Where {link} divides a song among idol-group members by vocal role, the J-pop profiles here are mostly solo singers carrying the whole line.",
    titleTag: "Fast, Leaping Melodies",
    summary:
      "Fast, syllable-dense melodies with wide leaps, carried mostly by solo singers.",
  },
  jazz: {
    intro:
      "Jazz singers phrase like instrumentalists: they bend time, reshape the melody, and in scat singing use the voice as a horn. Many work in a low, warm middle register, so contraltos and baritones carry more of this hub than they do in pop.",
    neighbour: "blues",
    contrast:
      "{link} is the older root, where the line stays closer to speech and improvisation is less central.",
    titleTag: "Phrasing, Scat and Warm Lows",
    summary:
      "Singers who phrase like horn players, often in a low, warm middle register.",
  },
  "k-pop": {
    intro:
      "K-pop is South Korean idol pop, and its groups usually split a song by vocal role: main vocalists take the high belts and ad-libs, while lead and sub vocalists and rappers cover the middle. The main-vocal parts carry the highest sustained notes, and tenors and sopranos make up most of this hub.",
    neighbour: "j-pop",
    contrast:
      "{link} is mostly sung by solo artists, with faster, wordier melodies and less of the role-split belting.",
    titleTag: "Main Vocals and High Belts",
    summary:
      "Idol-group songs split by vocal role, with main vocalists carrying the high belts and ad-libs.",
  },
  latin: {
    intro:
      "Latin is a broad umbrella, from bolero and ranchera to salsa, bachata and reggaeton, sung mainly in Spanish and Portuguese. Ranchera and bolero prize sustained, open-throated chest voice with strong vibrato, while the urban styles sit much closer to speech.",
    neighbour: "pop",
    contrast:
      "Many of these singers are also listed under {link}, but the traditional forms here ask for more sustained chest voice than mainstream pop does.",
    titleTag: "From Ranchera to Reggaeton",
    summary:
      "From open-throated ranchera and bolero to speech-close reggaeton, in Spanish and Portuguese.",
  },
  metal: {
    intro:
      "Metal vocals range from operatic clean singing with high sustained notes to harsh styles such as growls and screams, which use distortion rather than pitch to carry intensity. Harsh vocals are hard to pin to a note, so it is the pitched singing that a range figure can describe.",
    neighbour: "hard-rock",
    contrast:
      "{link} keeps to clean belted lines, without the harsh techniques and the operatic extremes.",
    titleTag: "Clean Highs and Harsh Vocals",
    summary:
      "Operatic clean highs alongside growls and screams, with range measured on the pitched singing.",
  },
  "musical-theatre": {
    intro:
      "Musical theatre singing serves character and text: performers move between speech, classical legit tone and contemporary belt, often within one song. Eight shows a week reward a sustainable technique over a one-off high note.",
    neighbour: "opera",
    contrast:
      "{link} also sings roles on stage, but unamplified and in classical tone throughout, without the belt and speech-singing.",
    titleTag: "Legit, Mix and Belt",
    summary:
      "Speech, legit tone and belt in one role, built to last eight shows a week.",
  },
  "new-wave": {
    intro:
      "New wave came out of late-1970s punk with more melody, synthesizers and art-school styling. Its singers often used a cool, mannered or theatrical delivery in place of a big rock belt, and many of them are baritones.",
    neighbour: "synth-pop",
    contrast:
      "{link} grew out of it and moved further into keyboards and programmed sound.",
    titleTag: "Cool, Theatrical Delivery",
    summary:
      "Mannered, theatrical delivery from the post-punk years, often from baritone voices.",
  },
  opera: {
    intro:
      "Opera singers perform staged roles over a full orchestra, unamplified, and each role is written for a particular voice category, so the written range of a part is fixed and the singer has to own it night after night. That is why operatic profiles fit the voice-type categories most naturally.",
    neighbour: "classical",
    contrast:
      "{link} is the wider tradition, taking in concert, art song and crossover singers as well as the stage.",
    titleTag: "Roles Written by Voice Type",
    summary:
      "Staged roles written for one voice category and sung unamplified over an orchestra.",
  },
  pop: {
    intro:
      "Pop melodies are written to be sung back by a crowd, so most of a pop song sits in a comfortable band around the singer's speaking-to-belt middle. What separates pop singers is what they add on top: belted climaxes, riffs, and the occasional head-voice or whistle flourish.",
    neighbour: "synth-pop",
    contrast:
      "For the cooler, synthesizer-led branch of the style, see {link}.",
    titleTag: "Hooks, Belts and Riffs",
    summary:
      "Singable hooks in the speaking-to-belt middle, with belts, riffs and flourishes on top.",
  },
  punk: {
    intro:
      "Punk vocals are about attitude and speed rather than range: short, shouted phrases that sit in the speaking register and rarely ask for sustained high notes. Many punk singers deliberately avoid trained tone.",
    neighbour: "new-wave",
    contrast:
      "{link} came out of the same late-1970s scene and kept more melody and polish.",
    titleTag: "Shouted, Speech-Range Lines",
    summary:
      "Short, shouted phrases in the speaking register, with attitude ahead of range.",
  },
  randb: {
    intro:
      "Contemporary R&B is built on agility: runs, riffs and ad-libs move quickly through the voice, and light head voice, falsetto and occasional whistle notes sit alongside chest belting. One ornamental top note can stretch a reported span a long way past where the song lives.",
    neighbour: "soul",
    contrast:
      "{link} is the older, grittier lineage, where chest-voice power through the middle matters more than lightness and runs.",
    titleTag: "Runs, Riffs and Head Voice",
    summary:
      "Fast runs, riffs and ad-libs, with head voice, falsetto and whistle notes over the belt.",
  },
  reggae: {
    intro:
      "Reggae is Jamaican, and its vocal style is relaxed and behind the beat, sitting in a comfortable middle range over the offbeat guitar skank. Deejay toasting, a chanted half-sung style, sits even closer to speech.",
    neighbour: "afrobeats",
    contrast:
      "{link} shares the relaxed delivery but comes from West Africa and rides a denser percussion groove.",
    titleTag: "Relaxed, Behind the Beat",
    summary:
      "A relaxed, behind-the-beat middle range over the offbeat skank, plus chanted toasting.",
  },
  rock: {
    intro:
      "Rock vocals are built to cut through amplified guitars and drums, which pushes most rock singing into upper chest and mixed voice, where a tenor or baritone can be loud without straining. Grit, rasp and belted choruses are part of the style rather than flaws.",
    neighbour: "hard-rock",
    contrast:
      "For the heavier end of the style, where sustained high belts are the point, see {link}.",
    titleTag: "Chest Voice, Grit and Rasp",
    summary:
      "Upper chest and mixed voice built to cut through a band, with grit and rasp as part of the sound.",
  },
  "singer-songwriter": {
    intro:
      "Singer-songwriters write for their own voices, so the melodies sit where the writer is most comfortable, often in a narrow, speech-like range that serves the lyric. Idiosyncratic tone is normal here, and a modest span is usually a choice rather than a limit.",
    neighbour: "folk",
    contrast:
      "{link} is the shared older repertoire this grew from, written to be sung by anyone.",
    titleTag: "Written to Fit",
    summary:
      "Songs written for the writer's own voice, usually in a narrow, speech-like range.",
  },
  soul: {
    intro:
      "Soul grew out of gospel and rhythm and blues in the late 1950s and 1960s, and its signature is raw emotional intensity: gospel-style melisma, grit and climactic belting in chest voice. The style rewards power through the middle and upper middle of the voice more than extreme top notes.",
    neighbour: "randb",
    contrast:
      "{link} is the broader lineage, and in its contemporary form lighter tone, fast runs and head voice carry more of the line.",
    titleTag: "Gospel Grit and Chest Belts",
    summary:
      "Gospel-rooted grit and chest-voice belting, with power in the middle of the voice.",
  },
  "synth-pop": {
    intro:
      "Synth-pop grew out of late-1970s and 1980s synthesizer music, and its vocals are often cooler and more even in tone than mainstream pop, set against programmed keyboards instead of a band. The drama tends to come from the arrangement rather than from the belt.",
    neighbour: "pop",
    contrast:
      "{link} is the mainstream it feeds, where belts, riffs and big choruses do more of the work.",
    titleTag: "Cool Tone Over Synths",
    summary:
      "Cool, even-toned vocals over programmed keyboards, with the drama in the arrangement.",
  },
};

/** Keyed by VoiceKind. */
export const VOICE_TYPE_HUB_COPY: Record<VoiceKind, HubCopy> = {
  Bass: {
    intro:
      "A bass is the lowest standard male voice, conventionally {low} to {high}, and its sound lives in the bottom octave, where the tone is fullest. The voice changes gear around {pLow} to {pHigh}, earlier than a baritone or tenor does.",
    neighbour: "bass-baritone",
    contrast:
      "A {link} can reach some of the same low notes, but a bass treats that bottom octave as home rather than a place to visit.",
    titleTag: "The Lowest Male Voice",
    summary:
      "The lowest male voice, with its fullest tone in the bottom octave.",
  },
  "Bass-baritone": {
    intro:
      "A bass-baritone has a bass's low notes with a baritone's working middle, conventionally {low} to {high}, a step above the bass band at both ends. Its transition sits around {pLow} to {pHigh}.",
    neighbour: "bass",
    contrast:
      "Compared with a true {link}, the low notes are colour rather than home, so most of the singing happens in the octave above them.",
    titleTag: "Bass Lows, Baritone Core",
    summary:
      "Real bass depth used as colour, with most of the singing in a baritone's middle.",
  },
  Baritone: {
    intro:
      "The baritone sits between bass and tenor, conventionally {low} to {high}, and it is the range most men speak in. Its transition comes around {pLow} to {pHigh}, a little below a tenor's, so the middle of the voice carries the sound.",
    neighbour: "tenor",
    contrast:
      "A {link} works higher, with its transition arriving later and more of its repertoire sitting at the top.",
    titleTag: "The Middle Male Voice",
    summary:
      "The middle male voice most men speak in, with its sound in the middle of the range.",
  },
  Tenor: {
    intro:
      "The tenor is the highest standard male voice, conventionally {low} to {high}, and the voice most popular songwriting is pitched for. Its transition sits around {pLow} to {pHigh}, and how a tenor crosses that zone matters more than the top note.",
    neighbour: "baritone",
    contrast:
      "A {link} works lower, with the transition arriving earlier and the weight of the voice in the middle.",
    titleTag: "Top Standard Male Voice",
    summary:
      "The highest standard male voice and the one most popular songs are pitched for.",
  },
  Countertenor: {
    intro:
      "A countertenor is a male singer whose performing range sits in alto or mezzo territory, conventionally {low} to {high}, usually reached through a developed falsetto or head register. The defining shift is the move out of full voice into that upper register, not a gear change within it.",
    neighbour: "contralto",
    contrast:
      "A {link} covers similar notes with a female voice's full chest register underneath, where a countertenor works mostly in falsetto.",
    titleTag: "Men in Alto Range",
    summary:
      "Male singers working in alto and mezzo territory through developed falsetto.",
  },
  Contralto: {
    intro:
      "The contralto is the lowest female voice, conventionally {low} to {high}, prized for a full, dark tone in the low middle where other female voices thin out. True contraltos are rare, and the label is often given to low mezzos.",
    neighbour: "mezzo-soprano",
    contrast:
      "A {link} covers similar ground but sits higher, with less weight at the bottom and more ease above the staff.",
    titleTag: "The Lowest Female Voice",
    summary:
      "The lowest female voice, with a full, dark tone where others thin out.",
  },
  "Mezzo-soprano": {
    intro:
      "The mezzo-soprano is the middle female voice, conventionally {low} to {high}, and the category where most women in popular music, and most modern pop belting, sit. Its transition falls around {pLow} to {pHigh}.",
    neighbour: "soprano",
    contrast:
      "A {link} has more headroom above that, where a mezzo's strength is a fuller middle and lower range.",
    titleTag: "The Middle Female Voice",
    summary:
      "The middle female voice, and home to most modern pop belting.",
  },
  Soprano: {
    intro:
      "The soprano is the highest standard female voice, conventionally {low} to {high}, with the most usable range above the staff and most of this catalog's whistle-register entries. Its transition comes around {pLow} to {pHigh}, higher than any other category.",
    neighbour: "mezzo-soprano",
    contrast:
      "A {link} reaches many of the same notes with a darker, heavier middle and less sustained time at the top.",
    titleTag: "The Highest Female Voice",
    summary:
      "The highest female voice, with the most headroom above the staff.",
  },
};

/** Replaces `{name}` tokens; throws on a token with no value so a typo cannot ship as literal braces. */
export function fillTokens(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key === "link") return match;
    const value = values[key];
    if (value === undefined) throw new Error(`no value for ${match} in "${text}"`);
    return value;
  });
}

/** Splits a contrast sentence around its `{link}` token. */
export function splitContrast(contrast: string): [string, string] {
  const at = contrast.indexOf("{link}");
  if (at < 0) throw new Error(`contrast has no {link}: "${contrast}"`);
  return [contrast.slice(0, at), contrast.slice(at + "{link}".length)];
}
