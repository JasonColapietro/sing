import { ProClient } from "@/components/pro/pro-client";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Suede Pro — The Vocal Coach on Top of the Free Studio",
  description:
    "Suede Pro adds an adaptive coach, per-note analytics, take analysis, pro warmup packs, the full songbook, and two books with PDFs — while the browser studio stays free.",
  alternates: { canonical: `${SITE_URL}/pro` },
};

export default function ProPage() {
  return <ProClient />;
}
