"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  PageShell,
  Pill,
  SectionLabel,
} from "@/components/ui";
import { audioNow, getAudioContext } from "@/lib/audio/context";
import { clickAt } from "@/lib/audio/synth";
import { logSession, type Achievement } from "@/lib/progress";
import { openTakesStore, type TakeRecord, type TakesStore } from "./db";
import { computePeaks, decodeTakeBlob, encodeWavMono, type Peaks } from "./wav";
import { IconMic, IconPause, IconPlay, IconRecordDot, IconStar, IconStop } from "./icons";
import { LiveWaveform, PeaksWaveform } from "./waveforms";
import { TakeRow } from "./take-row";

const MAX_SEC = 300; // 5 minute take limit
const COUNT_IN_BEAT = 0.5; // seconds per count-in click

type MicState = "idle" | "requesting" | "ready" | "blocked";
type RecPhase = "idle" | "countin" | "recording" | "saving";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtBytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} KB`;
  return `${Math.round(n)} B`;
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

function nextTakeName(takes: TakeRecord[]): string {
  let maxN = 0;
  for (const t of takes) {
    const m = /^Take (\d+)/.exec(t.name);
    if (m) maxN = Math.max(maxN, Number(m[1]));
  }
  const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Take ${maxN + 1} — ${date}`;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m));
}

function extForMime(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("wav")) return "wav";
  return "audio";
}

function safeFileName(name: string): string {
  return name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "take";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export default function RecorderPageClient() {
  // --- store + takes ---
  const storeRef = useRef<TakesStore | null>(null);
  const [takes, setTakes] = useState<TakeRecord[]>([]);
  const takesRef = useRef<TakeRecord[]>([]);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [estimate, setEstimate] = useState<{ usage: number; quota: number } | null>(null);

  // --- mic + recording ---
  const [micState, setMicState] = useState<MicState>("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [recPhase, setRecPhase] = useState<RecPhase>("idle");
  const [countBeat, setCountBeat] = useState(0);
  const [countIn, setCountIn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef(0);
  const countTimerRef = useRef(0);

  // --- playback ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionSec, setPositionSec] = useState(0);

  // --- peaks cache ---
  const peaksRef = useRef(new Map<string, Peaks>());
  const decodingRef = useRef(new Set<string>());
  const [, setPeaksVersion] = useState(0);

  // --- review, downloads, compare, toast ---
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewNote, setReviewNote] = useState("");
  const [wavBusyId, setWavBusyId] = useState<string | null>(null);
  const [abPicks, setAbPicks] = useState<string[]>([]);
  const [toast, setToast] = useState<{ xp: number; achievements: Achievement[] } | null>(null);

  useEffect(() => {
    takesRef.current = takes;
  }, [takes]);

  const refreshEstimate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return;
    void navigator.storage
      .estimate()
      .then((e) => {
        if (e.usage !== undefined && e.quota !== undefined) {
          setEstimate({ usage: e.usage, quota: e.quota });
        }
      })
      .catch(() => {});
  }, []);

  // Load persisted takes on mount.
  useEffect(() => {
    let alive = true;
    void openTakesStore().then(async (store) => {
      if (!alive) return;
      storeRef.current = store;
      setPersistent(store.persistent);
      try {
        const all = await store.getAll();
        if (!alive) return;
        setTakes(all.sort((a, b) => b.createdAt - a.createdAt));
      } catch {
        // leave the list empty
      }
    });
    refreshEstimate();
    return () => {
      alive = false;
    };
  }, [refreshEstimate]);

  // Teardown: stop mic, timers, playback.
  useEffect(() => {
    return () => {
      window.clearInterval(tickRef.current);
      window.clearInterval(countTimerRef.current);
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        try {
          rec.stop();
        } catch {
          // already stopped
        }
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioRef.current?.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // Auto-dismiss the XP toast.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // --- peaks ---
  const ensurePeaks = useCallback((take: TakeRecord) => {
    if (peaksRef.current.has(take.id) || decodingRef.current.has(take.id)) return;
    decodingRef.current.add(take.id);
    void decodeTakeBlob(take.blob)
      .then((buffer) => {
        peaksRef.current.set(take.id, computePeaks(buffer, 700));
        setPeaksVersion((v) => v + 1);
      })
      .catch(() => {})
      .finally(() => {
        decodingRef.current.delete(take.id);
      });
  }, []);

  useEffect(() => {
    const wanted = new Set([selectedId, ...abPicks]);
    for (const t of takes) {
      if (wanted.has(t.id)) ensurePeaks(t);
    }
  }, [selectedId, abPicks, takes, ensurePeaks]);

  // --- mic ---
  const enableMic = useCallback(async () => {
    setMicState("requesting");
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const ctx = getAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      source.connect(an);
      setAnalyser(an);
      setMicState("ready");
    } catch (err) {
      setMicState("blocked");
      const name = err instanceof DOMException ? err.name : "";
      setMicError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was blocked. Allow the mic for this site in your browser settings, then try again."
          : name === "NotFoundError"
            ? "No microphone found. Plug one in or check your input settings, then try again."
            : "Couldn't open the microphone. Check your input settings and try again.",
      );
    }
  }, []);

  // --- persistence helpers ---
  const persistTake = useCallback((take: TakeRecord) => {
    const store = storeRef.current;
    if (store) void store.put(take).catch(() => {});
  }, []);

  const updateTake = useCallback(
    (id: string, patch: Partial<TakeRecord>) => {
      setTakes((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...patch };
          persistTake(next);
          return next;
        }),
      );
    },
    [persistTake],
  );

  // --- recording ---
  const finalizeTake = useCallback(
    (mimeType: string) => {
      window.clearInterval(tickRef.current);
      const durationSec =
        Math.round(Math.min(MAX_SEC, (performance.now() - startedAtRef.current) / 1000) * 10) / 10;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      recorderRef.current = null;
      setRecPhase("idle");
      setElapsed(0);
      if (blob.size === 0 || durationSec < 0.3) return;

      const take: TakeRecord = {
        id: makeId(),
        name: nextTakeName(takesRef.current),
        createdAt: Date.now(),
        durationSec,
        mimeType,
        blob,
        starred: false,
      };
      setTakes((prev) => [take, ...prev]);
      persistTake(take);
      setSelectedId(take.id);
      setReviewId(take.id);
      setReviewRating(0);
      setReviewNote("");
      refreshEstimate();

      if (durationSec >= 10) {
        const result = logSession({
          type: "recording",
          durationSec,
          detail: take.name,
        });
        setToast({ xp: result.xpGained, achievements: result.newAchievements });
      }
    },
    [persistTake, refreshEstimate],
  );

  const beginCapture = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickMimeType();
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      setMicError("Recording isn't supported in this browser.");
      setRecPhase("idle");
      return;
    }
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => finalizeTake(rec.mimeType || mime || "audio/webm");
    recorderRef.current = rec;
    startedAtRef.current = performance.now();
    rec.start(1000);
    setElapsed(0);
    setRecPhase("recording");
    tickRef.current = window.setInterval(() => {
      const sec = (performance.now() - startedAtRef.current) / 1000;
      setElapsed(sec);
      if (sec >= MAX_SEC) {
        const r = recorderRef.current;
        if (r && r.state !== "inactive") {
          setRecPhase("saving");
          r.stop();
        }
      }
    }, 200);
  }, [finalizeTake]);

  const toggleRecord = useCallback(() => {
    if (micState !== "ready") return;
    if (recPhase === "recording") {
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        setRecPhase("saving");
        rec.stop();
      }
      return;
    }
    if (recPhase === "countin") {
      window.clearInterval(countTimerRef.current);
      setRecPhase("idle");
      return;
    }
    if (recPhase !== "idle") return;

    // Pause any playback so it doesn't bleed into the take.
    audioRef.current?.pause();

    if (countIn) {
      setRecPhase("countin");
      setCountBeat(4);
      const t0 = audioNow() + 0.15;
      for (let i = 0; i < 4; i++) clickAt(t0 + i * COUNT_IN_BEAT, i === 0);
      let n = 4;
      countTimerRef.current = window.setInterval(() => {
        n -= 1;
        if (n <= 0) {
          window.clearInterval(countTimerRef.current);
          beginCapture();
        } else {
          setCountBeat(n);
        }
      }, COUNT_IN_BEAT * 1000);
    } else {
      beginCapture();
    }
  }, [micState, recPhase, countIn, beginCapture]);

  // --- playback ---
  const ensureAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const a = new Audio();
      a.addEventListener("timeupdate", () => setPositionSec(a.currentTime));
      a.addEventListener("play", () => setIsPlaying(true));
      a.addEventListener("pause", () => setIsPlaying(false));
      a.addEventListener("ended", () => {
        setIsPlaying(false);
        setPositionSec(0);
      });
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  const loadTake = useCallback(
    (take: TakeRecord) => {
      const a = ensureAudio();
      a.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(take.blob);
      a.src = urlRef.current;
      setLoadedId(take.id);
      setPositionSec(0);
      return a;
    },
    [ensureAudio],
  );

  const togglePlay = useCallback(
    (take: TakeRecord) => {
      setSelectedId(take.id);
      const a = ensureAudio();
      if (loadedId === take.id) {
        if (a.paused) void a.play().catch(() => {});
        else a.pause();
      } else {
        loadTake(take);
        void a.play().catch(() => {});
      }
    },
    [ensureAudio, loadTake, loadedId],
  );

  const seekTake = useCallback(
    (take: TakeRecord, fraction: number) => {
      setSelectedId(take.id);
      const a = ensureAudio();
      const wasPlaying = loadedId === take.id && !a.paused;
      if (loadedId !== take.id) loadTake(take);
      const target = Math.max(0, Math.min(take.durationSec - 0.05, fraction * take.durationSec));
      const apply = () => {
        try {
          a.currentTime = target;
        } catch {
          // not seekable yet
        }
        setPositionSec(target);
      };
      if (a.readyState >= 1) apply();
      else a.addEventListener("loadedmetadata", apply, { once: true });
      if (wasPlaying || loadedId !== take.id) void a.play().catch(() => {});
    },
    [ensureAudio, loadTake, loadedId],
  );

  const deleteTake = useCallback(
    (take: TakeRecord) => {
      if (loadedId === take.id) {
        audioRef.current?.pause();
        if (urlRef.current) {
          URL.revokeObjectURL(urlRef.current);
          urlRef.current = null;
        }
        setLoadedId(null);
        setPositionSec(0);
      }
      peaksRef.current.delete(take.id);
      setAbPicks((prev) => prev.filter((id) => id !== take.id));
      setSelectedId((prev) => (prev === take.id ? null : prev));
      setReviewId((prev) => (prev === take.id ? null : prev));
      setTakes((prev) => prev.filter((t) => t.id !== take.id));
      const store = storeRef.current;
      if (store) void store.remove(take.id).catch(() => {});
      refreshEstimate();
    },
    [loadedId, refreshEstimate],
  );

  const downloadOriginal = useCallback((take: TakeRecord) => {
    downloadBlob(take.blob, `${safeFileName(take.name)}.${extForMime(take.mimeType)}`);
  }, []);

  const downloadWav = useCallback(async (take: TakeRecord) => {
    setWavBusyId(take.id);
    try {
      const buffer = await decodeTakeBlob(take.blob);
      downloadBlob(encodeWavMono(buffer), `${safeFileName(take.name)}.wav`);
    } catch {
      // decode failed — nothing to download
    } finally {
      setWavBusyId(null);
    }
  }, []);

  const toggleAb = useCallback((id: string) => {
    setAbPicks((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }, []);

  const playAb = useCallback(
    (id: string) => {
      const take = takesRef.current.find((t) => t.id === id);
      if (!take) return;
      const a = ensureAudio();
      // Quick switch: keep the current position so A/B lines up.
      const offset = loadedId !== null && loadedId !== id ? a.currentTime : -1;
      if (loadedId !== id) loadTake(take);
      setSelectedId(take.id);
      if (offset >= 0) {
        const target = Math.min(offset, Math.max(0, take.durationSec - 0.05));
        const apply = () => {
          try {
            a.currentTime = target;
          } catch {
            // not seekable yet
          }
        };
        if (a.readyState >= 1) apply();
        else a.addEventListener("loadedmetadata", apply, { once: true });
      }
      void a.play().catch(() => {});
    },
    [ensureAudio, loadTake, loadedId],
  );

  // --- self-review ---
  const saveReview = useCallback(() => {
    if (!reviewId) return;
    updateTake(reviewId, {
      rating: reviewRating > 0 ? reviewRating : undefined,
      note: reviewNote.trim() || undefined,
    });
    setReviewId(null);
  }, [reviewId, reviewRating, reviewNote, updateTake]);

  // --- keyboard: space = play/pause selected, R = record ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " ") {
        const take = takes.find((t) => t.id === selectedId);
        if (take) {
          e.preventDefault();
          togglePlay(take);
        }
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        toggleRecord();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [takes, selectedId, togglePlay, toggleRecord]);

  // --- derived ---
  const selectedTake = takes.find((t) => t.id === selectedId) ?? null;
  const reviewTake = takes.find((t) => t.id === reviewId) ?? null;
  const abA = takes.find((t) => t.id === abPicks[0]) ?? null;
  const abB = takes.find((t) => t.id === abPicks[1]) ?? null;
  const recording = recPhase === "recording";
  const starredCount = takes.filter((t) => t.starred).length;

  const progressFor = (take: TakeRecord) =>
    loadedId === take.id && take.durationSec > 0
      ? Math.min(1, positionSec / take.durationSec)
      : 0;

  return (
    <PageShell
      kicker="Practice studio"
      title="Recorder"
      subtitle="Cut a take, listen back, keep the good ones. Everything stays on this device — nothing uploads."
      actions={
        takes.length > 0 ? (
          <>
            <Pill tone="amber">
              {takes.length} {takes.length === 1 ? "take" : "takes"}
            </Pill>
            {starredCount > 0 && <Pill tone="ok">{starredCount} starred</Pill>}
          </>
        ) : undefined
      }
    >
      <div className="grid gap-6 lg:grid-cols-5">
        {/* ------- left column: deck + playback + compare ------- */}
        <div className="space-y-6 lg:col-span-3">
          {/* Record deck */}
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <SectionLabel>Record deck</SectionLabel>
              {micState === "ready" && (
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                    countIn
                      ? "border-amber/50 text-amber"
                      : "border-line text-mut hover:border-line2 hover:text-ink",
                  )}
                  aria-pressed={countIn}
                  onClick={() => setCountIn((v) => !v)}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      countIn ? "bg-amber" : "border border-line2",
                    )}
                    aria-hidden="true"
                  />
                  Count-in (4 clicks)
                </button>
              )}
            </div>

            {micState !== "ready" ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line2 text-amber">
                  <IconMic className="h-6 w-6" />
                </div>
                {micState === "blocked" ? (
                  <>
                    <p className="max-w-sm text-sm text-mut">{micError}</p>
                    <Button variant="outline" onClick={() => void enableMic()}>
                      Try again
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="max-w-sm text-sm text-mut">
                      Record practice takes and listen back. Takes stay on this device — they
                      never leave your browser.
                    </p>
                    <Button
                      variant="amber"
                      onClick={() => void enableMic()}
                      disabled={micState === "requesting"}
                    >
                      <IconMic />
                      {micState === "requesting" ? "Waiting for permission…" : "Enable microphone"}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-5">
                  <Button
                    variant="rec"
                    className="h-20 w-20 rounded-full p-0"
                    aria-label={
                      recording
                        ? "Stop recording"
                        : recPhase === "countin"
                          ? "Cancel count-in"
                          : "Start recording"
                    }
                    onClick={toggleRecord}
                    disabled={recPhase === "saving"}
                  >
                    {recording || recPhase === "countin" ? (
                      <IconStop className="h-7 w-7" />
                    ) : (
                      <span className="flex flex-col items-center">
                        <IconRecordDot className="h-5 w-5" />
                        <span className="font-mono text-[11px] tracking-[0.14em]">REC</span>
                      </span>
                    )}
                  </Button>

                  <div className="min-w-0 flex-1">
                    {recording ? (
                      <div className="flex items-baseline gap-3">
                        <span
                          className="mb-0.5 inline-block h-3 w-3 shrink-0 self-center rounded-full bg-rec animate-recblink"
                          aria-hidden="true"
                        />
                        <span className="tabular font-mono text-3xl text-ink">
                          {fmtClock(elapsed)}
                        </span>
                        <span className="tabular font-mono text-sm text-dim">/ 5:00</span>
                      </div>
                    ) : recPhase === "countin" ? (
                      <div className="flex items-baseline gap-3">
                        <span className="tabular font-mono text-3xl text-amber">{countBeat}</span>
                        <span className="text-sm text-mut">count-in…</span>
                      </div>
                    ) : recPhase === "saving" ? (
                      <span className="text-sm text-mut">Saving take…</span>
                    ) : (
                      <p className="text-sm text-mut">
                        Ready. Hit the button or press{" "}
                        <kbd className="rounded border border-line2 bg-panel2 px-1.5 py-0.5 font-mono text-[11px] text-ink">
                          R
                        </kbd>{" "}
                        to roll tape. Takes stop automatically at 5:00.
                      </p>
                    )}
                  </div>
                </div>
                <LiveWaveform analyser={analyser} height={110} />
              </>
            )}
          </Card>

          {/* Self-review prompt */}
          {reviewTake && (
            <Card className="animate-fadeup border-amber/40">
              <div className="mb-3 flex items-center justify-between gap-3">
                <SectionLabel>Quick self-review</SectionLabel>
                <span className="tabular font-mono text-xs text-mut">{reviewTake.name}</span>
              </div>
              <p className="mb-3 text-sm text-mut">How did that take feel? Optional — be honest.</p>
              <div
                className="mb-3 flex items-center gap-1"
                role="radiogroup"
                aria-label="Self-rating, 1 to 5 stars"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={reviewRating === n}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    className={cn(
                      "rounded p-1 transition-colors",
                      n <= reviewRating ? "text-amber" : "text-dim hover:text-amber",
                    )}
                    onClick={() => setReviewRating((r) => (r === n ? 0 : n))}
                  >
                    <IconStar filled={n <= reviewRating} className="h-6 w-6" />
                  </button>
                ))}
              </div>
              <input
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                maxLength={120}
                placeholder="One-line note — what worked, what to fix"
                aria-label="Self-review note"
                className="mb-4 w-full rounded-xl border border-line bg-panel2 px-3 py-2 text-sm text-ink placeholder:text-dim"
              />
              <div className="flex gap-2">
                <Button variant="amber" size="sm" onClick={saveReview}>
                  Save review
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setReviewId(null)}>
                  Skip
                </Button>
              </div>
            </Card>
          )}

          {/* Playback of selected take */}
          {selectedTake && (
            <Card>
              <div className="mb-3 flex items-center justify-between gap-3">
                <SectionLabel>Playback</SectionLabel>
                <span className="tabular font-mono text-xs text-mut">
                  {fmtClock(loadedId === selectedTake.id ? positionSec : 0)} /{" "}
                  {fmtClock(selectedTake.durationSec)}
                </span>
              </div>
              <div className="mb-3 flex items-center gap-3">
                <button
                  type="button"
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors",
                    loadedId === selectedTake.id && isPlaying
                      ? "border-amber bg-amber text-[#241a05]"
                      : "border-line2 text-ink hover:border-amber hover:text-amber",
                  )}
                  aria-label={
                    loadedId === selectedTake.id && isPlaying
                      ? `Pause ${selectedTake.name}`
                      : `Play ${selectedTake.name}`
                  }
                  onClick={() => togglePlay(selectedTake)}
                >
                  {loadedId === selectedTake.id && isPlaying ? (
                    <IconPause className="h-5 w-5" />
                  ) : (
                    <IconPlay className="ml-0.5 h-5 w-5" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className="tabular truncate font-mono text-sm text-ink">
                    {selectedTake.name}
                  </div>
                  <div className="text-xs text-dim">
                    Space plays and pauses. Click the waveform to scrub.
                  </div>
                </div>
              </div>
              <PeaksWaveform
                peaks={peaksRef.current.get(selectedTake.id) ?? null}
                progress={progressFor(selectedTake)}
                height={84}
                onSeek={(f) => seekTake(selectedTake, f)}
              />
              {selectedTake.note && (
                <p className="mt-3 text-sm text-mut">&ldquo;{selectedTake.note}&rdquo;</p>
              )}
            </Card>
          )}

          {/* A/B compare */}
          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <SectionLabel>A/B compare</SectionLabel>
              {abPicks.length > 0 && (
                <button
                  type="button"
                  className="text-xs text-dim hover:text-ink"
                  onClick={() => setAbPicks([])}
                >
                  Clear
                </button>
              )}
            </div>
            {abA && abB ? (
              <div className="space-y-4">
                {[
                  { label: "A" as const, take: abA },
                  { label: "B" as const, take: abB },
                ].map(({ label, take }) => (
                  <div key={take.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="tabular shrink-0 rounded border border-cool/50 px-1.5 font-mono text-[11px] text-cool">
                          {label}
                        </span>
                        <span className="tabular truncate font-mono text-xs text-ink">
                          {take.name}
                        </span>
                      </div>
                      <span className="tabular font-mono text-xs text-dim">
                        {fmtClock(take.durationSec)}
                      </span>
                    </div>
                    <PeaksWaveform
                      peaks={peaksRef.current.get(take.id) ?? null}
                      progress={progressFor(take)}
                      height={56}
                      onSeek={(f) => seekTake(take, f)}
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    variant={loadedId === abA.id && isPlaying ? "amber" : "outline"}
                    size="sm"
                    onClick={() => playAb(abA.id)}
                    aria-label={`Play take A: ${abA.name}`}
                  >
                    <IconPlay className="h-3.5 w-3.5" /> Play A
                  </Button>
                  <Button
                    variant={loadedId === abB.id && isPlaying ? "amber" : "outline"}
                    size="sm"
                    onClick={() => playAb(abB.id)}
                    aria-label={`Play take B: ${abB.name}`}
                  >
                    <IconPlay className="h-3.5 w-3.5" /> Play B
                  </Button>
                  {isPlaying && (loadedId === abA.id || loadedId === abB.id) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => audioRef.current?.pause()}
                      aria-label="Pause comparison playback"
                    >
                      <IconPause className="h-3.5 w-3.5" /> Pause
                    </Button>
                  )}
                </div>
                <p className="text-xs text-dim">
                  Switching keeps your place, so you can flip between takes mid-phrase.
                </p>
              </div>
            ) : (
              <p className="text-sm text-mut">
                Pick two takes with the A/B buttons in the list to line them up and switch
                between them while listening.
              </p>
            )}
          </Card>
        </div>

        {/* ------- right column: takes list ------- */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <SectionLabel>Takes</SectionLabel>
              {persistent === false && (
                <Pill tone="rec">Won&rsquo;t persist</Pill>
              )}
            </div>

            {persistent === false && (
              <p className="mb-3 rounded-xl border border-rec/30 bg-panel2 px-3 py-2 text-xs text-mut">
                Private browsing detected — takes are kept in memory only and will be lost when
                you close this tab. Download anything you want to keep.
              </p>
            )}

            {takes.length === 0 ? (
              <EmptyState
                title="No takes yet — hit record"
                hint="Your takes will show up here with playback, stars, and downloads. They stay on this device."
              />
            ) : (
              <ul className="no-scrollbar max-h-[70vh] space-y-2 overflow-y-auto">
                {takes.map((take) => (
                  <TakeRow
                    key={take.id}
                    take={take}
                    selected={selectedId === take.id}
                    playing={loadedId === take.id && isPlaying}
                    progress={progressFor(take)}
                    abLabel={
                      abPicks[0] === take.id ? "A" : abPicks[1] === take.id ? "B" : null
                    }
                    abDisabled={abPicks.length >= 2 && !abPicks.includes(take.id)}
                    wavBusy={wavBusyId === take.id}
                    onSelect={() => setSelectedId(take.id)}
                    onTogglePlay={() => togglePlay(take)}
                    onToggleStar={() => updateTake(take.id, { starred: !take.starred })}
                    onRename={(name) => updateTake(take.id, { name })}
                    onDelete={() => deleteTake(take)}
                    onDownloadOriginal={() => downloadOriginal(take)}
                    onDownloadWav={() => void downloadWav(take)}
                    onToggleAb={() => toggleAb(take.id)}
                  />
                ))}
              </ul>
            )}

            <div className="mt-4 border-t border-line pt-3 text-xs text-dim">
              {estimate ? (
                <span className="tabular font-mono">
                  Storage: {fmtBytes(estimate.usage)} used of {fmtBytes(estimate.quota)}
                </span>
              ) : (
                <span>Takes are stored locally in your browser.</span>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* XP toast */}
      {toast && (
        <div
          className="animate-fadeup fixed right-4 bottom-4 z-50 w-72 rounded-2xl border border-amber/50 bg-panel2 p-4 shadow-lg"
          role="status"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="tabular font-mono text-lg text-amber">+{toast.xp} XP</span>
            <button
              type="button"
              className="rounded px-1 text-dim hover:text-ink"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              ✕
            </button>
          </div>
          <div className="mt-0.5 text-xs text-mut">Take logged to your practice history.</div>
          {toast.achievements.length > 0 && (
            <ul className="mt-2 space-y-1.5 border-t border-line pt-2">
              {toast.achievements.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm">
                  <span aria-hidden="true">{a.icon}</span>
                  <span className="text-ink">{a.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </PageShell>
  );
}
