/**
 * The boundary every voice-course page states. GuitarHub printed its own on
 * each lesson; this is the same substance in sing's wording, kept in one place.
 */
export function VoiceSafetyNote() {
  return (
    <p className="max-w-3xl text-xs leading-relaxed text-dim" data-voice-safety>
      Work in a comfortable range and volume. Stop for pain, burning, sudden
      hoarseness, loss of range or a change in your speaking voice. These
      lessons teach practice decisions and stop rules; they don&apos;t diagnose
      or treat anything, and pitch readings do not assess vocal health.
      Pain, hoarseness that will not clear, a sudden or lasting loss of range,
      or any blood belongs with a doctor who can examine the vocal folds, such
      as an ENT or laryngologist, not another attempt.
    </p>
  );
}
