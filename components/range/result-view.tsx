"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  VOICE_TYPES,
  classifyVoice,
  crossFamilyAlternative,
  midiToLabel,
  voiceFitLabel,
  type VoiceType,
} from "@/lib/audio/notes";
import { playTone } from "@/lib/audio/synth";
import { RANGE_RETEST_DAYS, useProgress, type Achievement } from "@/lib/progress";
import { MAX_RANGE_HISTORY } from "@/lib/progress-shape";
import type { RangeEntry } from "@/lib/analytics";
import { useIsPro, useProReady } from "@/lib/pro";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { Button, Card, LinkButton, Pill, SectionLabel, Stat } from "@/components/ui";
import { ProCrescendoNudge, ProInlineNudge } from "@/components/pro/gate";
import { LockedPanel, ProChip } from "@/components/pro/ui";
import { RangeHistoryChart } from "@/components/progress/pro-charts";
import {
  AMBER,
  BG,
  DIM,
  INK,
  LINE,
  MUT,
  STRIP_BLACK,
  STRIP_WHITE,
  monoFontStack,
} from "@/lib/chart-colors";
import { PianoStrip } from "./piano-strip";
import { SINGERS_LITE as SINGERS } from "@/lib/singers-lite";
import { rangeOverlap, voiceTypeSlug } from "@/lib/singers-core";
import type { Song } from "@/components/songs/types";
import { countOpenSongsFitting } from "@/components/songs/lib";
import { useMastered } from "@/components/songs/favorites";
import { OCTAVE_SIREN_MIN_SEMIS } from "@/components/warmups/exercises";
import { retryWhenOnline } from "./retry-when-online";

/**
 * Household names for the quick post-test comparison, pulled from the full
 * singers library so the numbers here always match /singers/[slug] pages.
 */
const COMPARISON_SLUGS = [
  "freddie-mercury",
  "mariah-carey",
  "axl-rose",
  "johnny-cash",
  "adele",
  "bruno-mars",
  "whitney-houston",
];
const FAMOUS_VOICES = COMPARISON_SLUGS.flatMap((slug) => {
  const s = SINGERS.find((x) => x.slug === slug);
  return s ? [s] : [];
});

/** The result's one Pro line, in both forms the offer below takes. */
const RANGE_NUDGE_LINE = "Pro charts each retest, so you can see whether either edge moves";

/**
 * The quick comparison, closest first. Five of the seven listed singers have
 * very wide reported ranges, so ranking by raw semitones of overlap left most
 * ordinary ranges tied at the top and the list order picked the headline:
 * nearly everyone, sopranos included, "overlapped most" with whoever was
 * first. Ranking by the share of the two ranges' combined span that they
 * share rewards a singer whose range is close to yours rather than one whose
 * range simply contains it. Raw overlap breaks ties.
 */
export function rankFamousVoices(lowMidi: number, highMidi: number) {
  return FAMOUS_VOICES.map((f) => {
    const overlap = rangeOverlap(lowMidi, highMidi, f.lowMidi, f.highMidi);
    const union = Math.max(highMidi, f.highMidi) - Math.min(lowMidi, f.lowMidi);
    return { ...f, overlap, fit: union > 0 ? overlap / union : 0 };
  }).sort((a, b) => b.fit - a.fit || b.overlap - a.overlap);
}

export function comparisonSingerFromSlug(slug: string | null) {
  if (!slug) return null;
  return SINGERS.find((singer) => singer.slug === slug) ?? null;
}

function subscribeToLocation(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function comparisonSlugFromLocation() {
  return new URLSearchParams(window.location.search).get("compare");
}

function noServerComparison() {
  return null;
}

const SONG_SLUG = /^[a-z0-9-]{1,80}$/;

/**
 * The /can-you-sing song that sent the singer here, or null. Read from
 * ?check=, with ?song= accepted as well so either spelling of the link works.
 * Only the slug's shape is checked: the song catalogue imports the whole
 * singer library, which this route keeps out of its bundle on purpose, and an
 * unknown slug lands on the site's 404 page rather than anywhere harmful.
 */
export function returnSongSlugFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const slug = params.get("check") ?? params.get("song");
  return slug && SONG_SLUG.test(slug) ? slug : null;
}

function returnSongFromLocation() {
  return returnSongSlugFromSearch(window.location.search);
}

/**
 * Where "Back to the song" goes. The song page's personal verdict sits at
 * #fit, below the cited range and the stat grid, so the plain path would land
 * a phone singer on the H1 with the answer they came back for below the fold.
 */
export function returnSongHref(slug: string): string {
  return `/can-you-sing/${slug}#fit`;
}

/**
 * Where "Compare with <singer>" and the famous-voices rows go. The singer
 * page's comparison sits at #you-vs, about a screen and a half below the H1,
 * so the plain path landed a phone singer on the header's range-test button
 * with the comparison they came back for out of sight. A result screen only
 * shows for a saved range, so the anchor always lands on the comparison
 * itself, not its empty state.
 */
export function singerCompareHref(slug: string): string {
  return `/singers/${slug}#you-vs`;
}

/**
 * The voice-type caveat for a result a falsetto top could have lifted. The
 * test asks for falsetto at the top ("falsetto counts"), as a range should,
 * and the classifier scores that top against bands that describe full voice,
 * so its error runs one way: a baritone with an ordinary falsetto to D5 reads
 * Tenor, and to E5 "Tenor or Contralto". The female bands already take in
 * head voice, so this is not said under them (a Contralto with a short top
 * gets SHORT_TOP_NOTE, an error in the other direction). Nor under Bass: the
 * lowest band has nothing below it to have been lifted from, and the caveat
 * left a bass wondering whether they were lower still.
 */
export const FALSETTO_NOTE =
  "The bass, baritone and tenor bands describe full voice, but this test counts falsetto, so if your top notes were falsetto the fit can lean a category high: a baritone whose falsetto carried the top often reads as a tenor.";

/**
 * The caveat for a single-band Contralto result, whose error runs the other
 * way from FALSETTO_NOTE's. The female bands (lib/audio/notes.ts, F3–F5,
 * A3–A5, C4–C6) run to the top of a trained head voice, and a first test on
 * a cold or untrained voice often stops below it, so a short top pulls the
 * label down: A3–D5, a mezzo's low with a first-test top, reads Contralto,
 * the band the singer library's own page calls rare and over-assigned
 * (lib/voice-types.ts) and atlas ch.3 calls genuinely rare. The advice is
 * book ch.8's for a reading that looks wrong: a fresh test on another day,
 * after a proper warmup, rather than another try in the same session.
 *
 * Said only from a low at or above the contralto band's own floor, F3
 * (shortTopCanLower). From there every single-band Contralto has a top under
 * A5 and reads Mezzo-soprano once the top reaches a mezzo's A5, so "lean a
 * category low" is true of it. Under F3 the low decides the reading, which
 * needs a top above A5 to turn Mezzo (A#5 from E3, C#6 from C#3), so a
 * mezzo's full top would not move it; and those Contralto readings, C#3–E3
 * lows with E5–C6 tops, take in a tenor whose falsetto carried him to G5,
 * whose label leans high, not low.
 */
export const SHORT_TOP_NOTE =
  "The contralto, mezzo-soprano and soprano bands run to the top of a trained head voice, and a first test often stops below it, so the fit can lean a category low: a mezzo-soprano whose top stopped at D5 often reads as a contralto. True contralto is rare, so before you settle on it, take the test again on another day after a proper warmup.";

const LIFTABLE_BANDS: ReadonlySet<string> = new Set(["baritone", "tenor"]);

/**
 * Whether a short top, not the low, made this single-band reading Contralto:
 * the measured low sits inside the contralto band. See SHORT_TOP_NOTE.
 */
export function shortTopCanLower(voice: VoiceType, lowMidi: number): boolean {
  return voice.id === "contralto" && lowMidi >= voice.lowMidi;
}

/** The single-band note under the voice-type label. */
export function singleBandCopy(voice: VoiceType, lowMidi: number): string {
  const caveat = LIFTABLE_BANDS.has(voice.id)
    ? ` ${FALSETTO_NOTE}`
    : shortTopCanLower(voice, lowMidi)
      ? ` ${SHORT_TOP_NOTE}`
      : "";
  return `Voice types are rough guides borrowed from choral and operatic practice. Your range overlaps the ${voice.label.toLowerCase()} band the most, but plenty of great singers sit between categories — treat this as a starting point, not a box.${caveat}`;
}

/**
 * The style of "Start this warmup", the result's practice next step. It is
 * the filled primary, as the pitch meter's "Warm up" is one tab away, unless
 * a "Finish the comparison" or "Finish the check" card above already holds
 * the page's primary action: two filled buttons a screen apart compete for
 * the same tap (PRODUCT.md), the way the pitch meter outlines "Warm up" under
 * "Open today's plan".
 */
export function warmupButtonVariant(finishCardShown: boolean): "violet" | "outline" {
  return finishCardShown ? "outline" : "violet";
}

/**
 * The note under a two-band result. The pair is always one band from the
 * bass-to-tenor set and one from the contralto-to-soprano set, which the
 * singer library describes as male and female categories, so the honest
 * tiebreaker is the singer's own voice rather than anything a pitch tracker
 * can hear.
 */
function altBandsCopy(voice: VoiceType, alt: VoiceType): string {
  const [lower, higher] =
    voice.lowMidi <= alt.lowMidi ? [voice, alt] : [alt, voice];
  return `Your range fits the ${voice.label.toLowerCase()} and ${alt.label.toLowerCase()} bands about equally well, and a range test alone can't tell them apart: ${lower.label.toLowerCase()} is a male voice category and ${higher.label.toLowerCase()} a female one, and their notes overlap. Go with the one that describes your voice, and treat it as an estimate, not a box. ${FALSETTO_NOTE}`;
}

/** "basses", "tenors", "mezzo-sopranos". */
export function voicePlural(label: string): string {
  const lower = label.toLowerCase();
  return lower.endsWith("s") ? `${lower}es` : `${lower}s`;
}

function describeSpan(semitones: number): string {
  const oct = Math.floor(semitones / 12);
  const rem = semitones % 12;
  if (oct === 0) return `${rem} semitone${rem === 1 ? "" : "s"}`;
  const base = `${oct} octave${oct === 1 ? "" : "s"}`;
  return rem > 0 ? `${base} + ${rem}` : base;
}

/**
 * Semitones trimmed off each end as a first guess at "the notes I can sing a
 * phrase on". Both extremes are the furthest notes reached, so practising at
 * them trains the reach rather than the voice. The trim is arithmetic, not a
 * measurement, and the result card says so.
 */
const EDGE_TRIM_SEMIS = 3;

/** The middle of the span, with the edges trimmed. Never inverts. */
function workingRange(lowMidi: number, highMidi: number): [number, number] {
  const trim = Math.min(EDGE_TRIM_SEMIS, Math.floor((highMidi - lowMidi) / 4));
  return [lowMidi + trim, highMidi - trim];
}

/**
 * Under an octave and a quarter, the five-note scale (7 semitones) has little
 * or no room to change key on the fitted ladder (fitRootLadder in
 * components/warmups/exercises.ts), so the card says so instead of promising
 * a ladder or growth.
 */
const LADDER_MAX_SEMIS = 15;

/**
 * The five-note scale's own width (offsets 0-2-4-5-7). A narrower span cannot
 * hold it: the fitted ladder pins its top to the measured high and lets its
 * bottom fall below the measured low, so a narrower result gets humming
 * thirds instead.
 */
export const FIVE_NOTE_SCALE_SEMIS = 7;

/**
 * Which warmup a fresh result should send the singer to. Every target is a
 * free-tier exercise from components/warmups/exercises.ts — a Pro pack id
 * would be silently dropped by the player's entitlement check. The octave
 * siren waits for the coach's span rule (OCTAVE_SIREN_MIN_SEMIS in
 * components/warmups/exercises.ts): below it the siren's fitted ladder roots
 * its octave on or within two semitones of the measured low, and at 15 glides
 * onto the measured high, so its first rep would sing the edge notes this
 * card tells the singer to start away from. It is also the room's advanced
 * tier, for a voice already moving freely. Round 9 offered it from 15.
 *
 * Under the five-note scale's width its fitted ladder pins the top to the
 * measured high and sings every rep's bottom below the measured low, so a
 * narrower result (the range test saves 5 semitones or more, MIN_SAVED_SPAN
 * in ./range-test) gets humming thirds instead: four semitones wide, its
 * ladder stays inside the span and still moves a semitone a rep.
 */
function warmupForSpan(semis: number): { id: string; title: string; why: string } {
  if (semis < FIVE_NOTE_SCALE_SEMIS) {
    return {
      id: "humming-thirds",
      title: "Humming thirds",
      why: "Hum from a note up to the third above it and back, lips together and easy. The pattern is four semitones wide, so it stays inside the notes you reached, though a rep can touch your lowest or highest: keep those notes light, and stop any rep that strains.",
    };
  }
  const fiveNote = "Five notes up and back down on “ah”, light and connected.";
  return semis < OCTAVE_SIREN_MIN_SEMIS
    ? {
        id: "five-note-scale",
        title: "Five-note scale",
        why:
          semis < LADDER_MAX_SEMIS
            ? `${fiveNote} Your span leaves this pattern little room to change key, so it may stay in one key and come close to the lowest or highest note you reached: keep those notes light, and stop any rep that strains.`
            : // From 15 the fitted ladder roots at low + 4 and its top note
              // sits 4–5 semitones under the high (result-view.test.ts).
              `${fiveNote} It starts a major third above the lowest note you reached and stays a few notes under your highest: keep it light, and stop any rep that strains.`,
      }
    : {
        id: "octave-siren",
        title: "Octave siren",
        why: "You already cover the span. Sirens keep it one connected voice instead of a low one and a high one.",
      };
}

/**
 * The "Sing something" card's heading and body. Counted in the key each song
 * opens in (fitted to this range, countSongsFitting), the same judgement as
 * the songbook's "Fits your range" badge one tap later. A song that still
 * misses is either wider than the measured span or needs more than the
 * player's one-octave shift (MAX_TRANSPOSE), so the zero branch says "even
 * shifted by up to an octave" rather than offering more shifting as a cure.
 */
export function songCountCopy(
  counted: { fitting: number; total: number; locked: number } | null,
): { heading: string; body: string } {
  if (counted === null) {
    return {
      heading: "Find one that fits",
      body: "Songs now open fitted to the range you just measured, and you can shift any of them by semitones.",
    };
  }
  const { fitting, total, locked } = counted;
  const lockedNote = locked > 0 ? `; the other ${locked} open a band at a time as you master songs` : "";
  return {
    heading:
      total > 0 && fitting === total
        ? "Every open song fits your range"
        : `${fitting} of ${total} open songs ${fitting === 1 ? "fits" : "fit"} your range`,
    body:
      fitting > 0
        ? `They open fitted to the range you just measured, and you can shift any of them by semitones${lockedNote}.`
        : `None of the ${total} songs open to you now fits inside the range you just measured, even shifted by up to an octave${lockedNote}. Each opens as close to your range as it can, and you can shift it from there by semitones.`,
  };
}

/**
 * About six weeks between tests: RANGE_RETEST_DAYS in lib/progress.ts, the
 * interval the coach and the pitch meter wait before suggesting a retest, and
 * the spacing pro-charts.tsx asks for.
 */
const SAMPLE_INTERVAL_DAYS = RANGE_RETEST_DAYS;

/**
 * A worked example of the range chart, not the singer's data: three tests six
 * weeks apart, ending on the range just measured, with the edges wobbling by a
 * semitone rather than trending, because range edges move slowly if at all
 * (content/book/11-tracking-change.md). Shown only when there is nothing real
 * to plot. It used to widen by up to eight semitones over three months of
 * fortnightly tests, an outcome nobody measured and a testing habit the book
 * advises against.
 */
export function sampleHistory(lowMidi: number, highMidi: number): RangeEntry[] {
  // rangeSeries drops any entry whose high is not above its low.
  const wobble = highMidi - lowMidi >= 4 ? 1 : 0;
  const day = 24 * 60 * 60 * 1000;
  const end = Date.now();
  const spans: Array<[number, number]> = [
    [lowMidi, highMidi],
    [lowMidi + wobble, highMidi - wobble],
    [lowMidi, highMidi],
  ];
  return spans.map(([low, high], i) => ({
    lowMidi: low,
    highMidi: high,
    testedAt: new Date(
      end - (spans.length - 1 - i) * SAMPLE_INTERVAL_DAYS * day,
    ).toISOString(),
  }));
}

/** 0..100 position of a midi value on a fixed axis. */
function axisPct(midi: number, low: number, high: number): number {
  return Math.min(100, Math.max(0, ((midi - low) / (high - low)) * 100));
}

function safeFileLabel(midi: number): string {
  return midiToLabel(midi).replace("#", "s");
}

function renderCardDataUrl(lowMidi: number, highMidi: number): string | null {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const mono = monoFontStack();

  // Paper ground with the same soft violet wash the site body carries
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -120, 60, W / 2, -120, 760);
  glow.addColorStop(0, "rgba(197, 150, 66, 0.12)");
  glow.addColorStop(1, "rgba(197, 150, 66, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Panel frame
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(28.5, 28.5, W - 57, H - 57);

  ctx.textAlign = "center";

  // Kicker
  ctx.fillStyle = AMBER;
  ctx.font = `600 22px ${mono}`;
  ctx.fillText("V O C A L   R A N G E", W / 2, 118);

  // Big readout
  ctx.fillStyle = INK;
  ctx.font = `700 124px ${mono}`;
  ctx.fillText(`${midiToLabel(lowMidi)} — ${midiToLabel(highMidi)}`, W / 2, 268);

  // Voice type + span. This is the copy of the result that leaves the site,
  // so it carries the same "closest fit" hedge as the page: a voice type from
  // one range test is an estimate, not a classification.
  const semis = highMidi - lowMidi;
  const voiceLine = `Closest fit: ${voiceFitLabel(lowMidi, highMidi)} · ${semis} semitones · ${describeSpan(semis)}`;
  ctx.fillStyle = MUT;
  let lineSize = 30;
  ctx.font = `500 ${lineSize}px ${mono}`;
  // Two band names make the longest line overrun the frame; shrink to fit.
  while (lineSize > 18 && ctx.measureText(voiceLine).width > W - 140) {
    lineSize -= 2;
    ctx.font = `500 ${lineSize}px ${mono}`;
  }
  ctx.fillText(voiceLine, W / 2, 330);

  // Mini keyboard C2..C6 with range band
  const kbX = 120;
  const kbY = 392;
  const kbW = W - 240;
  const kbH = 96;
  const axisLow = 36;
  const axisHigh = 84;
  const whiteCount = 29;
  const whiteW = kbW / whiteCount;
  const blackPcs = new Set([1, 3, 6, 8, 10]);
  const centers = new Map<number, number>();
  let wi = 0;
  for (let m = axisLow; m <= axisHigh; m++) {
    const pc = ((m % 12) + 12) % 12;
    if (blackPcs.has(pc)) {
      centers.set(m, kbX + wi * whiteW);
    } else {
      centers.set(m, kbX + wi * whiteW + whiteW / 2);
      ctx.fillStyle = STRIP_WHITE;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.fillRect(kbX + wi * whiteW + 0.5, kbY, whiteW - 1, kbH);
      ctx.strokeRect(kbX + wi * whiteW + 0.5, kbY, whiteW - 1, kbH);
      wi++;
    }
  }
  wi = 0;
  for (let m = axisLow; m <= axisHigh; m++) {
    const pc = ((m % 12) + 12) % 12;
    if (blackPcs.has(pc)) {
      const cx = centers.get(m) ?? kbX;
      ctx.fillStyle = STRIP_BLACK;
      ctx.fillRect(cx - whiteW * 0.28, kbY, whiteW * 0.56, kbH * 0.6);
    } else {
      wi++;
    }
  }
  const clampMidi = (m: number) => Math.max(axisLow, Math.min(axisHigh, m));
  const x0 = (centers.get(clampMidi(lowMidi)) ?? kbX) - whiteW / 2;
  const x1 = (centers.get(clampMidi(highMidi)) ?? kbX + kbW) + whiteW / 2;
  ctx.fillStyle = "rgba(197, 150, 66, 0.30)";
  ctx.fillRect(x0, kbY, Math.max(0, x1 - x0), kbH);
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, kbY, Math.max(0, x1 - x0), kbH);
  ctx.fillStyle = AMBER;
  ctx.font = `600 22px ${mono}`;
  ctx.fillText(midiToLabel(lowMidi), x0, kbY + kbH + 30);
  ctx.fillText(midiToLabel(highMidi), x1, kbY + kbH + 30);

  // Footer
  ctx.fillStyle = DIM;
  ctx.font = `500 22px ${mono}`;
  ctx.fillText("sing.suedeai.ai — online singing practice", W / 2, H - 52);

  return canvas.toDataURL("image/png");
}

export interface SaveSummary {
  xpGained: number;
  newAchievements: Achievement[];
}

export function ResultView({
  lowMidi,
  highMidi,
  save,
  onRetake,
}: {
  lowMidi: number;
  highMidi: number;
  /** XP/achievement summary from saving — undefined for a previously saved result. */
  save?: SaveSummary;
  onRetake: () => void;
}) {
  const [downloadError, setDownloadError] = useState(false);
  const comparisonSlug = useSyncExternalStore(
    subscribeToLocation,
    comparisonSlugFromLocation,
    noServerComparison,
  );
  const comparisonSinger = comparisonSingerFromSlug(comparisonSlug);
  const returnSongSlug = useSyncExternalStore(
    subscribeToLocation,
    returnSongFromLocation,
    noServerComparison,
  );
  const semis = highMidi - lowMidi;
  const voice = useMemo(
    () => classifyVoice(lowMidi, highMidi),
    [lowMidi, highMidi],
  );
  const altVoice = useMemo(
    () => crossFamilyAlternative(lowMidi, highMidi),
    [lowMidi, highMidi],
  );

  const [workLow, workHigh] = workingRange(lowMidi, highMidi);
  const trimmed = workLow - lowMidi;
  const middleIs =
    trimmed > 0
      ? `your span with ${trimmed} semitone${trimmed === 1 ? "" : "s"} trimmed from each end`
      : "the whole span you reached";
  const warmup = warmupForSpan(semis);

  const isPro = useIsPro();
  const proReady = useProReady();
  // How many tests the record holds, this one included once it is saved.
  const rangeTests = useProgress().rangeHistory.length;
  // The catalog is ~30 KB of per-note data and all this panel wants from it is
  // a count, so it loads after the result renders rather than riding in the
  // /range bundle — this route's cold traffic never reaches the songbook.
  // Held until the entitlement cache has been read, because the book counted
  // has to be the one the singer can actually open: quoting the free set to a
  // subscriber understates what they paid for, and quoting the full set to a
  // free reader promises access they hit a paywall on one click later.
  // Offline (the connection dropped during the test), the chunk cannot load:
  // the card keeps its uncounted copy (songCountCopy(null)) and counts once
  // the connection is back, rather than throwing an uncaught ChunkLoadError.
  const [book, setBook] = useState<readonly Song[] | null>(null);
  useEffect(() => {
    if (!proReady) return;
    const quit = new AbortController();
    void retryWhenOnline(() => import("@/components/songs/data"), { signal: quit.signal }).then((m) => {
      if (!quit.signal.aborted) setBook(isPro ? [...m.SONGS, ...m.PRO_SONGS] : m.SONGS);
    });
    return () => quit.abort();
  }, [isPro, proReady]);

  // Counted over the bands open now, not the whole book: "Open the songbook"
  // lands on a library where later bands show Locked until songs below them
  // are mastered, so the count must be of songs the singer can start.
  const mastered = useMastered();
  const counted = useMemo(
    () => (book === null ? null : countOpenSongsFitting(book, mastered, { lowMidi, highMidi })),
    [book, mastered, lowMidi, highMidi],
  );
  const songCopy = songCountCopy(counted);

  const famous = useMemo(() => {
    const rows = rankFamousVoices(lowMidi, highMidi);
    return { rows, best: rows[0] };
  }, [lowMidi, highMidi]);

  // Axis for the famous comparison: octave-snapped around every listed range
  // (and the singer's own, in case it reaches beyond them).
  const FAME_LOW =
    Math.floor(
      Math.min(lowMidi, ...famous.rows.map((f) => f.lowMidi)) / 12,
    ) * 12;
  const FAME_HIGH =
    Math.ceil(
      Math.max(highMidi, ...famous.rows.map((f) => f.highMidi)) / 12,
    ) * 12;

  const playRange = () => {
    playTone(lowMidi, { dur: 0.6 });
    playTone(lowMidi, { dur: 1.4, at: 0.7, glideToMidi: highMidi });
    playTone(highMidi, { dur: 0.6, at: 2.2 });
  };

  const downloadCard = () => {
    setDownloadError(false);
    const url = renderCardDataUrl(lowMidi, highMidi);
    if (!url) {
      setDownloadError(true);
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `vocal-range-${safeFileLabel(lowMidi)}-${safeFileLabel(highMidi)}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Big readout */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel>Your range</SectionLabel>
            <div className="tabular mt-3 font-mono text-5xl font-bold sm:text-7xl">
              {midiToLabel(lowMidi)}
              <span className="text-dim"> — </span>
              {midiToLabel(highMidi)}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <Stat label="Semitones" value={semis} tone="violet" />
            <Stat label="Span" value={describeSpan(semis)} tone="ink" />
            <Stat
              label="Voice type"
              value={voice.label}
              sub={
                altVoice
                  ? `Or ${altVoice.label}, an estimate`
                  : "Closest fit, an estimate"
              }
              tone="cool"
            />
          </div>
        </div>
        <div className="mt-6">
          <PianoStrip
            rangeLow={lowMidi}
            rangeHigh={highMidi}
            markLow={lowMidi}
            markHigh={highMidi}
            ariaLabel={`Keyboard showing your range from ${midiToLabel(lowMidi)} to ${midiToLabel(highMidi)}`}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={playRange}>
            Play my range
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCard}>
            Download result card
          </Button>
          <Button variant="ghost" size="sm" onClick={onRetake}>
            Retake test
          </Button>
        </div>
        {downloadError && (
          <p className="mt-3 text-sm text-rec">
            The image could not be generated. Try a different browser, or take
            a screenshot instead.
          </p>
        )}
      </Card>

      {comparisonSinger && (
        <Card className="border-violet/40">
          <SectionLabel>Finish the comparison</SectionLabel>
          <h2 className="mt-3 text-xl">
            Now compare your range with {comparisonSinger.name}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-mut">
            Your result is saved in this browser. Return to the singer profile
            to see the overlap, shared notes, and the gap at each end.
          </p>
          <div className="mt-4">
            <LinkButton href={singerCompareHref(comparisonSinger.slug)} size="md">
              Compare with {comparisonSinger.name} →
            </LinkButton>
          </div>
        </Card>
      )}

      {/* The song-page twin of the card above. "Can you sing it?" sends a
          visitor here with ?check=<song>, and the answer is back on that
          page, so the result says so instead of leaving them to find it. */}
      {returnSongSlug && (
        <Card className="border-violet/40">
          <SectionLabel>Finish the check</SectionLabel>
          <h2 className="mt-3 text-xl">Now see if the song fits your range</h2>
          <p className="mt-2 max-w-2xl text-sm text-mut">
            Your result is saved in this browser. The song page now compares it
            with the song&rsquo;s cited range.
          </p>
          <div className="mt-4">
            <LinkButton href={returnSongHref(returnSongSlug)} size="md">
              Back to the song →
            </LinkButton>
          </div>
        </Card>
      )}

      {/* Save summary */}
      {save && (
        <Card className="border-ok/30">
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="ok">Saved to your progress</Pill>
            <span className="tabular font-mono text-sm text-ok-ink">
              +{save.xpGained} XP
            </span>
          </div>
          {save.newAchievements.length > 0 && (
            <ul className="mt-4 space-y-2">
              {save.newAchievements.map((a) => (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  <span aria-hidden="true">{a.icon}</span>
                  <span className="font-medium">{a.title}</span>
                  <span className="text-mut">{a.desc}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* The result used to end at the number. Two edges and a voice-type
          label are a diagnosis with no prescription, so this is the one card
          that says what to go and do with them. */}
      <Card>
        <SectionLabel>What to do with this</SectionLabel>
        <h2 className="mt-3 text-xl">
          Start in the middle:{" "}
          <span className="text-violet-ink">
            {midiToLabel(workLow)}–{midiToLabel(workHigh)}
          </span>
        </h2>
        {/* The test asks for the furthest clear notes, falsetto included, and
            never for comfort, so the middle band is a guess and says so: a
            baritone whose top was falsetto would otherwise be told to put
            his songs up there. Warmups start in the band rather than stay in
            it: the octave siren this card recommends from 21 semitones roots
            in the band but glides above it, and for a span under four
            semitones the "middle" is all of it, which is still not a measured
            comfortable band. */}
        <p className="mt-2 max-w-2xl text-sm text-mut">
          {midiToLabel(lowMidi)} and {midiToLabel(highMidi)} are the furthest
          clear notes you reached today, and a note you can only just reach is
          not a note you can hold a phrase on.{" "}
          {midiToLabel(workLow)}–{midiToLabel(workHigh)} is {middleIs}: a
          starting guess at where you sing comfortably, not a measurement of
          it. If your top notes were falsetto, the top of that guess may sit
          above your comfortable band. Find the band by ear in the{" "}
          <Link
            href="/studio"
            className="text-violet-ink underline decoration-violet/50 underline-offset-2 hover:decoration-violet"
          >
            pitch studio
          </Link>
          , then start warmups there and keep songs inside it.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-panel2/60 p-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Warm up
            </span>
            <h3 className="mt-2 text-base font-semibold">{warmup.title}</h3>
            <p className="mt-1.5 text-sm text-mut">{warmup.why}</p>
            <div className="mt-4">
              {/* ?exercise= is the warmup room's deep-link contract; an
                  unrecognised param just lands on the library, so this stays
                  safe either way. */}
              <LinkButton
                href={`/warmups?exercise=${warmup.id}`}
                variant={warmupButtonVariant(Boolean(comparisonSinger || returnSongSlug))}
                size="sm"
              >
                Start this warmup
              </LinkButton>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-panel2/60 p-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Sing something
            </span>
            {/* Counted in the key each song opens in, the same judgement as
                the songbook's "Fits your range" badge one tap later. */}
            <h3 className="mt-2 text-base font-semibold">{songCopy.heading}</h3>
            <p className="mt-1.5 text-sm text-mut">{songCopy.body}</p>
            <div className="mt-4">
              {/* Plain /songs, no filter param: the library seeds its browse
                  state from a constant and reads nothing off the URL, so a
                  ?fit=1 here would name a landing it cannot deliver. The count
                  above is stated here rather than promised there. */}
              <LinkButton href="/songs" variant="outline" size="sm">
                Open the songbook
              </LinkButton>
            </div>
          </div>
        </div>
        {/* Both cards lead into capped practice; say so before the click
            rather than at the paywall. */}
        {proReady && !isPro && (
          <p className="mt-4 text-xs text-dim">
            On the free plan, warmups and songs count toward{" "}
            {FREE_DAILY_MINUTES} minutes of guided practice a day, and Pro
            removes that limit. The range test has no daily limit.
          </p>
        )}
      </Card>

      {/* Voice type chart */}
      <Card>
        <SectionLabel>Voice type</SectionLabel>
        <h2 className="mt-3 text-xl">
          Closest fit: <span className="text-violet-ink">{voice.label}</span>
          {altVoice && (
            <>
              {" "}
              or <span className="text-violet-ink">{altVoice.label}</span>
            </>
          )}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mut">
          {altVoice
            ? altBandsCopy(voice, altVoice)
            : singleBandCopy(voice, lowMidi)}
        </p>
        {/* The classification used to end here. Every label the classifier can
            produce has a page of singers behind it, so it should be the next
            click rather than the last word. */}
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {(altVoice ? [voice, altVoice] : [voice]).map((v) => (
            <Link
              key={v.id}
              href={`/singers/voice-type/${voiceTypeSlug(v.label)}`}
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-sm text-violet-ink underline decoration-violet/40 underline-offset-4 hover:decoration-violet"
            >
              See the {voicePlural(v.label)} in the library
              <span aria-hidden>→</span>
            </Link>
          ))}
        </div>
        <div className="mt-6 space-y-2">
          {VOICE_TYPES.map((v) => {
            const left = axisPct(v.lowMidi, 36, 84);
            const width = axisPct(v.highMidi, 36, 84) - left;
            const isMatch = v.id === voice.id || v.id === altVoice?.id;
            return (
              <div key={v.id} className="flex items-center gap-3">
                <span
                  className={`w-24 shrink-0 text-right font-mono text-xs sm:w-28 ${isMatch ? "text-violet-ink" : "text-mut"}`}
                >
                  {v.label}
                </span>
                <div className="relative h-5 flex-1 rounded bg-panel2">
                  <div
                    className={`absolute inset-y-0 rounded ${isMatch ? "bg-cool/50" : "bg-cool/25"}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
                {/* The note range is dropped on phones, as the famous rows
                    drop theirs: with it, a 320px screen left each bar about
                    30px wide and ran the axis together as "C2C3C4C5C6". The
                    bars and the axis carry the same span. */}
                <span className="tabular hidden w-20 shrink-0 font-mono text-[11px] text-dim sm:block">
                  {midiToLabel(v.lowMidi)}–{midiToLabel(v.highMidi)}
                </span>
              </div>
            );
          })}
          {/* User range overlay row */}
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-right font-mono text-xs font-semibold text-violet-ink sm:w-28">
              You
            </span>
            <div className="relative h-5 flex-1 rounded bg-panel2">
              <div
                className="absolute inset-y-0 rounded bg-violet"
                style={{
                  left: `${axisPct(lowMidi, 36, 84)}%`,
                  width: `${Math.max(1, axisPct(highMidi, 36, 84) - axisPct(lowMidi, 36, 84))}%`,
                }}
              />
            </div>
            <span className="tabular hidden w-20 shrink-0 font-mono text-[11px] text-violet-ink sm:block">
              {midiToLabel(lowMidi)}–{midiToLabel(highMidi)}
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="w-24 shrink-0 sm:w-28" />
            <div className="flex flex-1 justify-between font-mono text-[10px] text-dim">
              <span>C2</span>
              <span>C3</span>
              <span>C4</span>
              <span>C5</span>
              <span>C6</span>
            </div>
            <span className="hidden w-20 shrink-0 sm:block" />
          </div>
        </div>
      </Card>

      {/* Famous voices */}
      <Card>
        <SectionLabel>Famous company</SectionLabel>
        <h2 className="mt-3 text-xl">
          Closest reported range to yours:{" "}
          <span className="text-violet-ink">{famous.best.name}</span>
        </h2>
        {/* The order is not the (Nst) column: a much wider range can share
            every note of yours and still sit below a closer one, and without
            this line that reads as a sorting bug. */}
        <p className="mt-2 max-w-2xl text-sm text-mut">
          Ranked by the share of your two ranges&rsquo; combined span that
          overlaps, so a much wider range can contain all of yours and still
          rank lower. Reported ranges are approximate figures fans and
          journalists commonly cite, not lab measurements.
        </p>
        <div className="mt-6 space-y-2">
          {famous.rows.map((f, i) => {
            const left = axisPct(f.lowMidi, FAME_LOW, FAME_HIGH);
            const width = axisPct(f.highMidi, FAME_LOW, FAME_HIGH) - left;
            const uLeft = axisPct(lowMidi, FAME_LOW, FAME_HIGH);
            const uWidth = Math.max(
              1,
              axisPct(highMidi, FAME_LOW, FAME_HIGH) - uLeft,
            );
            const isBest = i === 0;
            return (
              <div key={f.name} className="flex items-center gap-3">
                <Link
                  href={singerCompareHref(f.slug)}
                  prefetch={false}
                  className={`w-24 shrink-0 truncate text-right font-mono text-xs underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current sm:w-36 ${isBest ? "text-violet-ink" : "text-mut"}`}
                >
                  {f.name}
                </Link>
                <div className="relative h-5 flex-1 rounded bg-panel2">
                  <div
                    className={`absolute inset-y-0 rounded ${isBest ? "bg-cool/50" : "bg-cool/25"}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                  <div
                    className="absolute inset-y-1 rounded bg-violet/70"
                    style={{ left: `${uLeft}%`, width: `${uWidth}%` }}
                  />
                </div>
                {/* The note range is dropped on phones: with it, the bar
                    between the name and the label was about 37px wide.
                    What is left there, "(24st)", needs no more than w-11. */}
                <span className="tabular w-11 shrink-0 font-mono text-[11px] text-dim sm:w-24">
                  <span className="hidden sm:inline">
                    {midiToLabel(f.lowMidi)}–{midiToLabel(f.highMidi)}{" "}
                  </span>
                  <span className={isBest ? "text-violet-ink" : ""}>
                    ({f.overlap}st)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Violet = your range · st = semitones of overlap
        </p>
        <div className="mt-4">
          <Link
            href="/singers"
            prefetch={false}
            className="text-sm text-violet-ink underline decoration-violet/50 underline-offset-2 hover:decoration-violet"
          >
            Compare against every famous voice →
          </Link>
        </div>
      </Card>

      {/* Every other completion screen carries the offer; this one, the
          highest-intent moment in the product, carried only a locked chart.
          Self-hides for Pro, so it collapses out of the stack entirely.
          Free singers keep their tests too (the latest MAX_RANGE_HISTORY), so
          Pro's part is the chart, not the keeping, and it shows change at the
          edges rather than promising growth. */}
      {/* A first result already carries the locked chart below, so it gets
          the one-line form rather than a card over it; the full offer waits
          for a retest, when there is a second test to chart. */}
      {rangeTests <= 1 ? (
        <ProInlineNudge>{RANGE_NUDGE_LINE}</ProInlineNudge>
      ) : (
        <ProCrescendoNudge
          line={RANGE_NUDGE_LINE}
          title="See your tests on one chart"
          body={`Pro charts your latest ${MAX_RANGE_HISTORY} range tests on one chart, so a real change at either edge shows up instead of a number you have to remember.`}
          context="Range test"
        />
      )}

      {/* Range over time — real history for Pro, the same chart faded as the
          preview for free. */}
      <RangeOverTime lowMidi={lowMidi} highMidi={highMidi} />
    </div>
  );
}

function RangeOverTime({
  lowMidi,
  highMidi,
}: {
  lowMidi: number;
  highMidi: number;
}) {
  const isPro = useIsPro();
  const history = useProgress().rangeHistory;

  if (isPro) {
    return (
      <Card>
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>Range over time</SectionLabel>
          <ProChip />
        </div>
        <div className="mt-4">
          <RangeHistoryChart history={history} />
        </div>
      </Card>
    );
  }

  // A first-time tester has nothing to plot, so the free panel used to sell
  // the chart with an empty chart. Plot a worked example instead — and say so
  // in the panel label, which is the only part of a LockedPanel that is not
  // aria-hidden, so the sample can never read as their own history.
  const hasHistory = history.length >= 2;

  return (
    <LockedPanel
      label={hasHistory ? "Range over time" : "Range over time · sample"}
    >
      <div className="p-4 sm:p-5">
        {/* Above the chart, not below it: the panel pins its lock row over the
            bottom of whatever it wraps, and a caption there would be buried. */}
        {!hasHistory && (
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Sample — three tests about six weeks apart
          </p>
        )}
        <RangeHistoryChart
          history={hasHistory ? history : sampleHistory(lowMidi, highMidi)}
        />
      </div>
    </LockedPanel>
  );
}
