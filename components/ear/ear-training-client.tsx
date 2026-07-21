"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, PageShell, Pill, SectionLabel } from "@/components/ui";
import {
  DIFFICULTIES,
  GAME_NAMES,
  readBests,
  type Difficulty,
  type GameId,
} from "./lib";
import { IntervalGame } from "./interval-game";
import { PitchMatchGame } from "./pitch-match-game";
import { MelodyEchoGame } from "./melody-echo-game";
import { HigherLowerGame } from "./higher-lower-game";

interface GameMeta {
  id: GameId;
  trains: string;
  desc: string;
  mic: boolean;
  icon: React.ReactNode;
}

const GAMES: GameMeta[] = [
  {
    id: "interval",
    trains: "Interval recognition",
    desc: "Two notes play — name the distance between them.",
    mic: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 17V7m16 10V7" stroke="#8fb7e8" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M7.5 12h9" stroke="#8fb7e8" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2.5 3" />
      </svg>
    ),
  },
  {
    id: "pitch-match",
    trains: "Pitch accuracy",
    desc: "Hear a note, sing it back, and hold it steady in tune.",
    mic: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" stroke="#8fb7e8" strokeWidth="1.8" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="#8fb7e8" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "melody-echo",
    trains: "Melodic memory",
    desc: "Hear a short melody and echo it back note for note.",
    mic: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 15c2-4 4 4 6 0s4 4 6 0 3-2 4-1" stroke="#8fb7e8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M4 9c2-4 4 4 6 0" stroke="#8fb7e8" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.5" />
      </svg>
    ),
  },
  {
    id: "higher-lower",
    trains: "Pitch direction",
    desc: "Was the second note higher or lower? Fast rounds, tiny gaps.",
    mic: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 18V6m0 0L4.5 9.5M8 6l3.5 3.5" stroke="#8fb7e8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 6v12m0 0 3.5-3.5M16 18l-3.5-3.5" stroke="#8fb7e8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function EarTrainingClient() {
  const [active, setActive] = useState<{ game: GameId; difficulty: Difficulty } | null>(null);
  const [diffs, setDiffs] = useState<Record<GameId, Difficulty>>({
    interval: "easy",
    "pitch-match": "easy",
    "melody-echo": "easy",
    "higher-lower": "easy",
  });
  const [bests, setBests] = useState<Record<string, number>>({});

  const refreshBests = useCallback(() => setBests(readBests()), []);
  useEffect(() => {
    // Deliberately deferred to an effect: reading localStorage during the
    // lazy initializer would return real scores on the client but {} on the
    // server, causing a hydration mismatch on this route's SSR-prerendered
    // HTML shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshBests();
  }, [refreshBests]);

  const exit = useCallback(() => {
    setActive(null);
    refreshBests();
  }, [refreshBests]);

  if (active) {
    const props = { difficulty: active.difficulty, onExit: exit };
    return (
      <PageShell kicker="Ear training" title={GAME_NAMES[active.game]}>
        {active.game === "interval" && <IntervalGame {...props} />}
        {active.game === "pitch-match" && <PitchMatchGame {...props} />}
        {active.game === "melody-echo" && <MelodyEchoGame {...props} />}
        {active.game === "higher-lower" && <HigherLowerGame {...props} />}
      </PageShell>
    );
  }

  return (
    <PageShell
      kicker="Ear training"
      title="Train your ear"
      subtitle="Four short games, ten rounds each. Pick a difficulty and press play."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((g) => {
          const diff = diffs[g.id];
          const best = bests[`${g.id}:${diff}`];
          return (
            <Card key={g.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel2">
                    {g.icon}
                  </span>
                  <div>
                    <h2 className="text-lg">{GAME_NAMES[g.id]}</h2>
                    <SectionLabel className="mt-1 border-cool/30 text-cool">
                      {g.trains}
                    </SectionLabel>
                  </div>
                </div>
                {g.mic && <Pill tone="rec">mic</Pill>}
              </div>

              <p className="mt-3 text-sm text-mut">{g.desc}</p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div
                  role="radiogroup"
                  aria-label={`${GAME_NAMES[g.id]} difficulty`}
                  className="flex rounded-full border border-line bg-panel2 p-0.5"
                >
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      role="radio"
                      aria-checked={diff === d.id}
                      onClick={() => setDiffs((p) => ({ ...p, [g.id]: d.id }))}
                      className={`rounded-full px-3 py-1 text-xs transition-colors ${
                        diff === d.id
                          ? "bg-panel text-amber"
                          : "text-mut hover:text-ink"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <span className="tabular font-mono text-xs text-dim">
                  {typeof best === "number" ? `Best ${best}/100` : "Not played yet"}
                </span>
              </div>

              <div className="mt-4">
                <Button
                  variant="amber"
                  size="sm"
                  onClick={() => setActive({ game: g.id, difficulty: diff })}
                >
                  Play
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M2.5 1.5 8 5 2.5 8.5z" fill="currentColor" />
                  </svg>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-dim">
        Every finished session earns XP and counts toward your streak.
      </p>
    </PageShell>
  );
}
