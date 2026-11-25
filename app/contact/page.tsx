import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageShell } from "@/components/ui";
import { DEFAULT_OG_IMAGE, OG_LOCALE, OG_SITE_NAME } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { routeKeywords } from "@/lib/keywords";
import { webPageJsonLd } from "@/lib/page-jsonld";

const TITLE = "Singer Range Correction Requests";
const DESCRIPTION =
  "Send a singer range correction for a Suede Sing vocal range page: the recording, a timestamp and a source. We check the evidence before any change.";

export const metadata: Metadata = {
  keywords: routeKeywords("/contact"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/contact`,
    siteName: OG_SITE_NAME,
    locale: OG_LOCALE,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ContactPage() {
  return (
    <PageShell
      kicker="Corrections"
      title="Suggest a singer range correction"
      subtitle="Found a singer vocal range that does not match the recording? Send the recording, the timestamp and a source. We check the evidence and update the page when it holds up."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageJsonLd({ path: "/contact", name: TITLE, description: DESCRIPTION, type: "ContactPage" }),
          ),
        }}
      />
      <Card className="max-w-3xl">
        <h2 className="text-xl">How do I send a source-backed correction?</h2>
        <p className="mt-3 text-mut">
          Email{" "}
          <a
            href="mailto:support@suedeai.ai"
            className="text-violet-ink underline underline-offset-4"
          >
            support@suedeai.ai
          </a>{" "}
          with the details below. We check the evidence and update the page when it holds up.
        </p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-mut">
          <li>
            <span className="text-ink">Artist or page URL:</span> the singer
            profile the claim appears on.
          </li>
          <li>
            <span className="text-ink">Disputed claim:</span> the note, range or
            label as the page shows it.
          </li>
          <li>
            <span className="text-ink">Recording or version:</span> the studio
            track, live performance or arrangement, and its key.
          </li>
          <li>
            <span className="text-ink">Timestamp:</span> where in that recording
            the note can be heard.
          </li>
          <li>
            <span className="text-ink">Supporting URL:</span> a source another
            reader can open and check.
          </li>
          <li>
            <span className="text-ink">Suggested correction:</span> the wording or
            figure you think the page should carry.
          </li>
        </ul>
        <p className="mt-5 text-sm text-mut">
          Before you send one, read{" "}
          <Link
            href="/singers/methodology"
            className="text-violet-ink underline underline-offset-4"
          >
            how singer vocal ranges are sourced and reported
          </Link>
          .
        </p>
      </Card>

      <Card className="mt-6 max-w-3xl">
        <h2 className="text-xl">What makes a correction easy to check?</h2>
        <p className="mt-3 text-mut">
          A recording and a timestamp let anyone hear the note for themselves.
          Range charts that repeat the same unsourced figure are not independent
          evidence, however many of them agree.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-mut">
          <li>
            Write notes in{" "}
            <Link
              href="/atlas/notes-octaves-and-the-keyboard"
              prefetch={false}
              className="text-violet-ink underline underline-offset-4"
            >
              scientific pitch notation
            </Link>
            , where C4 is middle C, so an octave label cannot be misread.
          </li>
          <li>
            Say what kind of note it is: a sustained full-voice note, falsetto,
            whistle register or a brief effect. These are reported differently.
          </li>
          <li>
            Prefer direct statements, credited scores, documented performances,
            specialist analysis and reputable interviews. A score documents one
            arrangement, not a singer&apos;s whole career.
          </li>
        </ul>
      </Card>

      <Card className="mt-6 max-w-3xl">
        <h2 className="text-xl">What happens after you send it?</h2>
        <p className="mt-3 text-mut">
          The evidence is checked against the page. A page changes when the
          evidence supports the change. When the evidence is reviewed and still
          does not settle the claim, the record can be marked disputed instead
          of swapping one number for another. Source-reviewed records name the
          dataset editor, the review date, the sources and a confidence level,
          so you can see what the page now rests on.
        </p>
        <p className="mt-3 text-mut">
          Each singer profile shows its review status. The{" "}
          <Link href="/singers" prefetch={false} className="text-violet-ink underline underline-offset-4">
            singer vocal range chart
          </Link>{" "}
          lists every profile, and the{" "}
          <Link href="/singers/records" prefetch={false} className="text-violet-ink underline underline-offset-4">
            range records page
          </Link>{" "}
          ranks them against each other.
        </p>
      </Card>

      <Card className="mt-6 max-w-3xl">
        <h2 className="text-xl">Need help with the app or Suede Pro?</h2>
        <p className="mt-3 text-mut">
          The same address handles a lost Pro key, a payment that went through
          but did not unlock Pro, or a subscription question. Include the
          checkout reference if the page showed you one. For questions about
          practice itself, the{" "}
          <Link href="/learn" className="text-violet-ink underline underline-offset-4">
            learn to sing hub
          </Link>{" "}
          and the{" "}
          <Link href="/guides" className="text-violet-ink underline underline-offset-4">
            singing guides
          </Link>{" "}
          answer the common ones.
        </p>
      </Card>
    </PageShell>
  );
}
