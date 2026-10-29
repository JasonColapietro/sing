import { COOL, DIM, LINE2, MONO, PANEL2 } from "@/lib/chart-colors";
import type { BreathDrillId } from "./routines";

const LABEL = { fill: DIM, fontSize: 6.5, fontFamily: MONO } as const;

/** Box breathing: the square, each side labelled with its phase. */
function BoxFigure() {
  return (
    <>
      <rect x="12" y="12" width="32" height="32" rx="4" fill={PANEL2} stroke={LINE2} strokeWidth="1.5" />
      <circle cx="12" cy="44" r="2.5" fill={COOL} />
      <text x="4" y="30" {...LABEL} transform="rotate(-90 4 30)" textAnchor="middle">in</text>
      <text x="28" y="8" {...LABEL} textAnchor="middle">hold</text>
      <text x="52" y="30" {...LABEL} transform="rotate(90 52 30)" textAnchor="middle">out</text>
      <text x="28" y="53" {...LABEL} textAnchor="middle">hold</text>
    </>
  );
}

/** Farinelli: a staircase of counts, 4 to 7. */
function StairFigure() {
  return (
    <>
      <path d="M4 48h12v-9h12v-9h12v-9h12" fill="none" stroke={COOL} strokeWidth="1.8" strokeLinejoin="round" />
      <text x="10" y="44" {...LABEL} textAnchor="middle">4</text>
      <text x="22" y="35" {...LABEL} textAnchor="middle">5</text>
      <text x="34" y="26" {...LABEL} textAnchor="middle">6</text>
      <text x="46" y="17" {...LABEL} textAnchor="middle">7</text>
    </>
  );
}

/** Sustain: one flat line that fades out as the air runs down. */
function SustainFigure() {
  return (
    <>
      <defs>
        <linearGradient id="breath-sustain-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.55" stopColor={COOL} />
          <stop offset="1" stopColor={COOL} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M6 28h44" stroke="url(#breath-sustain-fade)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M6 40h30" stroke={LINE2} strokeWidth="1" strokeDasharray="2 3" />
      <text x="6" y="48" {...LABEL}>hold steady</text>
    </>
  );
}

/** Breathe and sing: an inhale dip, then one held note. */
function CueFigure() {
  return (
    <>
      <path d="M6 24c4 0 6 10 10 10s6-10 8-10" fill="none" stroke={DIM} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 24h22" stroke={COOL} strokeWidth="2.5" strokeLinecap="round" />
      <text x="15" y="46" {...LABEL} textAnchor="middle">breathe</text>
      <text x="39" y="46" {...LABEL} textAnchor="middle">sing</text>
    </>
  );
}

/** A 56px static figure of what a breath drill asks for, beside its path row. */
export function BreathDrillFigure({ drill }: { drill: BreathDrillId }) {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className="shrink-0">
      {drill === "box" ? (
        <BoxFigure />
      ) : drill === "farinelli" ? (
        <StairFigure />
      ) : drill === "cue" ? (
        <CueFigure />
      ) : (
        <SustainFigure />
      )}
    </svg>
  );
}
