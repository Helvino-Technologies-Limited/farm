import { ImageResponse } from "next/og";
import { getFarmLogo } from "@/lib/branding";

export const alt = "Avepo Smart Farm";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function OpengraphImage() {
  const logo = await getFarmLogo();

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
          background: "linear-gradient(135deg, #003b4c 0%, #0e6472 55%, #003b4c 100%)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          {logo && (
            <div
              style={{
                padding: 12,
                borderRadius: 16,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.dataUrl} width={90} height={70} alt="Avepo" style={{ objectFit: "contain" }} />
            </div>
          )}
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, maxWidth: 900, display: "flex" }}>
          Order farm products &amp; services online
        </div>
        <div style={{ fontSize: 26, marginTop: 24, color: "#fde68a", maxWidth: 800, display: "flex" }}>
          Poultry · Seedlings · Crops · Dairy · Drip Irrigation · Training
        </div>
      </div>
    ),
    { ...size }
  );
}
