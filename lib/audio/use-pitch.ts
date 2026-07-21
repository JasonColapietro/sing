"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPitch } from "./pitch";
import { freqToNote, type NoteInfo } from "./notes";
import { getAudioContext } from "./context";

export interface PitchFrame {
  /** Median-smoothed frequency in Hz, or null when no confident voiced pitch. */
  freq: number | null;
  /** 0..1 confidence of the last analysis frame. */
  clarity: number;
  /** RMS input level 0..~0.5. Useful for meters and breath work. */
  volume: number;
  note: NoteInfo | null;
  /** performance.now() timestamp of the frame. */
  t: number;
}

export const EMPTY_FRAME: PitchFrame = {
  freq: null,
  clarity: 0,
  volume: 0,
  note: null,
  t: 0,
};

export interface UsePitchResult {
  /** React state, updated every animation frame while listening. */
  frame: PitchFrame;
  /** Same data via ref — read this inside your own rAF/canvas loops. */
  latest: React.RefObject<PitchFrame>;
  listening: boolean;
  /** Human-readable error (mic blocked, no device), or null. */
  error: string | null;
  /** Resolves true if the mic started. Call from a click handler. */
  start: () => Promise<boolean>;
  stop: () => void;
}

/**
 * Microphone pitch tracking. Renders a valid idle state before start() is
 * called; always give users an explicit "enable microphone" button.
 */
export function usePitch(opts?: { clarityThreshold?: number }): UsePitchResult {
  const clarityThreshold = opts?.clarityThreshold ?? 0.75;
  const [frame, setFrame] = useState<PitchFrame>(EMPTY_FRAME);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = useRef<PitchFrame>(EMPTY_FRAME);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const histRef = useRef<number[]>([]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    histRef.current = [];
    latest.current = EMPTY_FRAME;
    setFrame(EMPTY_FRAME);
    setListening(false);
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) return true;
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch {
      setError(
        "Microphone access is blocked. Allow the mic in your browser's site settings, then try again.",
      );
      return false;
    }
    const ctx = getAudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    streamRef.current = stream;
    sourceRef.current = source;
    setListening(true);

    const buf = new Float32Array(analyser.fftSize);
    const loop = () => {
      analyser.getFloatTimeDomainData(buf);
      let rms = 0;
      for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / buf.length);

      const r = detectPitch(buf, ctx.sampleRate);
      let freq: number | null = null;
      if (r && r.clarity >= clarityThreshold) {
        const hist = histRef.current;
        hist.push(r.freq);
        if (hist.length > 4) hist.shift();
        const sorted = [...hist].sort((a, b) => a - b);
        freq = sorted[Math.floor(sorted.length / 2)];
      } else {
        histRef.current = [];
      }

      const next: PitchFrame = {
        freq,
        clarity: r?.clarity ?? 0,
        volume: rms,
        note: freq !== null ? freqToNote(freq) : null,
        t: performance.now(),
      };
      latest.current = next;
      setFrame(next);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return true;
  }, [clarityThreshold]);

  useEffect(() => stop, [stop]);

  return { frame, latest, listening, error, start, stop };
}
