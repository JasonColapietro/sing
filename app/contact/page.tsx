import type { Metadata } from "next";
import { Card, PageShell } from "@/components/ui";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

const TITLE = "Suggest a Singer Range Correction";
const DESCRIPTION =
  "Send source-backed corrections for a Suede Sing singer-range page to the editorial team.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: `${SITE_URL}/contact`,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function ContactPage() {
  return (
    <PageShell
      kicker="Corrections"
      title="Suggest a correction"
      subtitle="Help us make the singer-range reference clearer and better sourced."
    >
      <Card className="max-w-3xl">
        <h2 className="text-xl">Send a source-backed correction</h2>
        <p className="mt-3 text-mut">
          Email{" "}
          <a
            href="mailto:support@suedeai.ai"
            className="text-amber-ink underline underline-offset-4"
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
      </Card>
    </PageShell>
  );
}
