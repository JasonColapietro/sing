"use client";

import { useEffect, useRef, useState } from "react";
import { ProgressBar } from "@/components/ui";
import type { TakeRecord } from "./db";
import { IconDownload, IconPause, IconPlay, IconStar, IconTrash } from "./icons";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function fmtDur(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TakeRow({
  take,
  selected,
  playing,
  progress,
  abLabel,
  abDisabled,
  wavBusy,
  onSelect,
  onTogglePlay,
  onToggleStar,
  onRename,
  onDelete,
  onDownloadOriginal,
  onDownloadWav,
  onToggleAb,
}: {
  take: TakeRecord;
  selected: boolean;
  /** True when this take is loaded and audibly playing. */
  playing: boolean;
  /** 0..1 playback progress (0 when not the loaded take). */
  progress: number;
  /** "A" | "B" when picked for compare, otherwise null. */
  abLabel: "A" | "B" | null;
  /** True when two other takes are already picked. */
  abDisabled: boolean;
  wavBusy: boolean;
  onSelect: () => void;
  onTogglePlay: () => void;
  onToggleStar: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onDownloadOriginal: () => void;
  onDownloadWav: () => void;
  onToggleAb: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(take.name);
  const [armed, setArmed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  // Disarm the delete confirm after a few seconds of inactivity.
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 5000);
    return () => window.clearTimeout(t);
  }, [armed]);

  const commitRename = () => {
    setEditing(false);
    const name = draft.trim();
    if (name && name !== take.name) onRename(name);
    else setDraft(take.name);
  };

  return (
    <li
      className={cn(
        "rounded-xl border p-3 transition-colors",
        selected ? "border-amber/50 bg-panel2" : "border-line bg-panel hover:border-line2",
      )}
      onClick={onSelect}
      aria-current={selected || undefined}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
            playing
              ? "border-amber bg-amber text-[#241a05]"
              : "border-line2 text-ink hover:border-amber hover:text-amber",
          )}
          aria-label={playing ? `Pause ${take.name}` : `Play ${take.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
        >
          {playing ? <IconPause /> : <IconPlay className="ml-0.5 h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraft(take.name);
                  setEditing(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-md border border-line2 bg-panel px-2 py-0.5 font-mono text-sm text-ink"
              aria-label="Take name"
              maxLength={80}
            />
          ) : (
            <button
              type="button"
              className="tabular block max-w-full truncate rounded font-mono text-sm text-ink hover:text-amber"
              title="Rename take"
              aria-label={`Rename ${take.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setDraft(take.name);
                setEditing(true);
              }}
            >
              {take.name}
            </button>
          )}
          <div className="mt-0.5 flex items-center gap-2 text-xs text-mut">
            <span className="tabular font-mono">{fmtDur(take.durationSec)}</span>
            <span aria-hidden="true">·</span>
            <span>{fmtDate(take.createdAt)}</span>
            {take.rating !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className="flex items-center gap-0.5 text-amber"
                  aria-label={`Self-rating ${take.rating} of 5`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <IconStar key={n} filled={n <= (take.rating ?? 0)} className="h-3 w-3" />
                  ))}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          className={cn(
            "shrink-0 rounded-full p-1.5 transition-colors",
            take.starred ? "text-amber" : "text-dim hover:text-amber",
          )}
          aria-label={take.starred ? `Unstar ${take.name}` : `Star ${take.name}`}
          aria-pressed={take.starred}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
        >
          <IconStar filled={take.starred} />
        </button>
      </div>

      {take.note && (
        <p className="mt-1.5 truncate pl-12 text-xs text-mut" title={take.note}>
          &ldquo;{take.note}&rdquo;
        </p>
      )}

      {progress > 0 && (
        <div className="mt-2 pl-12">
          <ProgressBar value={progress * 100} tone="amber" />
        </div>
      )}

      {armed ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-12 text-xs">
          <span className="text-rec">Delete take? This can&rsquo;t be undone.</span>
          <button
            type="button"
            className="rounded-full bg-rec px-2.5 py-1 font-medium text-[#1a0703] hover:bg-[#ff6f60]"
            onClick={(e) => {
              e.stopPropagation();
              setArmed(false);
              onDelete();
            }}
          >
            Delete
          </button>
          <button
            type="button"
            className="rounded-full border border-line2 px-2.5 py-1 text-ink hover:border-amber"
            onClick={(e) => {
              e.stopPropagation();
              setArmed(false);
            }}
          >
            Keep
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-1.5 pl-12">
          <button
            type="button"
            className={cn(
              "rounded-full border px-2 py-0.5 font-mono text-[11px] transition-colors",
              abLabel
                ? "border-cool/60 text-cool"
                : abDisabled
                  ? "cursor-not-allowed border-line text-dim opacity-50"
                  : "border-line text-mut hover:border-cool hover:text-cool",
            )}
            aria-label={
              abLabel ? `Remove ${take.name} from A/B compare` : `Pick ${take.name} for A/B compare`
            }
            aria-pressed={abLabel !== null}
            disabled={abDisabled && !abLabel}
            onClick={(e) => {
              e.stopPropagation();
              onToggleAb();
            }}
          >
            {abLabel ? `A/B · ${abLabel}` : "A/B"}
          </button>
          <span className="flex-1" />
          <button
            type="button"
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-dim hover:text-ink"
            aria-label={`Download ${take.name} original`}
            title="Download original"
            onClick={(e) => {
              e.stopPropagation();
              onDownloadOriginal();
            }}
          >
            <IconDownload className="h-3.5 w-3.5" />
            <span className="font-mono uppercase">orig</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-dim hover:text-ink disabled:opacity-50"
            aria-label={`Download ${take.name} as WAV`}
            title="Download WAV"
            disabled={wavBusy}
            onClick={(e) => {
              e.stopPropagation();
              onDownloadWav();
            }}
          >
            <IconDownload className="h-3.5 w-3.5" />
            <span className="font-mono uppercase">{wavBusy ? "…" : "wav"}</span>
          </button>
          <button
            type="button"
            className="rounded-full p-1.5 text-dim hover:text-rec"
            aria-label={`Delete ${take.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setArmed(true);
            }}
          >
            <IconTrash />
          </button>
        </div>
      )}
    </li>
  );
}
