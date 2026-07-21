"use client";

import { SONGS, type Song } from "./data";
import type { ProgressState } from "@/lib/progress";
import { Card, LinkButton, Pill, SectionLabel } from "@/components/ui";
import {
  bestScoreForSong,
  computeDifficulty,
  formatMinSec,
  phraseSeconds,
} from "./lib";

function difficultyTone(label: "Easy" | "Medium" | "Hard"): "ok" | "amber" | "rec" {
  if (label === "Easy") return "ok";
  if (label === "Medium") return "amber";
  return "rec";
}

export function Library({
  progress,
  onSelect,
}: {
  progress: ProgressState;
  onSelect: (song: Song) => void;
}) {
  const hasRange = progress.range.lowMidi !== undefined && progress.range.highMidi !== undefined;

  return (
    <div className="space-y-8">
      {!hasRange && (
        <Card className="border-amber/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <SectionLabel>No range saved</SectionLabel>
              <p className="mt-2 max-w-md text-sm text-mut">
                Take the range test and songs can auto-transpose to fit your
                voice with &ldquo;Fit to my range.&rdquo;
              </p>
            </div>
            <LinkButton href="/range" variant="outline" size="sm">
              Take the range test
            </LinkButton>
          </div>
        </Card>
      )}

      <section>
        <SectionLabel>Songs</SectionLabel>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SONGS.map((song) => {
            const difficulty = computeDifficulty(song);
            const best = bestScoreForSong(progress.sessions, song.title);
            const seconds = phraseSeconds(song);
            return (
              <button
                key={song.id}
                type="button"
                onClick={() => onSelect(song)}
                className="text-left"
              >
                <Card className="h-full transition-colors hover:border-amber/40">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg">{song.title}</h3>
                    {best !== undefined && <Pill tone="ok">Best {best}%</Pill>}
                  </div>
                  <p className="mt-2 text-sm text-mut">{song.origin}</p>
                  <div className="mt-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                    <span>{song.notes.length} notes</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatMinSec(seconds)} phrase</span>
                    <span aria-hidden="true">·</span>
                    <Pill tone={difficultyTone(difficulty.label)}>{difficulty.label}</Pill>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
