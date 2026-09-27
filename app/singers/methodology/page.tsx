import type { Metadata } from "next";
import Link from "next/link";
import { Card, LinkButton, PageShell } from "@/components/ui";
import { SINGER_RANGE_DISCLAIMER } from "@/lib/singer-editorial";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

const TITLE = "Why Singer Vocal Ranges Differ: Sources and Methodology";
const DESCRIPTION =
  "Why vocal range websites disagree, how to compare song scores and performance claims, and what reported notes can tell you. Read sources and test your own range.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/singers/methodology` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/singers/methodology`,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function SingerMethodologyPage() {
  return (
    <PageShell
      kicker="Editorial standards"
      title="How we handle singer-range evidence"
      subtitle="What the catalog reports, what individual sources can establish, and how to correct the record."
      actions={
        <>
          <LinkButton href="/range" size="md">Test my vocal range</LinkButton>
          <LinkButton href="/singers" variant="outline" size="md">← All singers</LinkButton>
        </>
      }
    >
      <div className="space-y-6">
        <Card>
          <h2 className="text-xl">Why do vocal range websites disagree?</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Two range charts may be answering different questions. One may list
            written notes in selected songs; another may include isolated notes
            from live performances across a career. Neither number alone establishes
            a comfortable range or definitive voice type. Check what was counted
            before choosing the larger number.
          </p>
          <ol className="mt-5 max-w-3xl list-decimal space-y-4 pl-5 text-mut">
            <li><strong className="text-ink">Match the version.</strong>{" "}
              Are both sources discussing the same recording, live performance,
              arrangement, and key? One score is not a record of everything its
              performer has sung.
            </li>
            <li><strong className="text-ink">Check the note convention.</strong>{" "}
              Confirm the octave numbering before comparing endpoints. A note label
              without its convention can make two claims look farther apart than they are.
            </li>
            <li><strong className="text-ink">Ask what was counted.</strong>{" "}
              Look for distinctions between sustained notes, brief effects, falsetto,
              and whistle register. Do not silently combine different definitions of range.
            </li>
            <li><strong className="text-ink">Follow the evidence.</strong>{" "}
              A recording and timestamp let another reader check a claim. Repeated
              charts are not independent verification if they repeat the same
              unsourced figure.
            </li>
          </ol>
          <p className="mt-5 max-w-3xl text-mut">
            See the{" "}
            <Link href="/singers/olivia-rodrigo#evidence" className="text-violet-ink underline underline-offset-4">
              Olivia Rodrigo source review
            </Link>: song-level evidence and disputed voice-type labels are described
            separately from the catalog&apos;s reported range.
          </p>
        </Card>
        <Card>
          <h2 className="text-xl">Scope of this index</h2>
          <p className="mt-3 max-w-3xl text-mut">{SINGER_RANGE_DISCLAIMER}</p>
        </Card>

        <Card>
          <h2 className="text-xl">Source hierarchy</h2>
          <p className="mt-3 max-w-3xl text-mut">
            We prefer direct statements, credited scores, documented performances, specialist
            analysis, and reputable interviews or profiles. A source is shown with the limited
            claim it supports, rather than being stretched into proof of a singer&apos;s whole career.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl">Song scores have limited scope</h2>
          <p className="mt-3 max-w-3xl text-mut">
            A licensed score can document the written compass of one arrangement. It cannot by
            itself establish a performer&apos;s physiological limits, voice type, comfortable range,
            or career-wide extremes.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl">Studio, live, and register distinctions</h2>
          <p className="mt-3 max-w-3xl text-mut">
            A note captured in a studio, heard in a live performance, sung in whistle register,
            produced in falsetto, or made with a microphone does not carry the same meaning as a
            sustained full-voice note. We identify those distinctions when the evidence does.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl">Disputes, confidence, and human review</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Reviewed records name a human dataset editor, a review date, sources, and a confidence
            level: limited, moderate, or high. A disputed record means the evidence
            was reviewed and does not support a settled catalog claim. Pending records have not
            received that individual review.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl">Reported range is not comfortable tessitura</h2>
          <p className="mt-3 max-w-3xl text-mut">
            A reported range may include isolated extremes at either end. Comfortable tessitura is
            the part of a voice a singer can use repeatedly, musically, and without strain; it is
            usually narrower and cannot be inferred from a headline range alone.
          </p>
        </Card>

        <Card>
          <h2 className="text-xl">Corrections</h2>
          <p className="mt-3 max-w-3xl text-mut">
            See a claim that needs correction? Please send the page, recording details, timestamp,
            supporting source, and your proposed wording through the{" "}
            <Link href="/contact" className="text-violet-ink underline underline-offset-4">
              correction workflow
            </Link>
            .
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
