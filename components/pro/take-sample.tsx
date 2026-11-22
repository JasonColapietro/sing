/**
 * A drawn example of Pro's take analysis: two takes of one phrase as overlaid
 * pitch lines, the later one on its notes and the earlier one flat on the top
 * note.
 *
 * Public surface: `TakeSample({ className? })`, `TAKE_SAMPLE_LABEL`,
 * `TAKE_SAMPLE_READING`, and
 * `TAKE_SAMPLE_LINES` (the two drawn lines, for tests).
 *
 * Rules:
 * - It is a drawing, not anyone's recording, so it always prints the visible
 *   "Sample takes" caption above the lines; do not hide or restyle it away.
 * - It has to read on a 375px phone, where the drawing is about 310px wide:
 *   the viewBox is 320 wide so one unit is about one pixel there, the text is
 *   11 units, the lines are 2.5, and the two takes part by a visible gap on
 *   one phrase. Do not widen the viewBox without scaling those up with it.
 * - It never draws larger than 21rem (336px), a little over that phone
 *   size: in a wider panel (the landing at 1280, /pro between md and xl) a
 *   full-width drawing set its 11-unit labels near 18px beside neighbours at
 *   about 11px.
 * - Colors are theme tokens (the stroke-* and fill-* classes), never hex, and
 *   both lines are the "ink" shades, which clear 3:1 on the panel.
 * - A server component with no hooks and no data imports, so the landing
 *   page, /pro and the recorder's locked panel can all render it. Its height
 *   follows its width, so it causes no layout shift.
 */
export const TAKE_SAMPLE_LABEL = "Sample takes";

/** What the drawing shows, in words: its accessible name ends with it, and /pro prints it under the drawing. */
export const TAKE_SAMPLE_READING = "Take 7 lands each note; take 3 is flat on the G4.";

/** Where the plot starts and ends, left of which the note names sit. */
const X0 = 34;
const X1 = 312;

/** The phrase's three target notes, top to bottom. */
const GUIDES = [
  { note: "G4", y: 28 },
  { note: "E4", y: 58 },
  { note: "C4", y: 88 },
] as const;

/**
 * Each take as the points its line passes through, [x, y], joined by smooth
 * curves. Both sing C4, E4, G4, E4. Take 7 lands each note; take 3 tracks it
 * within a few units except on the G4, where it stays well under the line.
 */
export const TAKE_SAMPLE_LINES = [
  {
    name: "Take 3",
    className: "stroke-amber-ink",
    points: [[X0, 91], [94, 90], [130, 61], [180, 61], [218, 45], [266, 46], [298, 60], [X1, 60]],
  },
  {
    name: "Take 7",
    className: "stroke-violet-ink",
    points: [[X0, 89], [94, 88], [126, 58], [178, 58], [214, 28], [268, 28], [298, 58], [X1, 58]],
  },
] as const;

/** A smooth path through the points: level through each one, so a held note is flat and a move is an S. */
function pathThrough(points: ReadonlyArray<readonly [number, number]>): string {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const mid = (x0 + x1) / 2;
    d += ` C${mid} ${y0} ${mid} ${y1} ${x1} ${y1}`;
  }
  return d;
}

export function TakeSample({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <figcaption className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        {TAKE_SAMPLE_LABEL}
      </figcaption>
      <svg
        viewBox="0 0 320 120"
        className="block w-full max-w-[21rem]"
        role="img"
        aria-label={`Two sample takes of one phrase drawn as overlaid pitch lines against its target notes. ${TAKE_SAMPLE_READING}`}
      >
        {GUIDES.map(({ note, y }) => (
          <g key={note}>
            <text x="4" y={y + 4} className="fill-ink font-mono" fontSize="11">
              {note}
            </text>
            <line
              x1={X0}
              y1={y}
              x2={X1}
              y2={y}
              className="stroke-line2"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          </g>
        ))}
        {TAKE_SAMPLE_LINES.map((take) => (
          <path
            key={take.name}
            d={pathThrough(take.points)}
            fill="none"
            className={take.className}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {/* The key, under the plot: a swatch of each line beside its name. */}
        {TAKE_SAMPLE_LINES.map((take, i) => {
          const x = X0 + i * 96;
          return (
            <g key={take.name}>
              <line
                x1={x}
                y1="110"
                x2={x + 18}
                y2="110"
                className={take.className}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <text x={x + 24} y="114" className="fill-ink font-mono" fontSize="11">
                {take.name}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
