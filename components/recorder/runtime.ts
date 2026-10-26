import type { TakeRecord, TakesStore } from "./db";
import { pickMimeType } from "./mime";
import { MIC_ENDED_MESSAGE, watchMicEnd, type openMic } from "@/lib/audio/mic";
import { getAudioPrefs } from "@/lib/audio/devices";

type OpenMic = typeof openMic;
type MicResult = { analyser: AnalyserNode; error: null } | { analyser?: never; error: string } | null;

/**
 * The recorder's microphone: one stream, shared by every press, released on
 * dispose. `onEnded` hears when the mic goes away on its own mid-session
 * (unplugged, a headset dropped); the stream is released first, so the next
 * start opens a fresh one instead of handing back the dead analyser.
 */
export function createRecorderMic(
  open: OpenMic,
  getContext: () => AudioContext,
  { onEnded }: { onEnded?: () => void } = {},
) {
  let stream: MediaStream | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let pending: Promise<MicResult> | null = null;
  let disposed = false;
  let unwatch = () => {};
  const release = () => {
    unwatch();
    unwatch = () => {};
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    source?.disconnect();
    source = null;
    analyser = null;
  };
  return {
    async start(): Promise<MicResult> {
      if (disposed) return null;
      if (analyser) return { analyser, error: null };
      if (pending) return pending;
      pending = (async (): Promise<MicResult> => {
        try {
          let opened: Awaited<ReturnType<OpenMic>>;
          // A picker change during permission belongs to this same shared
          // request. Never publish a stream with the old echo/input settings.
          while (true) {
            const wanted = getAudioPrefs();
            const changed = (acquiredInput = wanted.inputId) => {
              const current = getAudioPrefs();
              return current.inputId !== acquiredInput || current.monitoring !== wanted.monitoring;
            };
            try {
              opened = await open({
                deviceId: wanted.inputId,
                monitoring: wanted.monitoring,
                isCancelled: () => disposed,
              });
            } catch (cause) {
              if (disposed) return null;
              if (changed()) continue;
              throw cause;
            }
            if (disposed) {
              opened.stream?.getTracks().forEach((track) => track.stop());
              return null;
            }
            const acquiredInput = opened.inputId ?? wanted.inputId;
            if (changed(acquiredInput)) {
              opened.stream?.getTracks().forEach((track) => track.stop());
              continue;
            }
            break;
          }
          if (!opened.stream) return { error: opened.error };
          if (opened.stream.getTracks().some((track) => track.readyState === "ended")) {
            opened.stream.getTracks().forEach((track) => track.stop());
            return { error: MIC_ENDED_MESSAGE };
          }
          stream = opened.stream;
          const context = getContext();
          source = context.createMediaStreamSource(stream);
          analyser = context.createAnalyser();
          analyser.fftSize = 2048;
          source.connect(analyser);
          const live = stream;
          unwatch = watchMicEnd(live, () => {
            if (stream !== live) return;
            release();
            onEnded?.();
          });
          return { analyser, error: null };
        } catch {
          release();
          return { error: "The microphone couldn't start. Check your input and try again." };
        }
      })();
      try {
        return await pending;
      } finally {
        pending = null;
      }
    },
    getStream: () => stream,
    dispose() { disposed = true; release(); },
  };
}

export function startRecorder(stream: MediaStream, callbacks: {
  onData: (blob: Blob) => void;
  onStop: (mimeType: string) => void;
  onError: () => void;
}): { recorder: MediaRecorder; error: null } | { recorder: null; error: string } {
  let recorder: MediaRecorder | null = null;
  try {
    const mime = pickMimeType();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorder = rec;
    rec.ondataavailable = (event) => { if (event.data.size) callbacks.onData(event.data); };
    rec.onstop = () => callbacks.onStop(rec.mimeType || mime || "audio/webm");
    // MediaRecorder delivers its last dataavailable and stop after error.
    // Leave these handlers intact so any captured audio remains recoverable.
    rec.onerror = callbacks.onError;
    rec.start(1000);
    return { recorder: rec, error: null };
  } catch {
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      if (recorder.state !== "inactive") {
        try { recorder.stop(); } catch { /* already stopped */ }
      }
    }
    return { recorder: null, error: "Recording couldn't start. Check your microphone and try again." };
  }
}

export function createTakeMutations(getStore: () => Promise<TakesStore>) {
  // A rename/save followed immediately by Delete must commit in that order.
  // Failed writes reject to the UI but must not block a later retry.
  const pending = new Map<string, Promise<void>>();
  const deleting = new Set<string>();
  const deleted = new Set<string>();
  const run = (id: string, mutate: (store: TakesStore) => Promise<void>) => {
    const task = (pending.get(id) ?? Promise.resolve())
      .catch(() => {})
      .then(async () => mutate(await getStore()));
    const settled = task.then(() => {}, () => {});
    pending.set(id, settled);
    void settled.then(() => { if (pending.get(id) === settled) pending.delete(id); });
    return task;
  };
  return {
    put: (take: TakeRecord) => deleting.has(take.id) || deleted.has(take.id)
      ? Promise.resolve()
      : run(take.id, (store) => store.put(take)),
    remove: (id: string) => {
      deleting.add(id);
      return run(id, (store) => store.remove(id)).then(() => {
        deleted.add(id);
        deleting.delete(id);
      }, (error) => {
        deleting.delete(id);
        throw error;
      });
    },
  };
}
