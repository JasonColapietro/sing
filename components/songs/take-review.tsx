"use client";

import { useState } from "react";
import { Button, Card, SectionLabel } from "@/components/ui";
import { openTakesStore } from "@/components/recorder/db";
import { songTakeName, type TakeState } from "./take";

type SaveState = "idle" | "saving" | "saved" | "failed";

/**
 * The singer's own take from the run just finished: play it back, keep it in
 * the Recordings room, or leave it. Nothing is stored unless they save, and a
 * saved take stays on this device like every other recording.
 */
export function TakeReview({ take: state }: { take: TakeState }) {
  const take = typeof state === "object" ? state : null;
  const [save, setSave] = useState<SaveState>("idle");

  async function keep() {
    if (!take || save === "saving" || save === "saved") return;
    setSave("saving");
    try {
      const store = await openTakesStore();
      await store.put({
        id: crypto.randomUUID(),
        name: songTakeName(take.songTitle, new Date(take.createdAt)),
        createdAt: take.createdAt,
        durationSec: take.durationSec,
        mimeType: take.mimeType,
        blob: take.blob,
        starred: false,
      });
      setSave(store.persistent ? "saved" : "failed");
    } catch {
      setSave("failed");
    }
  }

  return (
    <Card>
      <SectionLabel>Your take</SectionLabel>
      {!take ? (
        <p className="mt-3 text-sm text-mut" role="status">
          {state === "recording" ? "Getting your take ready…" : "No take was recorded this time."}
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-mut">
            Just your voice, as the microphone heard it — {take.durationSec.toFixed(0)} s.
          </p>
          {/* Native controls: keyboard, scrubbing and screen-reader support come free. */}
          <audio controls src={take.url} className="mt-3 w-full" aria-label={`Your take of ${take.songTitle}`} />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" onClick={keep} disabled={save === "saving" || save === "saved"}>
              {save === "saved" ? "Saved to Recordings" : save === "saving" ? "Saving…" : "Save to Recordings"}
            </Button>
            {save === "saved" && (
              <a href="/recorder" className="text-sm text-violet-ink underline underline-offset-2">
                Open Recordings
              </a>
            )}
            {save === "failed" && (
              <span className="text-sm text-rec" role="alert">
                This browser can&rsquo;t keep recordings (private mode?). Play it here instead.
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
