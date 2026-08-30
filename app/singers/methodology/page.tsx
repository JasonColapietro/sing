import type { Metadata } from "next";
import Link from "next/link";
import { Card, LinkButton, PageShell } from "@/components/ui";
import { SINGER_RANGE_DISCLAIMER } from "@/lib/singer-editorial";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

const TITLE = "Singer Range Methodology and Evidence Standards";
const DESCRIPTION =
  "How Suede Sing describes reported singer ranges, evaluates evidence, and accepts corrections.";

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
        <LinkButton href="/singers" variant="outline" size="md">
          ← All singers
        </LinkButton>
      }
    >
      <div className="space-y-6">
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
