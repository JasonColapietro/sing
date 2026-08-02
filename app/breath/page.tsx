import { BreathStudio } from "@/components/breath/breath-studio";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Breathing Exercises for Singers — Breath Support Training",
  description:
    "Build the air supply behind every long note: a mic-based sustain test plus guided breathing exercises for singers. Free in the browser.",
  alternates: { canonical: `${SITE_URL}/breath` },
};

export default function BreathPage() {
  return <BreathStudio />;
}
