import {
  clearInputDevice,
  getInputDeviceId,
  getMonitoring,
  type Monitoring,
} from "./devices";

/**
 * Shared microphone acquisition for every listening surface.
 *
 * `usePitch` owned this and `useAnalyser` needed the same behaviour. Two copies
 * of a permission-error table drift, and the half that drifts is always the one
 * a singer hits on their first visit.
 */

/**
 * Turns a getUserMedia rejection into something the singer can act on.
 *
 * Every practice room shares this one code path, so a single generic message
 * here was telling a person with no microphone — or one already held by a call
 * app — to go change a browser permission that was never the problem. That is
 * the exact moment a first session ends, so each cause gets the fix that
 * actually applies to it.
 *
 * Names come from the MediaDevices spec; browsers disagree on a few, hence the
 * aliases (Firefox still emits NotFoundError as DevicesNotFoundError, and
 * Safari reports a busy device as AbortError).
 */
function micErrorMessage(cause: unknown): string {
  const name =
    typeof cause === "object" && cause !== null && "name" in cause
      ? String((cause as { name: unknown }).name)
      : "";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "Microphone access is blocked. Allow the mic in your browser's site settings, then try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No microphone found. Plug one in — or if you're on a laptop, check it isn't disabled in your system sound settings.";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "Your microphone is busy. Close anything else using it — a call, a recorder, another tab — and try again.";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "That microphone couldn't be opened for recording. Pick a different input, or check your system sound settings.";
    default:
      return "The microphone didn't start. Check it's connected and not in use by another app, then try again.";
  }
}

function isOverconstrained(cause: unknown): boolean {
  const name =
    typeof cause === "object" && cause !== null && "name" in cause
      ? String((cause as { name: unknown }).name)
      : "";
  return (
    name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError"
  );
}

/**
 * The audio constraints for one attempt.
 *
 * Noise suppression and automatic gain are always off: they are tuned to make
 * speech intelligible on a call, and each one rewrites exactly the signal being
 * measured here.
 *
 * Echo cancellation is the one that moves, because it is the only defence
 * against the app scoring its own output. Every room plays reference tones
 * while the mic is open, so a singer on laptop speakers is recorded alongside a
 * signal cleaner and steadier than any voice — the detector locks onto the tone
 * and reports a flawless hold for someone standing silently in front of the
 * screen. On headphones that cannot happen, so the measurement keeps the
 * untouched signal. On speakers the singer has told us the room is open, and a
 * slightly processed voice beats a score that is really measuring the app.
 */
function constraintsFor(
  deviceId: string,
  monitoring: Monitoring,
): MediaTrackConstraints {
  return {
    echoCancellation: monitoring === "speakers",
    noiseSuppression: false,
    autoGainControl: false,
    // `exact` rather than a bare id on purpose: a plain deviceId is only a
    // hint, so an unplugged interface silently falls back to the lid mic and
    // the singer is measured on the device they explicitly rejected. Exact
    // fails instead, and the caller below turns that failure into a clean
    // fallback plus a forgotten preference.
    ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
  };
}

/**
 * Opens the microphone with the constraints every analysis surface needs, or
 * returns an actionable message.
 *
 * Options default to the singer's stored choices, so a room that just calls
 * `openMic()` still honours the device they picked in some other room.
 */
export async function openMic(
  opts: { deviceId?: string; monitoring?: Monitoring } = {},
): Promise<
  { stream: MediaStream; error: null } | { stream: null; error: string }
> {
  // No getUserMedia at all: an insecure origin (plain http beyond localhost)
  // or a browser too old for it. Telling this person to check a permission
  // sends them looking for a setting that isn't there.
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      stream: null,
      error:
        window.isSecureContext === false
          ? "Your browser only allows microphone access over a secure connection. Open this page on https and try again."
          : "This browser can't reach a microphone. Chrome, Safari, Edge and Firefox all work — the practice rooms need one of those.",
    };
  }

  const deviceId = opts.deviceId ?? getInputDeviceId();
  const monitoring = opts.monitoring ?? getMonitoring();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: constraintsFor(deviceId, monitoring),
    });
    return { stream, error: null };
  } catch (cause) {
    // The chosen microphone is gone — unplugged, or an id Safari rotated
    // between sessions. Falling back to the system default beats handing
    // someone a dead room and an error about constraints they have never heard
    // of, and forgetting the preference stops it recurring on every press.
    if (deviceId && isOverconstrained(cause)) {
      clearInputDevice();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: constraintsFor("", monitoring),
        });
        return { stream, error: null };
      } catch (fallbackCause) {
        return { stream: null, error: micErrorMessage(fallbackCause) };
      }
    }
    return { stream: null, error: micErrorMessage(cause) };
  }
}
