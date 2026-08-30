"use client";

import { useId, type ReactNode } from "react";
import type { SessionLog, VocalRange } from "@/lib/progress";
import { Button, Card } from "@/components/ui";
import type { Song, SongForm } from "./types";
import { bestScoreForSong, computeDifficulty, rangeFit, sessionSeconds } from "./lib";
import { lastPlayedAt, type RecentPlay } from "./favorites";

/**
 * Search, filter, and sort for the songbook.
 *
 * Every option list is derived from the catalog that gets passed in, never
 * declared here — a new genre or era in `data.ts` has to show up as a filter
 * without anyone remembering to add it, and a genre nothing is tagged with
 * must never appear as a chip that leads to an empty grid.
 */

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type SortKey = "title" | "difficulty" | "length" | "best" | "recent";

export const SORT_LABELS: Array<{ key: SortKey; label: string }> = [
  { key: "title", label: "Title A–Z" },
  { key: "difficulty", label: "Easiest first" },
  { key: "length", label: "Shortest first" },
  { key: "best", label: "Best score" },
  { key: "recent", label: "Recently sung" },
];

export interface BrowseState {
  query: string;
  /** Selected difficulty labels ("Easy" | "Medium" | "Hard"). */
  difficulty: string[];
  genre: string[];
  era: string[];
  language: string[];
  form: SongForm[];
  /** Only songs that sit inside the saved vocal range as written. */
  fitsRange: boolean;
  favoritesOnly: boolean;
  sort: SortKey;
}

export const DEFAULT_BROWSE: BrowseState = {
  query: "",
  difficulty: [],
  genre: [],
  era: [],
  language: [],
  form: [],
  fitsRange: false,
  favoritesOnly: false,
  sort: "title",
};

/** How many things the singer has narrowed by — drives the count and "Clear all". */
export function activeFilterCount(s: BrowseState): number {
  return (
    (s.query.trim() ? 1 : 0) +
    s.difficulty.length +
    s.genre.length +
    s.era.length +
    s.language.length +
    s.form.length +
    (s.fitsRange ? 1 : 0) +
    (s.favoritesOnly ? 1 : 0)
  );
}

export interface BrowseOptions {
  difficulty: string[];
  genre: string[];
  era: string[];
  language: string[];
  form: SongForm[];
}

const DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"];

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/** The filter values that actually occur in this catalog. */
export function browseOptions(songs: Song[]): BrowseOptions {
  return {
    difficulty: DIFFICULTY_ORDER.filter((label) =>
      songs.some((s) => computeDifficulty(s).label === label),
    ),
    genre: unique(songs.map((s) => s.genre)).sort((a, b) => a.localeCompare(b)),
    // Eras are free text ("Traditional", "1800s") but sort usefully as strings.
    era: unique(songs.map((s) => s.era)).sort((a, b) => a.localeCompare(b)),
    language: unique(songs.map((s) => s.language)).sort((a, b) => a.localeCompare(b)),
    form: (["phrase", "full"] as SongForm[]).filter((f) => songs.some((s) => s.form === f)),
  };
}

export function formLabel(form: SongForm): string {
  return form === "phrase" ? "Phrase loop" : "Full song";
}

export interface BrowseContext {
  range: VocalRange;
  favorites: readonly string[];
  sessions: SessionLog[];
  recents: readonly RecentPlay[];
}

function difficultyRank(song: Song): number {
  return DIFFICULTY_ORDER.indexOf(computeDifficulty(song).label);
}

/** Filter then sort, in one pass over the catalog. Pure — safe inside useMemo. */
export function applyBrowse(
  songs: Song[],
  state: BrowseState,
  ctx: BrowseContext,
): Song[] {
  const q = state.query.trim().toLowerCase();

  const matches = songs.filter((song) => {
    if (state.favoritesOnly && !ctx.favorites.includes(song.id)) return false;
    if (q) {
      const haystack = [song.title, song.origin, song.genre, song.language, song.era]
        .concat(song.tags)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (state.difficulty.length && !state.difficulty.includes(computeDifficulty(song).label)) {
      return false;
    }
    if (state.genre.length && !state.genre.includes(song.genre)) return false;
    if (state.era.length && !state.era.includes(song.era)) return false;
    if (state.language.length && !state.language.includes(song.language)) return false;
    if (state.form.length && !state.form.includes(song.form)) return false;
    if (state.fitsRange && rangeFit(song, ctx.range).verdict !== "fits") return false;
    return true;
  });

  const byTitle = (a: Song, b: Song) => a.title.localeCompare(b.title);

  // Every comparator falls back to title so the grid order is stable and
  // reproducible rather than dependent on the catalog's declaration order.
  const comparators: Record<SortKey, (a: Song, b: Song) => number> = {
    title: byTitle,
    difficulty: (a, b) => difficultyRank(a) - difficultyRank(b) || byTitle(a, b),
    length: (a, b) => sessionSeconds(a) - sessionSeconds(b) || byTitle(a, b),
    best: (a, b) => {
      const sa = bestScoreForSong(ctx.sessions, a.title);
      const sb = bestScoreForSong(ctx.sessions, b.title);
      // Never-sung songs sort last: this view is for beating your own record.
      if (sa === undefined && sb === undefined) return byTitle(a, b);
      if (sa === undefined) return 1;
      if (sb === undefined) return -1;
      return sb - sa || byTitle(a, b);
    },
    recent: (a, b) => {
      const ta = lastPlayedAt(ctx.recents, a.id);
      const tb = lastPlayedAt(ctx.recents, b.id);
      if (ta === undefined && tb === undefined) return byTitle(a, b);
      if (ta === undefined) return 1;
      if (tb === undefined) return -1;
      return tb - ta;
    },
  };

  return [...matches].sort(comparators[state.sort]);
}

/* ------------------------------------------------------------------- chips */

function Chip({
  label,
  active,
  onClick,
  disabled,
  title,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "border-violet bg-violet/15 text-violet-ink"
          : "border-line text-mut hover:border-line2 hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

/**
 * One labelled row of chips. The row scrolls sideways on its own rather than
 * wrapping to four lines or pushing the page wide at 375px.
 */
function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        {label}
      </div>
      <div
        role="group"
        aria-label={label}
        className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5"
      >
        {children}
      </div>
    </div>
  );
}

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function BrowseControls({
  state,
  onChange,
  options,
  hasRange,
  onSurprise,
  resultCount,
  totalCount,
  favoriteCount,
}: {
  state: BrowseState;
  onChange: (next: BrowseState) => void;
  options: BrowseOptions;
  /** Whether a vocal range is saved — gates the "Fits my range" filter. */
  hasRange: boolean;
  onSurprise: () => void;
  resultCount: number;
  totalCount: number;
  favoriteCount: number;
}) {
  const searchId = useId();
  const sortId = useId();
  const active = activeFilterCount(state);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={searchId}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
          >
            Search
          </label>
          <input
            id={searchId}
            type="search"
            value={state.query}
            onChange={(e) => onChange({ ...state, query: e.target.value })}
            placeholder="Title, tradition, genre, tag…"
            className="mt-1.5 w-full rounded-full border border-line2 bg-panel2 px-4 py-2 text-sm text-ink placeholder:text-dim"
          />
        </div>
        <div>
          <label
            htmlFor={sortId}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
          >
            Sort
          </label>
          <select
            id={sortId}
            value={state.sort}
            onChange={(e) => onChange({ ...state, sort: e.target.value as SortKey })}
            className="mt-1.5 w-full rounded-full border border-line2 bg-panel2 px-4 py-2 text-sm text-ink"
          >
            {SORT_LABELS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={onSurprise}>
          Surprise me
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip
          label={favoriteCount > 0 ? `Favorites (${favoriteCount})` : "Favorites"}
          active={state.favoritesOnly}
          disabled={favoriteCount === 0 && !state.favoritesOnly}
          title={favoriteCount === 0 ? "Star a song first" : undefined}
          onClick={() => onChange({ ...state, favoritesOnly: !state.favoritesOnly })}
        />
        <Chip
          label="Fits my range"
          active={state.fitsRange}
          disabled={!hasRange}
          title={hasRange ? undefined : "Take the range test to use this filter"}
          onClick={() => onChange({ ...state, fitsRange: !state.fitsRange })}
        />
        {!hasRange && (
          <span className="text-xs text-dim">Range test needed for range filtering</span>
        )}
        <span className="ml-auto flex items-center gap-3">
          <span className="tabular font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            {resultCount} of {totalCount} songs
            {active > 0 && ` · ${active} filter${active === 1 ? "" : "s"}`}
          </span>
          {active > 0 && (
            <Button variant="ghost" size="sm" onClick={() => onChange({ ...DEFAULT_BROWSE, sort: state.sort })}>
              Clear all
            </Button>
          )}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.difficulty.length > 1 && (
          <ChipRow label="Difficulty">
            {options.difficulty.map((d) => (
              <Chip
                key={d}
                label={d}
                active={state.difficulty.includes(d)}
                onClick={() =>
                  onChange({ ...state, difficulty: toggleValue(state.difficulty, d) })
                }
              />
            ))}
          </ChipRow>
        )}
        {options.form.length > 1 && (
          <ChipRow label="Form">
            {options.form.map((f) => (
              <Chip
                key={f}
                label={formLabel(f)}
                active={state.form.includes(f)}
                onClick={() => onChange({ ...state, form: toggleValue(state.form, f) })}
              />
            ))}
          </ChipRow>
        )}
        {options.genre.length > 1 && (
          <ChipRow label="Genre">
            {options.genre.map((g) => (
              <Chip
                key={g}
                label={g}
                active={state.genre.includes(g)}
                onClick={() => onChange({ ...state, genre: toggleValue(state.genre, g) })}
              />
            ))}
          </ChipRow>
        )}
        {options.era.length > 1 && (
          <ChipRow label="Era">
            {options.era.map((e) => (
              <Chip
                key={e}
                label={e}
                active={state.era.includes(e)}
                onClick={() => onChange({ ...state, era: toggleValue(state.era, e) })}
              />
            ))}
          </ChipRow>
        )}
        {options.language.length > 1 && (
          <ChipRow label="Language">
            {options.language.map((l) => (
              <Chip
                key={l}
                label={l}
                active={state.language.includes(l)}
                onClick={() =>
                  onChange({ ...state, language: toggleValue(state.language, l) })
                }
              />
            ))}
          </ChipRow>
        )}
      </div>
    </Card>
  );
}
