import styles from "./hero-visual.module.css";

const LANES = [
  { label: "A4", y: 45 },
  { label: "G4", y: 87 },
  { label: "F4", y: 129 },
  { label: "E4", y: 171 },
  { label: "D4", y: 213 },
  { label: "C4", y: 255 },
];

/** Target note blocks. `hit` blocks light green as the trace sweeps past. */
const BLOCKS: Array<{ x: number; w: number; y: number; hit?: string }> = [
  { x: 70, w: 70, y: 171, hit: styles.hit1 },
  { x: 150, w: 60, y: 87, hit: styles.hit2 },
  { x: 220, w: 80, y: 45, hit: styles.hit3 },
  { x: 310, w: 55, y: 129 }, // near miss — trace rides just above it
  { x: 375, w: 65, y: 213, hit: styles.hit4 },
  { x: 450, w: 60, y: 171 },
  { x: 520, w: 90, y: 87, hit: styles.hit5 },
];

const TRACE_PATH = [
  "M40 220",
  "C55 220 58 172 75 171",
  "C95 168 115 174 140 171",
  "C148 171 145 88 155 87",
  "C175 84 195 90 210 87",
  "C218 87 214 46 225 45",
  "C250 42 275 48 300 45",
  "C308 45 305 116 315 115",
  "C330 112 350 118 365 116",
  "C373 116 370 214 380 213",
  "C400 210 420 216 440 213",
  "C448 213 445 172 455 170",
  "C475 166 495 172 510 169",
  "C518 169 514 88 525 87",
  "C550 84 580 90 605 87",
].join(" ");

/**
 * Animated note-lane visual: semitone lanes, target blocks, and an amber
 * pitch trace that weaves through them. Pure CSS animation, no JS timers.
 */
export default function HeroVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
          Pitch lane — warmup A
        </span>
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-rec">
          <span
            aria-hidden
            className="animate-recblink inline-block h-2 w-2 rounded-full bg-rec"
          />
          Live
        </span>
      </div>
      <svg
        viewBox="0 0 640 300"
        role="img"
        aria-label="Live pitch display: an amber pitch trace weaving through target note blocks on semitone lanes, with hit notes lighting up green"
        className="block w-full"
      >
        {/* lane separators */}
        {[24, 66, 108, 150, 192, 234, 276].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="640"
            y2={y}
            stroke="#2b2519"
            strokeWidth="1"
          />
        ))}
        {/* beat markers */}
        {[136, 232, 328, 424, 520].map((x) => (
          <line
            key={x}
            x1={x}
            y1="24"
            x2={x}
            y2="276"
            stroke="#2b2519"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
        ))}
        {/* note labels */}
        {LANES.map((lane) => (
          <text
            key={lane.label}
            x="12"
            y={lane.y + 4}
            fontFamily="var(--font-plex-mono), monospace"
            fontSize="11"
            fill="#6f685a"
          >
            {lane.label}
          </text>
        ))}
        {/* target blocks */}
        {BLOCKS.map((b) => (
          <rect
            key={`${b.x}-${b.y}`}
            x={b.x}
            y={b.y - 13}
            width={b.w}
            height="26"
            rx="7"
            fill="rgba(242,237,227,0.04)"
            stroke="rgba(242,237,227,0.4)"
            strokeWidth="1.25"
            className={b.hit ? `${styles.hit} ${b.hit}` : undefined}
          />
        ))}
        {/* pitch trace: soft glow underlay + crisp line, same draw animation */}
        <path
          d={TRACE_PATH}
          pathLength={1000}
          fill="none"
          stroke="#f5b03e"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.18"
          className={styles.trace}
        />
        <path
          d={TRACE_PATH}
          pathLength={1000}
          fill="none"
          stroke="#f5b03e"
          strokeWidth="2.25"
          strokeLinecap="round"
          className={styles.trace}
        />
        {/* playhead */}
        <g className={styles.playhead}>
          <line
            x1="40"
            y1="24"
            x2="40"
            y2="276"
            stroke="#f5b03e"
            strokeWidth="1"
            opacity="0.45"
          />
          <circle cx="40" cy="24" r="2.5" fill="#f5b03e" opacity="0.7" />
        </g>
      </svg>
      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em]">
        <span className="text-dim">In tune ±25 cents</span>
        <span className="text-ok">5/7 notes hit</span>
      </div>
    </div>
  );
}
