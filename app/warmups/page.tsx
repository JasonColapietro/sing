import { WarmupsClient } from "@/components/warmups/warmups-client";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { WARMUPS_GUIDE } from "@/lib/guides";

export const metadata = {
  title: "Vocal Warmups — Guided Singing Warm-Up Exercises",
  description:
    "Guided vocal warmups with real-time pitch feedback: listen to a short melody, sing it back, and climb by semitone. Free in the browser — no install.",
  alternates: { canonical: `${SITE_URL}/warmups` },
};

export default function WarmupsPage() {
  return (
    <>
      <WarmupsClient />
      <ToolGuide guide={WARMUPS_GUIDE} />
    </>
  );
}
