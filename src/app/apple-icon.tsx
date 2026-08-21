import { ImageResponse } from "next/og";
import { getFarmLogo } from "@/lib/branding";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AppleIcon() {
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
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logo && <img src={logo.dataUrl} width={140} height={140} style={{ objectFit: "contain" }} alt="" />}
      </div>
    ),
    { ...size }
  );
}
