import { ImageResponse } from "next/og";
import { getAppIconDataUrl } from "@/lib/branding";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await params;
  const size = sizeParam === "512" ? 512 : 192;
  const maskable = new URL(req.url).searchParams.get("purpose") === "maskable";
  const icon = getAppIconDataUrl();

  // Maskable icons must keep all content inside a centered ~80% "safe zone" — Android
  // crops the rest into a circle/squircle, so shrink the glyph and let the black backdrop
  // (matching the tile's own face) fill the rest instead of getting clipped.
  const glyphSize = maskable ? Math.round(size * 0.68) : size;

  const img = new ImageResponse(
    (
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
        {icon && <img src={icon} width={glyphSize} height={glyphSize} style={{ objectFit: "contain" }} alt="" />}
      </div>
    ),
    { width: size, height: size }
  );
  img.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return img;
}
