import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import { MelodyContour } from "@/components/figures";
import { computeDifficulty, songNoteRange } from "./lib";
import type { Song } from "./types";

/** The /songs songbook rows: SongLinkList's row with the opening phrase's contour beside the range. */
export function SongbookList({ songs }: { songs: Song[] }) {
  if (songs.length === 0) return null;
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {songs.map((s) => {
        const [lo, hi] = songNoteRange(s);
        return (
          <li key={s.slug}>
            <Link
              href={`/songs/${s.slug}`}
              className="flex h-full items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3 transition-colors hover:border-violet"
            >
              <span className="min-w-0">
                {/* Wraps, not truncates: beside the contour a phone row has
                    about 190px, and the end of a title ("(Opening Lines…)")
                    is what tells an arrangement apart. */}
                <span className="block text-sm font-medium [overflow-wrap:anywhere]">{s.title}</span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                  {s.genre} · {computeDifficulty(s).label}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <MelodyContour notes={s.notes} />
                <span className="tabular font-mono text-[11px] text-mut">
                  {midiToLabel(lo)}–{midiToLabel(hi)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
