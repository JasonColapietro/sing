import { ImageResponse } from "next/og";
import { SINGERS, computeRecords, spanOctaves } from "@/lib/singers";
import { midiToLabel } from "@/lib/audio/notes";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Famous singers' vocal ranges on one keyboard";

/** A handful of real rows, so the card shows the actual chart, not a promise. */
const FEATURED = [
  "mariah-carey",
  "freddie-mercury",
  "johnny-cash",
  "adele",
  "avi-kaplan",
];

export default function Image() {
  const records = computeRecords();
  const axisLow = 24; // C1
  const axisHigh = 108; // C8
  const span = axisHigh - axisLow;
  const pct = (m: number) => ((m - axisLow) / span) * 100;

  const rows = FEATURED.flatMap((slug) => {
    const s = SINGERS.find((x) => x.slug === slug);
    return s ? [s] : [];
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0f0c1f",
          backgroundImage:
            "radial-gradient(760px 320px at 50% -10%, rgba(197,150,66,0.14), rgba(197,150,66,0))",
          color: "#f6f4ff",
          fontFamily: "monospace",
          padding: "64px 72px",
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 8,
            color: "#ffc24a",
            fontWeight: 600,
          }}
        >
          {`SUEDE SING · REFERENCE`}
        </div>
        <div style={{ marginTop: 14, fontSize: 68, fontWeight: 700 }}>
          {`Famous vocal ranges`}
        </div>
        <div style={{ marginTop: 8, fontSize: 28, color: "#c3bde3" }}>
          {`Famous singers on one keyboard · ${midiToLabel(records.lowest.lowMidi)} to ${midiToLabel(records.highest.highMidi)}`}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 40,
          }}
        >
          {rows.map((s) => (
            <div key={s.slug} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 250,
                  fontSize: 22,
                  color: "#f6f4ff",
                  overflow: "hidden",
                }}
              >
                {s.name}
              </div>
              <div
                style={{
                  display: "flex",
                  position: "relative",
                  width: 640,
                  height: 26,
                  backgroundColor: "#241f42",
                  borderRadius: 13,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: `${pct(s.lowMidi)}%`,
                    width: `${pct(s.highMidi + 1) - pct(s.lowMidi)}%`,
                    top: 0,
                    height: 26,
                    backgroundColor: "rgba(17,97,93,0.75)",
                    borderRadius: 13,
                  }}
                />
              </div>
              <div
                style={{
                  width: 130,
                  fontSize: 19,
                  color: "#c3bde3",
                  textAlign: "right",
                }}
              >
                {`${spanOctaves(s.highMidi - s.lowMidi)} oct`}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 34, fontSize: 22, color: "#a39dc9" }}>
          {`Reported catalog figures · test your own range free`}
        </div>
      </div>
    ),
    size,
  );
}
