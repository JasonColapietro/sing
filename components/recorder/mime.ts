/**
 * The first container this browser's MediaRecorder can write, in order of
 * preference. Shared by the recorder and the songs room so both save takes the
 * same way. Undefined where MediaRecorder is missing entirely.
 */
export function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m));
}
