import { canChooseOutput, getOutputDeviceId } from "./devices";

let _ctx: AudioContext | null = null;
let _appliedSinkId: string | null = null;
let _output: AudioNode | null = null;

/**
 * An AudioContext that can be pointed at a chosen pair of speakers.
 *
 * `setSinkId` is Chromium-only, so this is strictly an upgrade: everywhere else
 * playback follows the operating system's default output exactly as it always
 * has, and the picker hides the control rather than offering one that does
 * nothing.
 */
interface SinkCapableContext extends AudioContext {
  setSinkId?: (id: string) => Promise<void>;
}

/**
 * Shared AudioContext. Call only on the client, ideally from a user gesture
 * (click) so the browser allows it to start.
 */
export function getAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("getAudioContext is client-only");
  }
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") void _ctx.resume();
  // Re-applied on every access rather than once at construction: the context is
  // a module singleton created on the first tone the app ever plays, which is
  // usually long before the singer opens the picker and chooses an output.
  // Comparing against the last id applied keeps this to one call per change.
  const wanted = getOutputDeviceId();
  if (canChooseOutput() && wanted !== _appliedSinkId) {
    _appliedSinkId = wanted;
    void (_ctx as SinkCapableContext).setSinkId?.(wanted).catch(() => {
      // The output vanished between the picker and the tone. Leaving the sink
      // where it is keeps audio playing out of *something*, which beats a
      // silent room; the picker re-lists devices on `devicechange` anyway.
      _appliedSinkId = null;
    });
  }
  return _ctx;
}

/**
 * Where every sound the app makes should connect, instead of ctx.destination.
 *
 * A gentle limiter with make-up gain. Phone speakers roll off below a few
 * hundred hertz, which is exactly where most reference notes sit, so the notes
 * were near silent on a phone while the high count-in clicks came through.
 * Brighter tones (see synth.ts) fix most of that; this lets the whole mix sit
 * louder without clipping when a guide, a drone and a click overlap.
 */
export function getOutput(): AudioNode {
  const ctx = getAudioContext();
  if (_output && _output.context === ctx) return _output;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 8;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  const makeup = ctx.createGain();
  makeup.gain.value = 1.8;
  limiter.connect(makeup).connect(ctx.destination);
  _output = limiter;
  return limiter;
}

/** Current time of the shared AudioContext, for scheduling. */
export function audioNow(): number {
  return getAudioContext().currentTime;
}
