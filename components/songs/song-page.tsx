import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import { Card, Pill, SectionLabel, Stat } from "@/components/ui";
import {
  computeDifficulty,
  formatMinSec,
  loopsFor,
  lyricLines,
  phraseSeconds,
  sessionSeconds,
  songNoteRange,
} from "./lib";
import type { Song } from "./types";

/**
 * Server-rendered presentation for /songs/[slug]. Nothing here is interactive:
 * the practice room is the client component on /songs, and this is the page a
 * crawler and a curious reader get — the words, the numbers, and the reason the
 * melody is free to sing.
 */

/** Plain-text lyrics, one line per printed line — also what the JSON-LD carries. */
export function songLyricText(song: Song): string {
  return lyricLines(song.notes)
    .map((l) => l.text)
    .join("\n");
}

export interface SongFacts {
  tonic: string;
  lowLabel: string;
  highLabel: string;
  rangeSemis: number;
  difficulty: "Easy" | "Medium" | "Hard";
  leaps: number;
  noteCount: number;
  loops: number;
  phraseSec: number;
  sessionSec: number;
}

/** Everything the page states about a melody, derived once and shared. */
export function songFacts(song: Song): SongFacts {
  const [lo, hi] = songNoteRange(song);
  const d = computeDifficulty(song);
  return {
    tonic: midiToLabel(song.defaultKeyRootMidi),
    lowLabel: midiToLabel(lo),
    highLabel: midiToLabel(hi),
    rangeSemis: d.rangeSemis,
    difficulty: d.label,
    leaps: d.leaps,
    noteCount: song.notes.length,
    loops: loopsFor(song),
    phraseSec: phraseSeconds(song),
    sessionSec: sessionSeconds(song),
  };
}

/**
 * Related songs for the cluster: same genre first, then anything rated the same
 * difficulty, then whatever is left. The pool is passed in rather than read
 * from the data module so a free page links free pages and a Pro page links Pro
 * pages — the noindexed half of the songbook should not be the destination of
 * every internal link on the indexed half.
 */
export function relatedSongs(song: Song, pool: Song[], max = 6): Song[] {
  const others = pool.filter((s) => s.slug !== song.slug);
  const difficulty = computeDifficulty(song).label;
  const sameGenre = others.filter((s) => s.genre === song.genre);
  const sameDifficulty = others.filter(
    (s) =>
      s.genre !== song.genre && computeDifficulty(s).label === difficulty,
  );
  const rest = others.filter(
    (s) => !sameGenre.includes(s) && !sameDifficulty.includes(s),
  );
  return [...sameGenre, ...sameDifficulty, ...rest].slice(0, max);
}

/** The measured facts, as a readout. */
export function SongStats({ song }: { song: Song }) {
  const f = songFacts(song);
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionLabel>Written range</SectionLabel>
          <div className="tabular mt-3 font-mono text-4xl font-bold sm:text-5xl">
            {f.lowLabel}
            <span className="text-dim"> — </span>
            {f.highLabel}
          </div>
          <p className="mt-2 text-sm text-mut">
            {f.rangeSemis} semitones as transcribed. The practice room
            transposes it to sit in your own range.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-5">
          <Stat label="Tonic" value={f.tonic} tone="amber" />
          <Stat label="Tempo" value={song.bpm} sub="bpm" tone="ink" />
          <Stat
            label="Meter"
            value={song.beatsPerBar}
            sub="beats per bar"
            tone="ink"
          />
          <Stat label="Notes" value={f.noteCount} tone="cool" />
          <Stat label="Difficulty" value={f.difficulty} tone="rec" />
        </div>
      </div>
      <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            One time through
          </dt>
          <dd className="tabular mt-1 text-sm">
            {formatMinSec(f.phraseSec)} at {song.bpm} bpm
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            A full session
          </dt>
          <dd className="tabular mt-1 text-sm">
            {formatMinSec(f.sessionSec)} — {f.loops}{" "}
            {f.loops === 1 ? "pass" : "passes"}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Leaps of a third or more
          </dt>
          <dd className="tabular mt-1 text-sm">{f.leaps}</dd>
        </div>
      </dl>
    </Card>
  );
}

/** The lyrics as printed — the substance of the page. */
export function LyricSheet({ song }: { song: Song }) {
  const lines = lyricLines(song.notes);
  const label = song.form === "full" ? "Lyrics" : "The phrase you sing";
  return (
    <Card>
      <SectionLabel>{label}</SectionLabel>
      <h2 className="mt-3 text-xl">
        {song.title} lyrics{song.form === "phrase" ? ", as transcribed here" : ""}
      </h2>
      <ol className="mt-5 max-w-2xl space-y-3">
        {lines.map((l) => (
          <li key={l.index} className="flex gap-4">
            <span
              aria-hidden="true"
              className="tabular w-5 shrink-0 pt-1.5 font-mono text-[11px] text-dim"
            >
              {l.index + 1}
            </span>
            <span className="text-lg leading-relaxed text-ink">{l.text}</span>
          </li>
        ))}
      </ol>
      {song.form === "phrase" && (
        <p className="mt-5 max-w-2xl text-sm text-mut">
          The songbook transcribes the opening phrase rather than the whole
          song, because {song.defaultLoops} tight repetitions of a phrase you
          can hear yourself improve on beats one distracted run at the full
          thing.
        </p>
      )}
    </Card>
  );
}

/** Why the melody is free — the differentiator, stated plainly. */
export function PublicDomainNote({ song }: { song: Song }) {
  return (
    <Card>
      <SectionLabel>Why this one is free to sing</SectionLabel>
      <h2 className="mt-3 text-xl">Origin and copyright status</h2>
      <p className="mt-3 max-w-3xl text-mut">{song.publicDomain}</p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Attribution
          </dt>
          <dd className="mt-1 text-sm">{song.origin}</dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Language
          </dt>
          <dd className="mt-1 text-sm">{song.language}</dd>
        </div>
      </dl>
      <p className="mt-5 max-w-3xl text-xs text-dim">
        Every melody in the songbook is public domain, which is why the whole
        thing can be sung in a browser without a licence. A specific recording
        or arrangement of the same tune can still be under copyright — this is
        our own transcription of the melody.
      </p>
    </Card>
  );
}

const SECTION_TONE: Record<string, "amber" | "cool" | "ok" | "rec" | "mut"> = {
  intro: "mut",
  verse: "cool",
  prechorus: "mut",
  chorus: "amber",
  refrain: "amber",
  bridge: "rec",
  outro: "mut",
};

/** Section map, for the full arrangements that have one. */
export function SongSectionMap({ song }: { song: Song }) {
  if (!song.sections || song.sections.length === 0) return null;
  return (
    <Card>
      <SectionLabel>Structure</SectionLabel>
      <h2 className="mt-3 text-xl">How the arrangement is laid out</h2>
      <ol className="mt-4 space-y-2">
        {song.sections.map((s) => {
          const bars = (s.endBeat - s.startBeat) / song.beatsPerBar;
          return (
            <li
              key={`${s.label}-${s.startBeat}`}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-bg px-4 py-3"
            >
              <Pill tone={SECTION_TONE[s.kind] ?? "mut"}>{s.kind}</Pill>
              <span className="text-sm font-medium">{s.label}</span>
              <span className="tabular ml-auto font-mono text-[11px] text-dim">
                {Number.isInteger(bars) ? bars : bars.toFixed(1)} bars · beat{" "}
                {s.startBeat}–{s.endBeat}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/** Browse metadata as pills. */
export function SongTags({ song }: { song: Song }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Pill tone="cool">{song.genre}</Pill>
      <Pill tone="mut">{song.era}</Pill>
      <Pill tone="mut">{song.language}</Pill>
      {song.tags.map((t) => (
        <Pill key={t} tone="mut">
          {t}
        </Pill>
      ))}
    </div>
  );
}

/**
 * A grid of song links. Shared by the related list on a song page and the
 * crawlable index on /songs, so the two never drift in shape.
 */
export function SongLinkList({ songs }: { songs: Song[] }) {
  if (songs.length === 0) return null;
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((s) => {
        const [lo, hi] = songNoteRange(s);
        return (
          <li key={s.slug}>
            <Link
              href={`/songs/${s.slug}`}
              className="flex h-full items-baseline justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3 transition-colors hover:border-amber"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {s.title}
                </span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                  {s.genre} · {computeDifficulty(s).label}
                </span>
              </span>
              <span className="tabular shrink-0 font-mono text-[11px] text-mut">
                {midiToLabel(lo)}–{midiToLabel(hi)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
