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
      return "That microphone couldn't be opened for recording. Try picking a different input device in your system sound settings.";
    default:
      return "The microphone didn't start. Check it's connected and not in use by another app, then try again.";
  }
}

/**
 * Opens the microphone with the constraints every analysis surface needs, or
 * returns an actionable message.
 *
 * Echo cancellation, noise suppression and automatic gain are all off: they are
 * tuned to make speech intelligible on a call, and each one rewrites exactly
 * the signal being measured here.
 */
export async function openMic(): Promise<
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

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    return { stream, error: null };
  } catch (cause) {
    return { stream: null, error: micErrorMessage(cause) };
  }
}
