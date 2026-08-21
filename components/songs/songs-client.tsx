"use client";

import { useEffect, useState } from "react";
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
import { SessionSummary } from "./session-summary";
import { recordSongPlayed } from "./favorites";
import { advanceSetlist, endSetlist, useSetlist } from "./setlist";
import type { SessionSummaryData } from "./lib";

type View = "library" | "practice" | "summary";

/**
 * Whether this song may be started at all. Membership in SONGS is the
 * paywall; everything else in the songbook needs an active Pro entitlement.
 * Every entry point routes through here — a card, a deep link, a setlist, a
 * "sing again" — so none of them can become the one that leaks a Pro song.
 */
function canStart(song: Song): boolean {
  if (SONGS.some((s) => s.id === song.id)) return true;
  return getProState().active;
}

export function SongsClient() {
  const pitch = usePitch();
  const progress = useProgress();
  const searchParams = useSearchParams();
  const setlist = useSetlist();

  const [listenMode, setListenMode] = useState(false);
  const [view, setView] = useState<View>("library");
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  // Bumped on every start so a repeat of the same song still counts as a play;
  // the effect below keys off it as well as the song identity.
  const [playToken, setPlayToken] = useState(0);

  function startSong(song: Song) {
    setActiveSong(song);
    setSummary(null);
    setView("practice");
    setPlayToken((t) => t + 1);
  }

  function startSongById(id: string) {
    const song = ALL_SONGS.find((s) => s.id === id);
    if (!song || !canStart(song)) return;
    startSong(song);
  }

  // Recording a play touches localStorage, so it belongs in an effect rather
  // than in the render pass the deep link below starts from. Keying on the
  // song plus the token covers every start path at once.
  useEffect(() => {
    if (activeSong) recordSongPlayed(activeSong.id);
  }, [activeSong, playToken]);

  const gated = !pitch.listening && !listenMode;

  // A song page links here as /songs?song=<slug>, so arriving from search
  // lands on the melody that was being read about rather than the library.
  // Resolved through canStart, so a Pro link cannot open a Pro song for a
  // free reader — it drops them in the library instead.
  const deepLinkSlug = searchParams.get("song");
  const deepLinkSong = deepLinkSlug
    ? (ALL_SONGS.find((s) => s.slug === deepLinkSlug) ?? null)
    : null;

  // Consumed once, and only after the mic gate clears, so the singer still
  // gets asked for a microphone first and lands on the requested song after.
  // Adjusted during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [deepLinkDone, setDeepLinkDone] = useState(false);
  if (!deepLinkDone && !gated) {
    setDeepLinkDone(true);
    if (deepLinkSong && canStart(deepLinkSong)) {
      setActiveSong(deepLinkSong);
      setSummary(null);
      setView("practice");
      setPlayToken((t) => t + 1);
    }
  }

  const pendingDeepLink = !deepLinkDone && deepLinkSong && canStart(deepLinkSong);

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
        onListen={() => setListenMode(true)}
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
            : "Song practice"
      }
      subtitle={view === "library" ? "Pick a song to start your practice loop." : undefined}
      actions={
        !pitch.listening && view === "library" ? (
          <Button variant="rec" size="sm" onClick={pitch.start}>
            <IconMic /> Enable microphone
          </Button>
        ) : undefined
      }
    >
      {view === "library" && <Library progress={progress} onSelect={startSong} />}

      {view === "practice" && activeSong && (
        <SongPlayer
          song={activeSong}
          pitch={pitch}
          range={progress.range}
          onFinish={(data) => {
            setSummary(data);
            setView("summary");
          }}
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
          onAgain={() => startSongById(summary.song.id)}
          onLibrary={() => {
            endSetlist();
            setView("library");
          }}
          nextInSetlist={showNext ? nextSetlistSong.title : undefined}
          onNext={
            showNext
              ? () => {
                  const id = advanceSetlist();
                  if (id) startSongById(id);
                  else setView("library");
                }
              : undefined
          }
        />
      )}
    </PageShell>
  );
}
