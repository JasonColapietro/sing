"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PRO_SONGS, SONGS, type Song } from "./data";
import type { ProgressState } from "@/lib/progress";
import { useIsPro } from "@/lib/pro";
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  Pill,
  SectionLabel,
} from "@/components/ui";
import { FreeOnly, ProInlineNudge } from "@/components/pro/gate";
import { ProChip } from "@/components/pro/ui";
import {
  BAND_LABEL,
  BAND_ORDER,
  BAND_UNLOCK_MASTERED,
  bandForSong,
  bandOpen,
  bestScoreForSong,
  computeDifficulty,
  formatMinSec,
  loopsFor,
  phraseSeconds,
  rangeFit,
  sessionSeconds,
  type RangeFit,
} from "./lib";
import {
  recordSongPlayed,
  relativeTime,
  toggleFavorite,
  useFavorites,
  useMastered,
  useRecentlyPlayed,
} from "./favorites";
import {
  addToSetlist,
  beginSetlist,
  clearSetlist,
  moveInSetlist,
  removeFromSetlist,
  useSetlist,
} from "./setlist";
import {
  activeFilterCount,
  applyBrowse,
  browseOptions,
  BrowseControls,
  DEFAULT_BROWSE,
  type BrowseState,
} from "./browse-controls";

/**
 * The songbook browser.
 *
 * The catalog a singer can act on is derived from Pro state on every render:
 * `SONGS` for everyone, plus `PRO_SONGS` only when Pro is active. Nothing here
 * ever renders a start affordance for a song outside that set — the locked Pro
 * cards are links to /pro, not buttons — and `songs-client.tsx` re-checks
 * entitlement before a Pro song actually plays.
 */

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function difficultyTone(label: "Easy" | "Medium" | "Hard"): "ok" | "violet" | "rec" {
  if (label === "Easy") return "ok";
  if (label === "Medium") return "violet";
  return "rec";
}

function semitones(n: number): string {
  return `${n} semitone${n === 1 ? "" : "s"}`;
}

/** Plain-language range verdict, or null when there's no saved range to judge against. */
function rangeBadge(
  fit: RangeFit,
): { tone: "ok" | "violet" | "rec"; text: string } | null {
  switch (fit.verdict) {
    case "fits":
      return { tone: "ok", text: "Fits your range" };
    case "high":
      return { tone: "violet", text: `${semitones(fit.offsetSemis)} high` };
    case "low":
      return { tone: "violet", text: `${semitones(Math.abs(fit.offsetSemis))} low` };
    case "wide":
      return { tone: "rec", text: "Wider than your range" };
    default:
      return null;
  }
}

function HeartButton({
  active,
  title,
  onClick,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`Favorite ${title}`}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border p-1.5 transition-colors",
        active
          ? "border-rec/50 text-rec"
          : "border-line text-dim hover:border-line2 hover:text-mut",
      )}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        aria-hidden="true"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      >
        <path d="M7 11.9C7 11.9 1.9 8.8 1.9 5.5A2.6 2.6 0 0 1 7 4.2a2.6 2.6 0 0 1 5.1 1.3c0 3.3-5.1 6.4-5.1 6.4Z" />
      </svg>
    </button>
  );
}

/** Square icon button for the setlist reorder/remove controls. */
function MiniButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-mut transition-colors hover:border-line2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** Check mark for a song the singer has mastered — a solo pass in performance mode. */
function MasteredMark() {
  return (
    <span
      role="img"
      aria-label="Mastered"
      title="Mastered"
      className="inline-flex shrink-0 text-violet-ink"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.6 7.3 5.5 10.2 11.4 3.9" />
      </svg>
    </span>
  );
}

/** Lock mark for a song whose band hasn't opened yet. */
function LockMark() {
  return (
    <span
      role="img"
      aria-label="Locked"
      title="Locked"
      className="inline-flex shrink-0 text-dim"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      >
        <rect x="2.75" y="6.1" width="8.5" height="5.4" rx="1.2" />
        <path d="M4.9 6.1V4.7a2.1 2.1 0 0 1 4.2 0v1.4" />
      </svg>
    </span>
  );
}

function SongCard({
  song,
  best,
  fit,
  favorite,
  queued,
  mastered,
  locked,
  pro,
  onStart,
  onFavorite,
  onQueue,
}: {
  song: Song;
  best: number | undefined;
  fit: RangeFit;
  favorite: boolean;
  queued: boolean;
  /** A solo pass sung in performance mode at or above the mastery score. */
  mastered: boolean;
  /** This song's band hasn't opened yet — it still lists, marked with a lock. */
  locked: boolean;
  /** True when this song comes from the Pro book (only ever rendered to Pro members). */
  pro: boolean;
  onStart: () => void;
  onFavorite: () => void;
  onQueue: () => void;
}) {
  const difficulty = computeDifficulty(song);
  const badge = rangeBadge(fit);
  const full = song.form === "full";

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg">{song.title}</h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {mastered && <MasteredMark />}
          {locked && <LockMark />}
          <HeartButton active={favorite} title={song.title} onClick={onFavorite} />
        </div>
      </div>
      <p className="mt-2 text-sm text-mut">{song.origin}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Pill tone={difficultyTone(difficulty.label)}>{difficulty.label}</Pill>
        <Pill>{song.genre}</Pill>
        {pro && <ProChip />}
        {best !== undefined && <Pill tone="ok">Best {best}%</Pill>}
        {badge && <Pill tone={badge.tone}>{badge.text}</Pill>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        <span className="tabular">{song.notes.length} notes</span>
        <span aria-hidden="true">·</span>
        <span className="tabular">
          {full
            ? `${formatMinSec(sessionSeconds(song))} full song`
            : `${formatMinSec(phraseSeconds(song))} phrase`}
        </span>
        {!full && (
          <>
            <span aria-hidden="true">·</span>
            <span className="tabular">×{loopsFor(song)} loops</span>
          </>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {/* A locked band's songs stay in view but do not start: the ladder is
            the mechanic, and a lock that still plays would make the unlock
            line above the band a lie. */}
        <Button
          size="sm"
          onClick={onStart}
          disabled={locked}
          title={locked ? "Master more songs in the band below to open this one" : undefined}
        >
          {locked ? "Locked" : "Sing"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={queued}
          onClick={onQueue}
          disabled={locked && !queued}
        >
          {queued ? "Queued" : "Add to setlist"}
        </Button>
        <Link
          href={`/songs/${song.slug}`}
          className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
        >
          About
        </Link>
      </div>
    </Card>
  );
}

export function Library({
  progress,
  onSelect,
  onStartSetlist,
}: {
  progress: ProgressState;
  onSelect: (song: Song) => void;
  /**
   * Karaoke-night entry point. Given the queued songs in order, the caller is
   * expected to play them back to back. Optional: without it the setlist still
   * starts its first song through `onSelect`, and the persisted cursor lets the
   * caller step through with `advanceSetlist()`.
   */
  onStartSetlist?: (songs: Song[]) => void;
}) {
  const hasRange =
    progress.range.lowMidi !== undefined && progress.range.highMidi !== undefined;
  const isPro = useIsPro();
  const favorites = useFavorites();
  const mastered = useMastered();
  const recents = useRecentlyPlayed();
  const setlist = useSetlist();
  const [browse, setBrowse] = useState<BrowseState>(DEFAULT_BROWSE);

  // The single definition of "songs this singer can start". Everything below —
  // filtering, the dice, the setlist, the recents row — reads from this, so no
  // surface can accidentally offer a locked song.
  const accessible = useMemo(
    () => (isPro ? [...SONGS, ...PRO_SONGS] : SONGS),
    [isPro],
  );

  const options = useMemo(() => browseOptions(accessible), [accessible]);
  const visible = useMemo(
    () =>
      applyBrowse(accessible, browse, {
        range: progress.range,
        favorites,
        sessions: progress.sessions,
        recents,
      }),
    [accessible, browse, progress.range, progress.sessions, favorites, recents],
  );

  const active = activeFilterCount(browse);
  const favoriteCount = useMemo(
    () => accessible.filter((s) => favorites.includes(s.id)).length,
    [accessible, favorites],
  );

  // Bands are the spine of the grid: every song sits in exactly one, and a band
  // that hasn't opened still shows its songs — locked, under the one line that
  // says what opens it — so the singer can see where the book goes next.
  const bandSections = useMemo(
    () =>
      BAND_ORDER.map((band, i) => {
        const below = i > 0 ? BAND_ORDER[i - 1] : undefined;
        const done = below
          ? accessible.filter((s) => bandForSong(s) === below && mastered.has(s.id)).length
          : 0;
        return {
          band,
          songs: visible.filter((s) => bandForSong(s) === band),
          open: bandOpen(band, mastered, accessible),
          unlock: below
            ? `${done} of ${BAND_UNLOCK_MASTERED} ${BAND_LABEL[below]} songs mastered — master ${Math.max(BAND_UNLOCK_MASTERED - done, 0)} more to open this band.`
            : "",
        };
      }).filter((section) => section.songs.length > 0),
    [accessible, visible, mastered],
  );

  function start(song: Song) {
    if (!bandOpen(bandForSong(song), mastered, accessible)) return;
    // Recorded here as well as (optionally) in the caller: the recently-sung
    // row must not look dead just because the wiring hasn't landed. The store
    // keys on song id, so recording twice for one start is a no-op.
    recordSongPlayed(song.id);
    onSelect(song);
  }

  function surprise() {
    // Respect the filters the singer just set — the dice should pick from what
    // they're looking at — and fall back to the whole accessible book.
    const openSongs = accessible.filter((s) => bandOpen(bandForSong(s), mastered, accessible));
    const filtered = visible.filter((s) => bandOpen(bandForSong(s), mastered, accessible));
    const pool = filtered.length > 0 ? filtered : openSongs;
    const song = pool[Math.floor(Math.random() * pool.length)];
    if (song) start(song);
  }

  // Queued ids resolved against the accessible catalog: a Pro song left in the
  // queue by a lapsed subscriber simply stops appearing rather than becoming a
  // start button they can press.
  const queuedSongs = useMemo(
    () =>
      setlist.ids
        .map((id) => accessible.find((s) => s.id === id))
        .filter((s): s is Song => s !== undefined && bandOpen(bandForSong(s), mastered, accessible)),
    [setlist.ids, accessible, mastered],
  );
  const nowSingingId = setlist.cursor >= 0 ? setlist.ids[setlist.cursor] : null;

  function startSetlist() {
    if (onStartSetlist) {
      onStartSetlist(queuedSongs);
      return;
    }
    const firstId = beginSetlist();
    const song = firstId ? accessible.find((s) => s.id === firstId) : undefined;
    if (song) start(song);
  }

  const recentSongs = useMemo(
    () =>
      recents
        .map((r) => {
          const song = accessible.find((s) => s.id === r.id);
          return song ? { song, at: r.at } : null;
        })
        .filter((r): r is { song: Song; at: string } => r !== null)
        .slice(0, 6),
    [recents, accessible],
  );

  return (
    <div className="space-y-8">
      {!hasRange && (
        <Card className="border-violet/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <SectionLabel>No range saved</SectionLabel>
              <p className="mt-2 max-w-md text-sm text-mut">
                Take the range test and songs can auto-transpose to fit your
                voice with &ldquo;Fit to my range,&rdquo; and every card will
                say whether it sits in your range as written.
              </p>
            </div>
            <LinkButton href="/range" variant="outline" size="sm">
              Take the range test
            </LinkButton>
          </div>
        </Card>
      )}

      {/* Hidden while filtering: a "recently sung" shortcut row alongside a
          narrowed grid reads as a search result the singer didn't ask for. */}
      {recentSongs.length > 0 && active === 0 && (
        <section>
          <SectionLabel>Recently sung</SectionLabel>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {recentSongs.map(({ song, at }) => (
              <button
                key={song.id}
                type="button"
                onClick={() => start(song)}
                className="w-44 shrink-0 rounded-xl border border-line bg-panel px-4 py-3 text-left transition-colors hover:border-violet/40"
              >
                <div className="truncate text-sm">{song.title}</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                  {relativeTime(at)}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {queuedSongs.length > 0 && (
        <Card className="border-violet/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <SectionLabel>Setlist</SectionLabel>
              <span className="tabular font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                {queuedSongs.length} song{queuedSongs.length === 1 ? "" : "s"}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={startSetlist}>
                Start setlist
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSetlist}>
                Clear
              </Button>
            </div>
          </div>
          <ol className="mt-4 space-y-1.5">
            {queuedSongs.map((song, i) => (
              <li
                key={song.id}
                className="flex items-center gap-2 rounded-lg border border-line bg-panel2/60 px-3 py-2"
              >
                <span className="tabular w-4 font-mono text-[11px] text-dim">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{song.title}</span>
                {song.id === nowSingingId && <Pill tone="violet">Now</Pill>}
                <MiniButton
                  label={`Move ${song.title} up`}
                  disabled={i === 0}
                  onClick={() => moveInSetlist(song.id, -1)}
                >
                  ↑
                </MiniButton>
                <MiniButton
                  label={`Move ${song.title} down`}
                  disabled={i === queuedSongs.length - 1}
                  onClick={() => moveInSetlist(song.id, 1)}
                >
                  ↓
                </MiniButton>
                <MiniButton
                  label={`Remove ${song.title} from the setlist`}
                  onClick={() => removeFromSetlist(song.id)}
                >
                  ✕
                </MiniButton>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <BrowseControls
        state={browse}
        onChange={setBrowse}
        options={options}
        hasRange={hasRange}
        onSurprise={surprise}
        resultCount={visible.length}
        totalCount={accessible.length}
        favoriteCount={favoriteCount}
      />

      <section>
        <span className="flex items-center gap-2">
          <SectionLabel>Songs</SectionLabel>
          {isPro && <ProChip />}
        </span>

        {visible.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No songs match those filters"
              hint={
                browse.favoritesOnly && favoriteCount === 0
                  ? "Star a song with the heart on its card and it will show up here."
                  : "Try widening the search, or clear the filters to see the whole book."
              }
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBrowse({ ...DEFAULT_BROWSE, sort: browse.sort })}
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-8">
            {bandSections.map(({ band, songs: bandSongs, open, unlock }) => (
              <section key={band} aria-label={`${BAND_LABEL[band]} band`}>
                <div className="flex flex-wrap items-center gap-2">
                  <SectionLabel>{BAND_LABEL[band]}</SectionLabel>
                  <span className="tabular font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                    {bandSongs.length} song{bandSongs.length === 1 ? "" : "s"}
                  </span>
                  {!open && <Pill>Locked</Pill>}
                </div>
                {!open && <p className="mt-1.5 text-sm text-mut">{unlock}</p>}
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {bandSongs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      best={bestScoreForSong(progress.sessions, song.title)}
                      fit={rangeFit(song, progress.range)}
                      favorite={favorites.includes(song.id)}
                      queued={setlist.ids.includes(song.id)}
                      mastered={mastered.has(song.id)}
                      locked={!open}
                      pro={isPro && !SONGS.some((s) => s.id === song.id)}
                      onStart={() => start(song)}
                      onFavorite={() => toggleFavorite(song.id)}
                      onQueue={() =>
                        setlist.ids.includes(song.id)
                          ? removeFromSetlist(song.id)
                          : addToSetlist(song.id)
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* The songbook is no longer the paywall — all 26 melodies are free,
            because six public-domain folk tunes held back from someone who
            already had twenty was a gate that argued against buying. What Pro
            adds on this surface is the record of singing them. */}
        <FreeOnly>
          <ProInlineNudge>
            Pro charts every take of every song, so you can hear month one
            against month six
          </ProInlineNudge>
        </FreeOnly>
      </section>
    </div>
  );
}
