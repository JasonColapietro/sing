"use client";

import { Button, Card, Pill, ProgressBar, SectionLabel, Stat } from "@/components/ui";
import { midiToLabel } from "@/lib/audio/notes";
import type { SessionSummaryData } from "./lib";

function scoreTone(score: number): "ok" | "amber" | "rec" {
  if (score >= 80) return "ok";
  if (score >= 50) return "amber";
  return "rec";
}

export function SessionSummary({
  data,
  onAgain,
  onLibrary,
}: {
  data: SessionSummaryData;
  onAgain: () => void;
  onLibrary: () => void;
}) {
  const { song, score, perLoopScores, hardest, xpGained, newAchievements, listenMode } = data;

  return (
    <div className="space-y-6">
      <Card>
        <SectionLabel>Practice complete</SectionLabel>
        <h2 className="mt-3 text-2xl">{song.title}</h2>

        {listenMode || score === undefined ? (
          <p className="mt-4 max-w-md text-sm text-mut">
            You practiced in listen mode, so there&rsquo;s no pitch score this
            time. Enable your microphone next time to get scored.
          </p>
        ) : (
          <div className="mt-6 flex flex-wrap gap-10">
            <Stat label="Score" value={`${score}/100`} tone={scoreTone(score)} />
            <Stat label="Loops sung" value={perLoopScores.length} tone="cool" />
          </div>
        )}

        {!listenMode && perLoopScores.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Per-loop score
            </div>
            {perLoopScores.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="tabular w-14 shrink-0 font-mono text-xs text-dim">
                  loop {i + 1}
                </span>
                <ProgressBar value={s} tone={scoreTone(s)} className="flex-1" />
                <span className="tabular w-12 shrink-0 text-right font-mono text-xs">{s}%</span>
              </div>
            ))}
          </div>
        )}

        {!listenMode && hardest.length > 0 && (
          <div className="mt-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Trickiest notes
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {hardest.map((n) => (
                <Pill key={n.index} tone="amber">
                  {midiToLabel(n.midi)} · &ldquo;{n.lyric}&rdquo;
                </Pill>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="border-ok/30">
        <div className="flex flex-wrap items-center gap-3">
          <Pill tone="ok">Saved to your progress</Pill>
          <span className="tabular font-mono text-sm text-ok">+{xpGained} XP</span>
        </div>
        {newAchievements.length > 0 && (
          <ul className="mt-4 space-y-2">
            {newAchievements.map((a) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span aria-hidden="true">{a.icon}</span>
                <span className="font-medium">{a.title}</span>
                <span className="text-mut">{a.desc}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="amber" onClick={onAgain}>
          Sing again
        </Button>
        <Button variant="outline" onClick={onLibrary}>
          Back to library
        </Button>
      </div>
    </div>
  );
}
