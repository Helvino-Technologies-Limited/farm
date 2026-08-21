import { ImageResponse } from "next/og";
import { getFarmLogo } from "@/lib/branding";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Icon() {
  const logo = await getFarmLogo();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: 6,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo.dataUrl} width={28} height={28} style={{ objectFit: "contain" }} alt="" />}
      </div>
    ),
    { ...size }
  );
}
