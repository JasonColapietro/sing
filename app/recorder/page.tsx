import RecorderPageClient from "@/components/recorder/recorder-page";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Voice Recorder for Singing Practice",
  description:
    "Cut a take, listen back, keep the good ones. A practice voice recorder for singers that stays on your device — nothing uploads.",
  alternates: { canonical: `${SITE_URL}/recorder` },
};

export default function RecorderPage() {
  return <RecorderPageClient />;
}
