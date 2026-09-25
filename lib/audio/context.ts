import { canChooseOutput, getOutputDeviceId } from "./devices";
import { preloadPiano } from "./piano";
import { canUseTools, requireAccountToUse } from "@/lib/account-gate";

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
 * Resumes the context from any stopped state.
 *
 * Checking only for "suspended" missed iOS Safari, which reports
 * "interrupted" when the mic opens, the tab goes to the background, or a call
 * or notification takes the audio session. An interrupted context's clock
 * stops, so everything scheduled on it stalls: the song and warmup players
 * freeze waiting on currentTime and the analyzer reads silence.
 */
function wake(ctx: AudioContext): void {
  const state = ctx.state as AudioContextState | "interrupted";
  if (state !== "running" && state !== "closed") {
    void ctx.resume().catch(() => {
      // Needs a user gesture; the listeners in keepRunning try again on the
      // next tap.
    });
  }
}

/**
 * iOS will only resume audio inside a user gesture, and it can interrupt the
 * context at any moment after it started. So every tap, key press and return
 * to the tab gets a chance to bring it back, and a state change to a stopped
 * state tries straight away.
 */
function keepRunning(ctx: AudioContext): void {
  const retry = () => {
    if (_ctx === ctx && canUseTools()) wake(ctx);
  };
  for (const type of ["pointerdown", "touchend", "keydown"] as const) {
    document.addEventListener(type, retry, { capture: true, passive: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") retry();
  });
  ctx.addEventListener("statechange", () => {
    if (document.visibilityState === "visible") retry();
  });
}

/**
 * Shared AudioContext. Call only on the client, ideally from a user gesture
 * (click) so the browser allows it to start.
 */
export function getAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("getAudioContext is client-only");
  }
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new AudioContext();
    _output = null;
    _appliedSinkId = null;
    keepRunning(_ctx);
    preloadPiano(_ctx);
  }
  // Signed out: start the trip to sign-in and leave the context silent, rather
  // than throwing through whatever start handler called this.
  if (!requireAccountToUse()) return _ctx;
  wake(_ctx);
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
  limiter.threshold.value = -12;
  limiter.knee.value = 6;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;
  // Measured in an offline render: a single guide note comes out well over
  // twice the original tone's level, and far more in the band a phone speaker
  // plays. Overlapping notes plus a click would then peak near 2, so the last
  // stage is a tanh soft clip rather than hard clipping.
  // A WaveShaper clamps its input to [-1, 1], so the signal is halved going
  // in and the curve doubles it back: small signals pass at unity and
  // nothing leaves above tanh(2), about 0.96.
  const makeup = ctx.createGain();
  makeup.gain.value = 3 / 2;
  const soft = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    curve[i] = Math.tanh(2 * ((i / (curve.length - 1)) * 2 - 1));
  }
  soft.curve = curve;
  soft.oversample = "2x";
  limiter.connect(makeup).connect(soft).connect(ctx.destination);
  _output = limiter;
  return limiter;
}

/** Current time of the shared AudioContext, for scheduling. */
export function audioNow(): number {
  return getAudioContext().currentTime;
}
