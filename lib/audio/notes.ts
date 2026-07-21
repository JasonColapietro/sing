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

export interface VoiceType {
  id: string;
  label: string;
  lowMidi: number;
  highMidi: number;
}

export const VOICE_TYPES: VoiceType[] = [
  { id: "bass", label: "Bass", lowMidi: 40, highMidi: 64 }, // E2–E4
  { id: "baritone", label: "Baritone", lowMidi: 45, highMidi: 69 }, // A2–A4
  { id: "tenor", label: "Tenor", lowMidi: 48, highMidi: 72 }, // C3–C5
  { id: "alto", label: "Alto", lowMidi: 53, highMidi: 77 }, // F3–F5
  { id: "mezzo", label: "Mezzo-soprano", lowMidi: 57, highMidi: 81 }, // A3–A5
  { id: "soprano", label: "Soprano", lowMidi: 60, highMidi: 84 }, // C4–C6
];

/** Best-fit classical voice type for a measured range, by overlap then center distance. */
export function classifyVoice(lowMidi: number, highMidi: number): VoiceType {
  const center = (lowMidi + highMidi) / 2;
  let best = VOICE_TYPES[0];
  let bestScore = -Infinity;
  for (const v of VOICE_TYPES) {
    const overlap =
      Math.min(highMidi, v.highMidi) - Math.max(lowMidi, v.lowMidi);
    const centerDist = Math.abs(center - (v.lowMidi + v.highMidi) / 2);
    const score = overlap - centerDist * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best;
}
