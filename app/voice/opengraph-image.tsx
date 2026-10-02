import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Suede Voice — vocal range and singing practice for iPhone and Android";

export default function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "72px", background: "#0f0c1f", color: "#f6f4ff", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, color: "#c9b8ff" }}>SUEDE AI · OFFICIAL APP</div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, letterSpacing: -4 }}>Suede Voice</div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 38 }}>Find your range. Know what to practice.</div>
      </div>
      <div style={{ display: "flex", fontSize: 28, color: "#c9b8ff" }}>Vocal Range Test · iPhone & Android</div>
    </div>,
    size,
  );
}
