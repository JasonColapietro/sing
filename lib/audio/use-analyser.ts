"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext } from "./context";
import { openMic } from "./mic";
import { detectPitch } from "./pitch";
import { doseDay } from "./vocal-dose";

/**
 * 4096 gives ~11.7 Hz bins at 48 kHz. Enough to separate the harmonics of a
 * bass at 80 Hz, and small enough that the whole analysis still fits inside a
 * frame at 60 fps.
 */
export const FFT_SIZE = 4096;

/** Everything one analysis frame produces. Read through the ref, not state. */
export interface AnalyserFrame {
  /** Per-bin magnitude in dB, as the analyser reports it (about -100..0). */
  freqDb: Float32Array;
  /** Raw samples for the current frame. */
  timeBuf: Float32Array;
  /** RMS of `timeBuf`, 0..~0.5. Relative to this input, not calibrated. */
  rms: number;
  /** Confident fundamental in Hz, or null when the frame is unvoiced. */
  f0: number | null;
  /** performance.now() of the frame. */
  t: number;
  /** Local calendar day the frame belongs to. */
  day: string;
}

export interface UseAnalyserResult {
  /** Live frame, updated every animation frame. Read inside your own rAF loop. */
  latest: React.RefObject<AnalyserFrame>;
  listening: boolean;
  error: string | null;
  sampleRate: number;
  /** Resolves true if the mic started. Call from a click handler. */
  start: () => Promise<boolean>;
  stop: () => void;
}

function emptyFrame(): AnalyserFrame {
  return {
    freqDb: new Float32Array(FFT_SIZE / 2).fill(-Infinity),
    timeBuf: new Float32Array(FFT_SIZE),
    rms: 0,
    f0: null,
    t: 0,
    day: doseDay(),
  };
}

/**
 * One microphone, one AnalyserNode, one animation loop, published through a ref.
 *
 * The frequency-domain sibling of `usePitch`. Kept separate rather than folded
 * into it because five other surfaces consume `usePitch` and none of them read
 * a spectrum; merging would charge every one of them for an FFT they throw
 * away.
 *
 * Nothing here calls setState per frame. Three canvases and a handful of
 * numeric readouts all animate off `latest`, so a React render never happens at
 * frame rate.
 */
export function useAnalyser(opts?: {
  clarityThreshold?: number;
  /** Called once per frame, after `latest` is updated. Keep it cheap. */
  onFrame?: (frame: AnalyserFrame, dtSec: number) => void;
}): UseAnalyserResult {
  const clarityThreshold = opts?.clarityThreshold ?? 0.75;
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sampleRate, setSampleRate] = useState(48000);

  const latest = useRef<AnalyserFrame>(emptyFrame());
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const onFrameRef = useRef(opts?.onFrame);
  const onFrame = opts?.onFrame;
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    latest.current = emptyFrame();
    setListening(false);
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true;
    setError(null);

    const opened = await openMic();
    if (opened.stream === null) {
      setError(opened.error);
      return false;
    }
    const stream = opened.stream;

    const ctx = getAudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    // A little smoothing steadies the spectrum without visibly lagging the
    // spectrogram; the default 0.8 smears a fast run into mush.
    analyser.smoothingTimeConstant = 0.5;
    analyser.minDecibels = -100;
    analyser.maxDecibels = -10;
    source.connect(analyser);
    streamRef.current = stream;
    sourceRef.current = source;
    setSampleRate(ctx.sampleRate);
    setListening(true);

    const freqDb = new Float32Array(analyser.frequencyBinCount);
    const timeBuf = new Float32Array(analyser.fftSize);
    let prevT = performance.now();

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      analyser.getFloatFrequencyData(freqDb);
      analyser.getFloatTimeDomainData(timeBuf);

      let rms = 0;
      for (let i = 0; i < timeBuf.length; i++) rms += timeBuf[i] * timeBuf[i];
      rms = Math.sqrt(rms / timeBuf.length);

      const r = detectPitch(timeBuf, ctx.sampleRate);
      const f0 = r && r.clarity >= clarityThreshold ? r.freq : null;

      const t = performance.now();
      // A backgrounded tab stops firing rAF, so dt would otherwise arrive as
      // however many minutes the tab spent hidden and credit all of it as
      // singing. Cap at roughly four frames.
      const dtSec = Math.min((t - prevT) / 1000, 1 / 15);
      prevT = t;

      const frame: AnalyserFrame = {
        freqDb,
        timeBuf,
        rms,
        f0,
        t,
        day: doseDay(),
      };
      latest.current = frame;
      onFrameRef.current?.(frame, dtSec);
    };
    rafRef.current = requestAnimationFrame(loop);
    return true;
  }, [clarityThreshold]);

  useEffect(() => stop, [stop]);

  return { latest, listening, error, sampleRate, start, stop };
}
