import type { VoiceKind } from "@/lib/singers";

/**
 * What each category actually means, in the app's own voice. Written once per
 * category (eight paragraphs, not 357), because a reader who lands on "famous
 * tenors" deserves to know what a tenor is before scrolling a chart.
 */
export interface VoiceTypeNote {
  /** One-line definition for the page subtitle and meta description. */
  summary: string;
  /** Two or three sentences on how the category behaves in practice. */
  body: string;
  /** What a singer in this category tends to find hard. */
  challenge: string;
}

export const VOICE_TYPE_NOTES: Record<VoiceKind, VoiceTypeNote> = {
  Bass: {
    summary:
      "the lowest male category, built on weight and depth rather than reach",
    body: "A bass carries more vocal-fold mass than any other category, which is what gives the bottom of the range its size — notes that another singer can technically hit but not fill. The trade is at the top: where a baritone still has room, a bass is already working hard, so the repertoire tends to sit low and move slowly.",
    challenge:
      "Basses are the rarest category in recorded popular music, and the figures collected here reflect that — a handful of voices against a hundred-plus tenors.",
  },
  "Bass-baritone": {
    summary:
      "a bass's bottom with a baritone's working middle, common in storytelling styles",
    body: "Bass-baritone describes a voice that reaches genuine bass depth but spends most of its time in baritone territory, which is why the label shows up so often around country and folk. The bottom notes are real but used as colour, not as the home key.",
    challenge:
      "The category blurs at both edges, so the same singer is often filed as bass on one source and baritone on another.",
  },
  Baritone: {
    summary:
      "the most common male speaking-range voice, sitting between bass and tenor",
    body: "Most men speak in baritone territory, which makes it the default category and the one most conversational singing sits in. The characteristic sound comes from the middle of the range rather than either extreme, and the shift into head voice arrives lower than a tenor's.",
    challenge:
      "Rock and pop are written largely for tenors, so baritones spend a lot of time either transposing or pushing the top of the range harder than it wants to go.",
  },
  Tenor: {
    summary:
      "the highest standard male category, and the default voice of recorded popular music",
    body: "Tenor is by far the largest group in this library, partly because the category is genuinely common and partly because the last seventy years of popular songwriting has been pitched for it. The interest in a tenor is usually not the top note but the transition — how a singer negotiates the passage out of chest voice around D4 to G4.",
    challenge:
      "Because so much repertoire sits right at that transition, tenors carry the most audible strain when they are singing tired or in the wrong key.",
  },
  Countertenor: {
    summary:
      "a male voice working in the alto or mezzo range, usually through developed falsetto",
    body: "Countertenor describes function rather than anatomy: a male singer whose usable performing range sits where a female alto or mezzo would sing, generally reached through a highly developed falsetto or head register. In popular music the label attaches to falsetto specialists whose upper register is the whole point of the voice.",
    challenge:
      "The full-voice and falsetto figures for these singers are frequently conflated in circulation, which is why the cited spans look enormous.",
  },
  Contralto: {
    summary:
      "the lowest female category, prized for weight and darkness in the low middle",
    body: "A contralto's value is in the bottom third of the range, where the tone stays full instead of thinning out. Many singers filed here in popular music are really low mezzos with a distinctive dark colour, since true contralto is rare.",
    challenge:
      "The category is chronically over-assigned to any woman with a low speaking voice, so treat contralto labels in circulation with more caution than the notes themselves.",
  },
  "Mezzo-soprano": {
    summary:
      "the middle female category, and the home of most modern pop belting",
    body: "Mezzo-soprano is where the majority of women in popular music sit, and where the belt-driven pop of the last three decades lives. The interesting figure for a mezzo is rarely the highest note reached but the highest note held in full voice, which is why this library tracks the two separately.",
    challenge:
      "Belting near the top of the range is the most commonly injured technique in popular singing, and the cited ceilings here are peaks rather than sustainable nightly territory.",
  },
  Soprano: {
    summary:
      "the highest female category, with the most headroom above the staff",
    body: "Sopranos carry the lightest fold mass and the most usable range above middle C, which is what makes coloratura and whistle register possible at all. In this library the soprano group holds most of the extreme top figures, and nearly all of the whistle-register entries.",
    challenge:
      "A soprano's cited top note is usually the least representative number about them — it is a one-off recorded moment, not where the voice actually works.",
  },
};

/* ----------------------------------------------------------- passaggio --- */

/**
 * The transition zone for each category, in MIDI.
 *
 * This is the one set of figures on the site that the singer library cannot
 * supply. `REFERENCE_BANDS` in lib/singers-analysis.ts is the conventional
 * *range* per category and stays the source for that; a passaggio is a
 * different measurement — where the voice changes gear, not how far it
 * reaches — and no amount of low/high data implies it.
 *
 * Provenance, because these are assertions about real physiology rather than
 * anything derived — and the two halves of this table do not share a source.
 *
 * The four male zones span [primo passaggio, secondo passaggio] from Richard
 * Miller's registration tables: basso profondo, bass-baritone, lyric baritone
 * and tenore lirico respectively (Securing Baritone, Bass-Baritone, and Bass
 * Voices, Oxford 2008, p. 9; Training Tenor Voices, Schirmer 1993, pp. 9–13).
 * Miller puts a perfect fourth between the two events, so every male band here
 * is exactly five semitones — the invariant voice-types.test.ts pins.
 *
 * Publishing the primo alone was this table's original error, and it is worth
 * naming so it cannot come back quietly. The page defines a passaggio as the
 * ceiling of chest production, which is the *secondo*; the low male figures
 * were the primo, a different event a perfect fourth below it. The prose and
 * the numbers were describing two different events. The tell was the
 * five-semitone jump from the baritone floor to the tenor floor — exactly the
 * interval Miller puts between primo and secondo, showing up between two
 * categories instead of within one.
 *
 * The three female zones are deliberately not Miller and must not be
 * "corrected" onto him. His classical female secondo is E5–F#5, where a
 * trained soprano crosses into head voice; these pages address the
 * contemporary commercial break, which lands nearer A4–B4. That is a
 * different event in a different repertoire, not a rounding of the same one,
 * so those rows keep the conventional CCM figures this product published on
 * the old print.suedeai.ai range demo. Contralto is interpolated onto that
 * scale from its neighbours, which is why it overlaps the category above it
 * — that overlap is real and worth showing rather than tidying away.
 *
 * Do not sync any of this with the suede-voice iOS app. That app carries a
 * single secondo baseline per voice as a diagnostic threshold, not a published
 * band — a different shape for a different job — and "it matches the other
 * surface" is how the wrong figures survived here in the first place.
 *
 * `caveat` marks a category where the single-zone model is genuinely a poor
 * fit, so the page can say so instead of printing a number at a confidence the
 * underlying idea does not support.
 */
export interface VoiceTypePassaggio {
  low: number;
  high: number;
  caveat?: string;
}

export const VOICE_TYPE_PASSAGGIO: Record<VoiceKind, VoiceTypePassaggio> = {
  Bass: { low: 55, high: 60 }, // G3–C4
  "Bass-baritone": { low: 57, high: 62 }, // A3–D4
  Baritone: { low: 59, high: 64 }, // B3–E4
  Tenor: { low: 62, high: 67 }, // D4–G4
  Countertenor: {
    low: 55,
    high: 60, // G3–C4
    caveat:
      "A countertenor's working transition is the crossing out of full voice into the falsetto-family register the voice then sings above — a different event from the shifts listed for the other categories, and the one figure here that varies most from singer to singer.",
  },
  Contralto: { low: 67, high: 71 }, // G4–B4
  "Mezzo-soprano": { low: 69, high: 72 }, // A4–C5
  Soprano: { low: 72, high: 76 }, // C5–E5
};
