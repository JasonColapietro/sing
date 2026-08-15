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
import { FreeOnly } from "@/components/pro/gate";
import { ProChip, ProLockTag } from "@/components/pro/ui";
import {
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
  formLabel,
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

function difficultyTone(label: "Easy" | "Medium" | "Hard"): "ok" | "amber" | "rec" {
  if (label === "Easy") return "ok";
  if (label === "Medium") return "amber";
  return "rec";
}

function semitones(n: number): string {
  return `${n} semitone${n === 1 ? "" : "s"}`;
}

/** Plain-language range verdict, or null when there's no saved range to judge against. */
function rangeBadge(
  fit: RangeFit,
): { tone: "ok" | "amber" | "rec"; text: string } | null {
  switch (fit.verdict) {
    case "fits":
      return { tone: "ok", text: "Fits your range" };
    case "high":
      return { tone: "amber", text: `${semitones(fit.offsetSemis)} high` };
    case "low":
      return { tone: "amber", text: `${semitones(Math.abs(fit.offsetSemis))} low` };
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

function SongCard({
  song,
  best,
  fit,
  favorite,
  queued,
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
        <HeartButton active={favorite} title={song.title} onClick={onFavorite} />
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
        <Button size="sm" onClick={onStart}>
          Sing
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={queued}
          onClick={onQueue}
        >
          {queued ? "Queued" : "Add to setlist"}
        </Button>
        <Link
          href={`/songs/${song.slug}`}
          className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-amber-ink underline decoration-amber/50 underline-offset-4 hover:decoration-amber"
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

  function start(song: Song) {
    // Recorded here as well as (optionally) in the caller: the recently-sung
    // row must not look dead just because the wiring hasn't landed. The store
    // keys on song id, so recording twice for one start is a no-op.
    recordSongPlayed(song.id);
    onSelect(song);
  }

  function surprise() {
    // Respect the filters the singer just set — the dice should pick from what
    // they're looking at — and fall back to the whole accessible book.
    const pool = visible.length > 0 ? visible : accessible;
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
        .filter((s): s is Song => s !== undefined),
    [setlist.ids, accessible],
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
        <Card className="border-amber/30">
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
                className="w-44 shrink-0 rounded-xl border border-line bg-panel px-4 py-3 text-left transition-colors hover:border-amber/40"
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
        <Card className="border-amber/30">
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
                {song.id === nowSingingId && <Pill tone="amber">Now</Pill>}
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                best={bestScoreForSong(progress.sessions, song.title)}
                fit={rangeFit(song, progress.range)}
                favorite={favorites.includes(song.id)}
                queued={setlist.ids.includes(song.id)}
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

            {/* Teasers are a conversion surface, not a search result: they sit
                out while filters are on so "no songs match" stays honest. Their
                content is derived from PRO_SONGS — title, genre, difficulty and
                nothing else, never lyrics — so the book can grow without this
                list going stale. */}
            {active === 0 && (
              <FreeOnly>
                {PRO_SONGS.slice(0, 3).map((song) => (
                  <Link
                    key={song.id}
                    href="/pro"
                    aria-label={`${song.title} — unlock with Suede Pro`}
                    className="block h-full"
                  >
                    <Card className="h-full transition-colors hover:border-amber/40">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg text-mut">{song.title}</h3>
                        <ProLockTag />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <Pill tone={difficultyTone(computeDifficulty(song).label)}>
                          {computeDifficulty(song).label}
                        </Pill>
                        <Pill>{song.genre}</Pill>
                        <Pill>{formLabel(song.form)}</Pill>
                      </div>
                      <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                        Pro songbook
                      </div>
                    </Card>
                  </Link>
                ))}
              </FreeOnly>
            )}
          </div>
        )}

        {/* Never quote the size of the Pro songbook here: it is smaller than the
            free grid directly above it, so a count argues against buying. Name
            the unlock instead — PRO_SONGS carries Amazing Grace as a `form:
            "full"` two-verse arrangement, where the free book has the phrase. */}
        {PRO_SONGS.length > 3 && (
          <FreeOnly>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              More in the Pro songbook — Amazing Grace in full, not just the
              opening phrase ·{" "}
              <Link
                href="/pro"
                className="text-amber-ink underline decoration-amber/50 underline-offset-4 hover:decoration-amber"
              >
                See Pro
              </Link>
            </p>
          </FreeOnly>
        )}
      </section>
    </div>
  );
}
