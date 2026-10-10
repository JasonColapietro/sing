import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageShell } from "@/components/ui";
import { DEFAULT_OG_IMAGE, OG_LOCALE, OG_SITE_NAME } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { routeKeywords } from "@/lib/keywords";

const TITLE = "Singer Range Correction Requests";
const DESCRIPTION =
  "Send a singer range correction for a Suede Sing vocal range page: the recording, a timestamp and a source. Editors review the evidence before any change.";

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
      subtitle="Found a singer vocal range that does not match the recording? Email the recording, the timestamp and a source, and the editors will review the evidence."
    >
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
          with the following details. We assess the evidence and update the page when the record
          warrants it; an email does not guarantee a requested wording will be adopted.
        </p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-mut">
          <li>Artist or page URL</li>
          <li>Disputed claim</li>
          <li>Recording or version</li>
          <li>Timestamp</li>
          <li>Supporting URL</li>
          <li>Suggested correction</li>
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
    </PageShell>
  );
}
