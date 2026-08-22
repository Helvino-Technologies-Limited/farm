import { ImageResponse } from "next/og";
import { getAppIconDataUrl } from "@/lib/branding";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function Icon() {
  const icon = getAppIconDataUrl();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {icon && <img src={icon} width={32} height={32} style={{ objectFit: "contain" }} alt="" />}
      </div>
    ),
    { ...size }
  );
}
