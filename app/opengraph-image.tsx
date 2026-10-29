import { ImageResponse } from "next/og";
import { OG_IMAGE_ALT, OG_IMAGE_SIZE, OG_IMAGE_TAGLINE } from "@/lib/og";
import { OG_MONO, OG_SERIF, ogFontOptions } from "@/lib/og-font";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = OG_IMAGE_ALT;

/**
 * The brand's settling trace (marketing/social/assets/fb-cover-source.html):
 * the pitch wanders, dips flat under the target lane, then locks onto it and
 * holds. Drawn in that file's 1640-wide coordinates, cropped to the lanes.
 */
const TRACE =
  "M -20 260 C 90 240, 150 320, 240 310 C 320 302, 340 380, 400 440 C 450 490, 470 560, 520 552 C 560 546, 570 514, 610 508 L 1600 508";
const TRACE_BOX = { x: 0, y: 220, w: 1640, h: 360 };
const TRACE_W = 1056;
const TRACE_H = Math.round((TRACE_W * TRACE_BOX.h) / TRACE_BOX.w);

/**
 * Sitewide fallback share card. Routes with their own opengraph-image
 * override it; a route that declares its own `openGraph` must name this card
 * explicitly (DEFAULT_OG_IMAGE in lib/og.ts, and the test there).
 */
export default async function Image() {
  const fonts = await ogFontOptions(
    `SUEDE SING Online singing practice with live pitch feedback ${OG_IMAGE_TAGLINE}`,
  );

  return new ImageResponse(
    (
      /* Changing colours or layout here without changing the words? Bump
         OG_CARD_RENDER_REVISION in lib/og.ts, or scrapers keep the old
         picture at the old URL. */
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f7f0e7",
          backgroundImage:
            "radial-gradient(760px 320px at 50% -10%, rgba(197,150,66,0.16), rgba(197,150,66,0))",
          color: "#20201d",
          fontFamily: OG_MONO,
          padding: "56px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 8,
              color: "#c59642",
              fontWeight: 600,
            }}
          >
            {`SUEDE SING`}
          </div>
          <div
            style={{
              marginTop: 14,
              fontFamily: OG_SERIF,
              fontSize: 80,
              lineHeight: 1.02,
              letterSpacing: -1,
            }}
          >
            {`Online singing practice`}
          </div>
          <div style={{ fontFamily: OG_SERIF, fontSize: 80, lineHeight: 1.02, letterSpacing: -1 }}>
            {`with live pitch feedback`}
          </div>
          <div style={{ marginTop: 18, fontSize: 24, color: "#5c564d" }}>
            {OG_IMAGE_TAGLINE}
          </div>
        </div>

        <svg
          width={TRACE_W}
          height={TRACE_H}
          viewBox={`${TRACE_BOX.x} ${TRACE_BOX.y} ${TRACE_BOX.w} ${TRACE_BOX.h}`}
          fill="none"
        >
          {[266, 376].map((y) => (
            <line key={y} x1="0" y1={y} x2="1640" y2={y} stroke="#d6cbb7" strokeWidth="2" />
          ))}
          {/* The target lane the trace settles into. */}
          <rect x="0" y="482" width="1640" height="52" fill="rgba(63,143,110,0.16)" />
          <line x1="0" y1="508" x2="1640" y2="508" stroke="#3f8f6e" strokeWidth="2" strokeDasharray="8 12" />
          <path d={TRACE} stroke="#11615d" strokeWidth="8" strokeLinecap="round" />
          <circle cx="1600" cy="508" r="14" fill="#11615d" />
        </svg>
      </div>
    ),
    { ...size, ...fonts },
  );
}
