/** Tracks failures for the current playback attempt on the shared audio element. */
export function createPlaybackRecovery(onFailure: (takeId: string) => void) {
  let generation = 0;
  let unwatch = () => {};
  const clear = () => {
    generation++;
    unwatch();
    unwatch = () => {};
  };
  return {
    clear,
    pause(audio: HTMLAudioElement | null) { clear(); audio?.pause(); },
    play(audio: HTMLAudioElement, takeId: string) {
      clear();
      const request = generation;
      const fail = () => {
        if (request !== generation) return;
        clear();
        audio.pause();
        onFailure(takeId);
      };
      // A load clears error. Ignore an old queued event after a source switch.
      const error = () => { if (audio.error) fail(); };
      const stopped = () => {
        if (request === generation && (audio.paused || audio.ended)) clear();
      };
      audio.addEventListener("error", error);
      audio.addEventListener("pause", stopped);
      audio.addEventListener("ended", stopped);
      unwatch = () => {
        audio.removeEventListener("error", error);
        audio.removeEventListener("pause", stopped);
        audio.removeEventListener("ended", stopped);
      };
      try { void audio.play().catch(fail); } catch { fail(); }
    },
  };
}
