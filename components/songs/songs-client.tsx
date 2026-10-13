"use client";

import { useFreeCap } from "@/lib/free-cap";
import { CapWall, FreeAllowance } from "@/components/practice/free-cap";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePitch } from "@/lib/audio/use-pitch";
import { useProgress } from "@/lib/progress";
import { Button, PageShell } from "@/components/ui";
import { IconMic } from "./icons";
import { SongsMicGate } from "./mic-gate";
import { ALL_SONGS, SONGS, type Song } from "./data";
import { getProState } from "@/lib/pro";
import { Library } from "./library";
import { SongPlayer } from "./song-player";
import { releaseTake, type TakeState } from "./take";
import { SessionSummary } from "./session-summary";
import { getMastered, recordMastered, recordSongPlayed } from "./favorites";
import { advanceSetlist, endSetlist, useSetlist } from "./setlist";
import { bandForSong, bandOpen, melodyFingerprint, type SessionSummaryData } from "./lib";
import type { GuidePass, SessionMode } from "./types";

type View = "library" | "practice" | "summary";

/**
 * The paywall alone: is this song in the book this visitor is entitled to?
 * Membership in SONGS is free; everything else in the songbook needs an
 * active Pro entitlement. Every entry point routes through here — a card, a
 * deep link, a setlist, a "sing again" — so none of them can become the one
 * that leaks a Pro song.
 */
export function entitled(song: Song): boolean {
  const accessible = getProState().active ? ALL_SONGS : SONGS;
  return accessible.some((s) => s.id === song.id);
}

/**
 * Whether a song may be started from the library: entitled, and in a band the
 * ladder has opened. The ladder governs browsing — cards, the dice, picks and
 * the setlist — not a song a page or lesson explicitly sent the singer to.
 */
function canStart(song: Song): boolean {
  const accessible = getProState().active ? ALL_SONGS : SONGS;
  return entitled(song) && bandOpen(bandForSong(song), getMastered(), accessible);
}

/** Bring the cap wall into view, so a capped tap lands on the reason, not on nothing. */
function showCapWall() {
  document.getElementById("free-cap")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function SongsClient() {
  const pitch = usePitch();
  const progress = useProgress();
  const cap = useFreeCap();
  const searchParams = useSearchParams();
  const setlist = useSetlist();

  const [listenMode, setListenMode] = useState(false);
  // Rehearsal loops until the singer stops; performance is the scored take.
  // Chosen in the player before a run or while paused, and kept here so it
  // survives moving from one song to the next.
  const [mode, setMode] = useState<SessionMode>("rehearsal");
  // How much of the guide melody plays under the singer on this pass. Chosen
  // beside the mode; listen mode preselects the guide alone.
  const [pass, setPass] = useState<GuidePass>("guided");
  const [view, setView] = useState<View>("library");
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  // The singer's recorded take for the current run; undefined when the run
  // isn't recorded. Its object URL is released whenever it is replaced.
  const [take, setTake] = useState<TakeState | undefined>(undefined);
  const takeRef = useRef<TakeState | undefined>(undefined);
  const replaceTake = useCallback((next: TakeState | undefined) => {
    if (takeRef.current !== next) releaseTake(takeRef.current);
    takeRef.current = next;
    setTake(next);
  }, []);
  useEffect(() => () => releaseTake(takeRef.current), []);
  // Bumped on every start so a repeat of the same song still counts as a play;
  // the effect below keys off it as well as the song identity.
  const [playToken, setPlayToken] = useState(0);

  // Every start — a library card, the dice, the setlist, "Sing again", a deep
  // link — lands with Play on screen. Switching views kept the library's
  // scroll position, so a phone showed the player's settings with Play and
  // the piano roll above the viewport, or below the tab bar. Aligning the
  // transport row to the bottom keeps the piano roll above it in view.
  useEffect(() => {
    if (view !== "practice") return;
    document.getElementById("song-transport")?.scrollIntoView({ block: "end" });
  }, [view, playToken]);

  // The summary inherits the practice view's scroll, which the effect above
  // left aligned to the transport: on a 375×667 phone the score, grade and
  // heading opened above the screen and "Sing again" under the tab bar. Open
  // it at the top, score first. A capped "Sing again" keeps the view as
  // "summary", so this never fights showCapWall.
  useEffect(() => {
    if (view === "summary") window.scrollTo({ top: 0 });
  }, [view]);

  // A song page links here as /songs?song=<slug>, so arriving from search
  // lands on the melody that was being read about rather than the library.
  // Resolved through `entitled`, so a Pro link cannot open a Pro song for a
  // free reader — it drops them in the library instead. The band ladder does
  // not apply: the page or lesson already said which song the singer came for,
  // and a link that opens a lock is a dead end.
  const deepLinkSlug = searchParams.get("song");
  const deepLinkSong = deepLinkSlug
    ? (ALL_SONGS.find((s) => s.slug === deepLinkSlug) ?? null)
    : null;
  const linkedId = deepLinkSong && entitled(deepLinkSong) ? deepLinkSong.id : null;
  // The linked song stays startable for the whole visit, so "Sing again" on it
  // works; everything else still goes through the ladder.
  const mayStart = (song: Song) => canStart(song) || song.id === linkedId;

  function startSong(song: Song) {
    // Song practice is guided practice: the free day's five minutes apply.
    if (cap.capped) {
      showCapWall();
      return;
    }
    if (!mayStart(song)) return;
    setActiveSong(song);
    setSummary(null);
    replaceTake(undefined);
    setView("practice");
    setPlayToken((t) => t + 1);
  }

  function startSongById(id: string) {
    const song = ALL_SONGS.find((s) => s.id === id);
    if (!song || !mayStart(song)) return;
    startSong(song);
  }

  // Recording a play touches localStorage, so it belongs in an effect rather
  // than in the render pass the deep link below starts from. Keying on the
  // song plus the token covers every start path at once.
  useEffect(() => {
    if (activeSong) recordSongPlayed(activeSong.id);
  }, [activeSong, playToken]);

  // A singer who has used today's free minutes meets the cap wall, not a
  // microphone prompt for practice they cannot start.
  const gated = !pitch.listening && !listenMode && !cap.capped;

  // Consumed once, and only after the mic gate clears, so the singer still
  // gets asked for a microphone first and lands on the requested song after.
  // Never while capped: the link must not walk around the daily allowance.
  // Adjusted during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [deepLinkDone, setDeepLinkDone] = useState(false);
  if (!deepLinkDone && !gated) {
    setDeepLinkDone(true);
    if (deepLinkSong && linkedId && !cap.capped) {
      setActiveSong(deepLinkSong);
      setSummary(null);
      setView("practice");
      setPlayToken((t) => t + 1);
    }
  }

  const pendingDeepLink = !deepLinkDone && deepLinkSong && linkedId;

  // Peek at the next queued song without advancing: the singer reads their
  // score first and moves on deliberately.
  const nextSetlistId =
    setlist.cursor >= 0 && setlist.cursor + 1 < setlist.ids.length
      ? setlist.ids[setlist.cursor + 1]
      : null;
  const nextSetlistSong = nextSetlistId
    ? (ALL_SONGS.find((s) => s.id === nextSetlistId) ?? null)
    : null;
  const showNext = nextSetlistSong !== null && canStart(nextSetlistSong);

  if (gated) {
    return (
      <SongsMicGate
        heading={
          pendingDeepLink
            ? `Enable your microphone to sing “${deepLinkSong.title}”`
            : undefined
        }
        error={pitch.error}
        onEnable={pitch.start}
        onListen={() => {
          // Listening without a mic is unscored by nature, so its entry
          // preselects the pass that matches: the guide alone.
          setPass("listen");
          setListenMode(true);
        }}
      />
    );
  }

  return (
    <PageShell
      kicker="Songs"
      title={
        view === "practice" && activeSong
          ? activeSong.title
          : view === "summary" && summary
            ? "Practice summary"
            : "Public domain songs to sing in your key"
      }
      subtitle={view === "library" ? "Pick a song to start your practice loop." : undefined}
      actions={
        !pitch.listening && view === "library" && !cap.capped ? (
          <Button variant="rec" size="sm" onClick={pitch.start}>
            <IconMic /> Enable microphone
          </Button>
        ) : undefined
      }
    >
      {view === "library" && cap.capped && (
        <div className="mb-6">
          <CapWall cap={cap} />
        </div>
      )}
      {/* In every view, not only the library: a song page's "Sing" link opens
          the player directly, and "Sing again" and "Next" start a run from
          the summary, so the time left has to be on screen there too or the
          wall arrives as a surprise. */}
      {!cap.capped && <FreeAllowance cap={cap} className="mb-4" />}
      {view === "library" && <Library progress={progress} onSelect={startSong} />}

      {view === "practice" && activeSong && (
        <SongPlayer
          song={activeSong}
          pitch={pitch}
          range={progress.range}
          mode={mode}
          onModeChange={setMode}
          pass={pass}
          onPassChange={setPass}
          onFinish={(data) => {
            // The whole summary, not just the id: what the run was sung at is
            // what makes the mastery re-judgeable and auditable later.
            if (data.mastered)
              recordMastered(data.song.id, {
                tempo: data.tempo,
                transpose: data.transpose,
                score: data.score ?? 0,
                melody: melodyFingerprint(data.song),
              });
            setSummary(data);
            setView("summary");
          }}
          onTake={replaceTake}
          onExit={() => {
            // Walking out mid-night stops the setlist without clearing it, so
            // the running order survives for the next "Start setlist".
            endSetlist();
            setView("library");
          }}
        />
      )}

      {view === "summary" && summary && (
        <SessionSummary
          data={summary}
          take={take}
          onAgain={() => startSongById(summary.song.id)}
          onLibrary={() => {
            endSetlist();
            setView("library");
          }}
          nextInSetlist={showNext ? nextSetlistSong.title : undefined}
          onNext={
            showNext
              ? () => {
                  // Capped: show why, and keep the setlist where it is.
                  if (cap.capped) {
                    showCapWall();
                    return;
                  }
                  const id = advanceSetlist();
                  if (id) startSongById(id);
                  else setView("library");
                }
              : undefined
          }
        />
      )}
      {/*
        A run that crossed the day's allowance ends here: the score first, then
        the reason "Sing again" and "Next" will not start another run today —
        which is where a capped tap on either scrolls to.
      */}
      {view === "summary" && cap.capped && (
        <div className="mt-6">
          <CapWall cap={cap} />
        </div>
      )}
    </PageShell>
  );
}
