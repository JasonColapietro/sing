/**
 * Contrast law for the session surface.
 *
 * The practice shell is the one screen in the app that is not on paper, so its
 * palette is written by hand rather than inherited — and a dark palette is
 * exactly where a token gets nudged half a step "so it looks softer" and
 * quietly stops being readable. The two text tokens carry every word a singer
 * reads mid-exercise: the stage word, the tip, the rep counter, the cents.
 *
 * There is no DOM test here because there is no DOM in this suite — vitest runs
 * on node, the repo's .tsx tests all go through `renderToStaticMarkup`, and
 * SessionShell is a `createPortal` that renders nothing at all on the server.
 * The arithmetic below is what can actually be guarded, and it is the part that
 * regressions have historically hit (see --color-dim and --color-amber-ink in
 * app/globals.css, both darkened after failing this same check on paper).
 */
import { describe, expect, it } from "vitest";
import { SESSION_TOKENS } from "./session-shell";

/** `oklch(L C H)` or `oklch(L C H / A)` — the only form these tokens take. */
function parseOklch(value: string): { L: number; C: number; h: number; a: number } {
  const m = value.match(
    /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/,
  );
  if (!m) throw new Error(`not an oklch() colour: ${value}`);
  return { L: +m[1], C: +m[2], h: +m[3], a: m[4] === undefined ? 1 : +m[4] };
}

/** OKLab → linear-light sRGB, gamut-clipped. WCAG luminance wants linear. */
function toLinearRgb(value: string): [number, number, number] {
  const { L, C, h } = parseOklch(value);
  const rad = (h * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.min(1, Math.max(0, v))) as [number, number, number];
}

const luminance = ([r, g, b]: [number, number, number]) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Source-over composite of a translucent token onto an opaque ground. */
function over(
  fg: [number, number, number],
  alpha: number,
  bg: [number, number, number],
): [number, number, number] {
  return fg.map((v, i) => v * alpha + bg[i] * (1 - alpha)) as [number, number, number];
}

function contrast(fgToken: string, bgToken: string): number {
  const bg = toLinearRgb(SESSION_TOKENS[bgToken]);
  const { a } = parseOklch(SESSION_TOKENS[fgToken]);
  const fg = a === 1 ? toLinearRgb(SESSION_TOKENS[fgToken]) : over(toLinearRgb(SESSION_TOKENS[fgToken]), a, bg);
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The three grounds a text token can land on inside the shell. */
const GROUNDS = ["--s-bg", "--s-elev", "--s-over"] as const;

describe("session palette", () => {
  it("keeps --s-ink at 7:1 or better on every session ground", () => {
    for (const ground of GROUNDS) {
      expect(contrast("--s-ink", ground)).toBeGreaterThanOrEqual(7);
    }
  });

  it("keeps --s-mut at 4.5:1 or better on every session ground", () => {
    for (const ground of GROUNDS) {
      expect(contrast("--s-mut", ground)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps --s-dim readable too — it carries the mono kickers, not decoration", () => {
    for (const ground of GROUNDS) {
      expect(contrast("--s-dim", ground)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the meaning colours legible as text on the base ground", () => {
    // --s-ok is the cents/score green, --s-voice the live pitch readout, and
    // --s-amber the playhead and count-in numeral. All three appear as type.
    for (const token of ["--s-ok", "--s-voice", "--s-amber", "--s-rec"]) {
      expect(contrast(token, "--s-bg")).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("is written entirely in OKLCH — no hex, no #000, no #fff", () => {
    for (const [name, value] of Object.entries(SESSION_TOKENS)) {
      expect(value, name).toMatch(/^oklch\(/);
    }
  });
});
