"use client";

import { useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { useProgress } from "@/lib/progress";
import { Button, Card, PageShell } from "@/components/ui";
import { IconHeadphones, IconMic } from "./icons";
import { SONGS, type Song } from "./data";
import { Library } from "./library";
import { SongPlayer } from "./song-player";
import { SessionSummary } from "./session-summary";
import type { SessionSummaryData } from "./lib";

type View = "library" | "practice" | "summary";

export function SongsClient() {
  const pitch = usePitch();
  const progress = useProgress();

  const [listenMode, setListenMode] = useState(false);
  const [view, setView] = useState<View>("library");
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);

  function startSong(song: Song) {
    setActiveSong(song);
    setSummary(null);
    setView("practice");
  }

  function startSongById(id: string) {
    const song = SONGS.find((s) => s.id === id);
    if (song) startSong(song);
  }

  const gated = !pitch.listening && !listenMode;

  if (gated) {
    return (
      <PageShell
        kicker="Songs"
        title="Karaoke practice"
        subtitle="Listen to a short phrase from a well-known melody, then sing it back on a scrolling piano roll."
      >
        <Card>
          <h2 className="text-xl">Enable your microphone to get scored</h2>
          <p className="mt-2 max-w-md text-sm text-mut">
            Suede Sing needs the mic to score your pitch against the melody in
            real time. Audio never leaves your browser. You can also practice
            without a mic in listen mode — the guide melody still plays, just
            without scoring.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="rec" size="lg" onClick={pitch.start}>
              <IconMic /> Enable microphone
            </Button>
            <Button variant="outline" size="lg" onClick={() => setListenMode(true)}>
              <IconHeadphones /> Continue without a mic
            </Button>
          </div>
          {pitch.error && (
            <p className="mt-4 max-w-md text-sm text-rec" role="alert">
              {pitch.error}
            </p>
          )}
        </Card>
      </PageShell>
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
            : "Karaoke practice"
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
          onExit={() => setView("library")}
        />
      )}

      {view === "summary" && summary && (
        <SessionSummary
          data={summary}
          onAgain={() => startSongById(summary.song.id)}
          onLibrary={() => setView("library")}
        />
      )}
    </PageShell>
  );
}
