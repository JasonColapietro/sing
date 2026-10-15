import { ImageResponse } from "next/og";
import { singerCardText, singerCardVersion } from "@/lib/og-cards";
import { singerBySlug } from "@/lib/singers";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Reported vocal range reference span on a keyboard, with evidence review status";

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

/**
 * One card per singer, at a URL versioned by what it draws
 * (/singers/<slug>/opengraph-image/<version>). Next's own ?hash only follows
 * this file's source, so a corrected range would otherwise ship at the URL
 * share scrapers cached the old picture under (see lib/og-cards.ts).
 */
export function generateImageMetadata({ params }: { params?: { slug?: string } }) {
  // `next build` also asks once with no slug, to prerender this route: the
  // [slug] segment's params come from its page, which this route is not part
  // of. Every item needs an id, so that answer is no cards, and each card is
  // drawn on its first request, as it was before it was versioned. An unknown
  // slug has no card either, so its URL is a 404.
  const s = params?.slug ? singerBySlug(params.slug) : undefined;
  return s ? [{ id: singerCardVersion(s), alt, size, contentType }] : [];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = singerBySlug(slug);
  if (!s) return new Response("Not found", { status: 404 });

  const text = singerCardText(s);
  const stripLow = Math.floor(s.lowMidi / 12) * 12;
  const stripHigh = Math.ceil(s.highMidi / 12) * 12;
  const n = stripHigh - stripLow + 1;
  const kbW = 1040;
  const cw = kbW / n;
  const bandLeft = (s.lowMidi - stripLow) * cw;
  const bandWidth = (s.highMidi - s.lowMidi + 1) * cw;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "#f7f0e7",
          backgroundImage:
            "radial-gradient(700px 300px at 50% -10%, rgba(197,150,66,0.14), rgba(197,150,66,0))",
          color: "#20201d",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            marginTop: 60,
            fontSize: 26,
            letterSpacing: 10,
            color: "#c59642",
            fontWeight: 600,
          }}
        >
          REPORTED VOCAL RANGE
        </div>
        <div style={{ marginTop: 18, fontSize: 64, fontWeight: 700 }}>
          {text.name}
        </div>
        <div style={{ marginTop: 10, fontSize: 92, fontWeight: 700 }}>
          {text.notes}
        </div>
        <div style={{ marginTop: 12, fontSize: 28, color: "#5c564d" }}>
          {text.span}
        </div>
        <div style={{ marginTop: 12, fontSize: 22, color: "#5c564d" }}>
          {text.status}
        </div>

        {/* Chromatic keyboard band */}
        <div
          style={{
            display: "flex",
            position: "relative",
            marginTop: 44,
            width: kbW,
            height: 110,
          }}
        >
          {Array.from({ length: n }, (_, i) => {
            const black = BLACK_PCS.has((stripLow + i) % 12);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: i * cw + 1,
                  top: 0,
                  width: cw - 2,
                  height: black ? 66 : 110,
                  backgroundColor: black ? "#fffaf2" : "#e9e2d3",
                  border: "1px solid #ddd4c4",
                  borderRadius: 3,
                }}
              />
            );
          })}
          <div
            style={{
              position: "absolute",
              left: bandLeft,
              top: 0,
              width: bandWidth,
              height: 110,
              backgroundColor: "rgba(197,150,66,0.30)",
              border: "2px solid #c59642",
              borderRadius: 4,
            }}
          />
        </div>

        <div
          style={{
            marginTop: 46,
            fontSize: 24,
            color: "#8a8272",
          }}
        >
          suede sing — test your own range free
        </div>
      </div>
    ),
    size,
  );
}
