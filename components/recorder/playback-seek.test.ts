import { describe, expect, it, vi } from "vitest";
import { createPlaybackSeek } from "./playback-seek";

function media() {
  return Object.assign(new EventTarget(), { readyState: 0, currentTime: 0 }) as HTMLAudioElement;
}

describe("deferred recorder seeks", () => {
  it("discards metadata callbacks when their load is cleared", () => {
    const audio = media();
    const seek = createPlaybackSeek();
    const publish = vi.fn();
    seek.seek(audio, 10, publish);
    // Every replacement/deletion/unmount invalidates the old load, even when
    // the next blob belongs to the same take ID.
    seek.clear();
    audio.dispatchEvent(new Event("loadedmetadata"));
    expect(audio.currentTime).toBe(0);
    expect(publish).not.toHaveBeenCalled();
  });

  it("only applies the newest seek requested before metadata arrives", () => {
    const audio = media();
    const seek = createPlaybackSeek();
    const old = vi.fn();
    const latest = vi.fn();
    seek.seek(audio, 10, old);
    seek.seek(audio, 4, latest);
    audio.dispatchEvent(new Event("loadedmetadata"));
    expect(old).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledExactlyOnceWith(4);
    expect(audio.currentTime).toBe(4);
  });

  it("publishes the actual browser position after a successful immediate seek", () => {
    const audio = media();
    Object.defineProperty(audio, "readyState", { value: 1 });
    const publish = vi.fn();
    createPlaybackSeek().seek(audio, 8, publish);
    expect(publish).toHaveBeenCalledExactlyOnceWith(8);
  });
});
