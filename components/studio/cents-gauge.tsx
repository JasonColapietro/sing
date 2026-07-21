"use client";

/**
 * VU-meter-style cents dial. Needle rotates -50..+50 degrees for -50..+50
 * cents; green zone marks ±15 cents on the arc.
 */

const CX = 120;
const CY = 122;

function pt(deg: number, r: number): readonly [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)] as const;
}

function arc(a: number, b: number, r: number): string {
  const [x1, y1] = pt(a, r);
  const [x2, y2] = pt(b, r);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const TICKS = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];

export function CentsGauge({ cents }: { cents: number | null }) {
  const active = cents !== null;
  const angle = active ? Math.max(-50, Math.min(50, cents)) : 0;
  const label = active
    ? `${cents > 0 ? "+" : ""}${cents} cents ${Math.abs(cents) <= 15 ? "— in tune" : cents > 0 ? "sharp" : "flat"}`
    : "No note detected";

  return (
    <svg
      viewBox="0 0 240 148"
      role="img"
      aria-label={`Cents dial: ${label}`}
      className="mx-auto mt-2 w-full max-w-[320px]"
    >
      {/* dial face */}
      <path d={arc(-50, 50, 95)} fill="none" stroke="#efe6d5" strokeWidth={14} strokeLinecap="round" />
      <path d={arc(-50, 50, 95)} fill="none" stroke="#ddd4c4" strokeWidth={1} />
      {/* green zone ±15 cents */}
      <path d={arc(-15, 15, 95)} fill="none" stroke="#3f8f6e" strokeOpacity={0.55} strokeWidth={14} />
      {/* ticks */}
      {TICKS.map((t) => {
        const major = t === 0 || Math.abs(t) === 50 || Math.abs(t) === 25;
        const [x1, y1] = pt(t, major ? 82 : 86);
        const [x2, y2] = pt(t, 101);
        return (
          <line
            key={t}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={t === 0 ? "#20201d" : "#8a8272"}
            strokeWidth={t === 0 ? 1.5 : 1}
          />
        );
      })}
      {/* scale labels */}
      {[-50, 0, 50].map((t) => {
        const [x, y] = pt(t, 112);
        return (
          <text
            key={t}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={10}
            fill="#5c564d"
            fontFamily='"IBM Plex Mono", ui-monospace, monospace'
          >
            {t > 0 ? `+${t}` : t}
          </text>
        );
      })}
      <text
        x={CX}
        y={CY + 20}
        textAnchor="middle"
        fontSize={9}
        fill="#8a8272"
        fontFamily='"IBM Plex Mono", ui-monospace, monospace'
        letterSpacing={2}
      >
        CENTS
      </text>
      {/* needle */}
      <g
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
          transition: "transform 120ms ease-out, opacity 200ms ease",
          opacity: active ? 1 : 0.25,
        }}
      >
        <line x1={CX} y1={CY + 10} x2={CX} y2={CY - 88} stroke="#c59642" strokeWidth={2.5} strokeLinecap="round" />
      </g>
      {/* pivot */}
      <circle cx={CX} cy={CY} r={7} fill="#efe6d5" stroke="#c9bda0" strokeWidth={1.5} />
      <circle cx={CX} cy={CY} r={2.5} fill="#c59642" opacity={active ? 1 : 0.3} />
    </svg>
  );
}
