/**
 * Reported (approximate) ranges of well-known singers, for a fun comparison.
 * Sources vary; these are commonly cited figures, not measured facts.
 */
export interface FamousVoice {
  name: string;
  lowMidi: number;
  highMidi: number;
}

export const FAMOUS_VOICES: FamousVoice[] = [
  { name: "Freddie Mercury", lowMidi: 41, highMidi: 86 }, // F2–D6
  { name: "Mariah Carey", lowMidi: 41, highMidi: 103 }, // F2–G7
  { name: "Axl Rose", lowMidi: 29, highMidi: 95 }, // F1–B6
  { name: "Johnny Cash", lowMidi: 40, highMidi: 71 }, // E2–B4
  { name: "Adele", lowMidi: 48, highMidi: 84 }, // C3–C6
  { name: "Bruno Mars", lowMidi: 48, highMidi: 74 }, // C3–D5
  { name: "Whitney Houston", lowMidi: 48, highMidi: 84 }, // C3–C6
];

/** Semitones of overlap between two ranges (0 if disjoint). */
export function rangeOverlap(
  aLow: number,
  aHigh: number,
  bLow: number,
  bHigh: number,
): number {
  return Math.max(0, Math.min(aHigh, bHigh) - Math.max(aLow, bLow));
}
