import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, ogCardVersion } from "@/lib/og";
import { proHeadline } from "@/lib/pro-shared";
import { OG_MONO, OG_SERIF, ogFontOptions } from "@/lib/og-font";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

/**
 * Bump when the card's layout or palette changes without changing a word:
 * its URL is read off the words below, and share scrapers cache the picture
 * by URL (the same rule as OG_CARD_RENDER_REVISION in lib/og.ts).
 */
const RENDER_REVISION = "2026-10-29-serif-report";

/** Every line the card draws. The price reads PRICING, never a literal. */
const KICKER = "SUEDE SING · PRO";
const TITLE = "Suede Pro";
const PRICE_LINE = proHeadline();
const FEATURES = "Full coach plan, per-note accuracy, take analysis, two books";
const FOOTER = "The online vocal coach on top of the free studio";
const REPORT_LABEL = "EXAMPLE COACH REPORT";
const BARS_LABEL = "ACCURACY BY NOTE";
const NEXT_STEP = "Tomorrow: Octave siren, 6 min";

/**
 * The coach-report miniature, the /pro page's ProVisual (components/pro/
 * pro-visual.tsx) in next/og divs: per-note accuracy with the weak E4
 * flagged. Sample data, and labelled as an example.
 */
const NOTE_BARS: ReadonlyArray<{ label: string; h: number; weak?: boolean }> = [
  { label: "C4", h: 78 },
  { label: "D4", h: 84 },
  { label: "E4", h: 44, weak: true },
  { label: "F4", h: 72 },
  { label: "G4", h: 88 },
  { label: "A4", h: 82 },
  { label: "B4", h: 64 },
];

export const alt = `Suede Pro: the online vocal coach on top of the free Suede Sing studio. ${PRICE_LINE}.`;

/**
 * One card at a URL versioned by what it draws
 * (/pro/opengraph-image/<version>), as the singer and hub cards are
 * (lib/og-cards.ts): Next's own ?hash follows this file's source, so a new
 * lifetime price in lib/pro-shared.ts would otherwise ship at the URL share
 * scrapers had cached the old price under.
 *
 * /pro used to share with the sitewide card and its homepage alt text; this
 * is the first card of its own, so there is no legacy URL to redirect.
 */
export function generateImageMetadata() {
  const id = ogCardVersion(
    JSON.stringify([
      RENDER_REVISION,
      alt,
      KICKER,
      TITLE,
      PRICE_LINE,
      FEATURES,
      FOOTER,
      REPORT_LABEL,
      BARS_LABEL,
      NEXT_STEP,
      NOTE_BARS,
    ]),
  );
  return [{ id, alt, size, contentType }];
}

export default async function Image() {
  const fonts = await ogFontOptions(
    [KICKER, TITLE, PRICE_LINE, FEATURES, FOOTER, REPORT_LABEL, BARS_LABEL, NEXT_STEP, "SAMPLE PRO"]
      .concat(NOTE_BARS.map((b) => b.label))
      .join(" "),
  );
  const barMax = 150;

  return new ImageResponse(
    (
      /* Same paper palette as app/opengraph-image.tsx. Plain JSX for next/og:
         every parent with 2+ children needs an explicit display. */
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
          padding: "60px 72px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
            <div
              style={{
                fontSize: 24,
                letterSpacing: 8,
                color: "#c59642",
                fontWeight: 600,
              }}
            >
              {KICKER}
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: OG_SERIF,
                fontSize: 108,
                lineHeight: 1,
                letterSpacing: -2,
              }}
            >
              {TITLE}
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 30,
                fontWeight: 600,
                color: "#11615d",
              }}
            >
              {PRICE_LINE}
            </div>
            <div style={{ marginTop: 18, fontSize: 26, lineHeight: 1.35, color: "#5c564d" }}>
              {FEATURES}
            </div>
          </div>

          {/* The coach-report miniature. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 430,
              backgroundColor: "#fffaf2",
              border: "2px solid rgba(139,92,246,0.45)",
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 20px",
                backgroundColor: "#efe6d5",
                borderBottom: "1px solid #d6cbb7",
                fontSize: 15,
                letterSpacing: 2,
                color: "#5c564d",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    display: "flex",
                    padding: "2px 8px",
                    borderRadius: 4,
                    backgroundColor: "#6d28d9",
                    color: "#ffffff",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  PRO
                </div>
                <div style={{ display: "flex" }}>{REPORT_LABEL}</div>
              </div>
              <div style={{ display: "flex", color: "#6b6455" }}>SAMPLE</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", padding: "18px 22px 20px" }}>
              <div style={{ display: "flex", fontSize: 14, letterSpacing: 2, color: "#6b6455" }}>
                {BARS_LABEL}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginTop: 14,
                  height: barMax,
                  borderBottom: "2px solid #d6cbb7",
                }}
              >
                {NOTE_BARS.map((b) => (
                  <div
                    key={b.label}
                    style={{
                      display: "flex",
                      width: 38,
                      height: Math.round((b.h / 96) * barMax),
                      borderRadius: "6px 6px 0 0",
                      backgroundColor: b.weak ? "#9d3f33" : "#c59642",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {NOTE_BARS.map((b) => (
                  <div
                    key={b.label}
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      width: 38,
                      fontSize: 16,
                      fontWeight: b.weak ? 600 : 400,
                      color: b.weak ? "#9d3f33" : "#6b6455",
                    }}
                  >
                    {b.label}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid #d6cbb7",
                  fontSize: 18,
                  color: "#20201d",
                }}
              >
                {NEXT_STEP}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#82631f" }}>
          {FOOTER}
        </div>
      </div>
    ),
    { ...size, ...fonts },
  );
}
