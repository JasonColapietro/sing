import { SongsClient } from "@/components/songs/songs-client";
import { SITE_URL } from "@/lib/site";

export const metadata = {
  title: "Karaoke Practice — Sing Known Melodies with Pitch Feedback",
  description:
    "Karaoke-style singing practice: hear a phrase from a well-known melody, sing it back, and watch your pitch accuracy in real time. Free in the browser.",
  alternates: { canonical: `${SITE_URL}/songs` },
};

export default function SongsPage() {
  return <SongsClient />;
}
