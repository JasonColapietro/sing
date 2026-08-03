import { StudioClient } from "@/components/studio/studio-client";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Pitch Training for Singers — Real-Time Pitch Feedback",
  description:
    "Sing into your mic and watch your pitch trace against target notes, live. Free browser pitch training — scales, slides and hold-the-note drills with instant scoring, no signup.",
  alternates: { canonical: `${SITE_URL}/studio` },
};

export default function StudioPage() {
  return <StudioClient />;
}
