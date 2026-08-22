import { ImageResponse } from "next/og";
import { getAppIconDataUrl } from "@/lib/branding";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default function AppleIcon() {
  const icon = getAppIconDataUrl();
  return new ImageResponse(
    (
      // iOS applies its own rounded-corner mask and doesn't composite transparency well,
      // so give the icon a solid backdrop matching the tile's own black face.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {icon && <img src={icon} width={180} height={180} style={{ objectFit: "contain" }} alt="" />}
      </div>
    ),
    { ...size }
  );
}
