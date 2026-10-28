import Link from "next/link";

/** The site's one referral line, 25 words; every reading surface prints it beside a link to the full rules. */
export const SAFETY_LINE =
  "Pain, lasting hoarseness, sudden loss of range or blood belongs with a doctor who can examine the vocal folds, such as an ENT or laryngologist.";

/** Where the full passage lives. */
export const SAFETY_HREF = "/learn/voice#safety";

export function SafetyLine({ className }: { className?: string }) {
  return (
    <p
      className={["max-w-3xl text-xs leading-relaxed text-dim", className].filter(Boolean).join(" ")}
      data-voice-safety
    >
      {SAFETY_LINE}{" "}
      <Link href={SAFETY_HREF} prefetch={false} className="underline hover:text-ink">
        The stop rules →
      </Link>
    </p>
  );
}

/** The full boundary, stated once on /learn/voice at #safety. */
export function VoiceSafetyNote() {
  return (
    <p id="safety" className="max-w-3xl scroll-mt-20 text-xs leading-relaxed text-dim" data-voice-safety>
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
