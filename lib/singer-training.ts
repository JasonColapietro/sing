import { programById } from "@/lib/programs";
import { routineById } from "@/components/warmups/routines";
import { labelToMidi } from "@/lib/audio/notes";
import type { Singer } from "@/lib/singers-data";

/**
 * The practice workflow a singer page closes on: one program or warmup
 * routine matched to the singer's style, so a reader who came to hear a voice
 * leaves with something to sing today. Rules run in order and the first match
 * wins; every page gets one.
 */

type TrainingFields = Pick<Singer, "name" | "genres" | "voiceType" | "lowMidi" | "highMidi" | "whistle">;

export interface SingerTraining {
  kind: "program" | "routine";
  id: string;
  /** The workflow's own name, from lib/programs.ts or components/warmups/routines.ts. */
  name: string;
  href: string;
  /** Why this workflow fits the sound, one sentence. */
  why: string;
  /** What the workflow does, in its own words. */
  tagline: string;
}

const has = (s: TrainingFields, ...genres: string[]) => s.genres.some((g) => genres.includes(g));

/** D2: a baritone floor at or below it puts the singer in low-voice territory. */
const LOW_FLOOR = labelToMidi("D2")!;
/** Three and a half octaves: a span this wide is built on the top of the voice. */
const WIDE_SPAN = 42;

function pickWorkflow(s: TrainingFields): { kind: "program" | "routine"; id: string; why: string } {
  if (has(s, "Opera", "Classical")) {
    return {
      kind: "program",
      id: "vibrato-3w",
      why: `Classical singing rides on an even, free vibrato, and ${s.name}’s sound is built on it.`,
    };
  }
  if (s.whistle) {
    return {
      kind: "program",
      id: "high-notes-6w",
      why: `${s.name}’s sound reaches far above the octave, up into whistle territory.`,
    };
  }
  if (has(s, "R&B", "Soul", "Gospel", "Funk")) {
    return {
      kind: "routine",
      id: "agility",
      why: `Runs and riffs drive ${s.name}’s style, and agility is what makes them clean at speed.`,
    };
  }
  if (["Bass", "Bass-baritone"].includes(s.voiceType) || (s.voiceType === "Baritone" && s.lowMidi <= LOW_FLOOR)) {
    return {
      kind: "routine",
      id: "range",
      why: `${s.name}’s sound starts at the bottom of the voice, and the low end grows with range work from both directions.`,
    };
  }
  if (has(s, "Musical Theater", "Rock", "Hard Rock", "Metal", "Punk", "Grunge")) {
    return {
      kind: "program",
      id: "mix-4w",
      why: `${s.name}’s sound stays big and connected from chest voice all the way up to the high notes.`,
    };
  }
  if (has(s, "Jazz", "Blues")) {
    return {
      kind: "program",
      id: "vibrato-3w",
      why: `${s.name}’s phrasing leans on long, shaped notes with a controlled vibrato.`,
    };
  }
  if (s.highMidi - s.lowMidi >= WIDE_SPAN) {
    return {
      kind: "program",
      id: "high-notes-6w",
      why: `${s.name}’s range is unusually wide, and the top of it is where the sound lives.`,
    };
  }
  return {
    kind: "program",
    id: "mix-4w",
    why: `${s.name}’s melodies live in the middle of the voice, where an even, connected sound matters most.`,
  };
}

export function singerTraining(s: TrainingFields): SingerTraining {
  const pick = pickWorkflow(s);
  if (pick.kind === "program") {
    const program = programById(pick.id)!;
    return { ...pick, name: program.name, tagline: program.tagline, href: `/programs/${program.id}` };
  }
  const routine = routineById(pick.id)!;
  return { ...pick, name: routine.name, tagline: routine.tagline, href: `/warmups?routine=${routine.id}` };
}
