import Link from "next/link";
import RecorderPageClient from "@/components/recorder/recorder-page";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ToolGuide } from "@/components/guide";
import { RECORDER_GUIDE } from "@/lib/guides";
import { RoomRailBand } from "@/components/discover/room-rail";

export const metadata = withCanonicalOpenGraph({
  title: "Voice Recorder for Singing Practice",
  description:
    "Cut a take, listen back, keep the good ones. A practice voice recorder for singers that stays on your device — nothing uploads.",
  alternates: { canonical: `${SITE_URL}/recorder` },
});

export default function RecorderPage() {
  return (
    <>
      <RecorderPageClient />
      <section className="mx-auto max-w-4xl px-4 py-8" aria-label="What this room is">
        <p className="rounded-2xl border border-line bg-panel p-5 leading-relaxed text-mut">
          This is the take recorder: one room with one job, which is cutting a
          take, comparing two of them and keeping the ones worth keeping. It is
          not the console.{" "}
          <Link href="/tools" className="text-violet-ink underline underline-offset-4">
            The practice tools tab
          </Link>{" "}
          holds the metronome, the keyboard and the drone, which are the things
          you run alongside a take rather than instead of one.
        </p>
      </section>
      <RoomRailBand current="/recorder" />
      <ToolGuide guide={RECORDER_GUIDE} />
    </>
  );
}
