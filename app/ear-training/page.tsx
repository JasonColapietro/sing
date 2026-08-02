import EarTrainingClient from "@/components/ear/ear-training-client";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Ear Training for Singers — Pitch and Interval Games",
  description:
    "Four short ear training games for singers: match pitch, name intervals, and sing melodies back. Ten rounds each, free in the browser.",
  alternates: { canonical: `${SITE_URL}/ear-training` },
};

export default function EarTrainingPage() {
  return <EarTrainingClient />;
}
