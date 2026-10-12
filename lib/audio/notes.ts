import type { VoiceKind } from "@/lib/singers-data";

export const A4 = 440;

export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export interface NoteInfo {
  midi: number;
  name: string;
  octave: number;
  /** How far the frequency is from the nearest equal-tempered note, -50..+50. */
  cents: number;
  freq: number;
  /** e.g. "A4" */
  label: string;
}

export function midiToFreq(midi: number): number {
  return A4 * Math.pow(2, (midi - 69) / 12);
}

export function freqToMidiFloat(freq: number): number {
  return 69 + 12 * Math.log2(freq / A4);
}

export function midiToName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

export function midiToOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

export function midiToLabel(midi: number): string {
  return `${midiToName(midi)}${midiToOctave(midi)}`;
}

const FLAT_NAMES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

/**
 * Flat spelling of a note ("Bb3" for what midiToLabel calls "A#3"). Sources
 * quoting vocal ranges overwhelmingly use flats — "Bb5", not "A#5" — so text
 * meant to match what a reader searched for needs both spellings.
 */
export function midiToFlatLabel(midi: number): string {
  return `${FLAT_NAMES[((midi % 12) + 12) % 12]}${midiToOctave(midi)}`;
}

/** The flat spelling only when it differs from the sharp one, else null. */
export function altSpelling(midi: number): string | null {
  const flat = midiToFlatLabel(midi);
  return flat === midiToLabel(midi) ? null : flat;
}

const LABEL_RE = /^([A-Ga-g])([#b♯♭]?)(-?\d)$/;
const LETTER_PC: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Parse a scientific pitch label ("F2", "Eb3", "A#4") to midi. Null if malformed. */
export function labelToMidi(label: string): number | null {
  const m = LABEL_RE.exec(label.trim());
  if (!m) return null;
  const [, letter, accidental, octave] = m;
  let pc = LETTER_PC[letter.toUpperCase()];
  if (accidental === "#" || accidental === "♯") pc += 1;
  if (accidental === "b" || accidental === "♭") pc -= 1;
  return (parseInt(octave, 10) + 1) * 12 + pc;
}

export function freqToNote(freq: number): NoteInfo | null {
  if (!Number.isFinite(freq) || freq <= 0) return null;
  const mf = freqToMidiFloat(freq);
  const midi = Math.round(mf);
  return {
    midi,
    name: midiToName(midi),
    octave: midiToOctave(midi),
    cents: Math.round((mf - midi) * 100),
    freq,
    label: midiToLabel(midi),
  };
}

/** Signed cents distance from `freq` to the exact pitch of `targetMidi`. */
export function centsOff(freq: number, targetMidi: number): number {
  return Math.round((freqToMidiFloat(freq) - targetMidi) * 100);
}

/** Within this many cents of the nearest note reads as in tune: the green zone. */
export const IN_TUNE_CENTS = 15;
/** Within this many cents is close: a nudge, not a correction. */
export const CLOSE_CENTS = 35;

export type TuneZone = "in-tune" | "close" | "off";

/**
 * One verdict for a cents offset, so the pitch meter and the studio tuner
 * never call the same note in tune on one screen and sharp on the other.
 */
export function tuneZone(cents: number): TuneZone {
  const a = Math.abs(cents);
  if (a <= IN_TUNE_CENTS) return "in-tune";
  if (a <= CLOSE_CENTS) return "close";
  return "off";
}

export interface VoiceType {
  id: string;
  /**
   * Typed as VoiceKind so every label the classifier can return is guaranteed
   * to be a category the singer library actually has — the range test links
   * straight to /singers/voice-type/<label>, and a label with no page behind
   * it is a dead end. This is a type-only import, so nothing is pulled in at
   * runtime.
   */
  label: VoiceKind;
  lowMidi: number;
  highMidi: number;
}

export const VOICE_TYPES: VoiceType[] = [
  { id: "bass", label: "Bass", lowMidi: 40, highMidi: 64 }, // E2–E4
  { id: "baritone", label: "Baritone", lowMidi: 45, highMidi: 69 }, // A2–A4
  { id: "tenor", label: "Tenor", lowMidi: 48, highMidi: 72 }, // C3–C5
  // "Contralto", not "Alto": this is the label the singer library and the
  // /singers/voice-type pages use, and a range test that answers with a
  // category the rest of the site has never heard of is a dead end. It is
  // also the most common result for an untrained female voice.
  { id: "contralto", label: "Contralto", lowMidi: 53, highMidi: 77 }, // F3–F5
  { id: "mezzo", label: "Mezzo-soprano", lowMidi: 57, highMidi: 81 }, // A3–A5
  { id: "soprano", label: "Soprano", lowMidi: 60, highMidi: 84 }, // C4–C6
];

/** How well a measured range fits one band: overlap, less half the center distance. */
function fitScore(v: VoiceType, lowMidi: number, highMidi: number): number {
  const center = (lowMidi + highMidi) / 2;
  const overlap = Math.min(highMidi, v.highMidi) - Math.max(lowMidi, v.lowMidi);
  const centerDist = Math.abs(center - (v.lowMidi + v.highMidi) / 2);
  return overlap - centerDist * 0.5;
}

/**
 * Who wins a tied score. A range sitting between two bands often scores them
 * exactly level (A2–E4 ties bass and baritone, F3–C5 ties tenor and
 * contralto), and array order used to settle it, which handed every
 * bass/baritone tie to Bass, the lowest band on the chart. The middle bands
 * now win ties before the outer ones.
 */
const TIE_RANK: Readonly<Record<string, number>> = {
  baritone: 0,
  tenor: 1,
  mezzo: 2,
  contralto: 3,
  soprano: 4,
  bass: 5,
};

/** Every band, best fit first. */
function rankVoiceTypes(
  lowMidi: number,
  highMidi: number,
): Array<{ type: VoiceType; score: number }> {
  return VOICE_TYPES.map((type) => ({
    type,
    score: fitScore(type, lowMidi, highMidi),
  })).sort(
    (a, b) =>
      b.score - a.score ||
      (TIE_RANK[a.type.id] ?? 99) - (TIE_RANK[b.type.id] ?? 99),
  );
}

/**
 * Best-fit classical voice type for a measured range: overlap less half the
 * center distance, with TIE_RANK settling exact ties.
 */
export function classifyVoice(lowMidi: number, highMidi: number): VoiceType {
  return rankVoiceTypes(lowMidi, highMidi)[0].type;
}

/** The bass, baritone and tenor bands; the other three are contralto to soprano. */
const LOWER_BANDS: ReadonlySet<string> = new Set(["bass", "baritone", "tenor"]);
/** Score points within which a band from the other set is a real alternative. */
const ALTERNATIVE_MARGIN = 3;

/**
 * A near-equal fit from the other set of bands, or null.
 *
 * Range alone cannot separate them: a woman singing F3–C5 fits the tenor band
 * exactly as well as the contralto one, and a man whose falsetto takes him to
 * A5 edges into contralto. A single label there is a guess presented as a
 * result, so the result names both and lets the singer choose.
 */
export function crossFamilyAlternative(
  lowMidi: number,
  highMidi: number,
): VoiceType | null {
  const ranked = rankVoiceTypes(lowMidi, highMidi);
  const best = ranked[0];
  const lower = LOWER_BANDS.has(best.type.id);
  const other = ranked.find((r) => LOWER_BANDS.has(r.type.id) !== lower);
  return other && best.score - other.score <= ALTERNATIVE_MARGIN
    ? other.type
    : null;
}

/**
 * The voice-type estimate as one line of text: "Tenor", or "Tenor or
 * Contralto" when the other set of bands fits about as well. Every place that
 * names a singer's voice type uses this, so the saved-result card and the
 * share image never say less than the result screen did.
 */
export function voiceFitLabel(lowMidi: number, highMidi: number): string {
  const best = classifyVoice(lowMidi, highMidi);
  const alt = crossFamilyAlternative(lowMidi, highMidi);
  return alt ? `${best.label} or ${alt.label}` : best.label;
}
