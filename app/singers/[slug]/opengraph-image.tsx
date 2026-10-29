import { ImageResponse } from "next/og";
import { singerCardText, singerCardVersion } from "@/lib/og-cards";
import { singerBySlug } from "@/lib/singers";
import { OG_MONO, OG_SERIF, ogFontOptions } from "@/lib/og-font";

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
  const fonts = await ogFontOptions(
    `REPORTED VOCAL RANGE ${text.name} ${text.notes} ${text.span} ${text.status} suede sing · test your own range free`,
  );
  // Octave Cs with at least a few keys either side, so the span reads as a
  // span on the keyboard rather than the whole of it.
  const stripLow = Math.floor((s.lowMidi - 3) / 12) * 12;
  const stripHigh = Math.ceil((s.highMidi + 3) / 12) * 12;
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
          fontFamily: OG_MONO,
        }}
      >
        <div
          style={{
            marginTop: 48,
            fontSize: 26,
            letterSpacing: 10,
            color: "#c59642",
            fontWeight: 600,
          }}
        >
          REPORTED VOCAL RANGE
        </div>
        <div style={{ marginTop: 14, fontFamily: OG_SERIF, fontSize: 76, lineHeight: 1.05 }}>
          {text.name}
        </div>
        <div style={{ marginTop: 6, fontSize: 84, fontWeight: 600, color: "#11615d" }}>
          {text.notes}
        </div>
        <div style={{ marginTop: 12, fontSize: 28, color: "#5c564d" }}>
          {text.span}
        </div>
        <div style={{ marginTop: 12, fontSize: 22, color: "#5c564d" }}>
          {text.status}
        </div>

        {/* A neutral keyboard (light keys, dark black keys, as the site's
            piano draws them) under the reported span in teal. */}
        <div
          style={{
            display: "flex",
            position: "relative",
            marginTop: 40,
            width: kbW,
            height: 128,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: kbW,
              height: 110,
              display: "flex",
              backgroundColor: "#faf6ec",
              border: "1px solid #c9bda0",
              borderRadius: 4,
            }}
          />
          {Array.from({ length: n }, (_, i) => {
            const black = BLACK_PCS.has((stripLow + i) % 12);
            return black ? (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: i * cw + 1,
                  top: 0,
                  width: cw - 2,
                  height: 68,
                  display: "flex",
                  backgroundColor: "#0b0a07",
                  borderRadius: "0 0 3px 3px",
                }}
              />
            ) : (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: (i + 1) * cw,
                  top: 0,
                  width: 1,
                  height: 110,
                  display: "flex",
                  backgroundColor: "#d6cbb7",
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
              display: "flex",
              backgroundColor: "rgba(17,97,93,0.22)",
              border: "2px solid #11615d",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: bandLeft,
              top: 116,
              width: bandWidth,
              height: 12,
              display: "flex",
              backgroundColor: "#11615d",
              borderRadius: 6,
            }}
          />
        </div>

        <div
          style={{
            marginTop: 36,
            fontSize: 24,
            color: "#8a8272",
          }}
        >
          suede sing · test your own range free
        </div>
      </div>
    ),
    { ...size, ...fonts },
  );
}
