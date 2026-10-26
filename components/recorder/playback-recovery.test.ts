import { describe, expect, it, vi } from "vitest";
import { createPlaybackRecovery } from "./playback-recovery";

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function media() {
  return Object.assign(new EventTarget(), {
    error: null as { code: number } | null,
    paused: false,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
  });
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

describe("recorder playback recovery", () => {
  it("reports a current play rejection, pauses failed playback and permits retry", async () => {
    const audio = media();
    const failed = vi.fn();
    const playback = createPlaybackRecovery(failed);
    audio.play.mockRejectedValueOnce(new Error("NotSupportedError"));
    playback.play(audio as unknown as HTMLAudioElement, "one");
    await settle();
    expect(failed).toHaveBeenCalledExactlyOnceWith("one");
    expect(audio.pause).toHaveBeenCalledOnce();
    playback.play(audio as unknown as HTMLAudioElement, "one");
    await settle();
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(failed).toHaveBeenCalledOnce();
  });

  it("reports late media decode errors after play has already resolved", async () => {
    const audio = media();
    const failed = vi.fn();
    createPlaybackRecovery(failed).play(audio as unknown as HTMLAudioElement, "one");
    await settle();
    audio.error = { code: 3 };
    audio.dispatchEvent(new Event("error"));
    audio.dispatchEvent(new Event("error"));
    expect(failed).toHaveBeenCalledExactlyOnceWith("one");
    expect(audio.pause).toHaveBeenCalledOnce();
  });

  it.each(["pause", "switch", "exit"])("ignores obsolete rejection and error after %s", async (action) => {
    const audio = media();
    const first = deferred();
    audio.play.mockReturnValueOnce(first.promise);
    const failed = vi.fn();
    const playback = createPlaybackRecovery(failed);
    playback.play(audio as unknown as HTMLAudioElement, "one");
    if (action === "pause") playback.pause(audio as unknown as HTMLAudioElement);
    else playback.clear();
    if (action === "switch") playback.play(audio as unknown as HTMLAudioElement, "two");
    // A new source clears audio.error; queued events from the old source
    // must not poison a new attempt whose current state is playing.
    audio.dispatchEvent(new Event("error"));
    if (action === "switch") {
      audio.dispatchEvent(new Event("pause"));
      audio.dispatchEvent(new Event("ended"));
    }
    first.reject(new Error("AbortError"));
    await settle();
    expect(failed).not.toHaveBeenCalled();
    if (action === "switch") {
      audio.error = { code: 4 };
      audio.dispatchEvent(new Event("error"));
      expect(failed).toHaveBeenCalledExactlyOnceWith("two");
    }
  });
});
