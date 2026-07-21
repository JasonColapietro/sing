/**
 * Audio decode + peak extraction + 16-bit PCM WAV encoding for takes.
 * No dependencies — hand-rolled RIFF writer.
 */

import { getAudioContext } from "@/lib/audio/context";

/** Decode a recorded blob into an AudioBuffer via the shared AudioContext. */
export async function decodeTakeBlob(blob: Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const bytes = await blob.arrayBuffer();
  return await ctx.decodeAudioData(bytes);
}

export interface Peaks {
  min: Float32Array;
  max: Float32Array;
}

/** Min/max peaks per bucket across all channels, for static waveforms. */
export function computePeaks(buffer: AudioBuffer, buckets = 700): Peaks {
  const min = new Float32Array(buckets);
  const max = new Float32Array(buckets);
  const len = buffer.length;
  if (len === 0) return { min, max };
  const step = len / buckets;
  const channels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }
  for (let b = 0; b < buckets; b++) {
    let lo = Infinity;
    let hi = -Infinity;
    const start = Math.floor(b * step);
    const end = Math.min(len, Math.max(start + 1, Math.ceil((b + 1) * step)));
    for (const data of channels) {
      for (let i = start; i < end; i++) {
        const v = data[i];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    min[b] = lo === Infinity ? 0 : lo;
    max[b] = hi === -Infinity ? 0 : hi;
  }
  return { min, max };
}

/** Mix an AudioBuffer down to mono and encode as a 16-bit PCM WAV blob. */
export function encodeWavMono(buffer: AudioBuffer): Blob {
  const { length, sampleRate } = buffer;
  const nch = buffer.numberOfChannels;
  const mono = new Float32Array(length);
  for (let c = 0; c < nch; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) mono[i] += data[i] / nch;
  }

  const bytesPerSample = 2;
  const dataSize = length * bytesPerSample;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);
  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return new Blob([out], { type: "audio/wav" });
}
