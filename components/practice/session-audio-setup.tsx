"use client";

import { AudioSetup } from "@/components/audio/audio-setup";

/**
 * The device picker for a mic gate on the dark session surface. AudioSetup is
 * drawn in the site's paper tokens, so it sits on a paper panel here, as the
 * results screen's Pro and sustain notes do, rather than a dark fork of it.
 */
export function SessionAudioSetup() {
  return (
    <div className="rounded-2xl bg-panel text-ink">
      <AudioSetup />
    </div>
  );
}
