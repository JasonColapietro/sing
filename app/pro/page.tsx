import { ProClient } from "@/components/pro/pro-client";

export const metadata = {
  title: "Pro",
  description:
    "Suede Pro adds an adaptive coach, per-note analytics, take analysis, pro warmup packs, the full songbook, and two books with PDFs — while the browser studio stays free.",
};

export default function ProPage() {
  return <ProClient />;
}
