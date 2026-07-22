"use client";

import { Pill } from "@/components/ui";
import type { LogResult } from "@/lib/progress";

/** Post-session reward note: XP gained plus any freshly unlocked achievements. */
export function RewardNote({ result }: { result: LogResult }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Pill tone="ok">+{result.xpGained} XP</Pill>
      {result.newAchievements.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-3 rounded-xl border border-amber/40 bg-panel2 px-4 py-2.5 text-left text-sm"
        >
          <span aria-hidden="true" className="text-lg">
            {a.icon}
          </span>
          <div>
            <div className="text-amber-ink">{a.title}</div>
            <div className="text-xs text-mut">{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
