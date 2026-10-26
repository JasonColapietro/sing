"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_CLARITY_THRESHOLD, detectPitch } from "./pitch";
import { PITCH_MEDIAN_WINDOW } from "./latency";
import { median } from "./median";
import { freqToNote, type NoteInfo } from "./notes";
import { getAudioContext } from "./context";
import { MIC_ENDED_MESSAGE, openMic, watchMicEnd } from "./mic";
import { getAudioPrefs, useAudioPrefs } from "./devices";

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

/**
 * Analyser frame the pitch loop opens. Exported because lib/audio/latency.ts
 * converts it into the seconds a reading lags reality, and a frame size changed
 * in one place and not the other silently mis-aligns every scored room.
 */
export const PITCH_FFT_SIZE = 4096;

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
  /**
   * The live microphone stream, or null while idle. For recording the same
   * take the room is scoring, without opening the device a second time (which
   * Safari can refuse as busy). It is replaced when the singer switches input,
   * so hold it only for as long as one recording.
   */
  getStream: () => MediaStream | null;
  /**
   * Hands every analysis frame's raw samples to `listener`, alongside the
   * frame the loop made of them, and returns the unsubscribe. For a second
   * reading of the same audio — the breath room's inhale detector — without a
   * second AnalyserNode and animation loop over the same device. The buffer is
   * reused, so read it inside the call and do not keep it.
   */
  subscribe: (listener: PitchFrameListener) => () => void;
}

export type PitchFrameListener = (
  samples: Float32Array,
  sampleRate: number,
  frame: PitchFrame,
) => void;

/**
 * Microphone pitch tracking. Renders a valid idle state before start() is
 * called; always give users an explicit "enable microphone" button.
 */
export function usePitch(opts?: {
  clarityThreshold?: number;
  /**
   * Called once when the microphone goes away on its own mid-session, after
   * the hook has stopped and set its error: the room's chance to close out
   * what it was timing. Not called for the room's own stop(), nor for the
   * brief stop while a device change reopens the stream, so a room that only
   * watched `listening` drop could not tell those apart.
   */
  onMicEnded?: () => void;
  /**
   * Whether to analyse the open stream. False keeps the microphone open, so
   * nothing asks for permission again or goes silent while it reopens, but
   * stops the analysis loop: no pitch detection, no per-frame state update
   * (`frame` reads empty), no subscriber calls, and `latest` is emptied.
   * True again resumes on the same stream. For a host that holds one stream
   * across steps that do not all listen: the ear workout keeps it from its
   * first singing step to its results, and without this re-rendered every
   * animation frame through Interval ID, Higher or lower and the slides
   * between steps. Default true.
   */
  analyse?: boolean;
}): UsePitchResult {
  const clarityThreshold = opts?.clarityThreshold ?? DEFAULT_CLARITY_THRESHOLD;
  const onMicEnded = opts?.onMicEnded;
  const analyse = opts?.analyse ?? true;
  /** The latest onMicEnded, read when the track ends rather than at start. */
  const onMicEndedRef = useRef(onMicEnded);
  useEffect(() => {
    onMicEndedRef.current = onMicEnded;
  }, [onMicEnded]);
  const [frame, setFrame] = useState<PitchFrame>(EMPTY_FRAME);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latest = useRef<PitchFrame>(EMPTY_FRAME);
  const streamRef = useRef<MediaStream | null>(null);
  const activePrefsRef = useRef<{ prefs: ReturnType<typeof getAudioPrefs>; clarityThreshold: number } | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  /** Stops listening for the open stream's mic going away (watchMicEnd). */
  const unwatchRef = useRef<() => void>(() => {});
  const rafRef = useRef<number>(0);
  /** The open stream's analysis loop, kept so a paused one can resume. */
  const loopRef = useRef<(() => void) | null>(null);
  /** `analyse`, as the loop and a stream that opens later read it. */
  const analyseRef = useRef(analyse);
  const histRef = useRef<number[]>([]);
  // Whether this hook is still on screen. `start` awaits a permission prompt
  // that a singer can leave open for as long as they like, so the component can
  // be gone by the time the stream arrives.
  const mountedRef = useRef(true);
  const listeningRef = useRef(false);
  /**
   * The in-flight open, shared by every caller that arrives during it.
   *
   * The `streamRef` guard below only rejects a second call once the *first has
   * finished*, and the first spends its whole life awaiting a permission
   * prompt. Two presses inside that window therefore opened two MediaStreams
   * and started two animation loops that both wrote `rafRef`, so `stop()`
   * cancelled one loop and stopped one stream while the other ran forever with
   * the recording indicator lit and no UI left to turn it off. /warmups made
   * this easy to hit: it renders the gate card and the exercise catalogue at
   * once, and both "Enable microphone" and any exercise card call start().
   */
  const pendingRef = useRef<Promise<boolean> | null>(null);
  // Stop can leave this hook mounted (for example, the breath room's home
  // screen). A permission prompt cannot be dismissed programmatically, so
  // invalidate its attempt and release its stream if it arrives later.
  const attemptRef = useRef(0);
  const listenersRef = useRef(new Set<PitchFrameListener>());

  // The input device and monitoring mode, so a change made in the picker can
  // reopen a stream that is already running.
  const { inputId, monitoring } = useAudioPrefs();

  const stop = useCallback(() => {
    attemptRef.current++;
    pendingRef.current = null;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    loopRef.current = null;
    unwatchRef.current();
    unwatchRef.current = () => {};
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    activePrefsRef.current = null;
    sourceRef.current?.disconnect();
    sourceRef.current = null;
    histRef.current = [];
    latest.current = EMPTY_FRAME;
    setFrame(EMPTY_FRAME);
    listeningRef.current = false;
    setListening(false);
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    // A stream can already be owned while startup is still failing. Wait for
    // the complete startup result before treating that stream as ready.
    if (pendingRef.current) return pendingRef.current;
    if (streamRef.current) return true;
    const attempt = ++attemptRef.current;
    const run = openStream().catch(() => {
      // A cancelled request's rejection must not stop a replacement stream
      // or overwrite the replacement's error state.
      if (attempt !== attemptRef.current || !mountedRef.current) return false;
      // Web Audio can fail after permission succeeds. Release the stream and
      // any source already created, then leave the room ready for a retry.
      stop();
      setError("The microphone couldn't start. Check your input and try again.");
      return false;
    }).finally(() => {
      if (pendingRef.current === run) pendingRef.current = null;
    });
    // Every concurrent caller shares cleanup and the handled result.
    pendingRef.current = run;
    return run;
    async function openStream(): Promise<boolean> {
    setError(null);

    let opened: Awaited<ReturnType<typeof openMic>>;
    let openedPrefs: ReturnType<typeof getAudioPrefs>;
    // Preferences can change while permission/device initialization is pending.
    // Reconcile sequentially inside the shared promise, so every caller waits
    // for the latest choice and no second permission request runs in parallel.
    while (true) {
      const wanted = getAudioPrefs();
      const changed = () => {
        const current = getAudioPrefs();
        return current.inputId !== wanted.inputId || current.monitoring !== wanted.monitoring;
      };
      try {
        opened = await openMic({ deviceId: wanted.inputId, monitoring: wanted.monitoring });
      } catch (cause) {
        if (!mountedRef.current || attempt !== attemptRef.current) return false;
        if (changed()) continue;
        throw cause;
      }
      // Stop or exit still owns this attempt, even if newer preferences exist.
      if (!mountedRef.current || attempt !== attemptRef.current) {
        opened.stream?.getTracks().forEach((track) => track.stop());
        return false;
      }
      if (changed()) {
        opened.stream?.getTracks().forEach((track) => track.stop());
        continue;
      }
      openedPrefs = wanted;
      break;
    }
    if (opened.stream === null) {
      setError(opened.error);
      return false;
    }
    const stream = opened.stream;
    // Own each resource before the next startup operation can throw.
    streamRef.current = stream;

    const ctx = getAudioContext();
    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;
    const analyser = ctx.createAnalyser();
    // 4096 samples is 85 ms at 48 kHz — about five and a half periods of a low
    // C2, where 2048 gave under three. Normalizing the correlation is what made
    // low notes *detectable* at all (see pitch.ts); the longer frame is what
    // makes them survive a room with noise in it. Measured against a synthetic
    // vowel at -3.5 dB SNR, usable frames at E2 went from 2 in 20 to 7 in 20.
    // The cost is latency, and it is affordable: the median-of-4 smoothing
    // below already spans more time than the extra 43 ms this adds.
    analyser.fftSize = PITCH_FFT_SIZE;
    source.connect(analyser);
    activePrefsRef.current = { prefs: openedPrefs, clarityThreshold };
    listeningRef.current = true;
    setListening(true);
    // An unplugged or dropped mic ends the track and the analyser reads
    // silence from then on. Without this the room stayed "listening": the
    // range test blamed the singer for being too quiet, the studio clock kept
    // counting. Stopping hands every room its own stopped state, and the
    // error is what its mic alert says.
    unwatchRef.current = watchMicEnd(stream, () => {
      if (streamRef.current !== stream) return;
      stop();
      setError(MIC_ENDED_MESSAGE);
      onMicEndedRef.current?.();
    });

    const buf = new Float32Array(analyser.fftSize);
    const loop = () => {
      // Paused between the frame being scheduled and run: stay paused.
      if (!analyseRef.current) {
        rafRef.current = 0;
        return;
      }
      analyser.getFloatTimeDomainData(buf);
      let rms = 0;
      for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / buf.length);

      const r = detectPitch(buf, ctx.sampleRate);
      let freq: number | null = null;
      if (r && r.clarity >= clarityThreshold) {
        const hist = histRef.current;
        hist.push(r.freq);
        if (hist.length > PITCH_MEDIAN_WINDOW) hist.shift();
        freq = median(hist);
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
      for (const listener of listenersRef.current) listener(buf, ctx.sampleRate, next);
      // Test hook for e2e/pitch-precision.mjs, which plays a known note in as
      // the fake microphone and scores what the room actually heard. Inert
      // unless the harness created the array before the page loaded.
      const probe = (window as { __singPitchProbe?: unknown[] }).__singPitchProbe;
      if (Array.isArray(probe)) {
        probe.push({
          t: next.t,
          raw: r?.freq ?? null,
          clarity: next.clarity,
          freq,
          sampleRate: ctx.sampleRate,
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loopRef.current = loop;
    if (analyseRef.current) rafRef.current = requestAnimationFrame(loop);
    return true;
    }
  }, [clarityThreshold, stop]);

  /**
   * Pauses and resumes the analysis loop on the open stream (`analyse`).
   * Pausing empties what the loop left behind, so a step that resumes it
   * never reads a frame from before the pause as current.
   */
  useEffect(() => {
    analyseRef.current = analyse;
    if (!analyse) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      histRef.current = [];
      latest.current = EMPTY_FRAME;
      return;
    }
    if (loopRef.current && rafRef.current === 0) {
      rafRef.current = requestAnimationFrame(loopRef.current);
    }
  }, [analyse]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [stop]);

  /**
   * Reopens the stream when the singer picks a different microphone, or moves
   * between headphones and speakers, without making them leave the exercise.
   *
   * Skipped entirely while idle: `start` reads the current preference anyway,
   * so a change made before the mic is running needs nothing here.
   */
  useEffect(() => {
    if (!listeningRef.current) return;
    // Acquisition may already have reconciled a change before React rendered
    // it. Do not interrupt that stream again when this effect catches up.
    const active = activePrefsRef.current;
    if (active?.prefs.inputId === inputId && active.prefs.monitoring === monitoring && active.clarityThreshold === clarityThreshold) return;
    stop();
    void start();
  }, [inputId, monitoring, clarityThreshold, start, stop]);

  const getStream = useCallback(() => streamRef.current, []);
  const subscribe = useCallback((listener: PitchFrameListener) => {
    const listeners = listenersRef.current;
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    // Paused, the last frame state set is stale: report silence instead,
    // without a state update of its own.
    frame: analyse ? frame : EMPTY_FRAME,
    latest,
    listening,
    error,
    start,
    stop,
    getStream,
    subscribe,
  };
}
