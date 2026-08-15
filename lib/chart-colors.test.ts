import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AMBER,
  AMBER_INK,
  AMBER_SOFT,
  BG,
  COOL,
  DIM,
  INK,
  KEY_BLACK,
  KEY_BLACK_HOVER,
  KEY_LABEL,
  KEY_LABEL_ON_BLACK,
  KEY_WHITE,
  KEY_WHITE_HOVER,
  LINE,
  LINE2,
  MONO,
  MUT,
  OK,
  OK_INK,
  PANEL,
  PANEL2,
  REC,
  STRIP_BLACK,
  STRIP_WHITE,
  monoFontStack,
} from "./chart-colors";

const CSS = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

/** Every `--color-*: #hex;` declaration in globals.css @theme. */
const TOKENS = new Map<string, string>(
  [...CSS.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{3,8});/g)].map((m) => [
    m[1],
    m[2],
  ]),
);

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("the palette mirrors app/globals.css", () => {
  it("finds the @theme tokens at all", () => {
    // A parser that silently matched nothing would make every case below pass.
    expect(TOKENS.size).toBeGreaterThan(15);
  });

  const MIRRORED: Array<[string, string]> = [
    ["bg", BG],
    ["panel", PANEL],
    ["panel2", PANEL2],
    ["line", LINE],
    ["line2", LINE2],
    ["ink", INK],
    ["mut", MUT],
    ["dim", DIM],
    ["amber", AMBER],
    ["amber-soft", AMBER_SOFT],
    ["amber-ink", AMBER_INK],
    ["ok", OK],
    ["ok-ink", OK_INK],
    ["rec", REC],
    ["cool", COOL],
    ["key-white", KEY_WHITE],
    ["key-white-hover", KEY_WHITE_HOVER],
    ["key-black", KEY_BLACK],
    ["key-black-hover", KEY_BLACK_HOVER],
  ];

  it.each(MIRRORED)("--color-%s", (token, value) => {
    expect(TOKENS.get(token)).toBe(value);
  });

  it("does not paint in the retired gray", () => {
    // #8a8272 was --color-dim until it was darkened for WCAG AA. It survived
    // in the SVG and canvas constants for months because nothing checked.
    const source = readFileSync(new URL("./chart-colors.ts", import.meta.url), "utf8");
    expect(source.replace(/\/\*[\s\S]*?\*\//g, "")).not.toContain("#8a8272");
  });
});

describe("legibility", () => {
  it("keeps DIM above 4.5:1 on every surface it labels", () => {
    for (const surface of [BG, PANEL, PANEL2]) {
      expect(contrast(DIM, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps MUT and INK above DIM in the type hierarchy", () => {
    expect(luminance(MUT)).toBeLessThan(luminance(DIM));
    expect(luminance(INK)).toBeLessThan(luminance(MUT));
  });

  it("keeps key labels readable on the key they sit on", () => {
    // The studio keyboard used to letter its white keys in LINE2 — 1.3:1.
    expect(contrast(KEY_LABEL, KEY_WHITE)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(KEY_LABEL_ON_BLACK, KEY_BLACK)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(INK, AMBER)).toBeGreaterThanOrEqual(4.5);
  });

  it("hovers a key darker, never lighter, on both key colours", () => {
    expect(luminance(KEY_WHITE_HOVER)).toBeLessThan(luminance(KEY_WHITE));
    expect(luminance(KEY_BLACK_HOVER)).toBeGreaterThan(luminance(KEY_BLACK));
  });

  it("keeps the miniature strips' accidentals distinguishable from the naturals", () => {
    expect(STRIP_BLACK).not.toBe(STRIP_WHITE);
    expect(contrast(STRIP_BLACK, LINE)).toBeGreaterThan(1.1);
  });
});

describe("monoFontStack", () => {
  it("falls back to the declared tail when there is no document", () => {
    // Server render and this test both take this branch.
    expect(typeof document).toBe("undefined");
    expect(monoFontStack()).toBe('ui-monospace, "SF Mono", monospace');
  });

  it("never hands a canvas an unresolvable custom property", () => {
    expect(monoFontStack()).not.toContain("var(");
  });

  it("keeps MONO as the custom property, for SVG, where it does resolve", () => {
    expect(MONO).toBe("var(--font-mono)");
    expect(CSS).toContain("--font-mono:");
  });
});
