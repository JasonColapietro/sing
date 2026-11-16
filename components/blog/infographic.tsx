import { labelToMidi } from "@/lib/audio/notes";
import type { Infographic } from "@/lib/blog/types";

/**
 * The Singer's Column infographics. Each is drawn in HTML from the post's own
 * data, so the figure is real text a crawler and a screen reader can read, it
 * reflows on a 375px phone, and no image file can drift from the article.
 * Hook-free, so it renders in the server page.
 */

const frame = "mt-8 overflow-hidden rounded-2xl border border-line bg-panel";
const head = "border-b border-line px-4 py-3 sm:px-5";
const titleClass = "font-mono text-label uppercase tracking-[0.14em] text-amber-ink";
const footClass = "border-t border-line px-4 py-2.5 text-sm leading-snug text-mut sm:px-5";

function Frame({
  title,
  sub,
  foot,
  children,
}: {
  title: string;
  sub?: string;
  foot?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className={frame} data-infographic>
      <figcaption className={head}>
        <span className={titleClass}>Infographic</span>
        <span className="mt-1 block text-lg leading-snug text-ink">{title}</span>
        {sub && <span className="mt-0.5 block text-sm text-mut">{sub}</span>}
      </figcaption>
      <div className="px-4 py-4 sm:px-5">{children}</div>
      {foot && <p className={footClass}>{foot}</p>}
    </figure>
  );
}

/** Lowest and highest note a range strip shows: C2 to C6 covers every voice type. */
const STRIP_LOW = 36;
const STRIP_HIGH = 84;
const C_MARKS = [36, 48, 60, 72, 84];

function pct(midi: number): number {
  const clamped = Math.min(STRIP_HIGH, Math.max(STRIP_LOW, midi));
  return ((clamped - STRIP_LOW) / (STRIP_HIGH - STRIP_LOW)) * 100;
}

export function InfographicFigure({ data }: { data: Infographic }) {
  switch (data.kind) {
    case "steps":
      return (
        <Frame title={data.title}>
          <ol className="grid gap-3 sm:grid-cols-2">
            {data.steps.map((s, i) => (
              <li key={s.label} className="flex gap-3 rounded-xl border border-line bg-bg p-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber font-mono text-sm text-ink"
                >
                  {i + 1}
                </span>
                <span>
                  <span className="sr-only">Step {i + 1}: </span>
                  <span className="block font-semibold text-ink">{s.label}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-mut">{s.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </Frame>
      );
    case "bars": {
      const max = Math.max(...data.bars.map((b) => b.value), 1);
      return (
        <Frame title={data.title} sub={data.unit} foot={data.source}>
          <ul className="space-y-3">
            {data.bars.map((b) => (
              <li key={b.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ink">{b.label}</span>
                  <span className="font-mono text-mut">
                    {b.value} {data.unit}
                  </span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-panel2" aria-hidden="true">
                  <div className="h-full rounded-full bg-amber" style={{ width: `${(b.value / max) * 100}%` }} />
                </div>
                {b.note && <p className="mt-1 text-xs leading-snug text-mut">{b.note}</p>}
              </li>
            ))}
          </ul>
        </Frame>
      );
    }
    case "compare":
      return (
        <Frame title={data.title}>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th scope="col" className="border-b border-line2 py-2 pr-3">
                    <span className="sr-only">Aspect</span>
                  </th>
                  {data.columns.map((c) => (
                    <th
                      key={c}
                      scope="col"
                      className="border-b border-line2 py-2 pr-3 font-mono text-label uppercase tracking-[0.12em] text-dim"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.label} className="align-top">
                    <th scope="row" className="border-b border-line py-2.5 pr-3 font-semibold text-ink">
                      {r.label}
                    </th>
                    {r.cells.map((cell, i) => (
                      <td key={i} className="border-b border-line py-2.5 pr-3 leading-relaxed text-mut">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Frame>
      );
    case "range":
      return (
        <Frame title={data.title} foot={data.source}>
          <div className="relative">
            <ul className="space-y-3">
              {data.spans.map((s) => {
                const lo = labelToMidi(s.low);
                const hi = labelToMidi(s.high);
                if (lo == null || hi == null) return null;
                const left = pct(lo);
                const width = Math.max(pct(hi) - left, 1.5);
                return (
                  <li key={s.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink">{s.label}</span>
                      <span className="font-mono text-mut">
                        {s.low}–{s.high}
                      </span>
                    </div>
                    <div className="relative mt-1 h-3 rounded-full bg-panel2" aria-hidden="true">
                      <div
                        className="absolute inset-y-0 rounded-full bg-amber"
                        style={{ left: `${left}%`, width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="relative mt-2 h-4 font-mono text-[11px] text-dim" aria-hidden="true">
              {C_MARKS.map((m) => (
                <span key={m} className="absolute -translate-x-1/2" style={{ left: `${pct(m)}%` }}>
                  C{Math.floor(m / 12) - 1}
                </span>
              ))}
            </div>
          </div>
        </Frame>
      );
    case "checklist":
      return (
        <Frame title={data.title}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.items.map((it) => (
              <li key={it.text} className="flex gap-2.5 text-sm leading-relaxed text-ink/85">
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-panel ${
                    it.tone === "do" ? "bg-ok" : "bg-rec"
                  }`}
                >
                  {it.tone === "do" ? "✓" : "✕"}
                </span>
                <span>
                  <span className="sr-only">{it.tone === "do" ? "Do: " : "Avoid: "}</span>
                  {it.text}
                </span>
              </li>
            ))}
          </ul>
        </Frame>
      );
  }
}
