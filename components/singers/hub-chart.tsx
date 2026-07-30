import Link from "next/link";
import { midiToLabel } from "@/lib/audio/notes";
import { rangeLabel, spanOctaves, type Singer } from "@/lib/singers";

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

  return (
    <div>
      <div className="sm:grid sm:grid-cols-[11rem_minmax(0,1fr)_5.5rem] sm:items-center sm:gap-x-4">
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

      <ul className="mt-1 divide-y divide-line/50">
        {list.map((s) => {
          const left = pct(s.lowMidi);
          const width = Math.max(0.8, pct(s.highMidi + 1) - left);
          const beltPct =
            s.beltMidi != null
              ? ((s.beltMidi - s.lowMidi + 1) / (s.highMidi - s.lowMidi + 1)) * 100
              : 100;
          return (
            <li key={s.slug} className="cv-auto">
              <Link
                href={`/singers/${s.slug}`}
                aria-label={`${s.name}, ${s.voiceType}, cited range ${midiToLabel(s.lowMidi)} to ${midiToLabel(s.highMidi)}`}
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
                    className="absolute inset-y-1 rounded-full bg-cool/30 transition-colors group-hover:bg-cool/45"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-cool/70 transition-colors group-hover:bg-cool"
                      style={{ width: `${beltPct}%` }}
                    />
                    {s.whistle && (
                      <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full border border-cool bg-bg" />
                    )}
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
    </div>
  );
}
