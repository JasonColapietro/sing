import { ProgressClient } from "@/components/progress/progress-client";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Singing Progress Tracker — Range, Accuracy and Streaks",
  description:
    "Every practice session logged: XP, streaks, achievements, range history and per-exercise scores, stored on your device. Watch your singing improve week over week.",
  alternates: { canonical: `${SITE_URL}/progress` },
};

export default function ProgressPage() {
  return <ProgressClient />;
}
