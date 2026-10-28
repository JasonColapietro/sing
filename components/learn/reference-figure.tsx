import { AMBER, COOL, DIM, LINE2, MONO, STRIP_WHITE } from "@/lib/chart-colors";

/** The five small reference figures (120x48) for glossary groups and course stages. */
export type ReferenceFigureKind = "semitone" | "registers" | "spans" | "support" | "harmonics";

const W = 120;
const H = 48;

function Semitone() {
  // Thirteen keys: a bracket over one step, a wider one over the octave.
  const kw = W / 13;
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} x={i * kw + 0.5} y={22} width={kw - 1} height={22} fill={STRIP_WHITE} />
      ))}
      <rect x={0.5} y={22} width={kw - 1} height={22} fill={COOL} opacity={0.75} />
      <rect x={kw + 0.5} y={22} width={kw - 1} height={22} fill={COOL} opacity={0.45} />
      <rect x={12 * kw + 0.5} y={22} width={kw - 1} height={22} fill={COOL} opacity={0.75} />
      <path d={`M${kw / 2} 17 V13 H${kw * 1.5} V17`} fill="none" stroke={AMBER} strokeWidth={1.2} />
      <path d={`M${kw / 2} 10 V5 H${kw * 12.5} V10`} fill="none" stroke={DIM} strokeWidth={1} />
      <text x={kw * 2.2} y={17} fontSize={7} fill={DIM} fontFamily={MONO}>1 st</text>
      <text x={kw * 6.5} y={4} fontSize={7} fill={DIM} fontFamily={MONO} textAnchor="middle" dominantBaseline="hanging">12 st</text>
    </>
  );
}

function Registers() {
  return (
    <>
      <rect x={4} y={26} width={64} height={14} rx={3} fill={COOL} opacity={0.8} />
      <rect x={56} y={10} width={60} height={14} rx={3} fill={COOL} opacity={0.4} />
      {/* The passaggio, hatched with plain lines so no pattern id repeats on a page. */}
      {[0, 4, 8, 12, 16, 20, 24, 28, 32].map((d) => (
        <line key={d} x1={56} y1={8 + d} x2={Math.min(70, 56 + 34 - d)} y2={8 + d + Math.min(14, 34 - d)} stroke={AMBER} strokeWidth={1.2} opacity={0.8} />
      ))}
      <text x={6} y={46} fontSize={7} fill={DIM} fontFamily={MONO}>chest</text>
      <text x={114} y={7} fontSize={7} fill={DIM} fontFamily={MONO} textAnchor="end">head</text>
    </>
  );
}

function Spans() {
  const rows: Array<[number, number, number]> = [
    [10, 70, 0.8],
    [30, 96, 0.55],
    [52, 112, 0.35],
  ];
  return (
    <>
      {rows.map(([a, b, o], i) => (
        <rect key={i} x={a} y={8 + i * 12} width={b - a} height={8} rx={4} fill={COOL} opacity={o} />
      ))}
      <line x1={52} y1={4} x2={52} y2={44} stroke={AMBER} strokeWidth={1} strokeDasharray="2 2" />
      <line x1={70} y1={4} x2={70} y2={44} stroke={AMBER} strokeWidth={1} strokeDasharray="2 2" />
    </>
  );
}

function Support() {
  // Breath pressure held level while the note lasts, then released.
  return (
    <>
      <line x1={4} y1={40} x2={116} y2={40} stroke={LINE2} strokeWidth={1} />
      <path d="M6 40 C14 40 14 18 24 18 L96 18 C106 18 106 40 114 40" fill="none" stroke={COOL} strokeWidth={2} />
      <line x1={24} y1={12} x2={96} y2={12} stroke={AMBER} strokeWidth={1} strokeDasharray="3 2" />
      <text x={60} y={9} fontSize={7} fill={DIM} fontFamily={MONO} textAnchor="middle">level</text>
    </>
  );
}

function Harmonics() {
  // A fundamental and its overtones, each a little quieter.
  const bars = [30, 24, 26, 14, 18, 9, 11, 6, 5, 4];
  return (
    <>
      {bars.map((h, i) => (
        <rect key={i} x={6 + i * 11} y={42 - h} width={5} height={h} rx={1} fill={i === 0 ? AMBER : COOL} opacity={i === 0 ? 1 : 0.75} />
      ))}
      <line x1={2} y1={42.5} x2={118} y2={42.5} stroke={LINE2} strokeWidth={1} />
    </>
  );
}

const DRAW: Record<ReferenceFigureKind, () => React.JSX.Element> = {
  semitone: Semitone,
  registers: Registers,
  spans: Spans,
  support: Support,
  harmonics: Harmonics,
};

export function ReferenceFigure({ kind, className }: { kind: ReferenceFigureKind; className?: string }) {
  const Draw = DRAW[kind];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
      className={["shrink-0", className].filter(Boolean).join(" ")}
      data-reference-figure={kind}
    >
      <Draw />
    </svg>
  );
}

/** Which figure heads each glossary group. */
export const GLOSSARY_FIGURES: Record<string, ReferenceFigureKind> = {
  "Pitch and notation": "semitone",
  "Registers and the break": "registers",
  "Range and voice type": "spans",
  "Breath, tone and measurement": "support",
  "Color, tuning and timing": "harmonics",
};

/** Which figure heads each course stage, by catalog stage id. */
export const STAGE_FIGURES: Record<string, ReferenceFigureKind> = {
  "v-l1": "spans",
  "v-l2": "support",
  "v-l3": "registers",
  "v-l4": "semitone",
  "v-l5": "registers",
  "v-l6": "semitone",
  "v-l7": "harmonics",
};
