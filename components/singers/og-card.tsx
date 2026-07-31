import { midiToLabel } from "@/lib/audio/notes";
import type { Singer } from "@/lib/singers";

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

/**
 * Shared OG card body for the hub pages, so a shared "famous tenors" link
 * looks like the singer cards rather than a bare URL. Plain JSX for
 * next/og — no Tailwind, and every parent with 2+ children needs an
 * explicit display, which is the one rule ImageResponse enforces loudly.
 */
export function HubOgCard({
  kicker,
  title,
  stat,
  rows,
  axisLow,
  axisHigh,
}: {
  kicker: string;
  title: string;
  stat: string;
  /** Up to 5 ranges drawn as stacked bars on a shared axis. */
  rows: Singer[];
  axisLow: number;
  axisHigh: number;
}) {
  const span = axisHigh - axisLow;
  const kbW = 1000;
  const pct = (m: number) => ((m - axisLow) / span) * kbW;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "72px 84px",
        backgroundColor: "#f7f0e7",
        backgroundImage:
          "radial-gradient(700px 300px at 50% -10%, rgba(197,150,66,0.16), rgba(197,150,66,0))",
        color: "#20201d",
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          fontSize: 24,
          letterSpacing: 8,
          color: "#9d3f33",
          fontWeight: 700,
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        {kicker}
      </div>
      <div style={{ marginTop: 14, fontSize: 76, fontWeight: 700, display: "flex" }}>
        {title}
      </div>
      <div style={{ marginTop: 8, fontSize: 30, color: "#5c564d", display: "flex" }}>
        {stat}
      </div>

      {/* Octave grid + one bar per singer, same reading as the site's charts */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 36,
          width: kbW,
          gap: 12,
        }}
      >
        {rows.map((s) => (
          <div
            key={s.slug}
            style={{ display: "flex", alignItems: "center", height: 34 }}
          >
            <div
              style={{
                display: "flex",
                width: 250,
                fontSize: 22,
                color: "#20201d",
              }}
            >
              {s.name.length > 20 ? s.name.slice(0, 19) + "…" : s.name}
            </div>
            <div
              style={{
                position: "relative",
                display: "flex",
                width: kbW - 250,
                height: 22,
                backgroundColor: "rgba(201,189,160,0.28)",
                borderRadius: 11,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: (pct(s.lowMidi) * (kbW - 250)) / kbW,
                  width: Math.max(
                    10,
                    ((pct(s.highMidi) - pct(s.lowMidi)) * (kbW - 250)) / kbW,
                  ),
                  height: 22,
                  backgroundColor: "rgba(17,97,93,0.75)",
                  borderRadius: 11,
                  display: "flex",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 34,
          justifyContent: "space-between",
          fontSize: 22,
          color: "#8a8272",
        }}
      >
        <div style={{ display: "flex" }}>
          {midiToLabel(axisLow)} — {midiToLabel(axisHigh)}
        </div>
        <div style={{ display: "flex" }}>
          suede sing · test your own range free
        </div>
      </div>
    </div>
  );
}

export { BLACK_PCS };
