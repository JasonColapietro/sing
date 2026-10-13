import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import { rangeLabel, spanOctaves, type Singer } from "@/lib/singers";
import { balancedChunks } from "@/lib/singers-core";
import {
  FULL_VOICE_FILL_CLASS,
  RangeBarKey,
  WHISTLE_DOT_CLASS,
  fullVoicePct,
  rangeBarWords,
  spanBarClass,
} from "@/components/singers/range-bar";

const MAX_SINGERS_PER_SECTION = 24;

/**
 * Static range chart for a hub page — same shared-axis reading as the main
 * directory, minus the filters and the localStorage overlay, so a hub stays a
 * server component and its links are in the initial HTML.
 */
export function HubChart({
  list,
  axisLow,
  axisHigh,
}: {
  list: Singer[];
  axisLow: number;
  axisHigh: number;
}) {
  const span = axisHigh - axisLow;
  const pct = (m: number) => ((m - axisLow) / span) * 100;
  const octaveTile = (12 / span) * 100;
  const grid = `repeating-linear-gradient(90deg, rgba(201,189,160,0.5) 0, rgba(201,189,160,0.5) 1px, transparent 1px, transparent ${octaveTile}%)`;
  const octaveCs: number[] = [];
  for (let m = Math.ceil(axisLow / 12) * 12; m <= axisHigh; m += 12) {
    octaveCs.push(m);
  }
  const groups = balancedChunks(list, MAX_SINGERS_PER_SECTION);

  return (
    <div>
      {/* The bars carry three marks (full-voice share, the reach above it,
          whistle) and a dashed style for no cited ceiling; without this key
          a search visitor landing on a hub could not decode any of them. */}
      <p className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] text-mut">
        <RangeBarKey
          noCeiling={list.some((s) => s.beltMidi == null)}
          whistle={list.some((s) => s.whistle)}
        />
      </p>
      {/* Columns capped as a share of the row as well as in rem, for the same
          reason as the directory's ROW_GRID: at 200% text zoom the rem values
          double and squeeze this ruler to about 48px, stacking every octave
          label on the same pixels. The caps never bind at normal sizes. */}
      <div className="sm:grid sm:grid-cols-[min(11rem,40%)_minmax(0,1fr)_min(5.5rem,20%)] sm:items-center sm:gap-x-4">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-dim sm:block">
          low → high
        </span>
        <div aria-hidden="true" className="relative h-4">
          {octaveCs.map((m) => (
            <span
              key={m}
              className="absolute -translate-x-1/2 font-mono text-[10px] text-dim"
              style={{ left: `${pct(m)}%` }}
            >
              {midiToLabel(m)}
            </span>
          ))}
        </div>
        <span className="hidden sm:block" />
      </div>

      {groups.map((group, groupIndex) => (
        <section
          key={group[0].slug}
          aria-labelledby={`singer-chart-group-${groupIndex}`}
          className="mt-4 first:mt-1"
        >
          <h3
            id={`singer-chart-group-${groupIndex}`}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim"
          >
            Singers {group[0].name} through {group[group.length - 1].name}
          </h3>
          <ul className="mt-1 divide-y divide-line/50">
            {group.map((s) => {
              const left = pct(s.lowMidi);
              const width = Math.max(0.8, pct(s.highMidi + 1) - left);
              const beltPct = fullVoicePct(s);
              return (
                <li key={s.slug} className="cv-auto">
                  {/* prefetch off: a hub lists up to 300 singers, and the
                      default fetched each page's payload on scroll. */}
                  <Link
                    href={`/singers/${s.slug}`}
                    prefetch={false}
                    aria-label={[
                      `${s.name}, ${s.voiceType}`,
                      `cited range ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)}`,
                      ...rangeBarWords(s),
                    ].join(", ")}
                    className="group block rounded-xl px-2 py-2.5 transition-colors hover:bg-panel sm:grid sm:grid-cols-[11rem_minmax(0,1fr)_5.5rem] sm:items-center sm:gap-x-4"
                  >
                    <span className="flex items-baseline justify-between gap-2 sm:block">
                      <span className="block truncate text-sm font-medium text-ink">
                        {s.name}
                      </span>
                      <span className="tabular shrink-0 font-mono text-[11px] text-mut sm:hidden">
                        {rangeLabel(s)}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="relative mt-1.5 block h-6 sm:mt-0"
                      style={{ backgroundImage: grid }}
                    >
                      <span
                        className={`absolute inset-y-1 ${spanBarClass(s)}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        {beltPct != null && (
                          <span
                            className={FULL_VOICE_FILL_CLASS}
                            style={{ width: `${beltPct}%` }}
                          />
                        )}
                        {s.whistle && <span className={WHISTLE_DOT_CLASS} />}
                      </span>
                    </span>
                    <span className="hidden text-right font-mono text-[11px] leading-tight text-mut sm:block">
                      <span className="tabular block">{rangeLabel(s)}</span>
                      <span className="tabular block">
                        {spanOctaves(s.highMidi - s.lowMidi)} oct
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
