import { ImageResponse } from "next/og";
import { getFarmLogo } from "@/lib/branding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await params;
  const size = sizeParam === "512" ? 512 : 192;
  const logo = await getFarmLogo();
  const logoSize = Math.round(size * 0.72);

  const img = new ImageResponse(
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
        {logo && <img src={logo.dataUrl} width={logoSize} height={logoSize} style={{ objectFit: "contain" }} alt="" />}
      </div>
    ),
    { width: size, height: size }
  );
  img.headers.set("Cache-Control", "public, max-age=300, must-revalidate");
  return img;
}
