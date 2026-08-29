/**
 * Compile researched singer-range JSON batches into lib/singers-data.ts.
 *
 * Usage: node scripts/compile-singers.mjs data/singers
 *
 * Each batch is a JSON array of entries with note names ("F2", "Eb3");
 * this script validates, dedupes, converts to midi and emits sorted TS.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { assertNoReservedSingerSlugs } from "./singer-slugs.mjs";

const SRC = process.argv[2];
if (!SRC) {
  console.error("usage: node scripts/compile-singers.mjs <dir>");
  process.exit(1);
}

const VOICE_KINDS = new Set([
  "Soprano",
  "Mezzo-soprano",
  "Contralto",
  "Countertenor",
  "Tenor",
  "Baritone",
  "Bass-baritone",
  "Bass",
]);

const GENRES = new Set([
  "Rock", "Hard Rock", "Metal", "Punk", "Grunge", "Alternative", "Indie",
  "Pop", "Synth-Pop", "New Wave", "Disco", "R&B", "Soul", "Funk", "Hip-Hop",
  "Gospel", "Country", "Folk", "Singer-Songwriter", "Blues", "Jazz", "Opera",
  "Classical", "Musical Theatre", "Latin", "K-Pop", "J-Pop", "Reggae",
  "Afrobeats", "Electronic",
]);

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function labelToMidi(label) {
  const m = /^([A-Ga-g])([#b♯♭]?)(-?\d)$/.exec(String(label).trim());
  if (!m) return null;
  let pc = LETTER_PC[m[1].toUpperCase()];
  if (m[2] === "#" || m[2] === "♯") pc += 1;
  if (m[2] === "b" || m[2] === "♭") pc -= 1;
  return (parseInt(m[3], 10) + 1) * 12 + pc;
}

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const seen = new Map(); // slug -> entry
const problems = [];

const files = readdirSync(SRC).filter((f) => f.endsWith(".json")).sort();
for (const file of files) {
  let rows;
  try {
    rows = JSON.parse(readFileSync(join(SRC, file), "utf8"));
  } catch (e) {
    problems.push(`${file}: unparseable JSON (${e.message})`);
    continue;
  }
  if (!Array.isArray(rows)) {
    problems.push(`${file}: not an array`);
    continue;
  }
  for (const r of rows) {
    const where = `${file} → ${r?.name ?? "?"}`;
    if (!r || typeof r.name !== "string" || !r.name.trim()) {
      problems.push(`${where}: missing name`);
      continue;
    }
    const lowMidi = labelToMidi(r.lowNote);
    const highMidi = labelToMidi(r.highNote);
    const beltMidi = r.beltNote == null ? null : labelToMidi(r.beltNote);
    if (lowMidi == null || highMidi == null) {
      problems.push(`${where}: bad note "${r.lowNote}"/"${r.highNote}"`);
      continue;
    }
    if (lowMidi >= highMidi) {
      problems.push(`${where}: low ${r.lowNote} >= high ${r.highNote}`);
      continue;
    }
    if (r.beltNote != null && (beltMidi == null || beltMidi <= lowMidi || beltMidi >= highMidi)) {
      problems.push(`${where}: belt ${r.beltNote} outside (${r.lowNote}, ${r.highNote}) — dropped belt`);
      r.beltNote = null;
    }
    // Human plausibility rails: reject anything outside C0..C9 or spans > 6 oct
    if (lowMidi < 12 || highMidi > 120 || highMidi - lowMidi > 72) {
      problems.push(`${where}: implausible ${r.lowNote}–${r.highNote} — skipped`);
      continue;
    }
    // A null beltNote renders as one solid bar, i.e. "full voice all the way to
    // the top". That is fine for a 2-octave crooner and absurd for a 4-octave
    // falsetto specialist, so wide spans must state a ceiling explicitly.
    if (r.beltNote == null && highMidi - lowMidi > 42) {
      problems.push(
        `${where}: ${r.lowNote}–${r.highNote} spans ${((highMidi - lowMidi) / 12).toFixed(1)} octaves with no beltNote — would render as full voice throughout`,
      );
    }
    if (!VOICE_KINDS.has(r.voiceType)) {
      problems.push(`${where}: bad voiceType "${r.voiceType}" — skipped`);
      continue;
    }
    const genres = (Array.isArray(r.genres) ? r.genres : []).filter((g) => GENRES.has(g));
    if (!genres.length) {
      problems.push(`${where}: no valid genres (${JSON.stringify(r.genres)}) — skipped`);
      continue;
    }
    const activeFrom = Number(r.activeFrom);
    if (!Number.isInteger(activeFrom) || activeFrom < 1900 || activeFrom > 2026) {
      problems.push(`${where}: bad activeFrom ${r.activeFrom} — skipped`);
      continue;
    }
    const blurb = String(r.blurb ?? "").trim();
    if (!blurb || blurb.length > 140) {
      problems.push(`${where}: blurb missing or too long — skipped`);
      continue;
    }
    // Optional editorial paragraph. Absent is fine — the page just omits the
    // section — so a half-written batch degrades instead of dropping singers.
    let technique = r.technique == null ? null : String(r.technique).trim();
    if (technique !== null) {
      const words = technique.split(/\s+/).length;
      if (words < 25 || words > 130) {
        problems.push(`${where}: technique is ${words} words (want 25-130) — dropped`);
        technique = null;
      } else if (/\b(reportedly|allegedly|rumou?red|it is said|some say)\b/i.test(technique)) {
        problems.push(`${where}: technique hedges an unverifiable claim — dropped`);
        technique = null;
      }
    }
    const slug = slugify(r.name);
    if (seen.has(slug)) continue; // first occurrence wins
    seen.set(slug, {
      slug,
      name: r.name.trim(),
      voiceType: r.voiceType,
      genres: genres.slice(0, 3),
      country: String(r.country ?? "").trim() || "—",
      activeFrom,
      lowMidi,
      highMidi,
      beltMidi: r.beltNote == null ? null : beltMidi,
      whistle: r.whistle === true,
      signatureSong: String(r.signatureSong ?? "").trim(),
      lowSource: r.lowSource ? String(r.lowSource).trim() : null,
      highSource: r.highSource ? String(r.highSource).trim() : null,
      blurb,
      technique,
    });
  }
}

const singers = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
assertNoReservedSingerSlugs(singers);

const header = `/**
 * GENERATED FILE — edit scripts/compile-singers.mjs + its source batches, not
 * this file directly (hand-fixes are fine for individual corrections).
 *
 * Commonly cited (approximate) vocal ranges of well-known singers. These are
 * the figures fans and journalists circulate — not lab measurements — and the
 * UI says so wherever they appear.
 */

export type VoiceKind =
  | "Soprano"
  | "Mezzo-soprano"
  | "Contralto"
  | "Countertenor"
  | "Tenor"
  | "Baritone"
  | "Bass-baritone"
  | "Bass";

export interface Singer {
  slug: string;
  name: string;
  voiceType: VoiceKind;
  genres: string[];
  country: string;
  /** Year they became prominent. */
  activeFrom: number;
  lowMidi: number;
  highMidi: number;
  /** Highest full/belted note when meaningfully below highMidi. */
  beltMidi: number | null;
  whistle: boolean;
  signatureSong: string;
  lowSource: string | null;
  highSource: string | null;
  blurb: string;
  /** Editorial paragraph on how the voice actually works. Null when unwritten. */
  technique: string | null;
}

export const SINGERS: Singer[] = `;

writeFileSync(
  new URL("../lib/singers-data.ts", import.meta.url),
  header + JSON.stringify(singers, null, 2) + ";\n",
);

// The client-side projection: everything the /singers directory and the
// /range result view render, and none of the prose. Blurbs, technique
// paragraphs and source notes are the bulk of singers-data.ts by bytes, and
// no client component displays them — shipping them to the browser would tax
// the two pages this library exists to rank.
const liteHeader = `/**
 * GENERATED FILE — edit scripts/compile-singers.mjs + its source batches, not
 * this file directly.
 *
 * Prose-free projection of SINGERS for client components. Import this (plus
 * helpers from lib/singers-core) in "use client" files; importing from
 * lib/singers there ships every blurb and technique paragraph to the browser.
 */

import type { VoiceKind } from "@/lib/singers-data";

export interface SingerLite {
  slug: string;
  name: string;
  voiceType: VoiceKind;
  genres: string[];
  /** Year they became prominent. */
  activeFrom: number;
  lowMidi: number;
  highMidi: number;
  /** Highest full/belted note when meaningfully below highMidi. */
  beltMidi: number | null;
  whistle: boolean;
}

export const SINGERS_LITE: SingerLite[] = `;

const lite = singers.map(
  ({ slug, name, voiceType, genres, activeFrom, lowMidi, highMidi, beltMidi, whistle }) => ({
    slug,
    name,
    voiceType,
    genres,
    activeFrom,
    lowMidi,
    highMidi,
    beltMidi,
    whistle,
  }),
);

writeFileSync(
  new URL("../lib/singers-lite.ts", import.meta.url),
  liteHeader + JSON.stringify(lite, null, 2) + ";\n",
);

console.log(`wrote ${singers.length} singers from ${files.length} batches`);
if (problems.length) {
  console.log(`\n${problems.length} rows needed attention:`);
  for (const p of problems) console.log(`  - ${p}`);
}
