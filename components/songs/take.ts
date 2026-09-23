import { pickMimeType } from "@/components/recorder/mime";

/**
 * Recording the singer's own take during a song, for review in the summary.
 *
 * It records the very stream the room is scoring (usePitch's), so what the
 * singer hears back is what was judged. It is not aligned sample-for-sample
 * with the guide: the guide is synthesized live rather than played from a
 * file, and MediaRecorder's start is not tied to the AudioContext clock, so a
 * guide-under-take replay would drift by tens of milliseconds. Hearing the
 * voice alone is the review that matters and it needs no alignment.
 */

/** Longest take kept, matching the recorder room's cap. */
export const MAX_TAKE_SEC = 300;

export interface SongTake {
  songId: string;
  songTitle: string;
  blob: Blob;
  /** Object URL for playback; revoke with `releaseTake` when done. */
  url: string;
  mimeType: string;
  durationSec: number;
  /** Epoch ms the take was recorded. */
  createdAt: number;
}

/**
 * Where the summary's take stands: still being handed over by the recorder,
 * finished with nothing captured, or the take itself. Undefined means the run
 * wasn't recorded at all, and the summary shows no take card.
 */
export type TakeState = SongTake | "recording" | "none";

export interface TakeRecorder {
  pause(): void;
  resume(): void;
  /** Stop and hand the take to `onTake`; a second call does nothing. */
  finish(): void;
  /** Stop and throw the take away, e.g. on restart. */
  discard(): void;
}

/** "Silent Night — Sep 23", the name a saved take gets in the Recordings room. */
export function songTakeName(songTitle: string, at: Date): string {
  const date = at.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${songTitle} — ${date}`;
}

export function releaseTake(take: TakeState | null | undefined): void {
  if (take && typeof take === "object") URL.revokeObjectURL(take.url);
}

/**
 * Start recording `stream`. Returns null where MediaRecorder is unavailable or
 * refuses the stream, so the song still plays; the singer just gets no take.
 *
 * Duration is counted from wall time spent recording rather than read back
 * from the blob: a WebM from MediaRecorder carries no duration header, and
 * decoding it just to measure would cost the summary a noticeable pause.
 */
export function startTakeRecorder(
  stream: MediaStream,
  song: { id: string; title: string },
  onTake: (take: SongTake | null) => void,
): TakeRecorder | null {
  if (typeof MediaRecorder === "undefined") return null;
  const mimeType = pickMimeType();
  let rec: MediaRecorder;
  try {
    rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  } catch {
    return null;
  }

  const chunks: Blob[] = [];
  let keep = true;
  let done = false;
  let recordedMs = 0;
  let runningSince: number | null = performance.now();
  const createdAt = Date.now();
  const bank = () => {
    if (runningSince !== null) recordedMs += performance.now() - runningSince;
    runningSince = null;
  };

  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  rec.onstop = () => {
    bank();
    clearTimeout(cap);
    if (!keep || chunks.length === 0) {
      onTake(null);
      return;
    }
    const type = rec.mimeType || mimeType || "audio/webm";
    const blob = new Blob(chunks, { type });
    onTake({
      songId: song.id,
      songTitle: song.title,
      blob,
      url: URL.createObjectURL(blob),
      mimeType: type,
      durationSec: Math.round(recordedMs / 100) / 10,
      createdAt,
    });
  };

  const stop = () => {
    if (done) return;
    done = true;
    if (rec.state !== "inactive") rec.stop();
    else rec.onstop?.(new Event("stop"));
  };
  // A rehearsal loops until the singer stops; the cap keeps a forgotten one
  // from filling memory. The take ends there and the song carries on. It counts
  // recorded time only: the timer is dropped on pause and re-armed with what is
  // left on resume, or a long pause (the song pauses itself when the tab is
  // hidden) would end the take while the song itself was still unfinished.
  let cap: ReturnType<typeof setTimeout> | undefined;
  const armCap = () => {
    clearTimeout(cap);
    cap = setTimeout(stop, Math.max(0, MAX_TAKE_SEC * 1000 - recordedMs));
  };

  try {
    rec.start(1000);
  } catch {
    return null;
  }
  armCap();

  return {
    pause() {
      if (rec.state === "recording") {
        rec.pause();
        bank();
        clearTimeout(cap);
      }
    },
    resume() {
      if (rec.state === "paused") {
        rec.resume();
        runningSince = performance.now();
        armCap();
      }
    },
    finish: stop,
    discard() {
      keep = false;
      stop();
    },
  };
}
