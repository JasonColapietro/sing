"use client";

import { useState, useSyncExternalStore } from "react";
import { Button, Card, Pill, SectionLabel } from "@/components/ui";
import { midiToName } from "@/lib/audio/notes";
import {
  computeGrade,
  starGlyphs,
  starRatingLabel,
  type GradeResult,
  type Tone,
} from "./grade";
import type { SessionSummaryData } from "./lib";

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-ok-ink",
  amber: "text-amber-ink",
  rec: "text-rec",
};

/** One figure beside the score, shown on the card and repeated in the share text. */
export interface ResultStat {
  label: string;
  value: string;
  tone?: "ink" | "cool" | "amber";
}

const STAT_TONE: Record<NonNullable<ResultStat["tone"]>, string> = {
  ink: "text-ink",
  cool: "text-cool",
  amber: "text-amber-ink",
};

/** "C" or "G# (+3)" — the key isn't meaningful without noting a shift from the default. */
function keyLabel(defaultKeyRootMidi: number, transpose: number): string {
  const name = midiToName(defaultKeyRootMidi + transpose);
  return transpose === 0 ? name : `${name} (${transpose > 0 ? "+" : ""}${transpose})`;
}

// navigator.clipboard / navigator.share are stable for a page's lifetime —
// no event ever fires when they'd change — so this is a one-shot snapshot
// read, not a subscription. useSyncExternalStore (rather than the more
// common useEffect+setState) is what lib/progress.ts's own useProgress()
// already uses for this exact shape of problem: it lets the server snapshot
// answer "false" safely during SSR while the client snapshot reads the real
// capability, with no hydration-mismatch warning and no extra render pass.
function noopSubscribe() {
  return () => {};
}
function hasClipboardWrite(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";
}
function hasShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
function serverFalse(): boolean {
  return false;
}

function shareText(
  title: string,
  subtitle: string | undefined,
  score: number,
  grade: GradeResult,
  stats: ResultStat[],
): string {
  const figures = [`Score ${score}/100`, ...stats.map((s) => `${s.label} ${s.value}`)];
  return [
    `Suede Sing — "${title}"`,
    `Grade ${grade.grade} · ${starGlyphs(grade.stars)} (${grade.stars}/5)`,
    figures.join(" · "),
    ...(subtitle ? [subtitle] : []),
    "sing.suedeai.ai",
  ].join("\n");
}

/**
 * A shareable, screenshot-ready result card, written once for every room
 * that ends in a score — songs and warmups both hand it a title, a grade and
 * a handful of figures rather than each growing their own copy.
 *
 * Strictly local: the only side effects it can trigger are writing to the OS
 * clipboard and opening the OS share sheet, both user-initiated and both
 * feature-detected, since neither API exists on every browser and this must
 * never assume either does. Nothing here ever calls a network endpoint.
 */
export function ShareableResult({
  title,
  subtitle,
  score,
  grade,
  stats = [],
}: {
  title: string;
  subtitle?: string;
  /** 0..100. */
  score: number;
  grade: GradeResult;
  stats?: ResultStat[];
}) {
  const canCopy = useSyncExternalStore(noopSubscribe, hasClipboardWrite, serverFalse);
  const canShare = useSyncExternalStore(noopSubscribe, hasShare, serverFalse);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const text = shareText(title, subtitle, score, grade, stats);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
    }
  }

  async function handleShare() {
    try {
      await navigator.share({ title: `Suede Sing — ${title}`, text });
    } catch {
      // User cancelled or the OS declined — Copy result stays available.
    }
  }

  return (
    <Card className="border-amber/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionLabel>Suede Sing</SectionLabel>
          <h3 className="mt-3 text-xl">{title}</h3>
          {subtitle && <p className="mt-1.5 text-sm text-mut">{subtitle}</p>}
        </div>
        <div className="text-right">
          <div className={`text-5xl ${TONE_TEXT[grade.tone]}`}>{grade.grade}</div>
          <div className="tabular mt-1 font-mono text-lg tracking-wider text-amber-ink" aria-hidden="true">
            {starGlyphs(grade.stars)}
          </div>
          <span className="sr-only">{starRatingLabel(grade.stars)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-10">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Score</div>
          <div className="tabular mt-1 font-mono text-2xl">{score}/100</div>
        </div>
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              {stat.label}
            </div>
            <div className={`tabular mt-1 font-mono text-2xl ${STAT_TONE[stat.tone ?? "ink"]}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {(canCopy || canShare) && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {canCopy && (
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copyState === "copied" ? "Copied" : "Copy result"}
            </Button>
          )}
          {canShare && (
            <Button variant="outline" size="sm" onClick={handleShare}>
              Share
            </Button>
          )}
          {copyState === "error" && <Pill tone="rec">Couldn&rsquo;t copy — try again</Pill>}
          <span aria-live="polite" className="sr-only">
            {copyState === "copied" ? "Result copied to clipboard" : ""}
          </span>
        </div>
      )}
    </Card>
  );
}

/**
 * The songs adapter: turns a finished song session into the shape above.
 *
 * A listen-mode or otherwise unscored session has nothing to grade or share
 * — the card must not promise a score that doesn't exist.
 */
export function ResultCard({ data }: { data: SessionSummaryData }) {
  const { song, score, maxCombo, judgments, transpose, tempo } = data;
  if (score === undefined) return null;
  const grade = computeGrade(score, maxCombo, judgments);
  if (!grade) return null;

  return (
    <ShareableResult
      title={song.title}
      subtitle={`Key of ${keyLabel(song.defaultKeyRootMidi, transpose)} · ${tempo}× tempo`}
      score={score}
      grade={grade}
      stats={[{ label: "Max combo", value: String(maxCombo), tone: "cool" }]}
    />
  );
}
