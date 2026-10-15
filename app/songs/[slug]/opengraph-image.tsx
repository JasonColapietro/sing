import { ImageResponse } from "next/og";
import { songBySlug } from "@/components/songs/data";
import { songNoteRange, songTotalBeats } from "@/components/songs/lib";
import { songCardText, songCardVersion } from "@/lib/og-cards";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// One static alt for the whole route, as the singer cards do.
export const alt = "Song facts and melody contour";

const W = 1032;
const CONTOUR_H = 150;
const BAR_H = 16;

/**
 * One card per song, at a URL versioned by what it draws
 * (/songs/<slug>/opengraph-image/<version>). Next's own ?hash only follows
 * this file's source, so a corrected era or melody would otherwise ship at the
 * URL share scrapers cached the old picture under (see lib/og-cards.ts).
 */
export function generateImageMetadata({ params }: { params?: { slug?: string } }) {
  // As on the singer cards: `next build` asks once with no slug, and an
  // unknown slug has no card, so both get none (and a 404 at the URL).
  const song = params?.slug ? songBySlug(params.slug) : undefined;
  return song ? [{ id: songCardVersion(song), alt, size, contentType }] : [];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const song = songBySlug(slug);
  if (!song) return new Response("Not found", { status: 404 });

  const text = songCardText(song);
  const pro = text.pro;
  const [lo, hi] = songNoteRange(song);
  const span = Math.max(1, hi - lo);
  const totalBeats = Math.max(1, songTotalBeats(song));
  const firstLine = text.firstLine;

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
          {text.kicker}
        </div>

        {/*
          The title steps down in size so a long one ("Amazing Grace (Opening
          Lines, Verses 1 & 2)") stays on one line: at a fixed 68px it wrapped
          and the second line was drawn over the facts line below. The
          rendered face measures about 0.49em a character, so 43 characters
          at 46px fit inside W. A set width and line height keep any wrap that
          does happen in flow.
        */}
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: song.title.length > 34 ? 46 : song.title.length > 28 ? 56 : 68,
            lineHeight: 1.1,
            fontWeight: 700,
            width: W,
          }}
        >
          {text.title}
        </div>

        <div
          style={{ display: "flex", marginTop: 10, fontSize: 27, color: "#5c564d" }}
        >
          {text.facts}
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
            {text.notes}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#6b6455" }}>
            {text.footer}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
