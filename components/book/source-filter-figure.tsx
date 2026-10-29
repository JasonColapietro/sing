import { AMBER, AMBER_INK, COOL, DIM, INK, LINE, LINE2, MONO, PANEL2 } from "@/lib/chart-colors";

const W = 480;
const H = 156;
const PANEL_W = 128;
const PANEL_Y = 26;
const PANEL_H = 92;
const GAP = (W - 3 * PANEL_W) / 2;
const px = (i: number) => i * (PANEL_W + GAP);

/** Folds: a buzz, drawn as a glottal pulse train (slow open, sharp close). */
const BUZZ = (() => {
  const x0 = px(1) + 12;
  const base = PANEL_Y + 64;
  const pts: string[] = [];
  for (let c = 0; c < 5; c++) {
    const s = x0 + c * 21;
    pts.push(`${s},${base}`, `${s + 13},${base - 34}`, `${s + 16},${base}`, `${s + 21},${base}`);
  }
  return pts.join(" ");
})();

/** Mouth: a harmonic comb under a two-peak vowel envelope ("ah": F1 and F2 close together). */
const COMB = Array.from({ length: 12 }, (_, i) => {
  const x = px(2) + 12 + i * 9.5;
  const f = (i + 1) / 12;
  const env = 0.18 + 0.82 * Math.max(Math.exp(-((f - 0.22) ** 2) / 0.006), 0.85 * Math.exp(-((f - 0.4) ** 2) / 0.008));
  return { x, h: 6 + 52 * env };
});
const ENVELOPE = COMB.map((c) => `${c.x},${PANEL_Y + 78 - c.h - 3}`).join(" ");

/**
 * Book chapter 1's three-part model as one picture: breath is the power,
 * the folds are the vibrator, the mouth and throat are the filter. Same
 * console-card language as the Pro coach report (mono labels, amber marks,
 * teal for the voice itself), painted from chart-colors so it also prints in
 * the PDF. A diagram, not data: no example chip.
 */
export function SourceFilterFigure({ className }: { className?: string }) {
  const steps = [
    { title: "Breath", role: "Power" },
    { title: "Folds", role: "Vibrator" },
    { title: "Mouth & throat", role: "Filter" },
  ];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Diagram of the three-part model: breath supplies the power, the vocal folds turn it into a buzz, and the mouth and throat filter that buzz into a vowel such as ah."
      className={className}
    >
      {steps.map((s, i) => (
        <g key={s.title}>
          <rect x={px(i) + 0.5} y={PANEL_Y + 0.5} width={PANEL_W - 1} height={PANEL_H - 1} rx={10} fill={PANEL2} stroke={LINE} />
          <text x={px(i) + 10} y={16} fontSize={10} fill={AMBER_INK} fontFamily={MONO} letterSpacing="0.14em">
            {`${i + 1} · ${s.role.toUpperCase()}`}
          </text>
          <text x={px(i) + PANEL_W / 2} y={PANEL_Y + PANEL_H + 18} fontSize={12} fill={INK} textAnchor="middle">
            {s.title}
          </text>
        </g>
      ))}

      {/* Breath: steady pressure, three rising arrows. */}
      {[0, 1, 2].map((j) => {
        const x = px(0) + 34 + j * 30;
        return (
          <g key={j}>
            <line x1={x} y1={PANEL_Y + 78} x2={x} y2={PANEL_Y + 24} stroke={COOL} strokeWidth={3} strokeLinecap="round" opacity={0.55 + j * 0.15} />
            <path d={`M${x - 7} ${PANEL_Y + 31} L${x} ${PANEL_Y + 20} L${x + 7} ${PANEL_Y + 31}`} fill="none" stroke={COOL} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.55 + j * 0.15} />
          </g>
        );
      })}
      <text x={px(0) + PANEL_W / 2} y={PANEL_Y + 88} fontSize={8} fill={DIM} fontFamily={MONO} textAnchor="middle">
        steady air
      </text>

      {/* Folds: the buzz. */}
      <line x1={px(1) + 10} y1={PANEL_Y + 64} x2={px(1) + PANEL_W - 10} y2={PANEL_Y + 64} stroke={LINE2} strokeWidth={1} />
      <polyline points={BUZZ} fill="none" stroke={COOL} strokeWidth={2.2} strokeLinejoin="round" />
      <text x={px(1) + PANEL_W / 2} y={PANEL_Y + 88} fontSize={8} fill={DIM} fontFamily={MONO} textAnchor="middle">
        a buzz, many times a second
      </text>

      {/* Mouth: harmonics, shaped by the vowel. */}
      <line x1={px(2) + 8} y1={PANEL_Y + 78} x2={px(2) + PANEL_W - 8} y2={PANEL_Y + 78} stroke={LINE2} strokeWidth={1} />
      {COMB.map((c, i) => (
        <line key={i} x1={c.x} y1={PANEL_Y + 78} x2={c.x} y2={PANEL_Y + 78 - c.h} stroke={COOL} strokeWidth={2.4} opacity={0.75} />
      ))}
      <polyline points={ENVELOPE} fill="none" stroke={AMBER} strokeWidth={1.6} strokeDasharray="3 2" />
      <text x={px(2) + PANEL_W / 2} y={PANEL_Y + 88} fontSize={8} fill={DIM} fontFamily={MONO} textAnchor="middle">
        the vowel “ah”
      </text>

      {/* Arrows between stages. */}
      {[0, 1].map((i) => {
        const x1 = px(i) + PANEL_W + 6;
        const x2 = px(i + 1) - 6;
        const y = PANEL_Y + PANEL_H / 2;
        return (
          <g key={i}>
            <line x1={x1} y1={y} x2={x2 - 2} y2={y} stroke={AMBER} strokeWidth={1.6} />
            <path d={`M${x2 - 7} ${y - 5} L${x2} ${y} L${x2 - 7} ${y + 5}`} fill="none" stroke={AMBER} strokeWidth={1.6} />
          </g>
        );
      })}
    </svg>
  );
}
