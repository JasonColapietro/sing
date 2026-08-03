import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Suede Sing — the vocal studio in your browser: live pitch, range test, warmups, ear training";

/**
 * Sitewide fallback share card. Routes with their own opengraph-image
 * (the /singers section) override this; everything else — home, the
 * practice rooms, /pro, the books — previously shared with no image at all.
 */
export default function Image() {
  // A stylized pitch trace settling onto a target note, drawn as bars.
  const trace = [34, 48, 42, 58, 52, 64, 60, 70, 66, 74, 72, 78, 76, 80, 79, 80, 80, 80];

  return new ImageResponse(
    (
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
            {`SUEDE SING`}
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
            }}
          >
            {`The vocal studio`}
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05 }}>
            {`in your browser`}
          </div>
          <div style={{ marginTop: 18, fontSize: 28, color: "#5c564d" }}>
            {`Live pitch · Range test · Warmups · Ear training · Free`}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            height: 130,
          }}
        >
          {trace.map((h, i) => (
            <div
              key={i}
              style={{
                width: 40,
                height: `${h}%`,
                borderRadius: 8,
                backgroundColor:
                  i >= trace.length - 4
                    ? "rgba(197,150,66,0.95)"
                    : "rgba(17,97,93,0.55)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
