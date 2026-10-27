import { ImageResponse } from "next/og";
import { OG_IMAGE_SIZE, ogCardVersion } from "@/lib/og";
import { proHeadline } from "@/lib/pro-shared";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

/**
 * Bump when the card's layout or palette changes without changing a word:
 * its URL is read off the words below, and share scrapers cache the picture
 * by URL (the same rule as OG_CARD_RENDER_REVISION in lib/og.ts).
 */
const RENDER_REVISION = "2026-10-26";

/** Every line the card draws. The price reads PRICING, never a literal. */
const KICKER = "SUEDE SING · PRO";
const TITLE = "Suede Pro";
const PRICE_LINE = proHeadline();
const FEATURES = "Full coach plan, per-note accuracy, take analysis, two books";
const FOOTER = "The online vocal coach on top of the free studio";

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
    JSON.stringify([RENDER_REVISION, alt, KICKER, TITLE, PRICE_LINE, FEATURES, FOOTER]),
  );
  return [{ id, alt, size, contentType }];
}

export default function Image() {
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
          fontFamily: "monospace",
          padding: "64px 72px",
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
            {KICKER}
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 96,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -4,
            }}
          >
            {TITLE}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 44,
              fontWeight: 700,
              color: "#11615d",
            }}
          >
            {PRICE_LINE}
          </div>
          <div style={{ marginTop: 18, fontSize: 28, color: "#5c564d" }}>
            {FEATURES}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#c59642" }}>
          {FOOTER}
        </div>
      </div>
    ),
    size,
  );
}
