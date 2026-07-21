"use client";

import { useState } from "react";
import { Button, Card, PageShell } from "@/components/ui";
import { SustainTest } from "./sustain-test";
import { BoxBreathing } from "./box-breathing";
import { FarinelliDrill } from "./farinelli-drill";

type TabId = "sustain" | "box" | "farinelli";

const TABS: { id: TabId; label: string; needsMic: boolean }[] = [
  { id: "sustain", label: "Sustain test", needsMic: true },
  { id: "box", label: "Box breathing", needsMic: false },
  { id: "farinelli", label: "Farinelli drill", needsMic: false },
];

export function BreathStudio() {
  const [tab, setTab] = useState<TabId>("sustain");

  return (
    <PageShell
      kicker="Breath training"
      title="Breath"
      subtitle="Build the air supply behind every long note — one mic-based test and two guided drills you can run anywhere."
    >
      <div
        role="tablist"
        aria-label="Breath trainers"
        className="mb-5 flex flex-wrap gap-2"
      >
        {TABS.map((t) => (
          <Button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            variant={tab === t.id ? "amber" : "outline"}
            size="sm"
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.needsMic && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-label="uses microphone"
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
              </svg>
            )}
          </Button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "sustain" && <SustainTest />}
        {tab === "box" && <BoxBreathing />}
        {tab === "farinelli" && <FarinelliDrill />}
      </div>

      <Card className="mt-6">
        <div className="flex items-start gap-4">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-cool)"
            strokeWidth="1.5"
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          >
            <path d="M12 3v7" />
            <path d="M12 10c0 4-2 6-5 7a4 4 0 0 1-4-4c0-3 4-3 9-3s9 0 9 3a4 4 0 0 1-4 4c-3-1-5-3-5-7Z" />
          </svg>
          <div>
            <h4 className="font-display text-lg">Why breath work</h4>
            <p className="mt-1 max-w-2xl text-sm text-mut">
              Steady airflow is what keeps a note even and a phrase alive to
              its last word. Training slow, measured exhales teaches your body
              to meter air out instead of spending it all at once, so
              sustained notes hold their level and phrase endings stay
              supported. A few minutes a day is plenty.
            </p>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
