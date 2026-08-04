"use client";

import { useState, useSyncExternalStore } from "react";
import { Button, Card, Pill, SectionLabel } from "@/components/ui";
import { midiToName } from "@/lib/audio/notes";
import { computeGrade, starGlyphs, starRatingLabel, type Tone } from "./grade";
import type { SessionSummaryData } from "./lib";

const TONE_TEXT: Record<Tone, string> = {
  ok: "text-ok-ink",
  amber: "text-amber-ink",
  rec: "text-rec",
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

function shareText(data: SessionSummaryData, score: number, gradeLetter: string, stars: number): string {
  const lines = [
    `Suede Sing — "${data.song.title}"`,
    `Grade ${gradeLetter} · ${starGlyphs(stars)} (${stars}/5)`,
    `Score ${score}/100 · Max combo ${data.maxCombo}`,
    `Key ${keyLabel(data.song.defaultKeyRootMidi, data.transpose)} · ${data.tempo}× tempo`,
    "sing.suedeai.ai",
  ];
  return lines.join("\n");
}

/**
 * A shareable, screenshot-ready result card. Strictly local: the only
 * side effects it can trigger are writing to the OS clipboard and opening
 * the OS share sheet, both user-initiated and both feature-detected, since
 * neither API exists on every browser and this must never assume either
 * does. Nothing here ever calls a network endpoint.
 */
export function ResultCard({ data }: { data: SessionSummaryData }) {
  const { song, score, maxCombo, judgments, transpose, tempo } = data;
  const canCopy = useSyncExternalStore(noopSubscribe, hasClipboardWrite, serverFalse);
  const canShare = useSyncExternalStore(noopSubscribe, hasShare, serverFalse);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  // A listen-mode or otherwise unscored session has nothing to grade or
  // share — the card must not promise a score that doesn't exist.
  if (score === undefined) return null;
  const grade = computeGrade(score, maxCombo, judgments);
  if (!grade) return null;

  const text = shareText(data, score, grade.grade, grade.stars);

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
      await navigator.share({ title: `Suede Sing — ${song.title}`, text });
    } catch {
      // User cancelled or the OS declined — Copy result stays available.
    }
  }

  return (
    <Card className="border-amber/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionLabel>Suede Sing</SectionLabel>
          <h3 className="mt-3 text-xl">{song.title}</h3>
          <p className="mt-1.5 text-sm text-mut">
            Key of {keyLabel(song.defaultKeyRootMidi, transpose)} · {tempo}× tempo
          </p>
        </div>
        <div className="text-right">
          <div className={`font-display text-5xl ${TONE_TEXT[grade.tone]}`}>{grade.grade}</div>
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
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Max combo</div>
          <div className="tabular mt-1 font-mono text-2xl text-cool">{maxCombo}</div>
        </div>
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
