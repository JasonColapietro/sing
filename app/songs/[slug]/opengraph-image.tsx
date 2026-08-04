import { ImageResponse } from "next/og";
import { midiToLabel } from "@/lib/audio/notes";
import { isProSong, songBySlug } from "@/components/songs/data";
import {
  computeDifficulty,
  lyricLines,
  songNoteRange,
  songTotalBeats,
} from "@/components/songs/lib";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// A per-slug alt would need generateImageMetadata; the singers cards set one
// static string for the whole route and this matches.
export const alt = "Song facts and melody contour";

const W = 1032;
const CONTOUR_H = 150;
const BAR_H = 16;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const song = songBySlug(slug);
  if (!song) return new Response("Not found", { status: 404 });

  const pro = isProSong(song.id);
  const [lo, hi] = songNoteRange(song);
  const span = Math.max(1, hi - lo);
  const totalBeats = Math.max(1, songTotalBeats(song));
  const { label: difficulty, rangeSemis } = computeDifficulty(song);
  const firstLine = lyricLines(song.notes)[0]?.text ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "68px 84px",
          backgroundColor: "#f7f0e7",
          backgroundImage:
            "radial-gradient(700px 300px at 50% -10%, rgba(197,150,66,0.16), rgba(197,150,66,0))",
          color: "#20201d",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: 8,
            fontWeight: 700,
            color: pro ? "#9d3f33" : "#c59642",
          }}
        >
          {pro ? "PRO SONGBOOK" : "PUBLIC DOMAIN · FREE TO SING"}
        </div>

        <div
          style={{ display: "flex", marginTop: 16, fontSize: 68, fontWeight: 700 }}
        >
          {song.title}
        </div>

        <div
          style={{ display: "flex", marginTop: 10, fontSize: 27, color: "#5c564d" }}
        >
          {`${song.genre} · ${song.era} · ${song.bpm} bpm · ${song.beatsPerBar}/bar · ${difficulty}`}
        </div>

        {firstLine ? (
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 30,
              color: "#20201d",
            }}
          >
            {`“${firstLine}”`}
          </div>
        ) : null}

        {/* Melody contour: one bar per note, height = pitch, width = duration. */}
        <div
          style={{
            display: "flex",
            position: "relative",
            marginTop: 30,
            width: W,
            height: CONTOUR_H,
          }}
        >
          {song.notes.map((n, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: (n.startBeat / totalBeats) * W,
                top: ((hi - n.midi) / span) * (CONTOUR_H - BAR_H),
                width: Math.max(6, (n.durBeats / totalBeats) * W - 4),
                height: BAR_H,
                backgroundColor: pro ? "#9d3f33" : "#c59642",
                borderRadius: 4,
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 26,
            alignItems: "baseline",
            justifyContent: "space-between",
            width: W,
          }}
        >
          <div style={{ display: "flex", fontSize: 58, fontWeight: 700 }}>
            {`${midiToLabel(lo)} — ${midiToLabel(hi)}`}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#6b6455" }}>
            {`${rangeSemis} semitones · ${song.notes.length} notes · suede sing`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
