type Mark = "yes" | "part" | "no";

const COMPETITORS = [
  "Yousician",
  "Sing Sharp",
  "Vocaberry",
  "Singing Carrots",
  "30 Day Singer",
] as const;

/** [Suede Sing, Yousician, Sing Sharp, Vocaberry, Singing Carrots, 30 Day Singer] */
const ROWS: Array<{ label: string; marks: [Mark, Mark, Mark, Mark, Mark, Mark] }> = [
  {
    label: "Real-time pitch feedback",
    marks: ["yes", "yes", "yes", "yes", "yes", "no"],
  },
  {
    label: "Vocal range test",
    marks: ["yes", "yes", "yes", "yes", "yes", "no"],
  },
  {
    label: "Guided warmups",
    marks: ["yes", "yes", "yes", "yes", "part", "yes"],
  },
  {
    label: "Ear training",
    marks: ["yes", "yes", "yes", "part", "yes", "part"],
  },
  {
    label: "Breath training",
    marks: ["yes", "part", "yes", "part", "part", "part"],
  },
  {
    label: "Take recorder",
    marks: ["yes", "part", "yes", "yes", "part", "no"],
  },
  {
    label: "Song practice",
    marks: ["yes", "yes", "part", "yes", "part", "part"],
  },
  {
    label: "Auto-transpose to your range",
    marks: ["yes", "yes", "part", "yes", "part", "no"],
  },
  {
    label: "Progress tracking",
    marks: ["yes", "yes", "part", "yes", "yes", "part"],
  },
  {
    label: "Works on the web, no install",
    marks: ["yes", "no", "no", "no", "yes", "yes"],
  },
  {
    label: "Free core",
    marks: ["yes", "part", "yes", "yes", "part", "no"],
  },
  {
    label: "No ads",
    marks: ["yes", "yes", "no", "part", "yes", "yes"],
  },
];

const MARK_STYLE: Record<Mark, { glyph: string; className: string; sr: string }> = {
  yes: { glyph: "✓", className: "text-ok", sr: "yes" },
  part: { glyph: "～", className: "text-amber-ink", sr: "partial" },
  no: { glyph: "✗", className: "text-dim", sr: "no" },
};

function MarkCell({ mark }: { mark: Mark }) {
  const m = MARK_STYLE[mark];
  return (
    <span className={`font-mono text-sm ${m.className}`}>
      <span aria-hidden>{m.glyph}</span>
      <span className="sr-only">{m.sr}</span>
    </span>
  );
}

export default function ComparisonTable() {
  return (
    <div className="w-full min-w-0 [contain:layout]">
      <div className="no-scrollbar w-full min-w-0 overflow-x-auto rounded-2xl border border-line bg-panel [contain:layout]">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="px-4 py-3.5 font-normal text-dim">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em]">
                  Feature
                </span>
              </th>
              <th
                scope="col"
                className="bg-panel2 px-4 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-amber-ink"
              >
                Suede Sing
              </th>
              {COMPETITORS.map((name) => (
                <th
                  scope="col"
                  key={name}
                  className="px-4 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] font-normal text-mut"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={i < ROWS.length - 1 ? "border-b border-line" : undefined}
              >
                <th scope="row" className="px-4 py-3 font-normal text-ink">
                  {row.label}
                </th>
                {row.marks.map((mark, j) => (
                  <td
                    key={j}
                    className={j === 0 ? "bg-panel2 px-4 py-3" : "px-4 py-3"}
                  >
                    <MarkCell mark={mark} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-xs text-dim">
        Compiled July 2026 from vendor sites and app-store reviews.{" "}
        <span className="text-amber-ink">～</span> = partial, limited, video-only,
        or unclear from public info.
      </p>
    </div>
  );
}
