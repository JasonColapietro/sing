/** Owns the one outstanding seek on the recorder's reusable audio element. */
export function createPlaybackSeek() {
  let generation = 0;
  let removeListener = () => {};
  const clear = () => {
    generation++;
    removeListener();
    removeListener = () => {};
  };
  return {
    // Call for every new load (including the same take), deletion, and exit.
    clear,
    seek(audio: HTMLAudioElement, target: number, onApplied?: (seconds: number) => void) {
      clear();
      const request = generation;
      const apply = () => {
        if (request !== generation) return;
        clear();
        try { audio.currentTime = target; } catch { return; }
        onApplied?.(audio.currentTime);
      };
      if (audio.readyState >= 1) apply();
      else {
        audio.addEventListener("loadedmetadata", apply, { once: true });
        removeListener = () => audio.removeEventListener("loadedmetadata", apply);
      }
    },
  };
}
