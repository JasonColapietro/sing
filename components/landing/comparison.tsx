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
    // Singing Carrots corrected part → yes on the August 2026 recheck: they
    // ship "Sustain & Breath training" as a named practice feature, so the
    // "unclear from public info" hedge no longer applies to them.
    label: "Breath training",
    marks: ["yes", "part", "yes", "part", "yes", "part"],
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
    label: "Works on the web, no install required",
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
  yes: { glyph: "✓", className: "text-ok-ink", sr: "yes" },
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
      {/* The table needs 720px; the section gives it (viewport - 48px), so 768px
          is the exact width where it stops overflowing — zero slack, and media
          queries measure the viewport *including* a classic scrollbar while the
          content box is sized without it, so md: would drop both affordances
          ~15px early on desktops with non-overlay scrollbars. 800px keeps the
          slack. Below it the scrollbar is suppressed by no-scrollbar and iOS
          overlay bars only appear mid-scroll, so the fade and the cue are the
          only signal that five competitor columns exist off to the right —
          keep them on the same threshold. */}
      <p className="mb-3 font-mono text-xs text-dim min-[800px]:hidden">
        Swipe for {COMPETITORS.length} competitors <span aria-hidden>→</span>
      </p>
      <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-line bg-panel [contain:layout]">
        {/* The scroller is the keyboard-focusable element here (no links or
            buttons inside the table), and it exactly fills the overflow-hidden
            wrapper above, which would clip the default 2px-outside focus ring
            entirely. Draw it inset so it survives the clip and clears the
            rounded corners. */}
        <div className="no-scrollbar w-full min-w-0 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] focus-visible:[outline-offset:-2px] min-[800px]:[mask-image:none]">
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
                  className={
                    i < ROWS.length - 1 ? "border-b border-line" : undefined
                  }
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
      </div>
      <p className="mt-3 font-mono text-xs text-dim">
        Competitor rows rechecked August 2026 against vendor sites and app
        listings.{" "}
        <span className="text-amber-ink">～</span> = partial, limited, video-only,
        or unclear from public info.
      </p>
    </div>
  );
}
