"use client";

import { useFreeCap } from "@/lib/free-cap";
import { CapWall, FreeAllowance } from "@/components/practice/free-cap";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePitch } from "@/lib/audio/use-pitch";
import { useIdleMicRelease } from "@/lib/audio/use-idle-mic-release";
import { focusIfDropped } from "@/lib/audio/mic-focus";
import { useProgress } from "@/lib/progress";
import { Button, PageShell } from "@/components/ui";
import { MicAlert } from "@/components/mic-alert";
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
import {
  bandForSong,
  bandOpen,
  createPendingRequest,
  melodyFingerprint,
  setupForSong,
  type PlayerSetup,
  type SessionSummaryData,
} from "./lib";
import { DEFAULT_BROWSE, type BrowseState } from "./browse-controls";
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

/** Where the room stood on the microphone at one render (micJustAnswered). */
export interface MicAsk {
  /** The gate was up. */
  gated: boolean;
  /** The library header's "Enable microphone" was on screen. */
  headerAsk: boolean;
  listening: boolean;
  /** "Continue without a mic" was chosen. */
  listenMode: boolean;
}

/**
 * Whether a control that asked for the microphone just went away because it
 * was answered: the gate, or the library header's button, with the mic now
 * on or the singer going on without one. Not when one went for any other
 * reason (a song picked from the library), which leaves focus to whatever
 * replaced it. "Continue without a mic" swaps the gate for the library, whose
 * header then asks again; the gate's button is still gone.
 */
export function micJustAnswered(prev: MicAsk, next: MicAsk): boolean {
  const gone = (prev.gated && !next.gated) || (prev.headerAsk && !next.headerAsk);
  const answered =
    (next.listening && !prev.listening) || (next.listenMode && !prev.listenMode);
  return gone && answered;
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
  // Whether the singer has allowed the microphone on this visit. The stream
  // itself is closed when the room has been idle for a while (below), so the
  // browser's recording light goes off on the summary and in the library;
  // this is what keeps the gate and the "Enable microphone" asks from coming
  // back after they were answered. Adjusted during render, as the deep link
  // below is. Dropped again when a reopen fails, so the gate returns with
  // its error and "Continue without a mic".
  const [micAllowed, setMicAllowed] = useState(false);
  if (pitch.listening && !micAllowed) setMicAllowed(true);
  // Reopens of the microphone still waiting on the device, so the idle
  // release below never closes a stream a start is about to use.
  const [reopening, setReopening] = useState(0);
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
  // How the last run was set up (key, rate, loop, octave scoring, desk), so
  // the summary's "Sing again" repeats it: the player unmounts while the
  // summary shows. Any other start opens the song fresh.
  const [setup, setSetup] = useState<PlayerSetup | null>(null);
  // The library's filters, search and sort, kept here because the library
  // unmounts while a song plays: coming back used to reset them, and the dice
  // stopped picking from what the singer had filtered to.
  const [browse, setBrowse] = useState<BrowseState>(DEFAULT_BROWSE);
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

  // The summary's "Enable microphone and sing again" waits on a permission
  // prompt that can stay up while the singer goes back to the library or
  // starts another run. Leaving that summary drops the request, so access
  // granted afterwards cannot pull them back into the song they left.
  const micRequestRef = useRef(createPendingRequest());
  useEffect(() => {
    const micRequest = micRequestRef.current;
    return () => micRequest.cancel();
  }, [view, summary]);

  // Out of a run, an open microphone closes after a short idle wait
  // (useIdleMicRelease). It used to stay open on the summary and in the
  // library for as long as the page did, with the browser's recording light
  // on and no control to turn it off. The next start reopens it (startSong).
  // The one exception is a run the mic heard nothing of: its summary shows
  // the live input level, which needs the mic, and has its own control to
  // turn it off, as the warmups' "No sound picked up" note does.
  useIdleMicRelease({
    listening: pitch.listening,
    hold:
      view === "practice" ||
      reopening > 0 ||
      (view === "summary" && summary?.silent === true),
    stop: pitch.stop,
  });

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

  /**
   * `again`: a restart from the summary, which keeps how the last run was set
   * up. Resolves true when the run started.
   */
  async function startSong(song: Song, again = false): Promise<boolean> {
    // Song practice is guided practice: the free day's five minutes apply.
    if (cap.capped) {
      showCapWall();
      return false;
    }
    if (!mayStart(song)) return false;
    // The room closed an idle microphone. Reopen it before the player mounts:
    // a player that opens with the mic off is a listen pass, unscored, and
    // would flash "Listen mode" until access came back. That includes a singer
    // who first went on without a mic and turned it on later. Only if this
    // screen is still the one showing when access arrives, as with the
    // summary's own ask.
    if (micAllowed && !pitch.listening) {
      const current = micRequestRef.current.begin();
      setReopening((n) => n + 1);
      let ok: boolean;
      try {
        ok = await pitch.start();
      } finally {
        setReopening((n) => n - 1);
      }
      if (!ok) {
        // The device is gone, busy or refused. Bring the gate back with the
        // error, which also offers to go on without a mic. That includes a
        // singer who went on without one earlier: left in listen mode, they
        // would get no error and no way to retry, and the next start would
        // be an unscored run.
        setMicAllowed(false);
        setListenMode(false);
        return false;
      }
      if (!current()) return false;
    }
    if (!again) setSetup(null);
    setActiveSong(song);
    setSummary(null);
    replaceTake(undefined);
    setView("practice");
    setPlayToken((t) => t + 1);
    return true;
  }

  function startSongById(id: string, again = false): Promise<boolean> {
    const song = ALL_SONGS.find((s) => s.id === id);
    if (!song || !mayStart(song)) return Promise.resolve(false);
    return startSong(song, again);
  }

  // Recording a play touches localStorage, so it belongs in an effect rather
  // than in the render pass the deep link below starts from. Keying on the
  // song plus the token covers every start path at once.
  useEffect(() => {
    if (activeSong) recordSongPlayed(activeSong.id);
  }, [activeSong, playToken]);

  // A singer who has used today's free minutes meets the cap wall, not a
  // microphone prompt for practice they cannot start.
  const micOn = micAllowed || pitch.listening;
  const gated = !micOn && !listenMode && !cap.capped;

  // The gate's buttons, or the library header's "Enable microphone", go
  // away the moment they are answered, and keyboard focus fell to <body>:
  // the next Tab went back up to the cap note above the taste quiz. Focus
  // moves to what replaced them instead, only if it was dropped (see
  // focusIfDropped): the player's Play on a song link, otherwise the page's
  // title, from which Tab reaches the library's first control.
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mic: MicAsk = {
    gated,
    headerAsk: !gated && view === "library" && !micOn && !cap.capped,
    listening: micOn,
    listenMode,
  };
  const micRef = useRef(mic);
  useEffect(() => {
    const answered = micJustAnswered(micRef.current, mic);
    micRef.current = mic;
    if (!answered) return;
    focusIfDropped(
      view === "practice"
        ? document.querySelector<HTMLElement>("#song-transport button")
        : titleRef.current,
    );
  });

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
  const showNext = nextSetlistSong !== null && mayStart(nextSetlistSong);

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
      titleRef={titleRef}
      title={
        view === "practice" && activeSong
          ? activeSong.title
          : view === "summary" && summary
            ? "Practice summary"
            : "Public domain songs to sing in your key"
      }
      subtitle={view === "library" ? "Pick a song to start your practice loop." : undefined}
      actions={
        !micOn && view === "library" && !cap.capped ? (
          <Button
            variant="rec"
            size="sm"
            onClick={async () => {
              // As the gate and the summary do: a listen pass scores nothing
              // even with the mic on, so the next song opens on Sing along. A
              // singer who continued without a mic otherwise turned it on
              // here and still sang every song unscored. Only while the
              // library is still showing, so access granted after a song has
              // started cannot switch that run's pass.
              const current = micRequestRef.current.begin();
              if (!(await pitch.start()) || !current()) return;
              setPass((p) => (p === "listen" ? "guided" : p));
            }}
          >
            <IconMic /> Enable microphone
          </Button>
        ) : undefined
      }
    >
      {/* The header's "Enable microphone" fails here, beside the press, as it
          does at the gate: a singer who continued without a mic, or left the
          player for the library, otherwise pressed it to no visible effect. */}
      {view === "library" && !pitch.listening && !cap.capped && pitch.error && (
        <MicAlert message={pitch.error} className="mb-4 max-w-md text-sm text-rec" />
      )}
      {view === "library" && cap.capped && (
        <div className="mb-6">
          <CapWall cap={cap} />
        </div>
      )}
      {/* In every view, not only the library: a song page's "Sing" link opens
          the player directly, and "Sing again" and "Next" start a run from
          the summary, so the time left has to be on screen there too or the
          wall arrives as a surprise. In the player it sits above the
          transport instead: every start scrolls Play into view, which on a
          phone puts the top of the page above the screen. */}
      {!cap.capped && view !== "practice" && <FreeAllowance cap={cap} className="mb-4" />}
      {view === "library" && (
        <Library
          progress={progress}
          visitUnlockedSongId={linkedId}
          onSelect={(song) => void startSong(song)}
          browse={browse}
          onBrowseChange={setBrowse}
        />
      )}

      {view === "practice" && activeSong && (
        <SongPlayer
          // A fresh player for every start, so a restart's setup (or none)
          // is what it opens with.
          key={playToken}
          song={activeSong}
          setup={setupForSong(setup, activeSong.id)}
          pitch={pitch}
          range={progress.range}
          mode={mode}
          onModeChange={setMode}
          pass={pass}
          onPassChange={setPass}
          onFinish={(data, runSetup) => {
            // The whole summary, not just the id: what the run was sung at is
            // what makes the mastery re-judgeable and auditable later.
            if (data.mastered)
              recordMastered(data.song.id, {
                tempo: data.tempo,
                transpose: data.transpose,
                score: data.score ?? 0,
                melody: melodyFingerprint(data.song),
              });
            setSetup(runSetup);
            setSummary(data);
            setView("summary");
          }}
          onTake={replaceTake}
          allowance={!cap.capped && !cap.isPro ? <FreeAllowance cap={cap} className="mb-3" /> : undefined}
          onExit={() => {
            // Walking out mid-night stops the setlist without clearing it, so
            // the running order survives for the next "Start setlist".
            endSetlist();
            setView("library");
          }}
        />
      )}

      {/* "Sing again" or "Next" reopens the microphone the last run closed;
          a failure to reopen it shows here, above the buttons that asked. */}
      {view === "summary" && summary && micAllowed && !pitch.listening && pitch.error && (
        <MicAlert message={pitch.error} className="mb-4 max-w-md text-sm text-rec" />
      )}
      {view === "summary" && summary && (
        <SessionSummary
          data={summary}
          take={take}
          onAgain={() => void startSongById(summary.song.id, true)}
          // A run sung without a microphone ends on advice to turn it on, so
          // the summary carries the control. It starts the run the way "Sing
          // again" does — through the cap and the ladder (which still lets
          // the linked song through) — and leaves listen mode alone. A listen
          // pass scores nothing even with the mic on, so it moves to Sing
          // along; a pass the singer picked themselves stays.
          onEnableMic={
            micOn
              ? undefined
              : async () => {
                  // Capped: show why, and ask for no microphone that cannot
                  // be used today.
                  if (cap.capped) {
                    showCapWall();
                    return;
                  }
                  // Only if this summary is still the one showing.
                  const current = micRequestRef.current.begin();
                  if (!(await pitch.start()) || !current()) return;
                  setPass((p) => (p === "listen" ? "guided" : p));
                  void startSongById(summary.song.id, true);
                }
          }
          micError={pitch.listening ? null : pitch.error}
          // For the audio setup a run the mic heard nothing of ends on.
          listening={pitch.listening}
          level={pitch.frame.volume}
          onMicOff={pitch.stop}
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
                  // Moves the running order on only once the next song has
                  // started: a reopen of the microphone that fails or is left
                  // behind must not skip it.
                  void startSongById(nextSetlistSong.id).then((started) => {
                    if (started) advanceSetlist();
                  });
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
