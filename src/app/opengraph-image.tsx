import { ImageResponse } from "next/og";

export const alt = "Avepo Smart Farm";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background: "linear-gradient(135deg, #14532d 0%, #166534 50%, #059669 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
            }}
          >
            🌿
          </div>
          <div style={{ fontSize: 32, fontWeight: 600 }}>Avepo Smart Farm</div>
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, maxWidth: 900, display: "flex" }}>
          Order farm products & services online
        </div>
        <div style={{ fontSize: 26, marginTop: 24, color: "#dcfce7", maxWidth: 800, display: "flex" }}>
          Poultry · Seedlings · Crops · Dairy · Drip Irrigation · Training
        </div>
      </div>
    ),
    { ...size }
  );
}
