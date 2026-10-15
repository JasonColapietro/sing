/**
 * The palette for everything painted outside CSS: SVG `fill`/`stroke`
 * attributes and canvas 2D contexts, neither of which can read a Tailwind
 * utility class.
 *
 * app/globals.css @theme is the authority — these constants mirror it. When a
 * token moves there, move it here in the same commit. The last time the two
 * drifted, --color-dim was darkened to clear WCAG AA and twenty-odd SVG and
 * canvas call sites went on painting the retired #8a8272; chart-colors.test.ts
 * now parses globals.css and fails if they disagree again. The mirror is kept
 * complete rather than trimmed to what is imported today, so a new chart never
 * has to go back to the stylesheet for a value.
 *
 * Deliberately no "use client" — the singers strips and the Pro visual are
 * server components and import from here too.
 */

/* Surfaces */
export const BG = "#f7f0e7";
export const PANEL = "#fffaf2";
export const PANEL2 = "#efe6d5";

/* Rules and borders */
export const LINE = "#ddd4c4";
export const LINE2 = "#c9bda0";

/* Type. DIM is the lightest value that still clears WCAG AA on all three
   surfaces; anything lighter belongs on a fill, not on a glyph. */
export const INK = "#20201d";
export const MUT = "#5c564d";
export const DIM = "#6b6455";

/* Accents. AMBER / OK are fill-and-stroke values; AMBER_INK / OK_INK are the
   darkened text variants — same split globals.css documents. */
export const AMBER = "#c59642";
export const AMBER_SOFT = "#e0bb74";
export const AMBER_INK = "#82631f";
export const OK = "#3f8f6e";
export const OK_INK = "#2a6f53";
export const REC = "#9d3f33";
export const COOL = "#11615d";

/* ------------------------------------------------------------------ */
/* Keyboards                                                           */
/* ------------------------------------------------------------------ */

/**
 * Playable keys — the /tools piano and the studio target-practice keyboard.
 * They used to disagree on every value: two white fills, two blacks, and a
 * white key that darkened on hover in one room and lightened in the other, so
 * the same gesture read as press in one place and release in the other. One
 * set now, and hover always steps toward the middle: white down, black up.
 * Mirrored into @theme as --color-key-* so the keyboards, which are HTML
 * buttons rather than SVG, can use real utility classes.
 */
export const KEY_WHITE = "#faf6ec";
export const KEY_WHITE_HOVER = "#e4dccb";
export const KEY_BLACK = "#0b0a07";
export const KEY_BLACK_HOVER = "#171410";
/**
 * Note letters. Both keyboards are HTML, so they letter their keys with
 * `text-mut` / `text-line2` rather than importing these — the constants are
 * here to name the answer and to hold the contrast test that keeps it. The
 * studio keyboard lettered its white keys in LINE2 (1.3:1) until this landed.
 */
export const KEY_LABEL = MUT;
/** On a black key MUT reads 2.7:1 and LINE2 reads 10.6:1 — the reverse. */
export const KEY_LABEL_ON_BLACK = LINE2;

/**
 * Read-only miniature strips — the range keyboard, the singers chromatic
 * strip, the progress voice card, the share card. These are diagrams, not
 * instruments: the accidentals are drawn as pale slivers over a tan body
 * rather than as black keys, which is what keeps a 9px-per-semitone strip
 * legible. Kept distinct from the playable values on purpose.
 */
export const STRIP_WHITE = "#e9e2d3";
export const STRIP_BLACK = PANEL;

/* ------------------------------------------------------------------ */
/* Type face                                                           */
/* ------------------------------------------------------------------ */

/** SVG `font-family`: SVG text is in the DOM, so the custom property resolves. */
export const MONO = "var(--font-mono)";

/** The tail of --font-mono in globals.css, for when the variable is unreadable. */
const MONO_FALLBACK = 'ui-monospace, "SF Mono", monospace';

let monoCache: string | null = null;

/**
 * The same stack as MONO, resolved to literal family names for canvas.
 *
 * `ctx.font` is parsed without an element context, so `var(--font-mono)` is not
 * substituted — the assignment is dropped and the canvas silently keeps its
 * 10px sans-serif default. And the family name cannot be hardcoded either:
 * next/font hashes it, so the literal "IBM Plex Mono" the canvases used to ask
 * for matched no loaded face and fell through to the system monospace. Reading
 * the resolved variable off the document is the only way to get the actual
 * face. Cached — this is called from requestAnimationFrame loops, and
 * getComputedStyle forces a style recalc.
 */
export function monoFontStack(): string {
  if (monoCache !== null) return monoCache;
  if (typeof document === "undefined") return MONO_FALLBACK;
  const root = getComputedStyle(document.documentElement);
  const mono = root.getPropertyValue("--font-mono").trim();
  if (mono !== "" && !mono.includes("var(")) {
    monoCache = mono;
    return mono;
  }
  // Tailwind's @theme inline can emit the utilities without keeping
  // --font-mono itself on :root; next/font's own variable is always there.
  const plex = root.getPropertyValue("--font-plex-mono").trim();
  if (plex === "") return MONO_FALLBACK; // stylesheet not applied yet — retry next frame
  monoCache = `${plex}, ${MONO_FALLBACK}`;
  return monoCache;
}
