import { DIM, LINE, MONO, PANEL } from "@/lib/chart-colors";

/** The "Example" chip every figure wears, so sample data never reads as a result. */
export function ExampleChip({ right, top = 8 }: { right: number; top?: number }) {
  const w = 64;
  const h = 18;
  const x = right - w;
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} rx={9} fill={PANEL} stroke={LINE} />
      <text
        x={x + w / 2}
        y={top + 12.5}
        textAnchor="middle"
        fontFamily={MONO}
        fontSize="9.5"
        letterSpacing="1.2"
        fill={DIM}
      >
        EXAMPLE
      </text>
    </g>
  );
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
