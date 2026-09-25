/**
 * A sampled grand piano for reference notes.
 *
 * Salamander Grand Piano V2 (Yamaha C5) by Alexander Holm, CC BY 3.0, served
 * from /public/audio/piano. Recorded every three semitones, so no note is
 * pitch-shifted by more than a semitone from a real recording, which keeps it
 * sounding like the instrument rather than a stretched copy of it.
 *
 * Loading is lazy and non-blocking: the samples start downloading the first
 * time the audio context is built (always a user gesture, usually a count-in
 * before the first note) and a note whose sample isn't ready yet falls back to
 * the synthesized tone, so nothing ever waits on the network.
 */

const NAMES = ["C", "Ds", "Fs", "A"] as const;
const OFFSETS: Record<(typeof NAMES)[number], number> = { C: 0, Ds: 3, Fs: 6, A: 9 };

/** Sample midi -> file name, covering A1 (33) through C7 (96). */
const SAMPLES = new Map<number, string>();
for (let octave = 1; octave <= 7; octave++) {
  for (const name of NAMES) {
    const midi = 12 * (octave + 1) + OFFSETS[name];
    if (midi >= 33 && midi <= 96) SAMPLES.set(midi, `${name}${octave}.mp3`);
  }
}

const buffers = new Map<number, AudioBuffer>();
let loading: BaseAudioContext | null = null;

/** Start fetching and decoding every sample for this context. Idempotent. */
export function preloadPiano(ctx: BaseAudioContext): void {
  if (loading === ctx) return;
  loading = ctx;
  buffers.clear();
  for (const [midi, file] of SAMPLES) {
    void fetch(`/audio/piano/${file}`)
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(res.status)))
      .then((bytes) => ctx.decodeAudioData(bytes))
      .then((buffer) => {
        if (loading === ctx) buffers.set(midi, normalize(buffer));
      })
      .catch(() => {
        // That note falls back to the synthesized tone.
      });
  }
}

/**
 * Scales a sample so its peak is 1. The recordings sit at different levels
 * across the keyboard; normalizing them means a caller's gain means the same
 * thing on every note, exactly as it does for the synthesized tone.
 */
function normalize(buffer: AudioBuffer): AudioBuffer {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
    }
  }
  if (peak > 0 && peak !== 1) {
    const k = 1 / peak;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) data[i] *= k;
    }
  }
  return buffer;
}

/** The nearest loaded sample to a midi note, if any is ready. */
export function pianoSampleFor(
  midi: number,
): { buffer: AudioBuffer; sampleMidi: number } | null {
  let best: number | null = null;
  for (const sampleMidi of buffers.keys()) {
    if (best === null || Math.abs(sampleMidi - midi) < Math.abs(best - midi)) {
      best = sampleMidi;
    }
  }
  // More than a couple of semitones away means the right sample is still
  // loading; a far stretch sounds worse than the synthesized fallback.
  if (best === null || Math.abs(best - midi) > 2) return null;
  return { buffer: buffers.get(best)!, sampleMidi: best };
}

/** Test seam: the sample map, midi -> file. */
export const PIANO_SAMPLES: ReadonlyMap<number, string> = SAMPLES;
