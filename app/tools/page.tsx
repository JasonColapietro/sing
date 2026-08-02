import ToolsClient from "@/components/tools/tools-page";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Singing Practice Tools — Metronome, Keyboard, Vocal Drone",
  description:
    "The console modules every practice session leans on: a metronome, an on-screen keyboard, and a sustained drone for pitch matching. Free in the browser.",
  alternates: { canonical: `${SITE_URL}/tools` },
};

export default function ToolsPage() {
  return <ToolsClient />;
}
